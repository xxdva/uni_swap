import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SkillsManager } from "@/components/SkillsManager";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { CertificatesManager } from "@/components/CertificatesManager";
import { AchievementsManager } from "@/components/AchievementsManager";
import { Stars } from "@/components/Stars";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { format, getDict, getLocale } from "@/lib/i18n";

export default async function ProfilePage() {
  const [session, dict, locale] = await Promise.all([auth(), getDict(), getLocale()]);
  const userId = session!.user.id;

  const [achievements, catalog, certificates, userSkills, receivedReviews] = await Promise.all([
    prisma.achievement.findMany({
      where: { userId },
      include: { certificate: { select: { status: true } } },
      orderBy: { achievedAt: "desc" },
    }),
    prisma.skill.findMany({ select: { id: true, name: true, category: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.certificate.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        reviewNote: true,
        skill: { select: { name: true } },
        reviewer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { targetId: userId },
      include: {
        author: { select: { name: true, email: true } },
        session: { select: { skill: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const offered = userSkills.filter((s) => s.type === "OFFER");
  const wanted = userSkills.filter((s) => s.type === "WANT");
  const avgRating =
    receivedReviews.length > 0
      ? receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length
      : null;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <div className="flex items-center gap-4">
        <Avatar name={session!.user.name} email={session!.user.email!} size={56} />
        <div>
          <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.profile.title}</h1>
          <p className="mt-1 text-sm text-muted">{session!.user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={dict.profile.statsOffered} value={offered.length} />
        <StatCard label={dict.profile.statsWanted} value={wanted.length} />
        <StatCard label={dict.profile.statsRating} value={avgRating !== null ? avgRating.toFixed(1) : "—"} />
        <StatCard label={dict.profile.statsReviews} value={receivedReviews.length} />
      </div>

      <RoleSwitcher current={session!.user.role} title={dict.profile.roleTitle} hint={dict.profile.roleHint} dict={dict.register} />

      <SkillsManager type="OFFER" title={dict.profile.offerTitle} items={offered} catalog={catalog} dict={dict.skills} />
      <SkillsManager type="WANT" title={dict.profile.wantTitle} items={wanted} catalog={catalog} dict={dict.skills} />

      <CertificatesManager
        items={certificates.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          reviewNote: c.reviewNote,
          skillName: c.skill?.name ?? null,
          reviewerName: c.reviewer ? (c.reviewer.name ?? c.reviewer.email) : null,
        }))}
        skills={catalog.map((s) => ({ id: s.id, name: s.name }))}
        dict={dict.certs}
      />

      <AchievementsManager
        items={achievements.map((a) => ({
          id: a.id,
          title: a.title,
          eventName: a.eventName,
          type: a.type,
          achievedAt: a.achievedAt.toISOString(),
          description: a.description,
          certificateId: a.certificateId,
          certificateApproved: a.certificate?.status === "APPROVED",
        }))}
        certificates={certificates.map((c) => ({ id: c.id, title: c.title }))}
        locale={locale}
        dict={dict.achievements}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">
          {dict.profile.reviewsTitle} {avgRating !== null && <Stars rating={avgRating} />}
        </h2>
        {receivedReviews.length === 0 && <EmptyState>{dict.profile.noReviews}</EmptyState>}
        <ul className="flex flex-col gap-2">
          {receivedReviews.map((r) => (
            <li key={r.id} className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <Avatar name={r.author.name} email={r.author.email} size={28} />
                  {r.author.name ?? r.author.email}
                </span>
                <Stars rating={r.rating} />
              </div>
              <p className="text-sm text-muted">
                {format(dict.profile.reviewFor, { skill: r.session.skill.name })}
                {r.text ? `: ${r.text}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
