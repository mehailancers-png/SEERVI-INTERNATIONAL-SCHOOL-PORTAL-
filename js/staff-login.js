/* =========================================================
   STAFF-LOGIN.JS
   Seervi International School — SIS ERP Portal

   SECURITY MODEL (see also auth.js and firestore.rules):
   - There is no public staff sign-up. Ever.
   - This page requires email + password (a real Firebase
     Auth account) AND a Staff Access Code.
   - Even if someone's account was correctly promoted to
     role "staff" in Firestore, they still need the access
     code to get past this page.
   - The access code checked here is a DEMO-LEVEL gate only
     (see note below) — the real, unbypassable enforcement
     is the Firestore Security Rules, which check
     role == "staff" server-side for every read/write the
     staff dashboard performs. This page's code is just an
     extra front-door lock for convenience.
   ========================================================= */

import { logIn, getUserProfile } from "./auth.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// DEMO ACCESS CODE — change this to whatever your school
// office hands out. Since this file is public source code,
// treat this purely as a front-door deterrent, not a secret;
// the Firestore rules are what actually protects the data.
var STAFF_ACCESS_CODE = "SIS-STAFF-2026";

document.addEventListener('DOMContentLoaded', function () {

  var staffLoginForm = document.getElementById('staffLoginForm');
  var authAlert = document.getElementById('authAlert');

  /* -----------------------------------------------------
     If already logged in as staff, skip straight to the
     dashboard.
  ----------------------------------------------------- */
  onAuthStateChanged(auth, async function (user) {
    if (!user) return;
    var profile = await getUserProfile(user.uid);
    if (profile && profile.role === 'staff') {
      window.location.href = 'staff-dashboard.html';
    }
  });

  function showAlert(message, type) {
    authAlert.textContent = message;
    authAlert.className = 'auth-alert ' + (type || 'error');
    authAlert.hidden = false;
  }

  function hideAlert() {
    authAlert.hidden = true;
  }

  function setButtonLoading(btn, loading, loadingText, defaultText) {
    btn.disabled = loading;
    btn.querySelector('.btn-label').textContent = loading ? loadingText : defaultText;
  }

  function friendlyFirebaseError(err) {
    var code = err && err.code ? err.code : '';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Incorrect email or password.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
    if (code === 'auth/operation-not-allowed') return 'Email/Password sign-in is not enabled yet. Please contact the school office.';
    if (code === 'auth/network-request-failed') return 'Network error. Check your internet connection.';
    return (err && err.message) ? err.message : 'Something went wrong. Please try again.';
  }

  staffLoginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert();

    var email = document.getElementById('staffEmail').value.trim();
    var password = document.getElementById('staffPassword').value;
    var accessCode = document.getElementById('staffAccessCode').value.trim();
    var btn = document.getElementById('staffLoginSubmitBtn');

    if (!email || password.length < 6) {
      showAlert('Please enter a valid email and password.', 'error');
      return;
    }

    if (accessCode !== STAFF_ACCESS_CODE) {
      showAlert('Invalid Staff Access Code. Please check with the school office.', 'error');
      return;
    }

    setButtonLoading(btn, true, 'Verifying...', 'Staff Log In');

    try {
      var user = await logIn(email, password);
      var profile = await getUserProfile(user.uid);

      if (!profile) {
        showAlert('Account found but profile is missing. Please contact the school office.', 'error');
        setButtonLoading(btn, false, 'Verifying...', 'Staff Log In');
        return;
      }

      if (profile.role !== 'staff') {
        showAlert('This account is not registered as staff. Please contact the school office if this is unexpected.', 'error');
        setButtonLoading(btn, false, 'Verifying...', 'Staff Log In');
        return;
      }

      showAlert('Welcome back! Redirecting to your dashboard...', 'success');
      window.location.href = 'staff-dashboard.html';

    } catch (err) {
      showAlert(friendlyFirebaseError(err), 'error');
      setButtonLoading(btn, false, 'Verifying...', 'Staff Log In');
    }
  });

});
