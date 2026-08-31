/* =========================================================
   I18N.JS — Hindi / English language switcher (v6)
   Seervi International School — SIS ERP Portal

   SCOPE (strict):
   - UTILITY pages → full Hindi/English for forms, labels, messages
   - COSMETIC / PRESENTATION pages → English only for main content
     (Index, Blog, News, Media, Resources, and similar)
   - Shared chrome only on cosmetic pages: sidebar, header actions,
     auth status bar, language toggle, logout/dashboard buttons

   Index page is NEVER fully translated.

   Architecture:
   - Phrase dictionary + MutationObserver for dynamic content
   - Skips <script>, <style>, <select>, <option>
   - Exact full-string match first, then longest phrase
   ========================================================= */

(function () {

  var STORAGE_KEY = 'sis_lang';

  var PHRASES = {

    /* ===== Exact page-banner sentences (prevent mixed EN/HI) ===== */
    "Check Your Results": "अपने परिणाम देखें",
    "Search using your Roll Number or SIS ID to view your latest result.": "अपना रोल नंबर या SIS आईडी डालकर अपना नवीनतम परिणाम देखें।",
    "Academic Records": "शैक्षणिक रिकॉर्ड",
    "Previous Year Question Papers": "पिछले वर्षों के प्रश्नपत्र",
    "Exam Preparation": "परीक्षा तैयारी",
    "Filter by class and subject, search by keyword, and download papers instantly.": "कक्षा और विषय के अनुसार फ़िल्टर करें, कीवर्ड से खोजें, और प्रश्नपत्र तुरंत डाउनलोड करें।",
    "Moments From Our School": "हमारे विद्यालय के क्षण",
    "Media Centre": "मीडिया केंद्र",
    "Event photos, videos, and broadcasts, categorized by event.": "कार्यक्रम की तस्वीरें, वीडियो और प्रसारण, कार्यक्रम के अनुसार वर्गीकृत।",
    "Event": "कार्यक्रम",
    "All Events": "सभी कार्यक्रम",
    "Upload & Track Documents": "दस्तावेज़ अपलोड और ट्रैक करें",
    "Document Center": "दस्तावेज़ केंद्र",
    "Submit your documents securely and track their verification status in real time.": "अपने दस्तावेज़ सुरक्षित रूप से जमा करें और उनकी सत्यापन स्थिति वास्तविक समय में ट्रैक करें।",
    "Select Class": "कक्षा चुनें",
    "Select Document Type": "दस्तावेज़ प्रकार चुनें",
    "All Classes": "सभी कक्षाएं",
    "All Subjects": "सभी विषय",
    "Search by keyword...": "कीवर्ड से खोजें...",
    "No papers found.": "कोई प्रश्नपत्र नहीं मिला।",
    "Download Paper": "प्रश्नपत्र डाउनलोड करें",
    "Filter": "फ़िल्टर",
    "Clear Filters": "फ़िल्टर साफ़ करें",

    /* ===== Shared navigation ===== */
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
    "Quick Service": "त्वरित सेवा",
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
    "Section (Optional)": "सेक्शन (वैकल्पिक)",
    "I am a Student": "मैं एक छात्र हूं",
    "I am a Parent": "मैं एक अभिभावक हूं",
    "Create Account": "खाता बनाएं",
    "Continue with Google": "Google से जारी रखें",
    "My Dashboard": "मेरा डैशबोर्ड",
    "Logged in as": "लॉग इन किया गया",
    "Staff Email": "स्टाफ ईमेल",
    "Staff Access Code": "स्टाफ एक्सेस कोड",
    "Staff Log In": "स्टाफ लॉग इन",
    "Staff Login": "स्टाफ लॉगिन",
    "Student Login": "छात्र लॉगिन",
    "Parent Login": "अभिभावक लॉगिन",
    "Student & Parent Login": "छात्र और अभिभावक लॉगिन",
    "Checking your login...": "आपका लॉगिन जांचा जा रहा है...",
    "Access your results, documents, PYQs, and appointments.": "अपने परिणाम, दस्तावेज़, प्रश्नपत्र और नियुक्तियाँ देखें।",
    "Restricted access for teachers and administrators only.": "केवल शिक्षकों और प्रशासकों के लिए सीमित पहुंच।",
    "Staff accounts are never self-registered. If you're a teacher or admin without access yet, contact the school office to have your account activated and receive your Staff Access Code.": "स्टाफ खाते स्वयं पंजीकृत नहीं होते। यदि आप शिक्षक या व्यवस्थापक हैं और अभी पहुंच नहीं है, तो स्कूल कार्यालय से संपर्क करें ताकि आपका खाता सक्रिय हो और आपको स्टाफ एक्सेस कोड मिल सके।",
    "Not staff?": "स्टाफ नहीं हैं?",
    "Student / Parent Login →": "छात्र / अभिभावक लॉगिन →",
    "or": "या",
    "Please enter a valid email.": "कृपया एक वैध ईमेल दर्ज करें।",
    "Please enter a valid email address.": "कृपया एक वैध ईमेल पता दर्ज करें।",
    "Password must be at least 6 characters.": "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।",
    "Please enter your name.": "कृपया अपना नाम दर्ज करें।",
    "Please enter your SIS Student ID.": "कृपया अपनी SIS छात्र आईडी दर्ज करें।",
    "Please enter your roll number.": "कृपया अपना रोल नंबर दर्ज करें।",
    "Please select your class.": "कृपया अपनी कक्षा चुनें।",
    "Please enter your child's SIS Student ID.": "कृपया अपने बच्चे की SIS छात्र आईडी दर्ज करें।",
    "Please enter your Staff Access Code.": "कृपया अपना स्टाफ एक्सेस कोड दर्ज करें।",
    "Incorrect email or password.": "ईमेल या पासवर्ड गलत है।",
    "Too many attempts. Please wait a moment and try again.": "बहुत अधिक प्रयास। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
    "Email/Password sign-in is not enabled yet. Please contact the school office.": "ईमेल/पासवर्ड साइन-इन अभी सक्षम नहीं है। कृपया स्कूल कार्यालय से संपर्क करें।",
    "Network error. Check your internet connection.": "नेटवर्क त्रुटि। अपना इंटरनेट कनेक्शन जांचें।",
    "Something went wrong. Please try again.": "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    "Account found but profile is missing. Please contact the school office.": "खाता मिला लेकिन प्रोफ़ाइल नहीं मिली। कृपया स्कूल कार्यालय से संपर्क करें।",
    "This account is not registered as staff. Please contact the school office if this is unexpected.": "यह खाता स्टाफ के रूप में पंजीकृत नहीं है। यदि यह अप्रत्याशित है तो स्कूल कार्यालय से संपर्क करें।",
    "Welcome back! Redirecting to your dashboard...": "वापसी पर स्वागत है! आपके डैशबोर्ड पर भेजा जा रहा है...",
    "Please enter your Staff Access Code above before continuing with Google.": "Google से जारी रखने से पहले ऊपर अपना स्टाफ एक्सेस कोड दर्ज करें।",
    "This Google account is not registered as staff yet. Sign up as a student/parent first, then contact the school office to have your account promoted to staff.": "यह Google खाता अभी स्टाफ के रूप में पंजीकृत नहीं है। पहले छात्र/अभिभावक के रूप में साइन अप करें, फिर स्कूल कार्यालय से संपर्क करके खाते को स्टाफ बनाएं।",
    "Invalid Staff Access Code. Please check with the school office.": "अमान्य स्टाफ एक्सेस कोड। कृपया स्कूल कार्यालय से जांच करें।",
    "Please enter a valid email and password.": "कृपया वैध ईमेल और पासवर्ड दर्ज करें।",
    "Verifying...": "सत्यापित हो रहा है...",

    /* ===== Dashboard navigation ===== */
    "Attendance": "उपस्थिति",
    "Homework": "गृहकार्य",
    "Profile": "प्रोफ़ाइल",
    "Parent Requests": "अभिभावक अनुरोध",
    "Parent Link Requests": "अभिभावक लिंक अनुरोध",
    "Child Details": "बच्चे का विवरण",
    "Students": "छात्र",
    "Subjects": "विषय",
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

    /* ===== Main headings ===== */
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
    "Student Dashboard": "छात्र डैशबोर्ड",
    "Academic Records": "शैक्षणिक रिकॉर्ड",
    "Document Center": "दस्तावेज़ केंद्र",

    /* ===== Buttons & actions ===== */
    "Search Result": "परिणाम खोजें",
    "Search": "खोजें",
    "Submit": "जमा करें",
    "Submit Ticket": "टिकट जमा करें",
    "Download": "डाउनलोड करें",
    "Download Result": "परिणाम डाउनलोड करें",
    "Download attachment": "अटैचमेंट डाउनलोड करें",
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
    "Upload one →": "एक अपलोड करें →",
    "Click to Add Photo": "फोटो जोड़ने के लिए क्लिक करें",
    "Click to upload": "अपलोड करने के लिए क्लिक करें",
    "or drag and drop": "या खींचकर छोड़ें",
    "✓ Accept": "✓ स्वीकार करें",
    "✓ Verify": "✓ सत्यापित करें",
    "✕ Reject": "✕ अस्वीकार करें",

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
    "No Section": "कोई सेक्शन नहीं",

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
    "Status": "स्थिति",

    /* ===== Empty states & short messages ===== */
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
    "No pending requests.": "कोई लंबित अनुरोध नहीं है।",
    "Uploaded": "अपलोड किया गया",
    "Reviewed by": "समीक्षक",
    "Due": "नियत तारीख",
    "Reason": "कारण",
    "Recipients": "प्राप्तकर्ता",
    "Reference ID": "संदर्भ आईडी",
    "Just now": "अभी अभी",
    "Recently Sent": "हाल ही में भेजा गया",

    /* ===== Longer instructional / dynamic sentences ===== */
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
    "You haven't uploaded any documents yet.": "आपने अभी तक कोई दस्तावेज़ अपलोड नहीं किया है।",
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
    "No results published yet. Check back later or use the public": "अभी तक कोई परिणाम प्रकाशित नहीं हुआ है। बाद में देखें या सार्वजनिक",
    "Results page": "परिणाम पृष्ठ",
    "Please enter a valid roll number.": "कृपया एक वैध रोल नंबर दर्ज करें।",
    "Please enter a valid SIS ID.": "कृपया एक वैध SIS आईडी दर्ज करें।",
    "Please select a class.": "कृपया कक्षा चुनें।",
    "Please select a document type.": "कृपया दस्तावेज़ का प्रकार चुनें।",
    "Please enter a roll number.": "कृपया रोल नंबर दर्ज करें।",
    "Please enter a SIS ID.": "कृपया SIS आईडी दर्ज करें।",
    "Student Name": "छात्र का नाम",
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
    "Switch language / भाषा बदलें": "भाषा बदलें / Switch language",
    "Linked and can view your results and documents.": "लिंक हो चुका है और आपके परिणाम व दस्तावेज़ देख सकता है।",
    "They will be able to see your results and documents once accepted.": "स्वीकार होने के बाद वे आपके परिणाम और दस्तावेज़ देख सकेंगे।",
    "wants to link as your parent": "आपके अभिभावक के रूप में लिंक करना चाहता है",
    "No student found with that SIS Student ID. Please check and try again.": "उस SIS छात्र आईडी से कोई छात्र नहीं मिला। कृपया जांचें और पुनः प्रयास करें।",
    "Could not update photo:": "फोटो अपडेट नहीं हो सकी:",
    "Could not respond:": "जवाब नहीं दिया जा सका:",
    "Could not update:": "अपडेट नहीं हो सका:",
    "Could not search right now:": "अभी खोज नहीं हो सकी:",
    "Upload failed:": "अपलोड विफल:",
    "Could not load documents right now. Please try again later.": "अभी दस्तावेज़ लोड नहीं हो सके। कृपया बाद में पुनः प्रयास करें।",
    "Homework isn't available for this link yet — ask your child to re-accept the link request to enable it.": "इस लिंक के लिए गृहकार्य अभी उपलब्ध नहीं है — इसे सक्षम करने के लिए बच्चे से लिंक अनुरोध दोबारा स्वीकार करने को कहें।",
    "A rejection reason is required.": "अस्वीकृति का कारण आवश्यक है।",
    "Please enter a reason for rejecting this document (shown to the student/parent):": "इस दस्तावेज़ को अस्वीकार करने का कारण दर्ज करें (छात्र/अभिभावक को दिखाया जाएगा):",
    "Document Verified": "दस्तावेज़ सत्यापित",
    "Document Rejected": "दस्तावेज़ अस्वीकृत",
    "has been verified.": "सत्यापित कर दिया गया है।",
    "Your document": "आपका दस्तावेज़",
    "No result found for": "के लिए कोई परिणाम नहीं मिला",
    "The result may not have been published yet, or the ID may be incorrect.": "परिणाम अभी प्रकाशित नहीं हुआ होगा, या आईडी गलत हो सकती है।",
    "A result was found for this ID, but under": "इस आईडी के लिए परिणाम मिला, लेकिन",
    "instead of": "के बजाय",
    "Staff Preview Mode": "स्टाफ पूर्वावलोकन मोड",
    "you are viewing the Parent Portal as staff, under your own account.": "आप स्टाफ के रूप में अभिभावक पोर्टल देख रहे हैं, अपने खाते के अंतर्गत।",
    "you are viewing the Student Dashboard as staff, under your own account.": "आप स्टाफ के रूप में छात्र डैशबोर्ड देख रहे हैं, अपने खाते के अंतर्गत।",
    "Linking a child and photo upload are disabled here to avoid affecting any real account.": "किसी वास्तविक खाते को प्रभावित न करने के लिए यहाँ बच्चे को लिंक करना और फोटो अपलोड अक्षम है।",
    "This does not show any real student's private data, and photo upload is disabled here.": "यह किसी वास्तविक छात्र का निजी डेटा नहीं दिखाता, और यहाँ फोटो अपलोड अक्षम है।",
    "Upload helper not loaded. Make sure js/cloudinary-upload.js is included on this page.": "अपलोड हेल्पर लोड नहीं हुआ। सुनिश्चित करें कि js/cloudinary-upload.js इस पृष्ठ पर शामिल है।",
    "Public sign up only allows student or parent accounts.": "सार्वजनिक साइन अप केवल छात्र या अभिभावक खातों की अनुमति देता है।",
    "An official ERP Portal committed to transparency and academic excellence.": "पारदर्शिता और शैक्षणिक उत्कृष्टता के लिए प्रतिबद्ध आधिकारिक ERP पोर्टल।",
    "All Rights Reserved.": "सर्वाधिकार सुरक्षित।",
    "Profile photo": "प्रोफ़ाइल फोटो",
    "Click to change your photo": "अपनी फोटो बदलने के लिए क्लिक करें",
    "Reply on Ticket": "टिकट पर जवाब",
    "It is now pending review.": "अब यह समीक्षा के लिए लंबित है।",
    "uploaded a": "ने अपलोड किया"
  };

  var REVERSE_PHRASES = {};
  Object.keys(PHRASES).forEach(function (k) { REVERSE_PHRASES[PHRASES[k]] = k; });

  var EN_KEYS_SORTED = Object.keys(PHRASES).sort(function (a, b) { return b.length - a.length; });
  var HI_KEYS_SORTED = Object.keys(REVERSE_PHRASES).sort(function (a, b) { return b.length - a.length; });


  function translateText(text, toLang) {
    var dict = toLang === 'hi' ? PHRASES : REVERSE_PHRASES;
    var keys = toLang === 'hi' ? EN_KEYS_SORTED : HI_KEYS_SORTED;

    // Exact full-string match first (prevents mixed sentences)
    var trimmed = text.trim();
    if (dict[trimmed]) {
      return text.replace(trimmed, dict[trimmed]);
    }

    // Longest-phrase-first substring replace
    var result = text;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!k || result.indexOf(k) === -1) continue;
      if (k.length <= 3 && result !== k) continue;
      result = result.split(k).join(dict[k]);
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

  /* -----------------------------------------------------
     PAGE SCOPE
     Utility pages → translate full body
     Cosmetic pages (incl. index) → only shared chrome
  ----------------------------------------------------- */
  var UTILITY_PAGES = {
    'results.html': 1,
    'documents.html': 1,
    'student-login.html': 1,
    'staff-login.html': 1,
    'student-dashboard.html': 1,
    'parent-portal.html': 1,
    'staff-dashboard.html': 1,
    'principal-dashboard.html': 1,
    'appointment.html': 1,
    'appointment-6.html': 1
  };

  function currentPageName() {
    var path = (window.location.pathname || '').split('/').pop() || 'index.html';
    if (!path || path === '') return 'index.html';
    return path;
  }

  function isUtilityPage() {
    return !!UTILITY_PAGES[currentPageName()];
  }

  // Selectors for chrome that may be translated even on cosmetic pages
  var CHROME_SELECTORS = [
    '.sidebar',
    '.header-actions',
    '.auth-status-bar',
    '#langToggleBtn',
    '.notif-bell-wrapper',
    '.notif-dropdown'
  ];

  function translatePage(toLang) {
    if (isUtilityPage()) {
      translateElementText(document.body, toLang);
      return;
    }

    // Cosmetic / index: only shared chrome — never hero/banner/marketing copy
    CHROME_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        translateElementText(el, toLang);
      });
    });
  }

  var currentLang = 'en';
  var observer = null;

  function applyLanguage(lang) {
    currentLang = (lang === 'hi') ? 'hi' : 'en';
    document.documentElement.setAttribute('lang', currentLang);

    if (observer) observer.disconnect();
    translatePage(currentLang);
    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

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

  function isInsideChrome(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    while (el) {
      if (el.classList) {
        if (el.classList.contains('sidebar') ||
            el.classList.contains('header-actions') ||
            el.classList.contains('auth-status-bar') ||
            el.classList.contains('notif-bell-wrapper') ||
            el.classList.contains('notif-dropdown') ||
            el.id === 'langToggleBtn') {
          return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectToggle();

    observer = new MutationObserver(function (mutations) {
      observer.disconnect();
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (isUtilityPage()) {
            if (n.nodeType === 1) translateElementText(n, currentLang);
            else if (n.nodeType === 3 && n.parentElement) translateElementText(n.parentElement, currentLang);
          } else {
            // Cosmetic: only translate mutations inside chrome
            if (n.nodeType === 1 && isInsideChrome(n)) translateElementText(n, currentLang);
            else if (n.nodeType === 3 && n.parentElement && isInsideChrome(n.parentElement)) {
              translateElementText(n.parentElement, currentLang);
            }
          }
        });
        if (m.type === 'characterData' && m.target && m.target.parentElement) {
          if (isUtilityPage() || isInsideChrome(m.target)) {
            translateElementText(m.target.parentElement, currentLang);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });

    applyLanguage(getSavedLanguage());
  });

})();
