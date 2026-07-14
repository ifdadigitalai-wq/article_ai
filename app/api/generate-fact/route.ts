import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

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
                content: "You are a premium science and culture journalist writing for 'THE EDITORIAL'. Respond ONLY with a JSON object matching this schema: {\n  \"title\": string,\n  \"category\": string,\n  \"content\": string,\n  \"readTime\": string\n}. Do not include markdown tags like ```json ... ```, just output raw JSON."
              },
              {
                role: "user",
                content: `Compile a highly detailed, engaging, factual article about the following topic: "${prompt}". Keep your tone sophisticated, literary, and deeply engaging. Provide a clear, captivating title, a category (one of: World, Tech, Science, Culture, Politics, Environment), and the body content formatted with clean paragraphs.`
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
          console.error("Groq Fact Generator error:", await response.text());
        }
      } catch (err) {
        console.error("Error communicating with Groq Fact Generator:", err);
      }
    }

    // 2. Try Gemini
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are a premium science and culture journalist writing for "THE EDITORIAL". 
Compile a highly detailed, engaging, factual article about the following topic: "${prompt}".
Keep your tone sophisticated, literary, and deeply engaging. 
Provide a clear, captivating title, a category (one of: World, Tech, Science, Culture, Politics, Environment), and the body content formatted with clean paragraphs.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                content: { type: Type.STRING },
                readTime: { type: Type.STRING },
              },
              required: ["title", "category", "content", "readTime"],
            },
          },
        });

        const result = JSON.parse(response.text || "{}");
        return NextResponse.json(result);
      } catch (err: any) {
        console.error("Gemini Fact generation failed:", err);
      }
    }

    // 3. Last fallback: Static mock templates based on keywords
    const lowerPrompt = prompt.toLowerCase();
    let title = `The Mysteries of ${prompt}`;
    let category = "Science";
    let content = `In-depth exploration of ${prompt}. Modern research has shown that this field is rapidly evolving, bringing new perspectives on technology, nature, and human understanding.\n\nAs we look deeper, we discover fascinating layers that challenge our conventional wisdom. Scientists and historians continue to probe these anomalies, hoping to unlock deeper truths about our universe.`;

    if (lowerPrompt.includes("quantum")) {
      title = "The Quantum Frontier: Echoes of Superposition";
      category = "Tech";
      content = `Deep within the subatomic realm, quantum computing is redefining the limits of computation. Unlike classical bits that represent either a zero or a one, qubits exist in a state of superposition—simultaneously holding multiple probabilities.\n\nThis quantum entanglement allows calculations of astronomical scale to be performed in mere seconds. From structural molecular mapping to advanced cryptographic systems, the implications of mastering quantum behavior are monumental.\n\nAs researchers push absolute-zero cooling units to their limits, we stand on the precipice of a new computational era where nature's deepest physics becomes our most powerful engine.`;
    } else if (lowerPrompt.includes("sea") || lowerPrompt.includes("ocean")) {
      title = "Abyssal Pioneers: Secrets of the Midnight Zone";
      category = "Environment";
      content = `More people have walked on the surface of the moon than have descended into the deepest trenches of our oceans. The Midnight Zone, lying thousands of meters below sea level, is a realm of absolute darkness and immense hydrostatic pressure.\n\nYet, life thrives here. Biologists have uncovered bizarre ecosystems sustained not by sunlight, but by geothermal chemical synthesis near hydrothermal vents.\n\nThese abyssal discoveries rewrite our definition of habitability, offering crucial clues about potential extraterrestrial life on icy moons like Europa and Enceladus.`;
    } else if (lowerPrompt.includes("alexandria")) {
      title = "The Library of Alexandria: Shadows of Lost Antiquity";
      category = "Culture";
      content = `Founded by Alexander the Great, the Great Library of Alexandria stood as the intellectual capital of the ancient world. It housed hundreds of thousands of papyrus scrolls, representing the sum of human knowledge in mathematics, poetry, physics, and philosophy.\n\nIts destruction remains one of history's greatest tragedies. More than a physical fire, it symbolized a darkness that fell over human record-keeping for centuries.\n\nBy studying the remaining fragments and letters, historians reconstruct the ancient blueprints of a vault that once aimed to compile the cosmos under a single roof.`;
    } else if (lowerPrompt.includes("voyager") || lowerPrompt.includes("space")) {
      title = "Voyager: Humanity's Eternal Message in the Void";
      category = "Science";
      content = `Launched in 1977, the Voyager 1 and 2 probes have traveled further than any human-made object in history. Having crossed the heliopause, they are now sailing through the pristine silence of interstellar space.\n\nCarrying the Golden Records—phonograph records containing sounds, music, and images of Earth—these spacecraft serve as cosmic time capsules.\n\nLong after our sun runs out of fuel, these silent messengers will continue to carry our story across the infinite cosmic shore, waiting for an observer who may never arrive.`;
    }

    return NextResponse.json({ title, category, content, readTime: "2 min read" });
  } catch (err: any) {
    console.error("Fact generation handler crash:", err);
    return NextResponse.json(
      { error: err.message || "Failed to compile fact-based article." },
      { status: 500 }
    );
  }
}
