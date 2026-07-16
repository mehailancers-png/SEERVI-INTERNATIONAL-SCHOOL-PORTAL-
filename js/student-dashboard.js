/* =========================================================
   STUDENT-DASHBOARD.JS
   Seervi International School — SIS ERP Portal
   ========================================================= */

import { requireAuth, logOut } from "./auth.js";
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var mainContent = document.getElementById('main-content');

  requireAuth(['student'], 'student-login.html', function (user, profile) {
    authGuard.hidden = true;
    mainContent.hidden = false;
    initDashboard(user, profile);
  });

  function initDashboard(user, profile) {
    /* -----------------------------------------------------
       NAV PROFILE SNIPPET
    ----------------------------------------------------- */
    document.getElementById('navName').textContent = profile.name || 'Student';
    document.getElementById('navAvatar').textContent = (profile.name || 'S').charAt(0).toUpperCase();

    /* -----------------------------------------------------
       PROFILE PANEL
    ----------------------------------------------------- */
    document.getElementById('profileName').textContent = profile.name || '—';
    document.getElementById('profileEmail').textContent = profile.email || '—';
    document.getElementById('profileStudentId').textContent = 'SIS Student ID: ' + (profile.studentId || '—');
    document.getElementById('profileClass').textContent = 'Class: ' + (profile.class || '—');

    /* -----------------------------------------------------
       PANEL SWITCHING
    ----------------------------------------------------- */
    var navLinks = document.querySelectorAll('.dashboard-nav-link[data-panel]');
    var panels = document.querySelectorAll('.dashboard-panel[data-panel]');

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        var target = link.getAttribute('data-panel');

        navLinks.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');

        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === target);
        });
      });
    });

    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */
    document.getElementById('logoutBtn').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'student-login.html';
    });

    /* -----------------------------------------------------
       LIVE DOCUMENTS LIST (Firestore)
    ----------------------------------------------------- */
    var documentsList = document.getElementById('dashboardDocumentsList');
    var docsQuery = query(
      collection(db, 'documents'),
      where('studentUid', '==', user.uid),
      orderBy('uploadedAt', 'desc')
    );

    onSnapshot(docsQuery, function (snapshot) {
      if (snapshot.empty) {
        documentsList.innerHTML = '<p class="documents-empty-state">You haven\'t uploaded any documents yet. <a href="documents.html">Upload one →</a></p>';
        return;
      }

      var html = '';
      snapshot.forEach(function (docSnap) {
        var d = docSnap.data();
        var dateStr = d.uploadedAt && d.uploadedAt.toDate
          ? d.uploadedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Just now';

        html +=
          '<article class="document-item">' +
            '<div class="document-item-main">' +
              '<span class="document-item-icon">📄</span>' +
              '<div>' +
                '<h4>' + escapeHtml(d.docType || 'Document') + '</h4>' +
                '<p>Uploaded on ' + dateStr + ' • ' + escapeHtml(d.fileName || '') + '</p>' +
              '</div>' +
            '</div>' +
            '<span class="doc-status-badge ' + (d.status || 'pending') + '">' + capitalize(d.status || 'pending') + '</span>' +
          '</article>';
      });

      documentsList.innerHTML = html;
    }, function (err) {
      documentsList.innerHTML = '<p class="documents-empty-state">Could not load documents right now. Please try again later.</p>';
      console.error('Documents listener error:', err);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

});
