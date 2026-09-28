import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SkillsManager } from "@/components/SkillsManager";
import { Stars } from "@/components/Stars";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [userSkills, receivedReviews] = await Promise.all([
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
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Мой профиль</h1>
        <p className="mt-1 text-sm text-muted">{session!.user.email}</p>
      </div>

      <SkillsManager type="OFFER" title="Я умею" items={offered} />
      <SkillsManager type="WANT" title="Хочу научиться" items={wanted} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">
          Отзывы обо мне {avgRating !== null && <Stars rating={avgRating} />}
        </h2>
        {receivedReviews.length === 0 && (
          <p className="text-sm text-muted">Пока нет отзывов — они появятся после завершённых сессий.</p>
        )}
        <ul className="flex flex-col gap-2">
          {receivedReviews.map((r) => (
            <li key={r.id} className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.author.name ?? r.author.email}</span>
                <Stars rating={r.rating} />
              </div>
              <p className="text-sm text-muted">
                За сессию по «{r.session.skill.name}»{r.text ? `: ${r.text}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
