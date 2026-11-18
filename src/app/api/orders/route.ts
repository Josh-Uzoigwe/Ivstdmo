import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { placeOrder } from "@/lib/services/trading";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { asset: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ orders });
}

const createOrderSchema = z.object({
  assetId: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  orderType: z.enum(["MARKET", "LIMIT", "STOP"]),
  quantityDecimal: z.number().positive().optional(),
  notionalCents: z.number().int().positive().optional(),
  limitPriceCents: z.number().int().positive().optional(),
  stopPriceCents: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid order parameters." },
      { status: 400 }
    );
  }

  try {
    const order = await placeOrder(user.id, parsed.data);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");
  if (!orderId) return NextResponse.json({ error: "Order id required." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending orders can be cancelled." }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ order: updated });
}
