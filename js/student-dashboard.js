/* =========================================================
   STUDENT-DASHBOARD.JS
   Seervi International School — SIS ERP Portal
   ========================================================= */

import { requireAuth, logOut, updateProfilePhoto } from "./auth.js";
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
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
       PROFILE PHOTO
    ----------------------------------------------------- */
    var navAvatar = document.getElementById('navAvatar');
    var profilePhotoPlaceholder = document.querySelector('.profile-photo-placeholder');

    function renderAvatar(photoURL) {
      if (!photoURL) return;
      navAvatar.innerHTML = '<img src="' + photoURL + '" alt="Profile photo">';
      if (profilePhotoPlaceholder) {
        profilePhotoPlaceholder.innerHTML = '<img src="' + photoURL + '" alt="Profile photo" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
      }
    }

    if (profile.photoURL) renderAvatar(profile.photoURL);

    var avatarUploadBtn = document.getElementById('avatarUploadBtn');
    var avatarFileInput = document.getElementById('avatarFileInput');
    var profilePhotoTrigger = document.getElementById('profilePhotoTrigger');

    avatarUploadBtn.addEventListener('click', function () { avatarFileInput.click(); });
    if (profilePhotoTrigger) {
      profilePhotoTrigger.addEventListener('click', function () { avatarFileInput.click(); });
      profilePhotoTrigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avatarFileInput.click(); }
      });
    }
    avatarFileInput.addEventListener('change', async function () {
      var file = avatarFileInput.files && avatarFileInput.files[0];
      if (!file) return;
      avatarUploadBtn.textContent = '⏳';
      try {
        var url = await updateProfilePhoto(user.uid, file);
        renderAvatar(url);
      } catch (err) {
        alert('Could not update photo: ' + err.message);
      }
      avatarUploadBtn.textContent = '📷';
    });

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
       LIVE RESULTS (Firestore, doc ID = student's uid)
    ----------------------------------------------------- */
    onSnapshot(doc(db, 'results', user.uid), function (docSnap) {
      var tbody = document.getElementById('resultsTableBody');

      if (!docSnap.exists()) {
        tbody.innerHTML = '<tr><td colspan="4">No results published yet. Check back later or use the public <a href="results.html">Results page</a>.</td></tr>';
        document.getElementById('statOverallPercentage').textContent = '—';
        document.getElementById('statOverallStatus').textContent = '—';
        document.getElementById('statSubjectCount').textContent = '—';
        return;
      }

      var data = docSnap.data();
      var subjects = data.subjects || [];
      var total = subjects.reduce(function (sum, s) { return sum + (s.marks || 0); }, 0);
      var maxTotal = subjects.reduce(function (sum, s) { return sum + (s.max || 0); }, 0);
      var percentage = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : '0';
      var overallPass = subjects.every(function (s) { return s.max > 0 && (s.marks / s.max) * 100 >= 33; });

      document.getElementById('statOverallPercentage').textContent = percentage + '%';
      document.getElementById('statOverallStatus').textContent = overallPass ? 'PASS' : 'FAIL';
      document.getElementById('statSubjectCount').textContent = subjects.length;

      tbody.innerHTML = subjects.map(function (s) {
        var grade = gradeFor(s.marks, s.max);
        return '<tr><td>' + escapeHtml(s.name) + '</td><td>' + s.marks + '</td><td>' + s.max + '</td><td>' + grade + '</td></tr>';
      }).join('');
    }, function (err) { console.error('Results listener error:', err); });

    function gradeFor(marks, max) {
      var pct = (marks / max) * 100;
      if (pct >= 90) return 'A+';
      if (pct >= 75) return 'A';
      if (pct >= 60) return 'B';
      if (pct >= 45) return 'C';
      if (pct >= 33) return 'D';
      return 'E';
    }

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
