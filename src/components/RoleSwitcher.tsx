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
  const [pending, setPending] = useState(false);
  // Роль, для которой ждём секретный код (MENTOR/ADMIN).
  const [needsCode, setNeedsCode] = useState<Role | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const roles: { value: Role; label: string }[] = [
    { value: "STUDENT", label: dict.roleUser },
    { value: "MENTOR", label: dict.roleMentor },
    { value: "ADMIN", label: dict.roleAdmin },
  ];

  async function change(role: Role, roleCode?: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, roleCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "invalid_role_code" ? dict.roleCodeError : dict.genericError);
        return;
      }
      setNeedsCode(null);
      setCode("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  function select(role: Role) {
    if (role === current) return;
    setError(null);
    if (role === "STUDENT") {
      setNeedsCode(null);
      void change(role);
    } else {
      setNeedsCode(role);
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
            disabled={pending}
            onClick={() => select(r.value)}
            className={`chip px-4 py-1.5 text-sm ${
              current === r.value ? "chip-active" : needsCode === r.value ? "border-rose-500" : ""
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {needsCode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void change(needsCode, code);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={dict.roleCodePlaceholder}
            aria-label={dict.roleCodeLabel}
            className="input-field py-1.5"
            required
          />
          <button type="submit" disabled={pending} className="btn-primary px-3 py-1.5">
            {dict.roleCodeConfirm}
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
