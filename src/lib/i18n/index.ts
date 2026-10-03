import { cookies } from "next/headers";
import { ru } from "./ru";
import { en } from "./en";
import { kk } from "./kk";
import { DEFAULT_LOCALE, isLocale } from "./constants";
import type { Dictionary, Locale } from "./types";

// Серверный барэл (использует next/headers) — импортировать только из
// Server Components. Client Components должны брать Dictionary/Locale из
// "@/lib/i18n/types", LOCALES/isLocale из "@/lib/i18n/constants" и
// format() из "@/lib/i18n/format" напрямую, иначе next/headers попадёт
// в клиентский бандл и сборка упадёт.
export type { Dictionary, Locale } from "./types";
export { format } from "./format";
export { LOCALES, DEFAULT_LOCALE, isLocale } from "./constants";

const dictionaries: Record<Locale, Dictionary> = { ru, en, kk };

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("lang")?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export async function getDict(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
