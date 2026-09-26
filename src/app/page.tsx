import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold text-rose-700 dark:text-rose-200">Uni Swap</h1>
      <p className="text-muted">
        Обменивайтесь навыками с другими студентами: научите тому, что умеете,
        и найдите того, кто научит вас.
      </p>
      <Link href={session?.user ? "/matches" : "/register"} className="btn-primary px-5 py-2.5">
        {session?.user ? "Смотреть совпадения" : "Начать"}
      </Link>
    </main>
  );
}
