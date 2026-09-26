import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  targetId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
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

  const { targetId, reason } = parsed.data;
  if (targetId === session.user.id) {
    return NextResponse.json({ error: "cannot_report_self" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: "target_not_found" }, { status: 404 });
  }

  const report = await prisma.report.create({
    data: { reporterId: session.user.id, targetId, reason },
  });

  return NextResponse.json(report, { status: 201 });
}
