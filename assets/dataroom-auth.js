/* ==========================================================================
   DataRoom — authentification Supabase (magic link) + journalisation
   ========================================================================== */

import { supabase, getCurrentUser, logAction } from './supabase-client.js?v=3';

(async function init() {
  const loader        = document.getElementById('dataroom-loading');
  const gate          = document.getElementById('dataroom-gate');
  const content       = document.getElementById('dataroom-content');
  const form          = document.getElementById('dataroom-gate-form');
  const emailInput    = document.getElementById('dr-email');
  const submitBtn     = document.getElementById('dr-gate-submit');
  const msgEl         = document.getElementById('dr-gate-msg');
  const sessionEmail  = document.getElementById('dr-session-email');
  const logoutBtn     = document.getElementById('dr-logout');
  const logsWrap      = document.getElementById('dr-logs-wrap');

  if (!gate || !content || !form) return;

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

  function hideLoader() {
    if (loader) loader.classList.add('is-hidden');
  }
  function showGate() {
    hideLoader();
    gate.classList.remove('is-hidden');
    content.classList.remove('is-open');
    content.classList.add('is-hidden');
  }
  function showContent() {
    hideLoader();
    gate.classList.add('is-hidden');
    content.classList.remove('is-hidden');
    content.classList.add('is-open');
  }

  /* ---------------------- session déjà ouverte ? --------------------- */
  async function checkSessionAndRender(opts = {}) {
    const user = await getCurrentUser();
    if (user && user.email) {
      if (sessionEmail) sessionEmail.textContent = user.email;
      showContent();
      // log de session
      logAction(opts.fresh ? 'login_success' : 'session_refresh', {});
      // charger les logs récents
      loadRecentLogs();
      return true;
    }
    showGate();
    return false;
  }

  /* ---------------------- logs récents ------------------------------- */
  async function loadRecentLogs() {
    if (!logsWrap) return;
    try {
      const { data, error } = await supabase
        .from('dataroom_access_log')
        .select('action, document_label, document_path, created_at')
        .order('created_at', { ascending: false })
        .limit(25);
      if (error || !data) {
        logsWrap.innerHTML = '<p class="muted" style="font-size: 0.88rem;">Historique indisponible pour l\'instant.</p>';
        return;
      }
      if (data.length === 0) {
        logsWrap.innerHTML = '<p class="muted" style="font-size: 0.88rem;">Aucun accès enregistré pour le moment.</p>';
        return;
      }
      const rows = data.map((r) => {
        const dt = r.created_at ? new Date(r.created_at) : null;
        const date = dt ? dt.toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit', year: '2-digit',
          hour: '2-digit', minute: '2-digit',
        }) : '—';
        const action = formatAction(r.action);
        const doc = r.document_label
          ? `<span class="dr-log__doc">${escapeHtml(r.document_label)}</span>`
          : '<span class="muted">—</span>';
        return `<tr>
          <td class="dr-log__date">${date}</td>
          <td class="dr-log__action">${action}</td>
          <td>${doc}</td>
        </tr>`;
      }).join('');
      logsWrap.innerHTML = `<table class="dr-log-table">
        <thead><tr><th>Date</th><th>Action</th><th>Document</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    } catch (_e) {
      logsWrap.innerHTML = '<p class="muted" style="font-size: 0.88rem;">Historique indisponible pour l\'instant.</p>';
    }
  }

  function formatAction(a) {
    switch (a) {
      case 'login_request':    return 'Demande de lien magique';
      case 'login_success':    return 'Connexion';
      case 'session_refresh':  return 'Reprise de session';
      case 'logout':           return 'Déconnexion';
      case 'document_view':    return 'Consultation document';
      case 'document_download':return 'Téléchargement';
      case 'page_view':        return 'Page consultée';
      case 'contact_form_submitted': return 'Demande de dossier';
      case 'login_failed':     return 'Échec connexion';
      default:                 return a || '—';
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------------------- handler formulaire ------------------------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const email = String((emailInput && emailInput.value) || '').trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showMsg('Merci de saisir un email professionnel valide.', 'error');
      return;
    }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="gate-loading"></span> Envoi en cours…';

    // Journalisation de la demande (toujours, même si l'utilisateur n'est pas approuvé)
    try { await logAction('login_request', { user_email: email }); } catch (_e) {}

    // Vérification optionnelle : email approuvé ?
    // RLS bloque la lecture pour un anonyme, donc on tente l'envoi quoi qu'il arrive ;
    // côté serveur on s'appuie sur le fait que seul un email présent dans
    // dataroom_users (status approved) sera autorisé à voir le contenu via les RLS.
    // Ici on tente simplement l'envoi de l'OTP.
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) {
        // log échec
        try { await logAction('login_failed', { user_email: email, metadata: { reason: 'otp_error' } }); } catch (_e) {}
        showMsg('Votre demande d\'accès n\'a pas pu être traitée. Si vous n\'avez pas encore fait votre demande, utilisez le formulaire de contact en page d\'accueil.', 'error');
      } else {
        showMsg('Vérifiez votre boîte mail — un lien d\'accès vous a été envoyé. Il expire dans 1 heure. Si vous ne recevez rien sous 5 minutes, vérifiez vos spams ou contactez le mandataire (votre demande n\'a peut-être pas encore été validée).', 'ok');
        if (emailInput) emailInput.value = '';
      }
    } catch (_e) {
      showMsg('Service momentanément indisponible. Merci de réessayer dans quelques minutes.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });

  /* ---------------------- logout ------------------------------------- */
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await logAction('logout', {}); } catch (_e) {}
      try { await supabase.auth.signOut(); } catch (_e) {}
      showGate();
      // reset session display
      if (sessionEmail) sessionEmail.textContent = '—';
    });
  }

  /* ---------------------- clic document ------------------------------ */
  document.querySelectorAll('.dr-doc').forEach((a) => {
    a.addEventListener('click', (e) => {
      const path = a.getAttribute('href') || '';
      const label = a.getAttribute('data-doc-label') || a.querySelector('.dr-item__title')?.textContent || '';
      // fire-and-forget, on ne bloque pas le téléchargement
      logAction('document_download', {
        document_path: path,
        document_label: label,
      });
    });
  });

  /* ---------------------- détection retour magic link ---------------- *
   * Supabase replace l'URL avec un fragment #access_token=... que le SDK
   * consomme automatiquement (detectSessionInUrl: true). On écoute le
   * changement d'état pour rafraîchir l'UI.
   * ----------------------------------------------------------------- */
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      checkSessionAndRender({ fresh: true });
    } else if (event === 'SIGNED_OUT') {
      showGate();
      if (sessionEmail) sessionEmail.textContent = '—';
    }
  });

  // état initial
  // Si on arrive avec un access_token dans le hash (magic link), on garde
  // le loader visible : le SDK Supabase va parser le hash async et émettre
  // SIGNED_IN, ce qui déclenchera showContent() via onAuthStateChange.
  // Fallback de sécurité : si rien après 4s, on fait un check classique.
  const hasTokenInHash = typeof location !== 'undefined' && /[#&]access_token=/.test(location.hash || '');
  if (hasTokenInHash) {
    setTimeout(async () => {
      if (loader && !loader.classList.contains('is-hidden')) {
        // SDK n'a pas réussi à set la session → fallback
        await checkSessionAndRender({ fresh: false });
      }
    }, 4000);
  } else {
    // Pas de hash : check session existante en localStorage
    await checkSessionAndRender({ fresh: false });
  }
})();
