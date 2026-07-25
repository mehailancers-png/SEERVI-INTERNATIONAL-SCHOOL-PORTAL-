/* =========================================================
   APPOINTMENT.JS
   Seervi International School — SIS ERP Portal
   Gated to logged-in Parent accounts.
   ========================================================= */

import { requireAuth, logOut } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, addDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var pageContent = document.getElementById('pageContent');

  requireAuth(['parent', 'staff'], 'student-login.html', function (user, profile) {
    authGuard.hidden = true;
    pageContent.hidden = false;
    initAppointmentPage(user, profile);
  });

  function initAppointmentPage(user, profile) {
    document.getElementById('authStatusName').textContent = profile.name || 'User';

    document.getElementById('authStatusLogout').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'student-login.html';
    });

    /* -----------------------------------------------------
       STAFF — can also submit a test request here to verify
       the pipeline; real approve/reject management still
       happens on the Staff Dashboard.
    ----------------------------------------------------- */
    if (profile.role === 'staff') {
      var staffNote = document.createElement('div');
      staffNote.className = 'info-note-box info';
      staffNote.style.maxWidth = '780px';
      staffNote.style.margin = '0 auto 24px';
      staffNote.innerHTML =
        '<span class="info-note-icon">ℹ️</span>' +
        '<span>As staff, you can submit a test request below to verify the booking pipeline. To review and ' +
        'approve/reject real parent requests, use the <a href="staff-dashboard.html">Staff Dashboard → Appointments</a> panel.</span>';
      document.querySelector('#appointment-section .container').insertBefore(staffNote, document.querySelector('.search-card'));
    }

    // Prevent booking a date in the past
    var dateInput = document.getElementById('apptDate');
    var today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    document.getElementById('successModalDashboardLink').href =
      profile.role === 'staff' ? 'staff-dashboard.html' : 'parent-portal.html';

    var form = document.getElementById('appointmentForm');
    var submitBtn = document.getElementById('apptSubmitBtn');
    var successModal = document.getElementById('successModal');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var childName = document.getElementById('childName').value.trim();
      var purpose = document.getElementById('apptPurpose').value;
      var date = document.getElementById('apptDate').value;
      var time = document.getElementById('apptTime').value;
      var message = document.getElementById('apptMessage').value.trim();

      if (!childName || !purpose || !date || !time) {
        alert('Please fill in all required fields.');
        return;
      }

      if (navigator.onLine === false) {
        alert('You appear to be offline. Please check your internet connection and try again — the request will not be saved until you are back online.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-label').textContent = 'Submitting...';

      try {
        var docRef = await addDoc(collection(db, 'appointments'), {
          parentUid: user.uid,
          parentName: profile.name,
          childName: childName,
          purpose: purpose,
          preferredDate: date,
          preferredTime: time,
          message: message || null,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        // Real verification: read the document straight back from the
        // server (not just trusting the local write promise resolved)
        // before telling the person it's actually saved.
        submitBtn.querySelector('.btn-label').textContent = 'Verifying...';
        var verifySnap = await getDoc(docRef);

        if (!verifySnap.exists()) {
          throw new Error('Write appeared to succeed but could not be verified on the server. Please try again.');
        }

        form.reset();
        document.getElementById('apptReferenceId').textContent = docRef.id;
        successModal.classList.add('open');
        successModal.setAttribute('aria-hidden', 'false');

      } catch (err) {
        console.error(err);
        alert('Could not submit your request: ' + err.message + '\n\nPlease try again. If this keeps happening, note the error text above and let the school office know.');
      }

      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-label').textContent = 'Request Appointment';
    });
  }

});
