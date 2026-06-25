import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { ARTICLES } from "@/app/data/articles";

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

    const completedCount = await prisma.savedArticle.count({
      where: { userId, completed: true },
    });

    const history = await prisma.readingHistory.findMany({
      where: { userId },
      select: { articleId: true, timeSpentSeconds: true },
    });

    const totalSeconds = history.reduce((sum: any, h: { timeSpentSeconds: any; }) => sum + h.timeSpentSeconds, 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    const streaks = await prisma.readingStreak.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    let currentStreak = 0;
    if (streaks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const latestStreak = streaks[0];
      const latestDate = new Date(latestStreak.date);
      latestDate.setHours(0, 0, 0, 0);

      if (latestDate.getTime() === today.getTime() || latestDate.getTime() === yesterday.getTime()) {
        currentStreak = latestStreak.count;
      }
    }

    const genreCounts: Record<string, number> = {};
    history.forEach((h: { articleId: string; }) => {
      const art = ARTICLES.find((a) => a.id === h.articleId);
      if (art) {
        genreCounts[art.category] = (genreCounts[art.category] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId },
      select: { score: true },
    });
    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum: any, q: { score: any; }) => sum + q.score, 0) / quizAttempts.length)
      : 0;

    return NextResponse.json({
      minutesRead: totalMinutes,
      articlesCompleted: completedCount,
      streakDays: currentStreak,
      totalSeconds,
      avgQuizScore,
      topGenres,
    });
  } catch (error: any) {
    console.error("GET User Stats API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
