import { getDict } from "@/lib/i18n";

export default async function CheckEmailPage() {
  const dict = await getDict();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </span>
      <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.checkEmail.title}</h1>
      <p className="text-sm text-muted">{dict.checkEmail.body}</p>
    </main>
  );
}
