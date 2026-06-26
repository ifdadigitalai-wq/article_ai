import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const userRole = payload.role as string;
    if (userRole !== "faculty" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins/Faculty only" }, { status: 403 });
    }

    // Fetch all comments along with user details
    const dbComments = await prisma.comment.findMany({
      include: {
        user: {
          select: {
            name: true,
            role: true,
            department: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch custom articles to resolve titles
    let customArticles: any[] = [];
    try {
      customArticles = await prisma.customArticle.findMany({
        select: { id: true, title: true },
      });
    } catch (err) {
      console.error("Error fetching custom articles in comments API:", err);
    }

    // Build article title index
    const articleTitles = new Map<string, string>();
    ARTICLES.forEach((a) => articleTitles.set(a.id, a.title));
    customArticles.forEach((a) => articleTitles.set(a.id, a.title));

    // Map database comments to response format
    const comments = dbComments.map((c) => ({
      id: c.id,
      articleId: c.articleId,
      articleTitle: articleTitles.get(c.articleId) || "Syllabus Resource",
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      likes: c.likes,
      author: c.user.name,
      authorRole: c.user.role,
      authorDept: c.user.department,
      authorAvatar: c.user.avatar,
    }));

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error("GET Admin Comments API Error:", error);
    return NextResponse.json({ error: "Failed to load admin comments feed" }, { status: 500 });
  }
}
