// Trade-flow probe: quote → swap build → approve build → simulate.
// Uses a probe wallet so nothing is signed or broadcast. Reveals the exact
// payload shapes executionFlow.js must consume.
//
// Run: node --env-file=.env scripts/binance-trade-flow.mjs [toTokenAddress]

import { writeFile, mkdir } from "node:fs/promises";
import { callApi, USDT_BSC, PROBE_WALLET } from "./lib/binance.mjs";

const KEY = process.env.BINANCE_WEB3_API_KEY;
const SECRET = process.env.BINANCE_WEB3_SECRET_KEY;
const DUMP_DIR = new URL("./.smoke/", import.meta.url);
const AMOUNT_USD = 10;

// Default: bstock NVDAB on BSC (from the last token scan).
const TO_TOKEN = process.argv[2] || "0x02fca66c1d1afb4e2a7884261eb00f63598a7436";

async function step(name, method, path, opts) {
  const res = await callApi(KEY, SECRET, method, path, opts);
  const { code, msg, data } = res.payload;
  console.log(`[${code === 0 ? "ok  " : "FAIL"}] ${name.padEnd(22)} HTTP ${res.status} code=${code ?? "-"} ${res.latencyMs}ms ${msg ? `"${msg}"` : ""}`);
  await mkdir(DUMP_DIR, { recursive: true });
  await writeFile(new URL(`${name.replace(/[^a-z0-9]+/gi, "-")}.json`, DUMP_DIR), JSON.stringify(res, null, 2));
  return { code, data };
}

const quoteRes = await step("flow-quote", "GET", "/api/v1/dex/aggregator/quote", {
  query: {
    binanceChainId: "56",
    fromTokenAddress: USDT_BSC,
    toTokenAddress: TO_TOKEN,
    amount: String(AMOUNT_USD * 1e18),
    userWalletAddress: PROBE_WALLET,
  },
});
const routes = Array.isArray(quoteRes.data) ? quoteRes.data : [];
const route = routes.find((r) => r.isBest) || routes[0];
console.log("   vendor:", route?.vendorName, "mode:", route?.executionMode, "quoteId:", route?.quoteId);
console.log("   tradeFee:", route?.tradeFee, "priceImpactPercent:", route?.priceImpactPercent, "estimateGasFee:", route?.estimateGasFee, "approveTarget:", route?.approveTarget);

if (route?.quoteId) {
  const swapRes = await step("flow-swap", "GET", "/api/v1/dex/aggregator/swap", {
    query: {
      quoteId: route.quoteId,
      binanceChainId: "56",
      fromTokenAddress: USDT_BSC,
      toTokenAddress: TO_TOKEN,
      amount: String(AMOUNT_USD * 1e18),
      userWalletAddress: PROBE_WALLET,
      slippagePercent: 0.5,
    },
  });
  const swapData = swapRes.data;
  const tx = swapData?.tx || swapData?.[0]?.tx || swapData?.[0];
  console.log("   swap data keys:", swapData ? Object.keys(swapData).join(",") : "-");
  console.log("   tx:", tx ? JSON.stringify(tx).slice(0, 300) : "none");

  if (tx?.to) {
    const simRes = await step("flow-simulate", "POST", "/api/v1/dex/pre-transaction/simulate", {
      body: {
        binanceChainId: "56",
        evmTx: {
          from: tx.from || PROBE_WALLET,
          to: tx.to,
          value: tx.value || "0",
          data: tx.data,
          ...(tx.gas ? { gas: tx.gas } : {}),
          ...(tx.gasPrice ? { gasPrice: tx.gasPrice } : {}),
        },
      },
    });
    console.log("   simulation data:", JSON.stringify(simRes.data).slice(0, 300));
  }
}

if (route?.vendorName) {
  const approveRes = await step("flow-approve", "GET", "/api/v1/dex/aggregator/approve-transaction", {
    query: {
      binanceChainId: "56",
      tokenContractAddress: USDT_BSC,
      approveAmount: String(AMOUNT_USD * 1e18),
      vendor: route.vendorName,
    },
  });
  console.log("   approve data:", JSON.stringify(approveRes.data).slice(0, 300));
}

await step("flow-gas", "GET", "/api/v1/dex/pre-transaction/gas-price", { query: { binanceChainId: "56" } });
