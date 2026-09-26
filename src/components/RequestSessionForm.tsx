"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SkillRef } from "@/lib/matching";

export function RequestSessionForm({
  partnerId,
  teachOptions,
  learnOptions,
}: {
  partnerId: string;
  teachOptions: SkillRef[]; // навыки, которым может научить ОН(А) — вы учитесь
  learnOptions: SkillRef[]; // навыки, которым можете научить вы — он(а) учится
}) {
  const router = useRouter();
  const options = [...teachOptions, ...learnOptions];
  const [skillId, setSkillId] = useState(options[0]?.id ?? "");
  const [dateTime, setDateTime] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (options.length === 0) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dateTime) {
      setError("Укажите дату и время");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId, skillId, dateTime: new Date(dateTime).toISOString() }),
      });
      if (!res.ok) {
        setError("Не удалось создать заявку");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-rose-600 dark:text-rose-300">
        Заявка отправлена — статус смотрите на странице «Сессии».
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 pt-1">
      <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="input-field py-1 text-xs">
        {teachOptions.length > 0 && (
          <optgroup label="Хочу научиться">
            {teachOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
        {learnOptions.length > 0 && (
          <optgroup label="Могу научить">
            {learnOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <input
        type="datetime-local"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        className="input-field py-1 text-xs"
      />
      <button type="submit" disabled={pending} className="btn-primary px-3 py-1 text-xs">
        Предложить сессию
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
