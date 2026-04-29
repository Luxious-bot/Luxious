import { Bot, GrammyError, HttpError } from "grammy";
import { logger } from "../lib/logger";
import { think } from "./brain";
import { appendTurn, clearHistory, getHistory, stats } from "./memory";

const token = process.env["TELEGRAM_BOT_TOKEN"];

if (!token) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN environment variable is required to start the Telegram bot.",
  );
}

export const bot: Bot = new Bot(token);

bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name ?? "explorer";
  await ctx.reply(
    `Halo *${name}*! Saya *Luxious* — otak otonom yang menghubungkan tools, data, dan aplikasi jadi satu.\n\n` +
      `Apa misi pertama kita hari ini? Kirim pertanyaan, ide, atau tugas apa saja.\n\n` +
      `Perintah berguna:\n` +
      `/help — daftar perintah\n` +
      `/reset — hapus memori percakapan\n` +
      `/about — tentang Luxious`,
    { parse_mode: "Markdown" },
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `*Perintah Luxious*\n\n` +
      `/start — perkenalan\n` +
      `/about — tentang saya\n` +
      `/reset — hapus konteks percakapan\n` +
      `/help — bantuan ini\n\n` +
      `Selain itu, cukup kirim pesan biasa — saya akan rencanakan dan jawab.`,
    { parse_mode: "Markdown" },
  );
});

bot.command("about", async (ctx) => {
  await ctx.reply(
    `*Luxious* adalah autonomous decision-maker yang:\n` +
      `• Merencanakan misi multi-langkah\n` +
      `• Meneliti secara mendalam\n` +
      `• Mengeksekusi tanpa banyak diarahkan\n\n` +
      `Dibuat dengan TypeScript, grammY, dan otak GPT-5.\n` +
      `Telegram: https://t.me/Luxious`,
    { parse_mode: "Markdown" },
  );
});

bot.command("reset", async (ctx) => {
  if (ctx.chat?.id !== undefined) {
    clearHistory(ctx.chat.id);
  }
  await ctx.reply("Memori percakapan dibersihkan. Mulai segar.");
});

bot.command("stats", async (ctx) => {
  const s = stats();
  await ctx.reply(
    `Aktif di *${s.chats}* chat, total *${s.totalTurns}* giliran tersimpan.`,
    { parse_mode: "Markdown" },
  );
});

bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const userText = ctx.message.text;

  if (userText.startsWith("/")) {
    return;
  }

  await ctx.replyWithChatAction("typing");
  const typingInterval = setInterval(() => {
    ctx.replyWithChatAction("typing").catch(() => {});
  }, 4000);

  try {
    const history = getHistory(chatId);
    const reply = await think(history, userText);

    appendTurn(chatId, { role: "user", content: userText });
    appendTurn(chatId, { role: "assistant", content: reply });

    await ctx.reply(reply, { parse_mode: "Markdown" }).catch(async () => {
      await ctx.reply(reply);
    });
  } finally {
    clearInterval(typingInterval);
  }
});

bot.on("message", async (ctx) => {
  await ctx.reply(
    "Saat ini saya hanya memproses pesan teks. Kirim pertanyaan atau perintah dalam bentuk teks ya.",
  );
});

bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;
  if (e instanceof GrammyError) {
    logger.error({ err: e, update: ctx.update.update_id }, "Telegram API error");
  } else if (e instanceof HttpError) {
    logger.error({ err: e, update: ctx.update.update_id }, "Telegram network error");
  } else {
    logger.error({ err: e, update: ctx.update.update_id }, "Unhandled bot error");
  }
});

export async function startBot(): Promise<void> {
  const me = await bot.api.getMe();
  logger.info({ username: me.username, id: me.id }, "Telegram bot identity");
  await bot.start({
    onStart: (info) => {
      logger.info({ username: info.username }, "Luxious bot is now polling");
    },
  });
}

export async function stopBot(): Promise<void> {
  try {
    await bot.stop();
    logger.info("Luxious bot stopped");
  } catch (err) {
    logger.error({ err }, "Error stopping bot");
  }
}
