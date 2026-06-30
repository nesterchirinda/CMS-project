// CONTAINER: Web Application [Container: HTML, CSS, JS]
// PURPOSE: Handles all API calls, DOM updates and screen routing for consumer and agent use interfaces (US001, US002, US006)

(function () {
  'use strict';

  // module-level state: token and user persisted for duration of session
  let authToken = null;
  let currentUser = null;
  let assigningComplaintId = null; // tracks which complaint the assign modal is open for


  // shorthand for document.getElementById - used throughout to keep DOM calls concise
  function $(id) { return document.getElementById(id); }

  // shows one screen and hides the others, called after login and logout
  function showScreen(id) {
    ['login-screen', 'consumer-screen', 'agent-screen'].forEach(function (s) {
      var el = $(s);
      if (el) el.classList.toggle('hidden', s !== id);
    });
  }


  // sets or clears an error message element by id
  function setError(id, msg) {
    var el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
  }


  // returns a coloured status badge with semantic colour coding(NFR06)
  function statusBadge(status) {
    var map = {
      'Submitted':   'badge-submitted',
      'In Progress': 'badge-in-progress',
      'Resolved':    'badge-resolved',
      'Closed':      'badge-closed'
    };
    var cls = map[status] || 'badge-closed';
    return '<span class="badge ' + cls + '">' + escHtml(status) + '</span>';
  }


  // escapes user-supplied strings before inserting into innerHTML to prevent XSS
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  // formats ISO date string to readable UK date e.g. 09 Apr 2026
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }


  // attaches JWT to every request if present (ADR-05)
  async function apiFetch(method, path, body) {
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
    if (body) opts.body = JSON.stringify(body);
    var res = await fetch(path, opts);
    var data = await res.json();
    return { status: res.status, data: data };
  }


  // login - POST credentials, store JWT and route to correct dashboard by role
  $('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    setError('login-error', '');

    var email = $('email').value.trim();
    var password = $('password').value;

    var result = await apiFetch('POST', '/api/auth/login', { email: email, password: password });

    if (result.status !== 200) {
      setError('login-error', result.data.error || 'Login failed. Please try again.');
      return;
    }

    authToken = result.data.token;
    currentUser = result.data.user;

    // route by role - agents, managers and admins go to agent dashboard (RBAC, ADR-05)
    if (currentUser.role === 'Agent' || currentUser.role === 'Manager' || currentUser.role === 'Admin') {
      $('agent-name').textContent = currentUser.firstName + ' ' + currentUser.lastName + ' (' + currentUser.role + ')';
      $('agent-tenant-logo').src = currentUser.logo || '';
      $('agent-tenant-logo').alt = (currentUser.tenantName || '') + ' logo';
      showScreen('agent-screen');
      loadAgentComplaints();
    } else {
      $('consumer-name').textContent = currentUser.firstName + ' ' + currentUser.lastName;
      $('consumer-tenant-logo').src = currentUser.logo || '';
      $('consumer-tenant-logo').alt = (currentUser.tenantName || '') + ' logo';
      showScreen('consumer-screen');
    }
  });


  // eye icon toggles password visibility - swaps fa-eye / fa-eye-slash and updates aria-label (NFR06)
  $('toggle-password').addEventListener('click', function () {
    var inp = $('password');
    var icon = $('eye-icon');
    if (inp.type === 'password') {
      inp.type = 'text';
      icon.className = 'fa-regular fa-eye-slash';
      this.setAttribute('aria-label', 'Hide password');
    } else {
      inp.type = 'password';
      icon.className = 'fa-regular fa-eye';
      this.setAttribute('aria-label', 'Show password');
    }
  });


  // logout - clear token and user state, reset form and return to login screen
  $('consumer-logout').addEventListener('click', logout);
  $('agent-logout').addEventListener('click', logout);

  function logout() {
    authToken = null;
    currentUser = null;
    $('login-form').reset();
    setError('login-error', '');
    showScreen('login-screen');
  }


  // consumer sidebar nav - toggles between submit and my complaints sections
  $('btn-show-submit').addEventListener('click', function () {
    $('submit-section').classList.remove('hidden');
    $('my-complaints-section').classList.add('hidden');
    this.setAttribute('aria-pressed', 'true');
    this.classList.add('active');
    $('btn-show-my-complaints').setAttribute('aria-pressed', 'false');
    $('btn-show-my-complaints').classList.remove('active');
  });


  $('btn-show-my-complaints').addEventListener('click', function () {
    $('my-complaints-section').classList.remove('hidden');
    $('submit-section').classList.add('hidden');
    this.setAttribute('aria-pressed', 'true');
    this.classList.add('active');
    $('btn-show-submit').setAttribute('aria-pressed', 'false');
    $('btn-show-submit').classList.remove('active');
    loadMyComplaints();
  });


  // US001 - character counter updates on each keystroke
  $('description').addEventListener('input', function () {
    var remaining = 2500 - this.value.length;
    $('char-count').textContent = remaining;
  });

  $('cancel-complaint').addEventListener('click', function () {
    $('complaint-form').reset();
    $('char-count').textContent = '2500';
    setError('complaint-form-error', '');
    $('complaint-success').classList.add('hidden');
    clearFieldErrors();
  });


  // US001 - submit complaint form
  $('complaint-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    setError('complaint-form-error', '');
    $('complaint-success').classList.add('hidden');
    clearFieldErrors();

    var title = $('title').value.trim();
    var category = $('category').value;
    var description = $('description').value.trim();


    // client-side validation before hitting the API
    var hasError = false;
    if (!title) { markInvalid('title'); hasError = true; }
    if (!category) { markInvalid('category'); hasError = true; }
    if (!description) { markInvalid('description'); hasError = true; }

    if (hasError) {
      setError('complaint-form-error', 'Please fill in all required fields.');
      return;
    }


    var result = await apiFetch('POST', '/api/complaints', {
      title: title,
      category: category,
      complaint_description: description
    });

    if (result.status === 201) {
      $('complaint-form').reset();
      $('char-count').textContent = '2500';
      var successEl = $('complaint-success');
      // inject reference number and view link into success message (matches wireframe)
      successEl.innerHTML =
        '<strong>Complaint submitted successfully.</strong><br>' +
        'Your reference number is <strong>CMS-' + escHtml(String(result.data.complaint_id)) + '</strong>. ' +
        'A confirmation has been sent to your email address.';
      successEl.classList.remove('hidden');
    } else {
      setError('complaint-form-error', result.data.error || 'Submission failed. Please try again.');
    }
  });

  function markInvalid(id) {
    var el = $(id);
    if (el) el.classList.add('invalid');
  }

  function clearFieldErrors() {
    ['title', 'category', 'description'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.remove('invalid');
    });
  }


  // US002 - load complaints belonging to the logged-in consumer only
  async function loadMyComplaints() {
    setError('my-complaints-error', '');
    var tbody = $('my-complaints-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';

    var result = await apiFetch('GET', '/api/my-complaints');

    if (result.status !== 200) {
      setError('my-complaints-error', result.data.error || 'Failed to load complaints.');
      tbody.innerHTML = '';
      return;
    }

    var complaints = result.data;
    if (!complaints.length) {
      tbody.innerHTML = '<tr><td colspan="5">No complaints submitted yet.</td></tr>';
      return;
    }

    tbody.innerHTML = complaints.map(function (c) {
      return '<tr>' +
        '<td>CMS-' + escHtml(String(c.complaint_id)) + '</td>' +
        '<td>' + escHtml(c.title) + '</td>' +
        '<td>' + escHtml(c.category) + '</td>' +
        '<td>' + statusBadge(c.complaint_status) + '</td>' +
        '<td>' + formatDate(c.created_at) + '</td>' +
        '</tr>';
    }).join('');
  }


  // agent dashboard - loads all tenant complaints and populates KPI cards
  async function loadAgentComplaints() {
    setError('agent-complaints-error', '');
    var tbody = $('agent-complaints-body');
    tbody.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';

    var result = await apiFetch('GET', '/api/complaints');

    if (result.status !== 200) {
      setError('agent-complaints-error', result.data.error || 'Failed to load complaints.');
      tbody.innerHTML = '';
      return;
    }

    var complaints = result.data;

    // calculate KPI values from the loaded complaints
    var unassigned = complaints.filter(function (c) { return !c.assigned_agent_id; }).length;
    var assigned = complaints.filter(function (c) { return c.assigned_agent_id; }).length;

    $('kpi-unassigned').textContent = unassigned;
    $('kpi-assigned').textContent = assigned;
    $('kpi-total').textContent = complaints.length;

    if (!complaints.length) {
      tbody.innerHTML = '<tr><td colspan="7">No complaints found.</td></tr>';
      return;
    }

    tbody.innerHTML = complaints.map(function (c) {
      // show support person name if assigned, otherwise Unassigned
      var supportPerson = c.assigned_agent_name
        ? '<span style="color:var(--col-primary); font-weight:600">' + escHtml(c.assigned_agent_name) + '</span>'
        : '<span style="color:var(--col-text-muted)">Unassigned</span>';
      return '<tr>' +
        '<td>CMS-' + escHtml(String(c.complaint_id)) + '</td>' +
        '<td>' + escHtml(c.title) + '</td>' +
        '<td>' + statusBadge(c.complaint_status) + '</td>' +
        '<td>' + escHtml(c.category) + '</td>' +
        '<td>' + supportPerson + '</td>' +
        '<td>' + formatDate(c.created_at) + '</td>' +
        '<td><button class="btn-assign" data-id="' + c.complaint_id + '" aria-label="Assign complaint CMS-' + c.complaint_id + '">Assign</button></td>' +
        '</tr>';
    }).join('');

    // wire assign buttons after rows are injected into DOM
    tbody.querySelectorAll('.btn-assign').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openAssignPanel(parseInt(this.getAttribute('data-id'), 10));
      });
    });
  }


  // US006 - open assign modal and populate support persons dropdown for this tenant
  async function openAssignPanel(complaintId){
    assigningComplaintId = complaintId;
    setError('assign-error', '');

    var select = $('support-person');
    select.innerHTML = '<option value="">-- Select support person --</option>';

    // fetch support persons scoped to agent's tenant - cross-tenant options are blocked server-side (ADR-04)
    var spResult = await apiFetch('GET', '/api/users/support-persons');
    if (spResult.status === 200 && Array.isArray(spResult.data)) {
      spResult.data.forEach(function (sp) {
        var opt = document.createElement('option');
        opt.value = sp.user_id;
        opt.textContent = sp.first_name + ' ' + sp.last_name + ' (' + sp.email + ')';
        select.appendChild(opt);
      });
    }

    $('assign-panel').classList.remove('hidden');
    select.focus(); // move focus into modal for keyboard users (NFR06)
  }

  $('cancel-assign').addEventListener('click', function () {
    $('assign-panel').classList.add('hidden');
    assigningComplaintId = null;
  });



  // US006 - submit assignment
  $('assign-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    setError('assign-error', '');

    var supportPersonId = $('support-person').value;
    if (!supportPersonId) {
      setError('assign-error', 'Please select a support person.');
      return;
    }

    var result = await apiFetch('PATCH', '/api/complaints/' + assigningComplaintId + '/assign', {
      supportPersonId: parseInt(supportPersonId, 10)
    });

    if (result.status === 200) {
      $('assign-panel').classList.add('hidden');
      assigningComplaintId = null;
      loadAgentComplaints(); // reload table to reflect new assignment
    } else {
      setError('assign-error', result.data.error || 'Assignment failed.');
    }
  });

  // close modal on backdrop click
  $('assign-panel').addEventListener('click', function (e) {
    if (e.target === this) {
      this.classList.add('hidden');
      assigningComplaintId = null;
    }
  });

  // close modal on Escape key - keyboard accessibility (NFR06)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var panel = $('assign-panel');
      if (!panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
        assigningComplaintId = null;
      }
    }
  });

})();