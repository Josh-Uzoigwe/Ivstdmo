import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { BRAND } from "@/config/brand";

const SESSION_COOKIE_NAME = "ns_session";
const SESSION_TTL_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateReferralCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `NS-${prefix}${suffix}`;
}

export async function createSession(userId: string, twoFactorVerified = false): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      twoFactorVerified,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          kycProfile: true,
          cashBalances: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  // If 2FA is enabled on user, require session.twoFactorVerified
  if (session.user.totpEnabled && !session.twoFactorVerified) {
    return null;
  }
  return session.user;
}

export async function generateTotpSetup(email: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, BRAND.name, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  return { secret, otpauth, qrDataUrl };
}

export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s+/g, ""), secret });
  } catch {
    return false;
  }
}
