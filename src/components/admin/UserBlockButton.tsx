"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UserBlockButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await fetch(`/api/admin/users/${userId}/${isBlocked ? "unblock" : "block"}`, { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      className={
        isBlocked
          ? "rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-900/30"
          : "rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
      }
    >
      {isBlocked ? "Разблокировать" : "Заблокировать"}
    </button>
  );
}
