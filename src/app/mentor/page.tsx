import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDict } from "@/lib/i18n";
import { getVerifiedSkillIds } from "@/lib/verification";
import { getSkillIcon } from "@/components/ToolIcons";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MentorApplicationForm } from "@/components/MentorApplicationForm";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 13 7 21l5-3 5 3-1.5-8" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default async function MentorPage() {
  const [session, dict] = await Promise.all([auth(), getDict()]);
  const userId = session!.user.id;

  if (session!.user.role !== "MENTOR") {
    const latestApplication = await prisma.mentorApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const benefits = [
      { icon: <ChartIcon />, title: dict.mentor.benefit1Title, desc: dict.mentor.benefit1Desc },
      { icon: <BadgeIcon />, title: dict.mentor.benefit2Title, desc: dict.mentor.benefit2Desc },
      { icon: <CheckIcon />, title: dict.mentor.benefit3Title, desc: dict.mentor.benefit3Desc },
    ];

    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.mentor.applyTitle}</h1>
          <p className="mt-1 text-sm text-muted">{dict.mentor.applyDescription}</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {benefits.map((b, i) => (
            <li key={i} className="card flex flex-col items-center gap-2 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950">
                {b.icon}
              </span>
              <span className="text-sm font-medium text-rose-700 dark:text-rose-200">{b.title}</span>
              <span className="text-xs text-muted">{b.desc}</span>
            </li>
          ))}
        </ul>

        <div className="mx-auto w-full max-w-md">
          {latestApplication?.status === "PENDING" ? (
            <p className="card text-sm text-muted">{dict.mentor.applyPending}</p>
          ) : (
            <>
              {latestApplication?.status === "REJECTED" && (
                <p className="mb-3 text-sm text-red-600">{dict.mentor.applyRejected}</p>
              )}
              <MentorApplicationForm dict={dict.mentor} />
            </>
          )}
        </div>
      </main>
    );
  }

  const [userSkills, reviews, completedCount, verifiedIds] = await Promise.all([
    prisma.userSkill.findMany({ where: { userId, type: "OFFER" }, include: { skill: true } }),
    prisma.review.findMany({ where: { targetId: userId } }),
    prisma.skillSession.count({
      where: { status: "COMPLETED", OR: [{ requesterId: userId }, { partnerId: userId }] },
    }),
    getVerifiedSkillIds(userId),
  ]);

  const verifiedSkills = userSkills.filter((s) => verifiedIds.has(s.skillId));
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center gap-4">
        <Avatar name={session!.user.name} email={session!.user.email!} size={56} />
        <div>
          <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.mentor.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.mentor.dashboardSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={dict.mentor.statsRating} value={avgRating !== null ? avgRating.toFixed(1) : "—"} />
        <StatCard label={dict.mentor.statsSessions} value={completedCount} />
        <StatCard label={dict.mentor.verifiedSkillsTitle} value={verifiedSkills.length} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">{dict.mentor.verifiedSkillsTitle}</h2>
        {verifiedSkills.length === 0 ? (
          <EmptyState>{dict.mentor.noVerifiedSkills}</EmptyState>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {verifiedSkills.map((s) => (
              <li key={s.id} className="pill">
                {getSkillIcon(s.skill.name, 18)}
                <span>{s.skill.name}</span>
                <VerifiedBadge label={dict.mentor.verifiedLabel} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
