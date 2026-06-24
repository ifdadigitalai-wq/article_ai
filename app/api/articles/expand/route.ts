import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { title, subtitle, snippet, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const prompt = `You are a Senior Editor and investigative journalist for 'The Editorial', a prestigious print magazine known for deep intellectual commentary.
We have received a brief real-time news wire dispatch:
Title: ${title}
Subtitle: ${subtitle || ""}
Snippet: ${snippet || ""}
Original Wire: ${content}

Please expand this brief news wire into a comprehensive, high-quality, professional editorial analysis of approximately 350 to 500 words. 

Guidelines:
1. Organize the article with clear markdown headings (e.g. ## Introduction, ## Key Developments, ## Structural Implications).
2. Maintain a sophisticated, intellectual, yet engaging journalistic tone.
3. Dedicate paragraphs to exploring background context, potential implications, and future outlook.
4. Do NOT hallucinate names of private individuals; focus on analytical and systemic aspects.
5. Return ONLY the markdown content of the expanded article. Do not include any greeting or conversational filler.`;

    // 1. Try Groq (Llama 3.3)
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
                content: "You are a professional editorial writer. Output only the requested article in markdown."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const expandedText = data.choices[0].message.content || "";
          return NextResponse.json({ content: expandedText });
        } else {
          console.error("Groq Expand API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq Expand API:", err);
      }
    }

    // 2. Fallback to Gemini
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        return NextResponse.json({ content: response.text || "" });
      } catch (err) {
        console.error("Gemini Expand failed:", err);
      }
    }

    // 3. Last fallback: local content clean-up
    const fallbackText = `## ${title}

${subtitle || "Live updates from the press desk."}

${content.replace(/\[\+\d+ chars\]$/, "")}

This report was compiled from global wire reports. Due to connectivity issues at the local terminal, the full analysis is currently running in abbreviated wire format. Our editorial desk is continuously parsing details to expand the record.

***

*View original briefs for further details.*`;

    return NextResponse.json({ content: fallbackText });
  } catch (error) {
    console.error("Expand API error:", error);
    return NextResponse.json({ error: "Failed to expand article" }, { status: 500 });
  }
}
