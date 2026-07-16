/* =========================================================
   PARENT-PORTAL.JS
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

  requireAuth(['parent'], 'student-login.html', function (user, profile) {
    authGuard.hidden = true;
    mainContent.hidden = false;
    initPortal(user, profile);
  });

  function initPortal(user, profile) {
    document.getElementById('navName').textContent = profile.name || 'Parent';
    document.getElementById('navAvatar').textContent = (profile.name || 'P').charAt(0).toUpperCase();
    document.getElementById('childStudentId').textContent = "Child's SIS Student ID: " + (profile.childStudentId || '—');
    document.getElementById('resultsChildIdHint').textContent = profile.childStudentId || '—';

    /* Panel switching */
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

    document.getElementById('logoutBtn').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'student-login.html';
    });

    /* Live documents list (documents this parent uploaded) */
    var documentsList = document.getElementById('dashboardDocumentsList');
    var docsQuery = query(
      collection(db, 'documents'),
      where('studentUid', '==', user.uid),
      orderBy('uploadedAt', 'desc')
    );

    onSnapshot(docsQuery, function (snapshot) {
      if (snapshot.empty) {
        documentsList.innerHTML = '<p class="documents-empty-state">No documents uploaded yet. <a href="documents.html">Upload one →</a></p>';
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
              '<div><h4>' + escapeHtml(d.docType || 'Document') + '</h4>' +
              '<p>Uploaded on ' + dateStr + '</p></div>' +
            '</div>' +
            '<span class="doc-status-badge ' + (d.status || 'pending') + '">' + capitalize(d.status || 'pending') + '</span>' +
          '</article>';
      });
      documentsList.innerHTML = html;
    }, function (err) { console.error(err); });

    /* Live appointments list */
    var appointmentsList = document.getElementById('appointmentsList');
    var apptQuery = query(
      collection(db, 'appointments'),
      where('parentUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    onSnapshot(apptQuery, function (snapshot) {
      if (snapshot.empty) {
        appointmentsList.innerHTML = '<p class="list-empty-state">No appointment requests yet.</p>';
        return;
      }
      var html = '';
      snapshot.forEach(function (docSnap) {
        var a = docSnap.data();
        html +=
          '<div class="notice-item">' +
            '<span class="notice-item-icon">📅</span>' +
            '<div><h4>' + escapeHtml(a.purpose || 'Appointment') + ' — ' + escapeHtml(a.childName || '') + '</h4>' +
            '<p>Preferred: ' + escapeHtml(a.preferredDate || '—') + ' &nbsp;•&nbsp; Status: ' + capitalize(a.status || 'pending') + '</p></div>' +
          '</div>';
      });
      appointmentsList.innerHTML = html;
    }, function (err) { console.error(err); });
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
