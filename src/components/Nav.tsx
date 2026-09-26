import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";

export async function Nav() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b border-rose-300 bg-rose-100 px-6 py-3 dark:border-rose-900/40 dark:bg-rose-950/30">
      <Link href="/" className="font-semibold text-rose-700 dark:text-rose-200">
        Uni Swap
      </Link>

      <nav className="flex items-center gap-4">
        {session?.user ? (
          <>
            <Link href="/profile" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              Профиль
            </Link>
            <Link href="/matches" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              Совпадения
            </Link>
            <Link href="/sessions" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              Сессии
            </Link>
            <Link href="/chat" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
              Чат
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
                Админка
              </Link>
            )}
            <SignOutButton />
          </>
        ) : (
          <Link href="/register" className="text-sm text-rose-700 hover:underline dark:text-rose-200">
            Войти
          </Link>
        )}
      </nav>
    </header>
  );
}
