import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT, signJWT } from "@/lib/auth";

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        rollNumber: true,
        branch: true,
        batch: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("GET Profile API Error:", error);
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

    const { name, branch, batch, avatar, phoneNumber, email, role } = await req.json();

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { email: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check email uniqueness if email has changed
    if (email && email !== currentUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: payload.userId as string },
        },
      });

      if (emailExists) {
        return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (branch !== undefined) updateData.branch = branch;
    if (batch !== undefined) updateData.batch = batch;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (email !== undefined) updateData.email = email || currentUser.email;
    if (role !== undefined) updateData.role = role || currentUser.role;

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId as string },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        rollNumber: true,
        branch: true,
        batch: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Sync author details in all CustomArticle records posted by this user
    await prisma.customArticle.updateMany({
      where: { createdBy: payload.userId as string },
      data: {
        authorAvatar: updatedUser.avatar,
        authorName: updatedUser.name,
      },
    });

    const response = NextResponse.json(updatedUser);

    // Re-sign cookie if key auth properties changed
    if (updatedUser.email !== currentUser.email || updatedUser.role !== currentUser.role) {
      const newToken = await signJWT({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      });

      response.cookies.set("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
      });
    }

    return response;
  } catch (error: any) {
    console.error("POST Profile API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
