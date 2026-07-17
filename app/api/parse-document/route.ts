import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
// @ts-ignore
import { PDFParse } from "pdf-parse";
// @ts-ignore
import { getPath } from "pdf-parse/worker";
import mammoth from "mammoth";

PDFParse.setWorker(getPath());

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const isPdf = filename.endsWith(".pdf") || file.type === "application/pdf";
    const isDocx = filename.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isDoc = filename.endsWith(".doc") || file.type === "application/msword";

    if (!isPdf && !isDocx && !isDoc) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Validate size (e.g., 10MB limit for documents)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let extractedText = "";

    if (isPdf) {
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      await parser.destroy();
      extractedText = pdfData.text || "";
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (isDoc) {
      // Mammoth only supports docx, so if they uploaded a doc, we can tell them to use docx
      return NextResponse.json(
        { error: "Legacy Word document (.doc) is not supported. Please convert it to .docx or .pdf." },
        { status: 400 }
      );
    }

    // Trim whitespace and clean up extra blank lines
    extractedText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("Document Parser API Error:", error);
    return NextResponse.json({ error: "Failed to parse document: " + (error.message || error) }, { status: 500 });
  }
}
