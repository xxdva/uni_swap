import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getDict } from "@/lib/i18n";
import { ExcelIcon, FigmaIcon, PowerBiIcon, PythonIcon, WordIcon } from "@/components/ToolIcons";

export default async function Home() {
  const [session, dict] = await Promise.all([auth(), getDict()]);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Image src="/logo.png" alt="Uni Swap" width={676} height={506} priority className="h-28 w-auto" />
      <h1 className="text-3xl font-semibold text-rose-700 dark:text-rose-200">Uni Swap</h1>
      <p className="text-muted">{dict.home.description}</p>
      <Link href={session?.user ? "/matches" : "/register"} className="btn-primary px-5 py-2.5">
        {session?.user ? dict.home.ctaLoggedIn : dict.home.ctaLoggedOut}
      </Link>

      <div className="mt-10 flex flex-col items-center gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{dict.home.toolsLabel}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <PythonIcon />
          <PowerBiIcon />
          <FigmaIcon />
          <ExcelIcon />
          <WordIcon />
        </div>
      </div>
    </main>
  );
}
