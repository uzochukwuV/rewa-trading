// Re-export of the canonical signing client used by the Node backend, so the
// dev scripts and the server can never drift apart.

export { HOST, USDT_BSC, publicLookup, buildQueryString, callApi } from "../../server/lib/binance.mjs";
export { OPERATIONS } from "../../server/lib/ops.mjs";

export const PROBE_WALLET = "0x000000000000000000000000000000000000dEaD";
