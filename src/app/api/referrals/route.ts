import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id },
    include: {
      referredUser: {
        select: { name: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    referralCode: user.referralCode,
    referrals,
  });
}
