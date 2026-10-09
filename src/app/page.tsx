import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { HackathonsPanel, ItNewsPanel } from "@/components/NewsFeed";
import { REGIONS, getHackathonNews, getItNews } from "@/lib/news";

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h12l-3.5-3.5M19 17H7l3.5 3.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4c-1.3 0-2.6-.3-3.7-.9L3 20l1-5.9a8.4 8.4 0 1 1 17-2.6Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z" />
    </svg>
  );
}

export default async function Home() {
  const [session, dict, locale, hackathons, itNews] = await Promise.all([
    auth(),
    getDict(),
    getLocale(),
    getHackathonNews(),
    getItNews(),
  ]);

  const features = [
    { icon: <SwapIcon />, title: dict.home.feature1Title, desc: dict.home.feature1Desc },
    { icon: <ChatIcon />, title: dict.home.feature2Title, desc: dict.home.feature2Desc },
    { icon: <StarIcon />, title: dict.home.feature3Title, desc: dict.home.feature3Desc },
  ];

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,15rem)] xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,17rem)] lg:items-start">
      {/* Центр идёт первым в разметке, чтобы на мобильных он был сверху; на десктопе — вторая колонка. */}
      <div className="flex flex-col gap-8 lg:order-2">
        <section className="rounded-2xl bg-gradient-to-b from-rose-100 to-white px-6 py-12 text-center dark:from-rose-950/40 dark:to-transparent">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
            <Image src="/logo.png" alt="Uni Swap" width={676} height={506} priority className="h-24 w-auto" />
            <h1 className="text-4xl font-semibold text-rose-700 dark:text-rose-200">Uni Swap</h1>
            <p className="text-lg text-muted">{dict.home.description}</p>
            <Link href={session?.user ? "/matches" : "/register"} className="btn-primary px-6 py-3 text-base">
              {session?.user ? dict.home.ctaLoggedIn : dict.home.ctaLoggedOut}
            </Link>
            {!session?.user && (
              <Link href="/login" className="text-sm text-rose-700 underline dark:text-rose-200">
                {dict.nav.login}
              </Link>
            )}
          </div>
        </section>

        <Link
          href="/services"
          className="group flex items-center justify-between gap-4 rounded-2xl bg-rose-500 px-8 py-6 text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-lg dark:bg-rose-400 dark:text-rose-950 dark:hover:bg-rose-300"
        >
          <span className="flex flex-col gap-1">
            <span className="text-2xl font-semibold">{dict.home.servicesCta}</span>
            <span className="text-sm opacity-90">{dict.home.servicesCtaHint}</span>
          </span>
          <span className="text-3xl transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </Link>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {features.map((f, i) => (
            <div key={i} className="card flex flex-col items-center gap-3 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950">
                {f.icon}
              </span>
              <h3 className="font-medium text-rose-700 dark:text-rose-200">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </section>
      </div>

      <div className="lg:order-1">
        <HackathonsPanel hackathons={hackathons} regions={REGIONS.map((r) => r.name)} locale={locale} dict={dict.home} />
      </div>

      <div className="lg:order-3">
        <ItNewsPanel itNews={itNews} locale={locale} dict={dict.home} />
      </div>
    </main>
  );
}
