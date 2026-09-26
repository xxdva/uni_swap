import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadSkillSessionForParticipant } from "@/lib/sessions";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await loadSkillSessionForParticipant(id, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (!["PENDING", "ACCEPTED"].includes(result.skillSession.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 409 });
  }

  const updated = await prisma.skillSession.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(updated);
}
