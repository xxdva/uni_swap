"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/types";

export function SessionActions({
  id,
  canAccept,
  canCancel,
  canComplete,
  dict,
}: {
  id: string;
  canAccept: boolean;
  canCancel: boolean;
  canComplete: boolean;
  dict: Dictionary["sessionActions"];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState("");

  async function act(action: "accept" | "cancel" | "complete", body?: object) {
    setPending(action);
    try {
      await fetch(`/api/sessions/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  if (!canAccept && !canCancel && !canComplete) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {canAccept && (
        <input
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder={dict.meetingLinkPlaceholder}
          className="input-field py-1 text-xs"
        />
      )}
      {canAccept && (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => act("accept", { meetingLink: meetingLink || undefined })}
          className="btn-primary px-3 py-1 text-xs"
        >
          {dict.accept}
        </button>
      )}
      {canComplete && (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => act("complete")}
          className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-900/30"
        >
          {dict.complete}
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => act("cancel")}
          className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
        >
          {dict.cancel}
        </button>
      )}
    </div>
  );
}
