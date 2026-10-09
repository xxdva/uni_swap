"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/types";

export function MentorApplicationForm({ dict }: { dict: Dictionary["mentor"] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined }),
      });
      if (!res.ok) {
        setError(dict.applyError);
        return;
      }
      setSent(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return <p className="card text-sm text-muted">{dict.applyPending}</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={dict.applyMessagePlaceholder}
        rows={3}
        className="input-field"
      />
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {dict.applySubmit}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
