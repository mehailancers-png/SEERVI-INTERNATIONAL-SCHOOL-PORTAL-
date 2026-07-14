/* =========================================================
   DOCUMENTS.JS — Documents Page Logic (Frontend Demo Only)
   Seervi International School — SIS ERP Portal
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var dropzone     = document.getElementById('uploadDropzone');
  var fileInput    = document.getElementById('documentFileInput');
  var selectedFile = document.getElementById('uploadSelectedFile');
  var fileNameEl   = document.getElementById('uploadFileName');
  var removeBtn    = document.getElementById('uploadFileRemove');
  var uploadForm   = document.getElementById('documentUploadForm');
  var documentsList = document.getElementById('documentsList');

  if (!dropzone) return; // Not on documents.html

  /* -----------------------------------------------------
     DROPZONE — click to open file picker
  ----------------------------------------------------- */
  dropzone.addEventListener('click', function () {
    fileInput.click();
  });

  dropzone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  /* -----------------------------------------------------
     DRAG & DROP
  ----------------------------------------------------- */
  ['dragenter', 'dragover'].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', function (e) {
    var files = e.dataTransfer.files;
    if (files && files.length) {
      fileInput.files = files;
      showSelectedFile(files[0]);
    }
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files.length) {
      showSelectedFile(fileInput.files[0]);
    }
  });

  function showSelectedFile(file) {
    fileNameEl.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
    selectedFile.hidden = false;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  removeBtn.addEventListener('click', function () {
    fileInput.value = '';
    selectedFile.hidden = true;
  });

  /* -----------------------------------------------------
     FORM SUBMIT — Add a demo entry to the document list
     (script.js already runs generic validation + preventDefault)
  ----------------------------------------------------- */
  uploadForm.addEventListener('submit', function () {
    if (!fileInput.files || !fileInput.files.length) return;
    var docType = document.getElementById('documentType').value;
    if (!docType) return;

    var file = fileInput.files[0];
    var today = new Date();
    var dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    var item = document.createElement('article');
    item.className = 'document-item';
    item.innerHTML =
      '<div class="document-item-main">' +
        '<span class="document-item-icon">📄</span>' +
        '<div>' +
          '<h4>' + docType + '</h4>' +
          '<p>Uploaded on ' + dateStr + ' • ' + file.name + '</p>' +
        '</div>' +
      '</div>' +
      '<span class="doc-status-badge pending">Pending</span>';

    documentsList.insertBefore(item, documentsList.firstChild);

    // Reset the form UI
    uploadForm.reset();
    fileInput.value = '';
    selectedFile.hidden = true;
  });

});
