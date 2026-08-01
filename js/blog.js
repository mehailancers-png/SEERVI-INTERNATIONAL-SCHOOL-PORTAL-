/* =========================================================
   BLOG.JS
   Seervi International School — SIS ERP Portal
   Loads staff-published blog articles live from Firestore.
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
    initBlogPage(user, profile);
  });

  function initBlogPage(user, profile) {
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

    var categoryFilter = document.getElementById('blogCategoryFilter');
    var searchInput    = document.getElementById('blogSearch');
    var grid            = document.getElementById('blogGrid');
    var emptyState       = document.getElementById('blogEmptyState');
    var resultsCount     = document.getElementById('blogResultsCount');

    var allPosts = [];

    var blogQuery = query(collection(db, 'blog'), orderBy('publishedAt', 'desc'));

    onSnapshot(blogQuery, function (snapshot) {
      allPosts = [];
      snapshot.forEach(function (docSnap) {
        var data = docSnap.data();
        data.id = docSnap.id;
        allPosts.push(data);
      });
      renderGrid();
    }, function (err) {
      grid.innerHTML = '';
      resultsCount.innerHTML = 'Could not load the blog right now.<br><small style="color:var(--color-red); font-family:monospace;">' + escapeHtml(err.message) + '</small>';
      console.error('Blog listener error:', err);
    });

    function renderGrid() {
      var categoryVal = categoryFilter.value;
      var searchVal = searchInput.value.trim().toLowerCase();

      var filtered = allPosts.filter(function (p) {
        var matchesCategory = categoryVal === 'all' || p.category === categoryVal;
        var matchesSearch = !searchVal || (p.title || '').toLowerCase().indexOf(searchVal) !== -1;
        return matchesCategory && matchesSearch;
      });

      if (allPosts.length === 0) {
        resultsCount.textContent = 'No articles have been published yet.';
      } else {
        resultsCount.textContent = 'Showing ' + filtered.length + ' of ' + allPosts.length + ' article(s)';
      }

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.hidden = false;
        return;
      }

      emptyState.hidden = true;
      grid.innerHTML = filtered.map(function (p, index) {
        var dateStr = p.publishedAt && p.publishedAt.toDate
          ? p.publishedAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';
        var coverImg = p.coverImageURL
          ? '<img src="' + p.coverImageURL + '" alt="" style="width:100%; height:160px; object-fit:cover; border-radius:var(--radius-md); margin-bottom:14px;">'
          : '';
        var isLong = (p.body || '').length > 220;
        var previewText = isLong ? p.body.slice(0, 220) + '…' : p.body;

        return (
          '<article class="pyq-card" data-post-index="' + index + '">' +
            coverImg +
            '<div class="pyq-card-tags">' +
              '<span class="status-badge gold">' + escapeHtml(p.category || '') + '</span>' +
            '</div>' +
            '<h3>' + escapeHtml(p.title || 'Untitled') + '</h3>' +
            '<p class="pyq-card-meta">' + escapeHtml(p.publishedByName || 'School Office') + ' • ' + dateStr + '</p>' +
            '<p class="blog-body-text" style="white-space:pre-line; flex:1;">' + escapeHtml(previewText) + '</p>' +
            (isLong ? '<button type="button" class="btn btn-ghost btn-sm blog-readmore-btn" data-post-index="' + index + '">Read Full Article</button>' : '') +
          '</article>'
        );
      }).join('');

      grid.querySelectorAll('.blog-readmore-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-post-index'), 10);
          var post = filtered[idx];
          if (!post) return;
          var card = btn.closest('.pyq-card');
          var bodyEl = card.querySelector('.blog-body-text');
          bodyEl.textContent = post.body;
          btn.remove();
        });
      });
    }

    categoryFilter.addEventListener('change', renderGrid);
    searchInput.addEventListener('input', renderGrid);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

});
