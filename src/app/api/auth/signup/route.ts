import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  generateReferralCode,
  hashPassword,
} from "@/lib/auth";
import { BRAND } from "@/config/brand";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  baseCurrency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
  referralCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    let referrer: { id: string; name: string } | null = null;
    if (parsed.data.referralCode?.trim()) {
      referrer = await prisma.user.findUnique({
        where: { referralCode: parsed.data.referralCode.trim().toUpperCase() },
        select: { id: true, name: true },
      });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const referralCode = generateReferralCode(parsed.data.name);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name.trim(),
        role: "USER",
        baseCurrency: parsed.data.baseCurrency,
        referralCode,
        referredById: referrer?.id ?? null,
        kycProfile: {
          create: { status: "NOT_STARTED" },
        },
        cashBalances: {
          create: [
            { currency: "USD", amountCents: 0 },
            { currency: "EUR", amountCents: 0 },
            { currency: "GBP", amountCents: 0 },
          ],
        },
        watchlists: {
          create: { name: "Core Watchlist" },
        },
      },
    });

    if (referrer) {
      await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: user.id,
          status: "QUALIFIED",
          rewardCents: BRAND.referralBonusCents,
        },
      });
      await prisma.notification.create({
        data: {
          userId: referrer.id,
          type: "SYSTEM",
          title: "New Referral Joined",
          message: `${user.name} signed up using your referral link.`,
          link: "/referrals",
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "KYC",
        title: `Welcome to ${BRAND.name}`,
        message: "Complete your identity & risk profile in Onboarding to unlock trading.",
        link: "/onboarding",
      },
    });

    await createSession(user.id, true);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        baseCurrency: user.baseCurrency,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
