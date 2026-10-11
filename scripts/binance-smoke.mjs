// Sign-and-call smoke test for the Binance Web3 API (StockGap, Stage 1).
//
// Mirrors base44/shared/binanceAuth.ts exactly (timestamp + METHOD + /build-prefixed
// requestPath + body, Base64 HMAC-SHA256) so a green run here means the proxy
// function's contract holds too.
//
// Run: node --env-file=.env scripts/binance-smoke.mjs
//
// Raw payloads are dumped to scripts/.smoke/ for shape inspection.

import { createHmac } from "node:crypto";
import { request as httpsRequest } from "node:https";
import { Resolver } from "node:dns/promises";
import { lookup as systemLookup } from "node:dns";
import { mkdir, writeFile } from "node:fs/promises";

const HOST = "web3.binance.com";
const KEY = process.env.BINANCE_WEB3_API_KEY;
const SECRET = process.env.BINANCE_WEB3_SECRET_KEY;
const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
const PROBE_WALLET = "0x000000000000000000000000000000000000dEaD";
const DUMP_DIR = new URL("./.smoke/", import.meta.url);

if (!KEY || !SECRET) {
  console.error("Missing BINANCE_WEB3_API_KEY / BINANCE_WEB3_SECRET_KEY. Run with --env-file=.env");
  process.exit(1);
}

// This machine's default resolver refuses binance.com domains; public DNS works.
const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

function publicLookup(hostname, options, callback) {
  resolver.resolve4(hostname)
    .then((addrs) => {
      if (!addrs.length) throw new Error(`no A records for ${hostname}`);
      // Node's net layer calls lookup with all:true and expects [{address, family}].
      if (options?.all) callback(null, addrs.map((address) => ({ address, family: 4 })));
      else callback(null, addrs[0], 4);
    })
    .catch(() => systemLookup(hostname, options, callback));
}

function buildQueryString(query = {}) {
  return Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

async function callApi(method, path, { query, body } = {}) {
  const qs = buildQueryString(query);
  const suffix = qs ? `?${qs}` : "";
  const timestamp = new Date().toISOString();
  const rawBody = body ? JSON.stringify(body) : "";
  // The wire path and the signed requestPath must be identical and both carry /build.
  const wirePath = `/build${path}${suffix}`;
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}${method}${wirePath}${rawBody}`)
    .digest("base64");

  const started = Date.now();
  const result = await new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        host: HOST,
        path: wirePath,
        method,
        lookup: publicLookup,
        headers: {
          "X-OC-APIKEY": KEY,
          "X-OC-TIMESTAMP": timestamp,
          "X-OC-SIGN": signature,
          "Content-Type": "application/json",
          ...(rawBody ? { "Content-Length": Buffer.byteLength(rawBody) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode, text: data }));
      }
    );
    req.setTimeout(20000, () => req.destroy(new Error("timeout after 20s")));
    req.on("error", reject);
    if (rawBody) req.write(rawBody);
    req.end();
  });

  const latencyMs = Date.now() - started;
  let payload;
  try {
    payload = JSON.parse(result.text);
  } catch {
    payload = { code: -1, msg: result.text.slice(0, 300) };
  }
  return { status: result.status, latencyMs, payload };
}

let failures = 0;

async function probe(name, method, path, opts) {
  try {
    const res = await callApi(method, path, opts);
    const { code, msg } = res.payload;
    const bad = res.status >= 400 || (code !== 0 && code !== undefined);
    if (bad) failures += 1;
    const mark = bad ? "FAIL" : "ok  ";
    console.log(
      `[${mark}] ${name.padEnd(28)} HTTP ${res.status}  code=${code ?? "-"}  ${res.latencyMs}ms  ${msg ? `msg="${msg}"` : ""}`
    );
    await mkdir(DUMP_DIR, { recursive: true });
    await writeFile(new URL(`${name.replace(/[^a-z0-9]+/gi, "-")}.json`, DUMP_DIR), JSON.stringify(res, null, 2));
    return res.payload;
  } catch (error) {
    failures += 1;
    console.log(`[FAIL] ${name.padEnd(28)} ${error.message}`);
    return null;
  }
}

console.log(`Binance Web3 API smoke test — ${new Date().toISOString()}`);
console.log(`key ${KEY.slice(0, 6)}…${KEY.slice(-4)} (len ${KEY.length})\n`);

const platforms = await probe("platforms", "GET", "/api/v1/dex/market/rwa/platforms");
console.log("   platforms:", JSON.stringify(platforms?.data)?.slice(0, 400), "\n");

const tokens = await probe("tokens-bsc", "GET", "/api/v1/dex/market/rwa/tokens", {
  query: { binanceChainId: "56", page: 1, pageSize: 100 },
});
const tokenList = Array.isArray(tokens?.data) ? tokens.data : tokens?.data?.list || [];
console.log(`   token rows: ${tokenList.length}`);
if (tokenList[0]) console.log("   first row keys:", Object.keys(tokenList[0]).join(", "), "\n");

const search = await probe("search-nvda", "GET", "/api/v1/dex/market/rwa/search", {
  query: { keyword: "NVDA" },
});
const searchRows = Array.isArray(search?.data) ? search.data : [];
console.log(
  `   search rows: ${searchRows.length} tickers; NVDA assets:`,
  JSON.stringify(searchRows[0]?.assets)?.slice(0, 600),
  "\n"
);

// search rows nest representations in assets[]; we want BSC (56) ones.
const nvdaReps = searchRows
  .filter((row) => String(row.ticker || "").toUpperCase() === "NVDA")
  .flatMap((row) =>
    (row.assets || [])
      .filter((asset) => String(asset.binanceChainId) === "56" && asset.tokenContractAddress)
      .map((asset) => ({ ...asset, ticker: row.ticker, company: row.companyName }))
  );
const addresses = [...new Set(nvdaReps.map((rep) => rep.tokenContractAddress))].slice(0, 8);
console.log(`   NVDA BSC representations: ${addresses.length}`);
nvdaReps.slice(0, 8).forEach((rep) => console.log(`      ${rep.platformId.padEnd(8)} ${rep.tokenSymbol.padEnd(10)} ${rep.tokenContractAddress}`));
console.log();

if (addresses.length) {
  const price = await probe("price-nvda", "GET", "/api/v1/dex/market/rwa/price", {
    query: { binanceChainId: "56", tokenContractAddresses: addresses.join(",") },
  });
  console.log("   price sample:", JSON.stringify(price?.data)?.slice(0, 600), "\n");

  for (const address of addresses) {
    const rep = nvdaReps.find((r) => r.tokenContractAddress === address);
    for (const usd of [1, 10, 50]) {
      const quote = await probe(`quote ${rep?.platformId || "?"} $${usd}`, "GET", "/api/v1/dex/aggregator/quote", {
        query: {
          binanceChainId: "56",
          fromTokenAddress: USDT_BSC,
          toTokenAddress: address,
          amount: String(usd * 1e18),
          userWalletAddress: PROBE_WALLET,
          slippagePercent: 0.5,
        },
      });
      if (quote?.code === 0 && quote?.data) {
        const routes = Array.isArray(quote.data) ? quote.data : quote.data?.routes || [quote.data];
        const top = routes.reduce(
          (best, r) => (Number(r.toTokenAmount || 0) > Number(best?.toTokenAmount || 0) ? r : best),
          null
        );
        console.log(
          `      -> routes=${routes.length} toTokenAmount=${top?.toTokenAmount} vendor=${top?.vendorName || top?.vendor || "-"} keys=${top ? Object.keys(top).join(",") : "-"}`
        );
      }
    }
  }
}

await probe("gas-price", "GET", "/api/v1/dex/pre-transaction/gas-price", {
  query: { binanceChainId: "56" },
});

console.log(`\nDone. failures=${failures}. Raw payloads in scripts/.smoke/`);
process.exit(failures ? 1 : 0);
