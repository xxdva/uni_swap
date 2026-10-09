import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  eventName: z.string().trim().min(1).max(120),
  type: z.enum(["HACKATHON", "OLYMPIAD", "COMPETITION", "CONFERENCE", "COURSE", "OTHER"]),
  achievedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "invalid date"),
  description: z.string().trim().max(500).optional(),
  certificateId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { achievedAt, certificateId, description, ...rest } = parsed.data;

  const date = new Date(achievedAt);
  if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Привязать можно только свой сертификат.
  if (certificateId) {
    const cert = await prisma.certificate.findUnique({ where: { id: certificateId }, select: { userId: true } });
    if (!cert || cert.userId !== session.user.id) {
      return NextResponse.json({ error: "certificate_not_found" }, { status: 404 });
    }
  }

  const achievement = await prisma.achievement.create({
    data: {
      ...rest,
      userId: session.user.id,
      achievedAt: date,
      description: description || null,
      certificateId: certificateId || null,
    },
    select: { id: true },
  });
  return NextResponse.json(achievement, { status: 201 });
}
