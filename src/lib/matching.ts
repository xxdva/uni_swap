import { prisma } from "@/lib/prisma";

export type MatchCandidate = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  theyOfferIWant: number;
  theyWantIOffer: number;
  score: number;
  mutual: boolean;
  theyCanTeachMe: SkillRef[];
  theyWantFromMe: SkillRef[];
};

export type SkillRef = { id: string; name: string };

type MatchRow = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  they_offer_i_want: bigint;
  they_want_i_offer: bigint;
  score: bigint;
  mutual: boolean;
};

/**
 * Матчинг BR3: ищем пользователей, чьи OFFER пересекаются с моими WANT
 * и наоборот. Взаимные совпадения (mutual) идут первыми, дальше — по
 * убыванию суммарного числа пересечений (score).
 *
 * Один запрос с CTE вместо N+1 — укладывается в требование «< 3 сек на
 * 1000 пользователей» при наличии индекса UserSkill(skillId, type).
 */
export async function findMatches(userId: string, limit = 50): Promise<MatchCandidate[]> {
  const rows = await prisma.$queryRaw<MatchRow[]>`
    WITH my_want AS (
      SELECT "skillId" FROM "UserSkill" WHERE "userId" = ${userId} AND type = 'WANT'
    ),
    my_offer AS (
      SELECT "skillId" FROM "UserSkill" WHERE "userId" = ${userId} AND type = 'OFFER'
    ),
    they_offer_i_want AS (
      SELECT us."userId", COUNT(*) AS cnt
      FROM "UserSkill" us
      JOIN my_want mw ON mw."skillId" = us."skillId"
      WHERE us.type = 'OFFER' AND us."userId" != ${userId}
      GROUP BY us."userId"
    ),
    they_want_i_offer AS (
      SELECT us."userId", COUNT(*) AS cnt
      FROM "UserSkill" us
      JOIN my_offer mo ON mo."skillId" = us."skillId"
      WHERE us.type = 'WANT' AND us."userId" != ${userId}
      GROUP BY us."userId"
    )
    SELECT
      u.id, u.name, u.email, u.role,
      COALESCE(tow.cnt, 0) AS they_offer_i_want,
      COALESCE(twi.cnt, 0) AS they_want_i_offer,
      (COALESCE(tow.cnt, 0) + COALESCE(twi.cnt, 0)) AS score,
      (tow."userId" IS NOT NULL AND twi."userId" IS NOT NULL) AS mutual
    FROM "User" u
    LEFT JOIN they_offer_i_want tow ON tow."userId" = u.id
    LEFT JOIN they_want_i_offer twi ON twi."userId" = u.id
    WHERE u.id != ${userId}
      AND u."isBlocked" = false
      AND (tow."userId" IS NOT NULL OR twi."userId" IS NOT NULL)
    ORDER BY mutual DESC, score DESC
    LIMIT ${limit}
  `;

  if (rows.length === 0) return [];

  const candidateIds = rows.map((r) => r.id);

  const [myWant, myOffer] = await Promise.all([
    prisma.userSkill.findMany({ where: { userId, type: "WANT" }, select: { skillId: true } }),
    prisma.userSkill.findMany({ where: { userId, type: "OFFER" }, select: { skillId: true } }),
  ]);
  const myWantIds = myWant.map((s) => s.skillId);
  const myOfferIds = myOffer.map((s) => s.skillId);

  const [theyOfferRows, theyWantRows] = await Promise.all([
    prisma.userSkill.findMany({
      where: { userId: { in: candidateIds }, type: "OFFER", skillId: { in: myWantIds } },
      select: { userId: true, skill: { select: { id: true, name: true } } },
    }),
    prisma.userSkill.findMany({
      where: { userId: { in: candidateIds }, type: "WANT", skillId: { in: myOfferIds } },
      select: { userId: true, skill: { select: { id: true, name: true } } },
    }),
  ]);

  const teachMeByUser = groupSkills(theyOfferRows);
  const wantFromMeByUser = groupSkills(theyWantRows);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    theyOfferIWant: Number(r.they_offer_i_want),
    theyWantIOffer: Number(r.they_want_i_offer),
    score: Number(r.score),
    mutual: r.mutual,
    theyCanTeachMe: teachMeByUser.get(r.id) ?? [],
    theyWantFromMe: wantFromMeByUser.get(r.id) ?? [],
  }));
}

function groupSkills(rows: { userId: string; skill: SkillRef }[]) {
  const map = new Map<string, SkillRef[]>();
  for (const row of rows) {
    const list = map.get(row.userId) ?? [];
    list.push(row.skill);
    map.set(row.userId, list);
  }
  return map;
}
