import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { articleTitle, articleContent } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const prompt = `Analyze the article titled "${articleTitle}" with the following content:
"${articleContent}"

Generate a beautiful structured executive summary of this article.
You MUST respond with a valid JSON object exactly matching this schema:
{
  "bullets": ["Point 1 (15 words max)", "Point 2 (15 words max)", "Point 3 (15 words max)"],
  "thesis": "A deep 1-sentence editorial thesis summarizing the core philosophy (30 words max).",
  "takeaway": "A singular, memorable intellectual takeaway for the reader (25 words max)."
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
    const summary = JSON.parse(replyText || "{}");

    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate quick summary" }, { status: 500 });
  }
}