export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-2xl font-semibold text-rose-700 dark:text-rose-200">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
