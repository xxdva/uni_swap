import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  skillName: z.string().trim().min(1).max(60),
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

  const { skillName, type, level } = parsed.data;

  // Каталог навыков общий для всех — находим существующий или заводим новый.
  const skill = await prisma.skill.upsert({
    where: { name: skillName },
    create: { name: skillName },
    update: {},
  });

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
