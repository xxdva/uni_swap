"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/types";

type Role = "STUDENT" | "MENTOR" | "ADMIN";

export function RoleSwitcher({
  current,
  title,
  hint,
  dict,
}: {
  current: Role;
  title: string;
  hint: string;
  dict: Dictionary["register"];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Role | null>(null);

  const roles: { value: Role; label: string }[] = [
    { value: "STUDENT", label: dict.roleUser },
    { value: "MENTOR", label: dict.roleMentor },
    { value: "ADMIN", label: dict.roleAdmin },
  ];

  async function change(role: Role) {
    if (role === current) return;
    setPending(role);
    try {
      await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">{title}</h2>
      <p className="text-sm text-muted">{hint}</p>
      <div className="flex gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={pending !== null}
            onClick={() => change(r.value)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              current === r.value
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </section>
  );
}
