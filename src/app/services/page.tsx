import Link from "next/link";
import { auth } from "@/auth";
import { getDict } from "@/lib/i18n";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  className: "h-6 w-6",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Иконки по порядку услуг s1…s10.
const ICONS = [
  <svg key="1" {...ICON_PROPS}><path d="M7 7h12l-3.5-3.5M19 17H7l3.5 3.5" /></svg>,
  <svg key="2" {...ICON_PROPS}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>,
  <svg key="3" {...ICON_PROPS}><path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4c-1.3 0-2.6-.3-3.7-.9L3 20l1-5.9a8.4 8.4 0 1 1 17-2.6Z" /></svg>,
  <svg key="4" {...ICON_PROPS}><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z" /></svg>,
  <svg key="5" {...ICON_PROPS}><circle cx="12" cy="8" r="5" /><path d="M8.5 13 7 21l5-3 5 3-1.5-8" /></svg>,
  <svg key="6" {...ICON_PROPS}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  <svg key="7" {...ICON_PROPS}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  <svg key="8" {...ICON_PROPS}><path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" /><path d="M8 9h8M8 13h8" /></svg>,
  <svg key="9" {...ICON_PROPS}><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>,
  <svg key="10" {...ICON_PROPS}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>,
];

export default async function ServicesPage() {
  const [session, dict] = await Promise.all([auth(), getDict()]);
  const t = dict.services;
  const d = t as unknown as Record<string, string>;

  const services = ICONS.map((icon, i) => ({
    icon,
    title: d[`s${i + 1}Title`],
    desc: d[`s${i + 1}Desc`],
  }));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-rose-700 dark:text-rose-200">{t.title}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted">{t.subtitle}</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <li key={i} className="card flex flex-col gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950">
              {s.icon}
            </span>
            <h2 className="font-medium text-rose-700 dark:text-rose-200">{s.title}</h2>
            <p className="text-sm text-muted">{s.desc}</p>
          </li>
        ))}
      </ul>

      <section className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-b from-rose-100 to-white px-6 py-10 text-center dark:from-rose-950/40 dark:to-transparent">
        <h2 className="text-xl font-semibold text-rose-700 dark:text-rose-200">{t.ctaTitle}</h2>
        <Link href={session?.user ? "/matches" : "/register"} className="btn-primary px-6 py-3 text-base">
          {session?.user ? t.ctaLoggedIn : t.ctaButton}
        </Link>
      </section>
    </main>
  );
}
