import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ChatListPage() {
  const session = await auth();
  const userId = session!.user.id;

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const conversations = new Map<
    string,
    { other: { id: string; name: string | null; email: string }; lastText: string; lastAt: Date }
  >();

  for (const m of messages) {
    const other = m.senderId === userId ? m.receiver : m.sender;
    if (!conversations.has(other.id)) {
      conversations.set(other.id, { other, lastText: m.text, lastAt: m.createdAt });
    }
  }

  const list = Array.from(conversations.values());

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Чат</h1>
        <p className="mt-1 text-sm text-muted">Переписки с партнёрами по обмену навыками.</p>
      </div>

      {list.length === 0 && (
        <p className="text-sm text-muted">
          Пока нет переписок — напишите кому-то со страницы «Совпадения» или «Сессии».
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {list.map(({ other, lastText, lastAt }) => (
          <li key={other.id}>
            <Link href={`/chat/${other.id}`} className="card flex items-center justify-between gap-3 hover:bg-rose-100 dark:hover:bg-rose-900/30">
              <div className="min-w-0">
                <p className="font-medium">{other.name ?? other.email}</p>
                <p className="truncate text-sm text-muted">{lastText}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{new Date(lastAt).toLocaleString("ru-RU")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
