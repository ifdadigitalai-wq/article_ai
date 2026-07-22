import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const detailed = url.searchParams.get("detailed") === "true";

    if (detailed) {
      const history = await prisma.readingHistory.findMany({
        where: { userId },
        orderBy: { readAt: "desc" },
      });
      // Deduplicate by articleId keeping the latest readAt
      const uniqueMap = new Map<string, typeof history[0]>();
      for (const entry of history) {
        if (!uniqueMap.has(entry.articleId)) {
          uniqueMap.set(entry.articleId, entry);
        }
      }
      return NextResponse.json(Array.from(uniqueMap.values()));
    } else {
      const history = await prisma.readingHistory.findMany({
        where: { userId },
        orderBy: { readAt: "desc" },
        select: { articleId: true },
      });
      const articleIds = Array.from(new Set(history.map((h) => h.articleId)));
      return NextResponse.json(articleIds);
    }
  } catch (error: any) {
    console.error("GET Reading History API Error:", error);
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
    const { articleId, articleTitle, timeSpentSeconds } = await req.json();

    if (!articleId || !articleTitle || timeSpentSeconds === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const timeSpent = parseInt(timeSpentSeconds) || 0;

    const existing = await prisma.readingHistory.findFirst({
      where: { userId, articleId },
    });

    if (existing) {
      const updated = await prisma.readingHistory.update({
        where: { id: existing.id },
        data: {
          readAt: new Date(),
          articleTitle,
          timeSpentSeconds: timeSpent > 0 ? Math.max(existing.timeSpentSeconds, timeSpent) : existing.timeSpentSeconds,
        },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    const record = await prisma.readingHistory.create({
      data: {
        userId,
        articleId,
        articleTitle,
        timeSpentSeconds: timeSpent,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error("POST Reading History API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
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

    await prisma.readingHistory.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Reading History API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
