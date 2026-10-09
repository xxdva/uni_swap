export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-rose-300 bg-rose-50/50 px-6 py-10 text-center dark:border-rose-900/40 dark:bg-rose-950/10">
      <p className="max-w-sm text-sm text-muted">{children}</p>
    </div>
  );
}
