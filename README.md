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
├── dataroom.html           ← Espace documentaire protégé (mot de passe JS)
├── assets/
│   ├── style.css           ← Feuille de style unique — palette ink/gold/paper
│   ├── main.js             ← Carrousel, nav, formulaire mailto, gate DataRoom
│   ├── memorandum.pdf      ← Mémorandum d'investissement complet
│   ├── photos/
│   │   ├── hero/           ← 4 photos extérieures grand format
│   │   ├── epoque/         ← 7 photos d'époque (années 2000)
│   │   └── img_*.jpg       ← 27 photos intérieures actuelles
│   ├── plans/
│   │   └── plan-cadastral.jpg
│   └── dataroom/           ← PDF de la DataRoom (actes, diags, fiscalité…)
├── README.md
└── .gitignore
```

## Règles éditoriales respectées

- **Aucun service tiers** : pas de Formspree, Google Forms, Apps Script, etc.
- **Aucune coordonnée publique** : email et téléphone du mandataire n'apparaissent nulle part dans le DOM. Le formulaire de contact reconstruit l'adresse au runtime par concaténation JS et déclenche un `mailto:` ouvert dans le client mail du visiteur.
- **DataRoom protégée** par mot de passe JS — protection symbolique, le mot de passe est communiqué de gré à gré au moment de l'envoi des identifiants.
- **Pas de reprise de mise en forme tierce** : tout le contenu rédactionnel est reformulé à partir des sources publiques et des documents notariés.

## DataRoom — mot de passe

Mot de passe courant : `nouvelles-galeries-2026` (à communiquer manuellement aux acquéreurs identifiés). Pour changer le mot de passe, modifier la constante `PASS` dans `assets/main.js` (section 6).

## Carrousel d'accueil

Sept slides en rotation automatique (6 s), navigation manuelle (flèches, dots, swipe tactile). Pause au hover. Photo de UNE : `assets/photos/hero/facade-cours-victor-hugo.jpg`.

## Test local

```bash
cd site
python -m http.server 8000
# puis http://localhost:8000/
```

## Publication GitHub Pages

Le dépôt est déjà publié sur GitHub Pages :

```bash
git add .
git commit -m "Refonte multi-pages — annonce immobilière + carrousel + dataroom"
git push
```

L'URL publique : https://benoitgaly.github.io/vente-nouvelles-galeries-vsl/

## Licence et confidentialité

- Photographies, plans, mémorandum : propriété de la SARL JMG IMMOB.
- DataRoom (titres, diagnostics, baux, mandat) : communiquée sous engagement de confidentialité.
- Aucune coordonnée personnelle ne figure publiquement sur le site (cf. règles internes JMG IMMOB).
