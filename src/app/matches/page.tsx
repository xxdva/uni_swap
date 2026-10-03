import Link from "next/link";
import { auth } from "@/auth";
import { findMatches } from "@/lib/matching";
import { RequestSessionForm } from "@/components/RequestSessionForm";
import { ReportButton } from "@/components/ReportButton";
import { format, getDict } from "@/lib/i18n";

export default async function MatchesPage() {
  const [session, dict] = await Promise.all([auth(), getDict()]);
  const matches = await findMatches(session!.user.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.matches.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.matches.subtitle}</p>
      </div>

      {matches.length === 0 && <p className="text-sm text-muted">{dict.matches.empty}</p>}

      <ul className="flex flex-col gap-3">
        {matches.map((m) => (
          <li key={m.id} className="card flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{m.name ?? m.email}</span>
              {m.mutual && <span className="badge-mutual">{dict.matches.mutualBadge}</span>}
            </div>
            {m.theyCanTeachMe.length > 0 && (
              <p className="text-sm text-muted">
                {format(dict.matches.canTeach, { skills: m.theyCanTeachMe.map((s) => s.name).join(", ") })}
              </p>
            )}
            {m.theyWantFromMe.length > 0 && (
              <p className="text-sm text-muted">
                {format(dict.matches.wantsFromYou, { skills: m.theyWantFromMe.map((s) => s.name).join(", ") })}
              </p>
            )}
            <RequestSessionForm
              partnerId={m.id}
              teachOptions={m.theyCanTeachMe}
              learnOptions={m.theyWantFromMe}
              dict={dict.requestSession}
            />
            <div className="flex items-center gap-3 pt-1">
              <Link href={`/chat/${m.id}`} className="text-sm text-rose-600 hover:underline dark:text-rose-300">
                {dict.matches.write}
              </Link>
              <ReportButton targetId={m.id} dict={dict.report} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
