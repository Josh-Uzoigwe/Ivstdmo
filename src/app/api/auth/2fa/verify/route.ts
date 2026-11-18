import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, verifyTotpToken } from "@/lib/auth";

const schema = z.object({
  code: z.string().min(6).max(8),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a 6-digit authenticator code." }, { status: 400 });
  }

  if (!session.user.totpSecret) {
    return NextResponse.json({ error: "2FA is not configured." }, { status: 400 });
  }

  const valid = verifyTotpToken(session.user.totpSecret, parsed.data.code);
  if (!valid) {
    return NextResponse.json({ error: "Invalid 2FA code." }, { status: 401 });
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { twoFactorVerified: true },
  });

  return NextResponse.json({ ok: true, role: session.user.role });
}
