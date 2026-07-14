import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = payload.role as string;
    if (userRole !== "faculty" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins/Faculty only" }, { status: 403 });
    }

    const body = await req.json();
    const { topicContext, lineCount } = body;

    if (!topicContext || !lineCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey.trim() === "") {
      return NextResponse.json({ error: "Groq API Key is not configured on this server." }, { status: 500 });
    }

    const systemPrompt = 
      "You are an academic curriculum editor. Generate a highly detailed educational article " +
      "based on the topic context and requested line length. Respond ONLY with a raw JSON object. " +
      "Do not wrap the JSON output in markdown code blocks or triple backticks. " +
      "The JSON object must contain exactly these fields: " +
      "\"title\" (string), \"subtitle\" (string), \"category\" (string, e.g. Technology, Science, Environment, Architecture, Management), " +
      "\"snippet\" (string, 1-2 sentence preview), \"content\" (string, detailed article body in Markdown containing headers (##), occasional bold text (**) used very sparingly for specific terms only, bullet points (*), and quotes (>). Keep paragraphs and general text in normal font weight, do not wrap entire sentences or paragraphs in bold. It must have roughly the requested number of lines/paragraphs), " +
      "and \"imageAlt\" (string, descriptive alt tag for a related cover image).";

    const userPrompt = `Topic Context: ${topicContext}\nRequested length: ~${lineCount} lines/paragraphs.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq AI Generation API Error Details:", errorText);
      throw new Error("Failed to generate content with Groq API.");
    }

    const data = await response.json();
    const jsonText = data.choices[0].message.content || "{}";
    
    // Parse the generated JSON to verify format
    const parsedArticle = JSON.parse(jsonText);
    
    return NextResponse.json(parsedArticle, { status: 200 });
  } catch (error: any) {
    console.error("Generate Article API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
