import { LegalDocumentCitation, SupportedLanguage } from "@/types/sheshield";

export const LEGAL_DOCUMENTS: LegalDocumentCitation[] = [
  {
    id: "legal_zero_fir",
    act_name: "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / CrPC",
    section: "Section 173(1) BNSS (Zero FIR Mandate)",
    title: "Zero FIR Registration & Police Non-Refusal Mandate",
    summary: {
      en: "A Zero FIR allows any victim or complainant to register a First Information Report (FIR) at ANY police station, regardless of territorial jurisdiction where the incident occurred. The police station must register it with serial number '0' and immediately transfer it to the jurisdictional station.",
      ta: "ஜீரோ எஃப்.ஐ.ஆர் (Zero FIR) என்பது குற்றம் எந்த எல்லைக்குட்பட்ட பகுதியில் நடந்திருந்தாலும், பாதிக்கப்பட்டவர் எந்தவொரு காவல் நிலையத்திலும் முதல் தகவல் அறிக்கையைப் பதிவு செய்ய அனுமதிக்கிறது. காவல் நிலையம் இதை மறுக்க முடியாது.",
      hi: "जीरो एफआईआर किसी भी पीड़िता को घटना स्थल के अधिकार क्षेत्र की परवाह किए बिना किसी भी पुलिस स्टेशन में प्राथमिकी (FIR) दर्ज कराने का अधिकार देती है। पुलिस इसे दर्ज करने से इनकार नहीं कर सकती।"
    },
    key_provisions: {
      en: [
        "Police officers cannot refuse to register an FIR on jurisdictional grounds (refusal is punishable under Section 199 BNS).",
        "A woman can lodge a complaint orally or electronically (e-FIR).",
        "Free copy of the FIR must be provided immediately to the complainant.",
        "Medical examination of sexual offense survivors must be conducted within 24 hours without waiting for police paperwork."
      ],
      ta: [
        "அதிகார வரம்பைக் காரணம் காட்டி காவல்துறை எஃப்.ஐ.ஆர் பதிவு செய்ய மறுக்க முடியாது (மறுப்பது BNS பிரிவு 199 இன் கீழ் தண்டனைக்குரியது).",
        "பெண்கள் வாய்மொழியாகவோ அல்லது மின்னஞ்சல் மூலமாகவோ புகார் அளிக்கலாம்.",
        "புகார்தாரருக்கு எஃப்.ஐ.ஆர்-இன் இலவச நகல் உடனடியாக வழங்கப்பட வேண்டும்.",
        "பாலியல் குற்றங்களால் பாதிக்கப்பட்ட பெண்களுக்கு 24 மணி நேரத்திற்குள் இலவச மருத்துவ பரிசோதனை செய்யப்பட வேண்டும்."
      ],
      hi: [
        "अधिकार क्षेत्र के आधार पर पुलिस एफआईआर दर्ज करने से इनकार नहीं कर सकती (इनकार करना बीएनएस की धारा 199 के तहत दंडनीय है)।",
        "महिलाएं मौखिक या इलेक्ट्रॉनिक (ई-एफआईआर) माध्यम से शिकायत दर्ज करा सकती हैं।",
        "शिकायतकर्ता को प्राथमिकी की एक निःशुल्क प्रति तुरंत प्रदान की जानी चाहिए।",
        "यौन अपराध से पीड़ित महिला की 24 घंटे के भीतर निशुल्क चिकित्सकीय जांच अनिवार्य है।"
      ]
    },
    official_link: "https://mha.gov.in",
    last_verified: "2026-08-15"
  },
  {
    id: "legal_posh_act",
    act_name: "POSH Act, 2013",
    section: "Sections 4, 9, 10 & 11",
    title: "Protection Against Sexual Harassment at Workplace",
    summary: {
      en: "Mandates that every workplace with 10 or more employees must constitute an Internal Complaints Committee (ICC) headed by a senior woman employee. Protects all women workers (permanent, contractual, intern, or visitor).",
      ta: "10 அல்லது அதற்கு மேற்பட்ட ஊழியர்களைக் கொண்ட ஒவ்வொரு பணியிடத்திலும் மூத்த பெண் ஊழியரின் தலைமையில் உள் புகார்க் குழு (ICC) அமைக்கப்பட வேண்டும் என்பதை கட்டாயமாக்குகிறது.",
      hi: "यह अनिवार्य करता है कि 10 या अधिक कर्मचारियों वाले प्रत्येक कार्यस्थल पर एक आंतरिक शिकायत समिति (ICC) का गठन किया जाए, जिसकी अध्यक्षता एक वरिष्ठ महिला कर्मचारी करेगी।"
    },
    key_provisions: {
      en: [
        "Complaint can be filed within 3 months of incident (extendable by ICC).",
        "ICC must complete inquiry within 90 days.",
        "Complainant can seek interim relief including paid leave up to 3 months or transfer of respondent.",
        "Identity of complainant and proceedings must remain strictly confidential under Section 16."
      ],
      ta: [
        "சம்பவம் நடந்த 3 மாதங்களுக்குள் புகார் அளிக்கலாம் (ICC-யால் நீட்டிக்கப்படலாம்).",
        "90 நாட்களுக்குள் விசாரணையை ICC முடிக்க வேண்டும்.",
        "புகார்தாரருக்கு 3 மாத ஊதியத்துடன் கூடிய விடுப்பு அல்லது இடமாற்றம் உள்ளிட்ட இடைக்கால நிவாரணங்கள் பெற உரிமை உண்டு.",
        "புகார்தாரரின் அடையாளம் கடுமையான ரகசியமாக வைக்கப்பட வேண்டும்."
      ],
      hi: [
        "घटना के 3 महीने के भीतर शिकायत दर्ज की जा सकती है।",
        "ICC को 90 दिनों के भीतर जांच पूरी करनी होगी।",
        "शिकायतकर्ता को 3 महीने तक की सवेतन छुट्टी या स्थानांतरण जैसी अंतरिम राहत का अधिकार है।",
        "शिकायतकर्ता की पहचान और कार्यवाही को पूरी तरह गोपनीय रखा जाना अनिवार्य है।"
      ]
    },
    official_link: "https://wcd.nic.in",
    last_verified: "2026-07-20"
  },
  {
    id: "legal_pwdva_act",
    act_name: "Protection of Women from Domestic Violence Act, 2005",
    section: "Sections 12, 17, 18, 19, 20 & 22",
    title: "Protection from Domestic Violence and Right to Shared Household",
    summary: {
      en: "Protects women from physical, emotional, verbal, sexual, and economic abuse by individuals in a domestic relationship. Guarantees the right to reside in the shared household regardless of ownership.",
      ta: "குடும்ப உறவில் உள்ளவர்களால் ஏற்படும் உடல், உணர்ச்சி, வாய்மொழி, பாலியல் மற்றும் பொருளாதார ரீதியான வன்முறைகளில் இருந்து பெண்களைப் பாதுகாக்கிறது. வீட்டில் வசிக்கும் உரிமையை உறுதி செய்கிறது.",
      hi: "घरेलू संबंधों में महिलाओं को शारीरिक, भावनात्मक, मौखिक, यौन और आर्थिक शोषण से सुरक्षा प्रदान करता है। साझा घर में रहने का अधिकार सुनिश्चित करता है।"
    },
    key_provisions: {
      en: [
        "Right to reside in shared household; cannot be evicted by in-laws or spouse.",
        "Magistrate can issue immediate Protection Orders (barring abuser from entering workplace/residence).",
        "Monetary relief for medical expenses, loss of earnings, and maintenance for victim and children.",
        "Free access to Protection Officers, shelter homes, and legal aid."
      ],
      ta: [
        "கூட்டு வீட்டில் வசிக்கும் உரிமை; புகுந்த வீட்டாரோ கணவரோ வீட்டை விட்டு வெளியேற்ற முடியாது.",
        "பாதுகாப்பு அதிகாரிகளின் இலவச உதவி மற்றும் தங்குமிடம் பெறும் உரிமை.",
        "மருத்துவ செலவுகள் மற்றும் ஜீவனாம்சத்திற்கான நிதி நிவாரணம்."
      ],
      hi: [
        "साझा घर में रहने का अधिकार; ससुराल वाले या पति घर से बेदखल नहीं कर सकते।",
        "सुरक्षा आदेश (Protection Orders) द्वारा आरोपी को कार्यस्थल या घर के पास आने से रोका जा सकता है।",
        "चिकित्सा व्यय और भरण-पोषण के लिए आर्थिक मुआवजे का प्रावधान।"
      ]
    },
    official_link: "https://wcd.nic.in",
    last_verified: "2026-09-01"
  },
  {
    id: "legal_bns_stalking_voyeurism",
    act_name: "Bharatiya Nyaya Sanhita (BNS), 2023",
    section: "Sections 77 (Voyeurism) & 78 (Stalking)",
    title: "Offences of Stalking, Cyberstalking, and Voyeurism",
    summary: {
      en: "Criminalizes physical and electronic stalking of women (following, contacting repeatedly despite disinterest, monitoring internet/email/social media usage) and capturing/publishing private images without consent.",
      ta: "பெண்களை பின்தொடருதல், இணையம் மூலமாக கண்காணித்தல் (Cyberstalking) மற்றும் அனுமதியின்றி ரகசியமாக புகைப்படம்/வீடியோ எடுப்பது கடுமையான குற்றமாகும்.",
      hi: "महिलाओं का शारीरिक या इलेक्ट्रॉनिक पीछा करना (इंटरनेट, ईमेल या सोशल मीडिया पर निगरानी) और बिना सहमति निजी तस्वीरें खींचना या साझा करना गैरकानूनी व दंडनीय अपराध है।"
    },
    key_provisions: {
      en: [
        "Stalking (Section 78): First conviction punishable up to 3 years imprisonment and fine; subsequent conviction up to 5 years.",
        "Voyeurism (Section 77): Imprisonment up to 3-7 years for capturing or circulating private images.",
        "Applicable to social media harassment, persistent unsolicited messaging, and GPS tracking without consent."
      ],
      ta: [
        "பின்தொடர்தல் (Section 78): முதல் குற்றத்திற்கு 3 ஆண்டுகள் வரை சிறைத்தண்டனை; அடுத்தடுத்த குற்றங்களுக்கு 5 ஆண்டுகள் வரை.",
        "ரகசிய படம்பிடித்தல் (Section 77): 3 முதல் 7 ஆண்டுகள் வரை சிறைத்தண்டனை."
      ],
      hi: [
        "पीछा करना (धारा 78): प्रथम अपराध पर 3 वर्ष तक का कारावास; दोबारा करने पर 5 वर्ष तक।",
        "निजी तस्वीरें खींचना (धारा 77): 3 से 7 वर्ष तक का कठोर कारावास।"
      ]
    },
    official_link: "https://mha.gov.in",
    last_verified: "2026-08-10"
  },
  {
    id: "legal_arrest_guidelines",
    act_name: "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / DK Basu Guidelines",
    section: "Section 43 BNSS (Arrest of Women)",
    title: "Legal Safeguards Regarding Arrest of Women",
    summary: {
      en: "Strict restrictions on the arrest and detention of women to prevent custodial harassment.",
      ta: "பெண்களைக் கைது செய்வதற்கான கடுமையான சட்டப் பாதுகாப்பு வழிகாட்டுதல்கள்.",
      hi: "महिलाओं की गिरफ्तारी और हिरासत से संबंधित सख्त कानूनी सुरक्षा नियम।"
    },
    key_provisions: {
      en: [
        "No woman can be arrested between sunset and sunrise except under exceptional circumstances with prior written permission of a Judicial Magistrate.",
        "Arrest must be executed by a female police officer only.",
        "Medical examination of an arrested female must be performed by or under the supervision of a female medical practitioner.",
        "Right to inform a relative or advocate immediately upon arrest."
      ],
      ta: [
        "சூரிய அஸ்தமனத்திற்குப் பின்னரும் சூரிய உதயத்திற்கு முன்னரும் (இரவு நேரத்தில்) நீதிபதியின் முன் அனுமதியின்றி பெண்களைக் கைது செய்ய முடியாது.",
        "பெண் காவல்துறை அதிகாரியால் மட்டுமே கைது செய்யப்பட வேண்டும்.",
        "பெண் மருத்துவரால் மட்டுமே மருத்துவ பரிசோதனை செய்யப்பட வேண்டும்."
      ],
      hi: [
        "सूर्यास्त के बाद और सूर्योदय से पहले (रात में) न्यायिक मजिस्ट्रेट की अनुमति के बिना किसी भी महिला को गिरफ्तार नहीं किया जा सकता।",
        "महिला को केवल महिला पुलिस अधिकारी ही गिरफ्तार कर सकती है।",
        "चिकित्सकीय जांच केवल महिला डॉक्टर द्वारा ही की जानी चाहिए।"
      ]
    },
    official_link: "https://mha.gov.in",
    last_verified: "2026-06-12"
  }
];

export interface RAGSearchResult {
  document: LegalDocumentCitation;
  relevance_score: number;
  highlight_text: string;
}

export function searchLegalCorpus(
  query: string,
  lang: SupportedLanguage = 'en'
): RAGSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return LEGAL_DOCUMENTS.map(doc => ({
      document: doc,
      relevance_score: 1.0,
      highlight_text: doc.summary[lang] || doc.summary.en
    }));
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

  const scoredResults = LEGAL_DOCUMENTS.map(doc => {
    let score = 0;
    const fullText = [
      doc.act_name,
      doc.section,
      doc.title,
      doc.summary.en,
      doc.summary.ta,
      doc.summary.hi,
      ...doc.key_provisions.en,
      ...doc.key_provisions.ta,
      ...doc.key_provisions.hi
    ].join(" ").toLowerCase();

    // Exact matches in title/section get high weight
    if (doc.title.toLowerCase().includes(normalizedQuery)) score += 10;
    if (doc.section.toLowerCase().includes(normalizedQuery)) score += 8;

    for (const term of queryTerms) {
      if (fullText.includes(term)) {
        score += 2;
      }
    }

    // Keyword heuristics
    if ((normalizedQuery.includes("fir") || normalizedQuery.includes("police")) && doc.id === "legal_zero_fir") score += 5;
    if ((normalizedQuery.includes("work") || normalizedQuery.includes("office") || normalizedQuery.includes("colleague")) && doc.id === "legal_posh_act") score += 5;
    if ((normalizedQuery.includes("domestic") || normalizedQuery.includes("husband") || normalizedQuery.includes("family") || normalizedQuery.includes("abuse")) && doc.id === "legal_pwdva_act") score += 5;
    if ((normalizedQuery.includes("stalk") || normalizedQuery.includes("cyber") || normalizedQuery.includes("photo") || normalizedQuery.includes("call")) && doc.id === "legal_bns_stalking_voyeurism") score += 5;
    if ((normalizedQuery.includes("arrest") || normalizedQuery.includes("night") || normalizedQuery.includes("custody")) && doc.id === "legal_arrest_guidelines") score += 5;

    return {
      document: doc,
      relevance_score: score,
      highlight_text: doc.summary[lang] || doc.summary.en
    };
  });

  return scoredResults
    .filter(res => res.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score);
}
