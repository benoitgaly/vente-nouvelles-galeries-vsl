# Anciennes Nouvelles Galeries — Cours Victor Hugo, Villeneuve-sur-Lot

Site de présentation d'une cession immobilière, multi-pages, style annonce immobilière premium.

- **Vendeur** : SARL JMG IMMOB (SIREN 844 912 964 — RCS Agen)
- **Bien** : ensemble immobilier mixte de 3 181 m² SDP sur 1 099 m² de foncier traversant, en cœur de bastide historique de Villeneuve-sur-Lot (47).
- **Prix** : 350 000 € net vendeur (offre exceptionnelle à 280 000 € net vendeur si paiement intégral avant le 31 décembre 2026, sans clause suspensive).
- **Contact** : exclusivement via le formulaire en ligne du site (aucune coordonnée publique).
- **URL publique** : https://benoitgaly.github.io/vente-nouvelles-galeries-vsl/

## Structure

```
site/
├── index.html              ← Accueil : carrousel + chiffres + intro + formulaire
├── le-bien.html            ← Composition par niveau, parcelles, galeries photos
├── localisation.html       ← Villeneuve-sur-Lot, centre réaménagé, accès
├── urbanisme.html          ← Zone UA, SPR, aides, risques, diagnostics
├── investissement.html     ← Prix, fiscalité, cibles acquéreurs, conditions
├── dataroom.html           ← Espace documentaire protégé (auth Supabase magic link)
├── admin.html              ← Back-office mandataire (Supabase, accès email-restreint)
├── assets/
│   ├── style.css           ← Feuille de style principale
│   ├── supabase-ui.css     ← Surcouche styles auth/back-office/contact
│   ├── main.js             ← Carrousel, nav, formulaire contact
│   ├── supabase-client.js  ← Client Supabase + helpers (logAction, isAdmin, getCurrentUser)
│   ├── supabase-contact.js ← Bridge module → formulaire de contact
│   ├── dataroom-auth.js    ← Auth magic link + journalisation DataRoom
│   ├── admin.js            ← Back-office : demandes, users, logs
│   ├── memorandum.pdf
│   ├── photos/
│   ├── plans/
│   └── dataroom/           ← PDF de la DataRoom (actes, diags, fiscalité…)
├── README.md
└── .gitignore
```

## Intégration Supabase

- **Projet Supabase** : `https://qztbujxthacstmjiqdzf.supabase.co`
- **Publishable key** (exposable côté client) : `sb_publishable_eEOLeESrlN_XrPWzNNTeWQ_5hshjDBy`
  - La sécurité est portée par les **RLS policies** côté DB, pas par le secret de cette clé.
- **Tables** :
  - `dataroom_contact_requests` — INSERT public anonyme (formulaire de contact)
  - `dataroom_users` — utilisateurs autorisés (lié à `auth.users` après approbation admin)
  - `dataroom_access_log` — journal d'audit (INSERT public + authenticated, SELECT user-own ou admin)
  - view `dataroom_admin_dashboard` — synthèse demandes + statut + login count + last login (admin uniquement)
- **Authentification** : magic link email (passwordless) via `supabase.auth.signInWithOtp`.
- **Email admin** : `benoit.galy@green-acres.com` (la fonction Postgres `public.is_dataroom_admin()` côté DB compare le claim `email` du JWT à cette adresse).
  Pour changer l'admin, modifier la fonction `is_dataroom_admin()` côté Supabase :
  ```sql
  CREATE OR REPLACE FUNCTION public.is_dataroom_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT COALESCE((SELECT auth.jwt() ->> 'email' IN ('nouvel.email@exemple.com')), false);
  $$;
  ```

## Pages

### `/dataroom.html`
Espace documentaire protégé. Plus de mot de passe partagé : l'accès se fait via un magic link envoyé sur l'email professionnel de l'acquéreur, **après validation manuelle par le mandataire** dans le back-office. Toutes les actions (login, téléchargements) sont journalisées dans `dataroom_access_log`.

### `/admin.html`
Back-office mandataire (URL directe, non listée dans la navigation publique). Permet :
- de visualiser les **demandes entrantes** (vue `dataroom_admin_dashboard`),
- d'**approuver** une demande (création/UPSERT de l'utilisateur dans `dataroom_users` avec `status='approved'`),
- de **rejeter** une demande,
- de **révoquer** ou **réactiver** un accès,
- de consulter les **100 derniers logs d'accès**.

Auth admin = magic link + vérification que l'email correspond à l'admin (côté client pour la nav, côté DB pour les RLS).

### `/index.html`
Page d'accueil. Le formulaire de contact :
1. INSERT dans `dataroom_contact_requests` via Supabase,
2. logge `contact_form_submitted` dans `dataroom_access_log`,
3. affiche un message de confirmation in-page,
4. **fallback mailto:** uniquement si Supabase est indisponible (mode dégradé).

## Règles éditoriales respectées

- **Aucune coordonnée publique dans le DOM rendu** : email et téléphone du mandataire n'apparaissent jamais dans le HTML visible. Seuls le JS reconstruit l'email à la volée (variable, jamais affichée) pour le fallback mailto et la vérification admin.
- **Pas de reprise de mise en forme tierce** : tout le contenu rédactionnel est reformulé.

## Carrousel d'accueil

Sept slides en rotation automatique (6 s), navigation manuelle (flèches, dots, swipe tactile). Pause au hover.

## Test local

```bash
cd site
python -m http.server 8000
# puis http://localhost:8000/
```

Le site fonctionne en local mais Supabase exige une origine HTTPS pour certaines opérations d'auth dans certains navigateurs — préférer le test en production (GitHub Pages) pour vérifier la chaîne auth complète.

## Publication GitHub Pages

```bash
git add .
git commit -m "Intégration Supabase : auth magic link DataRoom, logs d'accès, back-office admin"
git push
```

URL publique : https://benoitgaly.github.io/vente-nouvelles-galeries-vsl/

## Licence et confidentialité

- Photographies, plans, mémorandum : propriété de la SARL JMG IMMOB.
- DataRoom (titres, diagnostics, baux, mandat) : communiquée sous engagement de confidentialité, accès journalisé.
- Aucune coordonnée personnelle ne figure publiquement (cf. règles internes JMG IMMOB).
