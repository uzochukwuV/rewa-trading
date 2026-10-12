# Drip — Dollar savings on autopilot

Drip is a mobile app concept for helping people in emerging markets build a dollar-denominated savings habit and, over time, invest in tokenized stock exposure from a wallet they control.

> **Product direction:** Turn local currency into dollar-denominated stock exposure on autopilot, starting from $20 a month.
>
> The installed APK is an early app build. The roadmap below describes the intended direction; it is not a claim that these features are already available.

## Hackathon links

- [Repository](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/)
- [Android app downloads](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/tree/main2/app.apk)
- [Download the Android test bundle (.zip)](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/raw/refs/heads/main2/app.apk/doto-mobile-android-bb3d32a31ce0fc41bdcccb3407080563beff7d8b.zip)
- [App walkthrough video](https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/video.mp4)

## App screenshots

These screenshots show the current Android build. The savings-first roadmap below describes proposed next steps. Keep the `images/` folder alongside this README and `video.mp4` at the repository root on the `main2` branch so GitHub can render the images and walkthrough.

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
  <a href="https://github.com/youngambille-jpg/AUSD-Cross-Border-Wallet/blob/main2/video.mp4">Watch or download the Drip app walkthrough video.</a>
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
3. Open Drip and continue through the available sign-in or preview flow.

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

## What the early build is for

The Android build is an early demonstration of a mobile wallet and tokenized-stock experience. Market access, wallet setup, and sign-in can depend on the build configuration and supported providers. It is not yet the full recurring-savings product described below. In particular, saving a plan or viewing this README does **not** schedule a payment, deposit, or stock purchase.

## Roadmap

The product should feel like a savings habit first and a trading tool second. These are proposed next steps, not features promised by the current APK.

### 1. Start with a dollar goal

- Let someone name a goal such as “laptop fund,” pick an amount such as $20 per month, and choose a contribution schedule.
- Show contributions and progress toward the goal in plain language; do not imply a guaranteed return.
- Make the plan easy to change, pause, or cancel.

### 2. Make recurring investing understandable

- Offer clear $20, $50, and $100 plan examples and a user-selected schedule.
- Show the amount, conversion rate, fees, intended asset or basket, and expected order date before any live action.
- Add execution history, reminders, and skip, pause, and cancel controls. Do not turn on automatic purchases until execution, consent, failure handling, and market eligibility have been implemented and reviewed.

### 3. Add a trusted local-currency on-ramp

- Begin with one launch country and a verified local payment rail rather than promising availability everywhere.
- Show the live exchange rate, all fees, delivery timing, and the stablecoin amount before confirmation.
- Complete local legal and regulatory review before accepting payments or enabling investments in that market.

### 4. Offer simple basket ideas

- Explain broad-market and technology basket concepts in everyday language.
- Show what each basket holds, how allocations work, how often they may change, and the risks and fees.
- Clearly distinguish a basket of tokenized products from a regulated fund or direct ownership of company shares.

### 5. Make self-custody easier to use safely

- Keep users in control of their wallet while simplifying network selection, gas costs, and recovery.
- Explain each signature and permission request before the user approves it.
- Design for portability across supported venues and chains rather than depending on just one provider.

### 6. Validate sustainable growth

- Test referrals, creator-led dollar-saving education, and local fintech partnerships after the core experience is trusted.
- Consider optional Drip Plus features—such as rebalancing, goal analytics, and reporting exports—only after validating demand, costs, and applicable tax rules.
- Treat transaction-fee, referral, and subscription revenue as assumptions to test in a pilot, not proven user economics.

## Important product risks

- Rules for local payments, recurring investments, and tokenized assets differ by country; availability requires market-by-market review.
- Tokenized stocks are third-party products and are not the same as owning the underlying shares or receiving full shareholder rights.
- Prices, liquidity, provider availability, execution, and network fees can change. No returns are guaranteed.
- A self-custody wallet gives users control and responsibility for their assets and transaction approvals.
