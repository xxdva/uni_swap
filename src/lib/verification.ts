import { prisma } from "@/lib/prisma";

// Навык считается «подтверждённым», если (а) по нему есть сертификат,
// одобренный ментором/админом, либо (б) автоматически — по факту
// завершённых сессий и оценкам. Не хранится в БД, считается на лету: завершённых сессий по
// навыку должно быть не меньше MIN_SESSIONS, а средняя оценка отзывов,
// оставленных за эти сессии, — не ниже MIN_RATING.
const MIN_SESSIONS = 2;
const MIN_RATING = 4;

// Пакетная версия — считает подтверждённые навыки сразу для списка
// пользователей (например, для всех совпадений на /matches) одним
// набором запросов вместо N отдельных вызовов.
export async function getVerifiedSkillIdsForUsers(userIds: string[]): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>();
  if (userIds.length === 0) return result;
  const userIdSet = new Set(userIds);

  const approvedCertificates = await prisma.certificate.findMany({
    where: { userId: { in: userIds }, status: "APPROVED", skillId: { not: null } },
    select: { userId: true, skillId: true },
  });
  for (const { userId, skillId } of approvedCertificates) {
    const set = result.get(userId) ?? new Set<string>();
    set.add(skillId!);
    result.set(userId, set);
  }

  const offered = await prisma.userSkill.findMany({
    where: { userId: { in: userIds }, type: "OFFER" },
    select: { userId: true, skillId: true },
  });
  if (offered.length === 0) return result;

  const sessions = await prisma.skillSession.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ requesterId: { in: userIds } }, { partnerId: { in: userIds } }],
    },
    select: { id: true, skillId: true, requesterId: true, partnerId: true },
  });
  if (sessions.length === 0) return result;

  const reviews = await prisma.review.findMany({
    where: { targetId: { in: userIds }, sessionId: { in: sessions.map((s) => s.id) } },
    select: { sessionId: true, targetId: true, rating: true },
  });
  const ratingByKey = new Map(reviews.map((r) => [`${r.sessionId}:${r.targetId}`, r.rating]));

  const sessionIdsByUserSkill = new Map<string, string[]>();
  for (const s of sessions) {
    for (const participantId of [s.requesterId, s.partnerId]) {
      if (!userIdSet.has(participantId)) continue;
      const key = `${participantId}:${s.skillId}`;
      const list = sessionIdsByUserSkill.get(key) ?? [];
      list.push(s.id);
      sessionIdsByUserSkill.set(key, list);
    }
  }

  for (const { userId, skillId } of offered) {
    const sessionIds = sessionIdsByUserSkill.get(`${userId}:${skillId}`) ?? [];
    if (sessionIds.length < MIN_SESSIONS) continue;

    const ratings = sessionIds
      .map((id) => ratingByKey.get(`${id}:${userId}`))
      .filter((r): r is number => r != null);
    if (ratings.length === 0) continue;

    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    if (avg < MIN_RATING) continue;

    const set = result.get(userId) ?? new Set<string>();
    set.add(skillId);
    result.set(userId, set);
  }

  return result;
}

// Возвращает id навыков (из тех, что пользователь предлагает — OFFER),
// которые считаются подтверждёнными, для одного пользователя.
export async function getVerifiedSkillIds(userId: string): Promise<Set<string>> {
  const map = await getVerifiedSkillIdsForUsers([userId]);
  return map.get(userId) ?? new Set();
}
