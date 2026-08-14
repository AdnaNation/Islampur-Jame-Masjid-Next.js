# Building an APK (Capacitor)

Your Next.js app has server-side API routes and a MongoDB connection, so it
can't be exported as static files into the APK — the app has to stay
deployed, and the APK is a native Android shell that loads your live site
(`https://islampur-jame-masjid.vercel.app`) in a WebView. That's what
`capacitor.config.ts` is set up to do.

## Prerequisites (one-time)

- [Android Studio](https://developer.android.com/studio) installed
- Node.js installed

## Steps

Run these from the project root, on your own machine (not in this chat):

```bash
npm install

# Adds the native android/ project folder
npx cap add android

# Copies capacitor.config.ts + public/ into the native project
npx cap sync android

# Opens the project in Android Studio
npx cap open android
```

In Android Studio:

1. Let Gradle finish syncing (first time takes a few minutes)
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Grab the generated APK from `android/app/build/outputs/apk/debug/app-debug.apk`

That debug APK installs on any Android phone (enable "install from unknown
sources" if prompted) and just loads your live Vercel deployment.

## Making it look right

- **App icon / splash screen**: Android Studio's `android/app/src/main/res/`
  folder has the default Capacitor icon. Right-click `android/app` →
  **New → Image Asset** to swap in your mosque/logo image.
- **App name**: already set to "Islampur Jame Masjid" via `appName` in
  `capacitor.config.ts`.

## Publishing to the Play Store (optional)

A debug APK works for sharing directly, but the Play Store needs a signed
release build:

1. **Build → Generate Signed Bundle / APK** in Android Studio
2. Create a keystore (keep it safe — you'll need the same one for every future update)
3. Choose **Android App Bundle (.aab)**, which is what the Play Store expects

## Updating the app later

Since the app just loads your live URL, most changes (new pages, bug fixes,
UI tweaks) **don't need a new APK at all** — just deploy to Vercel as usual
and everyone's existing installed app picks it up automatically. You only
need to rebuild the APK if you change native-level things like the app icon,
app name, or add native plugins (camera, push notifications, etc.).
