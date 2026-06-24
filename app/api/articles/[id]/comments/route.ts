export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const COMMENTS_FILE = path.join(process.cwd(), "app", "data", "comments.json");

const loadComments = (): any[] => {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const data = fs.readFileSync(COMMENTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading comments file:", err);
  }
  return [];
};

const saveComments = (comments: any[]) => {
  try {
    const dir = path.dirname(COMMENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing comments file:", err);
  }
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: articleId } = await params;
  const comments = loadComments();
  const articleComments = comments.filter((c) => c.articleId === articleId);
  return NextResponse.json(articleComments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: articleId } = await params;
  const { author, content, parentId } = await req.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }

  const comments = loadComments();
  const newComment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    articleId,
    author: author && author.trim() ? author.trim() : "Anonymous Scholar",
    content: content.trim(),
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);
  saveComments(comments);

  return NextResponse.json(newComment, { status: 201 });
}