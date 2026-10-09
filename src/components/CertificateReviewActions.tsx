"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/types";

export function CertificateReviewActions({ certificateId, dict }: { certificateId: string; dict: Dictionary["certs"] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setPending(action);
    try {
      await fetch(`/api/certificates/${certificateId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder={dict.notePlaceholder}
        className="input-field py-1.5"
      />
      <div className="flex items-center gap-2">
        <button type="button" disabled={pending !== null} onClick={() => act("approve")} className="btn-primary px-3 py-1 text-xs">
          {dict.approve}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => act("reject")}
          className="btn-outline px-3 py-1 text-xs"
        >
          {dict.reject}
        </button>
      </div>
    </div>
  );
}
