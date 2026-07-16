/* =========================================================
   FIREBASE-CONFIG.JS
   Seervi International School — SIS ERP Portal
   Initializes Firebase App, Auth, Firestore, and Storage.
   Imported as a module by every page that needs Firebase.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDalVP7WawE1ZNQQZsCSTCoJ--GE0oC0qg",
  authDomain: "sis-portal-567f4.firebaseapp.com",
  projectId: "sis-portal-567f4",
  storageBucket: "sis-portal-567f4.firebasestorage.app",
  messagingSenderId: "840793545597",
  appId: "1:840793545597:web:9660239de54f086ca88a14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Shared instances used across all pages
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Explicit persistence — without this, the session can fail to
// survive the full-page navigation from login.html to the
// dashboard pages in some browser contexts (in-app webviews,
// storage-partitioned browsers), causing an immediate bounce
// back to the login page even after a successful sign-in.
setPersistence(auth, browserLocalPersistence);
