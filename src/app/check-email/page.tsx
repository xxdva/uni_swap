export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Проверьте почту</h1>
      <p className="text-sm text-muted">
        Мы отправили ссылку для входа на указанный адрес. Перейдите по ней,
        чтобы подтвердить почту и попасть в Uni Swap.
      </p>
    </main>
  );
}
