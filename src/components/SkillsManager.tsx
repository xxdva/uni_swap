"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";
import { getSkillIcon } from "@/components/ToolIcons";

type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type SkillType = "OFFER" | "WANT";

type UserSkillItem = {
  id: string;
  level: Level;
  skill: { id: string; name: string };
};

export function SkillsManager({
  type,
  title,
  items,
  dict,
}: {
  type: SkillType;
  title: string;
  items: UserSkillItem[];
  dict: Dictionary["skills"];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LEVEL_LABEL: Record<Level, string> = {
    BEGINNER: dict.levelBeginner,
    INTERMEDIATE: dict.levelIntermediate,
    ADVANCED: dict.levelAdvanced,
  };

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
        setError(data.error === "already_added" ? dict.alreadyAdded : dict.addError);
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
            {getSkillIcon(item.skill.name, 18)}
            <span>{item.skill.name}</span>
            <span className="text-rose-400">· {LEVEL_LABEL[item.level]}</span>
            <button
              type="button"
              onClick={() => removeSkill(item.id)}
              aria-label={format(dict.removeLabel, { name: item.skill.name })}
              className="text-rose-400 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted">{dict.empty}</li>}
      </ul>

      <form onSubmit={addSkill} className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.namePlaceholder}
          className="input-field py-1.5"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
          className="input-field py-1.5"
        >
          <option value="BEGINNER">{dict.levelBeginner}</option>
          <option value="INTERMEDIATE">{dict.levelIntermediate}</option>
          <option value="ADVANCED">{dict.levelAdvanced}</option>
        </select>
        <button type="submit" disabled={pending} className="btn-primary px-3 py-1.5">
          {dict.add}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
