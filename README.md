# SIS ERP Portal v1.0

Official ERP Portal for **Seervi International School**, Jaitaran, Beawar, Rajasthan.

Built with plain HTML5, CSS3, and vanilla JavaScript — no frameworks — backed by **Firebase** (Authentication + Firestore) and **Cloudinary** (file storage).

---

## Folder Structure

```
SIS-ERP-Portal/
├── index.html
├── results.html
├── documents.html
├── pyq.html
├── appointment.html
├── student-login.html
├── student-dashboard.html
├── parent-portal.html
├── staff-login.html
├── staff-dashboard.html
├── firestore.rules          (paste into Firebase Console, not deployed via this repo)
├── css/
│   └── style.css
├── js/
│   ├── script.js             (shared sidebar/header/scroll logic)
│   ├── firebase-config.js    (Firebase initialization)
│   ├── auth.js                (shared auth + role engine)
│   ├── cloudinary-upload.js  (shared file upload helper)
│   ├── results.js
│   ├── documents.js
│   ├── pyq.js
│   ├── appointment.js
│   ├── student-login.js
│   ├── staff-login.js
│   ├── student-dashboard.js
│   ├── parent-portal.js
│   └── staff-dashboard.js
└── README.md
```

## Roles

| Role | How created | Access |
|---|---|---|
| **Student** | Self sign-up (email/password or Google) | Own results, documents, PYQs, profile |
| **Parent** | Self sign-up (email/password or Google) | Child's documents, appointments, notices |
| **Staff** | Never self-registered — sign up as student/parent first, then an admin manually sets `role: staff` in Firestore Console | Full access: all students, verify/reject documents, upload PYQs, manage appointments |

Staff login also requires a **Staff Access Code** (see `js/staff-login.js`) as a front-door deterrent, on top of the real server-side role check enforced by `firestore.rules`.

## Data Model (Firestore)

- **users/{uid}** — `name, email, role, studentId, class, childStudentId, createdAt`
- **documents/{id}** — `studentUid, studentId, studentName, docType, fileName, fileURL, status (pending/verified/rejected), uploadedAt, reviewedBy, reviewedAt`
- **pyqs/{id}** — `title, class, subject, fileName, fileURL, uploadedByUid, uploadedByName, uploadedAt`
- **appointments/{id}** — `parentUid, parentName, childName, purpose, preferredDate, preferredTime, message, status (pending/approved/rejected), createdAt`

## File Storage

Handled by **Cloudinary** (not Firebase Storage, to avoid the paid Blaze plan). Files upload directly from the browser; only the returned URL is saved in Firestore.

## Setup Checklist

1. Firebase Console → Authentication → Sign-in method → enable **Email/Password** and **Google**
2. Firebase Console → Authentication → Settings → Authorized domains → add your GitHub Pages domain
3. Firebase Console → Firestore Database → Rules → paste `firestore.rules` → Publish
4. Cloudinary → create an **unsigned** upload preset, plug cloud name + preset into `js/cloudinary-upload.js`
5. First time each Firestore query with a filter + sort runs, check the browser console — Firebase may show a link to auto-create a required composite index. Click it once and the query works permanently after.

## Known Limitations / Not Yet Built

- Notices/announcements system (placeholder only)
- Direct parent↔student account linking (parent currently matches by typed Student ID, not a real database relationship)
- Results are demo/frontend-only on the public search page — not yet tied to real Firestore-backed grades
- Attendance and Homework panels are UI shells awaiting a real data source

## Credits

Built for Seervi International School, Jaitaran, Beawar, Rajasthan.
