# Step 4F — Mobile App Preparation

The web app is now prepared as a mobile-friendly/PWA shell and for Capacitor packaging.

## Web/PWA

```bash
npm install
npm start
```

The app includes:
- mobile viewport and safe-area handling
- standalone PWA manifest
- service worker
- app icons
- touch-friendly controls
- responsive layout

## Capacitor packaging

Install Capacitor in a separate build environment:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "English AI Tutor" "com.englishaitutor.app"
npx cap add android
npx cap add ios
npx cap sync
```

For Android:

```bash
npx cap open android
```

For iOS:

```bash
npx cap open ios
```

The AI API key must remain on the server. Do not embed it in the mobile app.

## Important

Microphone and speech permissions must be configured in the native Android/iOS projects when the web app is packaged. HTTPS is recommended for browser/PWA microphone access.

This step prepares the app for packaging; it does not replace native store signing, provisioning, or platform-specific permissions.
