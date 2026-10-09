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
          <a href={n.url} target="_blank" rel="noopener noreferrer" className="card flex flex-col gap-1">
            <span className="font-medium text-rose-800">{n.title}</span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {n.region && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">{n.region}</span>}
              <span>{n.source}</span>
              <span>· {new Date(n.date).toLocaleDateString(LOCALE_TAG[locale] ?? "ru-RU", { day: "numeric", month: "long" })}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function NewsFeed({
  hackathons,
  itNews,
  regions,
  locale,
  dict,
}: {
  hackathons: NewsItem[];
  itNews: NewsItem[];
  regions: string[];
  locale: string;
  dict: Dictionary["home"];
}) {
  const [region, setRegion] = useState<string | null>(null);
  // Показываем только регионы, по которым реально есть новости.
  const available = useMemo(() => regions.filter((r) => hackathons.some((h) => h.region === r)), [regions, hackathons]);
  const visible = useMemo(
    () => (region ? hackathons.filter((h) => h.region === region) : hackathons).slice(0, 10),
    [hackathons, region]
  );

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition-colors ${
      active
        ? "border-rose-500 bg-rose-500 text-white"
        : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
    }`;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-16">
      <div>
        <h2 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.newsTitle}</h2>
        <p className="text-sm text-muted">{dict.newsSubtitle}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-rose-700 dark:text-rose-200">{dict.hackathonsTitle}</h3>
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
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-rose-700 dark:text-rose-200">{dict.itNewsTitle}</h3>
          <NewsList items={itNews} locale={locale} empty={dict.newsEmpty} />
        </div>
      </div>
    </section>
  );
}
