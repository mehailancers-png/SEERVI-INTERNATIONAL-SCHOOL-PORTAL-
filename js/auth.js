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
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* -----------------------------------------------------
   SIGN UP — Student or Parent only (never staff)
----------------------------------------------------- */
export async function signUpStudentOrParent({ name, email, password, role, studentId, className, childStudentId }) {
  if (role !== "student" && role !== "parent") {
    throw new Error("Public sign up only allows student or parent accounts.");
  }

  var credential = await createUserWithEmailAndPassword(auth, email, password);
  var uid = credential.user.uid;

  await setDoc(doc(db, "users", uid), {
    name: name,
    email: email,
    role: role,
    studentId: role === "student" ? (studentId || null) : null,
    class: role === "student" ? (className || null) : null,
    childStudentId: role === "parent" ? (childStudentId || null) : null,
    createdAt: serverTimestamp()
  });

  return uid;
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
  return snap.data();
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
  onAuthStateChanged(auth, async function (user) {
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
  onAuthStateChanged(auth, async function (user) {
    if (!user) {
      callback(null, null);
      return;
    }
    var profile = await getUserProfile(user.uid);
    callback(user, profile);
  });
}
