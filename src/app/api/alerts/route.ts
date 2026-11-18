import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: user.id },
    include: { asset: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = z.object({
    assetId: z.string().min(1),
    direction: z.enum(["ABOVE", "BELOW"]),
    targetPriceCents: z.number().int().positive(),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert parameters." }, { status: 400 });
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      assetId: parsed.data.assetId,
      direction: parsed.data.direction,
      targetPriceCents: parsed.data.targetPriceCents,
    },
    include: { asset: true },
  });

  return NextResponse.json({ alert });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Alert ID required." }, { status: 400 });

  await prisma.priceAlert.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
