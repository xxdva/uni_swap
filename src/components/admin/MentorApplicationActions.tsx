"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/types";

export function MentorApplicationActions({
  applicationId,
  dict,
}: {
  applicationId: string;
  dict: Dictionary["admin"];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setPending(action);
    try {
      await fetch(`/api/admin/mentor-applications/${applicationId}/${action}`, { method: "POST" });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => act("approve")}
        className="btn-primary px-3 py-1 text-xs"
      >
        {dict.mentorApprove}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => act("reject")}
        className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-900/30"
      >
        {dict.mentorReject}
      </button>
    </div>
  );
}
