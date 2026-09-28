"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, text: text.trim() || undefined }),
      });
      if (!res.ok) {
        setError("Не удалось отправить отзыв");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 pt-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} из 5`}
            className={`text-lg leading-none ${n <= rating ? "text-rose-500" : "text-rose-200"}`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Комментарий (необязательно)"
        className="input-field py-1 text-xs"
      />
      <button type="submit" disabled={pending} className="btn-primary self-start px-3 py-1 text-xs">
        Оставить отзыв
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
