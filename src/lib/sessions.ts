import { prisma } from "@/lib/prisma";
import type { SkillSession } from "@prisma/client";

type LoadResult =
  | { ok: true; skillSession: SkillSession }
  | { ok: false; status: 404 | 403; error: "not_found" | "forbidden" };

// Заявку может видеть/менять только один из двух участников.
export async function loadSkillSessionForParticipant(id: string, userId: string): Promise<LoadResult> {
  const skillSession = await prisma.skillSession.findUnique({ where: { id } });
  if (!skillSession) {
    return { ok: false, status: 404, error: "not_found" };
  }
  if (skillSession.requesterId !== userId && skillSession.partnerId !== userId) {
    return { ok: false, status: 403, error: "forbidden" };
  }
  return { ok: true, skillSession };
}
