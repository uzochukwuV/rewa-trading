# Privy authentication setup

1. Create a Privy app and a mobile app client in the Privy Dashboard.
2. Enable email, Google, and Apple login methods in that app. Google and Apple also require their provider configuration in the dashboard.
3. Allow the native app identifiers `com.doto.mobile` for iOS and Android in the mobile client. For Expo Go development, allow `host.exp.Exponent` as well.
4. Copy `.env.example` to `.env` and fill in the public Privy App ID and Client ID. These identifiers are public; never put the Privy App Secret in the app or in an `EXPO_PUBLIC_*` variable.
5. Build and run a native development client after installing or changing the Privy native modules. Expo Go does not include arbitrary native modules.

When both identifiers are present, the app restores the Privy session at launch, provisions an Ethereum embedded wallet for users who do not already have one, and targets BNB Smart Chain (chain ID 56). The account page shows the Privy user ID and embedded wallet address. Without both identifiers, the sign-in screen offers a clearly labeled local preview.

The current app server only exposes public market data. It does not expose user-scoped data or wallet actions, so there is no authenticated server endpoint yet. When one is added, send `getAccessToken()` as a Bearer token and verify it server-side with Privy's server SDK before returning user data or performing actions. Do not treat client authentication state as server authorization.
