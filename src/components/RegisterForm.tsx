"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";

// Список только для текста на странице — реальная проверка всегда на сервере
// (/api/register, ALLOWED_EMAIL_DOMAINS). Personal-домены здесь временно,
// пока @astanait.edu.kz не подтверждён в Resend для реальной доставки писем —
// перед открытием доступа студентам оставить только университетский домен.
const DISPLAY_DOMAINS = ["astanait.edu.kz", "gmail.com", "icloud.com"];
const DOMAINS_TEXT = DISPLAY_DOMAINS.map((d) => `@${d}`).join(", ");

export function RegisterForm({ dict }: { dict: Dictionary["register"] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, consent }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error === "domain_not_allowed" ? format(dict.domainError, { domains: DOMAINS_TEXT }) : dict.genericError
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

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.title}</h1>
        <p className="mt-1 text-sm text-muted">{format(dict.subtitle, { domains: DOMAINS_TEXT })}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {dict.emailLabel}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`ivan.ivanov@${DISPLAY_DOMAINS[0]}`}
            className="input-field"
          />
        </label>

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
