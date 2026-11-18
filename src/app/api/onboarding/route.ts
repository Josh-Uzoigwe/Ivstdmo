import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const kycSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string().min(4),
  nationality: z.string().min(2),
  addressLine1: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().min(2),
  idType: z.enum(["PASSPORT", "DRIVERS_LICENSE", "NATIONAL_ID"]),
  idNumberLast4: z.string().min(4).max(4),
  idDocumentName: z.string().min(1),
  riskScore: z.number().min(10).max(100),
  investmentGoal: z.string().min(2),
  annualIncomeBand: z.string().min(2),
  agreementsAccepted: z.literal(true),
  autoApproveDemo: z.boolean().optional(),
});

function computeRiskTolerance(score: number): string {
  if (score <= 35) return "CONSERVATIVE";
  if (score <= 60) return "MODERATE";
  if (score <= 80) return "GROWTH";
  return "AGGRESSIVE";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kyc = await prisma.kycProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ kyc });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = kycSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Please complete all required fields." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const riskTolerance = computeRiskTolerance(data.riskScore);
  const status = data.autoApproveDemo ? "APPROVED" : "PENDING";

  const kyc = await prisma.kycProfile.upsert({
    where: { userId: user.id },
    update: {
      status,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      addressLine1: data.addressLine1,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      idType: data.idType,
      idNumberLast4: data.idNumberLast4,
      idDocumentName: data.idDocumentName,
      riskScore: data.riskScore,
      riskTolerance,
      investmentGoal: data.investmentGoal,
      annualIncomeBand: data.annualIncomeBand,
      agreementsAccepted: true,
      submittedAt: new Date(),
      reviewedAt: status === "APPROVED" ? new Date() : null,
    },
    create: {
      userId: user.id,
      status,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      addressLine1: data.addressLine1,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      idType: data.idType,
      idNumberLast4: data.idNumberLast4,
      idDocumentName: data.idDocumentName,
      riskScore: data.riskScore,
      riskTolerance,
      investmentGoal: data.investmentGoal,
      annualIncomeBand: data.annualIncomeBand,
      agreementsAccepted: true,
      submittedAt: new Date(),
      reviewedAt: status === "APPROVED" ? new Date() : null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "KYC",
      title: status === "APPROVED" ? "Account Verified" : "KYC Submitted for Review",
      message:
        status === "APPROVED"
          ? `Your identity & ${riskTolerance.toLowerCase()} risk profile are approved. Trading is now unlocked.`
          : "Your verification documents have been submitted and are pending admin review.",
      link: status === "APPROVED" ? "/wallet" : "/onboarding",
    },
  });

  return NextResponse.json({ kyc });
}
