/* =========================================================
   RESULTS.JS
   Seervi International School — SIS ERP Portal
   Public results lookup — no login required, matching how
   real school/government result portals work. Searches the
   real 'results' collection (uploaded by staff) by either
   Roll Number or SIS Student ID.
   ========================================================= */

import { db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

  var searchTabs    = document.querySelectorAll('.search-tab');
  var rollPanel     = document.querySelector('[data-panel="roll"]');
  var sisPanel      = document.querySelector('[data-panel="sis"]');
  var searchForm    = document.getElementById('resultSearchForm');
  var resultWrapper = document.getElementById('resultCardWrapper');
  var submitBtn     = document.getElementById('resultSearchSubmitBtn');

  if (!searchForm) return; // Not on results.html

  /* -----------------------------------------------------
     TAB SWITCHING: Roll Number vs SIS ID
  ----------------------------------------------------- */
  searchTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      searchTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      var mode = tab.getAttribute('data-tab');

      if (mode === 'roll') {
        rollPanel.style.display = '';
        sisPanel.style.display = 'none';
        document.getElementById('rollNumber').setAttribute('required', 'required');
        document.getElementById('sisId').removeAttribute('required');
      } else {
        rollPanel.style.display = 'none';
        sisPanel.style.display = '';
        document.getElementById('sisId').setAttribute('required', 'required');
        document.getElementById('rollNumber').removeAttribute('required');
      }
    });
  });

  /* -----------------------------------------------------
     FORM SUBMIT — real Firestore lookup
  ----------------------------------------------------- */
  searchForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var activeTab = document.querySelector('.search-tab.active').getAttribute('data-tab');
    var idValue = activeTab === 'roll'
      ? document.getElementById('rollNumber').value.trim()
      : document.getElementById('sisId').value.trim();
    var classValue = document.getElementById('resultClass').value;

    if (!idValue) {
      alert(activeTab === 'roll' ? 'Please enter a roll number.' : 'Please enter a SIS ID.');
      return;
    }
    if (!classValue) {
      alert('Please select a class.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-label').textContent = 'Searching...';
    resultWrapper.hidden = true;

    try {
      var fieldName = activeTab === 'roll' ? 'rollNumber' : 'studentId';
      var q = query(collection(db, 'results'), where(fieldName, '==', idValue));
      var snapshot = await getDocs(q);

      if (snapshot.empty) {
        showNotFound(activeTab, idValue);
        return;
      }

      // If multiple matched (shouldn't normally happen), prefer one
      // whose class matches what was selected.
      var matchDoc = snapshot.docs[0];
      snapshot.forEach(function (docSnap) {
        if (docSnap.data().class === classValue) matchDoc = docSnap;
      });

      var data = matchDoc.data();

      if (data.class && data.class !== classValue) {
        var proceed = confirm(
          'A result was found for this ID, but under "' + data.class + '" instead of "' + classValue +
          '". Show it anyway?'
        );
        if (!proceed) {
          submitBtn.disabled = false;
          submitBtn.querySelector('.btn-label').textContent = 'Search Result';
          return;
        }
      }

      renderResult(data, activeTab, idValue);

    } catch (err) {
      console.error(err);
      alert('Could not search right now: ' + err.message);
    }

    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-label').textContent = 'Search Result';
  });

  function showNotFound(activeTab, idValue) {
    resultWrapper.hidden = false;
    resultWrapper.classList.add('in-view');
    document.getElementById('resultCard').innerHTML =
      '<div style="padding:40px; text-align:center;">' +
        '<p style="font-size:15px; color:var(--color-text-muted);">' +
        'No result found for ' + (activeTab === 'roll' ? 'Roll Number' : 'SIS ID') +
        ' <strong>' + escapeHtml(idValue) + '</strong>. ' +
        'The result may not have been published yet, or the ID may be incorrect.' +
        '</p>' +
      '</div>';
    resultWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderResult(data, activeTab, idValue) {
    // Rebuild the card in case a previous "not found" state overwrote it
    document.getElementById('resultCard').innerHTML =
      '<div class="result-card-header">' +
        '<div class="result-student-info">' +
          '<h3 id="resultStudentName"></h3>' +
          '<p id="resultStudentMeta"></p>' +
        '</div>' +
        '<span class="result-status-badge" id="resultStatusBadge"></span>' +
      '</div>' +
      '<div class="result-table-wrapper">' +
        '<table class="result-table" id="resultTable">' +
          '<thead><tr><th>Subject</th><th>Marks Obtained</th><th>Max Marks</th><th>Grade</th></tr></thead>' +
          '<tbody id="resultTableBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="result-card-footer">' +
        '<div class="result-total">' +
          '<span>Total: <strong id="resultTotal">—</strong></span>' +
          '<span>Percentage: <strong id="resultPercentage">—</strong></span>' +
        '</div>' +
        '<button class="btn btn-accent ripple" id="downloadResultBtn" type="button">⬇ Download Result</button>' +
      '</div>';

    var subjects = data.subjects || [];
    var total = subjects.reduce(function (sum, s) { return sum + (s.marks || 0); }, 0);
    var maxTotal = subjects.reduce(function (sum, s) { return sum + (s.max || 0); }, 0);
    var percentage = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : '0';
    var overallPass = subjects.every(function (s) { return s.max > 0 && (s.marks / s.max) * 100 >= 33; });

    document.getElementById('resultStudentName').textContent = data.studentName || 'Student';
    document.getElementById('resultStudentMeta').textContent =
      (data.rollNumber ? 'Roll No: ' + data.rollNumber + ' | ' : '') +
      (data.studentId ? 'SIS ID: ' + data.studentId + ' | ' : '') +
      'Class: ' + (data.class || '—');

    var badge = document.getElementById('resultStatusBadge');
    badge.textContent = overallPass ? 'PASS' : 'FAIL';
    badge.className = 'result-status-badge ' + (overallPass ? 'pass' : 'fail');

    document.getElementById('resultTableBody').innerHTML = subjects.map(function (s) {
      var grade = gradeFor(s.marks, s.max);
      return '<tr><td>' + escapeHtml(s.name) + '</td><td>' + s.marks + '</td><td>' + s.max + '</td><td>' + grade + '</td></tr>';
    }).join('');

    document.getElementById('resultTotal').textContent = total + ' / ' + maxTotal;
    document.getElementById('resultPercentage').textContent = percentage + '%';

    resultWrapper.hidden = false;
    resultWrapper.classList.add('in-view');
    resultWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });

    var downloadBtn = document.getElementById('downloadResultBtn');
    downloadBtn.addEventListener('click', function () {
      downloadResultSlip(data, subjects, total, maxTotal, percentage, overallPass);
    });
  }

  function gradeFor(marks, max) {
    var pct = (marks / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 75) return 'A';
    if (pct >= 60) return 'B';
    if (pct >= 45) return 'C';
    if (pct >= 33) return 'D';
    return 'E';
  }

  function downloadResultSlip(data, subjects, total, maxTotal, percentage, overallPass) {
    var lines = [];
    lines.push('SEERVI INTERNATIONAL SCHOOL — RESULT SLIP');
    lines.push('Jaitaran, Beawar, Rajasthan');
    lines.push('----------------------------------------------------');
    lines.push('Student Name: ' + (data.studentName || '—'));
    if (data.rollNumber) lines.push('Roll Number: ' + data.rollNumber);
    if (data.studentId) lines.push('SIS ID: ' + data.studentId);
    lines.push('Class: ' + (data.class || '—'));
    lines.push('Status: ' + (overallPass ? 'PASS' : 'FAIL'));
    lines.push('----------------------------------------------------');
    lines.push('Subject               Marks     Max      Grade');

    subjects.forEach(function (s) {
      lines.push(
        (s.name || '').padEnd(20, ' ') + '  ' +
        String(s.marks).padEnd(8, ' ') +
        String(s.max).padEnd(8, ' ') +
        gradeFor(s.marks, s.max)
      );
    });

    lines.push('----------------------------------------------------');
    lines.push('Total: ' + total + ' / ' + maxTotal);
    lines.push('Percentage: ' + percentage + '%');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Result_' + (data.studentId || data.rollNumber || 'student') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

});
