import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const application = await prisma.mentorApplication.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "invalid_status" }, { status: 409 });
  }

  const [updated] = await prisma.$transaction([
    prisma.mentorApplication.update({ where: { id }, data: { status: "APPROVED" } }),
    prisma.user.update({ where: { id: application.userId }, data: { role: "MENTOR" } }),
  ]);

  return NextResponse.json(updated);
}
