/* =========================================================
   FEEDBACK.JS
   Seervi International School — SIS ERP Portal
   Feedback & Contact system, built as a 2-way conversation
   thread reachable from a chat-style trigger button next to
   the notification bell — not a separate ticket dashboard
   panel. This module is fully self-contained: calling
   wireFeedbackUI(user, profile) once injects its own trigger
   button and modal into the page, so no HTML duplication is
   needed across student-dashboard.html / parent-portal.html /
   staff-dashboard.html / principal-dashboard.html.
   ========================================================= */

import { db } from "./firebase-config.js";
import { sendNotification } from "./notifications.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var CATEGORIES = ['Suggestion', 'Complaint', 'Technical Issue', 'Academic Issue', 'Teacher Related', 'General Feedback'];

/* -----------------------------------------------------
   SEQUENTIAL TICKET NUMBER (transaction-safe)
----------------------------------------------------- */
async function getNextTicketNumber() {
  var counterRef = doc(db, "counters", "feedback");
  var next = await runTransaction(db, async function (transaction) {
    var snap = await transaction.get(counterRef);
    var current = snap.exists() ? (snap.data().value || 0) : 0;
    var updated = current + 1;
    transaction.set(counterRef, { value: updated });
    return updated;
  });
  return "TKT-" + String(next).padStart(6, "0");
}

/* -----------------------------------------------------
   DATA FUNCTIONS
----------------------------------------------------- */
async function createTicket({ uid, name, role, category, subject, firstMessage }) {
  var ticketNumber = await getNextTicketNumber();
  var docRef = await addDoc(collection(db, "feedback"), {
    ticketNumber: ticketNumber,
    submittedByUid: uid,
    submittedByName: name,
    submittedByRole: role,
    category: category,
    subject: subject,
    status: "open",
    messages: [{ senderUid: uid, senderName: name, senderRole: role, text: firstMessage, sentAt: new Date().toISOString() }],
    submittedAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp()
  });
  return { id: docRef.id, ticketNumber: ticketNumber };
}

async function sendMessage({ ticketId, ticket, senderUid, senderName, senderRole, text }) {
  await updateDoc(doc(db, "feedback", ticketId), {
    messages: arrayUnion({ senderUid: senderUid, senderName: senderName, senderRole: senderRole, text: text, sentAt: new Date().toISOString() }),
    lastUpdatedAt: serverTimestamp()
  });

  // Parent Transparency principle: when STAFF replies, notify the
  // submitter automatically. When the submitter sends a follow-up,
  // staff are expected to check the thread themselves (this ticket
  // is visible to all staff already), so no notification is sent
  // the other direction — avoids spamming every teacher for every
  // message in every open conversation.
  if (senderRole !== ticket.submittedByRole || senderUid !== ticket.submittedByUid) {
    try {
      await sendNotification({
        senderUid: senderUid,
        senderName: senderName,
        targetType: ticket.submittedByRole === "parent" ? "parent" : "student",
        targetLabel: ticket.submittedByName || "User",
        recipientUids: [ticket.submittedByUid],
        title: "Reply on Ticket " + ticket.ticketNumber,
        message: text.length > 120 ? text.slice(0, 120) + "…" : text,
        ticketId: ticketId
      });
    } catch (notifyErr) {
      console.error("Could not send ticket reply notification:", notifyErr);
    }
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  await updateDoc(doc(db, "feedback", ticketId), {
    status: newStatus,
    lastUpdatedAt: serverTimestamp()
  });
}

function watchMyTickets(uid, callback) {
  var q = query(collection(db, "feedback"), where("submittedByUid", "==", uid), orderBy("submittedAt", "desc"));
  return onSnapshot(q, function (snapshot) {
    var list = [];
    snapshot.forEach(function (d) { var data = d.data(); data.id = d.id; list.push(data); });
    callback(list);
  }, function (err) { console.error("My tickets listener error:", err); callback([], err); });
}

function watchAllTickets(callback) {
  var q = query(collection(db, "feedback"), orderBy("submittedAt", "desc"));
  return onSnapshot(q, function (snapshot) {
    var list = [];
    snapshot.forEach(function (d) { var data = d.data(); data.id = d.id; list.push(data); });
    callback(list);
  }, function (err) { console.error("All tickets listener error:", err); callback([], err); });
}

/* -----------------------------------------------------
   SHARED HTML ESCAPE
----------------------------------------------------- */
function esc(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* -----------------------------------------------------
   MAIN ENTRY POINT — call once per dashboard page
----------------------------------------------------- */
export function wireFeedbackUI(user, profile) {
  var isStaffView = profile.role === 'staff' || profile.role === 'principal';
  var currentTickets = [];
  var openTicketId = null;

  /* ---------- inject trigger button ---------- */
  var headerActions = document.querySelector('.header-actions');
  if (!headerActions) return; // page doesn't have the expected header shell

  var triggerBtn = document.createElement('button');
  triggerBtn.className = 'notif-bell-btn';
  triggerBtn.setAttribute('aria-label', 'Feedback & Contact');
  triggerBtn.innerHTML = '💬';
  headerActions.insertBefore(triggerBtn, headerActions.firstChild);

  /* ---------- inject modal ---------- */
  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'feedbackModal';
  modal.innerHTML =
    '<div class="modal-box" style="max-width:560px; text-align:left; max-height:80vh; display:flex; flex-direction:column;">' +
      '<div id="feedbackModalListView">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">' +
          '<h3 style="margin:0;">' + (isStaffView ? 'Feedback & Tickets' : 'Feedback & Contact') + '</h3>' +
          '<button type="button" class="upload-file-remove" id="feedbackModalCloseBtn" aria-label="Close">✕</button>' +
        '</div>' +
        (isStaffView ? '' :
          '<button type="button" class="btn btn-primary btn-sm ripple" id="feedbackNewTicketBtn" style="margin-bottom:16px; width:100%;">+ New Ticket</button>'
        ) +
        '<div id="feedbackNewTicketForm" hidden style="margin-bottom:16px; text-align:left;">' +
          '<div class="form-group" style="margin-bottom:10px;">' +
            '<label for="feedbackCategorySelect">Category</label>' +
            '<select id="feedbackCategorySelect">' +
              CATEGORIES.map(function (c) { return '<option>' + c + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:10px;">' +
            '<label for="feedbackSubjectInput">Subject</label>' +
            '<input type="text" id="feedbackSubjectInput" placeholder="Brief summary">' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:10px;">' +
            '<label for="feedbackMessageInput">Message</label>' +
            '<textarea id="feedbackMessageInput" rows="3" placeholder="Describe it..."></textarea>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm ripple" id="feedbackCreateSubmitBtn">Submit Ticket</button>' +
        '</div>' +
        '<div id="feedbackTicketList" style="overflow-y:auto; max-height:50vh;"><p class="list-empty-state">Loading...</p></div>' +
      '</div>' +
      '<div id="feedbackModalThreadView" hidden style="display:flex; flex-direction:column; flex:1; min-height:0;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="feedbackBackBtn">← Back</button>' +
          '<button type="button" class="upload-file-remove" id="feedbackModalCloseBtn2" aria-label="Close">✕</button>' +
        '</div>' +
        '<div id="feedbackThreadHeader" style="margin-bottom:12px;"></div>' +
        '<div id="feedbackThreadMessages" style="flex:1; overflow-y:auto; padding-right:4px; margin-bottom:12px;"></div>' +
        '<div style="display:flex; gap:8px;">' +
          '<textarea id="feedbackReplyInput" rows="2" placeholder="Type a message..." style="flex:1; padding:10px 14px; border:2px solid var(--color-border); border-radius:6px; font-family:var(--font-main);"></textarea>' +
          '<button type="button" class="btn btn-primary btn-sm ripple" id="feedbackSendBtn">Send</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var listView = document.getElementById('feedbackModalListView');
  var threadView = document.getElementById('feedbackModalThreadView');
  var ticketListEl = document.getElementById('feedbackTicketList');

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    showListView();
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  function showListView() {
    threadView.hidden = true;
    listView.hidden = false;
    openTicketId = null;
  }

  triggerBtn.addEventListener('click', openModal);
  document.getElementById('feedbackModalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('feedbackModalCloseBtn2').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.getElementById('feedbackBackBtn').addEventListener('click', showListView);

  /* ---------- new ticket (student/parent only) ---------- */
  if (!isStaffView) {
    var newTicketBtn = document.getElementById('feedbackNewTicketBtn');
    var newTicketForm = document.getElementById('feedbackNewTicketForm');
    newTicketBtn.addEventListener('click', function () {
      newTicketForm.hidden = !newTicketForm.hidden;
    });

    document.getElementById('feedbackCreateSubmitBtn').addEventListener('click', async function () {
      var category = document.getElementById('feedbackCategorySelect').value;
      var subject = document.getElementById('feedbackSubjectInput').value.trim();
      var message = document.getElementById('feedbackMessageInput').value.trim();
      if (!subject || !message) { alert('Please fill in subject and message.'); return; }

      var btn = this;
      btn.disabled = true;
      try {
        await createTicket({ uid: user.uid, name: profile.name, role: profile.role, category: category, subject: subject, firstMessage: message });
        document.getElementById('feedbackSubjectInput').value = '';
        document.getElementById('feedbackMessageInput').value = '';
        newTicketForm.hidden = true;
      } catch (err) {
        alert('Could not submit: ' + err.message);
      }
      btn.disabled = false;
    });
  }

  /* ---------- ticket list rendering ---------- */
  function statusBadgeClass(status) {
    return status === 'resolved' ? 'green' : status === 'in_progress' ? 'gold' : 'blue';
  }

  function renderTicketList() {
    if (currentTickets.length === 0) {
      ticketListEl.innerHTML = '<p class="list-empty-state">' + (isStaffView ? 'No tickets submitted yet.' : 'You haven\'t submitted any tickets yet.') + '</p>';
      return;
    }
    ticketListEl.innerHTML = currentTickets.map(function (t) {
      var lastMsg = t.messages && t.messages.length ? t.messages[t.messages.length - 1] : null;
      return (
        '<div class="notice-item" style="cursor:pointer;" data-ticket-id="' + t.id + '">' +
          '<span class="notice-item-icon">🎫</span>' +
          '<div style="flex:1;">' +
            '<div style="display:flex; justify-content:space-between; gap:8px;">' +
              '<h4>' + esc(t.ticketNumber) + ' — ' + esc(t.subject) + '</h4>' +
              '<span class="status-badge ' + statusBadgeClass(t.status) + '">' + esc((t.status || 'open').replace('_', ' ')) + '</span>' +
            '</div>' +
            '<p>' + esc(t.category) + (isStaffView ? ' • ' + esc(t.submittedByName) : '') + '</p>' +
            (lastMsg ? '<p style="opacity:0.75;">' + esc(lastMsg.text.slice(0, 60)) + (lastMsg.text.length > 60 ? '…' : '') + '</p>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('');

    ticketListEl.querySelectorAll('[data-ticket-id]').forEach(function (item) {
      item.addEventListener('click', function () { openThread(item.getAttribute('data-ticket-id')); });
    });
  }

  /* ---------- thread view ---------- */
  function openThread(ticketId) {
    var ticket = currentTickets.find(function (t) { return t.id === ticketId; });
    if (!ticket) return;
    openTicketId = ticketId;
    listView.hidden = true;
    threadView.hidden = false;
    renderThread(ticket);
  }

  function renderThread(ticket) {
    var statusControl = isStaffView
      ? '<select id="feedbackStatusSelect" style="padding:6px 10px; border:2px solid var(--color-border); border-radius:6px; font-size:12px;">' +
          ['open', 'in_progress', 'resolved'].map(function (s) {
            return '<option value="' + s + '"' + (s === ticket.status ? ' selected' : '') + '>' + s.replace('_', ' ') + '</option>';
          }).join('') +
        '</select>'
      : '<span class="status-badge ' + statusBadgeClass(ticket.status) + '">' + esc((ticket.status || 'open').replace('_', ' ')) + '</span>';

    document.getElementById('feedbackThreadHeader').innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding-bottom:10px; border-bottom:1px solid var(--color-border);">' +
        '<div><h4 style="color:var(--color-primary);">' + esc(ticket.ticketNumber) + ' — ' + esc(ticket.subject) + '</h4>' +
        '<p style="font-size:12px; color:var(--color-text-muted);">' + esc(ticket.category) + (isStaffView ? ' • ' + esc(ticket.submittedByName) : '') + '</p></div>' +
        statusControl +
      '</div>';

    if (isStaffView) {
      document.getElementById('feedbackStatusSelect').addEventListener('change', async function () {
        try { await updateTicketStatus(ticket.id, this.value); } catch (err) { alert('Could not update status: ' + err.message); }
      });
    }

    var messagesEl = document.getElementById('feedbackThreadMessages');
    messagesEl.innerHTML = (ticket.messages || []).map(function (m) {
      var isMine = m.senderUid === user.uid;
      return (
        '<div style="margin-bottom:10px; text-align:' + (isMine ? 'right' : 'left') + ';">' +
          '<div style="display:inline-block; max-width:80%; padding:10px 14px; border-radius:12px; background-color:' + (isMine ? 'var(--color-primary)' : 'var(--color-bg)') + '; color:' + (isMine ? '#fff' : 'var(--color-text)') + ';">' +
            '<p style="font-size:11px; opacity:0.8; margin-bottom:3px;">' + esc(m.senderName) + '</p>' +
            '<p>' + esc(m.text) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  document.getElementById('feedbackSendBtn').addEventListener('click', async function () {
    var input = document.getElementById('feedbackReplyInput');
    var text = input.value.trim();
    if (!text || !openTicketId) return;
    var ticket = currentTickets.find(function (t) { return t.id === openTicketId; });
    if (!ticket) return;

    var btn = this;
    btn.disabled = true;
    try {
      await sendMessage({ ticketId: openTicketId, ticket: ticket, senderUid: user.uid, senderName: profile.name, senderRole: profile.role, text: text });
      input.value = '';
    } catch (err) {
      alert('Could not send: ' + err.message);
    }
    btn.disabled = false;
  });

  /* ---------- live data ---------- */
  var watcher = isStaffView ? watchAllTickets : function (cb) { return watchMyTickets(user.uid, cb); };
  watcher(function (tickets) {
    currentTickets = tickets;
    if (!threadView.hidden && openTicketId) {
      var updated = tickets.find(function (t) { return t.id === openTicketId; });
      if (updated) renderThread(updated);
    }
    if (!listView.hidden) renderTicketList();
  });

  /* ---------- deep-link from a notification click ---------- */
  window.__openFeedbackThread = function (ticketId) {
    openModal();
    openThread(ticketId);
  };
}
