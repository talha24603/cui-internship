"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { getSession } from "@/utils/authClient";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type ChatApiResponse = {
  conversationId: string;
  reply: string;
  confidence?: "high" | "medium" | "low";
};

export default function HelpChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I can guide you through this internship portal. Ask me what you want to do.",
    },
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage() {
    if (!canSend) return;

    const message = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: message }]);
    setLoading(true);

    const session = getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          currentRoute: window.location.pathname,
          conversationId,
        }),
      });
      const data = (await res.json()) as ChatApiResponse | { error?: string };

      if (!res.ok || !("reply" in data)) {
        throw new Error(("error" in data && data.error) || "Unable to get assistant response");
      }

      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: data.reply }]);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unable to get assistant response";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: `Sorry, ${messageText}. Please try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="w-[340px] rounded-xl border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Portal Help</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "ml-8 bg-indigo-600 text-white"
                    : "mr-8 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading ? (
              <div className="mr-8 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask how to use the system..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!canSend}
              className="rounded-md bg-indigo-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-indigo-500"
        >
          <MessageCircle className="h-4 w-4" />
          Help
        </button>
      )}
    </div>
  );
}
