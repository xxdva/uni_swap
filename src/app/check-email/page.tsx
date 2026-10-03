import { getDict } from "@/lib/i18n";

export default async function CheckEmailPage() {
  const dict = await getDict();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.checkEmail.title}</h1>
      <p className="text-sm text-muted">{dict.checkEmail.body}</p>
    </main>
  );
}
