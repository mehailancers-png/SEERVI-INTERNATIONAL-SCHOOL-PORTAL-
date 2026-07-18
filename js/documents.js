/* =========================================================
   DOCUMENTS.JS
   Seervi International School — SIS ERP Portal
   Real upload flow: file → Cloudinary → URL saved in Firestore.
   Students/Parents: see and upload their own documents.
   Staff: can ALSO upload a test document to verify the
   pipeline, and additionally see + review every document
   submitted by anyone.
   ========================================================= */

import { requireAuth, logOut } from "./auth.js";
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var pageContent = document.getElementById('pageContent');

  requireAuth(['student', 'parent', 'staff'], 'student-login.html', function (user, profile) {
    authGuard.hidden = true;
    pageContent.hidden = false;
    initDocumentsPage(user, profile);
  });

  function initDocumentsPage(user, profile) {
    var isStaff = profile.role === 'staff';

    document.getElementById('authStatusName').textContent = profile.name || 'User';
    document.getElementById('authStatusRole').textContent =
      profile.role === 'student' ? 'Student' : profile.role === 'parent' ? 'Parent' : 'Staff';
    document.getElementById('authStatusDashboardLink').href =
      profile.role === 'student' ? 'student-dashboard.html' :
      profile.role === 'parent' ? 'parent-portal.html' : 'staff-dashboard.html';

    document.getElementById('authStatusLogout').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'student-login.html';
    });

    if (isStaff) {
      document.querySelector('.upload-card-sub').textContent =
        'As staff, you can upload a test document here to verify the pipeline works end-to-end.';
      document.querySelector('.documents-list-title').textContent = 'All Submitted Documents';
    }

    var displayStudentId = profile.role === 'student' ? profile.studentId
      : profile.role === 'parent' ? profile.childStudentId : 'STAFF-TEST';
    var displayName = profile.role === 'student' ? profile.name
      : profile.role === 'parent' ? (profile.name + ' (Parent)') : (profile.name + ' (Staff Test)');

    var dropzone      = document.getElementById('uploadDropzone');
    var fileInput     = document.getElementById('documentFileInput');
    var selectedFile  = document.getElementById('uploadSelectedFile');
    var fileNameEl    = document.getElementById('uploadFileName');
    var removeBtn     = document.getElementById('uploadFileRemove');
    var uploadForm    = document.getElementById('documentUploadForm');
    var progressWrapper = document.getElementById('uploadProgressWrapper');
    var progressFill  = document.getElementById('uploadProgressFill');
    var progressLabel = document.getElementById('uploadProgressLabel');
    var submitBtn     = document.getElementById('uploadSubmitBtn');

    dropzone.addEventListener('click', function () { fileInput.click(); });
    dropzone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });

    ['dragenter', 'dragover'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.remove('dragover'); });
    });
    dropzone.addEventListener('drop', function (e) {
      var files = e.dataTransfer.files;
      if (files && files.length) { fileInput.files = files; showSelectedFile(files[0]); }
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files.length) showSelectedFile(fileInput.files[0]);
    });

    function showSelectedFile(file) {
      fileNameEl.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
      selectedFile.hidden = false;
    }

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    removeBtn.addEventListener('click', function () {
      fileInput.value = '';
      selectedFile.hidden = true;
    });

    uploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var docType = document.getElementById('documentType').value;
      var file = fileInput.files && fileInput.files[0];

      if (!file) { alert('Please choose a file to upload.'); return; }
      if (!docType) { alert('Please select a document type.'); return; }
      if (file.size > 10 * 1024 * 1024) { alert('File is too large. Maximum size is 10 MB.'); return; }

      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-label').textContent = 'Uploading...';
      progressWrapper.hidden = false;
      progressFill.style.width = '0%';
      progressLabel.textContent = 'Uploading... 0%';

      try {
        var result = await window.uploadFileToCloudinary(file, function (pct) {
          progressFill.style.width = pct + '%';
          progressLabel.textContent = 'Uploading... ' + pct + '%';
        });

        await addDoc(collection(db, 'documents'), {
          studentUid: user.uid,
          studentId: displayStudentId || null,
          studentName: displayName,
          docType: docType,
          fileName: file.name,
          fileURL: result.secureUrl,
          status: 'pending',
          uploadedAt: serverTimestamp()
        });

        uploadForm.reset();
        fileInput.value = '';
        selectedFile.hidden = true;
        progressWrapper.hidden = true;

      } catch (err) {
        console.error(err);
        alert('Upload failed: ' + err.message);
        progressWrapper.hidden = true;
      }

      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-label').textContent = 'Upload Document';
    });

    var documentsList = document.getElementById('documentsList');
    var docsQuery = isStaff
      ? query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'))
      : query(collection(db, 'documents'), where('studentUid', '==', user.uid), orderBy('uploadedAt', 'desc'));

    onSnapshot(docsQuery, function (snapshot) {
      if (snapshot.empty) {
        documentsList.innerHTML = isStaff
          ? '<p class="documents-empty-state">No documents have been submitted yet.</p>'
          : '<p class="documents-empty-state">You haven\'t uploaded any documents yet. Use the form above to submit one — it will appear here as <strong>Pending</strong> until a teacher reviews it.</p>';
        return;
      }

      documentsList.innerHTML = snapshot.docs.map(function (docSnap) {
        var d = docSnap.data();
        var dateStr = d.uploadedAt && d.uploadedAt.toDate
          ? d.uploadedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Just now';

        var reviewLine = '';
        if (d.status !== 'pending' && d.reviewedBy) {
          var reviewDate = d.reviewedAt && d.reviewedAt.toDate
            ? d.reviewedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';
          reviewLine = '<p class="document-review-log">' + capitalize(d.status) + ' by ' + escapeHtml(d.reviewedBy) + (reviewDate ? ' on ' + reviewDate : '') + '</p>';
        }

        var nameLine = isStaff ? (' — ' + escapeHtml(d.studentName || 'Unknown')) : '';

        var actions = isStaff && d.status === 'pending'
          ? '<div class="btn-group">' +
              '<button class="btn btn-success btn-sm" data-action="verify" data-id="' + docSnap.id + '">✓ Verify</button>' +
              '<button class="btn btn-danger btn-sm" data-action="reject" data-id="' + docSnap.id + '">✕ Reject</button>' +
            '</div>'
          : '<span class="doc-status-badge ' + (d.status || 'pending') + '">' + capitalize(d.status || 'pending') + '</span>';

        return (
          '<article class="document-item">' +
            '<div class="document-item-main">' +
              '<span class="document-item-icon">📄</span>' +
              '<div>' +
                '<h4>' + escapeHtml(d.docType || 'Document') + nameLine + '</h4>' +
                '<p>Uploaded ' + dateStr + ' • <a href="' + d.fileURL + '" target="_blank" rel="noopener">' + escapeHtml(d.fileName || 'View file') + '</a></p>' +
                reviewLine +
              '</div>' +
            '</div>' +
            actions +
          '</article>'
        );
      }).join('');

      if (isStaff) {
        documentsList.querySelectorAll('[data-action]').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            var newStatus = btn.getAttribute('data-action') === 'verify' ? 'verified' : 'rejected';
            btn.disabled = true;
            try {
              await updateDoc(doc(db, 'documents', btn.getAttribute('data-id')), {
                status: newStatus, reviewedBy: profile.name, reviewedAt: serverTimestamp()
              });
            } catch (err) {
              alert('Could not update: ' + err.message);
              btn.disabled = false;
            }
          });
        });
      }
    }, function (err) {
      console.error('Documents listener error:', err);
      documentsList.innerHTML =
        '<p class="documents-empty-state">Could not load documents right now.<br>' +
        '<small style="color:var(--color-red); font-family:monospace;">' + escapeHtml(err.message) + '</small></p>';
    });
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
