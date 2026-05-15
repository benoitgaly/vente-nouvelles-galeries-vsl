# Anciennes Nouvelles Galeries — Cours Victor Hugo, Villeneuve-sur-Lot

Site institutionnel de présentation d'une cession immobilière.

- **Vendeur** : SARL JMG IMMOB (SIREN 844 912 964 — RCS Agen)
- **Bien** : ensemble immobilier mixte de 3 181 m² SDP sur 1 099 m² de foncier traversant, en cœur de bastide historique de Villeneuve-sur-Lot (47).
- **Prix** : 350 000 € net vendeur (offre exceptionnelle à 280 000 € net vendeur si paiement intégral avant le 31 décembre 2026, sans clause suspensive).
- **Contact** : exclusivement via le formulaire en ligne du site.

## Structure

- `index.html` — page unique du site
- `assets/style.css` — design system institutionnel
- `assets/main.js` — comportements (nav, smooth scroll, soumission formulaire)
- `assets/memorandum.pdf` — mémorandum d'investissement (12 pages)
- `assets/photos/` — 27 photographies du bien (JPG ≤ 1920 px)
- `assets/plans/` — plan cadastral en JPG

## Configuration du formulaire (Google Forms)

Le formulaire de demande d'accès à la DataRoom POSTe vers un Google Form.
Les soumissions arrivent dans la Google Sheet liée au Form.

Étapes de configuration (5 min, une fois) :

1. Créer un Google Form sur le compte propriétaire (`forms.new`).
2. Ajouter les champs correspondant aux noms du formulaire HTML : `prenom`, `nom`, `societe`, `fonction`, `email`, `telephone`, `profil`, `message`, `engagement_confidentialite`.
3. Récupérer l'URL de soumission (`https://docs.google.com/forms/d/e/FORM_ID/formResponse`) et les identifiants `entry.XXXX` de chaque champ (Inspecteur navigateur).
4. Mettre à jour `data-endpoint` dans `index.html` et la table de correspondance `entry.XXXX` dans `main.js` (à venir).
5. Lier le Form à une Google Sheet pour collecter les soumissions.

## Publication GitHub Pages

```bash
cd site
git init
git add .
git commit -m "Initial commit"
git branch -M main
gh repo create vente-nouvelles-galeries-vsl --public --source=. --push
gh repo edit --enable-pages --pages-branch main
```

Le site sera accessible à `https://benoitgaly.github.io/vente-nouvelles-galeries-vsl/`.

## Licence

- Photographies et plans : propriété de la SARL JMG IMMOB.
- DataRoom (titres, diagnostics, baux, mandat) : NON publiée — communiquée sur demande après engagement de confidentialité.
