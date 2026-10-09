import { createHash, timingSafeEqual } from "crypto";

export type PrivilegedRole = "MENTOR" | "ADMIN";

const ENV_BY_ROLE: Record<PrivilegedRole, string> = {
  MENTOR: "MENTOR_SECRET_CODE",
  ADMIN: "ADMIN_SECRET_CODE",
};

const sha = (v: string) => createHash("sha256").update(v).digest();

// Роль STUDENT доступна всем. Для MENTOR и ADMIN нужен секретный код из
// переменных окружения; если код на сервере не задан, роль недоступна
// никому (а не открыта всем). Сравнение — по хэшам, в постоянное время.
export function isRoleCodeValid(role: "STUDENT" | PrivilegedRole, code: string | undefined): boolean {
  if (role === "STUDENT") return true;
  const expected = process.env[ENV_BY_ROLE[role]];
  if (!expected || !code) return false;
  return timingSafeEqual(sha(code.trim()), sha(expected.trim()));
}
