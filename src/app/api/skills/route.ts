import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Автокомплит справочника навыков: GET /api/skills?q=fig
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const skills = await prisma.skill.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(skills);
}
