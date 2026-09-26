import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const userSkill = await prisma.userSkill.findUnique({ where: { id } });
  if (!userSkill || userSkill.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.userSkill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
