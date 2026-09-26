"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/register" })}
      className="text-sm text-rose-500 hover:text-rose-800 dark:text-rose-300 dark:hover:text-white"
    >
      Выйти
    </button>
  );
}
