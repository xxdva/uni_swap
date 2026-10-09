import { auth } from "@/auth";

export const MAX_CERTIFICATE_BYTES = 3 * 1024 * 1024;

// Определяем тип по сигнатуре файла, а не по заявленному браузером
// Content-Type — иначе в «сертификат» можно подложить HTML/скрипт.
export function detectCertificateMime(bytes: Uint8Array): "application/pdf" | "image/jpeg" | "image/png" | null {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (startsWith([0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  return null;
}

// Проверять сертификаты могут менторы и админы — серверная проверка роли.
export async function requireReviewer() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")) {
    return null;
  }
  return session;
}
