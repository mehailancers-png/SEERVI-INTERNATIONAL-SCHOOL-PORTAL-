/* =========================================================
   NOTIFICATIONS.JS
   Seervi International School — SIS ERP Portal
   Shared notification engine. Uses a "fan-out on write" model:
   when staff sends a notification, the list of recipient UIDs
   is resolved and stored directly on the notification document
   (recipientUids array). This lets every dashboard use a single
   simple array-contains query instead of each client having to
   re-derive "is this notification meant for me?" — and lets
   Firestore Security Rules enforce privacy precisely, since the
   rule can just check `request.auth.uid in resource.data.recipientUids`.
   ========================================================= */

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* -----------------------------------------------------
   RESOLVE RECIPIENTS
   Pure client-side helper — given the staff's already-loaded
   list of students/parents, work out which UIDs a given
   audience selection actually means. No extra Firestore
   reads needed since staff already has these lists loaded.
----------------------------------------------------- */
export function resolveRecipients(targetType, targetValue, allStudents, allParents) {
  if (targetType === 'student') {
    return targetValue ? [targetValue] : [];
  }
  if (targetType === 'parent') {
    return targetValue ? [targetValue] : [];
  }
  if (targetType === 'class') {
    return allStudents.filter(function (s) { return s.class === targetValue; }).map(function (s) { return s.uid; });
  }
  if (targetType === 'section') {
    // targetValue is "Class 8|A" style — split it back apart
    var parts = targetValue.split('|');
    var cls = parts[0], sec = parts[1];
    return allStudents.filter(function (s) { return s.class === cls && (s.section || '') === sec; }).map(function (s) { return s.uid; });
  }
  if (targetType === 'allStudents') {
    return allStudents.map(function (s) { return s.uid; });
  }
  if (targetType === 'allParents') {
    return allParents.map(function (p) { return p.uid; });
  }
  if (targetType === 'school') {
    return allStudents.map(function (s) { return s.uid; }).concat(allParents.map(function (p) { return p.uid; }));
  }
  return [];
}

/* -----------------------------------------------------
   SEND NOTIFICATION (staff only — enforced by Firestore rules)
----------------------------------------------------- */
export async function sendNotification({ senderUid, senderName, targetType, targetLabel, recipientUids, title, message }) {
  if (!recipientUids || recipientUids.length === 0) {
    throw new Error('No recipients matched this audience — nothing was sent.');
  }
  await addDoc(collection(db, 'notifications'), {
    senderUid: senderUid,
    senderName: senderName,
    targetType: targetType,
    targetLabel: targetLabel,
    recipientUids: recipientUids,
    title: title,
    message: message,
    readBy: [],
    createdAt: serverTimestamp()
  });
}

/* -----------------------------------------------------
   WATCH MY NOTIFICATIONS (student/parent inbox — live)
----------------------------------------------------- */
export function watchMyNotifications(uid, callback) {
  var q = query(
    collection(db, 'notifications'),
    where('recipientUids', 'array-contains', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, function (snapshot) {
    var list = [];
    snapshot.forEach(function (docSnap) {
      var data = docSnap.data();
      data.id = docSnap.id;
      list.push(data);
    });
    callback(list);
  }, function (err) {
    console.error('Notifications listener error:', err);
    callback([], err);
  });
}

/* -----------------------------------------------------
   WATCH SENT NOTIFICATIONS (staff's own "Recently Sent" list)
----------------------------------------------------- */
export function watchSentNotifications(senderUid, callback) {
  var q = query(
    collection(db, 'notifications'),
    where('senderUid', '==', senderUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, function (snapshot) {
    var list = [];
    snapshot.forEach(function (docSnap) {
      var data = docSnap.data();
      data.id = docSnap.id;
      list.push(data);
    });
    callback(list);
  }, function (err) { console.error('Sent notifications listener error:', err); });
}

/* -----------------------------------------------------
   MARK AS READ
----------------------------------------------------- */
export async function markNotificationRead(notifId, uid) {
  await updateDoc(doc(db, 'notifications', notifId), {
    readBy: arrayUnion(uid)
  });
}

/* -----------------------------------------------------
   WIRE NOTIFICATION BELL
   Handles the entire bell + dropdown UI for a dashboard page.
   Expects these elements to exist on the page:
     #notifBellBtn, #notifDot, #notifDropdown, #notifDropdownList
   Call once per page with the logged-in user's uid.
----------------------------------------------------- */
export function wireNotificationBell(uid) {
  var bellBtn = document.getElementById('notifBellBtn');
  var dot = document.getElementById('notifDot');
  var dropdown = document.getElementById('notifDropdown');
  var list = document.getElementById('notifDropdownList');

  if (!bellBtn) return; // page doesn't have the bell markup

  var isOpen = false;

  function toggleDropdown() {
    isOpen = !isOpen;
    dropdown.hidden = !isOpen;
  }

  bellBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', function (e) {
    if (isOpen && !dropdown.contains(e.target) && e.target !== bellBtn) {
      isOpen = false;
      dropdown.hidden = true;
    }
  });

  watchMyNotifications(uid, function (notifications) {
    var unread = notifications.filter(function (n) { return !(n.readBy || []).includes(uid); });
    dot.hidden = unread.length === 0;

    if (notifications.length === 0) {
      list.innerHTML = '<p class="list-empty-state">No notifications yet.</p>';
      return;
    }

    list.innerHTML = notifications.map(function (n) {
      var isRead = (n.readBy || []).includes(uid);
      var dateStr = n.createdAt && n.createdAt.toDate
        ? n.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        : '';
      return (
        '<div class="notif-item' + (isRead ? '' : ' unread') + '" data-id="' + n.id + '">' +
          '<p class="notif-item-title">' + escapeHtmlLocal(n.title) + '</p>' +
          '<p class="notif-item-message">' + escapeHtmlLocal(n.message) + '</p>' +
          '<p class="notif-item-meta">' + escapeHtmlLocal(n.senderName || 'Staff') + ' • ' + dateStr + '</p>' +
        '</div>'
      );
    }).join('');

    list.querySelectorAll('.notif-item').forEach(function (item) {
      item.addEventListener('click', function () {
        markNotificationRead(item.getAttribute('data-id'), uid).catch(function (err) {
          console.error('Could not mark as read:', err);
        });
      });
    });
  });
}

function escapeHtmlLocal(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
