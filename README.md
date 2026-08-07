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
