import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Файл видят только владелец и проверяющие (ментор/админ).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  const canView =
    certificate &&
    (certificate.userId === session.user.id || session.user.role === "MENTOR" || session.user.role === "ADMIN");
  if (!certificate || !canView) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new Response(new Uint8Array(certificate.data), {
    headers: {
      "Content-Type": certificate.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(certificate.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
