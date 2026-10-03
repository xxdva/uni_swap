import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatThread } from "@/components/ChatThread";
import { getDict } from "@/lib/i18n";

export default async function ChatThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const [session, dict] = await Promise.all([auth(), getDict()]);
  const meId = session!.user.id;
  const { userId: otherUserId } = await params;

  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) notFound();

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: meId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: meId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-2xl flex-col gap-4 px-6 py-6">
      <h1 className="text-lg font-semibold text-rose-700 dark:text-rose-200">
        {other.name ?? other.email}
      </h1>
      <ChatThread
        meId={meId}
        otherUserId={otherUserId}
        dict={dict.chat}
        initialMessages={messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          text: m.text,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
