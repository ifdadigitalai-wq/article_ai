import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

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
      return NextResponse.json({ error: "Forbidden: Admins/Faculty only" }, { status: 403 });
    }

    const body = await req.json();
    const { topicContext, lineCount } = body;

    if (!topicContext || !lineCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = 
      "You are an academic curriculum editor. Generate a highly detailed educational article " +
      "based on the topic context and requested line length. Respond ONLY with a raw JSON object. " +
      "Do not wrap the JSON output in markdown code blocks or triple backticks. " +
      "The JSON object must contain exactly these fields: " +
      "\"title\" (string), \"subtitle\" (string), \"category\" (string, e.g. Technology, Science, Environment, Architecture, Management), " +
      "\"snippet\" (string, 1-2 sentence preview), \"content\" (string, detailed article body in Markdown containing headers (##), occasional bold text (**) used very sparingly for specific terms only, bullet points (*), and quotes (>). Keep paragraphs and general text in normal font weight, do not wrap entire sentences or paragraphs in bold. It must have roughly the requested number of lines/paragraphs), " +
      "and \"imageAlt\" (string, descriptive alt tag for a related cover image).";

    const userPrompt = `Topic Context: ${topicContext}\nRequested length: ~${lineCount} lines/paragraphs.`;

    // 1. Try Groq API first
    const groqApiKey = process.env.GROQ_API_KEY;
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
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.choices[0].message.content || "{}";
          const parsedArticle = JSON.parse(jsonText);
          return NextResponse.json(parsedArticle, { status: 200 });
        } else {
          console.error("Groq AI Generation API Error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq for article generation:", err);
      }
    }

    // 2. Fallback to Gemini
    if (ai) {
      try {
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: {
            responseMimeType: "application/json",
          },
        });

        const geminiText = geminiResponse.text || "{}";
        const parsedArticle = JSON.parse(geminiText);
        return NextResponse.json(parsedArticle, { status: 200 });
      } catch (err) {
        console.error("Gemini article generation failed:", err);
      }
    }

    // 3. No AI keys configured
    return NextResponse.json(
      { error: "No AI provider is configured. Please set GROQ_API_KEY or GEMINI_API_KEY in your environment." },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Generate Article API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
