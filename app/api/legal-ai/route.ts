import { NextRequest, NextResponse } from "next/server";
import { searchLegalCorpus } from "@/lib/services/legal-corpus";
import { SupportedLanguage } from "@/types/sheshield";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, lang = "en" } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = searchLegalCorpus(query, lang as SupportedLanguage);

    if (results.length === 0) {
      return NextResponse.json({
        answer:
          lang === "ta"
            ? "மன்னிக்கவும், உங்கள் கேள்விக்கான குறிப்பிட்ட சட்டப் பிரிவு எங்கள் தரவுத்தளத்தில் இல்லை. அவசர உதவிக்கு 1091 (மகளிர் உதவி எண்) அல்லது 112-ஐ தொடர்பு கொள்ளவும்."
            : lang === "hi"
            ? "क्षमा करें, आपके प्रश्न के लिए कोई सीधा कानूनी संदर्भ नहीं मिला। आपातकालीन सहायता के लिए 1091 या 112 पर संपर्क करें।"
            : "No specific statutory citation matched your query in the verified legal corpus. Please consult a qualified legal practitioner or call National Women Helpline 1091.",
        citations: [],
        disclaimer:
          "This guidance is provided for awareness and informational purposes under Indian law and does not constitute formal legal counsel."
      });
    }

    const topDoc = results[0].document;
    const summary = topDoc.summary[lang as SupportedLanguage] || topDoc.summary.en;
    const provisions = topDoc.key_provisions[lang as SupportedLanguage] || topDoc.key_provisions.en;

    const answer = `${topDoc.title} (${topDoc.section})\n\n${summary}\n\nKey Provisions:\n${provisions
      .map(p => `• ${p}`)
      .join("\n")}`;

    return NextResponse.json({
      answer,
      citations: results.map(r => ({
        id: r.document.id,
        act_name: r.document.act_name,
        section: r.document.section,
        title: r.document.title,
        official_link: r.document.official_link,
        relevance_score: r.relevance_score
      })),
      disclaimer:
        "This guidance is provided for awareness and informational purposes under Indian law and does not constitute formal legal counsel."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
