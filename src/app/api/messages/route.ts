import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  receiverId: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
});

// GET /api/messages?with=<userId>&since=<ISO date> — переписка с одним человеком.
// `since` — для лёгкого поллинга: подтягиваем только то, что появилось после
// последнего показанного сообщения, а не всю историю заново.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const withUserId = url.searchParams.get("with");
  const since = url.searchParams.get("since");
  if (!withUserId) {
    return NextResponse.json({ error: "missing_with" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: {
      AND: [
        {
          OR: [
            { senderId: session.user.id, receiverId: withUserId },
            { senderId: withUserId, receiverId: session.user.id },
          ],
        },
        since ? { createdAt: { gt: new Date(since) } } : {},
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { receiverId, text } = parsed.data;
  if (receiverId === session.user.id) {
    return NextResponse.json({ error: "cannot_message_self" }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver || receiver.isBlocked) {
    return NextResponse.json({ error: "receiver_not_available" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: { senderId: session.user.id, receiverId, text },
  });

  return NextResponse.json(message, { status: 201 });
}
