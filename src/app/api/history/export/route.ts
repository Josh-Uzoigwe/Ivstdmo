import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Date", "Type", "Currency", "Amount", "Description"].join(",");
  const rows = transactions.map((t) => {
    const date = t.createdAt.toISOString();
    const amount = (t.amountCents / 100).toFixed(2);
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    return [date, t.type, t.currency, amount, desc].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="northstone-statement-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
