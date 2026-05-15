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
    ├── plans/
    ├── photos_v2/           ← Photos classées par bâtiment / niveau
    │   ├── 8bis-8ter-cours-victor-hugo/
    │   │   ├── exterieur/   ← façade Cours V. Hugo, vue large rue
    │   │   ├── rdc/         ← magasin RDC
    │   │   ├── r1/          ← étage R+1
    │   │   ├── r2/
    │   │   ├── sous-sol/
    │   │   └── cour/        ← patio intérieur
    │   ├── 10-cours-victor-hugo/ ← immeuble annexe pierre
    │   ├── appartement-t2/  ← appartement loué
    │   ├── plans/
    │   ├── archives-notariales/  ← clés, internes, non utilisés
    │   └── _a_valider/
    └── dataroom/            ← PDF DataRoom (mémo, actes, diags, fiscalité, mandat)
```

## Photos utilisées sur l'annonce (13 slides)

Toutes issues du classement validé dans `_inventaire_photos.md`. Aucune photo de Marmande, aucune photo de clés notariales. Seules les photos classées **pertinence = OUI** et **bâtiment ∈ {8 bis/ter, 10 Cours, T2}** sont utilisées.

1. Façade Cours Victor Hugo (8 bis/ter) — `8bis-exterieur-01-facade-cours-victor-hugo.jpg`
2. Vue de rue large avec 10 Cours — `8bis-exterieur-02-vue-rue-large.jpg`
3. Pièce RDC à lambris bleu — `8bis-rdc-02-piece-lambris-bleu.jpg`
4. Pièce RDC vers escalier — `8bis-rdc-03-piece-vers-escalier.jpg`
5. Escalier vers sous-sol 731 m² — `8bis-sous-sol-01-escalier-descente.jpg`
6. Patio cour intérieure — `8bis-cour-01-patio-vegetation.jpg`
7. Pièce R+1 bureau — `8bis-r1-01-piece-bureau-faux-plafond.jpg`
8. Pièce R+1 cheminée murée — `8bis-r1-02-piece-cheminee-muree.jpg`
9. Appartement T2 — pièce sur Cours — `t2-01-piece-balcon-vue-cours.jpg`
10. Appartement T2 — chambre — `t2-04-chambre-fenetre.jpg`
11. Appartement T2 — combles — `t2-06-combles-velux-poutre.jpg`
12. 10 Cours — escalier balustres XIXe — `10-cours-interieur-03-escalier-balustres.jpg`
13. Plan cadastral 4 parcelles — `plan-cadastral.jpg`

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
