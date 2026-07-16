import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
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

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 403 });
    }

    const students = await prisma.user.findMany({
      where: {
        role: "student",
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.error("GET Admin Students Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, rollNumber, branch, batch, isPaid } = body;

    if (!name || !email || !password || !branch || !batch) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        rollNumber: rollNumber || null,
        branch,
        batch,
        role: "student",
        adminId: admin.id,
        isPaid: isPaid ?? false,
        isActive: true, // starts active by default
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

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("POST Admin Students Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
