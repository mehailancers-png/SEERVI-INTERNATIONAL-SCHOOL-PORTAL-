# SIS ERP Portal

**Official School ERP Portal — Seervi International School**  
Jaitaran, Beawar, Rajasthan

A production-ready web portal for students, parents, and staff: results, documents, attendance, homework, appointments, notifications, and school content — built without heavy frameworks.

**Live:** [mehailancers-png.github.io/SEERVI-INTERNATIONAL-SCHOOL-PORTAL-](https://mehailancers-png.github.io/SEERVI-INTERNATIONAL-SCHOOL-PORTAL-/)

---

## Highlights

| Area | What it delivers |
|------|------------------|
| **Multi-role access** | Student, Parent, Staff, Principal — role-based dashboards |
| **Academic utilities** | Results search & view, attendance, homework, PYQs |
| **Documents** | Secure upload, status tracking (pending / verified / rejected) |
| **Parent linking** | Parent requests link to child via SIS Student ID; student approves |
| **Appointments** | Parents book meetings with school staff |
| **Notifications & feedback** | In-app alerts and support tickets |
| **Bilingual UI** | Hindi + English on **utility** pages (forms, dashboards, status) |
| **School showcase** | Home, news, blog, media, resources — presentation-first |
| **Stack** | HTML5 · CSS3 · Vanilla JS · Firebase Auth + Firestore · Cloudinary |

No React/Vue build step. Deployable on **GitHub Pages**.

---

## Who uses what

| Role | How access is granted | Main capabilities |
|------|----------------------|-------------------|
| **Student** | Self sign-up (email/password or Google) | Own results, attendance, homework, documents, parent link requests, profile |
| **Parent** | Self sign-up | Link child, view child’s results/docs/attendance/homework, book appointment |
| **Staff** | Not self-serve staff signup — account promoted in Firestore + Staff Access Code | Students, verify documents, upload results/PYQs/resources, homework, news, notifications |
| **Principal** | Staff-level access with principal dashboard | School-wide overview and admin flows |

Server-side access is enforced with **Firestore security rules**; the Staff Access Code is an extra front-door check on the staff login page.

---

## Tech stack

```
Frontend     HTML5, CSS3, Vanilla JavaScript
Auth         Firebase Authentication (Email/Password + Google)
Database     Cloud Firestore
Files        Cloudinary (unsigned preset — avoids Firebase Storage Blaze requirement)
Hosting      GitHub Pages
i18n         Custom phrase dictionary (js/i18n.js) — utility pages only
```

---

## Repository layout

```
SEERVI-INTERNATIONAL-SCHOOL-PORTAL-/
├── index.html                 # School home & showcase
├── results.html               # Public + logged-in results
├── documents.html             # Document upload & tracking
├── pyq.html                   # Previous year question papers
├── resources.html             # Syllabus, forms, study material
├── news.html · blog.html · media.html
├── appointment.html           # Parent appointment booking
├── student-login.html · staff-login.html
├── student-dashboard.html · parent-portal.html
├── staff-dashboard.html · principal-dashboard.html
├── css/style.css
├── js/
│   ├── firebase-config.js · auth.js · script.js · i18n.js
│   ├── cloudinary-upload.js
│   ├── results.js · documents.js · appointment.js · …
│   └── *-dashboard.js · *-login.js
├── assets/
│   ├── logo.png
│   └── Images/                # hero, gallery, facilities, etc.
├── firestore.rules            # Paste into Firebase Console (not auto-deployed)
└── README.md
```

---

## Core features (detail)

### Students
- Dashboard: results, attendance, homework, documents, profile photo  
- Approve / reject parent link requests  
- Upload documents and track verification status  

### Parents
- Link to child with **SIS Student ID** (pending until student accepts)  
- Live view of child’s results, attendance, homework, documents after link  
- Book appointments with preferred date/time and purpose  

### Staff / Principal
- Verify or reject documents with optional rejection reason  
- Upload / manage academic content (results, PYQs, resources, homework)  
- Publish news / media metadata flows from dashboard panels  
- Send notifications; handle feedback tickets  

### Public
- Search results by Roll Number or SIS ID + class  
- Browse PYQs, resources, news, blog, media  
- School presentation on the home page  

### Language (i18n)
- Toggle **EN / हिं** in the header  
- **Utility pages** fully supported in natural Hindi phrases  
- **Index & cosmetic pages** stay English for presentation (by design)  
- IDs, names, emails, and file names are never force-translated  

---

## Firestore collections (overview)

| Collection | Purpose |
|------------|---------|
| `users` | Profile: name, email, role, studentId, class, photoURL, … |
| `documents` | Uploads + status + review metadata |
| `results` | Subject-wise marks / overall status (as published by staff) |
| `attendance` | Session / monthly attendance records |
| `homework` | Assignments and due dates |
| `linkRequests` | Parent ↔ student linking workflow |
| `appointments` | Parent meeting requests |
| `pyqs` · resources · news · blog · media | Content modules |
| `notifications` · feedback/tickets | Alerts and support |

Exact field shapes live in the corresponding `js/*.js` modules.

---

## Setup checklist

1. **Firebase**  
   - Create project → enable **Authentication** (Email/Password + Google)  
   - Create **Firestore** database  
   - Add GitHub Pages domain under Authorized domains  
   - Paste `firestore.rules` → Publish  

2. **Config**  
   - Put Firebase web config in `js/firebase-config.js`  

3. **Cloudinary**  
   - Unsigned upload preset  
   - Cloud name + preset in `js/cloudinary-upload.js`  

4. **Staff bootstrap**  
   - Create a normal account, then set `role: "staff"` (or principal) on the user doc in Firestore  
   - Align Staff Access Code with `js/staff-login.js`  

5. **Indexes**  
   - First filtered/sorted query may require a composite index — use the console link Firebase prints once  

6. **Assets**  
   - `assets/logo.png`  
   - `assets/Images/` — e.g. `hero-banner.png`, gallery, facilities (paths are case-sensitive; folder is `Images`)  

7. **Deploy**  
   - Push to `main`; GitHub Pages serves the site  

---

## Design notes

- School palette: primary blue `#0B3D91`, accent gold `#D4AF37`  
- Responsive layout for mobile and desktop  
- Circular logo treatment in header / sidebar / footer  
- Utility-first Hindi; no mixed marketing-copy translations on showcase pages  

---

## Credits

**Seervi International School** — Jaitaran, Beawar, Rajasthan  

Portal engineering & delivery for the school ERP initiative.

---

## License

All rights reserved © Seervi International School.  
Use of this portal and branding is limited to the school’s authorized deployment unless otherwise agreed.
