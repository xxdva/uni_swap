import { PrismaClient } from "@prisma/client";
import { SKILL_CATALOG } from "./skills-catalog";

const prisma = new PrismaClient();

// Идемпотентно: создаёт отсутствующие навыки и проставляет категорию тем,
// у которых её ещё не было (например, заведённым вручную до отключения
// свободного ввода).
async function main() {
  let count = 0;
  for (const [category, names] of Object.entries(SKILL_CATALOG)) {
    for (const name of names) {
      await prisma.skill.upsert({ where: { name }, create: { name, category }, update: { category } });
      count++;
    }
  }
  console.log(`✔ В каталоге навыков: ${count} (категорий: ${Object.keys(SKILL_CATALOG).length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
