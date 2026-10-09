import { PrismaClient, SkillLevel, SkillType } from "@prisma/client";
import { SKILL_CATALOG } from "./skills-catalog";

// Демо-люди для /matches: у каждого по 3–4 навыка «умею» и 2–3 «хочу».
// Почты вымышленные (@astanait.edu.kz с .demo) — войти под ними нельзя.
// Идемпотентно (upsert). Не трогает роли и данные реальных аккаунтов:
//   npm run seed:people
const prisma = new PrismaClient();

const NAMES = [
  "Alikhan Serikbayev", "Dinara Omarova", "Timur Kassymov", "Aruzhan Nurpeisova", "Daniyar Bekov",
  "Zhanel Mukhametova", "Bauyrzhan Satybaldiev", "Aisulu Karimova", "Ruslan Ibragimov", "Amina Dauletova",
  "Nursultan Abdrakhmanov", "Kamila Yessenova", "Arman Tleubayev", "Saltanat Zhumabekova", "Adil Rakhimov",
  "Madiyar Smagulov", "Assel Kenzhebekova", "Yerkebulan Ospanov", "Dilnaz Sadykova", "Miras Baimukhanov",
  "Aliya Nurgaliyeva", "Sanzhar Kuanyshev", "Moldir Tursynbayeva", "Azamat Zhaksylykov", "Gaukhar Abilova",
  "Dias Mamyrov", "Laura Bektemirova", "Rustem Alimbekov", "Zarina Kalieva", "Beknur Orazaliyev",
  "Anel Seitkaliyeva", "Olzhas Dosmukhambetov", "Nazym Aitbayeva", "Kuanysh Temirkhanov", "Symbat Ryskulova",
  "Yelnur Zhienbayev", "Ainur Shaimerdenova", "Askar Nurmagambetov", "Karina Belyaeva", "Maksim Petrov",
  "Ilyas Kaiyrov", "Diana Voronina", "Arsen Yermekov", "Polina Sokolova", "Temirlan Akhmetov",
];

const LEVELS: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

// Детерминированный генератор — сид даёт одни и те же данные при перезапуске.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const ALL_SKILLS = Object.values(SKILL_CATALOG).flat();
// Популярные навыки берём чаще, чтобы совпадений у реальных аккаунтов было больше.
const POPULAR = [
  "Python", "JavaScript", "Figma", "Excel", "English", "IELTS", "Photoshop", "Гитара", "SQL", "Canva",
  "Публичные выступления", "SMM", "Копирайтинг", "Видеомонтаж", "Шахматы", "Китайский язык", "Фортепиано",
  "Java", "Машинное обучение", "UI/UX дизайн", "Тайм-менеджмент", "Математический анализ", "Фитнес", "Кулинария",
];

async function main() {
  let created = 0;
  for (let i = 0; i < NAMES.length; i++) {
    const rand = rng(i + 1);
    const pick = () => (rand() < 0.5 ? POPULAR : ALL_SKILLS);
    const used = new Set<string>();
    const take = (count: number, type: SkillType) => {
      const out: { name: string; type: SkillType; level: SkillLevel }[] = [];
      while (out.length < count) {
        const pool = pick();
        const name = pool[Math.floor(rand() * pool.length)];
        if (used.has(name)) continue;
        used.add(name);
        out.push({ name, type, level: LEVELS[Math.floor(rand() * 3)] });
      }
      return out;
    };
    const skills = [...take(3 + Math.floor(rand() * 2), "OFFER"), ...take(2 + Math.floor(rand() * 2), "WANT")];

    const email = `${NAMES[i].toLowerCase().replace(/[^a-z]+/g, ".")}.demo@astanait.edu.kz`;
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name: NAMES[i], emailVerified: new Date(), consentAt: new Date() },
      update: { name: NAMES[i] },
    });

    for (const s of skills) {
      const skill = await prisma.skill.upsert({ where: { name: s.name }, create: { name: s.name }, update: {} });
      await prisma.userSkill.upsert({
        where: { userId_skillId_type: { userId: user.id, skillId: skill.id, type: s.type } },
        create: { userId: user.id, skillId: skill.id, type: s.type, level: s.level },
        update: {},
      });
    }
    created++;
  }
  console.log(`✔ Демо-людей в базе: ${created}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
