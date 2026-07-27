/* =========================================================
   STAFF-DASHBOARD.JS
   Seervi International School — SIS ERP Portal
   ========================================================= */

import { requireAuth, logOut, updateProfilePhoto } from "./auth.js";
import { resolveRecipients, sendNotification, watchSentNotifications, getLinkedParentUids } from "./notifications.js";
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var mainContent = document.getElementById('main-content');

  requireAuth(['staff', 'principal'], 'staff-login.html', function (user, profile) {
    authGuard.hidden = true;
    mainContent.hidden = false;
    initStaffDashboard(user, profile);
  });

  function initStaffDashboard(user, profile) {
    document.getElementById('navName').textContent = profile.name || 'Staff';
    document.getElementById('navAvatar').textContent = (profile.name || 'T').charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = profile.name || '—';
    document.getElementById('profileEmail').textContent = profile.email || '—';

    /* Profile photo */
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
       PANEL SWITCHING
    ----------------------------------------------------- */
    var navLinks = document.querySelectorAll('.dashboard-nav-link[data-panel]');
    var panels = document.querySelectorAll('.dashboard-panel[data-panel]');

    function switchPanel(target) {
      navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('data-panel') === target); });
      panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === target); });

      if (target === 'notify' && typeof startParentsListenerIfNeeded === 'function') startParentsListenerIfNeeded();
      if (target === 'pyq-upload' && typeof startPyqsListenerIfNeeded === 'function') startPyqsListenerIfNeeded();
      if (target === 'homework') {
        if (typeof startHomeworkListenerIfNeeded === 'function') startHomeworkListenerIfNeeded();
        if (typeof startParentsListenerIfNeeded === 'function') startParentsListenerIfNeeded(); // needed to notify linked parents
      }
    }

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () { switchPanel(link.getAttribute('data-panel')); });
    });

    document.getElementById('logoutBtn').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'staff-login.html';
    });

    /* =====================================================
       STUDENTS LIST — filtered by Class (required) + Section
    ===================================================== */
    var allStudents = [];
    var studentsTableBody = document.getElementById('studentsTableBody');
    var studentSearchInput = document.getElementById('studentSearchInput');
    var staffClassFilter = document.getElementById('staffClassFilter');
    var staffSectionFilter = document.getElementById('staffSectionFilter');

    var studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));

    onSnapshot(studentsQuery, function (snapshot) {
      allStudents = [];
      snapshot.forEach(function (docSnap) {
        var data = docSnap.data();
        data.uid = docSnap.id;
        allStudents.push(data);
      });
      renderStudentsTable();
      updateScopedStats();
      if (typeof populateStudentSelect === 'function') populateStudentSelect();
      if (typeof populateStudentPickerForNotify === 'function') populateStudentPickerForNotify();
      if (typeof populateAttendanceStudentSelect === 'function') populateAttendanceStudentSelect();
    }, function (err) { console.error('Students listener error:', err); });

    function getFilteredStudents() {
      var classVal = staffClassFilter.value;
      if (!classVal) return null; // no class selected yet

      var sectionVal = staffSectionFilter.value;
      var searchVal = studentSearchInput.value.trim().toLowerCase();

      return allStudents.filter(function (s) {
        var matchesClass = s.class === classVal;
        var matchesSection = sectionVal === 'all' || (s.section || '') === sectionVal;
        var matchesSearch = !searchVal ||
          (s.name || '').toLowerCase().indexOf(searchVal) !== -1 ||
          (s.studentId || '').toLowerCase().indexOf(searchVal) !== -1;
        return matchesClass && matchesSection && matchesSearch;
      });
    }

    function renderStudentsTable() {
      var filtered = getFilteredStudents();

      if (filtered === null) {
        studentsTableBody.innerHTML = '<tr><td colspan="6">Select a class above to view its students.</td></tr>';
        return;
      }

      if (filtered.length === 0) {
        studentsTableBody.innerHTML = '<tr><td colspan="6">No students found matching this filter.</td></tr>';
        return;
      }

      studentsTableBody.innerHTML = filtered.map(function (s) {
        return (
          '<tr class="data-table-clickable-row" data-uid="' + s.uid + '">' +
            '<td>' + escapeHtml(s.name || '—') + '</td>' +
            '<td>' + escapeHtml(s.studentId || '—') + '</td>' +
            '<td>' + escapeHtml(s.class || '—') + '</td>' +
            '<td>' + escapeHtml(s.section || '—') + '</td>' +
            '<td>' + escapeHtml(s.email || '—') + '</td>' +
            '<td>' +
              '<div class="btn-group">' +
                '<button class="btn btn-ghost btn-sm view-docs-btn" data-uid="' + s.uid + '" data-name="' + escapeHtml(s.name || '') + '">View Documents</button>' +
                '<button class="btn btn-ghost btn-sm notify-student-btn" data-uid="' + s.uid + '" data-name="' + escapeHtml(s.name || '') + '">🔔 Notify</button>' +
              '</div>' +
            '</td>' +
          '</tr>'
        );
      }).join('');

      studentsTableBody.querySelectorAll('.view-docs-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterDocumentsByStudent(btn.getAttribute('data-uid'), btn.getAttribute('data-name'));
          switchPanel('documents');
        });
      });

      studentsTableBody.querySelectorAll('.notify-student-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          switchPanel('notify');
          document.getElementById('notifyTarget').value = 'student';
          document.getElementById('notifyTarget').dispatchEvent(new Event('change'));
          document.getElementById('notifyStudentPicker').value = btn.getAttribute('data-uid');
        });
      });
    }

    function updateScopedStats() {
      var classVal = staffClassFilter.value;
      var statCountLabel = document.getElementById('statStudentCountLabel');
      var statDocsLabel = document.getElementById('statPendingDocsLabel');

      if (!classVal) {
        document.getElementById('statStudentCount').textContent = allStudents.length;
        statCountLabel.textContent = 'Total Registered Students';
        document.getElementById('statPendingDocs').textContent =
          (typeof allDocuments !== 'undefined' ? allDocuments.filter(function (d) { return d.status === 'pending'; }).length : '—');
        statDocsLabel.textContent = 'Pending Documents (School-wide)';
        return;
      }

      var filtered = getFilteredStudents() || [];
      document.getElementById('statStudentCount').textContent = filtered.length;
      statCountLabel.textContent = 'Students in ' + classVal;

      if (typeof allDocuments !== 'undefined') {
        var classUids = filtered.map(function (s) { return s.uid; });
        var pendingInClass = allDocuments.filter(function (d) {
          return d.status === 'pending' && classUids.indexOf(d.studentUid) !== -1;
        }).length;
        document.getElementById('statPendingDocs').textContent = pendingInClass;
      }
      statDocsLabel.textContent = 'Pending Documents in ' + classVal;
    }

    staffClassFilter.addEventListener('change', function () {
      renderStudentsTable();
      updateScopedStats();
    });
    staffSectionFilter.addEventListener('change', function () {
      renderStudentsTable();
      updateScopedStats();
    });
    studentSearchInput.addEventListener('input', function () {
      renderStudentsTable();
      updateScopedStats();
    });

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
      updateScopedStats();
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

        var reviewLine = d.reviewedBy && d.reviewedAt && d.reviewedAt.toDate
          ? ' • Reviewed by ' + escapeHtml(d.reviewedBy) + ' on ' + d.reviewedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';
        var reasonLine = d.status === 'rejected' && d.rejectionReason
          ? '<p style="color:var(--color-red);">Reason: ' + escapeHtml(d.rejectionReason) + '</p>'
          : '';

        return (
          '<article class="document-item">' +
            '<div class="document-item-main">' +
              '<span class="document-item-icon">📄</span>' +
              '<div>' +
                '<h4>' + escapeHtml(d.docType || 'Document') + ' — ' + escapeHtml(d.studentName || 'Unknown') + '</h4>' +
                '<p>Uploaded ' + dateStr + ' • SIS ID: ' + escapeHtml(d.studentId || '—') + reviewLine + ' • ' +
                '<a href="' + d.fileURL + '" target="_blank" rel="noopener">View File</a></p>' +
                reasonLine +
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

          var rejectionReason = null;
          if (action === 'reject') {
            rejectionReason = prompt('Please enter a reason for rejecting this document (shown to the student/parent):');
            if (rejectionReason === null) return; // staff cancelled the prompt
            if (!rejectionReason.trim()) {
              alert('A rejection reason is required.');
              return;
            }
          }

          btn.disabled = true;
          try {
            await updateDoc(doc(db, 'documents', id), {
              status: newStatus,
              reviewedBy: profile.name,
              reviewedAt: serverTimestamp(),
              rejectionReason: action === 'reject' ? rejectionReason.trim() : null
            });

            // Parent Transparency: notify the student + their linked parent(s)
            try {
              var reviewedDoc = allDocuments.find(function (dd) { return dd.id === id; });
              if (reviewedDoc && reviewedDoc.studentUid) {
                var docLinkedParents = await getLinkedParentUids(reviewedDoc.studentUid);
                await sendNotification({
                  senderUid: user.uid,
                  senderName: profile.name,
                  targetType: 'student',
                  targetLabel: reviewedDoc.studentName || 'Student',
                  recipientUids: [reviewedDoc.studentUid].concat(docLinkedParents),
                  title: action === 'verify' ? 'Document Verified' : 'Document Rejected',
                  message: (reviewedDoc.docType || 'Your document') + (action === 'reject' ? ' — Reason: ' + rejectionReason.trim() : ' has been verified.')
                });
              }
            } catch (notifyErr) {
              console.error('Could not send document review notification:', notifyErr);
            }

          } catch (err) {
            alert('Could not update status: ' + err.message);
            btn.disabled = false;
          }
        });
      });
    }

    /* =====================================================
       UPLOAD RESULTS
    ===================================================== */
    var RESULT_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science'];
    var resultStudentSelect = document.getElementById('resultStudentSelect');
    var resultMarksTableBody = document.getElementById('resultMarksTableBody');
    var resultUploadForm = document.getElementById('resultUploadForm');
    var resultUploadSubmitBtn = document.getElementById('resultUploadSubmitBtn');

    function renderMarksRows(existingSubjects) {
      resultMarksTableBody.innerHTML = RESULT_SUBJECTS.map(function (name, i) {
        var existing = existingSubjects && existingSubjects.find(function (s) { return s.name === name; });
        var marks = existing ? existing.marks : 0;
        var max = existing ? existing.max : 100;
        return (
          '<tr>' +
            '<td>' + name + '</td>' +
            '<td><input type="number" min="0" class="result-marks-input" data-subject="' + name + '" value="' + marks + '" style="width:90px; padding:6px 10px; border:2px solid var(--color-border); border-radius:6px;"></td>' +
            '<td><input type="number" min="1" class="result-max-input" data-subject="' + name + '" value="' + max + '" style="width:90px; padding:6px 10px; border:2px solid var(--color-border); border-radius:6px;"></td>' +
          '</tr>'
        );
      }).join('');
    }
    renderMarksRows(null);

    function populateStudentSelect() {
      var currentVal = resultStudentSelect.value;
      resultStudentSelect.innerHTML = '<option value="" disabled' + (currentVal ? '' : ' selected') + '>Choose a student...</option>' +
        allStudents.map(function (s) {
          return '<option value="' + s.uid + '"' + (s.uid === currentVal ? ' selected' : '') + '>' +
            escapeHtml(s.name || 'Unnamed') + ' (' + escapeHtml(s.studentId || 'no ID') + (s.rollNumber ? ', Roll ' + escapeHtml(s.rollNumber) : '') + ')</option>';
        }).join('');
    }

    resultStudentSelect.addEventListener('change', async function () {
      var uid = resultStudentSelect.value;
      if (!uid) return;
      try {
        var snap = await getDoc(doc(db, 'results', uid));
        renderMarksRows(snap.exists() ? snap.data().subjects : null);
      } catch (err) {
        console.error(err);
        renderMarksRows(null);
      }
    });

    resultUploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var uid = resultStudentSelect.value;
      if (!uid) { alert('Please select a student.'); return; }

      var student = allStudents.find(function (s) { return s.uid === uid; });
      var subjects = RESULT_SUBJECTS.map(function (name) {
        var marksInput = resultMarksTableBody.querySelector('.result-marks-input[data-subject="' + name + '"]');
        var maxInput = resultMarksTableBody.querySelector('.result-max-input[data-subject="' + name + '"]');
        return { name: name, marks: Number(marksInput.value) || 0, max: Number(maxInput.value) || 100 };
      });

      resultUploadSubmitBtn.disabled = true;
      resultUploadSubmitBtn.querySelector('.btn-label').textContent = 'Saving...';

      try {
        await setDoc(doc(db, 'results', uid), {
          studentUid: uid,
          studentId: student ? student.studentId : null,
          rollNumber: student ? (student.rollNumber || null) : null,
          studentName: student ? student.name : null,
          class: student ? student.class : null,
          subjects: subjects,
          uploadedBy: profile.name,
          uploadedAt: serverTimestamp()
        });

        // Parent Transparency: notify the student + their linked parent(s)
        try {
          var resultLinkedParents = await getLinkedParentUids(uid);
          await sendNotification({
            senderUid: user.uid,
            senderName: profile.name,
            targetType: 'student',
            targetLabel: student ? student.name : 'Student',
            recipientUids: [uid].concat(resultLinkedParents),
            title: 'Result Published',
            message: (student ? student.class + ' — ' : '') + 'Your latest result has been published. Check the Results panel.'
          });
        } catch (notifyErr) {
          console.error('Could not send result notification:', notifyErr);
        }

        alert('Result saved successfully!');
      } catch (err) {
        alert('Could not save result: ' + err.message);
      }

      resultUploadSubmitBtn.disabled = false;
      resultUploadSubmitBtn.querySelector('.btn-label').textContent = 'Save Result';
    });

    /* =====================================================
       UPLOAD ATTENDANCE
    ===================================================== */
    var ATTENDANCE_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    var attendanceStudentSelect = document.getElementById('attendanceStudentSelect');
    var attendanceMarksTableBody = document.getElementById('attendanceMarksTableBody');
    var attendanceUploadForm = document.getElementById('attendanceUploadForm');
    var attendanceUploadSubmitBtn = document.getElementById('attendanceUploadSubmitBtn');

    function renderAttendanceRows(existingMonths) {
      attendanceMarksTableBody.innerHTML = ATTENDANCE_MONTHS.map(function (name) {
        var existing = existingMonths && existingMonths.find(function (m) { return m.name === name; });
        var present = existing ? existing.present : 0;
        var absent = existing ? existing.absent : 0;
        return (
          '<tr>' +
            '<td>' + name + '</td>' +
            '<td><input type="number" min="0" class="attendance-present-input" data-month="' + name + '" value="' + present + '" style="width:80px; padding:6px 10px; border:2px solid var(--color-border); border-radius:6px;"></td>' +
            '<td><input type="number" min="0" class="attendance-absent-input" data-month="' + name + '" value="' + absent + '" style="width:80px; padding:6px 10px; border:2px solid var(--color-border); border-radius:6px;"></td>' +
          '</tr>'
        );
      }).join('');
    }
    renderAttendanceRows(null);

    function populateAttendanceStudentSelect() {
      var currentVal = attendanceStudentSelect.value;
      attendanceStudentSelect.innerHTML = '<option value="" disabled' + (currentVal ? '' : ' selected') + '>Choose a student...</option>' +
        allStudents.map(function (s) {
          return '<option value="' + s.uid + '"' + (s.uid === currentVal ? ' selected' : '') + '>' +
            escapeHtml(s.name || 'Unnamed') + ' (' + escapeHtml(s.studentId || 'no ID') + ')</option>';
        }).join('');
    }

    attendanceStudentSelect.addEventListener('change', async function () {
      var uid = attendanceStudentSelect.value;
      if (!uid) return;
      try {
        var snap = await getDoc(doc(db, 'attendance', uid));
        renderAttendanceRows(snap.exists() ? snap.data().months : null);
      } catch (err) {
        console.error(err);
        renderAttendanceRows(null);
      }
    });

    attendanceUploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var uid = attendanceStudentSelect.value;
      if (!uid) { alert('Please select a student.'); return; }

      var student = allStudents.find(function (s) { return s.uid === uid; });
      var months = ATTENDANCE_MONTHS.map(function (name) {
        var presentInput = attendanceMarksTableBody.querySelector('.attendance-present-input[data-month="' + name + '"]');
        var absentInput = attendanceMarksTableBody.querySelector('.attendance-absent-input[data-month="' + name + '"]');
        return { name: name, present: Number(presentInput.value) || 0, absent: Number(absentInput.value) || 0 };
      });

      attendanceUploadSubmitBtn.disabled = true;
      attendanceUploadSubmitBtn.querySelector('.btn-label').textContent = 'Saving...';

      try {
        await setDoc(doc(db, 'attendance', uid), {
          studentUid: uid,
          studentId: student ? student.studentId : null,
          studentName: student ? student.name : null,
          class: student ? student.class : null,
          months: months,
          updatedBy: profile.name,
          updatedAt: serverTimestamp()
        });
        alert('Attendance saved successfully!');
      } catch (err) {
        alert('Could not save attendance: ' + err.message);
      }

      attendanceUploadSubmitBtn.disabled = false;
      attendanceUploadSubmitBtn.querySelector('.btn-label').textContent = 'Save Attendance';
    });

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
    var pyqsListenerStarted = false;

    function startPyqsListenerIfNeeded() {
      if (pyqsListenerStarted) return;
      pyqsListenerStarted = true;
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
    }

    /* =====================================================
       HOMEWORK MANAGEMENT
    ===================================================== */
    var homeworkForm = document.getElementById('homeworkForm');
    var homeworkDropzone = document.getElementById('homeworkDropzone');
    var homeworkFileInput = document.getElementById('homeworkFileInput');
    var homeworkSelectedFile = document.getElementById('homeworkSelectedFile');
    var homeworkFileName = document.getElementById('homeworkFileName');
    var homeworkFileRemove = document.getElementById('homeworkFileRemove');
    var homeworkProgressWrapper = document.getElementById('homeworkProgressWrapper');
    var homeworkProgressFill = document.getElementById('homeworkProgressFill');
    var homeworkProgressLabel = document.getElementById('homeworkProgressLabel');
    var homeworkSubmitBtn = document.getElementById('homeworkSubmitBtn');
    var homeworkCancelEditBtn = document.getElementById('homeworkCancelEditBtn');
    var homeworkPanelTitle = document.getElementById('homeworkPanelTitle');
    var homeworkList = document.getElementById('homeworkList');
    var homeworkFilterClass = document.getElementById('homeworkFilterClass');

    var editingHomeworkId = null;
    var editingHomeworkFileURL = null;
    var editingHomeworkFileName = null;
    var allHomework = [];
    var homeworkListenerStarted = false;

    homeworkDropzone.addEventListener('click', function () { homeworkFileInput.click(); });
    homeworkDropzone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); homeworkFileInput.click(); }
    });
    ['dragenter', 'dragover'].forEach(function (evt) {
      homeworkDropzone.addEventListener(evt, function (e) { e.preventDefault(); homeworkDropzone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      homeworkDropzone.addEventListener(evt, function (e) { e.preventDefault(); homeworkDropzone.classList.remove('dragover'); });
    });
    homeworkDropzone.addEventListener('drop', function (e) {
      var files = e.dataTransfer.files;
      if (files && files.length) { homeworkFileInput.files = files; showHomeworkFile(files[0]); }
    });
    homeworkFileInput.addEventListener('change', function () {
      if (homeworkFileInput.files && homeworkFileInput.files.length) showHomeworkFile(homeworkFileInput.files[0]);
    });
    function showHomeworkFile(file) {
      homeworkFileName.textContent = file.name;
      homeworkSelectedFile.hidden = false;
    }
    homeworkFileRemove.addEventListener('click', function () {
      homeworkFileInput.value = '';
      homeworkSelectedFile.hidden = true;
    });

    function resetHomeworkForm() {
      homeworkForm.reset();
      homeworkFileInput.value = '';
      homeworkSelectedFile.hidden = true;
      editingHomeworkId = null;
      editingHomeworkFileURL = null;
      editingHomeworkFileName = null;
      homeworkPanelTitle.textContent = 'Assign Homework';
      homeworkSubmitBtn.querySelector('.btn-label').textContent = 'Assign Homework';
      homeworkCancelEditBtn.hidden = true;
    }

    homeworkCancelEditBtn.addEventListener('click', resetHomeworkForm);

    homeworkForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var classVal = document.getElementById('homeworkClass').value;
      var subjectVal = document.getElementById('homeworkSubject').value;
      var title = document.getElementById('homeworkTitle').value.trim();
      var description = document.getElementById('homeworkDescription').value.trim();
      var dueDate = document.getElementById('homeworkDueDate').value;
      var file = homeworkFileInput.files && homeworkFileInput.files[0];

      if (!classVal || !subjectVal || !title || !dueDate) {
        alert('Please fill in class, subject, title, and due date.');
        return;
      }
      if (file && file.size > 10 * 1024 * 1024) {
        alert('Attachment is too large. Maximum size is 10 MB.');
        return;
      }

      homeworkSubmitBtn.disabled = true;
      homeworkSubmitBtn.querySelector('.btn-label').textContent = editingHomeworkId ? 'Saving...' : 'Assigning...';

      try {
        var fileURL = editingHomeworkFileURL;
        var fileName = editingHomeworkFileName;

        if (file) {
          homeworkProgressWrapper.hidden = false;
          var result = await window.uploadFileToCloudinary(file, function (pct) {
            homeworkProgressFill.style.width = pct + '%';
            homeworkProgressLabel.textContent = 'Uploading... ' + pct + '%';
          });
          fileURL = result.secureUrl;
          fileName = file.name;
        }

        var homeworkData = {
          class: classVal,
          subject: subjectVal,
          title: title,
          description: description || null,
          dueDate: dueDate,
          fileURL: fileURL || null,
          fileName: fileName || null,
          updatedByUid: user.uid,
          updatedByName: profile.name,
          updatedAt: serverTimestamp()
        };

        if (editingHomeworkId) {
          await updateDoc(doc(db, 'homework', editingHomeworkId), homeworkData);

          // Parent Transparency: notify class + linked parents of the update
          var classStudentUids = allStudents.filter(function (s) { return s.class === classVal; }).map(function (s) { return s.uid; });
          var classStudentIds = allStudents.filter(function (s) { return s.class === classVal; }).map(function (s) { return s.studentId; });
          var linkedParentUids = allParents.filter(function (p) { return classStudentIds.indexOf(p.childStudentId) !== -1; }).map(function (p) { return p.uid; });
          var updateRecipients = classStudentUids.concat(linkedParentUids);

          if (updateRecipients.length > 0) {
            await sendNotification({
              senderUid: user.uid,
              senderName: profile.name,
              targetType: 'class',
              targetLabel: classVal,
              recipientUids: updateRecipients,
              title: 'Homework Updated: ' + title,
              message: subjectVal + ' — due ' + dueDate
            });
          }

        } else {
          homeworkData.createdByUid = user.uid;
          homeworkData.createdByName = profile.name;
          homeworkData.createdAt = serverTimestamp();
          await addDoc(collection(db, 'homework'), homeworkData);

          // Parent Transparency: notify every student in the class + their linked parents
          var newClassStudentUids = allStudents.filter(function (s) { return s.class === classVal; }).map(function (s) { return s.uid; });
          var newClassStudentIds = allStudents.filter(function (s) { return s.class === classVal; }).map(function (s) { return s.studentId; });
          var newLinkedParentUids = allParents.filter(function (p) { return newClassStudentIds.indexOf(p.childStudentId) !== -1; }).map(function (p) { return p.uid; });
          var newRecipients = newClassStudentUids.concat(newLinkedParentUids);

          if (newRecipients.length > 0) {
            await sendNotification({
              senderUid: user.uid,
              senderName: profile.name,
              targetType: 'class',
              targetLabel: classVal,
              recipientUids: newRecipients,
              title: 'New Homework: ' + title,
              message: subjectVal + ' — due ' + dueDate
            });
          }
        }

        resetHomeworkForm();

      } catch (err) {
        console.error(err);
        alert('Could not save homework: ' + err.message);
      }

      homeworkProgressWrapper.hidden = true;
      homeworkSubmitBtn.disabled = false;
    });

    function renderHomeworkList() {
      var filterVal = homeworkFilterClass.value;
      var filtered = filterVal === 'all' ? allHomework : allHomework.filter(function (h) { return h.class === filterVal; });

      if (filtered.length === 0) {
        homeworkList.innerHTML = '<p class="documents-empty-state">No homework assigned yet.</p>';
        return;
      }

      homeworkList.innerHTML = filtered.map(function (h) {
        var attachmentLink = h.fileURL
          ? ' • <a href="' + h.fileURL + '" target="_blank" rel="noopener">' + escapeHtml(h.fileName || 'View attachment') + '</a>'
          : '';
        return (
          '<article class="document-item">' +
            '<div class="document-item-main">' +
              '<span class="document-item-icon">📚</span>' +
              '<div>' +
                '<h4>' + escapeHtml(h.title) + ' — ' + escapeHtml(h.class) + ' (' + escapeHtml(h.subject) + ')</h4>' +
                '<p>Due ' + escapeHtml(h.dueDate) + attachmentLink + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="btn-group">' +
              '<button class="btn btn-ghost btn-sm homework-edit-btn" data-id="' + h.id + '">Edit</button>' +
              '<button class="btn btn-danger btn-sm homework-delete-btn" data-id="' + h.id + '">Delete</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');

      homeworkList.querySelectorAll('.homework-edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var h = allHomework.find(function (item) { return item.id === btn.getAttribute('data-id'); });
          if (!h) return;

          editingHomeworkId = h.id;
          editingHomeworkFileURL = h.fileURL || null;
          editingHomeworkFileName = h.fileName || null;

          document.getElementById('homeworkClass').value = h.class;
          document.getElementById('homeworkSubject').value = h.subject;
          document.getElementById('homeworkTitle').value = h.title;
          document.getElementById('homeworkDescription').value = h.description || '';
          document.getElementById('homeworkDueDate').value = h.dueDate;

          if (h.fileURL) {
            homeworkFileName.textContent = h.fileName || 'Current attachment';
            homeworkSelectedFile.hidden = false;
          } else {
            homeworkSelectedFile.hidden = true;
          }

          homeworkPanelTitle.textContent = 'Edit Homework';
          homeworkSubmitBtn.querySelector('.btn-label').textContent = 'Save Changes';
          homeworkCancelEditBtn.hidden = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      homeworkList.querySelectorAll('.homework-delete-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!confirm('Delete this homework? This cannot be undone.')) return;
          btn.disabled = true;
          try {
            await deleteDoc(doc(db, 'homework', btn.getAttribute('data-id')));
          } catch (err) {
            alert('Could not delete: ' + err.message);
            btn.disabled = false;
          }
        });
      });
    }

    homeworkFilterClass.addEventListener('change', renderHomeworkList);

    function startHomeworkListenerIfNeeded() {
      if (homeworkListenerStarted) return;
      homeworkListenerStarted = true;
      var homeworkQuery = query(collection(db, 'homework'), orderBy('createdAt', 'desc'));
      onSnapshot(homeworkQuery, function (snapshot) {
        allHomework = [];
        snapshot.forEach(function (docSnap) {
          var data = docSnap.data();
          data.id = docSnap.id;
          allHomework.push(data);
        });
        renderHomeworkList();
      }, function (err) {
        console.error('Homework listener error:', err);
        homeworkList.innerHTML = '<p class="documents-empty-state" style="color:var(--color-red); font-family:monospace; font-size:11px;">' + escapeHtml(err.message) + '</p>';
      });
    }

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

            // Parent Transparency: notify the parent who requested it
            try {
              var apptData = appts.find(function (a) { return a.id === id; });
              if (apptData && apptData.parentUid) {
                await sendNotification({
                  senderUid: user.uid,
                  senderName: profile.name,
                  targetType: 'parent',
                  targetLabel: apptData.parentName || 'Parent',
                  recipientUids: [apptData.parentUid],
                  title: newStatus === 'approved' ? 'Appointment Approved' : 'Appointment Rejected',
                  message: (apptData.purpose || 'Your appointment request') + ' for ' + (apptData.preferredDate || '') + ' has been ' + newStatus + '.'
                });
              }
            } catch (notifyErr) {
              console.error('Could not send appointment notification:', notifyErr);
            }

          } catch (err) {
            alert('Could not update: ' + err.message);
            btn.disabled = false;
          }
        });
      });
    }, function (err) {
      console.error('Appointments listener error:', err);
      staffAppointmentsList.innerHTML =
        '<p class="list-empty-state" style="color:var(--color-red); font-family:monospace; font-size:11px;">' +
        escapeHtml(err.message) + '</p>';
    });

    /* =====================================================
       NOTIFICATIONS — Send Notification panel
    ===================================================== */
    var allParents = [];
    var parentsListenerStarted = false;

    function startParentsListenerIfNeeded() {
      if (parentsListenerStarted) return;
      parentsListenerStarted = true;
      var parentsQuery = query(collection(db, 'users'), where('role', '==', 'parent'));
      onSnapshot(parentsQuery, function (snapshot) {
        allParents = [];
        snapshot.forEach(function (docSnap) {
          var data = docSnap.data();
          data.uid = docSnap.id;
          allParents.push(data);
        });
        populateParentPicker();
      }, function (err) { console.error('Parents listener error:', err); });
    }

    var notifyTarget = document.getElementById('notifyTarget');
    var notifyStudentPickerGroup = document.getElementById('notifyStudentPickerGroup');
    var notifyParentPickerGroup = document.getElementById('notifyParentPickerGroup');
    var notifyClassPickerGroup = document.getElementById('notifyClassPickerGroup');
    var notifySectionPickerGroup = document.getElementById('notifySectionPickerGroup');
    var notifyStudentPicker = document.getElementById('notifyStudentPicker');
    var notifyParentPicker = document.getElementById('notifyParentPicker');
    var notifyClassPicker = document.getElementById('notifyClassPicker');
    var notifySectionPicker = document.getElementById('notifySectionPicker');
    var notifyForm = document.getElementById('notifyForm');
    var notifySubmitBtn = document.getElementById('notifySubmitBtn');

    function populateStudentPickerForNotify() {
      notifyStudentPicker.innerHTML = '<option value="" disabled selected>Choose a student...</option>' +
        allStudents.map(function (s) {
          return '<option value="' + s.uid + '">' + escapeHtml(s.name || 'Unnamed') + ' (' + escapeHtml(s.studentId || 'no ID') + ')</option>';
        }).join('');
    }

    function populateParentPicker() {
      notifyParentPicker.innerHTML = '<option value="" disabled selected>Choose a parent...</option>' +
        allParents.map(function (p) {
          return '<option value="' + p.uid + '">' + escapeHtml(p.name || 'Unnamed') + ' (' + escapeHtml(p.email || '') + ')</option>';
        }).join('');
    }

    function updateNotifyPickerVisibility() {
      var val = notifyTarget.value;
      notifyStudentPickerGroup.style.display = val === 'student' ? '' : 'none';
      notifyParentPickerGroup.style.display = val === 'parent' ? '' : 'none';
      notifyClassPickerGroup.style.display = (val === 'class' || val === 'section') ? '' : 'none';
      notifySectionPickerGroup.style.display = val === 'section' ? '' : 'none';
    }

    notifyTarget.addEventListener('change', updateNotifyPickerVisibility);
    updateNotifyPickerVisibility();
    populateStudentPickerForNotify();

    /* Quick lookup: type a Student's SIS ID directly */
    document.getElementById('notifyStudentIdLookupBtn').addEventListener('click', function () {
      var typedId = document.getElementById('notifyStudentIdLookup').value.trim().toLowerCase();
      var errorEl = document.getElementById('notifyStudentIdLookupError');
      var match = allStudents.find(function (s) { return (s.studentId || '').toLowerCase() === typedId; });

      if (!match) {
        errorEl.style.display = 'block';
        return;
      }
      errorEl.style.display = 'none';
      notifyStudentPicker.value = match.uid;
      document.getElementById('notifyStudentIdLookup').value = '';
    });

    /* Quick lookup: type the child's SIS ID to find the linked Parent */
    document.getElementById('notifyParentIdLookupBtn').addEventListener('click', function () {
      var typedId = document.getElementById('notifyParentIdLookup').value.trim().toLowerCase();
      var errorEl = document.getElementById('notifyParentIdLookupError');
      var match = allParents.find(function (p) { return (p.childStudentId || '').toLowerCase() === typedId; });

      if (!match) {
        errorEl.style.display = 'block';
        return;
      }
      errorEl.style.display = 'none';
      notifyParentPicker.value = match.uid;
      document.getElementById('notifyParentIdLookup').value = '';
    });

    notifyForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      var targetType = notifyTarget.value;
      var title = document.getElementById('notifyTitle').value.trim();
      var message = document.getElementById('notifyMessage').value.trim();

      if (!title || !message) {
        alert('Please fill in both a title and a message.');
        return;
      }

      var targetValue = null;
      var targetLabel = '';

      if (targetType === 'student') {
        targetValue = notifyStudentPicker.value;
        if (!targetValue) { alert('Please choose a student.'); return; }
        targetLabel = notifyStudentPicker.options[notifyStudentPicker.selectedIndex].textContent;
      } else if (targetType === 'parent') {
        targetValue = notifyParentPicker.value;
        if (!targetValue) { alert('Please choose a parent.'); return; }
        targetLabel = notifyParentPicker.options[notifyParentPicker.selectedIndex].textContent;
      } else if (targetType === 'class') {
        targetValue = notifyClassPicker.value;
        if (!targetValue) { alert('Please select a class.'); return; }
        targetLabel = targetValue;
      } else if (targetType === 'section') {
        var cls = notifyClassPicker.value;
        var sec = notifySectionPicker.value;
        if (!cls || !sec) { alert('Please select both a class and a section.'); return; }
        targetValue = cls + '|' + sec;
        targetLabel = cls + ' - Section ' + sec;
      } else if (targetType === 'allStudents') {
        targetLabel = 'All Students';
      } else if (targetType === 'allParents') {
        targetLabel = 'All Parents';
      } else if (targetType === 'school') {
        targetLabel = 'Whole School';
      }

      var recipientUids = resolveRecipients(targetType, targetValue, allStudents, allParents);

      notifySubmitBtn.disabled = true;
      notifySubmitBtn.querySelector('.btn-label').textContent = 'Sending...';

      try {
        await sendNotification({
          senderUid: user.uid,
          senderName: profile.name,
          targetType: targetType,
          targetLabel: targetLabel,
          recipientUids: recipientUids,
          title: title,
          message: message
        });
        notifyForm.reset();
        updateNotifyPickerVisibility();
        alert('Notification sent to ' + recipientUids.length + ' recipient(s).');
      } catch (err) {
        alert('Could not send: ' + err.message);
      }

      notifySubmitBtn.disabled = false;
      notifySubmitBtn.querySelector('.btn-label').textContent = 'Send Notification';
    });

    watchSentNotifications(user.uid, function (list) {
      var sentList = document.getElementById('sentNotificationsList');
      if (list.length === 0) {
        sentList.innerHTML = '<p class="list-empty-state">No notifications sent yet.</p>';
        return;
      }
      sentList.innerHTML = list.map(function (n) {
        var dateStr = n.createdAt && n.createdAt.toDate
          ? n.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Just now';
        return (
          '<div class="notice-item">' +
            '<span class="notice-item-icon">📢</span>' +
            '<div><h4>' + escapeHtml(n.title) + '</h4>' +
            '<p>To: ' + escapeHtml(n.targetLabel) + ' (' + n.recipientUids.length + ') • ' + dateStr + ' • Read by ' + (n.readBy ? n.readBy.length : 0) + '</p></div>' +
          '</div>'
        );
      }).join('');
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
