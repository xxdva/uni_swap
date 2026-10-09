import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  message: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    // Уже MENTOR или ADMIN — заявка не нужна.
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const existingPending = await prisma.mentorApplication.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  });
  if (existingPending) {
    return NextResponse.json({ error: "already_pending" }, { status: 409 });
  }

  const application = await prisma.mentorApplication.create({
    data: { userId: session.user.id, message: parsed.data.message },
  });

  return NextResponse.json(application, { status: 201 });
}
