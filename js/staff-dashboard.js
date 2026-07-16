/* =========================================================
   STAFF-DASHBOARD.JS
   Seervi International School — SIS ERP Portal
   ========================================================= */

import { requireAuth, logOut } from "./auth.js";
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var mainContent = document.getElementById('main-content');

  requireAuth(['staff'], 'staff-login.html', function (user, profile) {
    authGuard.hidden = true;
    mainContent.hidden = false;
    initStaffDashboard(user, profile);
  });

  function initStaffDashboard(user, profile) {
    document.getElementById('navName').textContent = profile.name || 'Staff';
    document.getElementById('navAvatar').textContent = (profile.name || 'T').charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = profile.name || '—';
    document.getElementById('profileEmail').textContent = profile.email || '—';

    /* -----------------------------------------------------
       PANEL SWITCHING
    ----------------------------------------------------- */
    var navLinks = document.querySelectorAll('.dashboard-nav-link[data-panel]');
    var panels = document.querySelectorAll('.dashboard-panel[data-panel]');

    function switchPanel(target) {
      navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('data-panel') === target); });
      panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === target); });
    }

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () { switchPanel(link.getAttribute('data-panel')); });
    });

    document.getElementById('logoutBtn').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'staff-login.html';
    });

    /* =====================================================
       STUDENTS LIST
    ===================================================== */
    var allStudents = [];
    var studentsTableBody = document.getElementById('studentsTableBody');
    var studentSearchInput = document.getElementById('studentSearchInput');

    var studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));

    onSnapshot(studentsQuery, function (snapshot) {
      allStudents = [];
      snapshot.forEach(function (docSnap) {
        var data = docSnap.data();
        data.uid = docSnap.id;
        allStudents.push(data);
      });
      document.getElementById('statStudentCount').textContent = allStudents.length;
      renderStudentsTable();
    }, function (err) { console.error('Students listener error:', err); });

    function renderStudentsTable() {
      var searchVal = studentSearchInput.value.trim().toLowerCase();
      var filtered = allStudents.filter(function (s) {
        return !searchVal ||
          (s.name || '').toLowerCase().indexOf(searchVal) !== -1 ||
          (s.studentId || '').toLowerCase().indexOf(searchVal) !== -1;
      });

      if (filtered.length === 0) {
        studentsTableBody.innerHTML = '<tr><td colspan="5">No students found.</td></tr>';
        return;
      }

      studentsTableBody.innerHTML = filtered.map(function (s) {
        return (
          '<tr class="data-table-clickable-row" data-uid="' + s.uid + '">' +
            '<td>' + escapeHtml(s.name || '—') + '</td>' +
            '<td>' + escapeHtml(s.studentId || '—') + '</td>' +
            '<td>' + escapeHtml(s.class || '—') + '</td>' +
            '<td>' + escapeHtml(s.email || '—') + '</td>' +
            '<td><button class="btn btn-ghost btn-sm view-docs-btn" data-uid="' + s.uid + '" data-name="' + escapeHtml(s.name || '') + '">View Documents</button></td>' +
          '</tr>'
        );
      }).join('');

      studentsTableBody.querySelectorAll('.view-docs-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterDocumentsByStudent(btn.getAttribute('data-uid'), btn.getAttribute('data-name'));
          switchPanel('documents');
        });
      });
    }

    studentSearchInput.addEventListener('input', renderStudentsTable);

    /* =====================================================
       DOCUMENTS — VERIFY / REJECT
    ===================================================== */
    var allDocuments = [];
    var staffDocumentsList = document.getElementById('staffDocumentsList');
    var documentsPanelTitle = document.getElementById('documentsPanelTitle');
    var documentsPanelSub = document.getElementById('documentsPanelSub');
    var clearStudentFilterBtn = document.getElementById('clearStudentFilterBtn');
    var currentStudentFilter = null; // { uid, name }

    var documentsQuery = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'));

    onSnapshot(documentsQuery, function (snapshot) {
      allDocuments = [];
      snapshot.forEach(function (docSnap) {
        var data = docSnap.data();
        data.id = docSnap.id;
        allDocuments.push(data);
      });
      var pendingCount = allDocuments.filter(function (d) { return d.status === 'pending'; }).length;
      document.getElementById('statPendingDocs').textContent = pendingCount;
      renderDocumentsList();
    }, function (err) { console.error('Documents listener error:', err); });

    function filterDocumentsByStudent(uid, name) {
      currentStudentFilter = { uid: uid, name: name };
      documentsPanelTitle.textContent = 'Documents — ' + name;
      documentsPanelSub.textContent = 'Reviewing submissions from this student only.';
      clearStudentFilterBtn.hidden = false;
      renderDocumentsList();
    }

    clearStudentFilterBtn.addEventListener('click', function () {
      currentStudentFilter = null;
      documentsPanelTitle.textContent = 'Verify Documents';
      documentsPanelSub.textContent = 'Review submissions and mark them Verified or Rejected.';
      clearStudentFilterBtn.hidden = true;
      renderDocumentsList();
    });

    function renderDocumentsList() {
      var list = currentStudentFilter
        ? allDocuments.filter(function (d) { return d.studentUid === currentStudentFilter.uid; })
        : allDocuments;

      if (list.length === 0) {
        staffDocumentsList.innerHTML = '<p class="documents-empty-state">No documents to show.</p>';
        return;
      }

      staffDocumentsList.innerHTML = list.map(function (d) {
        var dateStr = d.uploadedAt && d.uploadedAt.toDate
          ? d.uploadedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Just now';

        var actions = d.status === 'pending'
          ? '<div class="btn-group">' +
              '<button class="btn btn-success btn-sm" data-action="verify" data-id="' + d.id + '">✓ Verify</button>' +
              '<button class="btn btn-danger btn-sm" data-action="reject" data-id="' + d.id + '">✕ Reject</button>' +
            '</div>'
          : '<span class="doc-status-badge ' + d.status + '">' + capitalize(d.status) + '</span>';

        return (
          '<article class="document-item">' +
            '<div class="document-item-main">' +
              '<span class="document-item-icon">📄</span>' +
              '<div>' +
                '<h4>' + escapeHtml(d.docType || 'Document') + ' — ' + escapeHtml(d.studentName || 'Unknown') + '</h4>' +
                '<p>Uploaded ' + dateStr + ' • SIS ID: ' + escapeHtml(d.studentId || '—') + ' • ' +
                '<a href="' + d.fileURL + '" target="_blank" rel="noopener">View File</a></p>' +
              '</div>' +
            '</div>' +
            actions +
          '</article>'
        );
      }).join('');

      staffDocumentsList.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = btn.getAttribute('data-id');
          var action = btn.getAttribute('data-action');
          var newStatus = action === 'verify' ? 'verified' : 'rejected';

          btn.disabled = true;
          try {
            await updateDoc(doc(db, 'documents', id), {
              status: newStatus,
              reviewedBy: profile.name,
              reviewedAt: serverTimestamp()
            });
          } catch (err) {
            alert('Could not update status: ' + err.message);
            btn.disabled = false;
          }
        });
      });
    }

    /* =====================================================
       PYQ UPLOAD
    ===================================================== */
    var pyqDropzone = document.getElementById('pyqDropzone');
    var pyqFileInput = document.getElementById('pyqFileInput');
    var pyqSelectedFile = document.getElementById('pyqSelectedFile');
    var pyqFileName = document.getElementById('pyqFileName');
    var pyqFileRemove = document.getElementById('pyqFileRemove');
    var pyqUploadForm = document.getElementById('pyqUploadForm');
    var pyqProgressWrapper = document.getElementById('pyqProgressWrapper');
    var pyqProgressFill = document.getElementById('pyqProgressFill');
    var pyqProgressLabel = document.getElementById('pyqProgressLabel');
    var pyqUploadSubmitBtn = document.getElementById('pyqUploadSubmitBtn');

    pyqDropzone.addEventListener('click', function () { pyqFileInput.click(); });
    pyqDropzone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pyqFileInput.click(); }
    });
    ['dragenter', 'dragover'].forEach(function (evt) {
      pyqDropzone.addEventListener(evt, function (e) { e.preventDefault(); pyqDropzone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      pyqDropzone.addEventListener(evt, function (e) { e.preventDefault(); pyqDropzone.classList.remove('dragover'); });
    });
    pyqDropzone.addEventListener('drop', function (e) {
      var files = e.dataTransfer.files;
      if (files && files.length) { pyqFileInput.files = files; showPyqFile(files[0]); }
    });
    pyqFileInput.addEventListener('change', function () {
      if (pyqFileInput.files && pyqFileInput.files.length) showPyqFile(pyqFileInput.files[0]);
    });
    function showPyqFile(file) {
      pyqFileName.textContent = file.name;
      pyqSelectedFile.hidden = false;
    }
    pyqFileRemove.addEventListener('click', function () {
      pyqFileInput.value = '';
      pyqSelectedFile.hidden = true;
    });

    pyqUploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var file = pyqFileInput.files && pyqFileInput.files[0];
      var title = document.getElementById('pyqUploadTitle').value.trim();
      var classVal = document.getElementById('pyqUploadClass').value;
      var subjectVal = document.getElementById('pyqUploadSubject').value;

      if (!file || !title || !classVal || !subjectVal) {
        alert('Please fill in all fields and choose a file.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('File is too large. Maximum size is 20 MB.');
        return;
      }

      pyqUploadSubmitBtn.disabled = true;
      pyqUploadSubmitBtn.querySelector('.btn-label').textContent = 'Uploading...';
      pyqProgressWrapper.hidden = false;

      try {
        var result = await window.uploadFileToCloudinary(file, function (pct) {
          pyqProgressFill.style.width = pct + '%';
          pyqProgressLabel.textContent = 'Uploading... ' + pct + '%';
        });

        await addDoc(collection(db, 'pyqs'), {
          title: title,
          class: classVal,
          subject: subjectVal,
          fileName: file.name,
          fileURL: result.secureUrl,
          uploadedByUid: user.uid,
          uploadedByName: profile.name,
          uploadedAt: serverTimestamp()
        });

        pyqUploadForm.reset();
        pyqFileInput.value = '';
        pyqSelectedFile.hidden = true;
        pyqProgressWrapper.hidden = true;
        alert('PYQ uploaded successfully!');

      } catch (err) {
        console.error(err);
        alert('Upload failed: ' + err.message);
        pyqProgressWrapper.hidden = true;
      }

      pyqUploadSubmitBtn.disabled = false;
      pyqUploadSubmitBtn.querySelector('.btn-label').textContent = 'Upload PYQ';
    });

    /* Recently uploaded PYQs list */
    var recentPyqsList = document.getElementById('recentPyqsList');
    var pyqsQuery = query(collection(db, 'pyqs'), orderBy('uploadedAt', 'desc'));

    onSnapshot(pyqsQuery, function (snapshot) {
      if (snapshot.empty) {
        recentPyqsList.innerHTML = '<p class="documents-empty-state">No PYQs uploaded yet.</p>';
        return;
      }
      var html = '';
      snapshot.forEach(function (docSnap) {
        var p = docSnap.data();
        html +=
          '<article class="document-item">' +
            '<div class="document-item-main">' +
              '<span class="document-item-icon">📝</span>' +
              '<div><h4>' + escapeHtml(p.title || 'Untitled') + '</h4>' +
              '<p>' + escapeHtml(p.class || '') + ' • ' + escapeHtml(p.subject || '') + '</p></div>' +
            '</div>' +
            '<a href="' + p.fileURL + '" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">View</a>' +
          '</article>';
      });
      recentPyqsList.innerHTML = html;
    });

    /* =====================================================
       APPOINTMENTS — APPROVE / REJECT
    ===================================================== */
    var staffAppointmentsList = document.getElementById('staffAppointmentsList');
    var apptQuery = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));

    onSnapshot(apptQuery, function (snapshot) {
      var appts = [];
      snapshot.forEach(function (docSnap) {
        var data = docSnap.data();
        data.id = docSnap.id;
        appts.push(data);
      });

      document.getElementById('statPendingAppts').textContent =
        appts.filter(function (a) { return a.status === 'pending'; }).length;

      if (appts.length === 0) {
        staffAppointmentsList.innerHTML = '<p class="list-empty-state">No appointment requests yet.</p>';
        return;
      }

      staffAppointmentsList.innerHTML = appts.map(function (a) {
        var actions = a.status === 'pending'
          ? '<div class="btn-group">' +
              '<button class="btn btn-success btn-sm" data-appt-action="approved" data-id="' + a.id + '">✓ Approve</button>' +
              '<button class="btn btn-danger btn-sm" data-appt-action="rejected" data-id="' + a.id + '">✕ Reject</button>' +
            '</div>'
          : '<span class="status-badge ' + (a.status === 'approved' ? 'green' : 'red') + '">' + capitalize(a.status) + '</span>';

        return (
          '<div class="notice-item">' +
            '<span class="notice-item-icon">📅</span>' +
            '<div style="flex:1;">' +
              '<h4>' + escapeHtml(a.purpose || 'Appointment') + ' — ' + escapeHtml(a.childName || '') + '</h4>' +
              '<p>Parent: ' + escapeHtml(a.parentName || '—') + ' • Preferred: ' + escapeHtml(a.preferredDate || '') + ' ' + escapeHtml(a.preferredTime || '') + '</p>' +
              (a.message ? '<p>"' + escapeHtml(a.message) + '"</p>' : '') +
            '</div>' +
            actions +
          '</div>'
        );
      }).join('');

      staffAppointmentsList.querySelectorAll('[data-appt-action]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = btn.getAttribute('data-id');
          var newStatus = btn.getAttribute('data-appt-action');
          btn.disabled = true;
          try {
            await updateDoc(doc(db, 'appointments', id), { status: newStatus });
          } catch (err) {
            alert('Could not update: ' + err.message);
            btn.disabled = false;
          }
        });
      });
    }, function (err) { console.error('Appointments listener error:', err); });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

});
