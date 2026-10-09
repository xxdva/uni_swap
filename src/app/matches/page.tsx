import Link from "next/link";
import { auth } from "@/auth";
import { findMatches } from "@/lib/matching";
import { getVerifiedSkillIdsForUsers } from "@/lib/verification";
import { RequestSessionForm } from "@/components/RequestSessionForm";
import { ReportButton } from "@/components/ReportButton";
import { getSkillIcon } from "@/components/ToolIcons";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { getDict, getLocale } from "@/lib/i18n";
import { skillLabel } from "@/lib/i18n/labels";

export default async function MatchesPage() {
  const [session, dict, locale] = await Promise.all([auth(), getDict(), getLocale()]);
  const matches = await findMatches(session!.user.id);
  const verifiedByUser = await getVerifiedSkillIdsForUsers(matches.map((m) => m.id));

  const [canTeachBefore, canTeachAfter] = dict.matches.canTeach.split("{skills}");

  const mutualCount = matches.filter((m) => m.mutual).length;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.matches.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.matches.subtitle}</p>
      </div>

      {matches.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:w-80">
          <StatCard label={dict.matches.statsTotal} value={matches.length} />
          <StatCard label={dict.matches.statsMutual} value={mutualCount} />
        </div>
      )}

      {matches.length === 0 && <EmptyState>{dict.matches.empty}</EmptyState>}

      <ul className="flex flex-col gap-3">
        {matches.map((m) => {
          const verifiedSkillIds = verifiedByUser.get(m.id) ?? new Set<string>();

          return (
            <li key={m.id} className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <Avatar name={m.name} email={m.email} size={32} />
                  {m.name ?? m.email}{" "}
                  {m.role === "MENTOR" && <span className="text-xs text-muted">{dict.admin.mentorTag}</span>}
                </span>
                {m.mutual && <span className="badge-mutual">{dict.matches.mutualBadge}</span>}
              </div>
              {m.theyCanTeachMe.length > 0 && (
                <p className="flex flex-wrap items-center gap-1 text-sm text-muted">
                  <span>{canTeachBefore}</span>
                  {m.theyCanTeachMe.map((s, i) => (
                    <span key={s.id} className="inline-flex items-center gap-1">
                      {getSkillIcon(s.name, 14)}
                      {skillLabel(s.name, locale)}
                      {verifiedSkillIds.has(s.id) && <VerifiedBadge label={dict.mentor.verifiedLabel} />}
                      {i < m.theyCanTeachMe.length - 1 && ","}
                    </span>
                  ))}
                  <span>{canTeachAfter}</span>
                </p>
              )}
              {m.theyWantFromMe.length > 0 && (
                <p className="text-sm text-muted">
                  {dict.matches.wantsFromYou.replace("{skills}", m.theyWantFromMe.map((s) => skillLabel(s.name, locale)).join(", "))}
                </p>
              )}
              <RequestSessionForm
                partnerId={m.id}
                teachOptions={m.theyCanTeachMe.map((s) => ({ ...s, name: skillLabel(s.name, locale) }))}
                learnOptions={m.theyWantFromMe.map((s) => ({ ...s, name: skillLabel(s.name, locale) }))}
                dict={dict.requestSession}
              />
              <div className="flex items-center gap-3 pt-1">
                <Link href={`/chat/${m.id}`} className="text-sm text-rose-600 transition-colors hover:underline dark:text-rose-300">
                  {dict.matches.write}
                </Link>
                <ReportButton targetId={m.id} dict={dict.report} />
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
