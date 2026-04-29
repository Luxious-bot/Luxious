# Luxious

Autonomous decision-maker Telegram bot. Lives at [@Luxious01_bot](https://t.me/Luxious01_bot).

## Project structure

pnpm monorepo. The bot lives inside the `api-server` artifact so a single Node.js process serves both the Telegram bot (long polling) and an HTTP health endpoint.

- `artifacts/api-server/src/index.ts` — boots Express + Telegram bot
- `artifacts/api-server/src/bot/` — bot commands, AI brain (OpenAI SDK), in-memory chat history
- `artifacts/api-server/src/routes/health.ts` — `GET /api/healthz`
- `artifacts/mockup-sandbox/` — design canvas (unused for the bot itself)

## Required secrets

- `TELEGRAM_BOT_TOKEN` — from @BotFather
- `GITHUB_TOKEN` — Personal Access Token (Classic) with `repo` scope, used to push to https://github.com/Luxious-bot/Luxious
- `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` — auto-provisioned by Replit AI Integrations (OpenAI provider)

## Build / run

- Workflow `artifacts/api-server: API Server` runs `pnpm --filter @workspace/api-server run dev` which builds via esbuild (`build.mjs`) then starts the bundled `dist/index.mjs`.
- `grammy` is externalized in `build.mjs` because it dynamically `require`s `./platform.node` at runtime, which esbuild cannot bundle.
- Memory is process-local (`Map`). It resets on restart — fine for the current scope. Persisting to a DB is a future enhancement.

## GitHub

- Remote: `https://github.com/Luxious-bot/Luxious` (public)
- Push uses `GITHUB_TOKEN` over HTTPS. The remote URL itself does NOT contain the token; the token is provided via `git -c http.extraHeader` or an askpass helper to keep it out of `.git/config`.

## User preferences

- Communicates in Bahasa Indonesia.
- Wants minimal back-and-forth: build, validate, push.
