import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.recurringInvestment.findMany({
    where: { userId: user.id },
    include: { asset: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = z.object({
    assetId: z.string().min(1),
    amountCents: z.number().int().min(100),
    currency: z.enum(["USD", "EUR", "GBP"]),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recurring plan." }, { status: 400 });
  }

  const nextRunAt = new Date();
  if (parsed.data.frequency === "DAILY") nextRunAt.setDate(nextRunAt.getDate() + 1);
  else if (parsed.data.frequency === "WEEKLY") nextRunAt.setDate(nextRunAt.getDate() + 7);
  else nextRunAt.setMonth(nextRunAt.getMonth() + 1);

  const plan = await prisma.recurringInvestment.create({
    data: {
      userId: user.id,
      assetId: parsed.data.assetId,
      amountCents: parsed.data.amountCents,
      currency: parsed.data.currency,
      frequency: parsed.data.frequency,
      nextRunAt,
    },
    include: { asset: true },
  });

  return NextResponse.json({ plan });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, isActive } = await req.json();
  await prisma.recurringInvestment.updateMany({
    where: { id, userId: user.id },
    data: { isActive: Boolean(isActive) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.recurringInvestment.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
