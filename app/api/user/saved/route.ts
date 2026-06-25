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

    const saved = await prisma.savedArticle.findMany({
      where: { userId },
    });

    const records = saved.map((s) => ({
      id: s.id,
      articleId: s.articleId,
      bookmarkedAt: s.savedAt.toISOString(),
      completed: s.completed,
      progressPercent: s.progressPercent,
      lastReadAt: s.lastReadAt.toISOString(),
    }));

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("GET Saved Articles API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const { articleId, articleTitle, articleUrl } = await req.json();

    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
    }

    const existing = await prisma.savedArticle.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existing) {
      await prisma.savedArticle.delete({
        where: {
          id: existing.id,
        },
      });
      return NextResponse.json({ saved: false });
    } else {
      const record = await prisma.savedArticle.create({
        data: {
          userId,
          articleId,
          articleTitle: articleTitle || "Untitled Article",
          articleUrl: articleUrl || null,
          completed: false,
          progressPercent: 0,
        },
      });

      return NextResponse.json({
        saved: true,
        record: {
          id: record.id,
          articleId: record.articleId,
          bookmarkedAt: record.savedAt.toISOString(),
          completed: record.completed,
          progressPercent: record.progressPercent,
          lastReadAt: record.lastReadAt.toISOString(),
        },
      });
    }
  } catch (error: any) {
    console.error("POST Saved Articles API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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
    const { articleId, completed, progressPercent, articleTitle } = await req.json();

    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
    }

    const existing = await prisma.savedArticle.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    let record;
    const lastReadAt = new Date();

    if (existing) {
      record = await prisma.savedArticle.update({
        where: { id: existing.id },
        data: {
          completed: completed !== undefined ? completed : existing.completed,
          progressPercent: progressPercent !== undefined ? progressPercent : existing.progressPercent,
          lastReadAt,
        },
      });
    } else {
      record = await prisma.savedArticle.create({
        data: {
          userId,
          articleId,
          articleTitle: articleTitle || "Untitled Article",
          completed: completed !== undefined ? completed : false,
          progressPercent: progressPercent !== undefined ? progressPercent : 0,
          lastReadAt,
        },
      });
    }

    if (completed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayStreak = await prisma.readingStreak.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      if (!todayStreak) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayStreak = await prisma.readingStreak.findUnique({
          where: {
            userId_date: {
              userId,
              date: yesterday,
            },
          },
        });

        const newCount = yesterdayStreak ? yesterdayStreak.count + 1 : 1;

        await prisma.readingStreak.create({
          data: {
            userId,
            date: today,
            count: newCount,
          },
        });
      }
    }

    return NextResponse.json({
      id: record.id,
      articleId: record.articleId,
      bookmarkedAt: record.savedAt.toISOString(),
      completed: record.completed,
      progressPercent: record.progressPercent,
      lastReadAt: record.lastReadAt.toISOString(),
    });
  } catch (error: any) {
    console.error("PATCH Saved Articles API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
