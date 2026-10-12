# Doto RWA Mobile

**Doto RWA Mobile** is a social-first mobile app for discovering and trading tokenized equities on BNB Chain. Users can browse tokenized-stock listings, sign in with Privy when configured, access an embedded wallet, review a trade, and view wallet-backed portfolio information.

The app distinguishes bStock and Ondo token representations of the same underlying stock. Binance RWA market data can fall back to saved sample fixtures when live API access is unavailable; sample values must not be treated as live quotes or executable orders.

## Hackathon links

- [Repository](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/)
- [Android app downloads](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/tree/main2/app.apk)
- [Download the Android test bundle (.zip)](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/raw/refs/heads/main2/app.apk/doto-mobile-android-bb3d32a31ce0fc41bdcccb3407080563beff7d8b.zip)
- [App walkthrough video](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/video.mp4)

## App screenshots

These screenshots show the current Doto Android app. Keep the `images/` folder alongside this README and `video.mp4` at the repository root on the `main2` branch so GitHub can render the images and walkthrough.

<table>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-10-12%20at%2013.25.03.jpeg" alt="App home screen and tokenized-stock overview" width="190" /></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-10-12%20at%2013.25.07.jpeg" alt="Searchable tokenized-stock markets" width="190" /></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-10-12%20at%2013.25.09.jpeg" alt="Spot trade quote screen" width="190" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Home</strong></td>
    <td align="center"><strong>Markets</strong></td>
    <td align="center"><strong>Spot quote</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-10-12%20at%2013.25.09%20%281%29.jpeg" alt="Tokenized-stock portfolio screen" width="190" /></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-10-12%20at%2013.25.09%20%282%29.jpeg" alt="Doto AI market information screen" width="190" /></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-10-12%20at%2013.25.09%20%283%29.jpeg" alt="User account and embedded wallet screen" width="190" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Portfolio</strong></td>
    <td align="center"><strong>Market assistant</strong></td>
    <td align="center"><strong>Account &amp; wallet</strong></td>
  </tr>
</table>

## App walkthrough

<video src="https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/raw/refs/heads/main2/video.mp4" controls preload="metadata" width="360">
  <a href="https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/video.mp4">Watch or download the Doto app walkthrough video.</a>
</video>

If the video player does not appear in your Markdown viewer, [open or download the walkthrough video](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/video.mp4).

## Test the Android app

The `app.apk` folder contains a ZIP bundle. Extract it to get `app-release.apk`.

### Download and extract from GitHub

1. [Download the Android test bundle](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/raw/refs/heads/main2/app.apk/doto-mobile-android-bb3d32a31ce0fc41bdcccb3407080563beff7d8b.zip), or open the [app downloads folder](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/tree/main2/app.apk) and download the `.zip` file.
2. Save the ZIP to your computer or Android device.
3. Extract the archive into the `app.apk` folder. The archive contains one file: `app-release.apk`.

If you have cloned the repository, you can extract the bundle in place:

```bash
unzip -o app.apk/doto-mobile-android-bb3d32a31ce0fc41bdcccb3407080563beff7d8b.zip -d app.apk/
```

### Install on an Android phone

1. Transfer `app.apk/app-release.apk` to the phone, or extract the ZIP on the phone with its file manager.
2. Open the APK file to install it. If Android asks, allow your browser or file manager to install apps from this source.
3. Open Doto and continue through the available sign-in or preview flow.

To install from a computer with Android Debug Bridge (ADB) connected to the phone:

```bash
adb install -r app.apk/app-release.apk
```

### What to try

- Finish onboarding and open the app.
- Browse the tokenized-stock market list, search for an asset, and save or remove a favorite.
- Open an asset to review its information and indicative market data.
- Check the wallet and portfolio screens.
- If you open a trade, review the quote and fees, then stop before signing or approving it unless you intentionally mean to submit a real transaction.

**Safety:** Tokenized assets can lose value and may not be available in your country. A wallet signature, token approval, transfer, or submitted order can have real and irreversible effects. Do not use funds you cannot afford to lose to test the app. The app is not financial advice.

### APK download note

The ZIP in the repository is the download bundle. It contains an APK that is about 123 MB after extraction. GitHub does not accept regular Git files over 100 MiB, so keep the extracted `app-release.apk` out of normal commits. For a direct APK link, publish the APK as a GitHub Release asset and link that release here; reviewers can currently download the ZIP from the `app.apk` folder and extract it.

For the repository download links above to work, keep the ZIP bundle at the linked path on the `main2` branch. If a new build changes the archive filename, update the download links in this README as well.

## Implemented product phases

Phases 1–4 of the Doto RWA mobile app are implemented.

### Phase 1 — Tokenized-equity foundation

- Market discovery is focused on tokenized equities on BNB Chain.
- Listings distinguish the provider, underlying stock, token symbol, contract, reference price, and trading status where data is available.
- Signed Binance RWA market-data requests use saved sample fixtures as a fallback when live access is unavailable.

### Phase 2 — Social sign-in and embedded wallet

- Privy sign-in supports the configured Google, Apple, and email methods.
- Signing in provisions or retrieves a user’s embedded EVM wallet on BNB Smart Chain (chain ID 56).
- Session restoration, sign-out, wallet status, and a local preview path are supported.
- Live Privy sign-in requires the public app configuration to be set for the build; preview mode is available without it.

### Phase 3 — Swap and transaction review

- The app supports a tokenized-stock buy/sell flow with a quote and pre-trade review.
- Where live trading integration is configured, transaction signing uses the Privy wallet and BNB Chain.
- A saved quote or fixture-backed outcome is a preview—not proof a trade was broadcast or completed. Review the wallet prompt carefully and do not sign during a walkthrough unless you intend to authorize that transaction.

### Phase 4 — Portfolio and account

- The app includes wallet and portfolio views, account settings, network information, and risk context.
- Preview/sample information is separate from wallet-derived holdings.

## Roadmap

### Phase 5 — Binance Agentic Wallet AI Copilot (not implemented)



- integrate a real Agentic Wallet session 
- Show the Agentic Wallet’s separate address, balance, permissions, spending limits, and revocation state.
- Keep Agentic Wallet activity and holdings separate from the user’s Privy wallet.
- For any action, show the asset, side, amount, quote, fees, and risks and require user confirmation before execution.
- Local-currency on-ramp. Pay in naira, cedis, or whatever you hold, and receive stablecoins at a transparent rate.
- Auto-invest plans. Pick an amount ($20, $50, $100) and a schedule. Doto buys tokenized stocks automatically from credit card like a monthly subscription.
- Curated baskets. Simple, diversified options such as a broad-market basket or a tech basket, so users don’t have to pick stocks.
- Drip Plus (optional subscription). Auto-rebalancing, tax and reporting exports, and goal analytics, priced under 1% of a typical user’s balance.



## Configuration and transaction notes

- The mobile app’s signed Binance proxy currently serves public RWA market data. User-scoped server endpoints are not yet available.
- Live market access and Privy login depend on build/server configuration. Keep Binance API credentials and Privy server credentials on the server; never put them in `EXPO_PUBLIC_*` variables.
- Saved fixture prices and quotes are snapshots. Do not describe them as live, sign a fixture quote, or claim a simulated result was broadcast.
- Tokenized equities are third-party assets, not direct ownership of the underlying shares, and may have limited availability, liquidity, and trading hours.
- Transactions can be irreversible and assets can lose value. Review each wallet approval carefully; this app is not financial advice.
