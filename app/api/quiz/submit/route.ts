import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

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

    const userId = payload.userId as string;
    const { quizId, answers } = await req.json();

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Quiz ID and answers array are required" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = quiz.questions as any[];
    let score = 0;
    const correctAnswers = questions.map((q) => q.answer);

    answers.forEach((ans, index) => {
      if (index < correctAnswers.length && ans === correctAnswers[index]) {
        score++;
      }
    });

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        answers: answers,
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalQuestions: correctAnswers.length,
      correctAnswers,
    });
  } catch (error: any) {
    console.error("Quiz submit API error:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
