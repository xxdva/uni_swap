import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MAX_CERTIFICATE_BYTES, detectCertificateMime } from "@/lib/certificates";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const title = String(form?.get("title") ?? "").trim();
  const skillIdRaw = String(form?.get("skillId") ?? "").trim();
  const file = form?.get("file");

  if (!form || title.length < 1 || title.length > 120 || !(file instanceof File)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_CERTIFICATE_BYTES) {
    return NextResponse.json({ error: "too_big" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectCertificateMime(bytes);
  if (!mimeType) {
    return NextResponse.json({ error: "bad_type" }, { status: 415 });
  }

  let skillId: string | null = null;
  if (skillIdRaw) {
    const skill = await prisma.skill.findUnique({ where: { id: skillIdRaw } });
    if (!skill) return NextResponse.json({ error: "skill_not_found" }, { status: 404 });
    skillId = skill.id;
  }

  const certificate = await prisma.certificate.create({
    data: {
      userId: session.user.id,
      skillId,
      title,
      fileName: file.name.slice(0, 200),
      mimeType,
      data: bytes,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json(certificate, { status: 201 });
}
