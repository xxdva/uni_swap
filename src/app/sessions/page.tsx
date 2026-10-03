import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SessionActions } from "@/components/SessionActions";
import { ReportButton } from "@/components/ReportButton";
import { ReviewForm } from "@/components/ReviewForm";
import { Stars } from "@/components/Stars";
import { format, getDict, getLocale, type Locale } from "@/lib/i18n";
import type { SessionStatus } from "@prisma/client";

const DATE_LOCALE: Record<Locale, string> = { ru: "ru-RU", en: "en-US", kk: "kk-KZ" };

export default async function SessionsPage() {
  const [session, dict, locale] = await Promise.all([auth(), getDict(), getLocale()]);
  const userId = session!.user.id;

  const STATUS_LABEL: Record<SessionStatus, string> = {
    PENDING: dict.sessions.statusPending,
    ACCEPTED: dict.sessions.statusAccepted,
    CANCELLED: dict.sessions.statusCancelled,
    COMPLETED: dict.sessions.statusCompleted,
  };

  const sessions = await prisma.skillSession.findMany({
    where: { OR: [{ requesterId: userId }, { partnerId: userId }] },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      partner: { select: { id: true, name: true, email: true } },
      skill: true,
    },
    orderBy: { dateTime: "desc" },
  });

  const completedIds = sessions.filter((s) => s.status === "COMPLETED").map((s) => s.id);
  const myReviews = completedIds.length
    ? await prisma.review.findMany({ where: { authorId: userId, sessionId: { in: completedIds } } })
    : [];
  const myReviewBySession = new Map(myReviews.map((r) => [r.sessionId, r]));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.sessions.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.sessions.subtitle}</p>
      </div>

      {sessions.length === 0 && <p className="text-sm text-muted">{dict.sessions.empty}</p>}

      <ul className="flex flex-col gap-3">
        {sessions.map((s) => {
          const isRequester = s.requesterId === userId;
          const other = isRequester ? s.partner : s.requester;
          const template = isRequester ? dict.sessions.youProposed : dict.sessions.theyProposed;

          return (
            <li key={s.id} className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{other.name ?? other.email}</span>
                <span className="text-xs text-muted">{STATUS_LABEL[s.status]}</span>
              </div>
              <p className="text-sm text-muted">
                {format(template, {
                  skill: s.skill.name,
                  date: new Date(s.dateTime).toLocaleString(DATE_LOCALE[locale]),
                })}
              </p>
              {s.meetingLink && (
                <a
                  href={s.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-rose-600 underline dark:text-rose-300"
                >
                  {dict.sessions.meetingLink}
                </a>
              )}
              <SessionActions
                id={s.id}
                canAccept={!isRequester && s.status === "PENDING"}
                canCancel={s.status === "PENDING" || s.status === "ACCEPTED"}
                canComplete={s.status === "ACCEPTED"}
                dict={dict.sessionActions}
              />
              {s.status === "COMPLETED" &&
                (myReviewBySession.has(s.id) ? (
                  <div className="flex items-center gap-2 pt-1 text-sm">
                    <Stars rating={myReviewBySession.get(s.id)!.rating} />
                    {myReviewBySession.get(s.id)!.text && (
                      <span className="text-muted">{myReviewBySession.get(s.id)!.text}</span>
                    )}
                  </div>
                ) : (
                  <ReviewForm sessionId={s.id} dict={dict.review} />
                ))}
              <div className="flex items-center gap-3 pt-1">
                <Link href={`/chat/${other.id}`} className="text-sm text-rose-600 hover:underline dark:text-rose-300">
                  {dict.sessions.write}
                </Link>
                <ReportButton targetId={other.id} dict={dict.report} />
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
