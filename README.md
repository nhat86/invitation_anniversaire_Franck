# Invitation Squid Game — Franck 50 ans & Andy 18 ans

Mini-site d'invitation interactif (enveloppe animée, bouton WhatsApp, lien Google Maps).
Site 100 % statique : aucun serveur, aucune base de données, aucune clé API.

## Contenu du projet

```
├── index.html    → structure de la page (enveloppe + carte + formulaire RSVP)
├── style.css     → design noir / rose néon, animations, responsive
├── script.js     → ouverture de l'enveloppe, message WhatsApp, bouton copier
├── reponses.html → page organisateurs : tableau des réponses + export Excel
├── reponses.js   → analyse des messages, tableau, export .csv
├── README.md     → ce fichier
└── .nojekyll     → fichier vide, évite le traitement Jekyll de GitHub Pages
```

## Confirmation (RSVP) — deux modes possibles

### Mode 1 : Google Form intégré (recommandé — stats automatiques + thème conservé)

Avec ce mode, **aucun numéro WhatsApp n'est nécessaire** : l'invité remplit
le mini-formulaire directement sur l'invitation (thème Squid Game conservé),
et les réponses arrivent automatiquement dans un Google Sheets, exportable
en Excel. WhatsApp ne sert qu'à envoyer le lien de l'invitation aux invités.

**Étape A — Créer le formulaire (5 min, compte Google requis) :**

1. Aller sur https://forms.google.com → « + Formulaire vierge ».
2. Titre : « Anniversaire Franck & Andy — Confirmation de présence ».
3. Ajouter ces questions (toutes en **Réponse courte**) :
   - « Votre nom » — **obligatoire**
   - « Nombre d'adultes » — **obligatoire**
   - « Nombre d'ados (12 à 17 ans) »
   - « Âge(s) des ados »
   - « Nombre d'enfants (moins de 12 ans) »
   - « Âge(s) des enfants »
4. Onglet **« Réponses »** → icône Sheets « Lier à Sheets » : toutes les
   réponses arriveront dans un tableau → **Fichier → Télécharger →
   Microsoft Excel (.xlsx)** pour vos statistiques.

**Étape B — Récupérer les identifiants des questions :**

1. Dans le formulaire, menu **⋮** (en haut à droite) → **« Obtenir un lien
   prérempli »**.
2. Remplissez chaque question avec une valeur bidon (ex. : `TEST`, `1`…)
   → « Obtenir le lien » → « Copier le lien ».
3. Le lien ressemble à :
   `https://docs.google.com/forms/d/e/1FAIpQLSXXX/viewform?usp=pp_url&entry.111111=TEST&entry.222222=1&entry.333333=…`
4. Dans `script.js`, collez :
   - `GOOGLE_FORM_ACTION` : la même URL en remplaçant **`/viewform` par
     `/formResponse`** et sans les paramètres
     (`https://docs.google.com/forms/d/e/1FAIpQLSXXX/formResponse`)
   - `GOOGLE_FORM_ENTRIES` : les `entry.XXXXXX` **dans l'ordre des
     questions** (1ʳᵉ question = `name`, 2ᵉ = `adults`, etc.).

Configuration déjà remplie dans `script.js` (formulaire créé le 21/10/2026) :

```js
const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSeAKTleAISM6AoA3-V0OfsWCSBYkVY8pRR-HLBtI-TJBx7AMQ/formResponse";
const GOOGLE_FORM_ENTRIES = {
  name: "entry.886880296",    // « Votre nom »
  present: "entry.789516920", // « Serez-vous présent(e) ? »
  adults: "entry.845308764",  // « Adultes » (18 ans et +)
  teens: "entry.799495062",   // « Ados » (12–17 ans)
  kids: "entry.503537446",    // « Enfants » (0–11 ans)
  teensAges: "",              // optionnel, voir ci-dessous
  kidsAges: "",               // optionnel, voir ci-dessous
};
```

**Pour collecter aussi les âges des ados et des enfants :** les champs
« Ados » et « Enfants » du formulaire n'acceptent que des nombres entiers
(validation Google). Ajoutez donc dans le Google Form deux questions
**« Réponse courte » NON obligatoires** : « Âge(s) des ados » et
« Âge(s) des enfants », récupérez leurs `entry.xxx` via « lien prérempli »
et collez-les dans `teensAges` / `kidsAges`.

**Test réalisé le 21/10/2026 :** envoi vérifié en HTTP 200 pour les
réponses « Oui » et « Non ». Trois réponses de test nommées
« Test Intégration… » ont été enregistrées dans vos réponses —
supprimez-les dans Google Sheets (Réponses → icône Sheets).

**Variante simple (sans les entry.xxxx)** : laissez `GOOGLE_FORM_ACTION`
vide et collez seulement le lien de partage `https://forms.gle/...` dans
`GOOGLE_FORM_URL`. Le bouton ouvrira alors le Google Form dans un nouvel
onglet — les statistiques restent automatiques, mais l'invité voit le
formulaire Google standard (pas le thème Squid Game).

### Mode 2 : WhatsApp + reponses.html (actif si les deux options Google sont vides)

L'invité remplit sur la carte : son **nom**, le nombre d'**adultes**,
d'**ados (12 à 17 ans)** avec leurs âges, et d'**enfants (moins de 12 ans)**
avec leurs âges. Le bouton « CONFIRMER MA PRÉSENCE » ouvre WhatsApp avec un
message structuré prêt à envoyer, par exemple :

```
Bonjour ! Je confirme ma présence à l'anniversaire de Franck (50 ans) et Andy (18 ans), le samedi 20 février 2027.
Nom : Marie Dupont
Adultes : 2
Ados : 1 (âges : 14)
Enfants : 2 (âges : 7, 9)
```

## Statistiques et export Excel — `reponses.html`

Ouvrez `reponses.html` dans le navigateur (fichier local ou
`https://VOTRE_NOM.github.io/VOTRE_DEPOT/reponses.html` une fois publié).
Cette page n'est **pas liée** depuis l'invitation : seuls les organisateurs
qui connaissent son adresse y accèdent.

1. À chaque message de confirmation reçu sur WhatsApp, **collez le message**
   dans la zone de texte → « AJOUTER AU TABLEAU ». La ligne est remplie
   automatiquement (nom, adultes, ados + âges, enfants + âges).
2. Vous pouvez corriger chaque case, ajouter une ligne à la main ou supprimer
   une ligne. Les totaux se recalculent automatiquement.
3. Les données sont conservées dans le navigateur (localStorage) : revenez
   compléter la liste au fil des réponses.
4. « EXPORTER VERS EXCEL (.CSV) » télécharge un fichier qui s'ouvre
   directement dans Excel, avec les totaux en bas.
   (Format : séparateur `;`, UTF-8 — compatible Excel français.)

## Tester en local

Le plus simple : double-cliquer sur `index.html` dans l'explorateur de fichiers.

Pour un rendu identique à la version publiée (recommandé) :

```bash
# depuis ce dossier, avec Python installé :
python -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Publier gratuitement sur GitHub Pages

1. **Créer un compte** sur https://github.com si besoin.
2. **Créer un dépôt** : bouton « New repository », par exemple `invitation-anniversaire`, en **public** (GitHub Pages gratuit exige un dépôt public).
3. **Envoyer les fichiers** — deux méthodes :

   **Par le site web (sans installer Git)** : dans le dépôt, « Add file » → « Upload files » → glisser les 5 fichiers → « Commit changes ».

   **Par la ligne de commande** :
   ```bash
   git init
   git add .
   git commit -m "Invitation anniversaire Squid Game"
   git branch -M main
   git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/invitation-anniversaire.git
   git push -u origin main
   ```

4. **Activer GitHub Pages** : dans le dépôt → `Settings` → `Pages` →
   `Source : Deploy from a branch` → `Branch : main` → dossier `/ (root)` → `Save`.
5. **Obtenir le lien public** : après 1 à 5 minutes, le site est disponible sur
   `https://VOTRE_NOM_UTILISATEUR.github.io/invitation-anniversaire/`
   (le lien exact s'affiche en haut de la page Settings → Pages).
6. **Partager** ce lien sur WhatsApp. L'aperçu (titre + description) peut mettre
   quelques heures à apparaître selon le cache de WhatsApp.

## Ajouter le numéro WhatsApp plus tard

Tout se passe dans **`script.js`**, tout en haut du fichier :

```js
const WHATSAPP_NUMBER = "";
```

Remplacer par le numéro au **format international sans `+`, sans espace ni tiret** :

```js
const WHATSAPP_NUMBER = "33612345678";   // exemple : mobile français 06 12 34 56 78
```

- **Vide (`""`)** : le bouton ouvre WhatsApp avec le message prérempli, le visiteur
  choisit lui-même le destinataire.
- **Renseigné** : le bouton envoie le message directement à ce numéro.

Après modification : sauvegarder, puis renvoyer le fichier sur GitHub
(« Upload files » ou `git add script.js && git commit -m "Ajout numero WhatsApp" && git push`).

## Modifier les informations de l'événement

Les textes visibles sont dans `index.html` (section `<article class="card">`).
La première ligne du message WhatsApp est dans `script.js` (variable `RSVP_INTRO`) ;
les lignes « Nom / Adultes / Ados / Enfants » sont générées automatiquement.

## Accessibilité et mobile

- Site conçu « mobile-first », testé pour les écrans étroits.
- L'enveloppe s'ouvre au clic, au toucher et au clavier (Entrée / Espace).
- La préférence système « réduire les animations » est respectée :
  la carte s'affiche alors directement.
