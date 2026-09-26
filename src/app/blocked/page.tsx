export default function BlockedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Аккаунт заблокирован</h1>
      <p className="text-sm text-muted">
        Доступ к Uni Swap ограничен администратором. Если считаете это
        ошибкой, обратитесь в поддержку университета.
      </p>
    </main>
  );
}
