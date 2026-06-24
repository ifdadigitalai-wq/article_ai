import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { articleTitle, articleContent, voice } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const prompt = `You are a professional radio broadcaster narrating for "THE EDITORIAL Daily Dispatch".
Translate the following article content into a beautifully flowing, narrative audio-friendly script suitable for a solo podcast broadcast.
Article Title: "${articleTitle}"
Article Content: "${articleContent}"

Format of narration:
Start with: "Welcome to The Editorial Daily Dispatch. I am your host, narrating in our signature ${voice || 'Classic British'} voice."
Summarize, analyze, and read key passages from the article. Keep the narration highly captivating, smart, and fluent.

You MUST respond with a valid JSON object matching this schema:
{
  "script": "The full narrative script text here (around 200 words max)."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = JSON.parse(replyText || "{}");

    return NextResponse.json({
      script: result.script || "Audio script generation failed. Please try again.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate dispatch audio" }, { status: 500 });
  }
}