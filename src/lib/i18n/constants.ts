import type { Locale } from "./types";

export const LOCALES: Locale[] = ["ru", "en", "kk"];
export const DEFAULT_LOCALE: Locale = "ru";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}
