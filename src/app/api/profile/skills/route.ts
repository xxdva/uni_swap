import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Навыки выбираются только из общего каталога (карточки в профиле) —
// свободный ввод отключён, поэтому принимаем skillId, а не название.
const schema = z.object({
  skillId: z.string().min(1),
  type: z.enum(["OFFER", "WANT"]),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { skillId, type, level } = parsed.data;

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    return NextResponse.json({ error: "skill_not_found" }, { status: 404 });
  }

  try {
    const userSkill = await prisma.userSkill.create({
      data: { userId: session.user.id, skillId: skill.id, type, level },
      include: { skill: true },
    });
    return NextResponse.json(userSkill, { status: 201 });
  } catch {
    // Нарушение @@unique([userId, skillId, type]) — навык уже добавлен.
    return NextResponse.json({ error: "already_added" }, { status: 409 });
  }
}
