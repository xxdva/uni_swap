import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRoleCodeValid } from "@/lib/roleCodes";

const schema = z.object({
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]),
  roleCode: z.string().max(100).optional(),
});

// Вернуться к роли STUDENT можно свободно, а стать MENTOR/ADMIN — только
// с секретным кодом (если роль уже есть, код не нужен). Роль подтягивается
// из БД в jwt-колбэке на каждом запросе, перелогин не нужен.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (parsed.data.role !== session.user.role && !isRoleCodeValid(parsed.data.role, parsed.data.roleCode)) {
    return NextResponse.json({ error: "invalid_role_code" }, { status: 403 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { role: parsed.data.role } });
  return NextResponse.json({ ok: true, role: parsed.data.role });
}
