"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES } from "@/lib/i18n/constants";
import type { Locale } from "@/lib/i18n/types";

const LABELS: Record<Locale, string> = { ru: "RU", en: "EN", kk: "KZ" };

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Locale>(current);

  // Пока selected не совпадает с current (пропом, отражающим cookie на
  // сервере) — синхронизируем внешнее состояние (cookie) и просим Server
  // Components перечитать его. Когда проп обновится, эффект станет no-op
  // сам по себе — отдельный сброс состояния не нужен.
  useEffect(() => {
    if (selected === current) return;
    document.cookie = `lang=${selected}; path=/; max-age=31536000`;
    router.refresh();
  }, [selected, current, router]);

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => setSelected(locale)}
          aria-current={locale === current}
          className={
            locale === current
              ? "rounded px-1.5 py-0.5 bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950"
              : "rounded px-1.5 py-0.5 text-rose-700 hover:bg-rose-200 dark:text-rose-200 dark:hover:bg-rose-900/40"
          }
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
