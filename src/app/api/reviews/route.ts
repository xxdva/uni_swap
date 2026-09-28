import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadSkillSessionForParticipant } from "@/lib/sessions";

const schema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(1000).optional(),
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

  const { sessionId, rating, text } = parsed.data;

  const result = await loadSkillSessionForParticipant(sessionId, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { skillSession } = result;
  if (skillSession.status !== "COMPLETED") {
    return NextResponse.json({ error: "session_not_completed" }, { status: 409 });
  }

  // Отзыв всегда о втором участнике той же сессии.
  const targetId =
    skillSession.requesterId === session.user.id ? skillSession.partnerId : skillSession.requesterId;

  try {
    const review = await prisma.review.create({
      data: { sessionId, authorId: session.user.id, targetId, rating, text },
    });
    return NextResponse.json(review, { status: 201 });
  } catch {
    // Нарушение @@unique([sessionId, authorId]) — отзыв уже оставлен.
    return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
  }
}
