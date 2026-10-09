"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M21 12.3A9 9 0 1 1 11.7 3a7 7 0 0 0 9.3 9.3Z" />
    </svg>
  );
}

export function ThemeToggle({ current, label }: { current: "light" | "dark"; label: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">(current);

  // Тот же паттерн, что в LanguageSwitcher: ждём, пока cookie (theme)
  // не совпадёт с пропом current (отражающим cookie на сервере), и просим
  // Server Components перечитать её через router.refresh().
  useEffect(() => {
    if (theme === current) return;
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
    router.refresh();
  }, [theme, current, router]);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={label}
      className="rounded-full p-1.5 text-rose-700 transition-colors hover:bg-rose-200 dark:text-rose-200 dark:hover:bg-rose-900/40"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
