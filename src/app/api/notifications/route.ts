import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// «Предложения» (BR из заметок по стейкхолдерам): непринятые входящие
// заявки на сессию — ровно то, что должно «всплывать» уведомлением.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pending = await prisma.skillSession.findMany({
    where: { partnerId: session.user.id, status: "PENDING" },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      skill: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(
    pending.map((s) => ({
      id: s.id,
      requesterName: s.requester.name ?? s.requester.email,
      skillName: s.skill.name,
      dateTime: s.dateTime.toISOString(),
    }))
  );
}
