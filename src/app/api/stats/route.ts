import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [userCount, assetCount, orderCount, simState] = await Promise.all([
    prisma.user.count(),
    prisma.asset.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "FILLED" } }),
    prisma.marketSimState.findUnique({ where: { id: "singleton" } }),
  ]);

  return NextResponse.json({
    userCount,
    assetCount,
    orderCount,
    simState,
  });
}
