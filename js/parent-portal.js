/* =========================================================
   PARENT-PORTAL.JS
   Seervi International School — SIS ERP Portal
   ========================================================= */

import { requireAuth, logOut, updateProfilePhoto, sendLinkRequest } from "./auth.js";
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc
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

    /* -----------------------------------------------------
       LINK REQUEST FORM
    ----------------------------------------------------- */
    var linkForm = document.getElementById('linkChildForm');
    var linkMsg = document.getElementById('linkFormMessage');
    var linkSubmitBtn = document.getElementById('linkSubmitBtn');

    linkForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var studentId = document.getElementById('linkStudentId').value.trim();
      if (!studentId) return;

      linkSubmitBtn.disabled = true;
      linkSubmitBtn.querySelector('.btn-label').textContent = 'Sending...';
      linkMsg.hidden = true;

      try {
        await sendLinkRequest(user.uid, profile.name, studentId);
        linkMsg.textContent = 'Request sent! Waiting for your child to accept it.';
        linkMsg.style.color = 'var(--color-green)';
        linkMsg.hidden = false;
        linkForm.reset();
      } catch (err) {
        linkMsg.textContent = err.message;
        linkMsg.style.color = 'var(--color-red)';
        linkMsg.hidden = false;
      }

      linkSubmitBtn.disabled = false;
      linkSubmitBtn.querySelector('.btn-label').textContent = 'Send Link Request';
    });

    /* -----------------------------------------------------
       LIVE LINK STATUS + LINKED CHILD'S RESULTS
    ----------------------------------------------------- */
    var linkQuery = query(collection(db, 'linkRequests'), where('parentUid', '==', user.uid));
    var linkedStudentUid = null;

    onSnapshot(linkQuery, function (snapshot) {
      var statusList = document.getElementById('linkStatusList');
      if (snapshot.empty) {
        statusList.innerHTML = '<p class="list-empty-state">No link requests yet.</p>';
        document.getElementById('linkedResultsCard').hidden = true;
        document.getElementById('unlinkedResultsCard').hidden = false;
        return;
      }

      var acceptedLink = null;
      statusList.innerHTML = snapshot.docs.map(function (docSnap) {
        var r = docSnap.data();
        if (r.status === 'accepted') acceptedLink = r;
        var badgeClass = r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : 'gold';
        return (
          '<div class="notice-item">' +
            '<span class="notice-item-icon">🔗</span>' +
            '<div><h4>' + escapeHtml(r.studentName || 'Student') + ' (' + escapeHtml(r.studentId || '') + ')</h4>' +
            '<p><span class="status-badge ' + badgeClass + '">' + capitalize(r.status) + '</span></p></div>' +
          '</div>'
        );
      }).join('');

      if (acceptedLink) {
        linkedStudentUid = acceptedLink.studentUid;
        document.getElementById('linkedResultsCard').hidden = false;
        document.getElementById('unlinkedResultsCard').hidden = true;
        document.getElementById('linkedDocumentsCard').hidden = false;
        document.getElementById('unlinkedDocumentsCard').hidden = true;
        watchLinkedResults(linkedStudentUid);
        watchLinkedDocuments(linkedStudentUid);
      } else {
        document.getElementById('linkedResultsCard').hidden = true;
        document.getElementById('unlinkedResultsCard').hidden = false;
        document.getElementById('linkedDocumentsCard').hidden = true;
        document.getElementById('unlinkedDocumentsCard').hidden = false;
      }
    }, function (err) { console.error('Link status listener error:', err); });

    function watchLinkedResults(studentUid) {
      onSnapshot(doc(db, 'results', studentUid), function (docSnap) {
        var tbody = document.getElementById('parentResultsTableBody');
        if (!docSnap.exists()) {
          tbody.innerHTML = '<tr><td colspan="4">No results published for your child yet.</td></tr>';
          return;
        }
        var subjects = docSnap.data().subjects || [];
        tbody.innerHTML = subjects.map(function (s) {
          var pct = (s.marks / s.max) * 100;
          var grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 45 ? 'C' : pct >= 33 ? 'D' : 'E';
          return '<tr><td>' + escapeHtml(s.name) + '</td><td>' + s.marks + '</td><td>' + s.max + '</td><td>' + grade + '</td></tr>';
        }).join('');
      }, function (err) { console.error('Linked results listener error:', err); });
    }

    function watchLinkedDocuments(studentUid) {
      var docsQuery = query(
        collection(db, 'documents'),
        where('studentUid', '==', studentUid),
        orderBy('uploadedAt', 'desc')
      );
      onSnapshot(docsQuery, function (snapshot) {
        var documentsList = document.getElementById('dashboardDocumentsList');
        if (snapshot.empty) {
          documentsList.innerHTML = '<p class="documents-empty-state">Your child hasn\'t uploaded any documents yet.</p>';
          return;
        }
        documentsList.innerHTML = snapshot.docs.map(function (docSnap) {
          var d = docSnap.data();
          var dateStr = d.uploadedAt && d.uploadedAt.toDate
            ? d.uploadedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Just now';
          var reviewLine = d.reviewedBy
            ? ' • Reviewed by ' + escapeHtml(d.reviewedBy)
            : '';
          return (
            '<article class="document-item">' +
              '<div class="document-item-main">' +
                '<span class="document-item-icon">📄</span>' +
                '<div><h4>' + escapeHtml(d.docType || 'Document') + '</h4>' +
                '<p>Uploaded ' + dateStr + reviewLine + ' • <a href="' + d.fileURL + '" target="_blank" rel="noopener">View File</a></p></div>' +
              '</div>' +
              '<span class="doc-status-badge ' + (d.status || 'pending') + '">' + capitalize(d.status || 'pending') + '</span>' +
            '</article>'
          );
        }).join('');
      }, function (err) { console.error('Linked documents listener error:', err); });
    }

    /* Profile photo */
    var navAvatar = document.getElementById('navAvatar');
    function renderAvatar(photoURL) {
      if (!photoURL) return;
      navAvatar.innerHTML = '<img src="' + photoURL + '" alt="Profile photo">';
    }
    if (profile.photoURL) renderAvatar(profile.photoURL);

    var avatarUploadBtn = document.getElementById('avatarUploadBtn');
    var avatarFileInput = document.getElementById('avatarFileInput');
    avatarUploadBtn.addEventListener('click', function () { avatarFileInput.click(); });
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
