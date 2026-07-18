export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completions = await prisma.savedArticle.groupBy({
      by: ["userId"],
      where: {
        completed: true,
        lastReadAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        articleId: true,
      },
      orderBy: {
        _count: {
          articleId: "desc",
        },
      },
      take: 10,
    });

    // Batch fetch all users in a single query instead of N+1
    const userIds = completions.map((c) => c.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        branch: true,
        batch: true,
        rollNumber: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = completions.map((c, index) => {
      const user = userMap.get(c.userId);
      return {
        rank: index + 1,
        name: user?.name || "Unknown Student",
        branch: user?.branch || "N/A",
        batch: user?.batch || "N/A",
        rollNumber: user?.rollNumber || "N/A",
        articlesRead: c._count.articleId,
      };
    });

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error("GET Leaderboard API Error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
