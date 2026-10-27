import { NextRequest, NextResponse } from "next/server";
import { generateContextualSafetyResponse } from "@/lib/services/safety-ai";
import { SupportedLanguage } from "@/types/sheshield";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], lang = "en", location } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // If Gemini API key is configured, attempt calling Google Gemini
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const systemInstruction = `You are SheShield AI Guardian, a protective, empathetic, and knowledgeable AI assistant for women's safety in India.
Provide concise, practical, calm guidance for personal safety, emergency response (call 112 or 1091), de-escalation, safe travel, and legal rights (BNS, CrPC/BNSS, POSH Act, Domestic Violence Act, Zero FIR).
Always prioritize safety. If the user is in distress, urge them to activate SOS immediately.
Language preference: ${lang === "ta" ? "Tamil" : lang === "hi" ? "Hindi" : "English"}. Respond in this language.`;

        // Format conversation history for Gemini REST API
        const contents = [
          ...history.slice(-6).map((turn: any) => ({
            role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
            parts: [{ text: turn.text }]
          })),
          {
            role: "user",
            parts: [{ text: message }]
          }
        ];

        // Attempt calling gemini-3.8-flash or gemini-2.5-flash
        const modelName = "gemini-3.8-flash";
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 600
              },
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              }
            })
          }
        );

        const geminiData = await geminiRes.json();

        if (geminiRes.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
          const replyText = geminiData.candidates[0].content.parts[0].text.trim();
          return NextResponse.json({
            reply: replyText,
            provider: "gemini",
            meta: {
              model: modelName
            }
          });
        }

        // Check if error is billing requirement or quota
        const errMessage = geminiData.error?.message || "";
        console.warn("[SheShield Gemini Fallback] Status:", geminiRes.status, errMessage);

        const fallback = generateContextualSafetyResponse(
          message,
          history,
          lang as SupportedLanguage,
          location
        );

        return NextResponse.json({
          ...fallback,
          meta: {
            ...fallback.meta,
            geminiStatus: geminiRes.status === 403
              ? "Gemini API project requires Google Cloud Billing upgrade (https://aistudio.google.com/billing)"
              : `Gemini API returned status ${geminiRes.status}`
          }
        });
      } catch (geminiError: any) {
        console.warn("[SheShield Gemini Fetch Error]:", geminiError.message);
      }
    }

    // Default: SheShield Verified Safety Engine
    const fallbackResponse = generateContextualSafetyResponse(
      message,
      history,
      lang as SupportedLanguage,
      location
    );

    return NextResponse.json(fallbackResponse);
  } catch (error: any) {
    console.error("API /api/assistant error:", error);
    return NextResponse.json({ error: error.message || "Assistant error" }, { status: 500 });
  }
}
