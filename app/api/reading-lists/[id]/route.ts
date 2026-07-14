export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json(
        { error: "Forbidden: Only faculty and admins can modify reading lists" },
        { status: 403 }
      );
    }

    const { title, articleIds, isPublic, branch } = await req.json();

    if (!title || !Array.isArray(articleIds) || !branch) {
      return NextResponse.json(
        { error: "Title, articleIds array, and branch are required" },
        { status: 400 }
      );
    }

    // Verify reading list exists
    const list = await prisma.readingList.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json({ error: "Reading list not found" }, { status: 404 });
    }

    const updatedList = await prisma.readingList.update({
      where: { id },
      data: {
        title,
        articleIds,
        isPublic: isPublic !== undefined ? isPublic : true,
        branch,
      },
    });

    return NextResponse.json(updatedList);
  } catch (error: any) {
    console.error("PUT Reading List API Error:", error);
    return NextResponse.json({ error: "Failed to update reading list" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json(
        { error: "Forbidden: Only faculty and admins can delete reading lists" },
        { status: 403 }
      );
    }

    // Verify reading list exists
    const list = await prisma.readingList.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json({ error: "Reading list not found" }, { status: 404 });
    }

    await prisma.readingList.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Reading list deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Reading List API Error:", error);
    return NextResponse.json({ error: "Failed to delete reading list" }, { status: 500 });
  }
}
