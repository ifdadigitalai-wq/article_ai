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

    const userRole = payload.role as string;
    if (userRole !== "faculty" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins/Faculty only" }, { status: 403 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const history = await prisma.readingHistory.findMany({
      where: {
        readAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        readAt: true,
      },
    });

    const readsPerDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      readsPerDay[dateStr] = 0;
    }

    history.forEach((h) => {
      const dateStr = new Date(h.readAt).toISOString().split("T")[0];
      if (readsPerDay[dateStr] !== undefined) {
        readsPerDay[dateStr]++;
      }
    });

    const articlesReadPerDay = Object.entries(readsPerDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const activeUsersRes = await prisma.readingHistory.groupBy({
      by: ["userId"],
      where: {
        readAt: {
          gte: sevenDaysAgo,
        },
      },
    });
    const activeUsersCount = activeUsersRes.length;

    const totalUsersCount = await prisma.user.count();

    const topArticlesRes = await prisma.readingHistory.groupBy({
      by: ["articleId", "articleTitle"],
      _count: {
        articleId: true,
      },
      orderBy: {
        _count: {
          articleId: "desc",
        },
      },
      take: 5,
    });

    const topArticles = topArticlesRes.map((t) => ({
      articleId: t.articleId,
      articleTitle: t.articleTitle,
      reads: t._count.articleId,
    }));

    return NextResponse.json({
      articlesReadPerDay,
      activeUsers: activeUsersCount,
      totalUsers: totalUsersCount,
      topArticles,
    });
  } catch (error: any) {
    console.error("GET Admin Analytics API Error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
