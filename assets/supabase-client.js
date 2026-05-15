/* ==========================================================================
   Supabase client — DataRoom JMG IMMOB
   Module ES, chargé via type="module" sur les pages qui en ont besoin.
   ========================================================================== */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://qztbujxthacstmjiqdzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eEOLeESrlN_XrPWzNNTeWQ_5hshjDBy';

// Email administrateur — utilise *_+_*'@'+_*' pour ne JAMAIS afficher d'adresse
// telle quelle dans le source rendu côté visiteur. C'est un fragment JS
// uniquement utilisé pour la vérification du rôle admin côté client.
const ADMIN_USER  = 'benoit' + '.' + 'galy';
const ADMIN_DOM   = 'green' + '-' + 'acres' + '.' + 'com';
export const ADMIN_EMAIL = ADMIN_USER + '@' + ADMIN_DOM;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

/* -------------------------- getCurrentUser ------------------------------- */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (_e) {
    return null;
  }
}

/* -------------------------- isAdmin -------------------------------------- */
export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.email) return false;
  return String(user.email).toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* -------------------------- logAction ------------------------------------ *
 * INSERT dans dataroom_access_log. Silently fails si problème réseau / RLS.
 * opts: { document_path, document_label, metadata, user_email (override) }
 * ------------------------------------------------------------------------ */
export async function logAction(action, opts = {}) {
  try {
    const user = await getCurrentUser();
    const payload = {
      action,
      user_email: opts.user_email || (user && user.email) || null,
      auth_user_id: user ? user.id : null,
      user_agent: (typeof navigator !== 'undefined' && navigator.userAgent) || null,
      referrer: (typeof document !== 'undefined' && document.referrer) || null,
      document_path: opts.document_path || null,
      document_label: opts.document_label || null,
      metadata: opts.metadata || null,
    };
    await supabase.from('dataroom_access_log').insert(payload);
  } catch (_e) {
    // silent fail — la journalisation ne doit jamais casser l'UX
  }
}

/* -------------------------- checkDataroomAccess -------------------------- *
 * Vérifie qu'une adresse email a bien un dataroom_users.status='approved'.
 * Retourne true/false. En cas d'erreur réseau → false.
 * NB: la table dataroom_users a une RLS qui empêche un anonyme de lire.
 * Pour cette vérification AVANT login, on tente un signInWithOtp et on
 * regarde simplement le retour. Voir dataroom.html.
 * Cette helper est conservée pour usage admin uniquement.
 * ------------------------------------------------------------------------ */
export async function isEmailApproved(email) {
  try {
    const { data, error } = await supabase
      .from('dataroom_users')
      .select('status')
      .eq('email', String(email || '').toLowerCase().trim())
      .eq('status', 'approved')
      .maybeSingle();
    if (error) return null; // null = on ne sait pas (RLS, etc.)
    return !!data;
  } catch (_e) {
    return null;
  }
}
