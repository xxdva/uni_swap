const DEFAULT_ALLOWED_DOMAINS = ["astanait.edu.kz"];

function parseDomains(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_ALLOWED_DOMAINS;
  const domains = raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return domains.length > 0 ? domains : DEFAULT_ALLOWED_DOMAINS;
}

// ALLOWED_EMAIL_DOMAINS поддерживает список через запятую (сейчас включает
// личную почту для тестирования доставки писем, пока домен @astanait.edu.kz
// не подтверждён в Resend). Перед реальным запуском для студентов оставить
// только университетский домен.
const ALLOWED_DOMAINS = parseDomains(process.env.ALLOWED_EMAIL_DOMAINS);

export function isAllowedEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

export function getAllowedDomains(): string[] {
  return ALLOWED_DOMAINS;
}
