# Cyber Réflexes : la carte de l’archipel (parcours, partie B)

- **Date** : 2026-10-07
- **Statut** : à valider
- **Prérequis** : parcours « îles » 6e, refonte visuelle (jetons, Hulotte, mode sombre) livrés
- **Origine** : partie B des parcours, inspirée d’Interland (Google). Choix de Noa : la carte **remplace la page « Choisis un thème »** ; **archipel libre** (mise en page A) ; les deux thèmes sensibles en **îles calmes à l’écart** ; progression montrée par **objets gagnés, personnage sur la carte, compteur par île, chemin conseillé**. Les parcours 5e – 3e et lycée font l’objet d’une spec séparée (projet 2).

## 1. Objectif

Donner au jeu une vraie carte du monde : après l’accueil, l’élève arrive sur un archipel où chaque thème est une île. Il voit d’un coup d’œil où il en est (objets gagnés, missions faites, où se trouve son personnage) et choisit librement où aller, avec un chemin conseillé.

### Critères de succès
- `/carte` affiche l’archipel : 6 îles « aventure » reliées par un chemin conseillé, un port de départ, un lagon calme à l’écart avec les 2 îles des thèmes sensibles.
- Chaque île est un lien vers sa page `/ile/:theme`, qui liste ses missions (parcours d’abord).
- La progression est exacte et entièrement calculée à partir des missions terminées (aucune nouvelle donnée de progression enregistrée).
- Vue liste (la grille actuelle) accessible en un clic, choix mémorisé.
- Accessibilité : tout au clavier, ordre de tabulation = chemin conseillé puis lagon, noms accessibles complets, aucune information par la couleur seule, audit axe sans violation critique ou sérieuse en clair et en sombre, aucun défilement horizontal à 390 px, lisible à 400 % de zoom.
- Les missions, parcours, moteur et contenus existants sont inchangés.

## 2. Page `/carte` : l’archipel

Ordre de la page :
1. En-tête : Hulotte (`reflechit`), titre **« Choisis une île »**, niveau et lien « changer » (comme aujourd’hui).
2. Carte du rappel (inchangée).
3. **Sacoche** et bouton bascule **« Vue liste » / « Vue carte »** (`aria-pressed`).
4. La carte de l’archipel (ou la vue liste).

### 2.1 La carte
- Fond : mer, écume et chemin en pointillés dessinés en SVG décoratif (`aria-hidden`).
- **Chemin conseillé** (sans blocage, toutes les îles sont ouvertes) : port → hameçons (`phishing`) → clés (`comptes`) → secrets (`vie-privee`) → pièces d’or (`jeux-achats`) → rumeurs (`desinformation`) → antennes (`appareils`).
- **Lagon calme**, à l’écart, hors du chemin : **Île de l’entraide** (`harcelement`, un jardin) et **Île du phare** (`rencontres`, un phare). Couleurs douces, ni objet, ni drapeau, ni fête.
- **Port** : point de départ du chemin, où attend le personnage au début.
- Chaque île est un **lien HTML** (pas un élément SVG) posé sur la mer, contenant : son dessin (SVG `aria-hidden`), une étiquette (nom, compteur, drapeau éventuel) sur fond `--surface` pour garantir le contraste, l’objet gagné, le personnage s’il est là.
- **Mise en page large** (≥ 48rem) : îles dispersées selon des positions fixes en pourcentage (ratio de la carte environ 16:10).
- **Mise en page étroite** (< 48rem) : la carte devient plus haute, les îles se répartissent en deux colonnes décalées, dans le même ordre et sur le même chemin ; le lagon est en bas. Aucun défilement horizontal.
- Le texte des étiquettes suit les réglages de taille et d’interligne ; à fort zoom, les étiquettes passent sous le dessin plutôt que de se chevaucher (la carte grandit en hauteur).
- Les îles flottent doucement (≤ 4 px, cycle lent) ; coupé par `prefers-reduced-motion` et le réglage « Animations ».

### 2.2 Vue liste
- La grille actuelle de `CartePage` (tuiles par thème), déplacée telle quelle dans `VueListe.vue`.
- Réglage `vueCarte: 'archipel' | 'liste'` (défaut `archipel`) dans `reglages`, sans changer la version du stockage. La bascule le met à jour.

## 3. Progression

Calculée pour la **tranche courante** à partir de `store.etat.missions` (`termineeLe`) et du contenu (`missionsPour(tranche, theme)`) :

| Élément | Règle |
|---|---|
| Compteur | « *n* / *m* missions » : missions terminées sur missions disponibles pour ce thème et cette tranche. Île sans mission pour la tranche : « Bientôt disponible ». |
| Drapeau | Quand *n* = *m* > 0 sur une île aventure : drapeau + mot « terminée ». Jamais sur les îles calmes. |
| Objet | Gagné quand **le parcours de l’île pour la tranche** est terminé. Île sans parcours pour la tranche : « Parcours bientôt », pas d’objet à gagner. Jamais d’objet sur les îles calmes. |
| Sacoche | Liste des objets gagnables pour la tranche (îles ayant un parcours), chacun « gagné » ou « pas encore » en texte. Sans aucun parcours pour la tranche : la sacoche n’est pas affichée. |
| Personnage | Sur l’île du thème de la **dernière mission terminée** de la tranche (plus grand `termineeLe` ; rappels exclus) ; au port si aucune. Personnage choisi (`store.etat.personnage`) dessiné avec `PersonnageG` ; si aucun, Hulotte attend au port. |

Les objets reprennent `ILES_INFO[…].objet` (bouclier, trophée, coffre-fort, cape d’invisibilité, loupe, antenne sûre).

## 4. Page `/ile/:theme`
- Thème inconnu : page introuvable existante.
- En-tête : dessin de l’île, nom de l’île, nom du thème, objet (gagné / pas encore / parcours bientôt), compteur.
- Thème sensible : encadré doux reprenant la phrase d’avertissement existante du thème (pas de nouveau texte de contenu) et le bandeau d’aide habituel de la mission reste inchangé.
- Liste des missions de la tranche : parcours d’abord (mention « Parcours »), puis missions classiques ; chacune avec titre, durée, statut « Terminée » (texte + icône).
- Lien « Retour à l’archipel » en haut et en bas ; titre de document « *Nom de l’île* ».
- En quittant une mission, le lien de retour existant ramène à l’île de la mission (au lieu de `/carte`), si le thème est connu.

## 5. Accessibilité
- Chaque île : `<a>` dont le nom accessible est complet, par exemple « Île aux hameçons — 3 missions sur 3 terminées, bouclier gagné, tu es ici ». Le dessin et le personnage sont `aria-hidden`.
- La carte est une liste ordonnée (`<ol>`) dans l’ordre du chemin, suivie de la liste du lagon (titre « Lagon calme »). L’ordre du DOM = ordre de tabulation = ordre de lecture.
- Repère de focus des briques existantes, visible sur la mer en clair et en sombre (vérifié par test de contraste sur le jeton de mer).
- Cibles ≥ 44 px (toute l’île est cliquable).
- Bascule carte/liste : bouton avec `aria-pressed` ; le focus reste sur le bouton.

## 6. Couleurs et dessins
- Nouveaux jetons dans `palette.ts` / `tokens.css` : `--mer`, `--mer-profonde`, `--ecume` (clair et sombre). Le test de contraste vérifie : `focus` sur `--mer` ≥ 3:1 dans les deux modes ; les étiquettes étant sur `--surface`, leur texte est déjà couvert.
- Dessins des îles en SVG, couleurs littérales dans le `<template>` (autorisé), reprises de `ILES_INFO` pour les 6 îles aventure ; données des 2 îles calmes dans un nouveau module (`src/archipel/ilesCalmes.ts`), séparé de `ILES` qui reste la liste des îles à parcours.
- Rien de neuf dans `<style>` en dur (test « sans hex » inchangé, sans exemption).

## 7. Technique
- `src/archipel/progression.ts` : fonctions pures
  - `etatIle(theme, tranche, missionsTerminees, contenu)` → `{ terminees, total, aParcours, objetGagne, complete }`
  - `positionPersonnage(tranche, missionsTerminees, contenu)` → `themeId | 'port'`
- `src/archipel/positions.ts` : ordre du chemin, positions large et étroite (pourcentages), position du port et du lagon.
- Composants : `ArchipelCarte.vue`, `IleLien.vue`, `IleDessin.vue`, `Sacoche.vue`, `VueListe.vue` ; page `IlePage.vue`, route `{ path: '/ile/:theme', name: 'ile' }` avec titre de document.
- `CartePage.vue` : en-tête, rappel, sacoche, bascule, puis `ArchipelCarte` ou `VueListe`.
- Store : `reglages.vueCarte`. Aucune autre donnée.

## 8. Tests
- **Unitaires** : `progression` (compteur, drapeau seulement si complet et île aventure, objet seulement si le parcours de la tranche est fait, tranche sans parcours, personnage au port puis sur la dernière île, rappels ignorés) ; noms accessibles des îles ; ordre des liens ; bascule et persistance de `vueCarte` (et migration sans le champ) ; page île (parcours d’abord, encadré doux en thème sensible, thème inconnu → introuvable) ; contraste du focus sur `--mer`.
- **E2E** : audit axe sur `/carte` et `/ile/phishing` en clair et en sombre ; parcours complet au clavier (Tab jusqu’à une île, Entrée, mission) ; aucun défilement horizontal à 390 px ; vue liste.
- Les helpers e2e existants qui cliquaient une mission depuis `/carte` passent par l’île (`ouvrirIle(page, 'Île aux hameçons')`), et le titre attendu devient « Choisis une île ». Aucune assertion de comportement du jeu ne change.

## 9. Hors périmètre
- Parcours 5e – 3e et lycée (projet 2 : les îles se rempliront d’elles-mêmes).
- Navigation libre à l’intérieur d’une île (le parcours reste linéaire).
- Nouveaux personnages, sons, carte de l’archipel en impression.
