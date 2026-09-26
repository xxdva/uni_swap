"use client";

import { useState } from "react";

export function ReportButton({ targetId }: { targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  if (sent) return <span className="text-xs text-muted">Жалоба отправлена</span>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-rose-400 hover:text-red-600"
      >
        Пожаловаться
      </button>
    );
  }

  async function submit() {
    if (!reason.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, reason: reason.trim() }),
      });
      if (res.ok) setSent(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Причина жалобы"
        className="input-field py-1 text-xs"
      />
      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
      >
        Отправить
      </button>
    </div>
  );
}
