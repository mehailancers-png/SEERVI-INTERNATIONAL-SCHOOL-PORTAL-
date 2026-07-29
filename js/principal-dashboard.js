/* =========================================================
   PRINCIPAL-DASHBOARD.JS
   Seervi International School — SIS ERP Portal
   ========================================================= */

import { requireAuth, logOut } from "./auth.js";
import { wireNotificationBell } from "./notifications.js";
import { wireFeedbackUI } from "./feedback.js";
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var mainContent = document.getElementById('main-content');

  requireAuth(['principal'], 'staff-login.html', function (user, profile) {
    authGuard.hidden = true;
    mainContent.hidden = false;
    initPrincipalDashboard(user, profile);
  });

  function initPrincipalDashboard(user, profile) {
    wireNotificationBell(user.uid);
    wireFeedbackUI(user, profile);
    document.getElementById('navName').textContent = profile.name || 'Principal';
    document.getElementById('navAvatar').textContent = (profile.name || 'P').charAt(0).toUpperCase();

    document.getElementById('logoutBtn').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'staff-login.html';
    });

    /* =====================================================
       TOP-LEVEL STATS — Students, Parents, Teachers, Classes
    ===================================================== */
    onSnapshot(collection(db, 'users'), function (snapshot) {
      var studentCount = 0, parentCount = 0, teacherCount = 0;
      var classesSeen = {};

      snapshot.forEach(function (docSnap) {
        var d = docSnap.data();
        if (d.role === 'student') {
          studentCount++;
          if (d.class) classesSeen[d.class] = true;
        } else if (d.role === 'parent') {
          parentCount++;
        } else if (d.role === 'staff') {
          teacherCount++;
        }
      });

      document.getElementById('statTotalStudents').textContent = studentCount;
      document.getElementById('statTotalParents').textContent = parentCount;
      document.getElementById('statTotalTeachers').textContent = teacherCount;
      document.getElementById('statTotalClasses').textContent = Object.keys(classesSeen).length;
    }, function (err) { console.error('Users listener error:', err); });

    /* =====================================================
       PENDING DOCUMENTS / APPOINTMENTS
    ===================================================== */
    onSnapshot(collection(db, 'documents'), function (snapshot) {
      var pending = 0;
      snapshot.forEach(function (docSnap) { if (docSnap.data().status === 'pending') pending++; });
      document.getElementById('statPendingDocsP').textContent = pending;
    }, function (err) { console.error('Documents listener error:', err); });

    onSnapshot(collection(db, 'appointments'), function (snapshot) {
      var pending = 0;
      snapshot.forEach(function (docSnap) { if (docSnap.data().status === 'pending') pending++; });
      document.getElementById('statPendingApptsP').textContent = pending;
    }, function (err) { console.error('Appointments listener error:', err); });

    /* =====================================================
       RECENT NOTIFICATIONS (school-wide oversight)
    ===================================================== */
    var notifQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
    onSnapshot(notifQuery, function (snapshot) {
      var list = document.getElementById('principalNotificationsList');
      if (snapshot.empty) {
        list.innerHTML = '<p class="list-empty-state">No notifications sent yet.</p>';
        return;
      }
      list.innerHTML = snapshot.docs.map(function (docSnap) {
        var n = docSnap.data();
        var dateStr = n.createdAt && n.createdAt.toDate
          ? n.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Just now';
        return (
          '<div class="notice-item">' +
            '<span class="notice-item-icon">📢</span>' +
            '<div><h4>' + escapeHtml(n.title) + '</h4>' +
            '<p>' + escapeHtml(n.senderName || 'Staff') + ' → ' + escapeHtml(n.targetLabel || '') + ' (' + (n.recipientUids ? n.recipientUids.length : 0) + ' recipients) • ' + dateStr + '</p></div>' +
          '</div>'
        );
      }).join('');
    }, function (err) {
      console.error('Notifications listener error:', err);
      document.getElementById('principalNotificationsList').innerHTML =
        '<p class="list-empty-state" style="color:var(--color-red); font-family:monospace; font-size:11px;">' + escapeHtml(err.message) + '</p>';
    });

    /* =====================================================
       LATEST SCHOOL NEWS
    ===================================================== */
    var newsQuery = query(collection(db, 'news'), orderBy('publishedAt', 'desc'), limit(5));
    onSnapshot(newsQuery, function (snapshot) {
      var list = document.getElementById('principalNewsList');
      if (snapshot.empty) {
        list.innerHTML = '<p class="list-empty-state">Nothing published yet.</p>';
        return;
      }
      list.innerHTML = snapshot.docs.map(function (docSnap) {
        var n = docSnap.data();
        var dateStr = n.publishedAt && n.publishedAt.toDate
          ? n.publishedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Just now';
        return (
          '<div class="notice-item">' +
            '<span class="notice-item-icon">📰</span>' +
            '<div><h4>' + escapeHtml(n.title) + '</h4>' +
            '<p>' + escapeHtml(n.type || '') + ' • ' + escapeHtml(n.publishedByName || '') + ' • ' + dateStr + '</p></div>' +
          '</div>'
        );
      }).join('');
    }, function (err) {
      console.error('News listener error:', err);
      document.getElementById('principalNewsList').innerHTML =
        '<p class="list-empty-state" style="color:var(--color-red); font-family:monospace; font-size:11px;">' + escapeHtml(err.message) + '</p>';
    });

    /* =====================================================
       RECENT FEEDBACK
    ===================================================== */
    var feedbackQuery = query(collection(db, 'feedback'), orderBy('submittedAt', 'desc'), limit(5));
    onSnapshot(feedbackQuery, function (snapshot) {
      var list = document.getElementById('principalFeedbackList');
      if (snapshot.empty) {
        list.innerHTML = '<p class="list-empty-state">No tickets submitted yet.</p>';
        return;
      }
      list.innerHTML = snapshot.docs.map(function (docSnap) {
        var t = docSnap.data();
        var statusClass = t.status === 'resolved' ? 'green' : t.status === 'in_progress' ? 'gold' : 'blue';
        return (
          '<div class="notice-item">' +
            '<span class="notice-item-icon">🎫</span>' +
            '<div><h4>' + escapeHtml(t.ticketNumber) + ' — ' + escapeHtml(t.subject) + '</h4>' +
            '<p>' + escapeHtml(t.category) + ' • ' + escapeHtml(t.submittedByName || '') + ' • <span class="status-badge ' + statusClass + '">' + escapeHtml((t.status || 'open').replace('_', ' ')) + '</span></p></div>' +
          '</div>'
        );
      }).join('');
    }, function (err) {
      console.error('Feedback listener error:', err);
      document.getElementById('principalFeedbackList').innerHTML =
        '<p class="list-empty-state" style="color:var(--color-red); font-family:monospace; font-size:11px;">' + escapeHtml(err.message) + '</p>';
    });

    /* =====================================================
       LATEST ACTIVITY — merged recent items across collections
       (one-time fetch; this is a snapshot-in-time feed, not
       real-time, to keep the page lightweight)
    ===================================================== */
    loadActivityFeed();

    async function loadActivityFeed() {
      var activityList = document.getElementById('principalActivityList');
      try {
        var items = [];

        var docsSnap = await getDocs(query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'), limit(5)));
        docsSnap.forEach(function (d) {
          var v = d.data();
          items.push({
            icon: '📄',
            text: (v.studentName || 'A student') + ' uploaded ' + (v.docType || 'a document') + ' (' + (v.status || 'pending') + ')',
            date: v.uploadedAt
          });
        });

        var apptSnap = await getDocs(query(collection(db, 'appointments'), orderBy('createdAt', 'desc'), limit(5)));
        apptSnap.forEach(function (d) {
          var v = d.data();
          items.push({
            icon: '📅',
            text: (v.parentName || 'A parent') + ' requested an appointment — ' + (v.purpose || '') + ' (' + (v.status || 'pending') + ')',
            date: v.createdAt
          });
        });

        var hwSnap = await getDocs(query(collection(db, 'homework'), orderBy('createdAt', 'desc'), limit(5)));
        hwSnap.forEach(function (d) {
          var v = d.data();
          items.push({
            icon: '📚',
            text: (v.createdByName || 'A teacher') + ' assigned homework "' + (v.title || '') + '" to ' + (v.class || ''),
            date: v.createdAt
          });
        });

        items.sort(function (a, b) {
          var aTime = a.date && a.date.toMillis ? a.date.toMillis() : 0;
          var bTime = b.date && b.date.toMillis ? b.date.toMillis() : 0;
          return bTime - aTime;
        });

        items = items.slice(0, 10);

        if (items.length === 0) {
          activityList.innerHTML = '<p class="list-empty-state">No recent activity yet.</p>';
          return;
        }

        activityList.innerHTML = items.map(function (item) {
          var dateStr = item.date && item.date.toDate
            ? item.date.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';
          return (
            '<div class="notice-item">' +
              '<span class="notice-item-icon">' + item.icon + '</span>' +
              '<div><p>' + escapeHtml(item.text) + '</p><p style="font-size:11px; opacity:0.7;">' + dateStr + '</p></div>' +
            '</div>'
          );
        }).join('');

      } catch (err) {
        console.error('Activity feed error:', err);
        activityList.innerHTML =
          '<p class="list-empty-state" style="color:var(--color-red); font-family:monospace; font-size:11px;">' + escapeHtml(err.message) + '</p>';
      }
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

});
