/* =========================================================
   AUTH.JS
   Seervi International School — SIS ERP Portal
   Shared authentication + role engine, built on Firebase Auth
   and Firestore. Every login page and dashboard page imports
   from this module rather than talking to Firebase directly.

   ---------------------------------------------------------
   ROLE MODEL
   ---------------------------------------------------------
   Every signed-up user gets a document at users/{uid} with:
     { name, email, role, studentId, class, createdAt }

   role is one of: "student" | "parent" | "staff"

   IMPORTANT — STAFF SECURITY:
   There is NO public "sign up as staff" form anywhere in this
   app. The public signup flow (see signUpStudentOrParent) can
   only ever create role "student" or "parent" — this is
   enforced in code below, not just hidden in the UI.

   To create a staff/teacher account:
     1. That person signs up normally (they'll get role "student"
        by default, or you can have them sign up and ignore the
        role shown).
     2. A school admin opens the Firebase Console → Firestore →
        the "users" collection → finds that person's document →
        manually changes the "role" field to "staff".
     This manual, human-in-the-loop step is what actually
     prevents random people from granting themselves staff
     access — no client-side code can be trusted to gate that,
     since anyone can read JavaScript in the browser.

   Once Firestore Security Rules (see rules.txt provided
   alongside this file) are deployed, they double-enforce this
   on the server: only documents where role == "staff" can
   verify/reject student documents or upload PYQs, and clients
   can never write their own role field after creation.
   ========================================================= */

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var googleProvider = new GoogleAuthProvider();

/* -----------------------------------------------------
   SHARED PROFILE CREATION
   Used by both email/password sign up AND a first-time
   Google sign-in. Same lockdown applies either way: role
   can only ever be "student" or "parent" here.
----------------------------------------------------- */
async function createUserProfile({ uid, name, email, role, studentId, className, section, childStudentId }) {
  role = (role || "").toLowerCase();

  if (role !== "student" && role !== "parent") {
    throw new Error("Public sign up only allows student or parent accounts.");
  }

  await setDoc(doc(db, "users", uid), {
    uid: uid,
    name: name,
    email: email,
    role: role,
    studentId: role === "student" ? (studentId || null) : null,
    class: role === "student" ? (className || null) : null,
    section: role === "student" ? (section || null) : null,
    childStudentId: role === "parent" ? (childStudentId || null) : null,
    createdAt: serverTimestamp()
  });
}

/* -----------------------------------------------------
   SIGN UP — Student or Parent only (never staff)
----------------------------------------------------- */
export async function signUpStudentOrParent({ name, email, password, role, studentId, className, section, childStudentId }) {
  var credential = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile({
    uid: credential.user.uid,
    name: name,
    email: email,
    role: role,
    studentId: studentId,
    className: className,
    section: section,
    childStudentId: childStudentId
  });
  return credential.user.uid;
}

/* -----------------------------------------------------
   GOOGLE SIGN-IN
   Opens the Google popup and signs the user in. Does NOT
   create a Firestore profile — the caller must check
   getUserProfile() afterwards; if it's null, this is the
   user's first time and the page must collect role +
   student/parent details, then call
   completeGoogleProfile() below.
----------------------------------------------------- */
export async function signInWithGoogle() {
  var credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function completeGoogleProfile({ uid, name, email, role, studentId, className, section, childStudentId }) {
  await createUserProfile({
    uid: uid,
    name: name,
    email: email,
    role: role,
    studentId: studentId,
    className: className,
    section: section,
    childStudentId: childStudentId
  });
}

/* -----------------------------------------------------
   PROFILE PHOTO UPLOAD
   Shared by all three dashboards. Uploads the chosen file
   to Cloudinary (via the global helper from
   cloudinary-upload.js, which must be loaded as a plain
   <script> tag on the page) then saves the URL on the
   user's Firestore profile.
----------------------------------------------------- */
export async function updateProfilePhoto(uid, file, onProgress) {
  if (!window.uploadFileToCloudinary) {
    throw new Error("Upload helper not loaded. Make sure js/cloudinary-upload.js is included on this page.");
  }
  var result = await window.uploadFileToCloudinary(file, onProgress);
  await updateDoc(doc(db, "users", uid), { photoURL: result.secureUrl });
  return result.secureUrl;
}

/* -----------------------------------------------------
   PARENT ↔ STUDENT LINKING
   ---------------------------------------------------
   1. Every student gets a public studentIndex/{studentId}
      entry at signup, mapping their public SIS ID to their
      Firebase uid (so a parent can find them by ID alone).
   2. A parent sends a link request; the target student must
      accept it before the parent can see any of their real
      data (results, documents). See firestore.rules for the
      server-side enforcement of this.
----------------------------------------------------- */
export async function registerStudentIndex(studentId, uid, name) {
  if (!studentId) return; // no ID given at signup — nothing to index
  await setDoc(doc(db, "studentIndex", studentId), { uid: uid, name: name });
}

export async function sendLinkRequest(parentUid, parentName, studentId) {
  var indexSnap = await getDoc(doc(db, "studentIndex", studentId));
  if (!indexSnap.exists()) {
    throw new Error("No student found with that SIS Student ID. Please check and try again.");
  }
  var studentUid = indexSnap.data().uid;
  var studentName = indexSnap.data().name;
  var requestId = parentUid + "_" + studentUid;

  await setDoc(doc(db, "linkRequests", requestId), {
    parentUid: parentUid,
    parentName: parentName,
    studentUid: studentUid,
    studentName: studentName,
    studentId: studentId,
    status: "pending",
    createdAt: serverTimestamp()
  });

  return requestId;
}

export async function respondToLinkRequest(requestId, accept) {
  await updateDoc(doc(db, "linkRequests", requestId), {
    status: accept ? "accepted" : "rejected"
  });
}

/* -----------------------------------------------------
   LOG IN — used by both the student/parent login page
   and the staff login page. The staff login page adds
   an extra access-code check on top of this (see
   staff-login.html) before granting entry to the
   staff dashboard.
----------------------------------------------------- */
export async function logIn(email, password) {
  var credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logOut() {
  await signOut(auth);
}

/* -----------------------------------------------------
   GET CURRENT USER PROFILE (role, name, etc. from Firestore)
----------------------------------------------------- */
export async function getUserProfile(uid) {
  var snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  var data = snap.data();
  if (data.role) data.role = data.role.toLowerCase();
  return data;
}

/* -----------------------------------------------------
   PAGE GUARD
   Call this at the top of any protected page. It waits
   for Firebase to resolve the auth state, checks the
   user's role in Firestore, and either runs onReady(user,
   profile) or redirects to the given login page.

   Usage:
     requireAuth(["student", "parent"], "student-login.html", function (user, profile) {
       // page-specific code that needs the logged-in user
     });
----------------------------------------------------- */
export function requireAuth(allowedRoles, redirectTo, onReady) {
  auth.authStateReady().then(async function () {
    var user = auth.currentUser;

    if (!user) {
      window.location.href = redirectTo;
      return;
    }

    var profile = await getUserProfile(user.uid);

    if (!profile || allowedRoles.indexOf(profile.role) === -1) {
      // Logged in, but wrong role for this page (e.g. a student
      // trying to open the staff dashboard URL directly).
      window.location.href = redirectTo;
      return;
    }

    onReady(user, profile);
  });
}

/* -----------------------------------------------------
   OPTIONAL AUTH CHECK
   For pages like documents.html / pyq.html that need to
   know who's logged in but should redirect to a login
   chooser if nobody is.
----------------------------------------------------- */
export function onAuthReady(callback) {
  auth.authStateReady().then(async function () {
    var user = auth.currentUser;
    if (!user) {
      callback(null, null);
      return;
    }
    var profile = await getUserProfile(user.uid);
    callback(user, profile);
  });
}
