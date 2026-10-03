"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Dictionary } from "@/lib/i18n/types";

type Message = { id: string; senderId: string; text: string; createdAt: string };

const POLL_INTERVAL_MS = 3000;

export function ChatThread({
  meId,
  otherUserId,
  initialMessages,
  dict,
}: {
  meId: string;
  otherUserId: string;
  initialMessages: Message[];
  dict: Dictionary["chat"];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);

  // Простой поллинг вместо WebSocket — по плану это первая версия чата.
  useEffect(() => {
    const interval = setInterval(async () => {
      const params = new URLSearchParams({ with: otherUserId });
      if (lastCreatedAtRef.current) params.set("since", lastCreatedAtRef.current);

      const res = await fetch(`/api/messages?${params}`);
      if (!res.ok) return;
      const fresh: Message[] = await res.json();
      if (fresh.length === 0) return;

      setMessages((prev) => [...prev, ...fresh]);
      lastCreatedAtRef.current = fresh.at(-1)!.createdAt;
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: otherUserId, text: trimmed }),
      });
      if (!res.ok) return;
      const created: Message = await res.json();
      setMessages((prev) => [...prev, created]);
      lastCreatedAtRef.current = created.createdAt;
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-sm text-muted">{dict.threadEmpty}</p>}
        {messages.map((m) => {
          const isMine = m.senderId === meId;
          return (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                isMine
                  ? "self-end bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950"
                  : "self-start bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-50"
              }`}
            >
              {m.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-rose-200 pt-3 dark:border-rose-900/40">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={dict.messagePlaceholder}
          className="input-field flex-1"
        />
        <button type="submit" disabled={sending} className="btn-primary px-4 py-2">
          {dict.send}
        </button>
      </form>
    </div>
  );
}
