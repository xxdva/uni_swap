import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const certificate = await prisma.certificate.findUnique({ where: { id }, select: { userId: true } });
  if (!certificate || certificate.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.certificate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
