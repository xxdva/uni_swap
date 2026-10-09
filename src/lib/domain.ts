const DEFAULT_ALLOWED_DOMAINS = ["astanait.edu.kz"];

type AllowedDomains = string[] | "any";

function parseDomains(raw: string | undefined): AllowedDomains {
  if (!raw) return DEFAULT_ALLOWED_DOMAINS;
  if (raw.trim() === "*") return "any";

  const domains = raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return domains.length > 0 ? domains : DEFAULT_ALLOWED_DOMAINS;
}

// ALLOWED_EMAIL_DOMAINS: список доменов через запятую, либо "*" — открытая
// регистрация для любого email (требует подтверждённого домена в Resend,
// иначе письма реально дойдут только до владельца аккаунта Resend).
const ALLOWED_DOMAINS = parseDomains(process.env.ALLOWED_EMAIL_DOMAINS);

export function isAllowedEmail(email: string): boolean {
  if (ALLOWED_DOMAINS === "any") {
    // Всё ещё требуем валидный на вид домен (а не просто "@"), а не
    // разрешаем вообще что угодно — реальная проверка формата на zod в API.
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

export function getAllowedDomains(): AllowedDomains {
  return ALLOWED_DOMAINS;
}
