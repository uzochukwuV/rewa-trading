# Doto Trading App

A dark, mobile-first trading UI prototype based on the provided Doto app screenshots. All accounts, balances, quotes, analysis, news, and trades are simulated.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/doto-mobile run dev` — run the Expo mobile app
- `pnpm --filter @workspace/doto-mobile run typecheck` — typecheck the mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/doto-mobile/app/` — onboarding, market, trade, portfolio, profile, and asset screens
- `artifacts/doto-mobile/context/AppState.tsx` — locally persisted demo account, favorites, wallet, and positions
- `artifacts/doto-mobile/data/market.ts` — sample market quotes and formatting

## Architecture decisions

- Keep trading and account interactions local and clearly marked as simulated; do not connect live brokerage services unless the user asks.
- Use AsyncStorage for demo session state so onboarding, favorites, balance changes, and mock positions survive app restarts.

## Product

The app mirrors the supplied Doto screenshots with onboarding, a demo wallet, market discovery, instrument charts and analysis, a trade simulator, portfolio tabs, and a profile screen. It is a UI prototype, not a financial product.

## User preferences

Keep all app data mocked until the user requests real services or live trading.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details


[https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/app.apk](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/app.apk), [https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/), [https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/video.mp4](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/video.mp4)