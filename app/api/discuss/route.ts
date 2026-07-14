import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ARTICLES } from "../../data/articles";
import { prisma } from "@/lib/prisma";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { articleId, articleContent, messages } = await request.json();
    let content = articleContent;
    const article = ARTICLES.find((a) => a.id === articleId);
    if (article) {
      content = article.content;
    } else if (articleId) {
      try {
        const customArt = await prisma.customArticle.findUnique({
          where: { id: articleId }
        });
        if (customArt) {
          content = customArt.content;
        }
      } catch (err) {
        console.error("Error looking up custom article for discuss:", err);
      }
    }

    if (!content) {
      return NextResponse.json({ reply: "I apologize, but I lost context of the article content. Could you re-open it?" });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    // 1. Groq completions if key is configured
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
                content: `You are the chief Editor of 'The Editorial'. Discuss the following article with the reader: ${content}. Keep your replies brief (between 2 to 4 sentences maximum) and adopt an intellectual, sophisticated, yet encouraging editorial tone.`
              },
              ...messages.map((m: any) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.text
              }))
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.choices[0].message.content || "";
          return NextResponse.json({ reply: replyText });
        } else {
          console.error("Groq chat API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq discuss API:", err);
      }
    }

    // 2. Fallback to Gemini
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: messages.map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }]
          })),
          config: {
            systemInstruction: `You are the chief Editor of 'The Editorial'. Discuss this article: ${content}. Keep replies between 2 to 4 sentences maximum.`
          }
        });
        return NextResponse.json({ reply: response.text || "" });
      } catch (err) {
        console.error("Gemini discuss chat failed:", err);
      }
    }

    // 3. Last fallback: Mock response
    return NextResponse.json({
      reply: "Interesting perspective. To unlock full real-time AI insights, please configure the GROQ_API_KEY or GEMINI_API_KEY in your local environment."
    });
  } catch (error) {
    console.error("Discuss API error:", error);
    return NextResponse.json({ reply: "I apologize, my desk seems to have lost connection to the press wires. Could you try asking again?" });
  }
}