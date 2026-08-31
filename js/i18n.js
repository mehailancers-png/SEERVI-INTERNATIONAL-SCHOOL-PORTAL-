/* =========================================================
   I18N.JS — Hindi / English language switcher (v3)
   Seervi International School — SIS ERP Portal

   SCOPE (per school requirement):
   - UTILITY pages fully supported in Hindi + English:
     Parent Portal, Student Dashboard, Results, Documents,
     Attendance, Homework, Notifications, Feedback/Contact,
     Parent-child linking, login forms, status messages.
   - COSMETIC / PRESENTATION pages (Index, About, Achievements,
     Gallery, Media showcase, etc.) remain primarily English.
     Only shared navigation labels are translated.

   Architecture (unchanged):
   - Flat English → Hindi phrase dictionary.
   - Full DOM text walk + attribute translation.
   - MutationObserver catches dynamic Firestore content.
   - Skips <script>, <style>, <select>, <option> (data safety).
   - SIS IDs, names, emails, filenames never match phrases.

   Translations use complete natural phrases, not word-by-word.
   ========================================================= */

(function () {

  var STORAGE_KEY = 'sis_lang';

  /* -----------------------------------------------------
     PHRASE DICTIONARY (English → Hindi)
     Longer / more specific phrases first (sorted at runtime
     by length so partial matches do not break longer ones).
  ----------------------------------------------------- */
  var PHRASES = {

    /* ===== Shared navigation (kept short & natural) ===== */
    "Home": "होम",
    "Results": "परिणाम",
    "Documents": "दस्तावेज़",
    "PYQs": "प्रश्नपत्र",
    "Resource Centre": "संसाधन केंद्र",
    "School News": "विद्यालय समाचार",
    "School Blog": "विद्यालय ब्लॉग",
    "Media Centre": "मीडिया केंद्र",
    "Appointment": "नियुक्ति",
    "Student Portal": "छात्र पोर्टल",
    "Parent Portal": "अभिभावक पोर्टल",
    "Staff Portal": "स्टाफ पोर्टल",
    "Quick Services": "त्वरित सेवाएं",
    "Quick Links": "त्वरित लिंक",
    "Portals": "पोर्टल",
    "Contact": "संपर्क",
    "Back to Website": "वेबसाइट पर वापस जाएं",
    "← Back to Website": "← वेबसाइट पर वापस जाएं",
    "Home page": "मुख्य पृष्ठ",
    "Skip to main content": "मुख्य सामग्री पर जाएं",

    /* ===== Auth / Login ===== */
    "Log In": "लॉग इन",
    "Sign Up": "साइन अप",
    "Log Out": "लॉग आउट",
    "Full Name": "पूरा नाम",
    "Email": "ईमेल",
    "Password": "पासवर्ड",
    "Confirm Password": "पासवर्ड की पुष्टि करें",
    "SIS Student ID": "SIS छात्र आईडी",
    "Roll Number": "रोल नंबर",
    "Class": "कक्षा",
    "Section": "सेक्शन",
    "I am a Student": "मैं एक छात्र हूं",
    "I am a Parent": "मैं एक अभिभावक हूं",
    "Create Account": "खाता बनाएं",
    "Continue with Google": "Google से जारी रखें",
    "My Dashboard": "मेरा डैशबोर्ड",
    "Logged in as": "लॉग इन किया गया",
    "Staff Email": "स्टाफ ईमेल",
    "Staff Access Code": "स्टाफ एक्सेस कोड",
    "Staff Log In": "स्टाफ लॉग इन",
    "Checking your login...": "आपका लॉगिन जांचा जा रहा है...",
    "Student Login": "छात्र लॉगिन",
    "Parent Login": "अभिभावक लॉगिन",
    "Staff Login": "स्टाफ लॉगिन",

    /* ===== Dashboard navigation labels ===== */
    "Attendance": "उपस्थिति",
    "Homework": "गृहकार्य",
    "Profile": "प्रोफ़ाइल",
    "Parent Requests": "अभिभावक अनुरोध",
    "Parent Link Requests": "अभिभावक लिंक अनुरोध",
    "Child Details": "बच्चे का विवरण",
    "Students": "छात्र",
    "Upload Results": "परिणाम अपलोड करें",
    "Upload Attendance": "उपस्थिति अपलोड करें",
    "Upload PYQs": "प्रश्नपत्र अपलोड करें",
    "Publish News": "समाचार प्रकाशित करें",
    "Appointments": "नियुक्तियाँ",
    "Send Notification": "सूचना भेजें",
    "Verify Documents": "दस्तावेज़ सत्यापित करें",
    "Feedback & Contact": "प्रतिक्रिया और संपर्क",
    "Feedback & Tickets": "प्रतिक्रिया और टिकट",
    "Notifications": "सूचनाएं",

    /* ===== Main headings (utility) ===== */
    "My Results": "मेरे परिणाम",
    "My Attendance": "मेरी उपस्थिति",
    "My Documents": "मेरे दस्तावेज़",
    "My Profile": "मेरी प्रोफ़ाइल",
    "My Tickets": "मेरे टिकट",
    "School Overview": "विद्यालय अवलोकन",
    "Upload a New Document": "नया दस्तावेज़ अपलोड करें",
    "Your Documents": "आपके दस्तावेज़",
    "Verification Timeline": "सत्यापन समयरेखा",
    "Book an Appointment": "नियुक्ति बुक करें",
    "Assign Homework": "गृहकार्य सौंपें",
    "All Homework": "सभी गृहकार्य",
    "All Students": "सभी छात्र",
    "Filter Students": "छात्र फ़िल्टर करें",
    "Child's Documents": "बच्चे के दस्तावेज़",
    "Child's Attendance": "बच्चे की उपस्थिति",
    "Child's Homework": "बच्चे का गृहकार्य",
    "Child's Results": "बच्चे के परिणाम",
    "Link a Child": "बच्चे को लिंक करें",
    "Link Status": "लिंक स्थिति",
    "Check Your Results": "अपने परिणाम देखें",
    "Upload & Track Documents": "दस्तावेज़ अपलोड और ट्रैक करें",
    "Subject-wise Marks": "विषय-वार अंक",
    "Monthly Breakdown": "मासिक विवरण",
    "Pending & Recent Homework": "लंबित और हाल का गृहकार्य",
    "Recent Uploads": "हाल के अपलोड",
    "Pending Requests": "लंबित अनुरोध",
    "Linked Parents": "लिंक किए गए अभिभावक",
    "My Appointment Requests": "मेरे नियुक्ति अनुरोध",

    /* ===== Buttons & actions ===== */
    "Search Result": "परिणाम खोजें",
    "Search": "खोजें",
    "Submit": "जमा करें",
    "Submit Ticket": "टिकट जमा करें",
    "Download": "डाउनलोड करें",
    "Download Result": "परिणाम डाउनलोड करें",
    "Upload": "अपलोड करें",
    "Save Changes": "परिवर्तन सहेजें",
    "Save Result": "परिणाम सहेजें",
    "Save Attendance": "उपस्थिति सहेजें",
    "Upload Document": "दस्तावेज़ अपलोड करें",
    "Upload Resource": "संसाधन अपलोड करें",
    "Upload PYQ": "प्रश्नपत्र अपलोड करें",
    "Upload Media": "मीडिया अपलोड करें",
    "Publish Article": "लेख प्रकाशित करें",
    "Verify": "सत्यापित करें",
    "Reject": "अस्वीकार करें",
    "Approve": "स्वीकृत करें",
    "Delete": "हटाएं",
    "Edit": "संपादित करें",
    "Cancel Edit": "संपादन रद्द करें",
    "View": "देखें",
    "View File": "फ़ाइल देखें",
    "View Documents": "दस्तावेज़ देखें",
    "Request Appointment": "नियुक्ति का अनुरोध करें",
    "Send Link Request": "लिंक अनुरोध भेजें",
    "Accept": "स्वीकार करें",
    "+ New Ticket": "+ नया टिकट",
    "Send": "भेजें",
    "Back": "वापस",
    "Close": "बंद करें",
    "Sending...": "भेजा जा रहा है...",
    "Uploading...": "अपलोड हो रहा है...",
    "Go to Results Page →": "परिणाम पृष्ठ पर जाएं →",
    "Go to Document Center →": "दस्तावेज़ केंद्र पर जाएं →",
    "Upload on Their Behalf →": "उनकी ओर से अपलोड करें →",
    "Book New Appointment →": "नई नियुक्ति बुक करें →",
    "Click to Add Photo": "फोटो जोड़ने के लिए क्लिक करें",
    "Click to upload": "अपलोड करने के लिए क्लिक करें",
    "or drag and drop": "या खींचकर छोड़ें",

    /* ===== Form labels ===== */
    "Category": "श्रेणी",
    "Subject": "विषय",
    "Title": "शीर्षक",
    "Message": "संदेश",
    "Due Date": "नियत तारीख",
    "Document Type": "दस्तावेज़ प्रकार",
    "Purpose of Visit": "यात्रा का उद्देश्य",
    "Preferred Date": "पसंदीदा तारीख",
    "Preferred Time": "पसंदीदा समय",
    "Child's Name": "बच्चे का नाम",
    "Child's SIS Student ID": "बच्चे की SIS छात्र आईडी",
    "Select Class": "कक्षा चुनें",
    "Select Category": "श्रेणी चुनें",
    "Select Document Type": "दस्तावेज़ प्रकार चुनें",
    "Select Purpose": "उद्देश्य चुनें",
    "Choose a student...": "एक छात्र चुनें...",
    "Choose a parent...": "एक अभिभावक चुनें...",
    "Marks Obtained": "प्राप्त अंक",
    "Max Marks": "अधिकतम अंक",
    "Grade": "ग्रेड",
    "Month": "महीना",
    "Present": "उपस्थित",
    "Absent": "अनुपस्थित",
    "Percentage": "प्रतिशत",
    "Total": "कुल",
    "Overall Percentage": "समग्र प्रतिशत",
    "Result Status": "परिणाम स्थिति",
    "Attendance %": "उपस्थिति %",
    "Days Present": "उपस्थित दिन",
    "Total Working Days": "कुल कार्य दिवस",
    "SIS ID": "SIS आईडी",

    /* ===== Status words ===== */
    "Pending": "लंबित",
    "Verified": "सत्यापित",
    "Rejected": "अस्वीकृत",
    "Approved": "स्वीकृत",
    "Accepted": "स्वीकृत",
    "Open": "खुला",
    "In Progress": "प्रगति पर",
    "Resolved": "हल हो गया",
    "Pass": "उत्तीर्ण",
    "Fail": "अनुत्तीर्ण",
    "PASS": "उत्तीर्ण",
    "FAIL": "अनुत्तीर्ण",

    /* ===== Empty states & messages (natural complete sentences) ===== */
    "Loading...": "लोड हो रहा है...",
    "Loading documents...": "दस्तावेज़ लोड हो रहे हैं...",
    "Loading your documents...": "आपके दस्तावेज़ लोड हो रहे हैं...",
    "Loading your appointments...": "आपकी नियुक्तियाँ लोड हो रही हैं...",
    "No notifications yet.": "अभी कोई सूचना नहीं है।",
    "No documents uploaded yet.": "अभी तक कोई दस्तावेज़ अपलोड नहीं हुआ है।",
    "No homework has been assigned yet.": "अभी तक कोई गृहकार्य नहीं सौंपा गया है।",
    "No homework has been assigned yet. Check back soon.": "अभी तक कोई गृहकार्य नहीं सौंपा गया है। जल्द ही दोबारा देखें।",
    "No results published yet.": "अभी तक कोई परिणाम प्रकाशित नहीं हुआ है।",
    "No appointment requests yet.": "अभी तक कोई नियुक्ति अनुरोध नहीं है।",
    "No students found.": "कोई छात्र नहीं मिला।",
    "No link requests yet.": "अभी तक कोई लिंक अनुरोध नहीं है।",
    "No notifications sent yet.": "अभी तक कोई सूचना नहीं भेजी गई है।",
    "You haven't submitted any tickets yet.": "आपने अभी तक कोई टिकट जमा नहीं किया है।",
    "No tickets submitted yet.": "अभी तक कोई टिकट जमा नहीं किया गया है।",
    "No parent linked yet.": "अभी तक कोई अभिभावक लिंक नहीं किया गया है।",
    "No homework assigned yet.": "अभी तक कोई गृहकार्य नहीं सौंपा गया है।",
    "Uploaded": "अपलोड किया गया",
    "Reviewed by": "समीक्षक",
    "Due": "नियत तारीख",
    "Reason": "कारण",
    "Recipients": "प्राप्तकर्ता",
    "Reference ID": "संदर्भ आईडी",
    "Just now": "अभी अभी",

    /* ===== Longer instructional sentences (utility pages) ===== */
    "Link your account to your child's so you can see their real results and documents.": "अपने खाते को बच्चे के खाते से लिंक करें ताकि आप उनके वास्तविक परिणाम और दस्तावेज़ देख सकें।",
    "Live once your child accepts your link request.": "जब आपका बच्चा आपके लिंक अनुरोध को स्वीकार कर लेगा, तब यह लाइव हो जाएगा।",
    "Link your child's account first (Child Details panel), and once they accept, their real results will show here automatically. In the meantime, you can also search using their SIS ID:": "पहले बच्चे के खाते को लिंक करें (बच्चे का विवरण पैनल)। जब वे स्वीकार करेंगे, तो उनके वास्तविक परिणाम यहाँ अपने आप दिखेंगे। इस बीच आप उनकी SIS आईडी से भी खोज सकते हैं:",
    "Link your child's account first (Child Details panel). Once they accept, their real attendance record will show here automatically.": "पहले बच्चे के खाते को लिंक करें (बच्चे का विवरण पैनल)। जब वे स्वीकार करेंगे, तो उनकी वास्तविक उपस्थिति यहाँ अपने आप दिखेगी।",
    "Link your child's account first (Child Details panel). Once they accept, their assigned homework will show here automatically.": "पहले बच्चे के खाते को लिंक करें (बच्चे का विवरण पैनल)। जब वे स्वीकार करेंगे, तो उनका गृहकार्य यहाँ अपने आप दिखेगा।",
    "Link your child's account first (Child Details panel). Once they accept, their real documents — with status, review notes, and download links — will show here automatically.": "पहले बच्चे के खाते को लिंक करें (बच्चे का विवरण पैनल)। जब वे स्वीकार करेंगे, तो उनके दस्तावेज़ (स्थिति, समीक्षा नोट और डाउनलोड लिंक सहित) यहाँ अपने आप दिखेंगे।",
    "Requests you've made to meet with school staff.": "स्कूल स्टाफ से मिलने के लिए आपके द्वारा किए गए अनुरोध।",
    "Your latest academic performance, subject by subject.": "आपका नवीनतम शैक्षणिक प्रदर्शन, विषय के अनुसार।",
    "Your attendance record for the current academic session.": "वर्तमान शैक्षणिक सत्र के लिए आपकी उपस्थिति का रिकॉर्ड।",
    "Assignments shared by your teachers.": "आपके शिक्षकों द्वारा साझा किए गए असाइनमेंट।",
    "Upload documents and track their verification status.": "दस्तावेज़ अपलोड करें और उनकी सत्यापन स्थिति ट्रैक करें।",
    "Approve a parent's request to view your results and documents.": "अपने परिणाम और दस्तावेज़ देखने के लिए अभिभावक के अनुरोध को स्वीकृत करें।",
    "Your account information on file with the school.": "स्कूल के पास दर्ज आपकी खाता जानकारी।",
    "Submit your documents securely and track their verification status in real time.": "अपने दस्तावेज़ सुरक्षित रूप से जमा करें और उनकी सत्यापन स्थिति वास्तविक समय में ट्रैक करें।",
    "Any file type is accepted — PDF, images, Word documents, and more.": "कोई भी फ़ाइल प्रकार स्वीकार किया जाता है — PDF, छवियाँ, Word दस्तावेज़ आदि।",
    "Any file type — Max 10 MB": "कोई भी फ़ाइल प्रकार — अधिकतम 10 MB",
    "Search using your Roll Number or SIS ID to view your latest result.": "अपना रोल नंबर या SIS आईडी डालकर अपना नवीनतम परिणाम देखें।",
    "Results are published by the school as soon as they're available. If your result isn't showing yet, please check back later.": "परिणाम उपलब्ध होते ही स्कूल द्वारा प्रकाशित किए जाते हैं। यदि आपका परिणाम अभी नहीं दिख रहा है, तो कृपया बाद में दोबारा देखें।",
    "You haven't uploaded any documents yet. Use the form above to submit one — it will appear here as Pending until a teacher reviews it.": "आपने अभी तक कोई दस्तावेज़ अपलोड नहीं किया है। ऊपर दिए गए फॉर्म से जमा करें — शिक्षक की समीक्षा होने तक यह यहाँ लंबित दिखेगा।",
    "Document Submitted": "दस्तावेज़ जमा किया गया",
    "Your document is received by the school office.": "आपका दस्तावेज़ स्कूल कार्यालय द्वारा प्राप्त कर लिया गया है।",
    "Under Review": "समीक्षाधीन",
    "Administration staff cross-check the submitted document.": "प्रशासन स्टाफ जमा किए गए दस्तावेज़ की जाँच कर रहा है।",
    "Verification In Progress": "सत्यापन प्रगति पर",
    "A teacher reviews the document against official records.": "एक शिक्षक आधिकारिक रिकॉर्ड से दस्तावेज़ की जाँच कर रहा है।",
    "Verified / Rejected": "सत्यापित / अस्वीकृत",
    "The teacher's decision is updated here and on your dashboard.": "शिक्षक का निर्णय यहाँ और आपके डैशबोर्ड पर अपडेट हो जाता है।",
    "Request sent! Waiting for your child to accept it.": "अनुरोध भेज दिया गया! बच्चे द्वारा स्वीकार करने की प्रतीक्षा है।",
    "No results published for your child yet.": "अभी तक आपके बच्चे के लिए कोई परिणाम प्रकाशित नहीं हुआ है।",
    "No attendance published for your child yet.": "अभी तक आपके बच्चे की उपस्थिति प्रकाशित नहीं हुई है।",
    "Your child hasn't uploaded any documents yet.": "आपके बच्चे ने अभी तक कोई दस्तावेज़ अपलोड नहीं किया है।",
    "Attendance records are not published yet. Please check back later.": "उपस्थिति रिकॉर्ड अभी प्रकाशित नहीं हुए हैं। कृपया बाद में दोबारा देखें।",
    "No results published yet. Check back later or use the public Results page.": "अभी तक कोई परिणाम प्रकाशित नहीं हुआ है। बाद में देखें या सार्वजनिक परिणाम पृष्ठ का उपयोग करें।",
    "Please enter a valid roll number.": "कृपया एक वैध रोल नंबर दर्ज करें।",
    "Please enter a valid SIS ID.": "कृपया एक वैध SIS आईडी दर्ज करें।",
    "Please select a class.": "कृपया कक्षा चुनें।",
    "Please select a document type.": "कृपया दस्तावेज़ का प्रकार चुनें।",
    "Student Name": "छात्र का नाम",
    "Academic Records": "शैक्षणिक रिकॉर्ड",
    "Document Center": "दस्तावेज़ केंद्र",
    "Parent": "अभिभावक",
    "Student": "छात्र",
    "Staff": "स्टाफ",
    "Principal": "प्रधानाचार्य",
    "Change profile picture": "प्रोफ़ाइल फ़ोटो बदलें",
    "Collapse menu": "मेनू संक्षिप्त करें",
    "Expand menu": "मेनू विस्तृत करें",
    "Open menu": "मेनू खोलें",
    "Close menu": "मेनू बंद करें",
    "Back to top": "ऊपर जाएं",
    "Remove selected file": "चयनित फ़ाइल हटाएं",
    "Upload document, click or drag a file here": "दस्तावेज़ अपलोड करें, क्लिक करें या फ़ाइल यहाँ खींचें",
    "Switch language / भाषा बदलें": "भाषा बदलें / Switch language"
  };

  var REVERSE_PHRASES = {};
  Object.keys(PHRASES).forEach(function (k) { REVERSE_PHRASES[PHRASES[k]] = k; });

  var EN_KEYS_SORTED = Object.keys(PHRASES).sort(function (a, b) { return b.length - a.length; });
  var HI_KEYS_SORTED = Object.keys(REVERSE_PHRASES).sort(function (a, b) { return b.length - a.length; });

  function translateText(text, toLang) {
    var dict = toLang === 'hi' ? PHRASES : REVERSE_PHRASES;
    var keys = toLang === 'hi' ? EN_KEYS_SORTED : HI_KEYS_SORTED;
    var result = text;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (result.indexOf(k) !== -1) {
        result = result.split(k).join(dict[k]);
      }
    }
    return result;
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, OPTION: 1, SELECT: 1 };

  function shouldSkipTextNode(node) {
    var p = node.parentElement;
    while (p) {
      if (SKIP_TAGS[p.tagName]) return true;
      p = p.parentElement;
    }
    return false;
  }

  function translateElementText(root, toLang) {
    if (!root || root.nodeType !== 1) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node, textNodes = [];
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      if (shouldSkipTextNode(node)) continue;
      textNodes.push(node);
    }
    textNodes.forEach(function (n) {
      var translated = translateText(n.nodeValue, toLang);
      if (translated !== n.nodeValue) n.nodeValue = translated;
    });

    // Attributes that hold visible text (placeholders, aria-labels, titles)
    ['placeholder', 'aria-label', 'title'].forEach(function (attr) {
      var els = root.querySelectorAll('[' + attr + ']');
      els.forEach(function (el) {
        if (SKIP_TAGS[el.tagName]) return;
        var val = el.getAttribute(attr);
        if (!val) return;
        var translated = translateText(val, toLang);
        if (translated !== val) el.setAttribute(attr, translated);
      });
    });
    // Root element itself might carry one of these attributes
    ['placeholder', 'aria-label', 'title'].forEach(function (attr) {
      if (root.hasAttribute && root.hasAttribute(attr)) {
        var val = root.getAttribute(attr);
        var translated = translateText(val, toLang);
        if (translated !== val) root.setAttribute(attr, translated);
      }
    });
  }

  var currentLang = 'en';
  var observer = null;

  function applyLanguage(lang) {
    currentLang = (lang === 'hi') ? 'hi' : 'en';
    document.documentElement.setAttribute('lang', currentLang);

    if (observer) observer.disconnect();
    translateElementText(document.body, currentLang);
    if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) { /* ignore */ }

    var toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) toggleBtn.textContent = currentLang === 'hi' ? 'EN' : 'हिं';
  }

  function getSavedLanguage() {
    try { return localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) { return 'en'; }
  }

  function injectToggle() {
    var host = document.querySelector('.header-actions') || document.querySelector('.header-container');
    if (!host) return;

    // Avoid duplicate toggle if script is loaded more than once
    if (document.getElementById('langToggleBtn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'langToggleBtn';
    btn.className = 'notif-bell-btn';
    btn.setAttribute('aria-label', 'Switch language / भाषा बदलें');
    btn.style.fontSize = '12px';
    btn.style.fontWeight = '700';

    if (host.classList.contains('header-actions')) {
      host.insertBefore(btn, host.firstChild);
    } else {
      var hamburger = document.getElementById('hamburgerBtn');
      if (hamburger && hamburger.parentNode) {
        hamburger.parentNode.insertBefore(btn, hamburger);
      } else {
        host.appendChild(btn);
      }
    }

    btn.addEventListener('click', function () {
      applyLanguage(currentLang === 'hi' ? 'en' : 'hi');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectToggle();

    // Observer must be ready before the first pass so late-arriving
    // Firestore content (lists, dashboards, modals) is also translated.
    observer = new MutationObserver(function (mutations) {
      observer.disconnect();
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) {
            translateElementText(n, currentLang);
          } else if (n.nodeType === 3 && n.parentElement) {
            translateElementText(n.parentElement, currentLang);
          }
        });
        if (m.type === 'characterData' && m.target && m.target.parentElement) {
          translateElementText(m.target.parentElement, currentLang);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    applyLanguage(getSavedLanguage());
  });

})();
