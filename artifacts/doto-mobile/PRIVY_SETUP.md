# Privy authentication setup

1. Create a Privy app and a mobile app client in the Privy Dashboard.
2. Enable email, Google, and Apple login methods in that app. Google and Apple also require their provider configuration in the dashboard.
3. Allow the native app identifiers `com.doto.mobile` for iOS and Android in the mobile client. For Expo Go development, allow `host.exp.Exponent` as well.
4. Copy `.env.example` to `.env` and fill in the public Privy App ID and Client ID. These identifiers are public; never put the Privy App Secret in the app or in an `EXPO_PUBLIC_*` variable.
5. Build and run a native development client after installing or changing the Privy native modules. Expo Go does not include arbitrary native modules.

When both identifiers are present, the app restores the Privy session at launch, provisions an Ethereum embedded wallet for users who do not already have one, and targets BNB Smart Chain (chain ID 56). The account page shows the Privy user ID and embedded wallet address. Without both identifiers, the sign-in screen offers a clearly labeled local preview.

Spot trading endpoints require the Privy access token returned by `getAccessToken()` as a Bearer token. The mobile app uses the Privy embedded wallet provider to request wallet signatures. The server verifies the token signature against Privy's JWKS before forwarding trading requests. Configure `PRIVY_APP_ID` (or the existing public `EXPO_PUBLIC_PRIVY_APP_ID`) alongside `BINANCE_WEB3_API_KEY` and `BINANCE_WEB3_SECRET_KEY` on the server. Keep Binance credentials server-side. The server does not custody funds or sign user transactions.

Tokenized equity routes use Binance's RFQ flow: quote, build, Privy typed-data signature, RFQ submission, and order-status polling. Regular DEX routes use transaction simulation and client wallet signing; the server relays a raw signed transaction through Binance's broadcast API when the Privy provider supports `eth_signTransaction`, otherwise it uses the wallet provider's `eth_sendTransaction` and tracks the returned hash. Each action still requires a separate wallet confirmation. Do not test a real transaction with funds until the app has been built as a native Android/iOS app, the Binance API credentials and Privy app are configured, and a small amount of BNB and the input asset are available.
