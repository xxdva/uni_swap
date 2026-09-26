import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { UserBlockButton } from "@/components/admin/UserBlockButton";
import { ReportActions } from "@/components/admin/ReportActions";
import type { ReportStatus } from "@prisma/client";

const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  OPEN: "Открыта",
  RESOLVED: "Решена",
  DISMISSED: "Отклонена",
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

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
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Админка</h1>
        <p className="mt-1 text-sm text-muted">Блокировка пользователей и обработка жалоб.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">
          Пользователи ({users.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li key={u.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {u.name ?? u.email}{" "}
                  {u.role === "ADMIN" && <span className="text-xs text-muted">(админ)</span>}
                  {u.isBlocked && <span className="text-xs text-red-600"> · заблокирован</span>}
                </p>
                <p className="truncate text-sm text-muted">{u.email}</p>
              </div>
              {u.id !== admin.user.id && <UserBlockButton userId={u.id} isBlocked={u.isBlocked} />}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">
          Жалобы ({reports.length})
        </h2>
        {reports.length === 0 && <p className="text-sm text-muted">Жалоб пока нет.</p>}
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
              {r.status === "OPEN" && <ReportActions reportId={r.id} />}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
