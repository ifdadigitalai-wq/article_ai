import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { ARTICLES } from "../../data/articles";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { articleId, articleContent } = await request.json();
    const article = ARTICLES.find((a) => a.id === articleId);
    const content = article ? article.content : articleContent;

    if (!content) {
      return NextResponse.json({ error: "Article content is required" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    // 1. If Groq API Key is configured, use Groq Llama 3.3 model in JSON Mode
    if (groqApiKey && groqApiKey.trim() !== "") {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are an AI summarizer. Respond ONLY with a JSON object containing 'bulletPoints' (an array of strings) and 'keyTakeaway' (a string). Do not include any markdown styling like ```json ... ```, just output raw JSON."
              },
              {
                role: "user",
                content: `Summarize the following news article. Provide exactly 3 key arguments in 'bulletPoints' and 1 core takeaway in 'keyTakeaway':\n\n${content}`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.choices[0].message.content || "{}";
          return NextResponse.json(JSON.parse(jsonText));
        } else {
          console.error("Groq API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq summarizer:", err);
      }
    }

    // 2. Fallback to Gemini
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Summarize this: ${content}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyTakeaway: { type: Type.STRING }
              },
              required: ["bulletPoints", "keyTakeaway"]
            }
          }
        });
        return NextResponse.json(JSON.parse(response.text || "{}"));
      } catch (err) {
        console.error("Gemini summary failed:", err);
      }
    }

    // 3. Last fallback: Mock summary
    return NextResponse.json({
      bulletPoints: [
        "A profound exploration of modern aesthetics.",
        "Draws structural connections between human sensory calm and minimal space.",
        "Emphasizes vital balance in contemporary urban planning."
      ],
      keyTakeaway: "Compelling thesis proving surrounding spaces directly shape mental focus."
    });
  } catch (error) {
    console.error("Summarization route error:", error);
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 });
  }
}