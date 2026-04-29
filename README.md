# Luxious

> Autonomous decision-maker that connects tools, data, and apps into one seamless brain.
> Plans multi-step missions, researches deeply, and executes without hand-holding.

Luxious lives inside Telegram as [@Luxious01_bot](https://t.me/Luxious01_bot) and is powered by GPT-5 reasoning.

## Architecture

This is a pnpm monorepo. The Telegram bot runs inside the `api-server` artifact alongside an Express health endpoint, so the same process can be deployed as a single long-running service.

```
artifacts/
└── api-server/             # Express + Telegram bot (grammY)
    └── src/
        ├── app.ts          # Express setup
        ├── index.ts        # Boots HTTP server + Telegram bot
        ├── bot/
        │   ├── index.ts    # Bot commands & message handler
        │   ├── brain.ts    # OpenAI chat completion brain
        │   └── memory.ts   # Per-chat short-term memory
        └── routes/
            ├── index.ts
            └── health.ts   # GET /api/healthz
```

## Commands the bot understands

| Command  | Description                                |
|----------|--------------------------------------------|
| `/start` | Greet the user and show the menu.          |
| `/help`  | List available commands.                   |
| `/about` | Tell the user what Luxious is.             |
| `/reset` | Clear the conversation memory for the chat.|
| `/stats` | Show how many chats and turns are tracked. |

Any non-command text message is routed to the AI brain, which replies in the same language as the user.

## Required environment variables

| Variable                              | Purpose                                                |
|---------------------------------------|--------------------------------------------------------|
| `TELEGRAM_BOT_TOKEN`                  | Bot token from [@BotFather](https://t.me/BotFather).   |
| `AI_INTEGRATIONS_OPENAI_BASE_URL`     | Base URL for the OpenAI-compatible endpoint.           |
| `AI_INTEGRATIONS_OPENAI_API_KEY`      | API key for the OpenAI-compatible endpoint.            |
| `PORT`                                | HTTP port for the health server (set by the platform). |

When running on Replit, the AI integration variables are auto-provisioned by the Replit AI Integrations setup.

## Local development

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
```

The bot connects to Telegram via long polling — no public webhook is needed for development.

## Tech stack

- **TypeScript** + **ES modules**
- **[grammY](https://grammy.dev/)** — Telegram bot framework
- **[OpenAI SDK](https://github.com/openai/openai-node)** — GPT-5 chat completions
- **Express 5** — Health endpoint
- **Pino** — Structured logging
- **esbuild** — Bundling

## License

MIT
