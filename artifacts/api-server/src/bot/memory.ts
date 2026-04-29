import type { ChatTurn } from "./brain";

const conversations = new Map<number, ChatTurn[]>();

const MAX_TURNS_PER_CHAT = 32;

export function getHistory(chatId: number): ChatTurn[] {
  return conversations.get(chatId) ?? [];
}

export function appendTurn(chatId: number, turn: ChatTurn): void {
  const history = conversations.get(chatId) ?? [];
  history.push(turn);
  if (history.length > MAX_TURNS_PER_CHAT) {
    history.splice(0, history.length - MAX_TURNS_PER_CHAT);
  }
  conversations.set(chatId, history);
}

export function clearHistory(chatId: number): void {
  conversations.delete(chatId);
}

export function stats(): { chats: number; totalTurns: number } {
  let totalTurns = 0;
  for (const history of conversations.values()) {
    totalTurns += history.length;
  }
  return { chats: conversations.size, totalTurns };
}
