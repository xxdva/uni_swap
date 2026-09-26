import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.user.id) {
    return NextResponse.json({ error: "cannot_block_self" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id }, data: { isBlocked: true } });
  return NextResponse.json(user);
}
