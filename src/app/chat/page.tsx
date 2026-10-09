import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { getDict, getLocale, type Locale } from "@/lib/i18n";

const DATE_LOCALE: Record<Locale, string> = { ru: "ru-RU", en: "en-US", kk: "kk-KZ" };

export default async function ChatListPage() {
  const [session, dict, locale] = await Promise.all([auth(), getDict(), getLocale()]);
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
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.chat.listTitle}</h1>
        <p className="mt-1 text-sm text-muted">{dict.chat.listSubtitle}</p>
      </div>

      {list.length === 0 && <EmptyState>{dict.chat.listEmpty}</EmptyState>}

      <ul className="flex flex-col gap-2">
        {list.map(({ other, lastText, lastAt }) => (
          <li key={other.id}>
            <Link href={`/chat/${other.id}`} className="card flex items-center justify-between gap-3 hover:bg-rose-100 dark:hover:bg-rose-900/30">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={other.name} email={other.email} size={40} />
                <div className="min-w-0">
                  <p className="font-medium">{other.name ?? other.email}</p>
                  <p className="truncate text-sm text-muted">{lastText}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted">
                {new Date(lastAt).toLocaleString(DATE_LOCALE[locale])}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
