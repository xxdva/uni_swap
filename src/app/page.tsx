import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getDict } from "@/lib/i18n";

export default async function Home() {
  const [session, dict] = await Promise.all([auth(), getDict()]);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Image src="/logo.png" alt="Uni Swap" width={676} height={506} priority className="h-28 w-auto" />
      <h1 className="text-3xl font-semibold text-rose-700 dark:text-rose-200">Uni Swap</h1>
      <p className="text-muted">{dict.home.description}</p>
      <Link href={session?.user ? "/matches" : "/register"} className="btn-primary px-5 py-2.5">
        {session?.user ? dict.home.ctaLoggedIn : dict.home.ctaLoggedOut}
      </Link>
    </main>
  );
}
