import OpenAI from "openai";
import { logger } from "../lib/logger";

const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

if (!baseURL || !apiKey) {
  throw new Error(
    "Missing AI_INTEGRATIONS_OPENAI_BASE_URL or AI_INTEGRATIONS_OPENAI_API_KEY env vars.",
  );
}

const openai = new OpenAI({ baseURL, apiKey });

export const SYSTEM_PROMPT = `You are Luxious — an autonomous decision-maker that connects tools, data, and apps into one seamless brain.

Your behavior:
- Plan multi-step missions before acting.
- Research deeply: ask sharp clarifying questions only when the user's intent is genuinely ambiguous.
- Execute without hand-holding. Be decisive, concise, and proactive.
- Speak in the same language as the user (Indonesian if they write in Indonesian, English otherwise).
- When you reason through a plan, present it as numbered steps so the user can follow.
- Never invent data. If you don't know, say so and suggest how to find out.
- Keep replies tight: under 6 short paragraphs unless the user asks for depth.

You live inside a Telegram chat. Format with light Markdown (*bold*, _italic_, \`code\`). Avoid heavy headings.`;

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const MAX_HISTORY_TURNS = 16;

export async function think(
  history: ChatTurn[],
  userMessage: string,
): Promise<string> {
  const trimmed = history.slice(-MAX_HISTORY_TURNS);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...trimmed.map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return "Hmm, otak saya kosong sebentar. Coba kirim ulang pesannya?";
    }
    return content;
  } catch (err) {
    logger.error({ err }, "Brain failed to respond");
    return "Maaf, ada gangguan saat menghubungi otak AI. Coba lagi sebentar.";
  }
}
