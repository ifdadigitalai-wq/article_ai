import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // In a production app, you'd persist this to a database or email service.
    // For now, we acknowledge the subscription.
    return NextResponse.json({
      message: `Welcome to The Editorial's Weekly Read. Your curated digest will arrive every Sunday at ${email}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Subscription failed. Please try again." },
      { status: 500 }
    );
  }
}
