/* =========================================================
   RESULTS.JS — Results Page Logic (Frontend Demo Only)
   Seervi International School — SIS ERP Portal
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var searchTabs   = document.querySelectorAll('.search-tab');
  var rollPanel    = document.querySelector('[data-panel="roll"]');
  var sisPanel     = document.querySelector('[data-panel="sis"]');
  var searchForm   = document.getElementById('resultSearchForm');
  var resultWrapper = document.getElementById('resultCardWrapper');

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
     DEMO RESULT DATA (Frontend only — no backend yet)
  ----------------------------------------------------- */
  var demoSubjects = [
    { name: 'English',        max: 100 },
    { name: 'Hindi',          max: 100 },
    { name: 'Mathematics',    max: 100 },
    { name: 'Science',       max: 100 },
    { name: 'Social Science', max: 100 }
  ];

  function gradeFor(marks, max) {
    var pct = (marks / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 75) return 'A';
    if (pct >= 60) return 'B';
    if (pct >= 45) return 'C';
    if (pct >= 33) return 'D';
    return 'E';
  }

  function generateDemoMarks() {
    return demoSubjects.map(function (subject) {
      var marks = Math.floor(45 + Math.random() * 55); // demo range 45-99
      return {
        name: subject.name,
        marks: marks,
        max: subject.max,
        grade: gradeFor(marks, subject.max)
      };
    });
  }

  /* -----------------------------------------------------
     FORM SUBMIT — Render the demo result card
     (Runs alongside the generic validation in script.js;
      script.js prevents real submission, this fills the card.)
  ----------------------------------------------------- */
  searchForm.addEventListener('submit', function () {
    // Basic manual validation check (script.js already validated required fields)
    var activeTab = document.querySelector('.search-tab.active').getAttribute('data-tab');
    var idValue = activeTab === 'roll'
      ? document.getElementById('rollNumber').value.trim()
      : document.getElementById('sisId').value.trim();
    var classValue = document.getElementById('resultClass').value;

    if (!idValue || !classValue) {
      return; // let script.js handle showing the error state
    }

    var subjects = generateDemoMarks();
    var total = subjects.reduce(function (sum, s) { return sum + s.marks; }, 0);
    var maxTotal = subjects.reduce(function (sum, s) { return sum + s.max; }, 0);
    var percentage = ((total / maxTotal) * 100).toFixed(1);
    var overallPass = subjects.every(function (s) { return (s.marks / s.max) * 100 >= 33; });

    // Populate header
    document.getElementById('resultStudentName').textContent = 'Demo Student';
    document.getElementById('resultStudentMeta').textContent =
      (activeTab === 'roll' ? 'Roll No: ' : 'SIS ID: ') + idValue + ' | Class: ' + classValue;

    var badge = document.getElementById('resultStatusBadge');
    badge.textContent = overallPass ? 'PASS' : 'FAIL';
    badge.className = 'result-status-badge ' + (overallPass ? 'pass' : 'fail');

    // Populate table
    var tbody = document.getElementById('resultTableBody');
    tbody.innerHTML = '';
    subjects.forEach(function (s) {
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + s.name + '</td>' +
        '<td>' + s.marks + '</td>' +
        '<td>' + s.max + '</td>' +
        '<td>' + s.grade + '</td>';
      tbody.appendChild(row);
    });

    document.getElementById('resultTotal').textContent = total + ' / ' + maxTotal;
    document.getElementById('resultPercentage').textContent = percentage + '%';

    // Reveal result card
    resultWrapper.hidden = false;
    resultWrapper.classList.add('in-view');
    resultWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Stash data on the button for the download handler
    var downloadBtn = document.getElementById('downloadResultBtn');
    downloadBtn.dataset.studentId = idValue;
    downloadBtn.dataset.studentClass = classValue;
    downloadBtn.dataset.total = total;
    downloadBtn.dataset.maxTotal = maxTotal;
    downloadBtn.dataset.percentage = percentage;
    downloadBtn.dataset.status = overallPass ? 'PASS' : 'FAIL';
    downloadBtn.dataset.subjects = JSON.stringify(subjects);
  });

  /* -----------------------------------------------------
     DOWNLOAD RESULT (Frontend-only text file simulation)
  ----------------------------------------------------- */
  var downloadBtn = document.getElementById('downloadResultBtn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      var subjects = JSON.parse(downloadBtn.dataset.subjects || '[]');

      var lines = [];
      lines.push('SEERVI INTERNATIONAL SCHOOL — RESULT SLIP (DEMO)');
      lines.push('Jaitaran, Beawar, Rajasthan');
      lines.push('----------------------------------------------------');
      lines.push('Student ID: ' + downloadBtn.dataset.studentId);
      lines.push('Class: ' + downloadBtn.dataset.studentClass);
      lines.push('Status: ' + downloadBtn.dataset.status);
      lines.push('----------------------------------------------------');
      lines.push('Subject               Marks     Max      Grade');

      subjects.forEach(function (s) {
        lines.push(
          s.name.padEnd(20, ' ') + '  ' +
          String(s.marks).padEnd(8, ' ') +
          String(s.max).padEnd(8, ' ') +
          s.grade
        );
      });

      lines.push('----------------------------------------------------');
      lines.push('Total: ' + downloadBtn.dataset.total + ' / ' + downloadBtn.dataset.maxTotal);
      lines.push('Percentage: ' + downloadBtn.dataset.percentage + '%');
      lines.push('');
      lines.push('This is a frontend-generated demo slip and is not an official document.');

      var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Result_' + (downloadBtn.dataset.studentId || 'demo') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

});
