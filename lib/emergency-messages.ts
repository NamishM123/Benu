// Canned emergency / harm-report message in many languages. The chat
// emergency intercept bypasses the LLM, so we cannot rely on the model
// to translate at runtime — these strings ship with the build.
//
// Every variant includes:
//  • the universal "🚨" symbol
//  • the digits "911" (people in any country recognize the symbol of an
//    emergency number; we tell them to also use their local one)
//  • the word "EpiPen" (untranslated — it's the trade name)
//  • a clear "I'm only an assistant" disclaimer
//  • "Shake Shake Fresh Noodle" as the restaurant name (Benu is the
//    AI assistant, not the restaurant)
//
// If the user's detected language isn't in this map, getEmergencyMessage
// falls back to English with a short multilingual call-to-action prefix
// that covers the most common languages.

export const EMERGENCY_MESSAGES: Record<string, string> = {
  en: "🚨 STOP — if there is any medical emergency right now, call 911 (or your local emergency number) immediately. If you or someone with you has had an allergic reaction, get a Shake Shake Fresh Noodle staff member or manager NOW. If an EpiPen is available, use it. Do not eat or drink anything else.\n\nI'm Benu, only a menu assistant — I cannot handle medical situations or incident reports. Please contact emergency services and restaurant management directly.",

  zh: "🚨 请立即停止 — 如果有任何医疗紧急情况，请立刻拨打 120（中国）/ 911（美国）或当地急救电话。如果您或同行人出现过敏反应，请立即找到 Shake Shake Fresh Noodle 工作人员或经理。如有肾上腺素自动注射器（EpiPen），请立即使用。请勿再进食或饮水。\n\n我是 Benu，只是一个菜单助手 — 无法处理医疗情况或事故报告。请直接联系急救服务和餐厅管理人员。",

  es: "🚨 ALTO — si hay una emergencia médica en este momento, llame al 911 (o al número de emergencia local) inmediatamente. Si usted o alguien con usted ha tenido una reacción alérgica, busque AHORA a un empleado o gerente de Shake Shake Fresh Noodle. Si hay un EpiPen disponible, úselo. No coma ni beba nada más.\n\nSoy Benu, solo un asistente de menú — no puedo gestionar situaciones médicas ni reportes de incidentes. Por favor contacte directamente con servicios de emergencia y la gerencia del restaurante.",

  fr: "🚨 ARRÊT — en cas d'urgence médicale, appelez immédiatement le 911 (USA), le 15 (France) ou votre numéro d'urgence local. Si vous ou quelqu'un avec vous a eu une réaction allergique, trouvez TOUT DE SUITE un employé ou un responsable de Shake Shake Fresh Noodle. Si un EpiPen est disponible, utilisez-le. Ne mangez ni ne buvez rien d'autre.\n\nJe suis Benu, seulement un assistant de menu — je ne peux pas gérer les situations médicales ni les signalements d'incident. Veuillez contacter directement les services d'urgence et la direction du restaurant.",

  ru: "🚨 СТОП — если сейчас происходит медицинская чрезвычайная ситуация, немедленно позвоните 911 (США), 103 (Россия) или по местному номеру экстренной службы. Если у вас или у кого-то рядом была аллергическая реакция, СРОЧНО позовите сотрудника или менеджера Shake Shake Fresh Noodle. Если есть EpiPen, используйте его. Больше ничего не ешьте и не пейте.\n\nЯ Benu, только помощник по меню — я не могу обрабатывать медицинские ситуации или сообщения об инцидентах. Пожалуйста, свяжитесь напрямую со службой экстренной помощи и руководством ресторана.",

  ja: "🚨 緊急停止 — 医療緊急事態の場合は、すぐに 911（米国）、119（日本）または現地の緊急番号に電話してください。あなた、または同伴者にアレルギー反応が起きた場合は、今すぐ Shake Shake Fresh Noodle のスタッフまたはマネージャーを呼んでください。EpiPen がある場合は使用してください。これ以上、何も食べたり飲んだりしないでください。\n\n私は Benu です。メニューのアシスタントに過ぎず、医療状況やインシデント報告には対応できません。緊急サービスとレストランの管理者に直接ご連絡ください。",

  ko: "🚨 즉시 중단 — 의료 응급 상황이라면 즉시 911(미국), 119(한국) 또는 현지 응급 번호로 전화하세요. 본인 또는 동행자에게 알레르기 반응이 발생한 경우, 지금 바로 Shake Shake Fresh Noodle 직원이나 매니저에게 알리세요. EpiPen이 있다면 사용하세요. 다른 음식이나 음료를 섭취하지 마세요.\n\n저는 Benu, 메뉴 도우미일 뿐이며 의료 상황이나 사고 보고를 처리할 수 없습니다. 응급 서비스와 레스토랑 관리자에게 직접 연락해 주세요.",

  ar: "🚨 توقف — إذا كانت هناك حالة طوارئ طبية الآن، اتصل بالرقم 911 (الولايات المتحدة) أو رقم الطوارئ المحلي على الفور. إذا تعرضت أنت أو شخص معك لرد فعل تحسسي، احصل على مساعدة موظف أو مدير Shake Shake Fresh Noodle الآن. إذا كان هناك حقنة EpiPen متاحة، فاستخدمها. لا تأكل أو تشرب أي شيء آخر.\n\nأنا Benu، مساعد قوائم الطعام فقط — لا يمكنني التعامل مع الحالات الطبية أو تقارير الحوادث. يرجى الاتصال بخدمات الطوارئ وإدارة المطعم مباشرة.",

  pt: "🚨 PARE — se houver uma emergência médica agora, ligue para o 911 (EUA), 192 (Brasil) ou seu número de emergência local imediatamente. Se você ou alguém com você teve uma reação alérgica, procure AGORA um funcionário ou gerente do Shake Shake Fresh Noodle. Se houver um EpiPen disponível, use-o. Não coma nem beba mais nada.\n\nSou o Benu, apenas um assistente de menu — não posso lidar com situações médicas ou relatos de incidentes. Por favor, entre em contato com os serviços de emergência e a gerência do restaurante diretamente.",

  de: "🚨 STOPP — bei einem medizinischen Notfall sofort den Notruf wählen: 911 (USA), 112 (Europa) oder die örtliche Notrufnummer. Wenn Sie oder jemand bei Ihnen eine allergische Reaktion hatte, holen Sie SOFORT einen Mitarbeiter oder Manager von Shake Shake Fresh Noodle. Falls ein EpiPen verfügbar ist, benutzen Sie ihn. Essen oder trinken Sie nichts weiteres.\n\nIch bin Benu, nur ein Menü-Assistent — ich kann keine medizinischen Situationen oder Vorfallsberichte bearbeiten. Bitte wenden Sie sich direkt an den Notdienst und die Restaurantleitung.",

  it: "🚨 FERMATEVI — in caso di emergenza medica, chiamate immediatamente il 911 (USA), il 112 (Italia) o il vostro numero di emergenza locale. Se voi o qualcuno con voi ha avuto una reazione allergica, chiamate SUBITO un membro dello staff o un manager di Shake Shake Fresh Noodle. Se è disponibile un EpiPen, usatelo. Non mangiate o bevete nient'altro.\n\nIo sono Benu, solo un assistente del menu — non posso gestire situazioni mediche o segnalazioni di incidenti. Vi prego di contattare direttamente i servizi di emergenza e la direzione del ristorante.",

  hi: "🚨 रुकें — यदि अभी कोई चिकित्सा आपातकाल है, तो तुरंत 911 (अमेरिका), 102/108 (भारत) या अपने स्थानीय आपातकालीन नंबर पर कॉल करें। यदि आपको या आपके साथ किसी को एलर्जी प्रतिक्रिया हुई है, तो अभी Shake Shake Fresh Noodle के स्टाफ या मैनेजर से सहायता लें। यदि EpiPen उपलब्ध है, तो इसका उपयोग करें। कुछ और न खाएं और न पिएं।\n\nमैं Benu हूँ, केवल एक मेनू सहायक — मैं चिकित्सा स्थितियों या घटना रिपोर्ट को संभाल नहीं सकता। कृपया सीधे आपातकालीन सेवाओं और रेस्तरां प्रबंधन से संपर्क करें।",

  bn: "🚨 থামুন — এখন যদি কোনো চিকিৎসা জরুরি অবস্থা থাকে, অবিলম্বে 911 (USA), 999 (বাংলাদেশ) অথবা আপনার স্থানীয় জরুরি নম্বরে কল করুন। আপনার বা আপনার সাথের কারো অ্যালার্জিক প্রতিক্রিয়া হলে, এখনই Shake Shake Fresh Noodle-এর স্টাফ বা ম্যানেজারের কাছে যান। যদি EpiPen পাওয়া যায়, ব্যবহার করুন। আর কিছু খাবেন বা পান করবেন না।\n\nআমি Benu, শুধু একটি মেনু সহায়ক — আমি চিকিৎসা পরিস্থিতি বা ঘটনা রিপোর্ট সামলাতে পারি না। দয়া করে সরাসরি জরুরি পরিষেবা এবং রেস্তোরাঁ ব্যবস্থাপনার সাথে যোগাযোগ করুন।",

  vi: "🚨 DỪNG LẠI — nếu có trường hợp cấp cứu y tế, hãy gọi ngay 911 (Mỹ), 115 (Việt Nam) hoặc số khẩn cấp địa phương của bạn. Nếu bạn hoặc người đi cùng có phản ứng dị ứng, hãy tìm nhân viên hoặc quản lý của Shake Shake Fresh Noodle NGAY LẬP TỨC. Nếu có sẵn EpiPen, hãy sử dụng. Đừng ăn hoặc uống thêm bất cứ thứ gì.\n\nTôi là Benu, chỉ là một trợ lý menu — tôi không thể xử lý các tình huống y tế hoặc báo cáo sự cố. Vui lòng liên hệ trực tiếp với dịch vụ khẩn cấp và ban quản lý nhà hàng.",

  th: "🚨 หยุด — หากเป็นเหตุฉุกเฉินทางการแพทย์ขณะนี้ โทร 911 (สหรัฐ), 1669 (ไทย) หรือหมายเลขฉุกเฉินท้องถิ่นของคุณทันที หากคุณหรือคนที่อยู่กับคุณมีอาการแพ้ ขอความช่วยเหลือจากพนักงานหรือผู้จัดการของ Shake Shake Fresh Noodle ทันที หากมี EpiPen ให้ใช้ทันที อย่ารับประทานหรือดื่มสิ่งใดเพิ่มเติม\n\nฉันคือ Benu ผู้ช่วยเมนูเท่านั้น — ฉันไม่สามารถจัดการกับสถานการณ์ทางการแพทย์หรือรายงานเหตุการณ์ได้ โปรดติดต่อบริการฉุกเฉินและฝ่ายบริหารร้านอาหารโดยตรง",

  tr: "🚨 DURUN — şu anda tıbbi bir acil durum varsa, hemen 911 (ABD), 112 (Türkiye) veya yerel acil durum numaranızı arayın. Siz veya yanınızdaki biri alerjik bir reaksiyon geçirdiyse, ŞİMDİ bir Shake Shake Fresh Noodle çalışanı veya müdürüne ulaşın. EpiPen varsa kullanın. Başka bir şey yiyip içmeyin.\n\nBen Benu, sadece bir menü asistanıyım — tıbbi durumları veya olay raporlarını yönetemem. Lütfen acil durum hizmetleri ve restoran yönetimi ile doğrudan iletişime geçin.",

  pl: "🚨 STOP — jeśli jest to nagły wypadek medyczny, natychmiast zadzwoń pod 911 (USA), 112 (Polska) lub lokalny numer alarmowy. Jeśli ty lub ktoś z tobą miał reakcję alergiczną, NATYCHMIAST poproś pracownika lub kierownika Shake Shake Fresh Noodle. Jeśli dostępny jest EpiPen, użyj go. Nie jedz ani nie pij niczego innego.\n\nJestem Benu, tylko asystent menu — nie mogę obsługiwać sytuacji medycznych ani zgłoszeń incydentów. Prosimy o bezpośredni kontakt ze służbami ratunkowymi i kierownictwem restauracji.",

  nl: "🚨 STOP — bij een medische noodsituatie nu, bel onmiddellijk 911 (VS), 112 (Nederland) of uw lokale alarmnummer. Als u of iemand bij u een allergische reactie heeft gehad, zoek NU een medewerker of manager van Shake Shake Fresh Noodle. Als er een EpiPen beschikbaar is, gebruik die. Eet of drink niets meer.\n\nIk ben Benu, slechts een menu-assistent — ik kan geen medische situaties of incidentmeldingen afhandelen. Neem direct contact op met de hulpdiensten en het management van het restaurant.",

  id: "🚨 BERHENTI — jika ada keadaan darurat medis sekarang, segera hubungi 911 (AS), 118/119 (Indonesia) atau nomor darurat setempat Anda. Jika Anda atau seseorang bersama Anda mengalami reaksi alergi, segera cari karyawan atau manajer Shake Shake Fresh Noodle. Jika tersedia EpiPen, gunakan. Jangan makan atau minum apa pun lagi.\n\nSaya Benu, hanya asisten menu — saya tidak dapat menangani situasi medis atau laporan insiden. Silakan hubungi layanan darurat dan manajemen restoran secara langsung.",

  he: "🚨 עצור — אם זוהי חירום רפואי כעת, חייג מיד 911 (ארה\"ב), 101 (ישראל) או למספר החירום המקומי שלך. אם לך או למישהו שאיתך הייתה תגובה אלרגית, פנה מיד לאיש צוות או מנהל של Shake Shake Fresh Noodle. אם יש EpiPen זמין, השתמש בו. אל תאכל או תשתה דבר נוסף.\n\nאני Benu, רק עוזר תפריט — אני לא יכול לטפל במצבים רפואיים או בדיווחי תקריות. אנא צור קשר ישיר עם שירותי החירום והנהלת המסעדה.",

  el: "🚨 ΣΤΑΜΑΤΗΣΤΕ — εάν υπάρχει ιατρική επείγουσα κατάσταση τώρα, καλέστε αμέσως το 911 (ΗΠΑ), το 112 (Ελλάδα) ή τον τοπικό αριθμό έκτακτης ανάγκης. Εάν εσείς ή κάποιος μαζί σας είχατε αλλεργική αντίδραση, βρείτε ΤΩΡΑ έναν υπάλληλο ή διευθυντή του Shake Shake Fresh Noodle. Εάν υπάρχει διαθέσιμο EpiPen, χρησιμοποιήστε το. Μην τρώτε ή πίνετε τίποτα άλλο.\n\nΕίμαι ο Benu, μόνο ένας βοηθός μενού — δεν μπορώ να χειριστώ ιατρικές καταστάσεις ή αναφορές περιστατικών. Παρακαλώ επικοινωνήστε απευθείας με τις υπηρεσίες έκτακτης ανάγκης και τη διεύθυνση του εστιατορίου.",
};

// Multilingual fallback used when the detected language isn't in the map
// above. Leads with universal symbols, then short call-to-action snippets
// in the most-spoken languages so SOMETHING is recognizable.
const MULTILINGUAL_FALLBACK =
  "🚨 EMERGENCY / 紧急 / EMERGENCIA / URGENCE / СРОЧНО / 緊急\n\n" +
  "Call 911 (or your local emergency number) immediately. " +
  "Get a Shake Shake Fresh Noodle staff member or manager NOW. " +
  "If an EpiPen is available, use it. Do not eat or drink anything else.\n\n" +
  "拨打 911 / 120,立即找服务员或经理。如有 EpiPen 请使用。\n" +
  "Llame al 911 inmediatamente y busque a un empleado.\n" +
  "Appelez le 911 / 15 immédiatement et trouvez un employé.\n\n" +
  "I'm Benu, only a menu assistant — please contact emergency services and restaurant management directly.";

export function getEmergencyMessage(lang: string): string {
  return EMERGENCY_MESSAGES[lang] ?? MULTILINGUAL_FALLBACK;
}
