import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SkillsManager } from "@/components/SkillsManager";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: { createdAt: "desc" },
  });

  const offered = userSkills.filter((s) => s.type === "OFFER");
  const wanted = userSkills.filter((s) => s.type === "WANT");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-rose-700 dark:text-rose-200">Мой профиль</h1>
        <p className="mt-1 text-sm text-muted">{session!.user.email}</p>
      </div>

      <SkillsManager type="OFFER" title="Я умею" items={offered} />
      <SkillsManager type="WANT" title="Хочу научиться" items={wanted} />
    </main>
  );
}
