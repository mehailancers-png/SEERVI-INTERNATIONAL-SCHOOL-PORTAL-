/* =========================================================
   I18N.JS — Hindi / English (v5)
   Seervi International School — SIS ERP Portal

   ONLY these pages get translation:
   results, documents, pyq, resources, news, blog, media,
   appointment, student-login, student-dashboard,
   parent-portal, staff-login, staff-dashboard,
   principal-dashboard

   Homepage (index) and every other page = NO translation.
   ========================================================= */

(function () {

  var STORAGE_KEY = 'sis_lang';

  /* Whitelist — translation runs ONLY on these filenames */
    var ALLOWED_PAGES = [
    'results.html',
    'documents.html',
    'pyq.html',
    'resources.html',
    'news.html',
    'blog.html',
    'media.html',
    'appointment.html',
    'student-login.html',
    'student-dashboard.html',
    'parent-portal.html'
  ];

  function isTranslationAllowed() {
    var path = (window.location.pathname || '').toLowerCase();
    for (var i = 0; i < ALLOWED_PAGES.length; i++) {
      if (path.indexOf(ALLOWED_PAGES[i]) !== -1) return true;
    }
    return false;
  }

  var PHRASES = {
    // Login page full phrases (prevent broken "छात्र & अभिभावक Login")
    "Student & Parent Login": "छात्र और अभिभावक लॉगिन",
    "Student and Parent Login": "छात्र और अभिभावक लॉगिन",
    "QUICK SERVICE": "त्वरित सेवा",
    "Quick Service": "त्वरित सेवा",
    "Access your results, documents, PYQs, and appointments.": "अपने परिणाम, दस्तावेज़, PYQs और नियुक्तियाँ देखें।",
    "Enter your password": "अपना पासवर्ड दर्ज करें",
    "Enter password": "पासवर्ड दर्ज करें",
    "you@example.com": "you@example.com",
    "Create your account": "अपना खाता बनाएं",
    "Already have an account?": "पहले से खाता है?",
    "Don't have an account?": "खाता नहीं है?",
    "Forgot password?": "पासवर्ड भूल गए?",
    "Sign in to continue": "जारी रखने के लिए साइन इन करें",

    "School News & Announcements": "विद्यालय समाचार और घोषणाएँ",
    "School News &amp; Announcements": "विद्यालय समाचार और घोषणाएँ",
    "Book Appointment": "नियुक्ति बुक करें",
    "Book an Appointment": "नियुक्ति बुक करें",
    "Contact Us": "संपर्क करें",
    "Get in Touch": "संपर्क करें",
    "GET IN TOUCH": "संपर्क करें",
    "Principal's Message": "प्रधानाचार्य का संदेश",
    "All Categories": "सभी श्रेणियाँ",
    "All Events": "सभी कार्यक्रम",
    "All Classes": "सभी कक्षाएं",
    "All Subjects": "सभी विषय",
    "Logged in as": "लॉग इन किया गया",
    "My Dashboard": "मेरा डैशबोर्ड",
    "Log Out": "लॉग आउट",
    "Back to Website": "वेबसाइट पर वापस जाएं",
    "Link a Child": "बच्चे को लिंक करें",
    "Link Status": "लिंक स्थिति",
    "Child's SIS Student ID": "Child's SIS Student ID",
    "Send Link Request": "लिंक अनुरोध भेजें",
    "Accept": "स्वीकार करें",
    "Accepted": "स्वीकृत",
    "Reject": "अस्वीकार करें",
    "Rejected": "अस्वीकृत",
    "Pending": "लंबित",
    "Verified": "सत्यापित",
    "Approved": "स्वीकृत",

    "Home": "होम",
    "Results": "परिणाम",
    "Documents": "दस्तावेज़",
    "PYQs": "PYQs",
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
    "Student Login": "छात्र लॉगिन",
    "Staff Login": "स्टाफ लॉगिन",

    "Log In": "लॉग इन",
    "Sign Up": "साइन अप",
    "Full Name": "पूरा नाम",
    "Email": "ईमेल",
    "Password": "पासवर्ड",
    "Confirm Password": "पासवर्ड की पुष्टि करें",
    "SIS Student ID": "SIS Student ID",
    "SIS ID": "SIS ID",
    "Roll Number": "रोल नंबर",
    "Class": "कक्षा",
    "Section": "सेक्शन",
    "I am a Student": "मैं एक छात्र हूं",
    "I am a Parent": "मैं एक अभिभावक हूं",
    "Create Account": "खाता बनाएं",
    "Continue with Google": "Google से जारी रखें",
    "Staff Email": "स्टाफ ईमेल",
    "Staff Access Code": "स्टाफ एक्सेस कोड",
    "Staff Log In": "स्टाफ लॉग इन",

    "Attendance": "उपस्थिति",
    "Homework": "गृहकार्य",
    "Profile": "प्रोफ़ाइल",
    "Parent Requests": "अभिभावक अनुरोध",
    "Child Details": "बच्चे का विवरण",
    "Students": "छात्र",
    "Upload Results": "परिणाम अपलोड करें",
    "Upload Attendance": "उपस्थिति अपलोड करें",
    "Upload PYQs": "PYQs अपलोड करें",
    "Publish News": "समाचार प्रकाशित करें",
    "Appointments": "नियुक्तियाँ",
    "Send Notification": "सूचना भेजें",
    "Verify Documents": "दस्तावेज़ सत्यापित करें",
    "Feedback & Contact": "प्रतिक्रिया और संपर्क",
    "Feedback & Tickets": "प्रतिक्रिया और टिकट",
    "Notifications": "सूचनाएँ",

    "My Results": "मेरे परिणाम",
    "My Attendance": "मेरी उपस्थिति",
    "My Documents": "मेरे दस्तावेज़",
    "My Profile": "मेरी प्रोफ़ाइल",
    "My Tickets": "मेरे टिकट",
    "School Overview": "विद्यालय अवलोकन",
    "Upload a New Document": "नया दस्तावेज़ अपलोड करें",
    "Your Documents": "आपके दस्तावेज़",
    "Verification Timeline": "सत्यापन समयरेखा",
    "Assign Homework": "गृहकार्य सौंपें",
    "All Homework": "सभी गृहकार्य",
    "All Students": "सभी छात्र",
    "Filter Students": "छात्र फ़िल्टर करें",
    "Child's Documents": "बच्चे के दस्तावेज़",
    "Child's Attendance": "बच्चे की उपस्थिति",
    "Child's Homework": "बच्चे का गृहकार्य",
    "Child's Results": "बच्चे के परिणाम",
    "Check Your Results": "अपने परिणाम जांचें",
    "Upload & Track Documents": "दस्तावेज़ अपलोड और ट्रैक करें",
    "Previous Year Question Papers": "पिछले वर्षों के प्रश्नपत्र",
    "Academic Records": "शैक्षणिक रिकॉर्ड",
    "Document Center": "दस्तावेज़ केंद्र",
    "Exam Preparation": "परीक्षा तैयारी",
    "Stories From Our School": "हमारे विद्यालय की कहानियाँ",
    "STORIES FROM OUR SCHOOL": "हमारे विद्यालय की कहानियाँ",
    "Moments From Our School": "हमारे विद्यालय के पल",
    "MOMENTS FROM OUR SCHOOL": "हमारे विद्यालय के पल",
    "Stay Informed": "जानकार रहें",
    "STAY INFORMED": "जानकार रहें",
    "Meet With Us": "हमसे मिलें",
    "MEET WITH US": "हमसे मिलें",
    "Syllabus, Forms & Study Materials": "पाठ्यक्रम, फॉर्म और अध्ययन सामग्री",

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
    "Upload PYQ": "PYQ अपलोड करें",
    "Upload Media": "मीडिया अपलोड करें",
    "Publish Article": "लेख प्रकाशित करें",
    "Verify": "सत्यापित करें",
    "Approve": "स्वीकृत करें",
    "Delete": "हटाएं",
    "Edit": "संपादित करें",
    "Cancel Edit": "संपादन रद्द करें",
    "View": "देखें",
    "View File": "फ़ाइल देखें",
    "View Documents": "दस्तावेज़ देखें",
    "Request Appointment": "नियुक्ति का अनुरोध करें",
    "+ New Ticket": "+ नया टिकट",
    "Send": "भेजें",
    "Back": "वापस",
    "Close": "बंद करें",
    "Click to upload": "अपलोड करने के लिए क्लिक करें",
    "or drag and drop": "या खींचकर छोड़ें",

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
    "Select Class": "कक्षा चुनें",
    "Select Category": "श्रेणी चुनें",
    "Select Document Type": "दस्तावेज़ प्रकार चुनें",
    "Select Purpose": "उद्देश्य चुनें",
    "Choose a student...": "एक छात्र चुनें...",
    "Choose a parent...": "एक अभिभावक चुनें...",
    "Search by paper name...": "पेपर के नाम से खोजें...",
    "Event": "कार्यक्रम",
    "Address": "पता",
    "Phone": "फ़ोन",

    "Open": "खुला",
    "In Progress": "प्रगति पर",
    "Resolved": "हल हो गया",
    "Pass": "उत्तीर्ण",
    "Fail": "अनुत्तीर्ण",
    "PASS": "उत्तीर्ण",
    "FAIL": "अनुत्तीर्ण",
    "Overall Percentage": "समग्र प्रतिशत",
    "Result Status": "परिणाम स्थिति",
    "Total": "कुल",
    "Percentage": "प्रतिशत",
    "Marks Obtained": "प्राप्तांक",
    "Max Marks": "पूर्णांक",
    "Grade": "ग्रेड",
    "Student Name": "छात्र का नाम",
    "Roll No:": "रोल नंबर:",

    "Loading...": "लोड हो रहा है...",
    "Loading question papers...": "प्रश्नपत्र लोड हो रहे हैं...",
    "Loading articles...": "लेख लोड हो रहे हैं...",
    "Loading news...": "समाचार लोड हो रहे हैं...",
    "No notifications yet.": "अभी कोई सूचना नहीं है।",
    "No documents uploaded yet.": "अभी तक कोई दस्तावेज़ अपलोड नहीं हुआ है।",
    "No homework has been assigned yet.": "अभी तक कोई गृहकार्य नहीं सौंपा गया है।",
    "No results published yet.": "अभी तक कोई परिणाम प्रकाशित नहीं हुआ है।",
    "No appointment requests yet.": "अभी तक कोई नियुक्ति अनुरोध नहीं है।",
    "No students found.": "कोई छात्र नहीं मिला।",
    "No link requests yet.": "अभी तक कोई लिंक अनुरोध नहीं है।",
    "No notifications sent yet.": "अभी तक कोई सूचना नहीं भेजी गई है।",
    "You haven't submitted any tickets yet.": "आपने अभी तक कोई टिकट जमा नहीं किया है।",
    "No tickets submitted yet.": "अभी तक कोई टिकट जमा नहीं किया गया है।",
    "Uploaded": "अपलोड किया गया",
    "Reviewed by": "समीक्षक",
    "Due": "नियत तारीख",
    "Reason": "कारण",
    "Recipients": "प्राप्तकर्ता",
    "No question papers matched your search. Try a different class, subject, or keyword.": "आपकी खोज से मेल खाने वाला कोई प्रश्नपत्र नहीं मिला। कोई अन्य कक्षा, विषय या कीवर्ड आज़माएँ।",
    "You haven't uploaded any documents yet. Use the form above to submit one — it will appear here as Pending until a teacher reviews it.": "आपने अभी तक कोई दस्तावेज़ अपलोड नहीं किया है। ऊपर दिए गए फ़ॉर्म से एक जमा करें — शिक्षक द्वारा समीक्षा होने तक यह यहाँ लंबित दिखेगा।",
    "Results are published by the school as soon as they're available. If your result isn't showing yet, please check back later.": "परिणाम उपलब्ध होते ही विद्यालय द्वारा प्रकाशित किए जाते हैं। यदि आपका परिणाम अभी नहीं दिख रहा है, तो कृपया बाद में फिर से जाँच करें।",
    "Any file type is accepted — PDF, images, Word documents, and more.": "कोई भी फ़ाइल प्रकार स्वीकार किया जाता है — PDF, छवियाँ, Word दस्तावेज़ और अन्य।",
    "Any file type — Max 10 MB": "कोई भी फ़ाइल प्रकार — अधिकतम 10 MB",
    "Uploading... 0%": "अपलोड हो रहा है... 0%",
    "Search using your Roll Number or SIS ID to view your latest result.": "अपना नवीनतम परिणाम देखने के लिए रोल नंबर या SIS ID से खोजें।",
    "Submit your documents securely and track their verification status in real time.": "अपने दस्तावेज़ सुरक्षित रूप से जमा करें और उनके सत्यापन की स्थिति रीयल-टाइम में ट्रैक करें।",
    "Filter by class and subject, search by keyword, and download papers instantly.": "कक्षा और विषय के अनुसार फ़िल्टर करें, कीवर्ड से खोजें और तुरंत पेपर डाउनलोड करें।",
    "Filter by class and category, search by title, and download instantly.": "कक्षा और श्रेणी के अनुसार फ़िल्टर करें, शीर्षक से खोजें और तुरंत डाउनलोड करें।",
    "Schedule a meeting with school staff at a time that works for you.": "विद्यालय स्टाफ के साथ अपनी सुविधा के अनुसार बैठक निर्धारित करें।",
    "Event photos, videos, and broadcasts, categorized by event.": "कार्यक्रम की तस्वीरें, वीडियो और प्रसारण, कार्यक्रम के अनुसार वर्गीकृत।",
    "News, circulars, press releases, and e-newsletters from the school.": "विद्यालय से समाचार, परिपत्र, प्रेस विज्ञप्ति और ई-न्यूज़लेटर।",
    "Annual Function, Sports Events, Science Fair, Achievements, and the Principal's Message.": "वार्षिक समारोह, खेल आयोजन, विज्ञान मेला, उपलब्धियाँ और प्रधानाचार्य का संदेश।",
    "Link your account to your child's so you can see their real results and documents.": "अपने खाते को बच्चे के खाते से लिंक करें ताकि आप उनके वास्तविक परिणाम और दस्तावेज़ देख सकें।",

    "Document Submitted": "दस्तावेज़ जमा किया गया",
    "Your document is received by the school office.": "आपका दस्तावेज़ विद्यालय कार्यालय में प्राप्त हो गया है।",
    "Under Review": "समीक्षा अधीन",
    "Administration staff cross-check the submitted document.": "प्रशासनिक कर्मचारी जमा किए गए दस्तावेज़ की जाँच करते हैं।",
    "Verification In Progress": "सत्यापन प्रगति पर",
    "A teacher reviews the document against official records.": "एक शिक्षक आधिकारिक रिकॉर्ड के विरुद्ध दस्तावेज़ की समीक्षा करता है।",
    "Verified / Rejected": "सत्यापित / अस्वीकृत",
    "The teacher's decision is updated here and on your dashboard.": "शिक्षक का निर्णय यहाँ और आपके डैशबोर्ड पर अपडेट किया जाता है।",

    "Checking your login...": "आपका लॉगिन जांचा जा रहा है...",
    "Reference ID": "संदर्भ आईडी",
    "Please enter a valid roll number.": "कृपया एक मान्य रोल नंबर दर्ज करें।",
    "Please enter a valid SIS ID.": "कृपया एक मान्य SIS ID दर्ज करें।",
    "Please select a class.": "कृपया एक कक्षा चुनें।",
    "Please select a document type.": "कृपया एक दस्तावेज़ प्रकार चुनें।",

    "Skip to main content": "मुख्य सामग्री पर जाएँ",
    "Close menu": "मेनू बंद करें",
    "Open menu": "मेनू खोलें",
    "Back to top": "ऊपर जाएँ",
    "All Rights Reserved.": "सर्वाधिकार सुरक्षित।",
    "An official ERP Portal committed to transparency and academic excellence.": "पारदर्शिता और शैक्षणिक उत्कृष्टता के लिए प्रतिबद्ध एक आधिकारिक ERP पोर्टल।",

    "Parent": "अभिभावक",
    "Student": "छात्र",
    "Staff": "स्टाफ"
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
    if (!isTranslationAllowed()) {
      currentLang = 'en';
      document.documentElement.setAttribute('lang', 'en');
      var tb = document.getElementById('langToggleBtn');
      if (tb) tb.style.display = 'none';
      return;
    }

    currentLang = (lang === 'hi') ? 'hi' : 'en';
    document.documentElement.setAttribute('lang', currentLang);

    if (observer) observer.disconnect();
    translateElementText(document.body, currentLang);
    if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) {}

    var toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) {
      toggleBtn.style.display = '';
      toggleBtn.textContent = currentLang === 'hi' ? 'EN' : 'हिं';
    }
  }

  function getSavedLanguage() {
    try { return localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) { return 'en'; }
  }

  function injectToggle() {
    if (!isTranslationAllowed()) return;

    var host = document.querySelector('.header-actions') || document.querySelector('.header-container');
    if (!host) return;
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
    // Homepage / non-utility → do nothing at all
    if (!isTranslationAllowed()) {
      document.documentElement.setAttribute('lang', 'en');
      return;
    }

    injectToggle();

    observer = new MutationObserver(function (mutations) {
      observer.disconnect();
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) translateElementText(n, currentLang);
          else if (n.nodeType === 3 && n.parentElement) translateElementText(n.parentElement, currentLang);
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
