import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, articleTitle, articleSnippet } = await req.json();
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are the Editor-in-Chief of "THE EDITORIAL", a prestigious modernist literary & culture magazine.
You are helping a reader analyze and discuss the article titled "${articleTitle}": "${articleSnippet}".
Engage in a thoughtful, intellectually stimulating dialogue. Keep your tone highly articulate, editorial, critical yet engaging.`;

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
                content: systemPrompt
              },
              ...messages.map((m: any) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content || m.text
              }))
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.choices[0].message.content || "";
          return NextResponse.json({ content: replyText });
        } else {
          console.error("Groq Ask Editor API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq Ask Editor:", err);
      }
    }

    // 2. Try Gemini
    if (geminiApiKey && geminiApiKey.trim() !== "") {
      try {
        const contents = [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...messages.map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content || m.text }]
          }))
        ];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Editor is deep in contemplation. Please try again soon.";
          return NextResponse.json({ content: reply });
        } else {
          const errText = await response.text();
          console.error(`Gemini Ask Editor API error: ${errText}`);
        }
      } catch (err) {
        console.error("Error communicating with Gemini Ask Editor:", err);
      }
    }

    // 3. Fallback editor response
    return NextResponse.json({
      content: "Thank you for sharing your thoughts on this piece. To unlock deep real-time discussion, please configure either the GROQ_API_KEY or GEMINI_API_KEY in your local environment."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to contact the Editor" }, { status: 500 });
  }
}