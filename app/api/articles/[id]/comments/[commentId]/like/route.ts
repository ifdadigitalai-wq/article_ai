import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      id: comment.id,
      likes: comment.likes,
    });
  } catch (error: any) {
    console.error("PATCH Comment Like API Error:", error);
    return NextResponse.json({ error: "Failed to like comment" }, { status: 500 });
  }
}
