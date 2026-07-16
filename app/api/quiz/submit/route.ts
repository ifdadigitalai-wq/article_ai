import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { ARTICLES } from "@/app/data/articles";

async function getArticleTitle(articleId: string): Promise<string> {
  // 1. Check static local articles
  const staticArt = ARTICLES.find((a) => a.id === articleId);
  if (staticArt) return staticArt.title;

  // 2. Check DB custom articles
  try {
    const customArt = await prisma.customArticle.findUnique({
      where: { id: articleId },
      select: { title: true }
    });
    if (customArt) return customArt.title;
  } catch (err) {
    console.error("Failed to query custom article for title:", err);
  }

  // 3. Fallback for NewsAPI slug title
  if (articleId.startsWith("news-")) {
    const slug = articleId.substring(5);
    const words = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1));
    return words.join(" ");
  }

  return "Article";
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

    // Add article to reading history when the student submits the quiz
    try {
      const articleTitle = await getArticleTitle(quiz.articleId);
      await prisma.readingHistory.create({
        data: {
          userId,
          articleId: quiz.articleId,
          articleTitle,
          timeSpentSeconds: 60, // standard duration for completing a quiz
        },
      });
      console.log(`Successfully added article ${quiz.articleId} to reading history for user ${userId}`);
    } catch (historyErr) {
      console.error("Failed to append reading history on quiz submit:", historyErr);
    }

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
