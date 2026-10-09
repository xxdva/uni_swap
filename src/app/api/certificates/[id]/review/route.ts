import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireReviewer } from "@/lib/certificates";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const reviewer = await requireReviewer();
  if (!reviewer) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { id } = await params;
  const certificate = await prisma.certificate.findUnique({ where: { id }, select: { userId: true, status: true } });
  if (!certificate) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // Свой сертификат подтверждать нельзя — иначе проверка теряет смысл.
  if (certificate.userId === reviewer.user.id) {
    return NextResponse.json({ error: "own_certificate" }, { status: 403 });
  }
  if (certificate.status !== "PENDING") {
    return NextResponse.json({ error: "invalid_status" }, { status: 409 });
  }

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      status: parsed.data.action === "approve" ? "APPROVED" : "REJECTED",
      reviewerId: reviewer.user.id,
      reviewNote: parsed.data.note || null,
      reviewedAt: new Date(),
    },
    select: { id: true, status: true },
  });
  return NextResponse.json(updated);
}
