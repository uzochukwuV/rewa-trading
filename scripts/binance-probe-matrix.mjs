// Gateway semantics probe: pins down how web3.binance.com/build validates
// signatures and what its 301 redirect to api.binance.com means.
//
// Run: node --env-file=.env scripts/binance-probe-matrix.mjs

import { createHmac } from "node:crypto";
import { request as httpsRequest } from "node:https";
import { Resolver } from "node:dns/promises";
import { lookup as systemLookup } from "node:dns";

const KEY = process.env.BINANCE_WEB3_API_KEY;
const SECRET = process.env.BINANCE_WEB3_SECRET_KEY;
const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

function publicLookup(hostname, options, callback) {
  resolver
    .resolve4(hostname)
    .then((addrs) => {
      if (!addrs.length) throw new Error("no A records");
      if (options?.all) callback(null, addrs.map((address) => ({ address, family: 4 })));
      else callback(null, addrs[0], 4);
    })
    .catch(() => systemLookup(hostname, options, callback));
}

async function probe(label, { host, path, signedPrefix, badSig = false, extraHeaders = {} }) {
  return new Promise(async (resolve) => {
    const timestamp = new Date().toISOString();
    const headers = { "Content-Type": "application/json", ...extraHeaders };
    if (signedPrefix !== undefined) {
      const signature = createHmac("sha256", SECRET)
        .update(timestamp + "GET" + signedPrefix + path)
        .digest("base64");
      headers["X-OC-APIKEY"] = KEY;
      headers["X-OC-TIMESTAMP"] = badSig ? new Date(Date.now() - 5 * 60 * 1000).toISOString() : timestamp;
      headers["X-OC-SIGN"] = badSig
        ? "AAAA" + signature.slice(4)
        : signature;
    }
    const req = httpsRequest(
      { host, path, method: "GET", lookup: publicLookup, headers },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => {
          const loc = res.headers.location ? ` -> ${res.headers.location}` : "";
          const tail = data.slice(0, 160).replace(/\s+/g, " ");
          console.log(`[${label}]  HTTP ${res.statusCode}${loc}  ${tail}`);
          resolve();
        });
      }
    );
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
    req.on("error", (e) => {
      console.log(`[${label}]  ERR ${e.message}`);
      resolve();
    });
    req.end();
  });
}

const P = "/api/v1/dex/pre-transaction/gas-price?binanceChainId=56";
const TOKENS = "/api/v1/dex/market/rwa/tokens?binanceChainId=56&page=1&pageSize=5";

console.log("=== signature validation semantics (web3 host) ===");
await probe("unsigned /build      ", { host: "web3.binance.com", path: "/build" + P });
await probe("bad signature /build ", { host: "web3.binance.com", path: "/build" + P, signedPrefix: "/build", badSig: true });
await probe("valid sig /build     ", { host: "web3.binance.com", path: "/build" + P, signedPrefix: "/build" });
await probe("unsigned no-build    ", { host: "web3.binance.com", path: P });

console.log("\n=== does every /build endpoint redirect? ===");
await probe("tokens valid sig     ", { host: "web3.binance.com", path: "/build" + TOKENS, signedPrefix: "/build" });
await probe("platforms valid sig  ", { host: "web3.binance.com", path: "/build/api/v1/dex/market/rwa/platforms", signedPrefix: "/build" });

console.log("\n=== api.binance.com behavior ===");
await probe("/build unsigned      ", { host: "api.binance.com", path: "/build" + P });
await probe("/build valid sig     ", { host: "api.binance.com", path: "/build" + P, signedPrefix: "/build" });
await probe("/api valid sig       ", { host: "api.binance.com", path: P, signedPrefix: "" });
