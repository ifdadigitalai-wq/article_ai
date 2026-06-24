import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { categories = [], customFocus = "" } = await request.json();

    if (!ai) {
      // Dynamic fallback mapping when Gemini key is not configured
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
    }

    const promptText = `Write a Daily Brief narrative on topics: ${categories.join(", ")}.${
      customFocus ? ` Focus theme / instructions: ${customFocus}.` : ""
    } Keep the tone highly sophisticated, literary, and premium.`;

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
  } catch (err: any) {
    console.error("Morning digest compilation failed:", err);
    return NextResponse.json({ error: "Failed to compile morning briefing" }, { status: 500 });
  }
}