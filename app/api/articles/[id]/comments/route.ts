export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { ARTICLES } from "@/app/data/articles";
import { createNotification } from "@/lib/notifications";

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
            branch: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const comments = dbComments.map((c: { id: any; articleId: any; user: { name: any; role: any; branch: any; }; content: any; parentId: any; createdAt: { toISOString: () => any; }; likes: any; }) => ({
      id: c.id,
      articleId: c.articleId,
      author: c.user.name,
      authorRole: c.user.role,
      authorBranch: c.user.branch,
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
            branch: true,
          },
        },
      },
    });

    // Notify corresponding users about the new comment
    try {
      const commenterId = payload.userId as string;
      const commenterName = comment.user.name;
      const commenterRole = comment.user.role;

      // 1. Resolve article title & creator
      let articleTitle = "Article";
      let articleCreatorId: string | null = null;

      const customArticle = await prisma.customArticle.findUnique({
        where: { id: articleId },
        select: { title: true, createdBy: true },
      });
      if (customArticle) {
        articleTitle = customArticle.title;
        articleCreatorId = customArticle.createdBy;
      } else {
        const staticArt = ARTICLES.find((a) => a.id === articleId);
        if (staticArt) {
          articleTitle = staticArt.title;
        }
      }

      const usersToNotify = new Set<string>();

      // A. Notify article creator (if different from commenter)
      if (articleCreatorId && articleCreatorId !== commenterId) {
        usersToNotify.add(articleCreatorId);
      }

      // B. If a student comments -> Notify all admins (who are not the commenter)
      if (commenterRole === "student") {
        const admins = await prisma.user.findMany({
          where: { role: "admin", id: { not: commenterId } },
          select: { id: true },
        });
        admins.forEach((admin) => usersToNotify.add(admin.id));
      }

      // C. If an admin comments -> Notify all students who commented on this article previously
      if (commenterRole === "admin") {
        const previousCommenters = await prisma.comment.findMany({
          where: { articleId, userId: { not: commenterId } },
          select: { userId: true },
        });
        previousCommenters.forEach((pc) => usersToNotify.add(pc.userId));
      }

      // D. If it is a reply -> Notify the parent comment author (if different from commenter)
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { userId: true },
        });
        if (parentComment && parentComment.userId !== commenterId) {
          usersToNotify.add(parentComment.userId);
        }
      }

      // Dispatch notifications
      const notifyPromises = Array.from(usersToNotify).map((targetUserId) =>
        createNotification({
          userId: targetUserId,
          senderId: commenterId,
          senderName: commenterName,
          type: "comment",
          message: `${commenterName} commented on "${articleTitle}"`,
          articleId,
        })
      );
      await Promise.all(notifyPromises);
    } catch (notifyErr) {
      console.error("Failed to send comment notifications:", notifyErr);
    }

    return NextResponse.json(
      {
        id: comment.id,
        articleId: comment.articleId,
        author: comment.user.name,
        authorRole: comment.user.role,
        authorBranch: comment.user.branch,
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