# Spot trading screen and Binance execution flow

## Product decision

Rename the **Swap** bottom tab to **Spot** and use it as the app's single spot-trading screen. Users choose a pay asset and a tokenized-stock output, then reverse the pair for sells or conversions. Keep the existing four tabs: Home, Markets, Spot, Portfolio.

## Implemented app flow

- Replaced the single-stock demo ticket with a pair ticket: USDT/USDC input for buys, selected RWA token as output, and the reverse for sells.
- Added token/provider selection, live quote preview, route/execution mode, fee and price-impact fields, and quote freshness handling.
- Added a quote-review bottom sheet with the pair, slippage, route, execution mode, network-fee estimate, expiry, and issuer/trading risk context.
- Added a separate success, pending, approval-only, or failure result screen.
- Asset detail Trade opens Spot with the stock and Buy side selected. Home's stock exploration card opens Spot.
- Removed local simulated position creation from the trading action. Portfolio continues to reflect wallet-derived holdings.

## Binance API and wallet flow

- Added authenticated server routes for aggregate quotes, transaction build, ERC-20 approval calldata, transaction simulation, signed transaction broadcast, RFQ order submit/status, and DEX transaction status.
- Tokenized stock routes use Binance's RFQ flow: quote, build, EIP-712 typed-data signature in the Privy wallet, RFQ submission, and order-status polling. RWA routes must not be treated as ordinary DEX calldata transactions.
- Standard DEX routes use Transaction API simulation before wallet signing. If the Privy EIP-1193 provider supports raw `eth_signTransaction`, the signed transaction is relayed through Binance's broadcast endpoint with MEV protection. Otherwise the app falls back to the provider's `eth_sendTransaction` and monitors the resulting hash.
- The app checks ERC-20 allowance before a standard swap. A missing allowance is simulated and sent as a separately confirmed wallet transaction. Once approved, the user must refresh and review a fresh quote before retrying the swap.
- Trading server requests require a Privy access token. Binance API credentials remain server-side.

## Deployment configuration

Set these variables on the server before enabling trading:

- `BINANCE_WEB3_API_KEY`
- `BINANCE_WEB3_SECRET_KEY`
- `PRIVY_APP_ID` (or the same public app ID as `EXPO_PUBLIC_PRIVY_APP_ID`)

Rebuild/redeploy `artifacts/doto-mobile/server/serve.js` with these changes. Real wallet signing requires an Android or iOS native build with Privy configured, plus BNB for gas and the selected input token.

## Scope and remaining checks

- Limit orders are not included.
- Do not treat API credentials or a quote response as proof that a trade succeeded. Only a confirmed chain receipt or a completed RFQ order should show success.
- End-to-end trading still needs native-device verification using a small amount after server credentials and wallet funding are configured.
