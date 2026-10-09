import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAllowedEmail, getAllowedDomains } from "@/lib/domain";
import { signIn } from "@/auth";

const schema = z.object({
  email: z.string().email(),
  // Роль задаётся при создании аккаунта; менять её потом можно в профиле
  // (/api/profile/role, только для вошедшего) — здесь чужую роль не трогаем.
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]).default("STUDENT"),
  consent: z.boolean().refine((v) => v === true, {
    message: "Нужно согласие на обработку персональных данных",
  }),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  if (!isAllowedEmail(email)) {
    const allowed = getAllowedDomains();
    const message =
      allowed === "any"
        ? "Введите корректный email"
        : `Регистрация доступна только на почту: ${allowed.map((d) => `@${d}`).join(", ")}`;
    return NextResponse.json({ error: "domain_not_allowed", message }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.isBlocked) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

  // Пользователь создаётся сразу (ещё не подтверждён), чтобы зафиксировать
  // момент согласия на обработку данных вместе с самой регистрацией.
  await prisma.user.upsert({
    where: { email },
    create: { email, role: parsed.data.role, consentAt: new Date() },
    update: existing?.emailVerified ? {} : { consentAt: new Date() },
  });

  // Auth.js не бросает исключение при сбое sendVerificationRequest (например,
  // неверные SMTP-креды) — вместо этого signIn(..., { redirect: false })
  // молча возвращает ссылку на страницу /api/auth/error. Поэтому проверяем
  // именно результат, а не полагаемся на try/catch.
  // Без явного redirectTo signIn() берёт callbackUrl из заголовка Referer
  // этого самого запроса — а это /register, поэтому после перехода по
  // магической ссылке пользователя кидало обратно на форму регистрации,
  // хотя вход уже прошёл успешно.
  let redirectTarget: string;
  try {
    redirectTarget = await signIn("nodemailer", { email, redirect: false, redirectTo: "/matches" });
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  if (redirectTarget.includes("/api/auth/error")) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
