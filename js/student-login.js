/* =========================================================
   STUDENT-LOGIN.JS
   Seervi International School — SIS ERP Portal
   Handles the combined Student/Parent Login + Sign Up page.
   ========================================================= */

import { signUpStudentOrParent, logIn, getUserProfile, signInWithGoogle, completeGoogleProfile, registerStudentIndex } from "./auth.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {

  var modeTabs     = document.querySelectorAll('.auth-mode-tabs .search-tab');
  var loginForm    = document.getElementById('loginForm');
  var signupForm   = document.getElementById('signupForm');
  var authAlert    = document.getElementById('authAlert');
  var roleRadios   = document.querySelectorAll('input[name="signupRole"]');

  /* -----------------------------------------------------
     If already logged in, skip straight to the right
     dashboard instead of showing the login form again.
  ----------------------------------------------------- */
  onAuthStateChanged(auth, async function (user) {
    if (!user) return;
    var profile = await getUserProfile(user.uid);
    if (profile && profile.role === 'student') {
      window.location.href = 'student-dashboard.html';
    } else if (profile && profile.role === 'parent') {
      window.location.href = 'parent-portal.html';
    }
  });

  /* -----------------------------------------------------
     TAB SWITCHING — Log In vs Sign Up
  ----------------------------------------------------- */
  modeTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      modeTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      var mode = tab.getAttribute('data-mode');
      hideAlert();

      if (mode === 'login') {
        loginForm.hidden = false;
        signupForm.hidden = true;
      } else {
        loginForm.hidden = true;
        signupForm.hidden = false;
      }
    });
  });

  /* -----------------------------------------------------
     ROLE TOGGLE — Student vs Parent (Sign Up form)
  ----------------------------------------------------- */
  var studentFields = document.querySelectorAll('[data-role-field="student"]');
  var parentFields  = document.querySelectorAll('[data-role-field="parent"]');

  roleRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      var isStudent = radio.value === 'student' && radio.checked;
      if (!radio.checked) return;

      if (radio.value === 'student') {
        studentFields.forEach(function (f) { f.hidden = false; });
        parentFields.forEach(function (f) { f.hidden = true; });
        document.getElementById('signupStudentId').setAttribute('required', 'required');
        document.getElementById('signupClass').setAttribute('required', 'required');
        document.getElementById('signupChildId').removeAttribute('required');
      } else {
        studentFields.forEach(function (f) { f.hidden = true; });
        parentFields.forEach(function (f) { f.hidden = false; });
        document.getElementById('signupChildId').setAttribute('required', 'required');
        document.getElementById('signupStudentId').removeAttribute('required');
        document.getElementById('signupClass').removeAttribute('required');
      }
    });
  });

  /* -----------------------------------------------------
     ALERT HELPERS
  ----------------------------------------------------- */
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
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists. Try logging in instead.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/weak-password') return 'Password is too weak — use at least 6 characters.';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Incorrect email or password.';
    if (code === 'auth/operation-not-allowed') return 'Email/Password sign-in is not enabled yet. Please contact the school office.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
    if (code === 'auth/network-request-failed') return 'Network error. Check your internet connection.';
    return (err && err.message) ? err.message : 'Something went wrong. Please try again.';
  }

  /* -----------------------------------------------------
     LOGIN SUBMIT
  ----------------------------------------------------- */
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert();

    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginSubmitBtn');

    if (!email || password.length < 6) {
      showAlert('Please enter a valid email and password.', 'error');
      return;
    }

    setButtonLoading(btn, true, 'Logging in...', 'Log In');

    try {
      var user = await logIn(email, password);
      var profile = await getUserProfile(user.uid);

      if (!profile) {
        showAlert('Account found but profile is missing. Please contact the school office.', 'error');
        setButtonLoading(btn, false, 'Logging in...', 'Log In');
        return;
      }

      if (profile.role === 'staff') {
        showAlert('This is a student/parent login. Staff should use the Staff Login page.', 'error');
        setButtonLoading(btn, false, 'Logging in...', 'Log In');
        return;
      }

      showAlert('Login successful! Redirecting...', 'success');
      window.location.href = profile.role === 'student' ? 'student-dashboard.html' : 'parent-portal.html';

    } catch (err) {
      showAlert(friendlyFirebaseError(err), 'error');
      setButtonLoading(btn, false, 'Logging in...', 'Log In');
    }
  });

  /* -----------------------------------------------------
     SIGN UP SUBMIT
  ----------------------------------------------------- */
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert();

    var role = document.querySelector('input[name="signupRole"]:checked').value;
    var name = document.getElementById('signupName').value.trim();
    var email = document.getElementById('signupEmail').value.trim();
    var password = document.getElementById('signupPassword').value;
    var confirmPassword = document.getElementById('signupConfirmPassword').value;
    var btn = document.getElementById('signupSubmitBtn');

    if (!name || !email) {
      showAlert('Please fill in your name and email.', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match.', 'error');
      return;
    }

    var studentId = document.getElementById('signupStudentId').value.trim();
    var rollNumber = document.getElementById('signupRollNumber').value.trim();
    var className = document.getElementById('signupClass').value;
    var section = document.getElementById('signupSection').value;
    var childStudentId = document.getElementById('signupChildId').value.trim();

    if (role === 'student' && (!studentId || !className)) {
      showAlert('Please enter your SIS Student ID and select your class.', 'error');
      return;
    }

    if (role === 'parent' && !childStudentId) {
      showAlert("Please enter your child's SIS Student ID.", 'error');
      return;
    }

    setButtonLoading(btn, true, 'Creating account...', 'Create Account');

    try {
      var newUid = await signUpStudentOrParent({
        name: name,
        email: email,
        password: password,
        role: role,
        studentId: studentId,
        rollNumber: rollNumber,
        className: className,
        section: section,
        childStudentId: childStudentId
      });

      if (role === 'student' && studentId) {
        await registerStudentIndex(studentId, newUid, name);
      }

      showAlert('Account created successfully! Redirecting...', 'success');
      window.location.href = role === 'student' ? 'student-dashboard.html' : 'parent-portal.html';

    } catch (err) {
      showAlert(friendlyFirebaseError(err), 'error');
      setButtonLoading(btn, false, 'Creating account...', 'Create Account');
    }
  });

  /* -----------------------------------------------------
     GOOGLE SIGN-IN
  ----------------------------------------------------- */
  var googleBtn = document.getElementById('googleSignInBtn');
  var completeProfileForm = document.getElementById('completeProfileForm');
  var pendingGoogleUser = null; // holds the user object while they fill the complete-profile form

  googleBtn.addEventListener('click', async function () {
    hideAlert();
    googleBtn.disabled = true;

    try {
      var user = await signInWithGoogle();
      var profile = await getUserProfile(user.uid);

      if (profile) {
        // Returning user — just route them like a normal login.
        if (profile.role === 'staff') {
          showAlert('This is a student/parent login. Staff should use the Staff Login page.', 'error');
          googleBtn.disabled = false;
          return;
        }
        showAlert('Login successful! Redirecting...', 'success');
        window.location.href = profile.role === 'student' ? 'student-dashboard.html' : 'parent-portal.html';
        return;
      }

      // First time signing in with Google — show the complete-profile form.
      pendingGoogleUser = user;
      loginForm.hidden = true;
      signupForm.hidden = true;
      googleBtn.hidden = true;
      document.querySelector('.auth-divider').hidden = true;
      completeProfileForm.hidden = false;
      document.getElementById('completeName').value = user.displayName || '';

    } catch (err) {
      showAlert(friendlyFirebaseError(err), 'error');
      googleBtn.disabled = false;
    }
  });

  /* -----------------------------------------------------
     COMPLETE PROFILE FORM (first-time Google sign-in)
  ----------------------------------------------------- */
  var completeRoleRadios = document.querySelectorAll('input[name="completeRole"]');
  var completeStudentFields = document.querySelectorAll('[data-complete-field="student"]');
  var completeParentFields = document.querySelectorAll('[data-complete-field="parent"]');

  completeRoleRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      if (radio.value === 'student') {
        completeStudentFields.forEach(function (f) { f.hidden = false; });
        completeParentFields.forEach(function (f) { f.hidden = true; });
      } else {
        completeStudentFields.forEach(function (f) { f.hidden = true; });
        completeParentFields.forEach(function (f) { f.hidden = false; });
      }
    });
  });

  completeProfileForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert();

    if (!pendingGoogleUser) return;

    var role = document.querySelector('input[name="completeRole"]:checked').value;
    var typedName = document.getElementById('completeName').value.trim();
    var studentId = document.getElementById('completeStudentId').value.trim();
    var rollNumber = document.getElementById('completeRollNumber').value.trim();
    var className = document.getElementById('completeClass').value;
    var section = document.getElementById('completeSection').value;
    var childStudentId = document.getElementById('completeChildId').value.trim();
    var btn = document.getElementById('completeProfileSubmitBtn');

    if (!typedName) {
      showAlert('Please enter your name.', 'error');
      return;
    }

    if (role === 'student' && (!studentId || !className)) {
      showAlert('Please enter your SIS Student ID and select your class.', 'error');
      return;
    }

    if (role === 'parent' && !childStudentId) {
      showAlert("Please enter your child's SIS Student ID.", 'error');
      return;
    }

    setButtonLoading(btn, true, 'Saving...', 'Finish Setup');

    try {
      await completeGoogleProfile({
        uid: pendingGoogleUser.uid,
        name: typedName,
        email: pendingGoogleUser.email,
        role: role,
        studentId: studentId,
        rollNumber: rollNumber,
        className: className,
        section: section,
        childStudentId: childStudentId
      });

      if (role === 'student' && studentId) {
        await registerStudentIndex(studentId, pendingGoogleUser.uid, typedName);
      }

      showAlert('Account set up successfully! Redirecting...', 'success');
      window.location.href = role === 'student' ? 'student-dashboard.html' : 'parent-portal.html';

    } catch (err) {
      showAlert(friendlyFirebaseError(err), 'error');
      setButtonLoading(btn, false, 'Saving...', 'Finish Setup');
    }
  });

});
