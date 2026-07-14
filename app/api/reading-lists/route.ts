export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    const lists = await prisma.readingList.findMany({
      where: branch ? { branch } : {},
      orderBy: { id: "desc" },
    });

    return NextResponse.json(lists);
  } catch (error: any) {
    console.error("GET Reading Lists API Error:", error);
    return NextResponse.json({ error: "Failed to load reading lists" }, { status: 500 });
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

    const userRole = payload.role as string;
    if (userRole !== "faculty" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only faculty and admins can create reading lists" },
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

    const readingList = await prisma.readingList.create({
      data: {
        title,
        articleIds,
        isPublic: isPublic !== undefined ? isPublic : true,
        branch,
        createdBy: payload.userId as string,
      },
    });

    return NextResponse.json(readingList, { status: 201 });
  } catch (error: any) {
    console.error("POST Reading List API Error:", error);
    return NextResponse.json({ error: "Failed to create reading list" }, { status: 500 });
  }
}
