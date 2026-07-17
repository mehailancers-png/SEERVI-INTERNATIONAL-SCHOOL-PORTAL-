/* =========================================================
   CLOUDINARY-UPLOAD.JS
   Seervi International School — SIS ERP Portal
   Shared file-upload helper. Files go straight from the
   browser to Cloudinary (free tier, no card required);
   only the returned URL + metadata get saved in Firestore.
   ========================================================= */

var CLOUDINARY_CLOUD_NAME = "iiyugxww";
var CLOUDINARY_UPLOAD_PRESET = "SIS-PORTAL";
var CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/auto/upload";

/**
 * Uploads a single File object to Cloudinary.
 * Returns a promise resolving to:
 *   { url, secureUrl, publicId, format, bytes, originalFilename }
 *
 * onProgress (optional) receives a 0-100 number as the
 * upload progresses, so callers can show a progress bar.
 */
function uploadFileToCloudinary(file, onProgress) {
  return new Promise(function (resolve, reject) {
    var formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_UPLOAD_URL, true);

    xhr.upload.addEventListener("progress", function (e) {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        var response = JSON.parse(xhr.responseText);
        resolve({
          url: response.url,
          secureUrl: response.secure_url,
          publicId: response.public_id,
          format: response.format,
          bytes: response.bytes,
          originalFilename: response.original_filename
        });
      } else {
        reject(new Error("Cloudinary upload failed (" + xhr.status + "). Check your cloud name and upload preset."));
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error while uploading to Cloudinary."));
    };

    xhr.send(formData);
  });
}

// Exposed globally since this file is loaded as a plain
// (non-module) script alongside the Firebase modules.
window.uploadFileToCloudinary = uploadFileToCloudinary;
