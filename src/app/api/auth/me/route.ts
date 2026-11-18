import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const unreadNotifications = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      baseCurrency: user.baseCurrency,
      totpEnabled: user.totpEnabled,
      referralCode: user.referralCode,
      kycStatus: user.kycProfile?.status ?? "NOT_STARTED",
      riskTolerance: user.kycProfile?.riskTolerance ?? null,
      cashBalances: user.cashBalances,
      unreadNotifications,
    },
  });
}
