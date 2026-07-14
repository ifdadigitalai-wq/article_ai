import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.userId as string;

    const streaks = await prisma.readingStreak.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });

    let currentStreak = 0;
    let longestStreak = 0;

    if (streaks.length > 0) {
      longestStreak = Math.max(...streaks.map((s) => s.count));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const latestStreak = streaks[streaks.length - 1];
      const latestDate = new Date(latestStreak.date);
      latestDate.setHours(0, 0, 0, 0);

      if (latestDate.getTime() === today.getTime() || latestDate.getTime() === yesterday.getTime()) {
        currentStreak = latestStreak.count;
      }
    }

    const heatmap: Record<string, number> = {};
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const historyLast90Days = await prisma.readingHistory.findMany({
      where: {
        userId,
        readAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        readAt: true,
      },
    });

    historyLast90Days.forEach((h) => {
      const dateStr = new Date(h.readAt).toISOString().split("T")[0];
      heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
    });

    return NextResponse.json({
      currentStreak,
      longestStreak,
      heatmap,
    });
  } catch (error: any) {
    console.error("GET Reading Streak API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
