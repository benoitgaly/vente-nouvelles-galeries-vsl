# Anciennes Nouvelles Galeries — Cours Victor Hugo, Villeneuve-sur-Lot

Site d'annonce immobilière pour la cession d'un ensemble immobilier mixte 3 181 m² SDP en cœur de bastide.

- **Vendeur** : SARL JMG IMMOB (SIREN 844 912 964 — RCS Agen)
- **Bien** : ensemble immobilier mixte de 3 181 m² SDP sur 1 099 m² de foncier traversant, 4 parcelles (EV 8 · 9 · 20 · 21), Cours Victor Hugo / rue Bernard Palissy, 47300 Villeneuve-sur-Lot.
- **Prix** : 350 000 € net vendeur. Offre à 280 000 € net vendeur si paiement intégral avant le 31/12/2026 sans clause suspensive.
- **Contact** : exclusivement via le formulaire en ligne (aucune coordonnée publique).

## Référentiel design

Le site est calibré sur les **annonces immobilières grand public** type SeLoger, LeBonCoin, Bienici, Green-Acres. Pas de mise en page « mémorandum d'investissement » ni « cabinet de conseil premium » :

- carrousel plein largeur, photos sans texte par-dessus, ouvrable en lightbox plein écran ;
- une seule page d'annonce (`index.html`) avec dans l'ordre : photos, titre + prix, key facts, description courte (3 §), encart offre 280 k€, tableau caractéristiques, localisation + carte OSM, diagnostics, formulaire de contact intégré ;
- couleurs sobres + accent orange (codes SeLoger), accent vert pour l'encart offre.

## Structure

```
site/
├── index.html            ← Annonce : carrousel + descriptif + caractéristiques + formulaire
├── dataroom.html         ← Espace documentaire protégé (auth Supabase magic link)
├── admin.html            ← Back-office mandataire
└── assets/
    ├── style.css            ← Feuille de style unique (annonce immobilière)
    ├── main.js              ← Carrousel, lightbox, formulaire contact, burger mobile
    ├── supabase-client.js   ← Client Supabase + helpers (logAction, isAdmin, getCurrentUser)
    ├── supabase-contact.js  ← Bridge formulaire → Supabase
    ├── dataroom-auth.js     ← Auth magic link DataRoom + journalisation
    ├── admin.js             ← Back-office (demandes, utilisateurs, logs)
    ├── memorandum.pdf
    ├── photos/           ← Photos du site — source UNIQUE = DataRoom user
    │   ├── 8bis-8ter/       ← bâtiment principal (façade + vues rue + cadastre + 4 plans)
    │   ├── 10-cours/        ← immeuble annexe (façade pierre + intérieurs)
    │   └── villeneuve/      ← ambiance centre-bastide (allées Leygues, nouveau centre)
    └── dataroom/            ← PDF DataRoom (mémo, actes, diags, fiscalité, mandat)
```

## Photos utilisées sur l'annonce

Source UNIQUE : `DataRoom/07_Photos_et_visite/` (3 dossiers user). Aucune photo inventée, fabriquée ou reprise d'autres sources. Pas de galerie T2 (pas de dossier source T2 ; le T2 reste mentionné dans le texte et visible sur demande après accès DataRoom).

**Carrousel (6 slides)** : 5 photos `8bis-8ter/` + 1 photo `10-cours/Extérieur.jpg`.

**Galerie 8 bis & 8 ter (5 photos)** : façade user, façade piétonne, vue aérienne emprise, vue de rue, plan cadastral.

**Galerie 10 Cours Victor Hugo (12 photos)** : façade pierre + balustres + cage d'escalier + cour + placard intégré + balcon fer forgé + combles + alcôve + pièces et accès sous-sol. Reportage complet (24 vues) en DataRoom.

**Section Plans par niveau (4 plans haute qualité)** : Sous-sol, RDC, R+1, R+2 — issus des 4 PNG fournis par le user dans `8bis-8ter/plan-*.jpg`.

**Section ambiance Villeneuve (2 photos)** : allées Georges-Leygues + Nouveau centre.

## Intégration Supabase

- **Projet** : `https://qztbujxthacstmjiqdzf.supabase.co`
- **Publishable key** : `sb_publishable_eEOLeESrlN_XrPWzNNTeWQ_5hshjDBy` (sécurité portée par RLS).
- **Tables** :
  - `dataroom_contact_requests` — INSERT public anonyme (formulaire de contact)
  - `dataroom_users` — utilisateurs autorisés
  - `dataroom_access_log` — journal d'audit
  - vue `dataroom_admin_dashboard` — synthèse demandes (admin only)
- **Authentification** : magic link via `supabase.auth.signInWithOtp`.
- **Email admin** côté DB : fonction `public.is_dataroom_admin()` qui compare `auth.jwt()->>'email'` à l'email autorisé.

### Formulaire de contact (`index.html`)
1. INSERT dans `dataroom_contact_requests`
2. log `contact_form_submitted` dans `dataroom_access_log`
3. confirmation inline (pas de mailto fallback — l'email n'est jamais exposé)

### `/dataroom.html`
Magic link → si l'email est dans `dataroom_users` avec `status='approved'`, l'auth réussit et le contenu se débloque. Chaque session et chaque téléchargement sont logués.

### `/admin.html`
Magic link réservé à l'email admin. 3 onglets : Demandes entrantes (approuver/rejeter), Utilisateurs (révoquer/réactiver), Journal d'accès (100 dernières lignes).

## Règles éditoriales

- Aucune coordonnée personnelle (email, tél) dans le DOM rendu côté visiteur. L'email admin est reconstruit en JS uniquement pour la comparaison côté client (jamais affiché).
- Mention « le mandataire » uniquement, contact via formulaire.
- Pas de reprise de mise en forme tierce (Sinico) : tout le rédactionnel est reformulé.

## Test local

```bash
cd site
python -m http.server 8000
# puis http://localhost:8000/
```

L'auth Supabase fonctionne mieux en HTTPS — tester en production (GitHub Pages) pour la chaîne complète.

## Confidentialité

- Photos et plans : propriété SARL JMG IMMOB.
- DataRoom : communiquée sous engagement de confidentialité, accès journalisé.
- Pas de coordonnée personnelle publique.
