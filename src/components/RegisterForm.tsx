"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";

type Role = "STUDENT" | "MENTOR" | "ADMIN";

export function RegisterForm({
  dict,
  allowedDomains,
}: {
  dict: Dictionary["register"];
  allowedDomains: string[] | "any";
}) {
  const router = useRouter();
  const isOpen = allowedDomains === "any";
  const domainsText = isOpen ? "" : allowedDomains.map((d) => `@${d}`).join(", ");
  const placeholderDomain = isOpen ? "example.com" : allowedDomains[0];
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError(dict.consentError);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, consent }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error === "domain_not_allowed" ? format(dict.domainError, { domains: domainsText }) : dict.genericError
        );
        return;
      }

      router.push("/check-email");
    } catch {
      setError(dict.networkError);
    } finally {
      setPending(false);
    }
  }

  const roles: { value: Role; label: string; desc: string }[] = [
    { value: "STUDENT", label: dict.roleUser, desc: dict.roleUserDesc },
    { value: "MENTOR", label: dict.roleMentor, desc: dict.roleMentorDesc },
    { value: "ADMIN", label: dict.roleAdmin, desc: dict.roleAdminDesc },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {isOpen ? dict.subtitleOpen : format(dict.subtitle, { domains: domainsText })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {dict.emailLabel}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`ivan.ivanov@${placeholderDomain}`}
            className="input-field"
          />
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">{dict.roleLabel}</legend>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <label
                key={r.value}
                className={`card flex cursor-pointer flex-col gap-0.5 p-3 ${
                  role === r.value ? "border-rose-500 ring-2 ring-rose-300" : ""
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <span className="font-medium text-rose-700 dark:text-rose-200">{r.label}</span>
                <span className="text-xs text-muted">{r.desc}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>{dict.consentLabel}</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? dict.submitting : dict.submit}
        </button>
      </form>
    </main>
  );
}
