# Doto RWA Mobile App — Build Plan

## Product direction

Turn `artifacts/doto-mobile` from a generic simulated trading prototype into a social-first mobile app for discovering and trading tokenized equities on BNB Chain. Users sign in with a familiar method, receive an in-app wallet through Privy, browse before funding, and review every transaction before signing. Binance Agentic Wallet is an optional AI-agent capability with its own clearly separate wallet and authorization; it is not the Privy wallet.

Use the saved `.smoke/` responses as offline fixtures while Binance API access is unavailable. Mark fixture-backed prices, quotes, balances, and transaction outcomes as sample data. Never present a saved quote or simulation response as a live executable order.

## Navigation decision

Use four bottom tabs: **Home**, **Markets** (the current Discover screen), **Swap** (the current Trade screen rebuilt as the buy/sell flow), and **Portfolio**. Move Profile and settings behind the account/avatar control in the header. This makes room for Swap without keeping a low-frequency Profile tab in the primary navigation. Stock Buy/Sell buttons on Home and stock details open Swap with the selected token and side prefilled.

## Phases

### Phase 1 — RWA product foundation and app shell (in progress)

- [ ] Replace generic crypto/forex market types with tokenized-equity records sourced from the saved bStock/Ondo fixtures. Preserve provider, underlying ticker/name, token symbol, BNB Chain ID, contract, price/reference price, trading status, and fixture timestamp where available.
- [ ] Replace the Doto trading promise and MT5 demo account language with accurate tokenized-stock positioning and concise risk/context copy.
- [ ] Reshape Home and Markets around tokenized equities; clearly distinguish bStock and Ondo representations of the same underlying stock.
- [x] Add server-side Binance request signing for RWA token listings and token/reference prices, with fixture data as the automatic fallback when credentials or API access are unavailable.
- [ ] Update bottom navigation to Home, Markets, Swap, Portfolio; move Profile access to an account/avatar control.
- [ ] Add stock Buy/Sell entry points that route to Swap with the asset and side selected.

**Checkpoint:** App opens into a coherent stock-market experience with local data, no unrelated forex/OTC content, and navigation reaches every core screen.

### Phase 2 — Social sign-in and embedded wallet

- [x] Replace mock email/phone/PIN onboarding with Privy login methods (Google, Apple, email as configured) in the Expo app.
- [x] Provision or retrieve the user's embedded EVM wallet after social authentication; configure BNB Smart Chain (chain ID 56).
- [x] Add session restoration, sign-out, wallet address display, and clear wallet readiness/error states.
- [x] Keep demo/preview mode available when auth configuration is absent so the fixture-based app remains reviewable.
- [ ] Keep provider secrets and Privy server credentials out of the client bundle; validate Privy access tokens on server endpoints before exposing user-scoped data/actions.

**Checkpoint:** A user can sign in, return to the same account after restart, see their in-app wallet address/network, and browse stocks without being forced to fund first.

### Phase 3 — Swap review and transaction lifecycle

- [ ] Rebuild the current Trade screen as Swap with Buy/Sell, input amount, quote output, slippage, fee/gas, status, and explicit review/confirm states.
- [ ] Create a fixture adapter for token listings, prices, quotes, approvals, and simulation so the full UI is demoable offline.
- [x] Add a secure server proxy for Binance OnchainOS RWA market data; keep Binance API credentials server-side.
- [ ] Extend the proxy to wallet-scoped trading quotes and transaction building after Privy wallet addresses and signing are available.
- [ ] Integrate Privy wallet signing for BNB Chain only after a fresh quote and trading-status check; handle approval, swap submission, rejection, and pending/confirmed/failed results.
- [ ] Implement Sell with reverse-quote data when available; until then, mark the sell execution path as a fixture preview and never claim it was broadcast.

**Checkpoint:** Buy and Sell show an accurate pre-trade review; execution state only changes from confirmed transaction results, with understandable failure/retry paths.

### Phase 4 — Portfolio and account experience

- [ ] Replace local mock positions with wallet-derived holdings and transaction history, with sample/demo state explicitly separated.
- [ ] Show token issuer/provider, chain, token contract link, and underlying stock identity in holding details.
- [ ] Add profile/settings, wallet status, network, risk information, and disconnect/sign-out under the account control.
- [ ] Remove mock add/withdraw cash controls unless a real supported funding route is implemented.

**Checkpoint:** Portfolio values reconcile to the selected wallet and chain, and demo records cannot be mistaken for on-chain assets.

### Phase 5 — Binance Agentic Wallet AI Copilot

- [ ] Decide whether the submission will include a real Agentic Wallet session or a clearly labeled prototype handoff; the public docs describe a Binance-App authorization flow and a CLI/skills agent integration, not a drop-in Expo wallet SDK.
- [ ] If integrated, pair each app user with a user-scoped agent session and make the Agentic Wallet's separate address, balance, permissions, daily limit, and revocation state explicit.
- [ ] Add an AI stock copilot using Binance's tokenized-securities information skill and Agentic Wallet stock-trading capability for research, trading-status checks, quote-only requests, and confirmed actions.
- [ ] Require an explicit user confirmation after displaying asset, side, amount, quote, fees, and risk; use Binance Agentic Wallet's configured guardrails and log the resulting order status.
- [ ] Keep Privy-wallet and Agentic-Wallet activity/holdings separate; never silently switch the source wallet for a trade.

**Checkpoint:** The copilot can explain a tokenized stock and prepare/execute a user-confirmed action within the Agentic Wallet's configured limits, or the app clearly explains that the capability is a demo handoff.

### Phase 6 — Hackathon readiness

- [ ] Confirm the live API and wallet integration against current Binance docs and available credentials; replace fixture mode only for flows that pass end-to-end checks.
- [ ] Review loading, empty, stale-data, unsupported-region, halted-market, wallet rejection, insufficient USDT/gas, and failed-transaction states.
- [ ] Capture mobile screenshots and a short demo path: social login → stock home → quote/review → confirmation/result → portfolio/AI copilot.
- [ ] Prepare the project explanation, architecture, demo limitations, and submission materials.

**Checkpoint:** A reviewer can understand what is real, what is fixture-backed, which wallet authorizes each action, and why the project uses Binance RWA/Agentic Wallet capabilities.

## Current known constraints

- Privy login and BNB embedded-wallet support are implemented in the Expo app. Real login remains disabled until the public Privy App ID and Client ID are configured; no Privy server secret is supplied to the mobile client.
- The mobile dev middleware and static server currently expose only public Binance RWA market data. There are no user-scoped server endpoints yet, so token verification must be added before any such data or wallet actions are exposed.
- Binance RWA market reads use a signed proxy in the mobile dev middleware and static server. The separate workspace API server is still health-only; the database schema is empty.
- The local shell does not currently receive `BINANCE_WEB3_API_KEY` or `BINANCE_WEB3_SECRET_KEY`; live authentication has not been confirmed here. Set them in the server runtime, never in `EXPO_PUBLIC_*` variables. `EXPO_PUBLIC_BINANCE_API_URL` is an optional public proxy base URL for standalone builds.
- `.smoke/` includes RWA token listings, an NVDA search/price sample, USDT-to-stock buy quotes, approval calldata, a swap payload, and a failed allowance simulation. It does not contain a sell quote or a confirmed trade.
- Saved quote/price values are snapshots and must not be described as live.
- A Binance Agentic Wallet is distinct from a Privy embedded wallet and requires an explicit, user-authorized integration.

## Decisions to confirm during implementation

- Confirm whether Profile should move behind the avatar, leaving four bottom tabs as proposed.
- Confirm which Privy social methods to enable and provide the Privy app configuration before wiring real authentication.
- Confirm whether Binance Agentic Wallet is a required working integration for the submission or an optional copilot/demo path.
