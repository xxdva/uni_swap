// Серверный хелпер для темы (светлая/тёмная) — по аналогии с lang-cookie в
// src/lib/i18n/index.ts. Используется только в Server Components (next/headers),
// клиентский переключатель (ThemeToggle) держит тип "light" | "dark" у себя,
// чтобы не тащить next/headers в клиентский бандл.
import { cookies } from "next/headers";

export async function getTheme(): Promise<"light" | "dark"> {
  const store = await cookies();
  return store.get("theme")?.value === "dark" ? "dark" : "light";
}
