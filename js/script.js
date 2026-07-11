/* =========================================================
   SIS ERP PORTAL — SCRIPT.JS
   Seervi International School, Jaitaran, Beawar, Rajasthan
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* =====================================================
     1. SIDEBAR TOGGLE + OVERLAY
  ===================================================== */
  var hamburgerBtn   = document.getElementById('hamburgerBtn');
  var sidebar        = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  var sidebarClose   = document.getElementById('sidebarClose');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    sidebar.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // Move focus into the sidebar for keyboard/screen-reader users
    var firstLink = sidebar.querySelector('.sidebar-link');
    if (firstLink) firstLink.focus();
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    sidebar.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburgerBtn.focus();
  }

  function isSidebarOpen() {
    return sidebar && sidebar.classList.contains('open');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      isSidebarOpen() ? closeSidebar() : openSidebar();
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  // Overlay click closes sidebar
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // ESC key closes sidebar
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isSidebarOpen()) {
      closeSidebar();
    }
  });

  // Close sidebar automatically when a nav link is clicked (mobile UX)
  var sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeSidebar();
    });
  });

  /* =====================================================
     2. HEADER — TRANSPARENT TO SOLID ON SCROLL
  ===================================================== */
  var siteHeader = document.getElementById('siteHeader');
  var scrollThreshold = 60;

  function handleHeaderScroll() {
    if (!siteHeader) return;
    if (window.scrollY > scrollThreshold) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll(); // run once on load in case page is refreshed mid-scroll

  /* =====================================================
     3. BACK TO TOP BUTTON
  ===================================================== */
  var backToTopBtn = document.getElementById('backToTop');

  function handleBackToTopVisibility() {
    if (!backToTopBtn) return;
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleBackToTopVisibility, { passive: true });
  handleBackToTopVisibility();

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =====================================================
     4. SCROLL REVEAL ANIMATIONS
  ===================================================== */
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show everything immediately if IntersectionObserver unsupported
    revealEls.forEach(function (el) {
      el.classList.add('in-view');
    });
  }

  /* =====================================================
     5. RIPPLE EFFECT ON BUTTONS
  ===================================================== */
  var rippleButtons = document.querySelectorAll('.ripple');

  rippleButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var rect = btn.getBoundingClientRect();
      var circle = document.createElement('span');
      var diameter = Math.max(rect.width, rect.height);
      var radius = diameter / 2;

      circle.style.width = circle.style.height = diameter + 'px';
      circle.style.left = (e.clientX - rect.left - radius) + 'px';
      circle.style.top = (e.clientY - rect.top - radius) + 'px';
      circle.classList.add('ripple-effect');

      var existingRipple = btn.querySelector('.ripple-effect');
      if (existingRipple) existingRipple.remove();

      btn.appendChild(circle);

      circle.addEventListener('animationend', function () {
        circle.remove();
      });
    });
  });

  /* =====================================================
     6. ACTIVE MENU HIGHLIGHTING (based on current page)
  ===================================================== */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.sidebar-link').forEach(function (link) {
    var linkPage = link.getAttribute('href');
    link.classList.remove('active');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* =====================================================
     7. GENERIC FORM VALIDATION
     Works for any form with [data-validate] attribute.
     Individual pages (appointment, login forms, etc.) can
     reuse this by adding data-validate to their <form> tag
     and required/data-error attributes to fields.
  ===================================================== */
  var validatableForms = document.querySelectorAll('form[data-validate]');

  validatableForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var isValid = true;
      var fields = form.querySelectorAll('[required]');

      fields.forEach(function (field) {
        clearFieldError(field);

        var value = field.value.trim();
        var fieldValid = true;

        if (value === '') {
          fieldValid = false;
        } else if (field.type === 'email' && !isValidEmail(value)) {
          fieldValid = false;
        } else if (field.type === 'tel' && !isValidPhone(value)) {
          fieldValid = false;
        }

        if (!fieldValid) {
          isValid = false;
          showFieldError(field);
        }
      });

      if (!isValid) {
        e.preventDefault();
      } else {
        // Frontend-only: prevent actual submission, show success modal instead
        e.preventDefault();
        var successModal = document.getElementById('successModal');
        if (successModal) {
          openModal(successModal);
          form.reset();
        }
      }
    });

    // Clear error state as user types
    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('input', function () {
        clearFieldError(field);
      });
    });
  });

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value) {
    return /^[0-9]{10}$/.test(value.replace(/\D/g, ''));
  }

  function showFieldError(field) {
    field.classList.add('input-error');
    var errorEl = field.parentElement.querySelector('.field-error-message');
    if (errorEl) {
      errorEl.style.display = 'block';
    }
  }

  function clearFieldError(field) {
    field.classList.remove('input-error');
    var errorEl = field.parentElement.querySelector('.field-error-message');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  /* =====================================================
     8. MODAL HELPERS (Success Modal, etc.)
  ===================================================== */
  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Wire up any element with [data-modal-close] inside a .modal
  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.querySelectorAll('[data-modal-close]').forEach(function (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeModal(modal);
      });
    });

    // Click outside modal content closes it
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // ESC closes any open modal too
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(function (modal) {
        closeModal(modal);
      });
    }
  });

  // Expose modal helpers globally for page-specific scripts (e.g. appointment.html)
  window.SIS = window.SIS || {};
  window.SIS.openModal = openModal;
  window.SIS.closeModal = closeModal;

});
