import { auth } from "@/auth";

// Единая проверка роли для admin-роутов (API и страниц) — серверная,
// а не только скрытие ссылки в навигации.
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
