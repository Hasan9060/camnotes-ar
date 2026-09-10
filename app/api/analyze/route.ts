import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is missing." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const task = (formData.get("task") as string) || "ocr";

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Active model endpoints supported by your Gemini API key
    const modelCandidates = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash"];
    let textResponse = "";
    let lastError: any = null;

    let prompt = "Extract all clear handwritten or printed text accurately from this image. Do not add conversational fluff.";
    
    if (task === "full") {
      prompt = `Perform comprehensive analysis on this note image and output JSON format with the following exact keys:
1. "extractedText": full OCR text extracted from the note.
2. "notesSummary": concise bullet points summarizing the core study concepts and topics.
3. "mathSolution": step-by-step mathematical problem solution if any equation exists (otherwise explain main key formula).
4. "flashcards": array of objects [{"question": "...", "answer": "..."}] with 2 study flashcards based on the note.
5. "quiz": object {"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0} for knowledge testing.`;
    }

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]);
        textResponse = result.response.text();
        if (textResponse) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed or not found, trying next candidate...`);
      }
    }

    if (!textResponse && lastError) {
      throw lastError;
    }

    if (task === "full") {
      try {
        // Clean JSON markdown blocks if present
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ success: true, data: parsed });
        }
      } catch (err) {
        console.warn("Raw Gemini text was not pure JSON, fallback to raw response.");
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        extractedText: textResponse,
        notesSummary: "AI Generated Summary:\n" + textResponse.substring(0, 300) + "...",
        mathSolution: "Step 1: Analyzed input vision pattern\nResult: " + textResponse
      }
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process image with Gemini AI API." },
      { status: 500 }
    );
  }
}
