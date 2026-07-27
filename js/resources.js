/* =========================================================
   RESOURCES.JS
   Seervi International School — SIS ERP Portal
   Loads teacher-uploaded resources (syllabus, homework,
   book lists, calendars, forms, PDFs, study materials) live
   from Firestore. Gated to any logged-in Student, Parent,
   Staff, or Principal account.
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
    initResourcesPage(user, profile);
  });

  function initResourcesPage(user, profile) {
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

    var classFilter    = document.getElementById('resourceClass');
    var categoryFilter  = document.getElementById('resourceCategory');
    var searchInput     = document.getElementById('resourceSearch');
    var grid             = document.getElementById('resourceGrid');
    var emptyState       = document.getElementById('resourceEmptyState');
    var resultsCount     = document.getElementById('resourceResultsCount');

    var allResources = [];

    var resourceQuery = query(collection(db, 'resources'), orderBy('uploadedAt', 'desc'));

    onSnapshot(resourceQuery, function (snapshot) {
      allResources = [];
      snapshot.forEach(function (docSnap) {
        allResources.push(docSnap.data());
      });
      renderGrid();
    }, function (err) {
      grid.innerHTML = '';
      resultsCount.innerHTML = 'Could not load resources right now.<br><small style="color:var(--color-red); font-family:monospace;">' + escapeHtml(err.message) + '</small>';
      console.error('Resources listener error:', err);
    });

    function renderGrid() {
      var classVal = classFilter.value;
      var categoryVal = categoryFilter.value;
      var searchVal = searchInput.value.trim().toLowerCase();

      var filtered = allResources.filter(function (r) {
        var matchesClass = classVal === 'all' || r.class === classVal || r.class === 'All Classes';
        var matchesCategory = categoryVal === 'all' || r.category === categoryVal;
        var matchesSearch = !searchVal || (r.title || '').toLowerCase().indexOf(searchVal) !== -1;
        return matchesClass && matchesCategory && matchesSearch;
      });

      if (allResources.length === 0) {
        resultsCount.textContent = 'No resources have been uploaded yet.';
      } else {
        resultsCount.textContent = 'Showing ' + filtered.length + ' of ' + allResources.length + ' resource(s)';
      }

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.hidden = false;
        return;
      }

      emptyState.hidden = true;
      grid.innerHTML = filtered.map(function (r) {
        var dateStr = r.uploadedAt && r.uploadedAt.toDate
          ? r.uploadedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';
        return (
          '<article class="pyq-card">' +
            '<div class="pyq-card-tags">' +
              '<span class="status-badge blue">' + escapeHtml(r.class || '') + '</span>' +
              '<span class="status-badge gold">' + escapeHtml(r.category || '') + '</span>' +
            '</div>' +
            '<h3>' + escapeHtml(r.title || 'Untitled Resource') + '</h3>' +
            '<p class="pyq-card-meta">Uploaded ' + dateStr + (r.uploadedByName ? ' by ' + escapeHtml(r.uploadedByName) : '') + '</p>' +
            '<a href="' + r.fileURL + '" target="_blank" rel="noopener" class="btn btn-primary btn-sm ripple">⬇ Download</a>' +
          '</article>'
        );
      }).join('');
    }

    classFilter.addEventListener('change', renderGrid);
    categoryFilter.addEventListener('change', renderGrid);
    searchInput.addEventListener('input', renderGrid);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

});
