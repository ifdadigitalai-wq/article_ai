import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.newsletter.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({
        message: `You are already subscribed to The Editorial's Weekly Read. Your curated digest will arrive every Sunday at ${email.trim()}.`,
      });
    }

    // Persist subscription
    await prisma.newsletter.create({
      data: {
        email: email.trim().toLowerCase(),
      },
    });

    return NextResponse.json({
      message: `Welcome to The Editorial's Weekly Read. Your curated digest will arrive every Sunday at ${email.trim()}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Subscription failed. Please try again." },
      { status: 500 }
    );
  }
}
