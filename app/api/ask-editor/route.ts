import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, articleTitle, articleSnippet } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const systemPrompt = `You are the Editor-in-Chief of "THE EDITORIAL", a prestigious modernist literary & culture magazine.
You are helping a reader analyze and discuss the article titled "${articleTitle}": "${articleSnippet}".
Engage in a thoughtful, intellectually stimulating dialogue. Keep your tone highly articulate, editorial, critical yet engaging.`;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }))
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Editor is deep in contemplation. Please try again soon.";

    return NextResponse.json({ content: reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to contact the Editor" }, { status: 500 });
  }
}