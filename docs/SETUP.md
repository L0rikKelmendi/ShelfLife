# Development setup

## Prerequisites

- Node 24.12+ within 24.x and npm; `.nvmrc` specifies the supported major.
- A Firebase project for cloud authentication and database features.
- An Expo account for EAS builds.
- Java 21+ for Firestore emulator tests; Python with Playwright, Requests and Chromium for browser acceptance checks.

```bash
npm ci
cp .env.example .env.local
```

Fill the four `EXPO_PUBLIC_FIREBASE_*` entries with the **web application** configuration from Firebase Project settings. Environment values beginning with `EXPO_PUBLIC_` are bundled into the client: never use them for service-account keys, administrative credentials or private tokens. Local environment files and signing material are ignored by Git.

## Firebase

1. Register a web app in your Firebase project and copy its configuration into `.env.local`.
2. Enable **Authentication → Sign-in method → Email/Password** and **Google**. Select a support email for Google.
3. Create a Cloud Firestore database and deploy the supplied ownership and schema rules:

   ```bash
   npx firebase login
   npx firebase use --add
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```

4. Add the development or hosted browser domain to Authentication’s authorized domains. Web Google sign-in uses a popup and requires an authorized origin.
5. Restart Expo after changing environment values.

Each authenticated user owns the collection `users/{uid}/items`. Preview mode uses separate local data and does not represent a Firebase session.

## Native Google sign-in

For Android, register an Android app with package `com.shelflife.pantry`. Add the SHA-1/SHA-256 fingerprints of the certificate used to sign the build. Put the Google OAuth client ID of type **Web application** into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

For an iOS development build, also configure the iOS OAuth client for `com.shelflife.pantry`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and its reversed client-ID URL scheme in `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`. iOS device installation requires the appropriate Apple signing/provisioning.

Google sign-in uses a native module and needs a development build or standalone app. Expo Go can be used for Email/Password and the other supported app features, but cannot perform native Google sign-in.

## Start the app

```bash
npm start       # Expo Go
npm run web     # Browser preview
npm run dev     # Native development client
```

Without Firebase values, choose **Just looking? Explore the preview** to use the local sample pantry. This mode has local persistence and CRUD; it does not sync to Firestore. Devices connecting to Metro must be able to reach the computer over the network.

## Android builds

The supplied EAS profiles use the project’s current package and Expo account. When forking the app, initialize your own EAS project, set your owner/project ID and package identifiers in `app.config.js`, and register the corresponding Firebase/OAuth clients.

```bash
npx eas-cli@latest login
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value YOUR_VALUE --visibility plaintext
# Add the other required EXPO_PUBLIC values to the same environment.
npx eas-cli@latest build --platform android --profile preview
```

The `preview` profile produces an installable APK; `development` includes the development client. Native configuration and bundled environment changes require a new build. Keep signing credentials in EAS or private local storage.

## Notifications

On Android, open **My account → Pantry reminders**, allow notifications and enable reminders. **Send a test reminder** requests immediate local delivery. An ingredient with reminders enabled is scheduled for 09:00 on the day before its expiry/best-before date, when that time is still in the future. At most 50 upcoming item reminders are scheduled.

Editing, completing or deleting items reconciles their schedules; sign-out cancels the current account’s pending reminders. Synchronization happens while the app receives data, rather than through a background server. Reminder delivery depends on the device’s notification settings. Browser controls indicate that local device reminders require the mobile app.

## References

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Firebase guide](https://docs.expo.dev/guides/using-firebase/)
- [Expo notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Google Sign-In with Expo](https://react-native-google-signin.github.io/docs/setting-up/expo)
- [Firebase authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started)

## Hosted web app

The live app is https://shelflife-6be50b4a.web.app . Firebase Hosting serves the Expo web export over HTTPS. All routes rewrite to index.html, allowing direct links and reloads on `/login`, `/pantry` and the other screens. The hosting domain is authorized in Firebase Authentication.

To deploy an update to your own configured Firebase project:

```bash
npm run export:web
npx firebase deploy --only hosting --project YOUR_PROJECT_ID
```

The build uses `.env.local`; only the generated `dist` directory is uploaded. EXPO_PUBLIC values are client configuration and are included in the bundle. Administrative tokens and service-account credentials must never be placed there. Native local notifications remain a mobile-app feature.
