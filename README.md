# MyAssistant

MyAssistant is a guided, friendly personal AI assistant for people who do not normally use AI. Instead of opening on an empty chat box, it offers clear everyday tasks and prompt suggestions. Users control every saved memory.

## Project structure

- `App.tsx`, `src/` — Expo React Native TypeScript app and navigation.
- `backend/src/index.ts` — Express API, authentication, profile, memory, and chat routes.
- `backend/src/services/MemoryService.ts` — memory logic kept separate from chat orchestration.
- `backend/src/schema.sql` — PostgreSQL tables and indexes.

## Mobile app setup

Requirements: Node.js 20+, npm, and the Expo Go app on a phone.

```bash
npm install
cp .env.example .env        # optional; create this file if needed
npm start
```

Create `.env` at the project root with:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:3000/api
```

Scan the QR code with Expo Go. The phone and computer must be on the same network. Do not use `localhost` in the phone configuration: use the computer's LAN IP. This project uses only Expo Go-compatible JavaScript dependencies. For an iOS simulator or Android emulator, use `npm run ios` or `npm run android`.

## Backend and PostgreSQL setup

Create a database, apply the schema, then configure and run the API:

```bash
createdb myassistant
psql myassistant < backend/src/schema.sql
cd backend
npm install
cp .env.example .env
npm run dev
```

Set these backend environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL |
| `JWT_SECRET` | Long random secret used to sign sessions |
| `OPENAI_API_KEY` | Server-side OpenAI API key; never put this in the Expo app |
| `OPENAI_MODEL` | Optional chat model override (default `gpt-4.1-mini`) |
| `PORT` | Optional API port (default `3000`) |

The API loads a user's profile and only relevant, confirmed memories before calling OpenAI. Conversations are stored for continuity, but they never become memories automatically. Run checks with `npm run typecheck` in both the root and `backend`, and `npm test` in `backend`.

## API

Authenticated routes accept `Authorization: Bearer <token>`. The server exposes registration, login, profile read/update, memory list/create/update/delete/clear, and chat endpoints under `/api`. `GET /health` is available for deployment checks.

## Deployment notes

Deploy PostgreSQL first and run `schema.sql` as a migration. Deploy `backend/` to a Node-compatible host with HTTPS and the environment variables above. Restrict CORS to the production client origins before launch, rotate secrets, add rate limiting, and use a managed secret store. Set `EXPO_PUBLIC_API_URL` to the HTTPS API URL, then use EAS Build/Submit for store builds. Account deletion and privacy-policy rows are intentionally visible but should be connected to the organization's production support and legal flows before release.

## Google Calendar and Gmail setup

1. In Google Cloud Console, create or select a project and enable **Google Calendar API** and **Gmail API**.
2. Configure the OAuth consent screen with the app name, support email, privacy-policy details, and test users. Keep the app in testing while developing. Google may require verification before public use of Gmail permissions.
3. Create an **OAuth 2.0 Web application** credential. Add the exact value of `GOOGLE_REDIRECT_URI` as an authorized redirect URI. Locally this can be `http://localhost:3000/api/integrations/google/callback`; production must use HTTPS.
4. Add these backend-only settings to `backend/.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and a long random `TOKEN_ENCRYPTION_KEY`. Never add the client secret or encryption key to Expo variables.
5. Apply `backend/src/schema.sql` again to create `connected_accounts`, then restart the backend.

Calendar initially asks only to view events (`calendar.readonly`). The separate calendar-actions choice asks to create events (`calendar.events`). Gmail asks to read email (`gmail.readonly`) and save drafts (`gmail.compose`); the app does **not** ask to send email and never sends automatically.

### Test with Expo

Set `EXPO_PUBLIC_API_URL` to the backend's LAN URL, start the backend and Expo, and sign in with a consent-screen test user. In **Settings → Connected Services**, connect each service explicitly. The system browser returns to Expo through the `myassistant://google-connected` app link. Test Calendar with events today and tomorrow and an empty day. Test Gmail read, unread, search, reply suggestion, editing, and **Save Draft**; confirm the draft appears in Gmail but is not sent. Revoke access on the Google Account permissions page and verify the app offers a friendly reconnect path.

Google access and refresh tokens stay encrypted in PostgreSQL and are never returned to Expo. Disconnecting deletes the feature's connection data. Email bodies and calendar details are retrieved only for the requested action and are never written to personal memory automatically.

## Home Screen widgets

### What works in Expo Go

**Settings → Home Screen Widget** stores the Daily Brief, Money, Calendar, Tasks, or Minimal choice, visible sections, greeting, and privacy choice in AsyncStorage. New setups default to **Keep It Private**. Open **Widget Preview** to test small, medium, and large layouts with live cached budget, calendar, Gmail, and task data. Pull to refresh. The preview and native widgets share `WidgetData`, rendering rules, and section deep links.

`WidgetDataService` normalizes cached/backend information and never calls OpenAI. `WidgetBridge` always writes JSON to AsyncStorage; Expo Go stops there. The app refreshes the snapshot when it opens, the Daily Brief refreshes, and task or money mutations complete. Connected-service refreshes are incorporated by the Daily Brief/preview. Widgets are cached summaries, not real-time background displays.

### Native boundary and EAS development builds

Real widgets cannot run in Expo Go. Start native work on a dedicated branch and run:

```bash
npx expo prebuild
eas build --profile development --platform ios
eas build --profile development --platform android
```

Implement a native module named `MyAssistantWidgetBridge` with `updateWidgetData(json)` and `reloadWidgets()`. JavaScript detects that module only in a native build, so callers do not need platform checks and Expo Go remains supported.

#### iOS / WidgetKit

1. In Xcode add a Widget Extension using SwiftUI and WidgetKit. The reference provider is `native-widgets/ios/MyAssistantWidget.swift`; expand its view to decode the full contract from `src/types.ts`.
2. Add the same App Group (for example `group.com.example.myassistant`) to the app and widget extension entitlements. Replace the reference identifier with the production identifier.
3. Implement the bridge by writing the JSON string to `UserDefaults(suiteName: APP_GROUP)` under `widget:data:v1`; call `WidgetCenter.shared.reloadAllTimelines()` from `reloadWidgets()`.
4. Use WidgetKit `Link` views with the `app://…` URLs. Timeline refresh dates are best-effort and subject to iOS limits.

#### Android / Glance

1. Add Jetpack Glance App Widget dependencies to the prebuilt Android project and register an `AppWidgetReceiver`, metadata, and supported widget sizes. `native-widgets/android/MyAssistantWidget.kt` marks the code boundary.
2. Implement the bridge with app-private SharedPreferences (the application and widget receiver share a process/package) under `widget:data:v1`, then request a Glance update from `reloadWidgets()`.
3. Decode the same normalized JSON and use Glance click actions to launch `app://…` intents. WorkManager may request occasional cached refreshes, but Android controls timing; do not promise real-time updates.

Native directories generated by `expo prebuild` are intentionally not committed. Reapply the extension/module through a config plugin in production so prebuild remains reproducible.

### Deep links and testing

Both `myassistant://` and `app://` schemes are configured. Widget sections use `app://money`, `app://calendar`, `app://email`, and `app://tasks`. Test JavaScript routing with, for example, `npx uri-scheme open app://tasks --ios` (or `--android`). To test the Expo Go preview: start the API and Expo, sign in, open **Settings → Home Screen Widget**, choose settings, save, then open the live preview. Real Home Screen installation, App Group sharing, timeline reloads, Glance receivers, and scheduled refreshes must be tested in the EAS development build.
