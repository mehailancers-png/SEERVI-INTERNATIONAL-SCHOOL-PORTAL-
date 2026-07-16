/* =========================================================
   APPOINTMENT.JS
   Seervi International School — SIS ERP Portal
   Gated to logged-in Parent accounts.
   ========================================================= */

import { requireAuth, logOut } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var pageContent = document.getElementById('pageContent');

  requireAuth(['parent'], 'student-login.html', function (user, profile) {
    authGuard.hidden = true;
    pageContent.hidden = false;
    initAppointmentPage(user, profile);
  });

  function initAppointmentPage(user, profile) {
    document.getElementById('authStatusName').textContent = profile.name || 'Parent';

    document.getElementById('authStatusLogout').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'student-login.html';
    });

    // Prevent booking a date in the past
    var dateInput = document.getElementById('apptDate');
    var today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

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

      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-label').textContent = 'Submitting...';

      try {
        await addDoc(collection(db, 'appointments'), {
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

        form.reset();
        successModal.classList.add('open');
        successModal.setAttribute('aria-hidden', 'false');

      } catch (err) {
        console.error(err);
        alert('Could not submit your request: ' + err.message);
      }

      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-label').textContent = 'Request Appointment';
    });
  }

});
