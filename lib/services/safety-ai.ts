import { SupportedLanguage } from "@/types/sheshield";
import { searchLegalCorpus } from "./legal-corpus";

export interface ChatTurn {
  role: "user" | "model" | "assistant";
  text: string;
}

export interface AssistantRequest {
  message: string;
  history?: ChatTurn[];
  lang?: SupportedLanguage;
  location?: { lat: number; lon: number } | null;
}

export interface AssistantResponse {
  reply: string;
  suggestedAction?: "open_sos" | "open_fake_call" | "view_map" | "call_112" | "call_1091";
  provider: "gemini" | "sheshield_safety_engine";
  meta?: {
    geminiStatus?: string;
    citations?: string[];
  };
}

/**
 * Generates an intelligent, context-aware safety response based on the exact user message,
 * multi-turn conversation history, language preference, and verified Indian legal/safety knowledge.
 */
export function generateContextualSafetyResponse(
  message: string,
  history: ChatTurn[] = [],
  lang: SupportedLanguage = "en",
  _location?: { lat: number; lon: number } | null
): AssistantResponse {
  const normalized = message.toLowerCase().trim();
  const historyText = history.map(h => h.text.toLowerCase()).join(" ");

  // 1. Immediate Danger / SOS Signals
  if (
    normalized.includes("danger") ||
    normalized.includes("help me") ||
    normalized.includes("follow") ||
    normalized.includes("scared") ||
    normalized.includes("attack") ||
    normalized.includes("stalk") ||
    normalized.includes("emergency") ||
    normalized.includes("sos") ||
    normalized.includes("ஆபத்து") ||
    normalized.includes("காப்பாற்று") ||
    normalized.includes("खतरा") ||
    normalized.includes("बचाओ")
  ) {
    if (lang === "ta") {
      return {
        reply:
          "நீங்கள் ஆபத்தில் இருந்தால், உடனடியாக மேலே உள்ள சிவப்பு SOS பட்டனை 2 வினாடிகள் அழுத்திப் பிடிக்கவும். இது உங்கள் நம்பகமான தொடர்புகளுக்கு உங்கள் நேரலை இருப்பிடத்தை அனுப்பும். உடனடியாக காவல்துறை உதவிக்கு 112 அல்லது மகளிர் உதவி எண் 1091-ஐ அழைக்கவும்.",
        suggestedAction: "open_sos",
        provider: "sheshield_safety_engine"
      };
    }
    if (lang === "hi") {
      return {
        reply:
          "यदि आप खतरे में हैं, तो तुरंत ऊपर दिए गए लाल SOS बटन को 2 सेकंड तक दबाए रखें। यह आपके आपातकालीन संपर्कों को आपकी लाइव लोकेशन भेजेगा। तत्काल पुलिस सहायता के लिए 112 या महिला हेल्पलाइन 1091 डायल करें।",
        suggestedAction: "open_sos",
        provider: "sheshield_safety_engine"
      };
    }
    return {
      reply:
        "If you are in immediate danger, please trigger Emergency SOS right now by holding the red SOS button for 2 seconds. This will transmit your real-time coordinates to your trusted contacts. You can also dial Emergency 112 or National Women Helpline 1091 directly.",
      suggestedAction: "open_sos",
      provider: "sheshield_safety_engine"
    };
  }

  // 2. Uncomfortable / Escape Situation -> Fake Call
  if (
    normalized.includes("fake call") ||
    normalized.includes("awkward") ||
    normalized.includes("uncomfortable") ||
    normalized.includes("escape") ||
    normalized.includes("taxi driver") ||
    normalized.includes("cab") ||
    normalized.includes("excuse") ||
    normalized.includes("போலி அழைப்பு") ||
    normalized.includes("फेक कॉल")
  ) {
    if (lang === "ta") {
      return {
        reply:
          "சங்கடமான சூழலில் இருந்து மரியாதையாக வெளியேற போலி அழைப்பு சிமுலேஷனைப் பயன்படுத்தலாம். 'Mom' அல்லது 'Police' என தேர்வு செய்து 5 வினாடிகளில் அழைப்பு வரும்படி செய்ய முடியும்.",
        suggestedAction: "open_fake_call",
        provider: "sheshield_safety_engine"
      };
    }
    if (lang === "hi") {
      return {
        reply:
          "असहज या संदिग्ध स्थिति से निकलने के लिए आप 'फेक कॉल' सुविधा शुरू कर सकती हैं। 'Mom' या 'Police' कॉलर चुनकर 5 से 10 सेकंड में इनकमिंग कॉल सिमुलेट करें।",
        suggestedAction: "open_fake_call",
        provider: "sheshield_safety_engine"
      };
    }
    return {
      reply:
        "You can trigger our realistic simulated incoming call right now to create a believable reason to step away from an uncomfortable situation. Choose 'Mom', 'Boss', or 'Police' and set a 5-second timer.",
      suggestedAction: "open_fake_call",
      provider: "sheshield_safety_engine"
    };
  }

  // 3. Safe Routes, Navigation & Commute
  if (
    normalized.includes("route") ||
    normalized.includes("map") ||
    normalized.includes("walk") ||
    normalized.includes("metro") ||
    normalized.includes("bus") ||
    normalized.includes("lighting") ||
    normalized.includes("dark") ||
    normalized.includes("safe road") ||
    normalized.includes("வழி") ||
    normalized.includes("வரைபடம்") ||
    normalized.includes("मार्ग")
  ) {
    if (lang === "ta") {
      return {
        reply:
          "நேரலை பாதுகாப்பு வரைபடத்தில் உங்கள் இலக்கைத் தேடுங்கள். எங்கள் அல்காரிதம் தூரம், 24/7 காவல் நிலையங்கள், திறந்திருக்கும் மருத்துவமனைகள் மற்றும் சமூக பாதுகாப்பு பதிவுகளின் அடிப்படையில் பாதுகாப்பான வழித்தடத்தை பரிந்துரைக்கிறது.",
        suggestedAction: "view_map",
        provider: "sheshield_safety_engine"
      };
    }
    if (lang === "hi") {
      return {
        reply:
          "लाइव सुरक्षा मैप पर अपना गंतव्य खोजें। हमारा सिस्टम दूरी, 24/7 पुलिस स्टेशनों और सत्यापित सहायता केंद्रों को ध्यान में रखकर सुरक्षित मार्ग सुझाता है।",
        suggestedAction: "view_map",
        provider: "sheshield_safety_engine"
      };
    }
    return {
      reply:
        "You can search your destination on the Live Safety Map above. SheShield calculates real walking distances and evaluates route safety by factoring verified 24/7 police stations, emergency hospitals, street lighting indicators, and community reports.",
      suggestedAction: "view_map",
      provider: "sheshield_safety_engine"
    };
  }

  // 4. Legal Rights & Statutes (FIR, POSH, Domestic Abuse, Arrest)
  const legalResults = searchLegalCorpus(message, lang);
  if (
    normalized.includes("fir") ||
    normalized.includes("police") ||
    normalized.includes("posh") ||
    normalized.includes("workplace") ||
    normalized.includes("office") ||
    normalized.includes("domestic") ||
    normalized.includes("husband") ||
    normalized.includes("abuse") ||
    normalized.includes("arrest") ||
    (normalized.includes("night") && normalized.includes("arrest")) ||
    normalized.includes("law") ||
    normalized.includes("rights") ||
    normalized.includes("சட்டம்") ||
    normalized.includes("காவல்துறை") ||
    normalized.includes("कानून")
  ) {
    if (legalResults.length > 0) {
      const doc = legalResults[0].document;
      const summary = doc.summary[lang] || doc.summary.en;
      const provisions = doc.key_provisions[lang] || doc.key_provisions.en;

      const reply = `${doc.title} (${doc.section}):\n\n${summary}\n\nKey Protections:\n${provisions
        .slice(0, 3)
        .map(p => `• ${p}`)
        .join("\n")}\n\n(Information provided under Indian law. For formal counsel, consult a legal practitioner or Free Legal Aid via NALSA / 15100).`;

      return {
        reply,
        provider: "sheshield_safety_engine",
        meta: { citations: [doc.section, doc.act_name] }
      };
    }
  }

  // 5. Follow-up Contextual Awareness
  if (historyText.includes("sos") && (normalized.includes("cancel") || normalized.includes("stop") || normalized.includes("safe now"))) {
    return {
      reply:
        lang === "ta"
          ? "SOS எச்சரிக்கையை ரத்து செய்ய, SOS திரையில் உள்ள 'I AM SAFE - CANCEL ALERT' பட்டனை அழுத்தவும். இது உங்கள் தொடர்புகளுக்கு நீங்கள் பாதுகாப்பாக உள்ளீர்கள் என்ற செய்தியை அனுப்பும்."
          : lang === "hi"
          ? "SOS अलर्ट रद्द करने के लिए, SOS स्क्रीन पर 'I AM SAFE - CANCEL ALERT' बटन दबाएं।"
          : "To cancel an active SOS, tap 'CANCEL ALERT (I AM SAFE)' on the emergency screen. This marks the event as cancelled in the database.",
      suggestedAction: "open_sos",
      provider: "sheshield_safety_engine"
    };
  }

  // 6. General / Conversational Response Tailored to Message
  if (lang === "ta") {
    return {
      reply: `உங்கள் கேள்வி "${message}" குறித்து நான் உதவ முடியும். நீங்கள் அவசர SOS, நேரலை பயண பகிர்வு, போலி அழைப்பு சிமுலேஷன், அல்லது இந்திய சட்ட உரிமைகள் (Zero FIR, POSH) குறித்து என்னிடம் கேட்கலாம்.`,
      provider: "sheshield_safety_engine"
    };
  }
  if (lang === "hi") {
    return {
      reply: `आपके प्रश्न "${message}" के संदर्भ में: शीशील्ड आपको आपातकालीन सुरक्षा, लाइव यात्रा साझाकरण, फेक कॉल और भारतीय कानूनी अधिकारों (जीरो एफआईआर, घरेलू हिंसा संरक्षण) पर सहायता प्रदान करता है।`,
      provider: "sheshield_safety_engine"
    };
  }
  return {
    reply: `Regarding your query about "${message}": SheShield provides proactive women's safety features including Live Journey Sharing with trusted contacts, instant SOS with GPS coordinates, simulated fake calls to de-escalate situations, and verified statutory legal guidance (such as Zero FIR mandates under Section 173 BNSS). How can I assist you with these tools right now?`,
    provider: "sheshield_safety_engine"
  };
}
