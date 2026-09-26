"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// Список только для текста на странице — реальная проверка всегда на сервере
// (/api/register, ALLOWED_EMAIL_DOMAINS). Personal-домены здесь временно,
// пока @astanait.edu.kz не подтверждён в Resend для реальной доставки писем —
// перед открытием доступа студентам оставить только университетский домен.
const DISPLAY_DOMAINS = ["astanait.edu.kz", "gmail.com", "icloud.com"];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError("Нужно согласие на обработку персональных данных");
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
        setError(data.message ?? "Не удалось отправить письмо. Попробуйте ещё раз.");
        return;
      }

      router.push("/check-email");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Вход в Uni Swap</h1>
        <p className="mt-1 text-sm text-muted">
          Доступно для почты: {DISPLAY_DOMAINS.map((d) => `@${d}`).join(", ")}. Мы
          пришлём ссылку для входа — пароль не нужен.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Университетская почта
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
          <span>
            Я согласен(на) на обработку персональных данных в соответствии с
            политикой конфиденциальности Uni Swap.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Отправляем…" : "Получить ссылку для входа"}
        </button>
      </form>
    </main>
  );
}
