import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const schema = z.object({ email: z.string().email() });

// Вход для уже зарегистрированных: письмо уходит только на почту, которая
// есть в БД и прошла регистрацию (с согласием). Новых пользователей здесь
// не создаём — для этого есть /api/register.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.consentAt) {
    return NextResponse.json({ error: "not_registered" }, { status: 404 });
  }
  if (user.isBlocked) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

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
