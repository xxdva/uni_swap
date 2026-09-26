import { PrismaClient, SkillLevel, SkillType } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_USER_EMAIL = "air95003@gmail.com";

type SeedSkill = { name: string; type: SkillType; level: SkillLevel };

type SeedUser = {
  email: string;
  name: string;
  skills: SeedSkill[];
};

// Подобрано так, чтобы у DEMO_USER_EMAIL сразу было видно на /matches:
// Aigerim/Nurlan — взаимные совпадения, Madina/Asylzhan/Yerlan — совпадения
// в одну сторону, Dana — вообще без пересечений (проверка, что она не
// попадёт в список).
const DEMO_USER_SKILLS: SeedSkill[] = [
  { name: "Python", type: "OFFER", level: "ADVANCED" },
  { name: "Excel", type: "OFFER", level: "INTERMEDIATE" },
  { name: "Figma", type: "WANT", level: "BEGINNER" },
  { name: "English", type: "WANT", level: "INTERMEDIATE" },
];

const SEED_USERS: SeedUser[] = [
  {
    email: "aigerim.demo@astanait.edu.kz",
    name: "Aigerim Bekova",
    skills: [
      { name: "Figma", type: "OFFER", level: "ADVANCED" },
      { name: "Photoshop", type: "OFFER", level: "INTERMEDIATE" },
      { name: "Python", type: "WANT", level: "BEGINNER" },
      { name: "Гитара", type: "WANT", level: "BEGINNER" },
    ],
  },
  {
    email: "nurlan.demo@astanait.edu.kz",
    name: "Nurlan Zhaksybekov",
    skills: [
      { name: "English", type: "OFFER", level: "ADVANCED" },
      { name: "IELTS", type: "OFFER", level: "INTERMEDIATE" },
      { name: "Excel", type: "WANT", level: "BEGINNER" },
    ],
  },
  {
    email: "madina.demo@astanait.edu.kz",
    name: "Madina Sultanova",
    skills: [
      { name: "English", type: "OFFER", level: "INTERMEDIATE" },
      { name: "Публичные выступления", type: "WANT", level: "BEGINNER" },
    ],
  },
  {
    email: "asylzhan.demo@astanait.edu.kz",
    name: "Asylzhan Tolegenov",
    skills: [
      { name: "Гитара", type: "OFFER", level: "ADVANCED" },
      { name: "Python", type: "WANT", level: "INTERMEDIATE" },
    ],
  },
  {
    email: "yerlan.demo@astanait.edu.kz",
    name: "Yerlan Abenov",
    skills: [
      { name: "Дизайн презентаций", type: "OFFER", level: "INTERMEDIATE" },
      { name: "Excel", type: "WANT", level: "BEGINNER" },
    ],
  },
  {
    email: "dana.demo@astanait.edu.kz",
    name: "Dana Serikova",
    skills: [
      { name: "JavaScript", type: "OFFER", level: "INTERMEDIATE" },
      { name: "Photoshop", type: "OFFER", level: "BEGINNER" },
      { name: "Гитара", type: "WANT", level: "BEGINNER" },
    ],
  },
];

async function assignSkills(userId: string, skills: SeedSkill[]) {
  for (const s of skills) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      create: { name: s.name },
      update: {},
    });

    await prisma.userSkill.upsert({
      where: { userId_skillId_type: { userId, skillId: skill.id, type: s.type } },
      create: { userId, skillId: skill.id, type: s.type, level: s.level },
      update: {},
    });
  }
}

async function main() {
  for (const seedUser of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      create: {
        email: seedUser.email,
        name: seedUser.name,
        emailVerified: new Date(),
        consentAt: new Date(),
      },
      update: { name: seedUser.name },
    });
    await assignSkills(user.id, seedUser.skills);
    console.log(`✔ ${seedUser.name} <${seedUser.email}>`);
  }

  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (demoUser) {
    await assignSkills(demoUser.id, DEMO_USER_SKILLS);
    // Чтобы сразу было чем проверить /admin — единственный реальный
    // аккаунт в деве и становится администратором.
    await prisma.user.update({ where: { id: demoUser.id }, data: { role: "ADMIN" } });
    console.log(`✔ Навыки добавлены и роль ADMIN выдана <${DEMO_USER_EMAIL}>`);

    const dana = await prisma.user.findUnique({ where: { email: "dana.demo@astanait.edu.kz" } });
    if (dana) {
      await prisma.report.upsert({
        where: { id: "seed-demo-report" },
        create: {
          id: "seed-demo-report",
          reporterId: demoUser.id,
          targetId: dana.id,
          reason: "Не выходит на связь после подтверждения сессии",
        },
        update: {},
      });
      console.log("✔ Демо-жалоба для /admin создана");
    }
  } else {
    console.warn(
      `⚠ Пользователь ${DEMO_USER_EMAIL} не найден — сначала зарегистрируйтесь через /register, потом перезапустите seed.`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
