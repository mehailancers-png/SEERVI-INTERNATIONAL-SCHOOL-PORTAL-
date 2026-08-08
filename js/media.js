/* =========================================================
   MEDIA.JS — Media Centre browse/lightbox
   Supports filtering by Class + Event + Search
   ========================================================= */
import { onAuthReady, logOut } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {
  var authGuard = document.getElementById('authGuard');
  var pageContent = document.getElementById('pageContent');

  onAuthReady(function (user, profile) {
    if (!user || !profile) { window.location.href = 'student-login.html'; return; }
    authGuard.hidden = true;
    pageContent.hidden = false;
    init(user, profile);
  });

  function init(user, profile) {
    document.getElementById('authStatusName').textContent = profile.name || 'User';
    document.getElementById('authStatusRole').textContent =
      profile.role === 'student' ? 'Student' : profile.role === 'parent' ? 'Parent' :
      profile.role === 'principal' ? 'Principal' : 'Staff';
    document.getElementById('authStatusDashboardLink').href =
      profile.role === 'student' ? 'student-dashboard.html' : profile.role === 'parent' ? 'parent-portal.html' :
      profile.role === 'principal' ? 'principal-dashboard.html' : 'staff-dashboard.html';
    document.getElementById('authStatusLogout').addEventListener('click', async function () {
      await logOut(); window.location.href = 'student-login.html';
    });

    var classFilter = document.getElementById('mediaClassFilter');
    var eventFilter = document.getElementById('mediaEventFilter');
    var searchInput = document.getElementById('mediaSearch');
    var grid = document.getElementById('mediaGrid');
    var emptyState = document.getElementById('mediaEmptyState');
    var resultsCount = document.getElementById('mediaResultsCount');
    var lightbox = document.getElementById('mediaLightbox');
    var lightboxContent = document.getElementById('mediaLightboxContent');

    document.getElementById('mediaLightboxClose').addEventListener('click', function () {
      lightbox.classList.remove('open'); lightboxContent.innerHTML = '';
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { lightbox.classList.remove('open'); lightboxContent.innerHTML = ''; }
    });

    var allMedia = [];

    onSnapshot(query(collection(db, 'media'), orderBy('uploadedAt', 'desc')), function (snapshot) {
      allMedia = [];
      snapshot.forEach(function (d) { allMedia.push(d.data()); });
      render();
    }, function (err) {
      grid.innerHTML = '';
      resultsCount.innerHTML = 'Could not load media right now.<br><small style="color:var(--color-red); font-family:monospace;">' + escapeHtml(err.message) + '</small>';
      console.error('Media listener error:', err);
    });

    function render() {
      var classVal = classFilter.value;
      var evVal = eventFilter.value;
      var searchVal = searchInput.value.trim().toLowerCase();

      var filtered = allMedia.filter(function (m) {
        var matchesClass = classVal === 'all' || (m.class || '') === classVal;
        var matchesEvent = evVal === 'all' || (m.event || '') === evVal;
        var matchesSearch = !searchVal || (m.title || '').toLowerCase().indexOf(searchVal) !== -1;
        return matchesClass && matchesEvent && matchesSearch;
      });

      resultsCount.textContent = allMedia.length === 0
        ? 'No media uploaded yet.'
        : 'Showing ' + filtered.length + ' of ' + allMedia.length + ' item(s)';

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.hidden = false;
        return;
      }
      emptyState.hidden = true;

      grid.innerHTML = filtered.map(function (m, i) {
        var isVideo = m.mediaType === 'video';
        var thumb = isVideo
          ? '<div style="width:100%; height:150px; background:var(--color-bg); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-size:32px;">🎬</div>'
          : '<img src="' + m.fileURL + '" alt="" style="width:100%; height:150px; object-fit:cover; border-radius:var(--radius-md);">';
        var meta = [m.class, m.event].filter(Boolean).join(' • ');
        return (
          '<div class="pyq-card media-item" data-index="' + i + '" style="cursor:pointer; padding:14px;">' +
            thumb +
            '<h3 style="font-size:14px; margin-top:10px;">' + escapeHtml(m.title || 'Untitled') + '</h3>' +
            '<p class="pyq-card-meta">' + escapeHtml(meta) + '</p>' +
          '</div>'
        );
      }).join('');

      grid.querySelectorAll('.media-item').forEach(function (el) {
        el.addEventListener('click', function () {
          var m = filtered[parseInt(el.getAttribute('data-index'), 10)];
          if (!m) return;
          lightboxContent.innerHTML = m.mediaType === 'video'
            ? '<video controls autoplay style="width:100%; border-radius:var(--radius-md);"><source src="' + m.fileURL + '"></video>'
            : '<img src="' + m.fileURL + '" style="width:100%; border-radius:var(--radius-md);">';
          var meta = [m.class, m.event].filter(Boolean).join(' • ');
          lightboxContent.innerHTML +=
            '<h3 style="margin-top:14px;">' + escapeHtml(m.title || '') + '</h3>' +
            '<p class="pyq-card-meta">' + escapeHtml(meta) + '</p>';
          lightbox.classList.add('open');
        });
      });
    }

    classFilter.addEventListener('change', render);
    eventFilter.addEventListener('change', render);
    searchInput.addEventListener('input', render);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
});
