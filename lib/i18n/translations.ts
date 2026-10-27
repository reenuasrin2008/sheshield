import { SupportedLanguage } from "@/types/sheshield";

export const translations = {
  en: {
    app_name: "SheShield",
    app_tagline: "Predictive AI Guardian for Women's Safety",
    nav_home: "Dashboard",
    nav_map: "Live Safety Map",
    nav_sos: "Emergency SOS",
    nav_legal: "Legal Assistant",
    nav_community: "Community & Aid",
    nav_empowerment: "Empowerment",
    nav_settings: "Settings",
    nav_signin: "Sign In",
    nav_signup: "Sign Up",
    nav_signout: "Sign Out",
    
    // SOS
    sos_button: "TRIGGER SOS",
    sos_instruction: "Press and hold for 2 seconds to activate immediate emergency alert",
    sos_countdown_title: "Emergency Alert Triggering",
    sos_countdown_desc: "Alerting your emergency contacts and recording live location in...",
    sos_cancel_button: "CANCEL ALERT (I AM SAFE)",
    sos_active_title: "EMERGENCY SOS IS ACTIVE",
    sos_active_desc: "Your live location and emergency status are being transmitted to trusted contacts.",
    sos_test_mode: "Test Mode",
    sos_test_mode_desc: "Simulate SOS without sending external SMS to contacts",
    sos_call_police: "Call Emergency 112",
    sos_call_women_helpline: "Call Women Helpline 1091",
    
    // Live Map
    map_current_location: "Your Location",
    map_recenter: "Recenter",
    map_start_tracking: "Start Live Tracking",
    map_stop_tracking: "Stop Tracking",
    map_tracking_active: "Live Tracking Active",
    map_tracking_paused: "Tracking Paused",
    map_share_journey: "Share Live Journey",
    map_copy_link: "Copy Share Link",
    map_link_copied: "Link copied to clipboard!",
    map_search_placeholder: "Search destination (e.g. Metro station, office, college)...",
    map_calculate_route: "Calculate Safe Route",
    map_route_distance: "Distance",
    map_route_duration: "ETA",
    map_safety_score: "Safety Index",
    map_layer_reports: "Safety Incidents",
    map_layer_police: "Police Stations",
    map_layer_hospitals: "24/7 Hospitals",
    map_layer_heatmap: "Risk Heatmap",
    map_location_permission_denied: "Location permission denied. Please allow location access in your browser settings to use live tracking.",
    map_insufficient_data: "Insufficient community safety data for this segment. Displaying standard navigation.",
    
    // Legal Assistant
    legal_title: "AI Legal Rights Assistant",
    legal_subtitle: "Reliable information on Indian legal rights, BNS, Domestic Violence, and POSH acts with exact citations.",
    legal_disclaimer: "Disclaimer: This assistant provides legal information for awareness and is not a substitute for formal legal counsel.",
    legal_ask_placeholder: "Ask about FIR filing, workplace harassment, domestic violence protection, zero FIR...",
    legal_ask_button: "Ask Legal Guide",
    legal_offline_mode: "Offline Legal Library Active (Saved on Device)",
    legal_citations: "Official Legal Citations",
    legal_sample_q1: "What is Zero FIR and can police refuse to register it?",
    legal_sample_q2: "What legal protection exists against workplace sexual harassment (POSH)?",
    legal_sample_q3: "What are my legal rights during domestic abuse under Indian law?",
    
    // Fake Call
    fake_call_title: "Simulated Call",
    fake_call_subtitle: "Trigger a discreet incoming call simulation to exit uncomfortable situations safely.",
    fake_call_trigger_now: "Call in 5 Seconds",
    fake_call_trigger_10s: "Call in 10 Seconds",
    fake_call_trigger_30s: "Call in 30 Seconds",
    fake_call_incoming: "Incoming Call...",
    fake_call_accept: "Accept",
    fake_call_decline: "Decline",
    fake_call_caller: "Caller:",
    
    // Evidence
    evidence_title: "Emergency Evidence Capture",
    evidence_subtitle: "Record secure audio or photo evidence during distress. Stored securely with retention policies.",
    evidence_record_audio: "Record Emergency Audio (30s)",
    evidence_recording: "Recording in progress...",
    evidence_save_complete: "Evidence recorded and securely registered.",
    
    // Community & Resources
    community_title: "Safe Community Network",
    community_report_incident: "Report Safety Issue",
    community_verified_resources: "Nearby Verified Assistance",
    community_feed: "Community Commute & Safety Advice",
    
    // Empowerment
    empowerment_title: "Women Empowerment & Support Programs",
    empowerment_subtitle: "Government schemes, skill development initiatives, education grants, and verified legal helplines.",
    
    // Settings & Profile
    settings_title: "User Profile & Security Settings",
    settings_language: "Preferred Language",
    settings_emergency_contacts: "Emergency Contacts",
    settings_add_contact: "Add Contact",
    settings_contact_name: "Contact Name",
    settings_contact_phone: "Phone Number (+91)",
    settings_contact_relation: "Relationship",
    settings_shake_sos: "Shake Device to Trigger SOS",
    settings_shake_sos_desc: "Detects rapid device motion to trigger emergency workflow with safety cooldown.",
    settings_save: "Save Preferences",
  },
  
  ta: {
    app_name: "ஷிஷீல்ட் (SheShield)",
    app_tagline: "பெண்கள் பாதுகாப்பிற்கான முன்கணிப்பு AI பாதுகாவலன்",
    nav_home: "முகப்பு",
    nav_map: "நேரலை பாதுகாப்பு வரைபடம்",
    nav_sos: "அவசர SOS",
    nav_legal: "சட்ட வழிகாட்டி",
    nav_community: "சமூக உதவி",
    nav_empowerment: "மகளிர் அதிகாரம்",
    nav_settings: "அமைப்புகள்",
    nav_signin: "உள்நுழைக",
    nav_signup: "பதிவு செய்க",
    nav_signout: "வெளியேறுக",
    
    // SOS
    sos_button: "அவசர SOS தொடங்கு",
    sos_instruction: "உடனடி எச்சரிக்கையை செயல்படுத்த 2 விநாடிகள் அழுத்திப் பிடிக்கவும்",
    sos_countdown_title: "அவசர எச்சரிக்கை தொடங்குகிறது",
    sos_countdown_desc: "உங்கள் அவசர தொடர்புகளுக்கு செய்தி மற்றும் நேரலை இருப்பிடம் அனுப்பப்படுகிறது...",
    sos_cancel_button: "எச்சரிக்கையை ரத்து செய் (நான் பாதுகாப்பாக உள்ளேன்)",
    sos_active_title: "அவசர SOS செயலில் உள்ளது",
    sos_active_desc: "உங்கள் நேரலை இருப்பிடம் மற்றும் அவசர நிலை நம்பகமான தொடர்புகளுக்கு பகிரப்படுகிறது.",
    sos_test_mode: "சோதனை முறை",
    sos_test_mode_desc: "தொடர்புகளுக்கு உண்மையான SMS அனுப்பாமல் SOS-ஐ சோதிக்கவும்",
    sos_call_police: "காவல்துறை 112 அழைக்க",
    sos_call_women_helpline: "பெண்கள் உதவி எண் 1091",
    
    // Live Map
    map_current_location: "உங்கள் இருப்பிடம்",
    map_recenter: "மறுமையமாக்கு",
    map_start_tracking: "நேரலை கண்காணிப்பைத் தொடங்கு",
    map_stop_tracking: "கண்காணிப்பை நிறுத்து",
    map_tracking_active: "நேரலை கண்காணிப்பு செயலில் உள்ளது",
    map_tracking_paused: "கண்காணிப்பு இடைநிறுத்தப்பட்டது",
    map_share_journey: "பயணத்தை பகிரவும்",
    map_copy_link: "இணைப்பை நகலெடு",
    map_link_copied: "இணைப்பு நகலெடுக்கப்பட்டது!",
    map_search_placeholder: "செல்ல வேண்டிய இடத்தை தேடுங்கள்...",
    map_calculate_route: "பாதுகாப்பான வழியைக் கணக்கிடு",
    map_route_distance: "தூரம்",
    map_route_duration: "நேரம்",
    map_safety_score: "பாதுகாப்பு குறியீடு",
    map_layer_reports: "சம்பவ பதிவுகள்",
    map_layer_police: "காவல் நிலையங்கள்",
    map_layer_hospitals: "24/7 மருத்துவமனைகள்",
    map_layer_heatmap: "அபாய வரைபடம்",
    map_location_permission_denied: "இருப்பிட அனுமதி மறுக்கப்பட்டது. உங்கள் உலாவி அமைப்புகளில் இருப்பிடத்தை அனுமதிக்கவும்.",
    map_insufficient_data: "இந்த பகுதிக்கு போதிய பாதுகாப்பு தரவுகள் இல்லை. இயல்பான வழித்தடம் காட்டப்படுகிறது.",
    
    // Legal Assistant
    legal_title: "AI சட்ட உரிமைகள் வழிகாட்டி",
    legal_subtitle: "இந்திய சட்ட உரிமைகள், BNS, குடும்ப வன்முறை மற்றும் POSH சட்டங்கள் குறித்த நம்பகமான தகவல்.",
    legal_disclaimer: "மறுப்பு: இந்த வழிகாட்டி விழிப்புணர்வுக்கான தகவல்களை மட்டுமே வழங்குகிறது, வழக்கறிஞர் ஆலோசனைக்கு மாற்றாகாது.",
    legal_ask_placeholder: "FIR பதிவு, பணியிட பாலியல் துன்புறுத்தல், குடும்ப வன்முறை பற்றி கேளுங்கள்...",
    legal_ask_button: "சட்ட வழிகாட்டியை கேள்",
    legal_offline_mode: "ஆஃப்லைன் சட்ட நூலகம் செயலில் உள்ளது",
    legal_citations: "அதிகாரப்பூர்வ சட்ட குறிப்புகள்",
    legal_sample_q1: "ஜீரோ எஃப்.ஐ.ஆர் (Zero FIR) என்றால் என்ன? காவல்துறை அதை மறுக்க முடியுமா?",
    legal_sample_q2: "பணியிடத்தில் பாலியல் துன்புறுத்தலுக்கு (POSH) என்ன சட்டப் பாதுகாப்பு உள்ளது?",
    legal_sample_q3: "குடும்ப வன்முறைக்கு எதிராக எனக்கு என்ன சட்ட உரிமைகள் உள்ளன?",
    
    // Fake Call
    fake_call_title: "போலி அழைப்பு (Fake Call)",
    fake_call_subtitle: "சங்கடமான சூழ்நிலைகளில் இருந்து பாதுகாப்பாக வெளியேற அழைப்பு பாவனையை தொடங்கவும்.",
    fake_call_trigger_now: "5 வினாடிகளில் அழைப்பு",
    fake_call_trigger_10s: "10 வினாடிகளில் அழைப்பு",
    fake_call_trigger_30s: "30 வினாடிகளில் அழைப்பு",
    fake_call_incoming: "அழைப்பு வருகிறது...",
    fake_call_accept: "ஏற்றுக்கொள்",
    fake_call_decline: "நிராகரி",
    fake_call_caller: "அழைப்பாளர்:",
    
    // Evidence
    evidence_title: "அவசர ஆதாரப் பதிவு",
    evidence_subtitle: "அவசர காலத்தில் பாதுகாப்பான ஆடியோ அல்லது புகைப்பட ஆதாரத்தை பதிவு செய்யவும்.",
    evidence_record_audio: "அவசர ஆடியோ பதிவு (30 விநாடிகள்)",
    evidence_recording: "பதிவு செய்யப்படுகிறது...",
    evidence_save_complete: "ஆதாரம் பதிவு செய்யப்பட்டு பாதுகாப்பாக சேமிக்கப்பட்டது.",
    
    // Community & Resources
    community_title: "பாதுகாப்பான பெண்கள் சமூகம்",
    community_report_incident: "பாதுகாப்பு சிக்கலை புகாரளிக்கவும்",
    community_verified_resources: "அருகிலுள்ள சரிபார்க்கப்பட்ட உதவிகள்",
    community_feed: "சமூக பயண மற்றும் பாதுகாப்பு ஆலோசனைகள்",
    
    // Empowerment
    empowerment_title: "பெண்கள் அதிகாரம் & உதவி திட்டங்கள்",
    empowerment_subtitle: "அரசு நலத்திட்டங்கள், திறன் மேம்பாட்டு பயிற்சிகள் மற்றும் மகளிர் உதவி எண்கள்.",
    
    // Settings & Profile
    settings_title: "சுயவிவரம் & பாதுகாப்பு அமைப்புகள்",
    settings_language: "விருப்ப மொழி",
    settings_emergency_contacts: "அவசர தொடர்புகள்",
    settings_add_contact: "தொடர்பைச் சேர்",
    settings_contact_name: "பெயர்",
    settings_contact_phone: "தொலைபேசி எண் (+91)",
    settings_contact_relation: "உறவுமுறை",
    settings_shake_sos: "அசைப்பதன் மூலம் SOS (Shake to SOS)",
    settings_shake_sos_desc: "மொபைலை வேகமாக அசைக்கும் போது அவசர நிலையை உடனடியாக இயக்கும்.",
    settings_save: "அமைப்புகளை சேமி",
  },
  
  hi: {
    app_name: "शीशील्ड (SheShield)",
    app_tagline: "महिला सुरक्षा के लिए प्रेडिक्टिव एआई संरक्षक",
    nav_home: "डैशबोर्ड",
    nav_map: "लाइव सुरक्षा मैप",
    nav_sos: "आपातकालीन SOS",
    nav_legal: "कानूनी सहायक",
    nav_community: "समुदाय और सहायता",
    nav_empowerment: "महिला सशक्तिकरण",
    nav_settings: "सेटिंग्स",
    nav_signin: "लॉग इन",
    nav_signup: "साइन अप",
    nav_signout: "लॉग आउट",
    
    // SOS
    sos_button: "आपातकालीन SOS शुरू करें",
    sos_instruction: "तत्काल आपातकालीन अलर्ट सक्रिय करने के लिए 2 सेकंड तक दबाए रखें",
    sos_countdown_title: "आपातकालीन अलर्ट सक्रिय हो रहा है",
    sos_countdown_desc: "आपके संपर्कों को अलर्ट और लाइव लोकेशन भेजा जा रहा है...",
    sos_cancel_button: "अलर्ट रद्द करें (मैं सुरक्षित हूँ)",
    sos_active_title: "आपातकालीन SOS सक्रिय है",
    sos_active_desc: "आपकी लाइव लोकेशन और आपातकालीन स्थिति संपर्कों को भेजी जा रही है।",
    sos_test_mode: "टेस्ट मोड",
    sos_test_mode_desc: "संपर्कों को वास्तविक SMS भेजे बिना SOS का परीक्षण करें",
    sos_call_police: "पुलिस को कॉल करें 112",
    sos_call_women_helpline: "महिला हेल्पलाइन 1091",
    
    // Live Map
    map_current_location: "आपकी लोकेशन",
    map_recenter: "पुनः केंद्रित करें",
    map_start_tracking: "लाइव ट्रैकिंग शुरू करें",
    map_stop_tracking: "ट्रैकिंग रोकें",
    map_tracking_active: "लाइव ट्रैकिंग सक्रिय है",
    map_tracking_paused: "ट्रैकिंग रुकी हुई है",
    map_share_journey: "लाइव यात्रा साझा करें",
    map_copy_link: "लिंक कॉपी करें",
    map_link_copied: "लिंक कॉपी हो गया!",
    map_search_placeholder: "गंतव्य खोजें (मेट्रो, कॉलेज, ऑफिस)...",
    map_calculate_route: "सुरक्षित मार्ग खोजें",
    map_route_distance: "दूरी",
    map_route_duration: "समय",
    map_safety_score: "सुरक्षा सूचकांक",
    map_layer_reports: "सुरक्षा घटनाएं",
    map_layer_police: "पुलिस स्टेशन",
    map_layer_hospitals: "24/7 अस्पताल",
    map_layer_heatmap: "जोखिम हीटमैप",
    map_location_permission_denied: "लोकेशन अनुमति अस्वीकृत। लाइव ट्रैकिंग के लिए ब्राउज़र सेटिंग्स में अनुमति दें।",
    map_insufficient_data: "इस मार्ग के लिए सुरक्षा डेटा सीमित है। सामान्य नेविगेशन दिखाया जा रहा है।",
    
    // Legal Assistant
    legal_title: "एआई कानूनी अधिकार सहायक",
    legal_subtitle: "भारतीय कानूनी अधिकारों, BNS, घरेलू हिंसा और POSH अधिनियमों पर सटीक जानकारी।",
    legal_disclaimer: "अस्वीकरण: यह सहायक केवल जागरूकता के लिए जानकारी प्रदान करता है, पेशेवर कानूनी सलाह का विकल्प नहीं है।",
    legal_ask_placeholder: "जीरो एफआईआर, कार्यस्थल उत्पीड़न, घरेलू हिंसा संरक्षण के बारे में पूछें...",
    legal_ask_button: "कानूनी जानकारी पूछें",
    legal_offline_mode: "ऑफ़लाइन कानूनी लाइब्रेरी सक्रिय",
    legal_citations: "आधिकारिक कानूनी संदर्भ",
    legal_sample_q1: "जीरो एफआईआर (Zero FIR) क्या है और क्या पुलिस इसे दर्ज करने से मना कर सकती है?",
    legal_sample_q2: "कार्यस्थल पर यौन उत्पीड़न (POSH एक्ट) के तहत क्या कानूनी अधिकार हैं?",
    legal_sample_q3: "घरेलू हिंसा के खिलाफ भारतीय कानून के तहत क्या अधिकार हैं?",
    
    // Fake Call
    fake_call_title: "फेक कॉल सिमुलेशन",
    fake_call_subtitle: "असहज स्थिति से सुरक्षित रूप से निकलने के लिए एक नकली इनकमिंग कॉल शुरू करें।",
    fake_call_trigger_now: "5 सेकंड में कॉल",
    fake_call_trigger_10s: "10 सेकंड में कॉल",
    fake_call_trigger_30s: "30 सेकंड में कॉल",
    fake_call_incoming: "कॉल आ रही है...",
    fake_call_accept: "स्वीकार करें",
    fake_call_decline: "अस्वीकार करें",
    fake_call_caller: "कॉलर:",
    
    // Evidence
    evidence_title: "आपातकालीन साक्ष्य रिकॉर्डिंग",
    evidence_subtitle: "मुसीबत के समय सुरक्षित ऑडियो या फोटो रिकॉर्ड करें।",
    evidence_record_audio: "आपातकालीन ऑडियो रिकॉर्ड करें (30 सेकंड)",
    evidence_recording: "रिकॉर्डिंग जारी है...",
    evidence_save_complete: "साक्ष्य सुरक्षित रूप से दर्ज कर लिया गया है।",
    
    // Community & Resources
    community_title: "सुरक्षित महिला समुदाय",
    community_report_incident: "सुरक्षा समस्या की रिपोर्ट करें",
    community_verified_resources: "निकटतम सत्यापित सहायता",
    community_feed: "सामुदायिक यात्रा और सुरक्षा सुझाव",
    
    // Empowerment
    empowerment_title: "महिला सशक्तिकरण व योजनाएं",
    empowerment_subtitle: "सरकारी योजनाएं, कौशल प्रशिक्षण और महिला हेल्पलाइन नंबर।",
    
    // Settings & Profile
    settings_title: "प्रोफ़ाइल और सुरक्षा सेटिंग्स",
    settings_language: "पसंदीदा भाषा",
    settings_emergency_contacts: "आपातकालीन संपर्क",
    settings_add_contact: "संपर्क जोड़ें",
    settings_contact_name: "नाम",
    settings_contact_phone: "फ़ोन नंबर (+91)",
    settings_contact_relation: "संबंध",
    settings_shake_sos: "डिवाइस हिलाकर SOS (Shake to SOS)",
    settings_shake_sos_desc: "फोन तेजी से हिलाने पर तुरंत आपातकालीन प्रक्रिया सक्रिय होगी।",
    settings_save: "प्राथमिकताएं सहेजें",
  }
} as const;

export function getTranslation(lang: SupportedLanguage = 'en') {
  return translations[lang] || translations.en;
}
