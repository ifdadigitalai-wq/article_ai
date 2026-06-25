export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: articleId } = await params;

    const dbComments = await prisma.comment.findMany({
      where: { articleId },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const comments = dbComments.map((c: { id: any; articleId: any; user: { name: any; role: any; department: any; }; content: any; parentId: any; createdAt: { toISOString: () => any; }; likes: any; }) => ({
      id: c.id,
      articleId: c.articleId,
      author: c.user.name,
      authorRole: c.user.role,
      authorDept: c.user.department,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      likes: c.likes,
    }));

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error("GET Comments API Error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: articleId } = await params;
    const { content, parentId } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.comment.create({
      data: {
        articleId,
        content: content.trim(),
        parentId: parentId || null,
        userId: payload.userId as string,
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        articleId: comment.articleId,
        author: comment.user.name,
        authorRole: comment.user.role,
        authorDept: comment.user.department,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        likes: comment.likes,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST Comment API Error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}