"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n/types";
import type { NewsItem } from "@/lib/news";

const LOCALE_TAG: Record<string, string> = { ru: "ru-RU", en: "en-GB", kk: "kk-KZ" };

function NewsList({ items, locale, empty }: { items: NewsItem[]; locale: string; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((n) => (
        <li key={n.url}>
          <a href={n.url} target="_blank" rel="noopener noreferrer" className="card flex flex-col gap-1 p-3">
            <span className="line-clamp-3 text-sm font-medium text-rose-800">{n.title}</span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              {n.region && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">{n.region}</span>}
              <span className="truncate">{n.source}</span>
              <span>
                · {new Date(n.date).toLocaleDateString(LOCALE_TAG[locale] ?? "ru-RU", { day: "numeric", month: "short" })}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// Боковые колонки главной: на десктопе «прилипают» к краям экрана и
// скроллятся независимо от центра, на мобильных идут под основным блоком.
const PANEL = "flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1";

export function HackathonsPanel({
  hackathons,
  regions,
  locale,
  dict,
}: {
  hackathons: NewsItem[];
  regions: string[];
  locale: string;
  dict: Dictionary["home"];
}) {
  const [region, setRegion] = useState<string | null>(null);
  // Показываем только регионы, по которым реально есть новости.
  const available = useMemo(() => regions.filter((r) => hackathons.some((h) => h.region === r)), [regions, hackathons]);
  const visible = useMemo(
    () => (region ? hackathons.filter((h) => h.region === region) : hackathons).slice(0, 12),
    [hackathons, region]
  );

  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
      active
        ? "border-rose-500 bg-rose-500 text-white"
        : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
    }`;

  return (
    <aside className={PANEL}>
      <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-200">{dict.hackathonsTitle}</h2>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setRegion(null)} className={chip(region === null)}>
          {dict.regionAll}
        </button>
        {available.map((r) => (
          <button key={r} type="button" onClick={() => setRegion(r)} className={chip(region === r)}>
            {r}
          </button>
        ))}
      </div>
      <NewsList items={visible} locale={locale} empty={dict.newsEmpty} />
    </aside>
  );
}

export function ItNewsPanel({ itNews, locale, dict }: { itNews: NewsItem[]; locale: string; dict: Dictionary["home"] }) {
  return (
    <aside className={PANEL}>
      <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-200">{dict.itNewsTitle}</h2>
      <p className="text-xs text-muted">{dict.newsSubtitle}</p>
      <NewsList items={itNews} locale={locale} empty={dict.newsEmpty} />
    </aside>
  );
}
