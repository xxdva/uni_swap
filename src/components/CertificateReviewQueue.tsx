import { prisma } from "@/lib/prisma";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";
import { Avatar } from "@/components/Avatar";
import { skillLabel } from "@/lib/i18n/labels";
import { EmptyState } from "@/components/EmptyState";
import { CertificateReviewActions } from "@/components/CertificateReviewActions";

// Очередь сертификатов на проверку — общая для кабинета ментора и админки.
// Свои сертификаты проверяющему не показываем (API их всё равно не примет).
export async function CertificateReviewQueue({
  reviewerId,
  dict,
  locale,
}: {
  reviewerId: string;
  dict: Dictionary["certs"];
  locale: string;
}) {
  const pending = await prisma.certificate.findMany({
    where: { status: "PENDING", userId: { not: reviewerId } },
    select: {
      id: true,
      title: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      skill: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">
        {format(dict.reviewTitle, { count: pending.length })}
      </h2>
      {pending.length === 0 && <EmptyState>{dict.reviewEmpty}</EmptyState>}
      <ul className="flex flex-col gap-2">
        {pending.map((c) => (
          <li key={c.id} className="card flex flex-col gap-2">
            <span className="flex items-center gap-2 font-medium">
              <Avatar name={c.user.name} email={c.user.email} size={28} />
              {c.title}
            </span>
            <p className="text-sm text-muted">
              {format(dict.uploadedBy, { name: c.user.name ?? c.user.email })}
              {c.skill ? ` · ${format(dict.forSkill, { skill: skillLabel(c.skill.name, locale) })}` : ""}
            </p>
            <a href={`/api/certificates/${c.id}/file`} target="_blank" rel="noreferrer" className="text-sm underline">
              {dict.view}
            </a>
            <CertificateReviewActions certificateId={c.id} dict={dict} />
          </li>
        ))}
      </ul>
    </section>
  );
}
