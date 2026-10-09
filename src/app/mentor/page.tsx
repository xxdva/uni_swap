import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDict } from "@/lib/i18n";
import { getVerifiedSkillIds } from "@/lib/verification";
import { getSkillIcon } from "@/components/ToolIcons";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { CertificateReviewQueue } from "@/components/CertificateReviewQueue";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";

export default async function MentorPage() {
  const [session, dict] = await Promise.all([auth(), getDict()]);
  const userId = session!.user.id;

  // Кабинет только для менторов: стать ментором можно лишь при регистрации.
  if (session!.user.role !== "MENTOR") redirect("/profile");

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

      <div>
        <p className="mb-3 text-sm text-muted">{dict.mentor.reviewHint}</p>
        <CertificateReviewQueue reviewerId={userId} dict={dict.certs} />
      </div>
    </main>
  );
}
