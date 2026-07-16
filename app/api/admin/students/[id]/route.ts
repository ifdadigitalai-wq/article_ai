import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "admin") return null;
  return user;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 403 });
    }

    const { id: studentId } = await params;
    const body = await req.json();
    const { isPaid, isActive } = body;

    // Verify student exists and belongs to this admin
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== "student") {
      return NextResponse.json({ error: "Student not found or access denied" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: {
        ...(isPaid !== undefined && { isPaid }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        branch: true,
        batch: true,
        isPaid: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH Admin Student Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 403 });
    }

    const { id: studentId } = await params;

    // Verify student exists and belongs to this admin
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== "student") {
      return NextResponse.json({ error: "Student not found or access denied" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: studentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Admin Student Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
