import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadSkillSessionForParticipant } from "@/lib/sessions";

const schema = z.object({ meetingLink: z.string().url().optional().or(z.literal("")) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await loadSkillSessionForParticipant(id, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { skillSession } = result;
  // Принять заявку может только тот, кому её адресовали.
  if (skillSession.partnerId !== session.user.id) {
    return NextResponse.json({ error: "only_partner_can_accept" }, { status: 403 });
  }
  if (skillSession.status !== "PENDING") {
    return NextResponse.json({ error: "invalid_status" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const meetingLink = parsed.success && parsed.data.meetingLink ? parsed.data.meetingLink : undefined;

  const updated = await prisma.skillSession.update({
    where: { id },
    data: { status: "ACCEPTED", ...(meetingLink ? { meetingLink } : {}) },
  });

  return NextResponse.json(updated);
}
