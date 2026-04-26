type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_TURNS = 10;
const store = new Map<string, ChatTurn[]>();

function pruneConversation(turns: ChatTurn[]) {
  const cutoff = Date.now() - CONVERSATION_TTL_MS;
  const freshTurns = turns.filter((turn) => turn.createdAt >= cutoff);
  return freshTurns.slice(-MAX_TURNS);
}

export function getConversationTurns(conversationId: string) {
  const turns = store.get(conversationId) ?? [];
  const pruned = pruneConversation(turns);
  if (pruned.length !== turns.length) {
    store.set(conversationId, pruned);
  }
  return pruned;
}

export function appendConversationTurns(
  conversationId: string,
  userMessage: string,
  assistantMessage: string,
) {
  const current = getConversationTurns(conversationId);
  const now = Date.now();
  const updated = pruneConversation([
    ...current,
    { role: "user", content: userMessage, createdAt: now },
    { role: "assistant", content: assistantMessage, createdAt: now },
  ]);
  store.set(conversationId, updated);
  return updated;
}

export function summarizeRecentContext(conversationId: string) {
  const turns = getConversationTurns(conversationId).slice(-6);
  if (turns.length === 0) return "";

  return turns
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
    .join("\n");
}
