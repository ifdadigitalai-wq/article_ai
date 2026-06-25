import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { articleTitle, articleContent, voice } = await req.json();
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

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
                content: "You are a professional radio broadcaster. Respond ONLY with a JSON object containing 'script' (a string). Do not include markdown tags like ```json ... ```, just output raw JSON."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.choices[0].message.content || "{}";
          const result = JSON.parse(replyText);
          return NextResponse.json({
            script: result.script || "Audio script generation failed. Please try again.",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          });
        } else {
          console.error("Groq Podcast Generator API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq Podcast Generator:", err);
      }
    }

    // 2. Try Gemini
    if (geminiApiKey && geminiApiKey.trim() !== "") {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const result = JSON.parse(replyText || "{}");
          return NextResponse.json({
            script: result.script || "Audio script generation failed. Please try again.",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          });
        } else {
          const errText = await response.text();
          console.error(`Gemini Podcast Generator API error: ${errText}`);
        }
      } catch (err) {
        console.error("Error communicating with Gemini Podcast Generator:", err);
      }
    }

    // 3. Fallback script response
    return NextResponse.json({
      script: `Welcome to The Editorial Daily Dispatch. Here is a custom narrative read for the article titled "${articleTitle}". To enjoy fully personalized AI-driven narrative scripts, please configure either your GROQ_API_KEY or GEMINI_API_KEY in your local workspace. Until then, our pre-recorded dispatch system will continue to service your library.`,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate dispatch audio" }, { status: 500 });
  }
}