import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { SignOutButton } from "@/components/SignOutButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";

export async function Nav() {
  const [session, dict, locale] = await Promise.all([auth(), getDict(), getLocale()]);

  return (
    <header className="flex items-center justify-between border-b border-rose-300 bg-rose-100 px-6 py-3 dark:border-rose-900/40 dark:bg-rose-950/30">
      <Link href="/" className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-200">
        <Image src="/logo.png" alt="" width={676} height={506} priority className="h-8 w-auto" />
        Uni Swap
      </Link>

      <nav className="flex items-center gap-4">
        {session?.user ? (
          <>
            <Link href="/profile" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              {dict.nav.profile}
            </Link>
            <Link href="/matches" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              {dict.nav.matches}
            </Link>
            <Link href="/sessions" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              {dict.nav.sessions}
            </Link>
            <Link href="/chat" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              {dict.nav.chat}
            </Link>
            <Link href="/mentor" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              {dict.nav.mentor}
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
                {dict.nav.admin}
              </Link>
            )}
            <NotificationBell dict={dict.notifications} />
            <SignOutButton label={dict.nav.logout} />
          </>
        ) : (
          <Link href="/register" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
            {dict.nav.login}
          </Link>
        )}
        <LanguageSwitcher current={locale} />
      </nav>
    </header>
  );
}
