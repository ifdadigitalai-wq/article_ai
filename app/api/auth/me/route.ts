import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        department: true,
        batch: true,
        role: true,
        createdAt: true,
        isPaid: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "student") {
      if (!user.isPaid || !user.isActive) {
        const response = NextResponse.json({ error: "Access denied" }, { status: 403 });
        response.cookies.set("token", "", { maxAge: 0, path: "/" });
        return response;
      }
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Auth me API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
