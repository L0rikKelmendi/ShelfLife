# Testing

The 1.2.0 release was checked on 5 November 2026.

| Check | Result |
| --- | --- |
| ESLint and JavaScript no-emit compiler check | Passed; `checkJs` is disabled |
| Jest | 38 tests across 11 suites, including one snapshot |
| Expo Doctor | 21/21 checks |
| Production web and Android Hermes exports | Passed |
| Firestore emulator rules | Three authorization/schema tests passed |
| Isolated Auth/Firestore browser journey | Registration, login, errors, persistence and CRUD passed |
| Cloud browser journeys | Passed at 393 × 852 and 1440 × 1100, including real touch/mouse swipes and Undo |
| Deployed database rules | Owner CRUD, cross-account denials and invalid-quantity denial passed |
| Android APK | Package, archive and signing certificate verified; version 1.2.0 / versionCode 3 |

## Run the checks

```bash
npm ci
npm run check
npm run test:rules
npm run test:emulator-ui
npm run export:web
npx expo-doctor
```

`npm run check` runs lint, a no-emit JavaScript compiler check and Jest. The source remains JavaScript; this is not strict TypeScript checking.

The required test categories are demonstrated by `ItemCard.test.jsx` (snapshot), `ItemForm.test.jsx` (interaction) and `pantry.test.js` (mocked Firebase boundary). Additional suites cover pictured suggestions, Quick Add validation/failures, swipe handling, Undo failures, notifications, dates and activity calculations.

Database checks require Java 21+. The browser journey also needs Python Playwright with Chromium. Set up browser dependencies with `python -m pip install -r scripts/requirements.txt` and `python -m playwright install chromium`, or set `CHROMIUM_PATH` to an existing browser executable.

## Isolated emulator journey

Keep port 8082 free before running `npm run test:emulator-ui`. The runner copies source into a temporary folder, writes an emulator-only environment file, starts Metro and Firebase emulators for `demo-shelflife`, executes the SDK journey, then removes the temporary folder and stops its services. Production Firebase hosts are blocked by the browser test. This avoids accidentally mixing a connected cloud environment with an emulator check.

Reports and acceptance screenshots are written under ignored `.local/checks/`, leaving the committed presentation images unchanged.

## Optional connected-project checks

With your own Firebase configuration and a web server on port 8081:

```bash
python scripts/browser_smoke.py          # Separate local preview mode
node scripts/seed-presentation-account.cjs
python scripts/premium_browser_smoke.py # Cloud journey and presentation fixture
npm run test:cloud-rules
```

The seed helper requires project-owner Firebase CLI login to create backdated synthetic data. It creates or reuses a dedicated account recorded in ignored `.local/presentation-account.json`, and replaces only that account’s generated sample documents. It does not modify other users. Cloud acceptance checks create temporary identities and clean them up after testing. Run these checks against a development project.

## Physical phone verification

Notification delivery was confirmed on the installed 1.1 Android app. The 1.2 release preserves that notification service without changes. Browser checks and Hermes compilation do not establish native device behavior; final 1.2 installation, native Google sign-in and delivery checks remain device acceptance steps.

Before presenting, install the 1.2 APK as an update and check:

1. Email/Password and Google sign-in, then account isolation after sign-out.
2. Add an ingredient, reopen the app, edit it, enjoy it, Undo, restore from history and delete it.
3. Food search and images, keyboard visibility of Save, scrolling, swipe behavior and Reduce Motion.
4. Allow notifications, send a test reminder, check the Android notification tray and open the app from the notification.
5. Schedule a future reminder; edit, complete/delete the item and sign out to verify cancellation.

Record the phone model and Android version with any failures. The weekly chart is calculated from current records and their timestamps, not an immutable event log. Demo figures are synthetic and do not measure real food-waste reduction. Existing upstream dependency advisories have not been represented as a clean security audit.

## Hosted acceptance check

The Firebase Hosting deployment at https://shelflife-6be50b4a.web.app passed the cloud browser journey at phone and desktop widths: registration, login and wrong-password handling, pictured search, CRUD, reload persistence, swipe/Undo, recent foods and weekly activity. Temporary test accounts were cleaned up. The Google button opened the Google authorization page on the hosted domain; this check did not complete a personal Google account sign-in.

Run the same journey against a deployment with `SHELFLIFE_TEST_URL=https://YOUR_HOST python scripts/premium_browser_smoke.py`.
