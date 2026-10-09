"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";

type Notification = { id: string; requesterName: string; skillName: string; dateTime: string };

const POLL_INTERVAL_MS = 10000;

export function NotificationBell({ dict }: { dict: Dictionary["notifications"] }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/notifications");
      if (!res.ok || cancelled) return;
      const data: Notification[] = await res.json();
      if (!cancelled) setItems(data);
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.label}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-rose-700 hover:bg-rose-200 dark:text-rose-200"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-rose-200 bg-white p-2 shadow-lg dark:border-rose-900/40 dark:bg-rose-950">
          {items.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">{dict.empty}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href="/sessions"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-2 text-sm hover:bg-rose-100 dark:hover:bg-rose-900/30"
                  >
                    {format(dict.item, { name: n.requesterName, skill: n.skillName })}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
