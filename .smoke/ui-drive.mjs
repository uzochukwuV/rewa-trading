// Headless UI driver for the golden path: Home -> Build preview -> /preview
// (per-leg simulation badges) -> /portfolio. Zero dependencies: Chrome CDP
// over Node's native WebSocket. Run with the dev server and API server up.

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const APP = process.env.APP_URL || "http://localhost:5174/";
const DEBUG_PORT = 9223;
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${path.join(tmpdir(), `stockgap-cdp-${Date.now()}`)}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--window-size=1440,2800",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function devtoolsTarget() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {
      /* chrome not up yet */
    }
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint never came up");
}

const target = await devtoolsTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 0;
const pending = new Map();
const waiters = new Set();
const consoleErrors = [];

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const entry = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(`exception: ${message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text}`);
  } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    consoleErrors.push(`console.error: ${message.params.args.map((a) => a.value ?? a.description ?? a.type).join(" ")}`);
  } else if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    consoleErrors.push(`page log: ${message.params.entry.text} ${message.params.entry.url || ""}`);
  }
  for (const waiter of [...waiters]) {
    if (waiter.method === message.method) {
      waiters.delete(waiter);
      waiter.resolve(message.params);
    }
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = (nextId += 1);
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function waitFor(method, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const waiter = { method, resolve };
    waiters.add(waiter);
    setTimeout(() => {
      if (waiters.delete(waiter)) reject(new Error(`timeout waiting for ${method}`));
    }, timeoutMs);
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(`eval failed: ${result.exceptionDetails.exception?.description || result.exceptionDetails.text}`);
  }
  return result.result.value;
}

async function navigate(url) {
  const loaded = waitFor("Page.loadEventFired", 45000);
  await send("Page.navigate", { url });
  await loaded;
  await sleep(400);
}

async function screenshot(name) {
  const result = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(result.data, "base64"));
  console.log(`[shot] ${name}.png`);
}

async function pollUntil(label, expression, { attempts = 90, delayMs = 1000 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const value = await evaluate(expression);
    if (value) return value;
    await sleep(delayMs);
  }
  throw new Error(`timeout: ${label}`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");

try {
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 2800, deviceScaleFactor: 1, mobile: false });
} catch {
  /* optional */
}

try {
console.log(`[nav] ${APP}`);
await navigate(APP);

// 1. Home: snapshot must load (build button enabled) and the universe table must be live-sized.
await pollUntil("home snapshot loaded", `(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Build execution preview");
  return !!b && !b.disabled;
})()`, { attempts: 60, delayMs: 1000 });

const homeInfo = await evaluate(`(() => {
  const rows = document.querySelectorAll("table tbody tr").length;
  const banner = document.querySelector("span.text-\\[13px\\].font-medium")?.textContent || "";
  const modeBadge = [...document.querySelectorAll("span")].map((s) => s.textContent.trim()).find((t) => t === "LIVE DATA" || t === "DEMO DATA" || t === "LIVE" || t === "DEMO") || "";
  return JSON.stringify({ rows, banner, modeBadge });
})()`);
console.log(`[home] ${homeInfo}`);
await screenshot("ui-home");

// 2. Click build -> quotes -> simulate -> /preview
await evaluate(`[...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Build execution preview").click()`);
console.log("[click] Build execution preview (AI Infrastructure, $50)");

const phaseSeen = new Set();
await pollUntil("navigated to /preview", `location.pathname === "/preview"`, { attempts: 120, delayMs: 1000 });
console.log("[nav] /preview reached");

// 3. Preview: wait for leg rows with simulation badges, then read them.
const badges = await pollUntil("simulation badges rendered", `(() => {
  const wanted = new Set(["Passed", "Pending approval", "Rejected", "Not simulated"]);
  const badges = [...document.querySelectorAll("span")].filter((s) => wanted.has(s.textContent.trim()));
  const rows = document.querySelectorAll("table tbody tr").length;
  return badges.length && rows ? JSON.stringify({ rows, badges: badges.map((s) => s.textContent.trim()) }) : "";
})()`, { attempts: 90, delayMs: 1500 });
console.log(`[preview] ${badges}`);
console.log(`[phases] ${JSON.stringify([...phaseSeen])}`);

const previewStats = await evaluate(`(() => {
  const stat = [...document.querySelectorAll("div")].filter((d) => d.className.includes && String(d.className).includes("StatBlock")).length;
  const summary = [...document.querySelectorAll("p")].map((p) => p.textContent).find((t) => t.startsWith("The engine")) || "";
  const unallocated = [...document.querySelectorAll("td")].map((td) => td.textContent).filter((t) => t.includes("below the") || t.includes("No executable route"));
  return JSON.stringify({ stat, unallocated });
})()`);
console.log(`[preview stats] ${previewStats}`);
await screenshot("ui-preview");

// 4. Portfolio
await navigate(`${APP}portfolio`);
await pollUntil("portfolio rendered", `document.body.innerText.includes("Positions")`, { attempts: 30, delayMs: 1000 });
const portfolioText = await evaluate(`(() => {
  const chips = [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((t) => t.includes("$"));
  const empty = document.body.innerText.includes("No runs recorded yet");
  const statLabels = [...document.querySelectorAll("dt")].map((d) => d.textContent);
  return JSON.stringify({ chips, empty, statLabels });
})()`);
console.log(`[portfolio] ${portfolioText}`);
await screenshot("ui-portfolio");

console.log(`[console errors] ${consoleErrors.length ? "" : "none"}`);
consoleErrors.forEach((e) => console.log(`  ${e}`));
} finally {
  try {
    chrome.kill("SIGKILL");
  } catch {
    /* already gone */
  }
  ws.close();
}
