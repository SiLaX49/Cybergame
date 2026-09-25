# Cyber Réflexes : spécification de conception

- **Date** : 2026-09-24
- **Statut** : à valider
- **Nom** : « Cyber Réflexes » (nom de travail, modifiable)

## 1. Objectif

Un jeu web **gratuit** de sensibilisation aux risques numériques pour les élèves de la **6e à la Terminale**, jouable **sans compte ni installation**, soit en classe (séance de 55 min animée par un adulte), soit en autonomie.

### Constats issus de la recherche (qui orientent la conception)
- Un jeu joué **une seule fois** améliore les connaissances à court terme, mais ne change pas durablement les comportements. Il faut donc un **débrief animé** et des **rappels** (J+7, J+30).
- Le feedback **explicatif** et la pratique réelle des bons gestes (**auto-efficacité**) comptent plus que la peur.
- Les messages de peur sans solution sont contre-productifs : chaque conséquence est suivie d'une **action de récupération**.
- Les établissements comptent environ 15 terminaux pour 90 élèves : le mode **vidéoprojeté** et le mode **binôme** sont indispensables.
- Les enseignants adoptent une ressource si elle leur fait gagner du temps : fiche de 2 pages, durée annoncée, compétences officielles (CRCN, EMI, SNT, pHARe), aucun compte, plan B imprimable.

### Critères de succès
- Un enseignant lance une mission vidéoprojetée en moins de 2 minutes, sans compte ni configuration.
- Une mission dure 15 à 20 min et se termine sur 3 questions de débrief.
- Le jeu fonctionne sur les navigateurs récents des PC, tablettes et Chromebooks, **hors ligne une fois chargé**, et sans son.
- Aucune donnée ne quitte l'appareil.
- Les parcours principaux passent un audit axe-core sans violation critique ou sérieuse.
- Ajouter un scénario revient à **écrire un fichier YAML**, sans toucher au code.

## 2. Périmètre et découpage

| Étape | Contenu |
|---|---|
| **Étape 1 (cette spec)** | Moteur complet, 3 modes de jeu, faux téléphone, 2 types de mini-jeux, missions Rappel, espace enseignant, hors ligne, déploiement. **Contenu : thèmes 1 (Phishing) et 5 (Jeux et achats), écrits pour les 3 tranches**, plus 1 mission Rappel par tranche, soit 9 missions. |
| Étape 2 | Thèmes 2, 3, 7 et 8, avec les mini-jeux supplémentaires éventuels (ex. constructeur de mot de passe). |
| Étape 3 | Thèmes sensibles 4 (cyberharcèlement, 3 rôles) et 6 (grooming et sextorsion), **avec relecture par une association spécialisée** avant publication. |
| Plus tard | Protocole d'évaluation (avant, après, à 4-6 semaines), traduction, espace enseignant avec classes. |

Le moteur de l'étape 1 prend déjà en charge les fonctions requises par les étapes 2 et 3 (thème sensible, avertissement, bouton « passer », bandeau d'aide permanent, rôles) : les étapes suivantes n'ajoutent que du contenu.

**Hors périmètre** : comptes, serveur, analytics, classement, audio obligatoire, marques réelles dans les faux écrans.

## 3. Expérience du joueur

### 3.1 Parcours
1. **Accueil** : choix de la tranche (« Je suis en 6e / 5e-3e / Lycée ») et du mode (Solo, Binôme, Classe entière). Bouton « Continuer » si une progression existe. Liens vers « Enseignants » et « Confidentialité ».
2. **Carte des thèmes** : 8 tuiles. Les thèmes non encore écrits s'affichent « Bientôt ». Chaque tuile liste les missions de la tranche avec leur durée et leur état (à faire / terminée). Une tuile « Rappel » est mise en avant quand une mission a été terminée il y a 7 jours ou plus (J+7) puis 30 jours ou plus (J+30).
3. **Mission** : une suite d'étapes (scénarios et mini-jeux), avec une barre de progression.
4. **Fin de mission** : les réflexes retenus, les badges obtenus et 3 questions de débrief affichables en plein écran.

### 3.2 Scénario (4 temps)
1. **Situation** : faux téléphone ou faux écran (SMS, messagerie, réseau social, mail, page web, notification de jeu) aux **marques fictives** (SnapTalk, GameBox, Colis Express, Revendo…).
2. **Choix** : 2 à 4 options, dont toujours « Je demande de l'aide à quelqu'un ».
3. **Indice** : « Quel indice t'a décidé ? ». L'élève sélectionne un ou plusieurs indices dans une liste (ou « Je ne sais pas »), avant toute correction.
4. **Conséquence et récupération** : une conséquence réaliste mais non catastrophique, l'explication des vrais indices, un « À retenir » (2-3 phrases), puis, si le scénario le prévoit, une **action de récupération pratiquée** dans le faux téléphone.

Actions de récupération prises en charge par le moteur (liste fermée, chacune étant un composant) :
- `bloquer-signaler` : ouvrir le menu du contact, puis bloquer, puis signaler avec un motif
- `changer-mdp` : paramètres, sécurité, nouveau mot de passe (règles expliquées), puis déconnecter les autres sessions
- `activer-2fa` : paramètres, sécurité, activer la double authentification
- `capture-preuve` : faire une capture d'écran des messages avant de bloquer
- `prevenir-contacts` : envoyer un message type « on a piraté mon compte, ne cliquez sur rien »
- `demander-aide` : choisir à qui parler (parent, prof, CPE, infirmier·e, 3018), avec des explications

### 3.3 Mini-jeux (étape 1)
- **`tri`** : des cartes (messages, offres, annonces) à ranger dans des catégories (« Arnaque » / « Légitime » / « Je vérifie d'abord »), avec un feedback par carte. Chrono **optionnel** et désactivé par défaut.
- **`repere`** : un écran (page web, URL, publication) avec des zones cliquables ; il faut trouver les N indices. Chaque zone est un élément focusable au clavier.

### 3.4 Modes
- **Solo** : le mode standard.
- **Binôme** : identique au solo, avec un rappel « Discutez avant de choisir » à chaque choix.
- **Classe entière** : texte agrandi, choix numérotés gros format, un bouton « Révéler » contrôlé par l'adulte, et une pause « Votez à main levée » avant chaque validation. Les questions de débrief s'affichent en plein écran.

### 3.5 Missions Rappel
Des missions courtes (~5 min), une par tranche, qui mélangent les thèmes déjà joués. Chacune contient **un message piège non annoncé** (`surprise: true`) glissé parmi des messages anodins, dans un fil de notifications. Le résultat (vérifié, ignoré, signalé ou tombé dans le piège) est affiché à l'élève en fin de mission et enregistré localement.

### 3.6 Thèmes sensibles (moteur prêt dès l'étape 1)
Un thème `sensible: true` déclenche :
- un écran d'avertissement avant la mission (« Ce sujet peut être difficile. Tu peux passer à tout moment. »)
- un bouton « Passer ce scénario », sans aucune pénalité
- un **bandeau d'aide permanent** (3018, 119, 17/112, 114 par SMS), avec des libellés distinguant l'aide humaine, l'urgence et le signalement
- des rôles (`role: victime | temoin | auteur`) affichés en tête de scénario

Règles éditoriales, vérifiées par des tests de contenu quand c'est automatisable : pas d'image intime, pas de rôle de prédateur, pas de question culpabilisante, chaque scénario se termine sur une action possible.

### 3.7 Motivation
Des badges par mission, qui récompensent le **processus** (a identifié les bons indices, a choisi de vérifier ou de demander de l'aide, a terminé les actions de récupération). **Aucun score chiffré affiché, aucun classement.** Un mauvais choix ne bloque jamais la progression : on peut rejouer un scénario.

### 3.8 Accessibilité
Objectif : conformité RGAA / WCAG 2.1 AA.
- HTML sémantique, navigation complète au clavier et focus visible
- aucune information portée uniquement par la couleur
- pas de temps limite obligatoire
- les animations respectent `prefers-reduced-motion` et peuvent être coupées
- polices hébergées localement, sans texte justifié ni long passage en italique
- réglages : taille du texte, interligne, **lecture simplifiée** (utilise le champ `texteSimple` quand il existe)
- un historique des messages relisible dans le faux téléphone

## 4. Architecture technique

### 4.1 Pile technique
Site 100 % statique hébergé sur GitHub Pages, sans back-end. Un back (Express, Supabase) pourra être ajouté plus tard si un besoin précis apparaît : contenu éditable en ligne, statistiques anonymes, classes.

| Techno | Version | Rôle |
|---|---|---|
| **Vue 3** (Composition API, `<script setup>`) | 3.5 | Interface |
| **Vue Router** en mode `createWebHashHistory` | 5.x | Navigation (`#/carte`, `#/mission/:id`), compatible GitHub Pages |
| **TypeScript** (strict) + **vue-tsc** | 5.9 | Langage et vérification des types |
| **Vite** + **@vitejs/plugin-vue** | 8.x | Serveur de dev et build |
| **YAML** (`yaml`) + **Zod** | 2.9 / 4.x | Contenu des missions, validé au build (le build échoue si le contenu est invalide) |
| **vite-plugin-pwa** | 1.x | Mode hors ligne |
| **CSS natif** (variables) | – | Style, thème, contraste élevé, faux téléphone |
| **@fontsource/atkinson-hyperlegible** | 5.x | Police lisible (élèves DYS), hébergée localement |
| **lucide-vue-next** | 1.x | Icônes SVG |
| **Vitest** + **@vue/test-utils** | 5.x / 2.x | Tests unitaires et de composants |
| **Playwright** + **@axe-core/playwright** | 1.6x / 4.x | Tests de bout en bout (Chromium, Firefox, WebKit) et accessibilité |
| **ESLint** (eslint-plugin-vue) + **Prettier** | 10 / 3 | Qualité du code |
| **GitHub Actions** → **GitHub Pages** | – | CI et déploiement gratuit |

TypeScript 7 (réécriture en Go) est volontairement écarté pour l'instant, faute de compatibilité assurée avec l'outillage.

### 4.2 Arborescence
```
content/
  themes.yaml                   # les 8 thèmes (titre, icône, sensible, aides)
  missions/<theme>/<id>.yaml    # une mission = un fichier
src/
  content/   schema.ts (Zod), load.ts (import du JSON compilé), types
  engine/    logique pure, sans UI : mission-runner.ts, badges.ts, rappel.ts
  store/     progress.ts (localStorage versionné), settings.ts
  phone/     faux téléphone : PhoneFrame.vue + écrans (SmsScreen, ChatScreen, SocialScreen, MailScreen, WebScreen, NotifScreen)
  recovery/  un composant .vue par action de récupération
  minigames/ tri/, repere/, registry.ts
  router/    index.ts (routes, hash history)
  pages/     Accueil, Carte, Mission, FinMission, Enseignants, FicheMission,
             Confidentialite, TestTechnique
  ui/        composants communs (Bouton, BandeauAide, Reglages…)
scripts/
  build-content.ts              # YAML → Zod → JSON ; lancé par un plugin Vite et par le CI
tests/
  unit/  e2e/
```

Chaque unité a une responsabilité unique :
- `engine/` ne connaît ni Vue ni le DOM : il reçoit une mission et des événements, et renvoie l'état suivant (testable seul)
- `phone/` affiche un écran décrit par des données
- `minigames/` et `recovery/` sont des composants enregistrés par identifiant, qui renvoient un résultat standard `{ termine, reussites, erreurs }`

### 4.3 Modèle de contenu (résumé)

```yaml
# content/missions/phishing/p-6e-colis.yaml
id: p-6e-colis
theme: phishing
tranches: [6e]
titre: "Le colis mystère"
duree: 15            # minutes
objectifs:           # 3 maximum
  - Reconnaître un SMS d'hameçonnage
  - Vérifier une info par un autre moyen
competences:
  crcn: ["4.1", "1.1"]
  programmes: ["EMI cycle 3"]
  phare: false
etapes:
  - type: scenario
    id: sms-colis
    role: null
    ecran:
      app: sms
      contact: "+33 7 56 ..."
      messages:
        - de: contact
          texte: "Colis Express : votre colis est bloqué. Payez 1,99 € : colis-expres-livraison.info"
          texteSimple: "..."
    question: "Que fais-tu ?"
    choix:
      - id: clic
        texte: "Je clique et je paie, c'est pas cher"
        qualite: risque          # bon | risque | aide
        consequence: "..."
      - id: verif
        texte: "Je demande à mes parents s'ils attendent un colis"
        qualite: bon
        consequence: "..."
      - id: aide
        texte: "Je demande de l'aide à quelqu'un"
        qualite: aide
        consequence: "..."
    indices:
      - { id: url, libelle: "L'adresse du site est bizarre", pertinent: true }
      - { id: urgence, libelle: "On me presse de payer", pertinent: true }
      - { id: montant, libelle: "Le montant est petit", pertinent: false }
    aRetenir: "..."
    recuperation: { action: bloquer-signaler, siChoix: [clic] }  # optionnel
  - type: minijeu
    jeu: tri
    config: { ... }   # validé par le schéma propre à chaque mini-jeu
debrief:
  questions: ["Quel était le piège ?", "Quel indice pourras-tu réutiliser ?", "Que faire si c'est déjà arrivé ?"]
  reponses: "..."
  erreursFrequentes: ["..."]
fiche:
  deroulement: "..."   # suggestion de séance de 55 min
  siRevelation: "..."  # conduite à tenir si un élève révèle une situation réelle
```

Règles validées au build :
- les identifiants sont uniques
- chaque scénario a au moins une option `qualite: aide`, au moins un indice pertinent, un `aRetenir`, et toutes ses conséquences sont non vides
- 3 objectifs maximum par mission
- une mission appartient à un thème existant et cible au moins une tranche
- toute mission d'un thème sensible a une `fiche.siRevelation` renseignée
- une mission Rappel (`type: rappel`) contient exactement un élément `surprise: true`

### 4.4 Stockage local
Une seule clé `localStorage` : `cyber-reflexes:v1`, contenant :
```ts
{ version: 1, tranche, mode, reglages,
  missions: { [id]: { termineeLe: ISODate, badges: string[], choix: {[scenarioId]: choixId} } },
  rappels: { [id]: { faitLe: ISODate, resultatSurprise: 'verifie'|'ignore'|'signale'|'piege' } } }
```
- Toutes les lectures et écritures sont dans un try/catch. Si le stockage est indisponible (navigation privée, blocage), le jeu fonctionne normalement **sans sauvegarde**, avec un petit message.
- Si la version ne correspond pas, une migration est appliquée ; si elle échoue, on repart de zéro.
- Un bouton « Effacer ma progression » est disponible dans les réglages et sur la page Confidentialité.

### 4.5 Espace enseignant
Des pages générées à partir des mêmes fichiers YAML :
- la liste des missions, filtrable par tranche et par thème, avec la durée, les objectifs et les compétences
- une **fiche mission** : déroulé de séance (5 min de cadre, 15-20 min de jeu, 20 min de débrief, 5 min d'aide, 5 min d'engagement), réponses du débrief, erreurs fréquentes, conduite à tenir
- une **feuille de style d'impression** : chaque fiche et chaque mission (version « plan B » papier, avec les scénarios et les choix) s'imprime proprement
- un **test technique de 30 s** (stockage, mode hors ligne, affichage) qui aboutit à un verdict « prêt » ou à une liste de problèmes
- une date de dernière mise à jour (injectée au build) et un lien de contact pour signaler une erreur

### 4.6 Confidentialité
Aucun cookie, analytics, compte ou ressource externe (polices, scripts et images sont tous servis par le site). La page « Confidentialité » est rédigée pour être comprise par un élève de 6e.

## 5. Gestion des erreurs
- **Contenu invalide** : le build échoue avec un message qui indique le fichier, le champ et la règle en cause. Aucun contenu invalide n'est donc publié.
- **Mission introuvable** (lien obsolète) : une page « Cette mission n'existe plus », avec un retour à la carte.
- **Mini-jeu ou action de récupération inconnus** : impossible au runtime, puisque le schéma les valide au build.
- **Stockage indisponible** : voir 4.4.
- **Mise à jour du jeu** : le service worker propose « Nouvelle version disponible, recharger », sans jamais recharger de force en pleine mission.

## 6. Tests
- **Unitaires (Vitest)** : `mission-runner` (enchaînement, choix, indices, récupération conditionnelle, passer), `badges`, `rappel` (calcul J+7 / J+30 avec une date injectée), `progress` (stockage indisponible, migration, effacement), schémas Zod (cas valides et invalides).
- **Contenu** : un test charge tous les YAML réels et vérifie les règles de 4.3, ainsi que la couverture de l'étape 1 (au moins une mission par tranche pour les thèmes 1 et 5, et un Rappel par tranche).
- **Bout en bout (Playwright)** : une mission complète dans chaque mode, une mission jouée uniquement au clavier, un Rappel avec le message surprise, l'impression d'une fiche, le stockage désactivé.
- **Accessibilité** : axe-core sur l'accueil, la carte, une mission (chaque type d'écran), la fin de mission et les pages enseignant, sans violation `critical` ni `serious`.
- **CI** : lint, typecheck, tests unitaires et de contenu, build, puis e2e, avant tout déploiement.

## 7. Contenu de l'étape 1 (9 missions)

| Tranche | Phishing | Jeux et achats | Rappel |
|---|---|---|---|
| 6e | SMS « colis bloqué », faux concours YouTube (+ `tri`) | Générateur de Robux (GameBox Coins), faux échange d'objet rare (+ `repere`) | 1 mission mixte |
| 5e-3e | Ami piraté qui réclame un code, faux mail de l'ENT (+ `repere` sur URL) | Faux modérateur Discord (« ChatCord »), skin ou mod piégé (+ `tri`) | 1 mission mixte |
| Lycée | Fausse offre d'emploi ou de logement, phishing bancaire personnalisé (+ `repere`) | QR code sur l'appli de vente (« Revendo »), paiement hors plateforme (+ `tri`) | 1 mission mixte |

Chaque mission compte 3 ou 4 scénarios et 1 mini-jeu. Les situations reprennent les modes opératoires documentés (Cybermalveillance.gouv.fr, pages de sécurité des plateformes) sous des marques fictives.
