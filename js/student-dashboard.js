/* =========================================================
   STUDENT-DASHBOARD.JS
   Seervi International School — SIS ERP Portal
   ========================================================= */

import { requireAuth, logOut, updateProfilePhoto, respondToLinkRequest } from "./auth.js";
import { wireNotificationBell } from "./notifications.js";
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
    wireNotificationBell(user.uid);
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
       LIVE ATTENDANCE (Firestore, doc ID = student's uid)
    ----------------------------------------------------- */
    onSnapshot(doc(db, 'attendance', user.uid), function (docSnap) {
      var tbody = document.getElementById('attendanceTableBody');

      if (!docSnap.exists()) {
        tbody.innerHTML = '<tr><td colspan="4">Attendance records are not published yet. Please check back later.</td></tr>';
        document.getElementById('statAttendancePercent').textContent = '—';
        document.getElementById('statDaysPresent').textContent = '—';
        document.getElementById('statDaysTotal').textContent = '—';
        return;
      }

      var data = docSnap.data();
      var months = (data.months || []).filter(function (m) { return (m.present + m.absent) > 0; });
      var totalPresent = months.reduce(function (sum, m) { return sum + (m.present || 0); }, 0);
      var totalDays = months.reduce(function (sum, m) { return sum + (m.present || 0) + (m.absent || 0); }, 0);
      var overallPct = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : '0';

      document.getElementById('statAttendancePercent').textContent = overallPct + '%';
      document.getElementById('statDaysPresent').textContent = totalPresent;
      document.getElementById('statDaysTotal').textContent = totalDays;

      if (months.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Attendance records are not published yet. Please check back later.</td></tr>';
        return;
      }

      tbody.innerHTML = months.map(function (m) {
        var monthTotal = (m.present || 0) + (m.absent || 0);
        var monthPct = monthTotal > 0 ? (((m.present || 0) / monthTotal) * 100).toFixed(1) : '0';
        return '<tr><td>' + escapeHtml(m.name) + '</td><td>' + m.present + '</td><td>' + m.absent + '</td><td>' + monthPct + '%</td></tr>';
      }).join('');
    }, function (err) { console.error('Attendance listener error:', err); });

    /* -----------------------------------------------------
       PARENT LINK REQUESTS
    ----------------------------------------------------- */
    var linkQuery = query(collection(db, 'linkRequests'), where('studentUid', '==', user.uid));
    var linkBadge = document.getElementById('linkRequestBadge');

    onSnapshot(linkQuery, function (snapshot) {
      var pending = [];
      var accepted = [];
      snapshot.forEach(function (docSnap) {
        var data = docSnap.data();
        data.id = docSnap.id;
        if (data.status === 'pending') pending.push(data);
        else if (data.status === 'accepted') accepted.push(data);
      });

      if (pending.length > 0) {
        linkBadge.textContent = pending.length;
        linkBadge.hidden = false;
      } else {
        linkBadge.hidden = true;
      }

      var pendingList = document.getElementById('linkRequestsList');
      if (pending.length === 0) {
        pendingList.innerHTML = '<p class="list-empty-state">No pending requests.</p>';
      } else {
        pendingList.innerHTML = pending.map(function (r) {
          return (
            '<div class="notice-item">' +
              '<span class="notice-item-icon">🔗</span>' +
              '<div style="flex:1;"><h4>' + escapeHtml(r.parentName || 'A parent') + ' wants to link as your parent</h4>' +
              '<p>They will be able to see your results and documents once accepted.</p></div>' +
              '<div class="btn-group">' +
                '<button class="btn btn-success btn-sm" data-link-action="accept" data-id="' + r.id + '">✓ Accept</button>' +
                '<button class="btn btn-danger btn-sm" data-link-action="reject" data-id="' + r.id + '">✕ Reject</button>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        pendingList.querySelectorAll('[data-link-action]').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            btn.disabled = true;
            try {
              await respondToLinkRequest(btn.getAttribute('data-id'), btn.getAttribute('data-link-action') === 'accept');
            } catch (err) {
              alert('Could not respond: ' + err.message);
              btn.disabled = false;
            }
          });
        });
      }

      var linkedList = document.getElementById('linkedParentsList');
      linkedList.innerHTML = accepted.length === 0
        ? '<p class="list-empty-state">No parent linked yet.</p>'
        : accepted.map(function (r) {
            return '<div class="notice-item"><span class="notice-item-icon">👪</span><div><h4>' + escapeHtml(r.parentName || 'Parent') + '</h4><p>Linked and can view your results and documents.</p></div></div>';
          }).join('');
    }, function (err) { console.error('Link requests listener error:', err); });

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
