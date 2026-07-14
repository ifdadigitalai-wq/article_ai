import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { articleTitle, articleContent } = await req.json();
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    const prompt = `Analyze the article titled "${articleTitle}" with the following content:
"${articleContent}"

Generate a beautiful structured executive summary of this article.
You MUST respond with a valid JSON object exactly matching this schema:
{
  "bullets": ["Point 1 (15 words max)", "Point 2 (15 words max)", "Point 3 (15 words max)"],
  "thesis": "A deep 1-sentence editorial thesis summarizing the core philosophy (30 words max).",
  "takeaway": "A singular, memorable intellectual takeaway for the reader (25 words max)."
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
                content: "You are an AI summarizer. Respond ONLY with a JSON object containing 'bullets' (an array of strings), 'thesis' (a string) and 'takeaway' (a string). Do not include any markdown styling like ```json ... ```, just output raw JSON. Ensure all bullet points, thesis, and takeaways are grammatically correct, capitalized, and start with correct words (e.g. 'The' instead of 'he' or other typos)."
              },
              {
                role: "user",
                content: prompt
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
          console.error("Groq Quick Summary API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq Quick Summary:", err);
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
          return NextResponse.json(JSON.parse(replyText || "{}"));
        } else {
          console.error("Gemini Quick Summary API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Gemini Quick Summary:", err);
      }
    }

    // 3. Fallback Mock Summary
    return NextResponse.json({
      bullets: [
        "A compelling perspective on modern complex topics.",
        "Draws clear structural linkages across multiple domains.",
        "Emphasizes the critical balance required for future progress."
      ],
      thesis: "An analytical synthesis of the key forces driving today's systemic shifts.",
      takeaway: "Embrace critical reasoning to successfully navigate upcoming architectural trends."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate quick summary" }, { status: 500 });
  }
}