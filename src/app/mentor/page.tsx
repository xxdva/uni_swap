import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDict } from "@/lib/i18n";
import { getVerifiedSkillIds } from "@/lib/verification";
import { getSkillIcon } from "@/components/ToolIcons";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MentorApplicationForm } from "@/components/MentorApplicationForm";

export default async function MentorPage() {
  const [session, dict] = await Promise.all([auth(), getDict()]);
  const userId = session!.user.id;

  if (session!.user.role !== "MENTOR") {
    const latestApplication = await prisma.mentorApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return (
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.mentor.applyTitle}</h1>
          <p className="mt-1 text-sm text-muted">{dict.mentor.applyDescription}</p>
        </div>

        {latestApplication?.status === "PENDING" ? (
          <p className="card text-sm text-muted">{dict.mentor.applyPending}</p>
        ) : (
          <>
            {latestApplication?.status === "REJECTED" && (
              <p className="text-sm text-red-600">{dict.mentor.applyRejected}</p>
            )}
            <MentorApplicationForm dict={dict.mentor} />
          </>
        )}
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
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.mentor.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.mentor.dashboardSubtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card flex flex-col gap-1">
          <span className="text-xs text-muted">{dict.mentor.statsRating}</span>
          <span className="text-2xl font-semibold text-rose-700 dark:text-rose-200">
            {avgRating !== null ? avgRating.toFixed(1) : "—"}
          </span>
        </div>
        <div className="card flex flex-col gap-1">
          <span className="text-xs text-muted">{dict.mentor.statsSessions}</span>
          <span className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{completedCount}</span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">{dict.mentor.verifiedSkillsTitle}</h2>
        {verifiedSkills.length === 0 ? (
          <p className="text-sm text-muted">{dict.mentor.noVerifiedSkills}</p>
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
