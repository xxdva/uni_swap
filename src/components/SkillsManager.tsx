"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";
import { getSkillIcon } from "@/components/ToolIcons";
import { categoryLabel, skillLabel } from "@/lib/i18n/labels";

type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type SkillType = "OFFER" | "WANT";

type UserSkillItem = {
  id: string;
  level: Level;
  skill: { id: string; name: string };
};

export type CatalogSkill = { id: string; name: string; category: string | null };

const OTHER = "—";

export function SkillsManager({
  type,
  title,
  items,
  catalog,
  locale,
  dict,
}: {
  type: SkillType;
  title: string;
  items: UserSkillItem[];
  catalog: CatalogSkill[];
  locale: string;
  dict: Dictionary["skills"];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const LEVEL_LABEL: Record<Level, string> = {
    BEGINNER: dict.levelBeginner,
    INTERMEDIATE: dict.levelIntermediate,
    ADVANCED: dict.levelAdvanced,
  };

  const addedIds = useMemo(() => new Set(items.map((i) => i.skill.id)), [items]);
  const categories = useMemo(() => Array.from(new Set(catalog.map((s) => s.category ?? OTHER))), [catalog]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(
      (s) => (category === null || (s.category ?? OTHER) === category) && (!q || s.name.toLowerCase().includes(q) || skillLabel(s.name, locale).toLowerCase().includes(q))
    );
  }, [catalog, query, category, locale]);

  async function addSkill(skillId: string) {
    setPendingId(skillId);
    setError(null);
    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, type, level }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "already_added" ? dict.alreadyAdded : dict.addError);
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function removeSkill(id: string) {
    await fetch(`/api/profile/skills/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const chipClass = (active: boolean) =>
    `chip px-3 py-1 text-xs ${active ? "chip-active" : ""}`;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">{title}</h2>

      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id} className="pill">
            {getSkillIcon(item.skill.name, 18)}
            <span>{skillLabel(item.skill.name, locale)}</span>
            <span className="text-rose-400">· {LEVEL_LABEL[item.level]}</span>
            <button
              type="button"
              onClick={() => removeSkill(item.id)}
              aria-label={format(dict.removeLabel, { name: skillLabel(item.skill.name, locale) })}
              className="text-rose-400 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted">{dict.empty}</li>}
      </ul>

      <div className="card flex flex-col gap-3 hover:translate-y-0 hover:shadow-none">
        <p className="text-xs text-muted">{dict.pickHint}</p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="input-field py-1.5"
          />
          <label className="flex items-center gap-2 text-sm">
            {dict.levelLabel}
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="input-field py-1.5">
              <option value="BEGINNER">{dict.levelBeginner}</option>
              <option value="INTERMEDIATE">{dict.levelIntermediate}</option>
              <option value="ADVANCED">{dict.levelAdvanced}</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setCategory(null)} className={chipClass(category === null)}>
            {dict.allCategories}
          </button>
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={chipClass(category === c)}>
              {categoryLabel(c, locale)}
            </button>
          ))}
        </div>

        <ul className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {visible.map((s) => {
            const added = addedIds.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={added || pendingId !== null}
                  onClick={() => addSkill(s.id)}
                  className="tile flex h-full w-full flex-col items-start gap-1 p-3 text-sm"
                >
                  <span className="text-strong flex items-center gap-2 font-medium">
                    {getSkillIcon(s.name, 18)}
                    {skillLabel(s.name, locale)}
                  </span>
                  <span className="text-xs text-muted">{added ? `✓ ${dict.addedMark}` : categoryLabel(s.category ?? OTHER, locale)}</span>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="col-span-full text-sm text-muted">{dict.noResults}</li>}
        </ul>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
