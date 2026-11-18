import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateTotpSetup, getCurrentUser, verifyTotpToken } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { secret, qrDataUrl } = await generateTotpSetup(user.email);
  return NextResponse.json({ secret, qrDataUrl, enabled: user.totpEnabled });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = z.object({
    secret: z.string().min(10),
    code: z.string().min(6),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code format." }, { status: 400 });
  }

  const valid = verifyTotpToken(parsed.data.secret, parsed.data.code);
  if (!valid) {
    return NextResponse.json({ error: "Verification code did not match." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: parsed.data.secret, totpEnabled: true },
  });

  return NextResponse.json({ enabled: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabled: false },
  });

  return NextResponse.json({ enabled: false });
}
