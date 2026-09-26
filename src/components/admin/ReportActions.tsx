"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function act(action: "resolve" | "dismiss") {
    setPending(action);
    try {
      await fetch(`/api/admin/reports/${reportId}/${action}`, { method: "POST" });
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
        onClick={() => act("resolve")}
        className="btn-primary px-3 py-1 text-xs"
      >
        Решено
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => act("dismiss")}
        className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-900/30"
      >
        Отклонить
      </button>
    </div>
  );
}
