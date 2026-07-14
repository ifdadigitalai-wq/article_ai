import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { categories = [], customFocus = "" } = await request.json();
    const groqApiKey = process.env.GROQ_API_KEY;

    const promptText = `Write a Daily Brief narrative on topics: ${categories.join(", ")}.${
      customFocus ? ` Focus theme / instructions: ${customFocus}.` : ""
    } Keep the tone highly sophisticated, literary, and premium.`;

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
                content: "You are an AI editor compiling a morning digest. Respond ONLY with a JSON object matching this schema: {\n  \"headline\": string,\n  \"narrative\": string\n}. Do not include markdown tags like ```json ... ```, just output raw JSON."
              },
              {
                role: "user",
                content: promptText
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.choices[0].message.content || "{}";
          return NextResponse.json(JSON.parse(jsonText));
        } else {
          console.error("Groq Morning Digest API error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq Morning Digest:", err);
      }
    }

    // 2. Try Gemini
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                narrative: { type: Type.STRING }
              },
              required: ["headline", "narrative"]
            }
          }
        });

        return NextResponse.json(JSON.parse(response.text || "{}"));
      } catch (err) {
        console.error("Gemini Morning Digest failed:", err);
      }
    }

    // 3. Dynamic fallback mapping when no key is configured
    const categoryMocks: Record<string, string> = {
      World: "Across global borders, diplomatic summits are reshaping international trade agreements for the digital era.",
      Tech: "In technology, quantum computing laboratories are announcing breakthroughs in coherence times, bringing us closer to practical quantum supremacy.",
      Science: "In science, researchers have cataloged new genomic pathways that could enable organ self-regeneration in mammals.",
      Culture: "In culture, modern curators are utilizing neural rendering to digitize and preserve ancient historic ruins in high fidelity.",
      Politics: "In politics, new legislative initiatives aim to regulate AI deployment across state public services.",
      Environment: "In environmental news, vertical forest developments in major metropolitan centers are successfully reducing urban heat island effects."
    };

    const selectedNarratives = categories
      .map((cat: string) => categoryMocks[cat as keyof typeof categoryMocks])
      .filter(Boolean);

    let headline = categories.slice(0, 2).join(" & ") + " Convergence";
    if (categories.length === 1) headline = `Deep Dive: Focus on ${categories[0]}`;
    if (categories.length === 0) headline = "Daily General Briefing";
    if (customFocus) headline = `Briefing: ${customFocus}`;

    let narrative = `Good morning. Today's report compiles insights across ${categories.join(", ") || "various global wires"}. `;
    if (customFocus) {
      narrative += `Specifically analyzing developments in line with your focus: "${customFocus}". `;
    }
    narrative += selectedNarratives.length > 0 
      ? selectedNarratives.join(" ") 
      : "Curating developments across geopolitics, subatomic science, and cultural preservation.";

    return NextResponse.json({ headline, narrative });
  } catch (err: any) {
    console.error("Morning digest compilation failed:", err);
    return NextResponse.json({ error: "Failed to compile morning briefing" }, { status: 500 });
  }
}