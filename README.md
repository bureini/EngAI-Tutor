# English AI Tutor — Step 4F: Mobile App Preparation

Step 4F prepares the speaking-first English AI Tutor for real mobile packaging.

Included:
- Responsive mobile viewport
- Safe-area support for modern phones
- Touch-friendly controls
- PWA manifest
- Service worker/offline app shell
- 192px/512px app icons
- Capacitor configuration
- Android/iOS packaging instructions
- Existing Steps 4A–4E functionality preserved

## Architecture

Mobile app UI → HTTPS API → AI model

The API key stays on the server.

## Web

```bash
npm install
npm start
```

## Mobile packaging

```bash
npm install
npx cap add android
npx cap add ios
npx cap sync
```

Then open the native project with Android Studio or Xcode.

See `mobile-build.md` for details.
