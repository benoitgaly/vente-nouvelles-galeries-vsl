/* ==========================================================================
   Bridge Supabase pour le formulaire de contact (page d'accueil)
   Expose window.__ngSupabase.submitContactRequest() qui :
   - INSERT dans dataroom_contact_requests
   - INSERT dans dataroom_access_log (action: contact_form_submitted)
   Retourne true en cas de succès, false en cas d'échec (→ fallback mailto).
   ========================================================================== */

import { supabase, logAction } from './supabase-client.js?v=2';

async function submitContactRequest(payload) {
  try {
    const row = {
      first_name: (payload.first_name || '').trim(),
      last_name:  (payload.last_name  || '').trim(),
      company:    (payload.company    || '').trim(),
      job_title:  payload.job_title ? String(payload.job_title).trim() : null,
      email:      String(payload.email || '').trim().toLowerCase(),
      phone:      (payload.phone || '').trim(),
      acquirer_profile: (payload.acquirer_profile || '').trim(),
      message:    (payload.message || '').trim(),
      confidentiality_accepted: !!payload.confidentiality_accepted,
      user_agent: payload.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      referrer:   payload.referrer   || (typeof document !== 'undefined'  ? document.referrer  : null),
    };
    // NB : pas de .select() après l'insert — le SELECT serait bloqué par
    // la RLS pour les anonymes (seul l'admin a le droit de lire), même
    // si l'INSERT lui passe. Cela produirait un 401 trompeur.
    const { error } = await supabase
      .from('dataroom_contact_requests')
      .insert(row);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[contact] insert error', error.message || error);
      return false;
    }
    // log fire-and-forget — pas d'ID disponible côté anonyme, on retrouve
    // la demande par email côté admin.
    try {
      await logAction('contact_form_submitted', {
        user_email: row.email,
      });
    } catch (_e) {}
    return true;
  } catch (_e) {
    return false;
  }
}

window.__ngSupabase = Object.assign({}, window.__ngSupabase || {}, {
  supabase,
  logAction,
  submitContactRequest,
});
