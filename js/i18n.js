/* =========================================================
   I18N.JS — Hindi / English language switcher
   Seervi International School — SIS ERP Portal

   ROOT-CAUSE FIX (v2): the previous version only translated a
   handful of hardcoded selectors (sidebar nav, logout button,
   footer) exactly once at page load. Nearly everything else on
   every page — headings, buttons, form labels, and almost all
   dashboard/list content — is rendered LATER by JavaScript
   after Firestore data arrives, so it never got touched.

   This version fixes that at the root: it walks the entire
   page's text and translates any phrase that matches the
   dictionary (as a substring, so it also catches phrases
   embedded in dynamically-built strings like "Uploaded 12 Jul
   2026"), and a MutationObserver re-runs the same pass on any
   content added to the page afterward — so new list items,
   dashboard panels, modals, and Firestore-driven content all
   get translated automatically, with zero changes needed in
   any of the page-specific JS files.

   Data safety: SIS IDs, file names, emails, and people's names
   are never touched, because they simply never match any
   dictionary phrase. <select>/<option> content is deliberately
   skipped, because option text doubles as the value read by
   the rest of the app (e.g. a feedback category) — translating
   it would corrupt data sent to Firestore.
   ========================================================= */

(function () {

  var STORAGE_KEY = 'sis_lang';

  /* -----------------------------------------------------
     PHRASE DICTIONARY (English -> Hindi)
     Flat, single source of truth. Add more entries any time —
     no other code needs to change for a new phrase to start
     translating everywhere it appears.
  ----------------------------------------------------- */
  var PHRASES = {
    // Sidebar / top nav
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
    "Home page": "मुख्य पृष्ठ",

    // Auth / login
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

    // Dashboard nav labels
    "Attendance": "उपस्थिति",
    "Homework": "गृहकार्य",
    "Profile": "प्रोफ़ाइल",
    "Parent Requests": "अभिभावक अनुरोध",
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

    // Headings
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
    "Resource Centre": "संसाधन केंद्र",
    "All Students": "सभी छात्र",
    "Filter Students": "छात्र फ़िल्टर करें",
    "Child's Documents": "बच्चे के दस्तावेज़",
    "Child's Attendance": "बच्चे की उपस्थिति",
    "Child's Homework": "बच्चे का गृहकार्य",
    "Child's Results": "बच्चे के परिणाम",
    "Link a Child": "बच्चे को लिंक करें",
    "Link Status": "लिंक स्थिति",

    // Buttons / actions
    "Search Result": "परिणाम खोजें",
    "Search": "खोजें",
    "Submit": "जमा करें",
    "Submit Ticket": "टिकट जमा करें",
    "Download": "डाउनलोड करें",
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

    // Form labels
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

    // Status words
    "Pending": "लंबित",
    "Verified": "सत्यापित",
    "Rejected": "अस्वीकृत",
    "Approved": "स्वीकृत",
    "Open": "खुला",
    "In Progress": "प्रगति पर",
    "Resolved": "हल हो गया",
    "Pass": "उत्तीर्ण",
    "Fail": "अनुत्तीर्ण",
    "Overall Percentage": "समग्र प्रतिशत",
    "Result Status": "परिणाम स्थिति",
    "Total": "कुल",
    "Percentage": "प्रतिशत",

    // Common messages / empty states
    "Loading...": "लोड हो रहा है...",
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

    // Notices / assurances
    "Checking your login...": "आपका लॉगिन जांचा जा रहा है...",
    "Reference ID": "संदर्भ आईडी"
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

    // Attributes that hold visible text too (placeholders, aria-labels, titles)
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

    // Set up the observer BEFORE the first translation pass so
    // any content that streams in later (Firestore listeners,
    // dashboard panel switches, modals) is caught automatically —
    // this is the actual fix for "only the sidebar translates".
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
