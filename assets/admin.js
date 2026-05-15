/* ==========================================================================
   Back-office mandataire — Anciennes Nouvelles Galeries
   Auth magic link Supabase + vérification email admin (côté DB par RLS, et
   côté client pour la navigation).
   ========================================================================== */

import { supabase, getCurrentUser, isAdmin, ADMIN_EMAIL } from './supabase-client.js';

const loginSec   = document.getElementById('admin-login');
const shell      = document.getElementById('admin-shell');
const loginForm  = document.getElementById('admin-login-form');
const emailInput = document.getElementById('adm-email');
const submitBtn  = document.getElementById('adm-submit');
const msgEl      = document.getElementById('adm-msg');
const logoutBtn  = document.getElementById('adm-logout');
const toast      = document.getElementById('admin-toast');

const reqsWrap   = document.getElementById('tbl-requests-wrap');
const usersWrap  = document.getElementById('tbl-users-wrap');
const logsWrap   = document.getElementById('tbl-logs-wrap');
const cntReq     = document.getElementById('cnt-requests');
const cntUsers   = document.getElementById('cnt-users');
const cntLogs    = document.getElementById('cnt-logs');

/* ----------------------- helpers UI ------------------------------------- */
function showMsg(text, type) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.hidden = false;
  msgEl.classList.toggle('is-error', type === 'error');
}
function clearMsg() {
  if (!msgEl) return;
  msgEl.hidden = true;
  msgEl.textContent = '';
  msgEl.classList.remove('is-error');
}
function showToast(text, type) {
  if (!toast) return;
  toast.textContent = text;
  toast.style.display = 'block';
  toast.classList.toggle('is-error', type === 'error');
  setTimeout(() => { toast.style.display = 'none'; }, 4000);
}
function fmtDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch (_e) { return s; }
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function pill(label, cls) {
  return `<span class="pill ${cls || ''}">${esc(label)}</span>`;
}
function statusPill(status) {
  const map = {
    new:              ['Nouvelle',         'pill--new'],
    contacted:        ['Contactée',        'pill--contacted'],
    dataroom_granted: ['DataRoom ouverte', 'pill--granted'],
    rejected:         ['Rejetée',          'pill--rejected'],
    spam:             ['Spam',             'pill--spam'],
    pending:          ['En attente',       'pill--pending'],
    approved:         ['Approuvé',         'pill--approved'],
    revoked:          ['Révoqué',          'pill--revoked'],
    expired:          ['Expiré',           'pill--expired'],
  };
  const v = map[status] || [status || '—', ''];
  return pill(v[0], v[1]);
}
function formatAction(a) {
  const m = {
    login_request: 'Demande lien',
    login_success: 'Connexion',
    session_refresh: 'Reprise',
    logout: 'Déconnexion',
    document_view: 'Vue document',
    document_download: 'Téléchargement',
    page_view: 'Page vue',
    contact_form_submitted: 'Demande dossier',
    login_failed: 'Échec connexion',
  };
  return m[a] || a || '—';
}

/* ----------------------- AUTH ------------------------------------------- */
async function refreshAuthAndRender(opts = {}) {
  const user = await getCurrentUser();
  if (!user) {
    showLogin();
    return;
  }
  const adm = await isAdmin();
  if (!adm) {
    // logged in mais pas admin → log out + message
    try { await supabase.auth.signOut(); } catch (_e) {}
    showLogin();
    showMsg('Ce compte n\'a pas les droits d\'accès au back-office.', 'error');
    return;
  }
  showShell();
  await Promise.all([loadRequests(), loadUsers(), loadLogs()]);
}

function showLogin() {
  if (loginSec) loginSec.style.display = '';
  if (shell)    shell.style.display = 'none';
}
function showShell() {
  if (loginSec) loginSec.style.display = 'none';
  if (shell)    shell.style.display = '';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const email = String((emailInput && emailInput.value) || '').trim().toLowerCase();
    if (!email) { showMsg('Saisissez votre email.', 'error'); return; }
    if (email !== ADMIN_EMAIL.toLowerCase()) {
      showMsg('Email non reconnu pour ce back-office.', 'error');
      return;
    }
    submitBtn.disabled = true;
    const original = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="gate-loading"></span> Envoi en cours…';
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      });
      if (error) {
        showMsg('Service indisponible. Réessayez plus tard.', 'error');
      } else {
        showMsg('Lien envoyé. Vérifiez votre boîte mail (valable 1 heure).', 'ok');
        if (emailInput) emailInput.value = '';
      }
    } catch (_e) {
      showMsg('Service indisponible. Réessayez plus tard.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = original;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try { await supabase.auth.signOut(); } catch (_e) {}
    showLogin();
  });
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    refreshAuthAndRender({ fresh: true });
  } else if (event === 'SIGNED_OUT') {
    showLogin();
  }
});

/* ----------------------- LOAD: REQUESTS ---------------------------------- */
async function loadRequests() {
  reqsWrap.innerHTML = '<p class="muted">Chargement…</p>';
  try {
    const { data, error } = await supabase
      .from('dataroom_admin_dashboard')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (cntReq) cntReq.textContent = (data || []).length + ' demandes';
    if (!data || data.length === 0) {
      reqsWrap.innerHTML = '<div class="admin-empty">Aucune demande pour l\'instant.</div>';
      return;
    }
    const rows = data.map(renderRequestRow).join('');
    reqsWrap.innerHTML = `<table class="admin-table">
      <thead><tr>
        <th>Date</th><th>Identité</th><th>Société / Profil</th><th>Contact</th>
        <th>Statut demande</th><th>Statut accès</th><th>Logins</th>
        <th>Actions</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    attachRequestHandlers();
  } catch (e) {
    console.error('loadRequests', e);
    reqsWrap.innerHTML = '<div class="admin-empty">Erreur de chargement des demandes.</div>';
  }
}

function renderRequestRow(r) {
  // colonnes de la vue dataroom_admin_dashboard
  const id          = r.id || r.request_id;
  const created     = fmtDate(r.created_at);
  const fullName    = `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—';
  const company     = r.company || '—';
  const profile     = r.acquirer_profile || '';
  const email       = r.email || '';
  const phone       = r.phone || '';
  const reqStatus   = r.status || r.request_status || 'new';
  const userStatus  = r.user_status || r.access_status || null;
  const loginCount  = r.login_count != null ? r.login_count : '—';
  const message     = r.message || '';

  return `<tr data-id="${esc(id)}" data-email="${esc(email)}">
    <td class="col-date">${esc(created)}</td>
    <td>
      <div><strong>${esc(fullName)}</strong></div>
      ${r.job_title ? `<div class="col-meta">${esc(r.job_title)}</div>` : ''}
    </td>
    <td>
      <div>${esc(company)}</div>
      ${profile ? `<div class="col-meta">${esc(profile)}</div>` : ''}
    </td>
    <td>
      <div>${esc(email)}</div>
      ${phone ? `<div class="col-meta">${esc(phone)}</div>` : ''}
    </td>
    <td>${statusPill(reqStatus)}</td>
    <td>${userStatus ? statusPill(userStatus) : '<span class="muted">—</span>'}</td>
    <td>${esc(loginCount)}</td>
    <td class="col-actions">
      <button class="btn--mini btn--primary" data-action="approve">Approuver</button>
      <button class="btn--mini btn--danger" data-action="reject">Rejeter</button>
    </td>
  </tr>${message ? `<tr><td colspan="8" class="col-meta" style="background:var(--paper-soft); padding:8px 14px;">${esc(message)}</td></tr>` : ''}`;
}

function attachRequestHandlers() {
  reqsWrap.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');
      const email = tr.getAttribute('data-email');
      const action = btn.getAttribute('data-action');
      btn.disabled = true;
      try {
        if (action === 'approve') {
          await approveRequest(id, email, tr);
          showToast('Demande approuvée. L\'utilisateur peut désormais demander un lien magique.');
        } else if (action === 'reject') {
          await rejectRequest(id);
          showToast('Demande rejetée.');
        }
      } catch (err) {
        console.error(err);
        showToast('Erreur : ' + (err && err.message ? err.message : 'opération impossible'), 'error');
      } finally {
        btn.disabled = false;
        await Promise.all([loadRequests(), loadUsers()]);
      }
    });
  });
}

async function approveRequest(requestId, email, tr) {
  // Récupérer les détails complets de la demande
  const { data: req, error: rerr } = await supabase
    .from('dataroom_contact_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (rerr) throw rerr;

  // Upsert dans dataroom_users
  const payload = {
    email: String(email).toLowerCase().trim(),
    full_name: req ? `${req.first_name || ''} ${req.last_name || ''}`.trim() : null,
    company: req ? req.company : null,
    job_title: req ? req.job_title : null,
    acquirer_profile: req ? req.acquirer_profile : null,
    status: 'approved',
    contact_request_id: requestId,
    approved_at: new Date().toISOString(),
    revoked_at: null,
  };
  const { error: uerr } = await supabase
    .from('dataroom_users')
    .upsert(payload, { onConflict: 'email' });
  if (uerr) throw uerr;

  // MAJ statut de la demande
  const { error: serr } = await supabase
    .from('dataroom_contact_requests')
    .update({ status: 'dataroom_granted' })
    .eq('id', requestId);
  if (serr) throw serr;
}

async function rejectRequest(requestId) {
  const { error } = await supabase
    .from('dataroom_contact_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);
  if (error) throw error;
}

/* ----------------------- LOAD: USERS ------------------------------------ */
async function loadUsers() {
  usersWrap.innerHTML = '<p class="muted">Chargement…</p>';
  try {
    const { data, error } = await supabase
      .from('dataroom_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (cntUsers) cntUsers.textContent = (data || []).length + ' utilisateurs';
    if (!data || data.length === 0) {
      usersWrap.innerHTML = '<div class="admin-empty">Aucun utilisateur DataRoom pour l\'instant.</div>';
      return;
    }
    const rows = data.map((u) => `
      <tr data-id="${esc(u.id)}" data-email="${esc(u.email)}">
        <td class="col-date">${fmtDate(u.created_at)}</td>
        <td>${esc(u.email)}</td>
        <td>${esc(u.full_name || '—')}</td>
        <td>${esc(u.company || '—')}</td>
        <td>${statusPill(u.status)}</td>
        <td class="col-date">${u.approved_at ? fmtDate(u.approved_at) : '—'}</td>
        <td class="col-actions">
          ${u.status === 'approved'
            ? '<button class="btn--mini btn--danger" data-uaction="revoke">Révoquer</button>'
            : '<button class="btn--mini btn--primary" data-uaction="reactivate">Réactiver</button>'}
        </td>
      </tr>
    `).join('');
    usersWrap.innerHTML = `<table class="admin-table">
      <thead><tr>
        <th>Créé</th><th>Email</th><th>Nom</th><th>Société</th>
        <th>Statut</th><th>Approuvé</th><th>Actions</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    attachUserHandlers();
  } catch (e) {
    console.error('loadUsers', e);
    usersWrap.innerHTML = '<div class="admin-empty">Erreur de chargement des utilisateurs.</div>';
  }
}

function attachUserHandlers() {
  usersWrap.querySelectorAll('button[data-uaction]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');
      const action = btn.getAttribute('data-uaction');
      btn.disabled = true;
      try {
        if (action === 'revoke') {
          const { error } = await supabase
            .from('dataroom_users')
            .update({ status: 'revoked', revoked_at: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
          showToast('Accès révoqué.');
        } else if (action === 'reactivate') {
          const { error } = await supabase
            .from('dataroom_users')
            .update({ status: 'approved', approved_at: new Date().toISOString(), revoked_at: null })
            .eq('id', id);
          if (error) throw error;
          showToast('Accès réactivé.');
        }
      } catch (err) {
        console.error(err);
        showToast('Erreur : ' + (err && err.message ? err.message : 'opération impossible'), 'error');
      } finally {
        btn.disabled = false;
        await loadUsers();
      }
    });
  });
}

/* ----------------------- LOAD: LOGS ------------------------------------- */
async function loadLogs() {
  logsWrap.innerHTML = '<p class="muted">Chargement…</p>';
  try {
    const { data, error } = await supabase
      .from('dataroom_access_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    if (cntLogs) cntLogs.textContent = (data || []).length + ' lignes';
    if (!data || data.length === 0) {
      logsWrap.innerHTML = '<div class="admin-empty">Aucun accès journalisé.</div>';
      return;
    }
    const rows = data.map((l) => `
      <tr>
        <td class="col-date">${fmtDate(l.created_at)}</td>
        <td>${esc(l.user_email || '—')}</td>
        <td>${esc(formatAction(l.action))}</td>
        <td>${esc(l.document_label || '')}</td>
        <td class="col-meta">${esc(l.document_path || '')}</td>
      </tr>
    `).join('');
    logsWrap.innerHTML = `<table class="admin-table">
      <thead><tr>
        <th>Date</th><th>Email</th><th>Action</th><th>Document</th><th>Chemin</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  } catch (e) {
    console.error('loadLogs', e);
    logsWrap.innerHTML = '<div class="admin-empty">Erreur de chargement des logs.</div>';
  }
}

/* ----------------------- INIT ------------------------------------------- */
refreshAuthAndRender();
