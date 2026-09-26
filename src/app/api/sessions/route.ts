import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  partnerId: z.string().min(1),
  skillId: z.string().min(1),
  dateTime: z.string().datetime().or(z.string().min(1)),
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

  const { partnerId, skillId } = parsed.data;
  const dateTime = new Date(parsed.data.dateTime);
  if (Number.isNaN(dateTime.getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  if (partnerId === session.user.id) {
    return NextResponse.json({ error: "cannot_request_self" }, { status: 400 });
  }

  const partner = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!partner || partner.isBlocked) {
    return NextResponse.json({ error: "partner_not_available" }, { status: 404 });
  }

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    return NextResponse.json({ error: "skill_not_found" }, { status: 404 });
  }

  const skillSession = await prisma.skillSession.create({
    data: { requesterId: session.user.id, partnerId, skillId, dateTime },
  });

  return NextResponse.json(skillSession, { status: 201 });
}
