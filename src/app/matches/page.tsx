import Link from "next/link";
import { auth } from "@/auth";
import { findMatches } from "@/lib/matching";
import { RequestSessionForm } from "@/components/RequestSessionForm";
import { ReportButton } from "@/components/ReportButton";

export default async function MatchesPage() {
  const session = await auth();
  const matches = await findMatches(session!.user.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Совпадения</h1>
        <p className="mt-1 text-sm text-muted">
          Люди, чьи навыки пересекаются с вашими «умею» и «хочу научиться».
        </p>
      </div>

      {matches.length === 0 && (
        <p className="text-sm text-muted">
          Пока совпадений нет — добавьте навыки в профиле, чтобы система могла вас с кем-то сопоставить.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {matches.map((m) => (
          <li key={m.id} className="card flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{m.name ?? m.email}</span>
              {m.mutual && <span className="badge-mutual">Взаимное совпадение</span>}
            </div>
            {m.theyCanTeachMe.length > 0 && (
              <p className="text-sm text-muted">
                Может научить: {m.theyCanTeachMe.map((s) => s.name).join(", ")}
              </p>
            )}
            {m.theyWantFromMe.length > 0 && (
              <p className="text-sm text-muted">
                Хочет научиться у вас: {m.theyWantFromMe.map((s) => s.name).join(", ")}
              </p>
            )}
            <RequestSessionForm
              partnerId={m.id}
              teachOptions={m.theyCanTeachMe}
              learnOptions={m.theyWantFromMe}
            />
            <div className="flex items-center gap-3 pt-1">
              <Link href={`/chat/${m.id}`} className="text-sm text-rose-600 hover:underline dark:text-rose-300">
                Написать
              </Link>
              <ReportButton targetId={m.id} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
