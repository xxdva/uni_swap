import { createHash, timingSafeEqual } from "crypto";

export type PrivilegedRole = "MENTOR" | "ADMIN";

const ENV_BY_ROLE: Record<PrivilegedRole, string> = {
  MENTOR: "MENTOR_SECRET_CODE",
  ADMIN: "ADMIN_SECRET_CODE",
};

const sha = (v: string) => createHash("sha256").update(v).digest();
// Регистр и пробелы по краям не важны — код можно задать простым словом.
const normalize = (v: string) => v.trim().toLowerCase();

// Роль STUDENT доступна всем. Для MENTOR и ADMIN нужен код из переменных
// окружения; если он на сервере не задан, роль недоступна никому (а не
// открыта всем). Сравнение — по хэшам, в постоянное время.
export function isRoleCodeValid(role: "STUDENT" | PrivilegedRole, code: string | undefined): boolean {
  if (role === "STUDENT") return true;
  const expected = process.env[ENV_BY_ROLE[role]]?.trim();
  if (!expected || !code) return false;
  return timingSafeEqual(sha(normalize(code)), sha(normalize(expected)));
}
