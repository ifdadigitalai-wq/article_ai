import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { ARTICLES } from "@/app/data/articles";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    const { articleId, articleContent } = await req.json();

    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
    }

    // 1. Check if quiz already exists for this article in the DB
    const existingQuiz = await prisma.quiz.findUnique({
      where: { articleId },
    });

    if (existingQuiz) {
      return NextResponse.json(existingQuiz);
    }

    // Determine article content
    let content = articleContent;
    const article = ARTICLES.find((a) => a.id === articleId);
    if (article) {
      content = article.content;
    } else {
      try {
        const customArt = await prisma.customArticle.findUnique({
          where: { id: articleId }
        });
        if (customArt) {
          content = customArt.content;
        }
      } catch (err) {
        console.error("Error looking up custom article for quiz:", err);
      }
    }

    if (!content) {
      return NextResponse.json({ error: "Article content is required to generate quiz" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    let questions = null;

    // 2. Try generating via Groq
    if (groqApiKey && groqApiKey.trim() !== "") {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are an academic testing assistant. Generate exactly 5 multiple choice questions (MCQs) based on the provided article content. " +
                  "Each question must have exactly 4 choices (options) and a correct answer index (0-3). " +
                  "Respond ONLY with a JSON object containing a 'questions' array. Each question object must have 'question' (string), 'options' (array of 4 strings), and 'answer' (integer from 0 to 3). " +
                  "Do not wrap output in markdown code blocks.",
              },
              {
                role: "user",
                content: `Article content:\n\n${content}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.choices[0].message.content || "{}";
          const parsed = JSON.parse(jsonText);
          if (parsed && Array.isArray(parsed.questions)) {
            questions = parsed.questions;
          }
        } else {
          console.error("Groq Quiz API error:", await response.text());
        }
      } catch (err) {
        console.error("Error generating quiz with Groq:", err);
      }
    }

    // 3. Try generating via Gemini fallback
    if (!questions && ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Create a 5-question multiple choice quiz on this text. Each question must have 4 options and the index of the correct answer (0-3):\n\n${content}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      answer: { type: Type.INTEGER },
                    },
                    required: ["question", "options", "answer"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed && Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        }
      } catch (err) {
        console.error("Gemini quiz generation failed:", err);
      }
    }

    // 4. Default Mock quiz fallback if both APIs fail
    if (!questions) {
      questions = [
        {
          question: "What is the primary topic of the article?",
          options: [
            "Urban planning and infrastructure",
            "Aesthetic sensory processing",
            "The growth of digital media hubs",
            "Environmental recycling initiatives",
          ],
          answer: 1,
        },
        {
          question: "Which term describes the main architectural philosophy discussed?",
          options: ["Minimalist utility", "Sensory calm structures", "High-density zoning", "Baroque embellishment"],
          answer: 1,
        },
        {
          question: "What does the author suggest is the direct impact of architectural spacing on individuals?",
          options: [
            "It controls their commuting times",
            "It shapes their cognitive focus and mental calm",
            "It affects their metabolic speed",
            "It has negligible influence compared to digital screens",
          ],
          answer: 1,
        },
        {
          question: "How are student reading routines characterized in the text?",
          options: [
            "Predominantly digital and fragmented",
            "Primarily manual and library-dependent",
            "Structured around collaborative projects",
            "Non-existent during active semesters",
          ],
          answer: 0,
        },
        {
          question: "What is recommended to counter contemporary information overload?",
          options: [
            "Switching off electronic devices permanently",
            "Designing deliberate focus zones and curated digital channels",
            "Increasing the quantity of read material daily",
            "Relocating to isolated communities",
          ],
          answer: 1,
        },
      ];
    }

    // 5. Save generated quiz to the DB
    const quiz = await prisma.quiz.create({
      data: {
        articleId,
        questions: questions,
      },
    });

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error("Quiz generate API error:", error);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
