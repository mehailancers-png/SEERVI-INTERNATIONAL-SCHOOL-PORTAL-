/* =========================================================
   I18N.JS — Hindi / English language switcher
   Seervi International School — SIS ERP Portal
   Manually-defined translations (no auto-translate API).
   Targets shared attributes/IDs/classes that already exist
   across every page (data-nav, data-panel, logoutBtn, footer
   headings) so it works everywhere without editing each
   page's markup individually.
   ========================================================= */

(function () {

  var STORAGE_KEY = 'sis_lang';

  var DICT = {
    // Sidebar nav (data-nav)
    'nav.home':        { en: 'Home', hi: 'होम' },
    'nav.results':      { en: 'Results', hi: 'परिणाम' },
    'nav.documents':    { en: 'Documents', hi: 'दस्तावेज़' },
    'nav.pyq':          { en: 'PYQs', hi: 'पुराने प्रश्नपत्र' },
    'nav.resources':    { en: 'Resource Centre', hi: 'संसाधन केंद्र' },
    'nav.news':         { en: 'School News', hi: 'विद्यालय समाचार' },
    'nav.blog':         { en: 'School Blog', hi: 'विद्यालय ब्लॉग' },
    'nav.media':        { en: 'Media Centre', hi: 'मीडिया केंद्र' },
    'nav.appointment':  { en: 'Appointment', hi: 'नियुक्ति' },
    'nav.student':      { en: 'Student Portal', hi: 'छात्र पोर्टल' },
    'nav.parent':       { en: 'Parent Portal', hi: 'अभिभावक पोर्टल' },
    'nav.staff':        { en: 'Staff Portal', hi: 'स्टाफ पोर्टल' },

    // Dashboard panels (data-panel) — student/parent/staff
    'panel.results':          { en: '📊 Results', hi: '📊 परिणाम' },
    'panel.attendance':        { en: '🗓️ Attendance', hi: '🗓️ उपस्थिति' },
    'panel.homework':          { en: '📚 Homework', hi: '📚 गृहकार्य' },
    'panel.documents':         { en: '📄 Documents', hi: '📄 दस्तावेज़' },
    'panel.profile':           { en: '👤 Profile', hi: '👤 प्रोफ़ाइल' },
    'panel.links':             { en: '🔗 Parent Requests', hi: '🔗 अभिभावक अनुरोध' },
    'panel.child':             { en: '👶 Child Details', hi: '👶 बच्चे का विवरण' },
    'panel.appointment':       { en: '📅 Appointment', hi: '📅 नियुक्ति' },
    'panel.students':          { en: '🧑‍🎓 Students', hi: '🧑‍🎓 छात्र' },
    'panel.upload-results':    { en: '📊 Upload Results', hi: '📊 परिणाम अपलोड करें' },
    'panel.upload-attendance': { en: '🗓️ Upload Attendance', hi: '🗓️ उपस्थिति अपलोड करें' },
    'panel.pyq-upload':        { en: '📤 Upload PYQs', hi: '📤 प्रश्नपत्र अपलोड करें' },
    'panel.resources':         { en: '📂 Resource Centre', hi: '📂 संसाधन केंद्र' },
    'panel.news':              { en: '📰 Publish News', hi: '📰 समाचार प्रकाशित करें' },
    'panel.blog':              { en: '✍️ School Blog', hi: '✍️ विद्यालय ब्लॉग' },
    'panel.media':             { en: '🖼️ Media Centre', hi: '🖼️ मीडिया केंद्र' },
    'panel.appointments':      { en: '📅 Appointments', hi: '📅 नियुक्तियाँ' },
    'panel.notify':            { en: '🔔 Send Notification', hi: '🔔 सूचना भेजें' },

    // Common buttons / labels
    'common.logout':       { en: '🚪 Log Out', hi: '🚪 लॉग आउट' },
    'common.myDashboard':  { en: 'My Dashboard', hi: 'मेरा डैशबोर्ड' },
    'common.backWebsite':  { en: '← Back to Website', hi: '← वेबसाइट पर वापस जाएं' },
    'common.quickLinks':   { en: 'Quick Links', hi: 'त्वरित लिंक' },
    'common.portals':      { en: 'Portals', hi: 'पोर्टल' },
    'common.contact':      { en: 'Contact', hi: 'संपर्क' },
    'common.quickServices':{ en: 'Quick Services', hi: 'त्वरित सेवाएं' }
  };

  function getSavedLanguage() {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  }

  function applyLanguage(lang) {
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');

    // Sidebar nav links, translated by their stable data-nav key,
    // preserving the icon <span> that sits inside each link.
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      var key = 'nav.' + el.getAttribute('data-nav');
      var entry = DICT[key];
      if (!entry) return;
      setLabelPreservingIcon(el, entry[lang] || entry.en);
    });

    // Dashboard panel nav buttons, translated by data-panel.
    document.querySelectorAll('.dashboard-nav-link[data-panel]').forEach(function (el) {
      var key = 'panel.' + el.getAttribute('data-panel');
      var entry = DICT[key];
      if (!entry) return;
      el.textContent = entry[lang] || entry.en;
    });

    // Logout buttons (id="logoutBtn" on every dashboard)
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.textContent = (DICT['common.logout'][lang] || DICT['common.logout'].en);

    // "My Dashboard" quick links on gated pages
    document.querySelectorAll('#authStatusDashboardLink').forEach(function (el) {
      el.textContent = DICT['common.myDashboard'][lang] || DICT['common.myDashboard'].en;
    });

    // Footer column headings (stable text across every page)
    document.querySelectorAll('.footer-col h4').forEach(function (el) {
      var t = el.textContent.trim();
      if (t === 'Quick Links' || t === 'त्वरित लिंक') el.textContent = DICT['common.quickLinks'][lang];
      else if (t === 'Portals' || t === 'पोर्टल') el.textContent = DICT['common.portals'][lang];
      else if (t === 'Contact' || t === 'संपर्क') el.textContent = DICT['common.contact'][lang];
    });

    // Sidebar "Quick Services" label
    document.querySelectorAll('.sidebar-section-label').forEach(function (el) {
      el.textContent = DICT['common.quickServices'][lang];
    });

    localStorage.setItem(STORAGE_KEY, lang);
    var toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) toggleBtn.textContent = lang === 'hi' ? 'EN' : 'हिं';
  }

  function setLabelPreservingIcon(el, text) {
    var iconSpan = el.querySelector('.icon');
    el.textContent = '';
    if (iconSpan) el.appendChild(iconSpan);
    el.appendChild(document.createTextNode(text));
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
      // Pages without a dedicated header-actions wrapper (public pages):
      // place it right before the hamburger button.
      var hamburger = document.getElementById('hamburgerBtn');
      if (hamburger && hamburger.parentNode) {
        hamburger.parentNode.insertBefore(btn, hamburger);
      } else {
        host.appendChild(btn);
      }
    }

    btn.addEventListener('click', function () {
      var current = getSavedLanguage();
      applyLanguage(current === 'hi' ? 'en' : 'hi');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectToggle();
    applyLanguage(getSavedLanguage());
  });

})();
