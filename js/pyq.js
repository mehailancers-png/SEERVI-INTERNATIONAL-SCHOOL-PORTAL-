/* =========================================================
   PYQ.JS
   Seervi International School — SIS ERP Portal
   Loads teacher-uploaded PYQ papers live from Firestore.
   Gated to any logged-in Student, Parent, or Staff account.
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
    initPyqPage(user, profile);
  });

  function initPyqPage(user, profile) {
    document.getElementById('authStatusName').textContent = profile.name || 'User';
    document.getElementById('authStatusRole').textContent =
      profile.role === 'student' ? 'Student' : profile.role === 'parent' ? 'Parent' : 'Staff';
    document.getElementById('authStatusDashboardLink').href =
      profile.role === 'student' ? 'student-dashboard.html' :
      profile.role === 'parent' ? 'parent-portal.html' : 'staff-dashboard.html';

    document.getElementById('authStatusLogout').addEventListener('click', async function () {
      await logOut();
      window.location.href = 'student-login.html';
    });

    var classFilter  = document.getElementById('pyqClass');
    var subjectFilter = document.getElementById('pyqSubject');
    var searchInput  = document.getElementById('pyqSearch');
    var grid         = document.getElementById('pyqGrid');
    var emptyState   = document.getElementById('pyqEmptyState');
    var resultsCount = document.getElementById('pyqResultsCount');

    var allPyqs = [];

    var pyqQuery = query(collection(db, 'pyqs'), orderBy('uploadedAt', 'desc'));

    onSnapshot(pyqQuery, function (snapshot) {
      allPyqs = [];
      snapshot.forEach(function (docSnap) {
        allPyqs.push(docSnap.data());
      });
      renderGrid();
    }, function (err) {
      grid.innerHTML = '';
      resultsCount.textContent = 'Could not load question papers right now.';
      console.error('PYQ listener error:', err);
    });

    function renderGrid() {
      var classVal = classFilter.value;
      var subjectVal = subjectFilter.value;
      var searchVal = searchInput.value.trim().toLowerCase();

      var filtered = allPyqs.filter(function (p) {
        var matchesClass = classVal === 'all' || p.class === classVal;
        var matchesSubject = subjectVal === 'all' || p.subject === subjectVal;
        var matchesSearch = !searchVal || (p.title || '').toLowerCase().indexOf(searchVal) !== -1;
        return matchesClass && matchesSubject && matchesSearch;
      });

      if (allPyqs.length === 0) {
        resultsCount.textContent = 'No question papers have been uploaded yet.';
      } else {
        resultsCount.textContent = 'Showing ' + filtered.length + ' of ' + allPyqs.length + ' paper(s)';
      }

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.hidden = false;
        return;
      }

      emptyState.hidden = true;
      grid.innerHTML = filtered.map(function (p) {
        var dateStr = p.uploadedAt && p.uploadedAt.toDate
          ? p.uploadedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';
        return (
          '<article class="pyq-card">' +
            '<div class="pyq-card-tags">' +
              '<span class="status-badge blue">' + escapeHtml(p.class || '') + '</span>' +
              '<span class="status-badge gold">' + escapeHtml(p.subject || '') + '</span>' +
            '</div>' +
            '<h3>' + escapeHtml(p.title || 'Untitled Paper') + '</h3>' +
            '<p class="pyq-card-meta">Uploaded ' + dateStr + (p.uploadedByName ? ' by ' + escapeHtml(p.uploadedByName) : '') + '</p>' +
            '<a href="' + p.fileURL + '" target="_blank" rel="noopener" class="btn btn-primary btn-sm ripple">⬇ Download</a>' +
          '</article>'
        );
      }).join('');
    }

    classFilter.addEventListener('change', renderGrid);
    subjectFilter.addEventListener('change', renderGrid);
    searchInput.addEventListener('input', renderGrid);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

});
