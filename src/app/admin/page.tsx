import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { UserBlockButton } from "@/components/admin/UserBlockButton";
import { ReportActions } from "@/components/admin/ReportActions";
import { format, getDict } from "@/lib/i18n";
import type { ReportStatus } from "@prisma/client";

export default async function AdminPage() {
  const [admin, dict] = await Promise.all([requireAdmin(), getDict()]);
  if (!admin) redirect("/");

  const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
    OPEN: dict.admin.reportOpen,
    RESOLVED: dict.admin.reportResolved,
    DISMISSED: dict.admin.reportDismissed,
  };

  const [users, reports] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{dict.admin.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.admin.subtitle}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">
          {format(dict.admin.usersTitle, { count: users.length })}
        </h2>
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li key={u.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {u.name ?? u.email}{" "}
                  {u.role === "ADMIN" && <span className="text-xs text-muted">{dict.admin.adminTag}</span>}
                  {u.isBlocked && <span className="text-xs text-red-600"> · {dict.admin.blockedTag}</span>}
                </p>
                <p className="truncate text-sm text-muted">{u.email}</p>
              </div>
              {u.id !== admin.user.id && (
                <UserBlockButton userId={u.id} isBlocked={u.isBlocked} dict={dict.admin} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">
          {format(dict.admin.reportsTitle, { count: reports.length })}
        </h2>
        {reports.length === 0 && <p className="text-sm text-muted">{dict.admin.noReports}</p>}
        <ul className="flex flex-col gap-2">
          {reports.map((r) => (
            <li key={r.id} className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {r.reporter.name ?? r.reporter.email} → {r.target.name ?? r.target.email}
                </span>
                <span className="text-xs text-muted">{REPORT_STATUS_LABEL[r.status]}</span>
              </div>
              <p className="text-sm text-muted">{r.reason}</p>
              {r.status === "OPEN" && <ReportActions reportId={r.id} dict={dict.admin} />}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
