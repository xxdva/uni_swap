"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type SkillType = "OFFER" | "WANT";

type UserSkillItem = {
  id: string;
  level: Level;
  skill: { id: string; name: string };
};

const LEVEL_LABEL: Record<Level, string> = {
  BEGINNER: "начальный",
  INTERMEDIATE: "средний",
  ADVANCED: "продвинутый",
};

export function SkillsManager({
  type,
  title,
  items,
}: {
  type: SkillType;
  title: string;
  items: UserSkillItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addSkill(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName: name.trim(), type, level }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "already_added" ? "Этот навык уже добавлен" : "Не удалось добавить навык");
        return;
      }

      setName("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function removeSkill(id: string) {
    await fetch(`/api/profile/skills/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">{title}</h2>

      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id} className="pill">
            <span>{item.skill.name}</span>
            <span className="text-rose-400">· {LEVEL_LABEL[item.level]}</span>
            <button
              type="button"
              onClick={() => removeSkill(item.id)}
              aria-label={`Удалить ${item.skill.name}`}
              className="text-rose-400 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted">Пока пусто</li>}
      </ul>

      <form onSubmit={addSkill} className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Figma"
          className="input-field py-1.5"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
          className="input-field py-1.5"
        >
          <option value="BEGINNER">начальный</option>
          <option value="INTERMEDIATE">средний</option>
          <option value="ADVANCED">продвинутый</option>
        </select>
        <button type="submit" disabled={pending} className="btn-primary px-3 py-1.5">
          Добавить
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
