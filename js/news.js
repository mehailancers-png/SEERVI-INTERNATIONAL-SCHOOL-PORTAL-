/* =========================================================
   NEWS.JS
   Seervi International School — SIS ERP Portal
   Loads staff-published news/announcements/circulars/
   press releases/e-newsletters live from Firestore.
   Gated to any logged-in account.
   ========================================================= */

import { onAuthReady, logOut } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var authGuard = document.getElementById('authGuard');
  var pageContent = document.getElementById('pageContent');

  onAuthReady(function (user, profile) {
    if (!user || !profile) {
      window.location.href = 'student-login.html';
      return;
    }

    authGuard.hidden = true;
    pageContent.hidden = false;
    initNewsPage(user, profile);
  });

  function initNewsPage(user, profile) {
    document.getElementById('authStatusName').textContent = profile.name || 'User';
    document.getElementById('authStatusRole').textContent =
      profile.role === 'student' ? 'Student' :
      profile.role === 'parent' ? 'Parent' :
      profile.role === 'principal' ? 'Principal' : 'Staff';
    document.getElementById('authStatusDashboardLink').href =
      profile.role === 'student' ? 'student-dashboard.html' :
      profile.role === 'parent' ? 'parent-portal.html' :
      profile.role === 'principal' ? 'principal-dashboard.html' : 'staff-dashboard.html';

    document.getElementById('authStatusLogout').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'student-login.html';
    });

    var typeFilter   = document.getElementById('newsTypeFilter');
    var searchInput  = document.getElementById('newsSearch');
    var listEl       = document.getElementById('newsList');
    var emptyState   = document.getElementById('newsEmptyState');
    var resultsCount = document.getElementById('newsResultsCount');

    var allNews = [];

    var newsQuery = query(collection(db, 'news'), orderBy('publishedAt', 'desc'));

    onSnapshot(newsQuery, function (snapshot) {
      allNews = [];
      snapshot.forEach(function (docSnap) { allNews.push(docSnap.data()); });
      renderList();
    }, function (err) {
      listEl.innerHTML = '';
      resultsCount.innerHTML = 'Could not load news right now.<br><small style="color:var(--color-red); font-family:monospace;">' + escapeHtml(err.message) + '</small>';
      console.error('News listener error:', err);
    });

    function renderList() {
      var typeVal = typeFilter.value;
      var searchVal = searchInput.value.trim().toLowerCase();

      var filtered = allNews.filter(function (n) {
        var matchesType = typeVal === 'all' || n.type === typeVal;
        var matchesSearch = !searchVal || (n.title || '').toLowerCase().indexOf(searchVal) !== -1;
        return matchesType && matchesSearch;
      });

      if (allNews.length === 0) {
        resultsCount.textContent = 'No news has been published yet.';
      } else {
        resultsCount.textContent = 'Showing ' + filtered.length + ' of ' + allNews.length + ' item(s)';
      }

      if (filtered.length === 0) {
        listEl.innerHTML = '';
        emptyState.hidden = false;
        return;
      }

      emptyState.hidden = true;
      listEl.innerHTML = filtered.map(function (n) {
        var dateStr = n.publishedAt && n.publishedAt.toDate
          ? n.publishedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';
        var isVideo = n.fileName && /\.(mp4|mov|avi|webm)$/i.test(n.fileName);
        var attachment = '';
        if (n.fileURL && isVideo) {
          attachment = '<video controls style="width:100%; max-width:100%; border-radius:var(--radius-md); margin-top:14px;"><source src="' + n.fileURL + '"></video>';
        } else if (n.fileURL) {
          attachment = '<a href="' + n.fileURL + '" target="_blank" rel="noopener" class="btn btn-primary btn-sm ripple" style="margin-top:14px;">⬇ Download ' + escapeHtml(n.fileName || 'Attachment') + '</a>';
        }
        return (
          '<article class="dashboard-card" style="margin-bottom:0;">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:12px;">' +
              '<h3 style="color:var(--color-primary); font-size:18px;">' + escapeHtml(n.title || 'Untitled') + '</h3>' +
              '<span class="status-badge gold">' + escapeHtml(n.type || '') + '</span>' +
            '</div>' +
            '<p style="font-size:13px; color:var(--color-text-muted); margin-bottom:12px;">' + escapeHtml(n.publishedByName || 'School Office') + ' • ' + dateStr + '</p>' +
            '<p style="white-space:pre-line;">' + escapeHtml(n.body || '') + '</p>' +
            attachment +
          '</article>'
        );
      }).join('');
    }

    typeFilter.addEventListener('change', renderList);
    searchInput.addEventListener('input', renderList);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

});
