import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const APP = process.env.APP_URL || "http://localhost:5174/";
const DEBUG_PORT = 9224;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${path.join(tmpdir(), `stockgap-cdp-debug-${Date.now()}`)}`,
  "--no-first-run", "--disable-gpu", "--window-size=1440,2800", "about:blank",
], { stdio: "ignore" });

async function page() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
      const t = list.find((x) => x.type === "page");
      if (t) return t;
    } catch {}
    await sleep(250);
  }
  throw new Error("no devtools");
}

const target = await page();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown") errors.push("EXC: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("CON: " + m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "));
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push("LOG: " + m.params.entry.text + " " + (m.params.entry.url || ""));
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id;
  const on = (ev) => { const mm = JSON.parse(ev.data); if (mm.id === mid) { ws.removeEventListener("message", on); mm.error ? rej(new Error(mm.error.message)) : res(mm.result); } };
  ws.addEventListener("message", on);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
const evalJS = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true });
  return r.exceptionDetails ? `EVAL-FAIL: ${r.exceptionDetails.exception?.description}` : r.result.value;
};

await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Page.navigate", { url: APP });
await sleep(12000);

console.log("PATH:", await evalJS("location.href"));
console.log("TITLE:", await evalJS("document.title"));
console.log("BUTTONS:", await evalJS("JSON.stringify([...document.querySelectorAll('button')].map(b => ({ t: b.textContent.trim().slice(0,40), d: b.disabled })))"));
console.log("BODY-HEAD:", await evalJS("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 600)"));
console.log("ROWS:", await evalJS("document.querySelectorAll('table tbody tr').length"));
console.log("ERRORS:", errors.length ? "" : "none");
errors.slice(0, 10).forEach((x) => console.log(" ", x.slice(0, 300)));
chrome.kill();
process.exit(0);
