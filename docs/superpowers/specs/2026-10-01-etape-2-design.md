# Cyber Réflexes, étape 2 : quatre nouveaux thèmes et leurs mini-jeux

- **Date** : 2026-10-01
- **Statut** : à valider
- **Prérequis** : étape 1 et évolution « pourquoi » livrées (`2026-09-24-cyber-reflexes-design.md`, `2026-09-28-pourquoi-leviers-design.md`)

## 1. Objectif

Rendre jouables les 4 thèmes non sensibles encore marqués « Bientôt disponible », pour les 3 niveaux, chacun avec un mini-jeu dédié :

| Thème (id) | Mini-jeu (id) |
|---|---|
| Mots de passe et comptes (`comptes`) | Constructeur de mot de passe (`motdepasse`) |
| Réseaux sociaux et vie privée (`vie-privee`) | Réglages de confidentialité (`confidentialite`) |
| Fake news et deepfakes (`desinformation`) | Vrai ou trafiqué ? (`verification`) |
| Wi-Fi, applis et mises à jour (`appareils`) | Permissions d'applis (`permissions`) |

### Critères de succès
- 12 nouvelles missions (4 thèmes × 3 niveaux), chacune avec 3 scénarios et le mini-jeu de son thème.
- Les 4 mini-jeux se jouent entièrement au clavier, sans chrono, sans « perdu », et passent l'audit axe (aucune violation critique ou sérieuse).
- Toutes les règles de contenu existantes passent (tests de contenu inchangés ou renforcés).
- Aucun changement du moteur de mission, du stockage, du réseau ni des rappels.

## 2. Les mini-jeux

**Principes communs** : composants Vue dans `src/minigames/`, configuration YAML validée par un schéma Zod dans `src/content/schema.ts` (ajouté à l'union `minijeuSchema`), résultat `{ reussites, erreurs }` émis via `termine` comme `tri` et `repere`. Boutons et champs réels, focus géré à chaque changement d'état (mécanisme `src/ui/focus.ts`), aucune information portée par la couleur seule, textes en U+2019. L'élève peut toujours terminer.

### 2.1 Constructeur de mot de passe (`motdepasse`)
- **Config** : `consigne`, `contexte` (ex. « Crée le mot de passe de ton nouveau compte GameBox »), `objectif` (`solide` | `tres-solide`), `interdits` (mots à ne pas utiliser, optionnel : prénom, pseudo, date tirés du contexte).
- **Écran** : un champ texte (avec rappel permanent « N’écris pas ton vrai mot de passe »), une jauge à 5 niveaux (très faible, faible, moyen, solide, très solide) affichée en texte et en barre, une estimation « temps pour le deviner » (quelques secondes, quelques heures, quelques mois, des années, des siècles) annoncée comme une estimation, et une liste de conseils qui se cochent (au moins 12 caractères, plusieurs mots, pas de suite connue, pas de mot interdit, pas de caractère répété à la chaîne).
- **Évaluation** : fonction pure `evaluerRobustesse(mdp, interdits)` dans `src/minigames/robustesse.ts` (testée à part) ; rien n'est enregistré ni envoyé.
- **Fin** : bouton « Valider » actif quand l'objectif est atteint (réussite 1) ; « Je passe » toujours disponible (erreur 1), suivi d'un exemple de bonne phrase de passe.

### 2.2 Réglages de confidentialité (`confidentialite`)
- **Config** : `consigne`, `appNom` (fictif), `reglages` (3 à 8) : `{ id, libelle, options: [{ id, libelle }], initial, conseille, explication }`. Validation : `initial` et `conseille` existent dans `options` ; au moins un réglage où `initial ≠ conseille`.
- **Écran** : un faux écran « Paramètres » avec un groupe de boutons radio par réglage, puis « Vérifier mon profil ».
- **Fin** : chaque réglage est marqué juste ou à revoir (texte + icône) avec son explication ; réussites = réglages conformes, erreurs = les autres ; bouton « Terminer le mini-jeu ».

### 2.3 Vrai ou trafiqué ? (`verification`)
- **Config** : `consigne`, `publication` (`auteur`, `texte`, `date` optionnelle, `image` optionnelle = `{ description }`), `actions` (2 à 5) : `{ id, libelle, resultat }`, `verdict` (`fiable` | `douteux` | `faux`), `explication`.
- **Écran** : une publication fictive ; l'image éventuelle est un cadre décrit (aucune vraie photo, aucune ressource externe). Les actions d'enquête (« Chercher la source », « Vérifier la date », « Recherche d’image inversée »…) révèlent chacune leur résultat. Trois boutons de verdict.
- **Fin** : réussite 1 si le verdict est juste, sinon erreur 1 ; l'explication s'affiche dans les deux cas. Le jeu encourage l'enquête (« As-tu vérifié avant de décider ? ») sans l'imposer.

### 2.4 Permissions d'applis (`permissions`)
- **Config** : `consigne`, `apps` (1 à 3) : `{ id, nom, description, permissions: [{ id, libelle, necessaire, explication }] }` (2 à 5 permissions par appli).
- **Écran** : une appli à la fois, chaque permission avec « Autoriser » / « Refuser » (boutons radio), puis « Valider ».
- **Fin** : chaque décision est expliquée ; réussites = décisions justes, erreurs = les autres.

### 2.5 Intégration
- `MinijeuStep.vue` affiche le composant selon `jeu`.
- `PlanBPage.vue` imprime chaque mini-jeu : champ « écris une phrase de passe » + critères (motdepasse), réglages à cocher (confidentialite), publication + verdict à cocher (verification), tableau Autoriser/Refuser (permissions), et leur corrigé.
- Thèmes `comptes`, `vie-privee`, `desinformation`, `appareils` : déjà présents dans `content/themes.yaml`, rien à changer ; la carte les affiche dès qu'ils ont des missions.

## 3. Contenu : 12 missions, 36 scénarios

Chaque mission : 3 scénarios (choix `risque` qui tente vraiment, `bon`, `aide`), bloc `pourquoi` de 3 ou 4 leviers, récupération sur au moins 2 scénarios, et le mini-jeu de son thème. Règles existantes : marques et numéros fictifs, 6e ≤ 20 mots par phrase et versions simplifiées, citations des `truc` présentes à l'écran (et en lecture simplifiée en 6e), choix risqué pas systématiquement le plus long, ton jamais culpabilisant, conseils exacts.

| Thème | 6e | 5e – 3e | Lycée |
|---|---|---|---|
| Mots de passe | copain qui demande ton mot de passe pour jouer à ta place ; même mot de passe partout après une fuite d'un site de jeu ; code reçu par SMS sans rien avoir demandé · mini-jeu objectif « solide » | faux support qui réclame le code de double authentification ; compte volé et « récupérateur » payant ; session restée ouverte sur un ordinateur du CDI · objectif « solide » | variantes d'un même mot de passe au lieu d'un gestionnaire ; alerte de connexion depuis un appareil inconnu ; fausse page qui relaie le code de double authentification · objectif « très solide » |
| Vie privée | photo devant le collège avec son nom visible ; profil public avec la date d'anniversaire et un inconnu qui pose des questions ; concours qui demande adresse et photo · 4 réglages | story qui partage la position en direct ; photo d'un ami publiée sans son accord ; quiz « quel personnage es-tu ? » qui pose des questions de sécurité · 6 réglages | photo vendue en ligne dont les métadonnées révèlent l'adresse ; vieilles publications ressorties lors d'une candidature ; position partagée avec les « amis d'amis » · 7 réglages |
| Fake news | image d'animal générée par IA présentée comme réelle ; rumeur « le collège ferme demain, partage à 10 personnes » ; astuce santé virale · image d'animal | extrait vidéo d'un prof sorti de son contexte ; fausse capture d'écran attribuée au collège ; compte parodie qui imite un média · capture trafiquée | deepfake d'une personnalité politique fictive avant une élection ; info urgente reprise par des dizaines de comptes ; faux site qui imite un journal · deepfake |
| Wi-Fi, applis | appli lampe torche qui demande les contacts ; mise à jour repoussée depuis des semaines ; jeu « gratuit » à installer hors store · 2 applis | appli « premium gratuite » installée hors store ; QR code « Wi-Fi gratuit du festival » qui ouvre un faux portail ; extension de navigateur qui veut lire toutes les données · 3 applis | Wi-Fi public de la gare avec faux portail de connexion ; logiciel piraté qui vole les mots de passe ; VPN gratuit douteux · 3 applis |

**Vigilance par thème** : aucun exemple de vrai mot de passe affiché ; gestionnaire de mots de passe et VPN sans marque réelle ; personnalité politique et parti fictifs, sans orientation ; aucun visage réel, images seulement décrites ; aucun opérateur, magasin d'applis ou appli réels nommés dans les faux écrans.

## 4. Tests
- **Unitaires** : `evaluerRobustesse` (niveaux, mots interdits, suites connues, répétitions, phrases de passe) ; chaque mini-jeu (déroulé complet, résultat émis, « Je passe » / fin toujours possible, clavier, focus) ; schémas (cas valides et invalides de chaque config) ; `MinijeuStep` et `PlanBPage` pour chaque nouveau mini-jeu.
- **Contenu réel** : couverture (au moins une mission par niveau pour chacun des 4 nouveaux thèmes) ; chaque mission de ces thèmes utilise le mini-jeu de son thème ; règles existantes étendues aux textes des nouveaux mini-jeux (marques réelles, 6e ≤ 20 mots).
- **E2E** : parcours d'une mission par nouveau mini-jeu (helper `jouerMission` étendu) ; audit axe de chaque nouveau mini-jeu.

## 5. Hors périmètre
- Thèmes sensibles (cyberharcèlement, rencontres en ligne) : étape 3, avec relecture par une association spécialisée.
- Unifier `evaluerRobustesse` avec la règle simple de la récupération « changer son mot de passe » (`src/recovery/motDePasse.ts`) : possible plus tard.
- Nouvelles actions de récupération (ex. « supprimer une publication ») : les 6 actions existantes sont réutilisées.
