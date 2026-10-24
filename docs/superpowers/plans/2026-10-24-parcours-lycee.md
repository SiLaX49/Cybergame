# Parcours lycée à trois routes — plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ajouter une route de réparation (un choix risqué de la bifurcation qui porte `suite`) et écrire les 6 parcours lycée à trois routes, dont 2 en brouillon.

**Architecture :** `src/engine/routes.ts` reconnaît le choix risqué à `suite` comme troisième successeur d’une bifurcation (routes, numéros 3c, schéma texte, validation) ; le moteur fait « Continuer » vers cette route ; l’interface, la fiche, le plan B et l’export suivent `routesDe`. Le mécanisme de brouillon est élargi à toute mission `relecture.statut: a-relire`. Le contenu s’appuie sur `docs/recherche/2026-10-24-dossier-lycee.md`.

**Tech Stack :** Vue 3.5 `<script setup>`, TypeScript strict, Zod 4, Vite 8, Vitest 5 (jsdom + `tests/unit/node`), Playwright + @axe-core/playwright, contenu YAML dans `content/missions/`.

**Spec :** `docs/superpowers/specs/2026-10-24-parcours-lycee-design.md` · **Source du contenu :** `docs/recherche/2026-10-24-dossier-lycee.md`

## Global Constraints

- Parcours 6e et 5e – 3e, missions classiques, rappels et thèmes sensibles inchangés ; tous les tests existants restent verts.
- `suite` sur un choix `risque` : seulement sur une bifurcation (choix `bon` et `aide` vers deux cibles distinctes), un seul par lieu, cible distincte des deux autres, avec étiquette `route` ; `recuperation.siChoix` ne liste jamais ce choix. Tout autre choix risqué fait rester sur place.
- Ordre des routes : `bon` (a), `aide` (b), réparation (c). Toutes les routes : même longueur, 4 à 6 lieux, finissent sur la dernière étape ; au plus un mini-jeu, commun.
- Aucune phrase ne classe les routes. La route de réparation termine la mission et gagne l’objet de l’île.
- Contenu lycée : seuls les faits du dossier ; aucun chiffre sur « les lycéens » ; dispositifs nommés uniquement ceux de la section C0, dans leur périmètre ; jamais de remboursement garanti ni de disparition totale promise ; pas de numéro d’opposition universel ; pas de « méthode officielle CLEMI » ; pas de mules, paris, paiement fractionné, loot boxes ; PHAROS jamais pour injures ou diffamation ; marques et noms fictifs ; pas de décor `classe`.
- Choix `aide` : commence par « Je demande de l’aide » et ne contient pas « un adulte ».
- Accessibilité : tout au clavier, état en texte, audit axe sans violation critique ou sérieuse en clair et en sombre. Couleurs des `<style>` via jetons uniquement ; les SVG gardent leurs couleurs littérales dans le template.
- Aucun script temporaire dans le dépôt ; ne jamais committer `Cahier des charges — Cyber Réflexes.docx`, `.superpowers/`, `dist-relecture/`.
- Commits en français, style conventionnel, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Avant chaque commit : `npm run lint`, `npm run typecheck`, `npm test` verts.

## Review Focus

1. **« Réessayer » puis bon choix sur la bifurcation** : l’élève voit la conséquence du risque à `suite`, clique « Réessayer », choisit `bon` → route a, l’historique ne contient aucun lieu c → test T2.
2. **Classe entière** : le vote choisit le risque à `suite` → « Continuer » mène à 3c (mêmes événements qu’en Solo) → test T2.
3. **Choix risqué ordinaire sur la même bifurcation** (sans `suite`) : toujours « Réessayer » seul, pas de « Continuer » → tests T2 (moteur refuse `continuer`) et T3 (panneau).
4. **Parcours à deux routes du collège** : numéros, schéma texte, fin de mission (« l’autre route », singulier) et plan B strictement inchangés → tests T1 et T3 (assertions existantes conservées).
5. **Build de production** : un parcours lycée brouillon n’apparaît ni dans `dist/assets/*.js` ni sur l’archipel (île « Parcours bientôt » en lycée) ; les 4 parcours publiés y sont → test T4 et vérification T9.

---

## Fichiers

| Fichier | Rôle | Tâche |
|---|---|---|
| `src/engine/routes.ts`, `tests/unit/routes.test.ts` | troisième route, validation, numéros, schéma, `choixDeBifurcation` | T1 |
| `src/engine/mission-runner.ts`, `tests/unit/parcours-moteur.test.ts` | « Continuer » vers la réparation | T2 |
| `src/mission/ReactionPanel.vue`, `src/mission/FinMission.vue`, `src/pages/FicheMissionPage.vue`, `src/pages/PlanBPage.vue`, `scripts/export-relecture.ts`, `tests/unit/parcours-routes-ui.test.ts`, `tests/unit/parcours-routes-enseignant.test.ts` | interface et documents | T3 |
| `scripts/build-content.ts`, `scripts/verifier-publication.ts`, `scripts/export-relecture.ts`, `src/content/validate.ts`, `README.md`, tests node | brouillons généralisés | T4 |
| `src/content/schema.ts` (`DECORS`), `src/mission/DecorScene.vue`, `src/parcours/decors.ts`, `tests/unit/node/content-real.test.ts` | 3 décors, règles lycée | T5 |
| `content/missions/{phishing,jeux-achats}/…-lycee-parcours.yaml` | 2 parcours publiés | T6 |
| `content/missions/{comptes,desinformation}/…-lycee-parcours.yaml` | 2 parcours publiés | T7 |
| `content/missions/{vie-privee,appareils}/…-lycee-parcours.yaml` | 2 parcours brouillons | T8 |
| `tests/e2e/parcours-routes.spec.ts`, `README.md`, `content-real.test.ts` | e2e, couverture, relecture exactitude, doc | T9 |

Ordre : T1 → T2 → T3 → T4 → T5 → (T6, T7, T8 en parallèle : fichiers YAML disjoints) → T9.

---

### Task 1 : Routes à trois branches

**Files :**
- Modify : `src/engine/routes.ts`
- Test : `tests/unit/routes.test.ts`

**Interfaces :**
- Produces :
  - `successeurs(etapes, id)` : sur une bifurcation, `[cibleBon, cibleAide, cibleReparation?]` (ordre fixe bon, aide, risque).
  - `bifurcation(etapes, id): { bon: string; aide: string; reparation?: string } | null`.
  - `choixReparation(etapes: Etape[], id: string): string | null` (nouveau, exporté) : identifiant du choix risqué à `suite` du lieu, s’il est valide (le lieu est une bifurcation `bon`/`aide`), sinon `null`.
  - `choixDeBifurcation(...)` : ajoute `reparation?: string` (étiquette) et `texteReparation?: string`.
  - `numerosLieux` : `3a`, `3b`, `3c` ; `schemaRoutes` : `… selon le choix : 3a – 4a ou 3b – 4b ou 3c – 4c, puis 5`.

- [ ] **Step 1 : Tests (fixture `trois` à côté de `fourche`)**

```ts
const trois = [
  lieu('l1'),
  lieu('l2', [
    { id: 'b', qualite: 'bon', suite: 'a3', route: 'je fais seul' },
    { id: 'r', qualite: 'risque', suite: 'c3', route: 'je fonce' },
    { id: 'r2', qualite: 'risque' },
    { id: 'a', qualite: 'aide', suite: 'b3', route: 'je demande' },
  ]),
  lieu('a3'), lieu('a4', undefined, 'l5'),
  lieu('b3'), lieu('b4', undefined, 'l5'),
  lieu('c3'), lieu('c4'),
  lieu('l5'),
]
```
- `trois : la réparation est la troisième route` : `successeurs(trois,'l2')` = `['a3','b3','c3']` ; `bifurcation(trois,'l2')` = `{ bon:'a3', aide:'b3', reparation:'c3' }` ; `routesDe(trois)` = les 3 routes dans l’ordre a, b, c ; `verifierRoutes(trois)` = `[]` ; `choixReparation(trois,'l2')` = `'r'`.
- `trois : numéros et schéma` : `numerosLieux(trois)` contient `c3: '3c', c4: '4c', l5: '5'` ; `schemaRoutes(trois)` = `'Lieux 1 – 2, puis selon le choix : 3a – 4a ou 3b – 4b ou 3c – 4c, puis 5'`.
- `trois : choixDeBifurcation donne la réparation` : `reparation: 'je fonce'`, `texteReparation: 'r'`.
- `trois : aVenir avant la bifurcation` : `aVenir(trois,'l1')` = `['l2', null, null, 'l5']`.
- Refus (`verifierRoutes` non vide, message attendu) :
  - risque à `suite` sur un lieu qui n’est pas une bifurcation (`lineaire` avec `{ id:'r', qualite:'risque', suite:'l4' }` sur `l2`) → `un choix risqué fait rester sur place : pas de suite` ;
  - deux risques à `suite` sur la bifurcation → `une bifurcation a au plus un choix risqué qui mène à une route de réparation` ;
  - risque à `suite` vers la même cible que `bon` → `une bifurcation sépare exactement le choix « bon » et le choix « aide »` (ou message dédié : cibles distinctes) ;
  - risque à `suite` sans `route` → message actuel sur l’étiquette `route` ;
  - route c plus longue (`c4` → `c5` → `l5`) → `toutes les routes doivent avoir la même longueur` ;
  - `recuperation: { action: 'capture-preuve', siChoix: ['r'] }` sur `l2` → `le choix qui mène à la route de réparation n’a pas de récupération : la route répare`.
- Les tests existants (`lineaire`, `fourche`) restent inchangés et verts.

- [ ] **Step 2 : Lancer** `npx vitest run tests/unit/routes.test.ts` → échecs attendus sur les nouveaux tests.

- [ ] **Step 3 : Implémenter dans `src/engine/routes.ts`**

`choixReparation` : la bifurcation se décide d’abord sur les seuls choix `bon`/`aide` (cibles distinctes), puis on cherche le choix `risque` à `suite`. `successeurs` ajoute sa cible en dernier. `verifierRoutes` : le contrôle « risque → pas de suite » ne s’applique plus au choix rendu par `choixReparation` ; ajouter les messages ci-dessus ; la vérification de bifurcation accepte 2 ou 3 successeurs. `recuperation` est lue via `(e as { recuperation?: { siChoix: string[] } }).recuperation`. `numerosLieux` reste générique (lettre = rang de route).

- [ ] **Step 4 : Lancer** `npx vitest run tests/unit/routes.test.ts tests/unit/schema.test.ts tests/unit/node` → vert.

- [ ] **Step 5 : Commit** `feat(parcours): route de réparation, troisième branche d’une bifurcation`

---

### Task 2 : Moteur — « Continuer » vers la réparation

**Files :**
- Modify : `src/engine/mission-runner.ts`
- Test : `tests/unit/parcours-moteur.test.ts`

**Interfaces :**
- Consumes : `choixReparation` (T1).
- Produces : `vaVersReparation(mission: Mission, etat: RunState): boolean` (exporté) : vrai si l’étape courante est un lieu en phase `consequence` dont le choix courant est `choixReparation(...)`. Utilisé par T3.

- [ ] **Step 1 : Tests** (mission de test construite comme les autres de ce fichier, avec la forme `trois` de T1 ; mettre un `pourquoi` sur `l2`) :
- `réparation : pourquoi, conséquence, puis Continuer mène à c3` : `choisir r` → phase `pourquoi` ; `expliquer` → `consequence`, `vaVersReparation` vrai ; `continuer` → `etapeId === 'c3'`, `chemin` finit par `'l2'`, `resultats.l2.qualite === 'risque'`, `essais` contient `'r'`.
- `réparation : jouée jusqu’au bout` : c3, c4, l5 en `bon` → `termine === true`, `chemin` = `['l1','l2','c3','c4','l5']`.
- `réparation : Réessayer puis bon` : après la conséquence de `r`, `rejouer` → phase `situation` ; `choisir r` lève `RunError` (déjà essayé) ; `choisir b`, `continuer` → `a3`.
- `risque ordinaire sur la bifurcation` : `choisir r2` → `expliquer` → `continuer` lève `RunError` ; `vaVersReparation` faux.
- `passer la bifurcation suit la route bon` (avec la forme `trois`) → `a3`.
- `Classe entière` : même séquence d’événements qu’en Solo, même `etapeId` (le moteur ne dépend pas du mode : asserter l’égalité des états).

- [ ] **Step 2 : Lancer** `npx vitest run tests/unit/parcours-moteur.test.ts` → échecs attendus.

- [ ] **Step 3 : Implémenter** : dans `continuer`, un lieu dont `resultat.qualite === 'risque'` et dont le choix est `choixReparation` passe à `suivante(mission, etat, etat.resultats, resultat.choixId)` (la récupération ne peut pas s’appliquer : T1 l’interdit). Rien d’autre ne change.

- [ ] **Step 4 : Lancer** `npx vitest run tests/unit` → vert.

- [ ] **Step 5 : Commit** `feat(parcours): le choix de réparation fait avancer vers sa route`

---

### Task 3 : Interface, fiche, plan B, export

**Files :**
- Modify : `src/mission/ReactionPanel.vue`, `src/mission/LieuStep.vue` (prop si nécessaire), `src/mission/FinMission.vue`, `src/pages/FicheMissionPage.vue`, `src/pages/PlanBPage.vue`, `scripts/export-relecture.ts`
- Test : `tests/unit/parcours-routes-ui.test.ts`, `tests/unit/parcours-routes-enseignant.test.ts` ; fixture lycée à trois routes ajoutée à `tests/unit/content-mock-parcours.ts`

**Interfaces :**
- Consumes : `choixReparation`, `choixDeBifurcation().reparation/texteReparation`, `numerosLieux`, `schemaRoutes` (T1) ; `vaVersReparation` (T2).

Textes exacts (copie de la spec) :
- Réaction au risque à `suite` : `Tu avances quand même.` (en gras) puis ` Dans la vraie vie, une erreur se répare : la suite te montre comment.` ; boutons `Réessayer` (secondaire) et `Continuer` (principal). Verdict et classe du risque inchangés.
- Fin de mission, trois routes : `Tu as pris la route « X ». Il existe d’autres routes.` / bouton `Rejouer pour découvrir les autres routes` ; deux routes : textes actuels inchangés.
- Fin de mission, route de réparation prise : en plus, `Tu as fait une erreur et tu l’as réparée : c’est aussi un réflexe.`
- Fiche : piste de débrief `Comparez les trois routes : qu’est-ce qu’on peut encore faire après une erreur ? Qui aide pour quoi ?` (deux routes : piste actuelle) ; une ligne `Si l’élève clique « Réessayer » après le choix qui ouvre la route de réparation, ce choix reste grisé : rejouez la mission pour la découvrir.`
- Plan B, bifurcation à trois routes : `Si tu choisis « A », va au lieu 3a. Si tu choisis « B », va au lieu 3b. Si tu choisis « C », va au lieu 3c. Si tu as coché un autre choix, relis la situation et choisis à nouveau.`

- [ ] **Step 1 : Tests** :
  - `ReactionPanel : risque à suite` → contient « Tu avances quand même », boutons « Réessayer » et « Continuer » ; clic « Continuer » émet `continuer`. `ReactionPanel : risque ordinaire` → « Tu restes sur ta plateforme », seul « Réessayer » (assertion existante conservée).
  - `FinMission : route de réparation` → « Tu as pris la route « je fonce » », « d’autres routes », « Rejouer pour découvrir les autres routes », « c’est aussi un réflexe ». `FinMission : collège à deux routes` → textes actuels inchangés.
  - `Fiche : trois routes` → schéma `… ou 3c – 4c …`, piste de débrief à trois routes, ligne « Réessayer ».
  - `Plan B : trois renvois` → texte exact ci-dessus avec 3a / 3b / 3c ; corrigé des 9 lieux.
  - `export : route de réparation` → les lieux 3c et 4c sont marqués de l’étiquette de réparation.
- [ ] **Step 2 : Lancer** `npx vitest run tests/unit/parcours-routes-ui.test.ts tests/unit/parcours-routes-enseignant.test.ts` → échecs attendus.
- [ ] **Step 3 : Implémenter** (ReactionPanel reçoit `versReparation: boolean`, calculé par LieuStep via `vaVersReparation` ou `choixReparation`).
- [ ] **Step 4 : Lancer** `npm test` → vert. Contrôle visuel : capture de la réaction « Tu avances quand même » en clair et sombre (PNG dans le scratchpad, hors dépôt).
- [ ] **Step 5 : Commit** `feat(parcours): réaction, fin de mission, fiche, plan B et export de la route de réparation`

---

### Task 4 : Brouillons pour toute mission à relire

**Files :**
- Modify : `scripts/build-content.ts` (`estBrouillon`), `scripts/verifier-publication.ts` (`brouillonsSensiblesBruts` → `brouillonsBruts`), `scripts/export-relecture.ts` (sélection par défaut), `README.md` (section « Statut de relecture »)
- Test : `tests/unit/node/build-content.test.ts`, `tests/unit/node/verifier-publication.test.ts`, `tests/unit/brouillon.test.ts` (fixture non sensible `a-relire` dans `tests/unit/content-mock.ts`)

**Interfaces :**
- Produces : `estBrouillon(mission: Mission, themes: Theme[]): boolean` = `mission.relecture?.statut === 'a-relire'` (le paramètre `themes` est gardé pour ne pas changer les appelants, ou retiré partout : au choix, tant que typecheck passe). `brouillonsBruts(racineContenu: string): string[]` (renommé ; lit tous les YAML, plus seulement les thèmes sensibles).

- [ ] **Step 1 : Tests** :
  - `estBrouillon : mission non sensible à relire` → vrai ; `relue-interne` → faux ; sans bloc → faux.
  - `buildContent({ brouillons: false })` exclut une mission non sensible `a-relire`.
  - `verifierPublication` échoue si l’identifiant d’un brouillon non sensible est dans les assets ; `brouillonsBruts` le liste.
  - Bandeau « Brouillon » sur MissionPage et FicheMissionPage pour la fixture non sensible `a-relire`.
  - La règle « `relecture` obligatoire pour un thème sensible » (`src/content/validate.ts`) reste testée et verte.
- [ ] **Step 2 : Lancer** `npx vitest run tests/unit/node tests/unit/brouillon.test.ts` → échecs attendus.
- [ ] **Step 3 : Implémenter.** Export : sans `--toutes`, exporter les missions sensibles **et** toutes les missions `a-relire`. README : la règle devient générale (toute mission `a-relire`), le bloc reste obligatoire pour un thème sensible.
- [ ] **Step 4 : Lancer** `npm test`, puis `npm run build; npx tsx scripts/verifier-publication.ts` → vert.
- [ ] **Step 5 : Commit** `feat(contenu): brouillon pour toute mission à relire, sensible ou non`

---

### Task 5 : Décors lycée et règles de contenu

**Files :**
- Modify : `src/content/schema.ts` (`DECORS`), `src/mission/DecorScene.vue`, `src/parcours/decors.ts`, `tests/unit/node/content-real.test.ts`, tests qui énumèrent les décors

**Interfaces :**
- Produces : décors `entreprise` (emoji `🏢`), `banque` (`🏦`), `festival` (`🎪`) ; règles lycée que T6–T8 doivent satisfaire.

- [ ] **Step 1 : Décors** : trois `<template v-else-if>` dans `DecorScene.vue` (viewBox 320×160, style des existants, couleurs littérales) : `entreprise` (bureau ou atelier : établi, écran, badge, fenêtre) ; `banque` (guichet, distributeur, panneau) ; `festival` (scène, tentes, guirlandes, stand). Contrôle visuel via un HTML dans le scratchpad et `npx playwright screenshot`.
- [ ] **Step 2 : Règles adaptées** :
  - « 5 lieux par route… durée de la tranche » : `duree` = 15 (6e), 20 (5e-3e), **25 (lycee)**.
  - Ajouter `it.skip` « les 6 îles ont un parcours lycée » (dé-skippé en T9).
- [ ] **Step 3 : `describe('parcours lycée : trois routes')`** sur `parcours.filter((m) => m.tranches.includes('lycee'))` (avec le `it.skip` vide si aucun, comme le collège) :
  - une bifurcation, **trois** routes, `choixReparation` non nul ;
  - un mini-jeu `tri` présent sur chacune des 3 routes ;
  - au moins un lieu avec récupération sur chaque route, au moins deux sur la route de réparation ;
  - aucun texte de route ne compare les routes (réutiliser `COMPARE` et `lieuxPropres` du collège) ;
  - aucune formule culpabilisante sur les lieux de la route de réparation (réutiliser la règle des thèmes sensibles du même fichier) ;
  - étiquettes `route` courtes sur les 3 choix de bifurcation ; titre `L’île … : …` ; choix `bon` de la bifurcation ne commence pas par « Je demande » ;
  - aucun choix `aide` ne contient `/\bun adulte\b/i` ;
  - aucun lieu au décor `classe` ;
  - dispositifs nommés : tout texte (guide, choix, réactions, aRetenir, cartes du tri) qui contient `PHAROS` ne contient ni `injure` ni `diffamation` ; aucun texte ne contient `rembours` suivi de `garanti` (`/rembours\w*\s+garanti/i`) ; aucun pourcentage (`/\d+\s?%/`) ;
  - `vie-privee` et `appareils` : `relecture.statut === 'a-relire'` ; les 4 autres sans bloc `relecture` ou relus.
- [ ] **Step 4 : Lancer** `npm run lint; npm run typecheck; npm test` → vert (règles lycée en skip).
- [ ] **Step 5 : Commit** `feat(parcours): décors entreprise, banque et festival ; règles des parcours lycée`

---

### Task 6 : Parcours lycée — hameçons et pièces d’or (publiés)

**Files :**
- Create : `content/missions/phishing/p-lycee-parcours.yaml`, `content/missions/jeux-achats/j-lycee-parcours.yaml`

**Interfaces :**
- Consumes : format des parcours (modèles complets : `content/missions/phishing/p-college-parcours.yaml`, `content/missions/jeux-achats/j-college-parcours.yaml`), risque à `suite` (T1), décors et règles (T5), leviers (`content/leviers.yaml`), `RECOVERY_ACTIONS`, config du mini-jeu `tri` (exemple : `content/missions/harcelement/h-college-faux-compte.yaml`).

- [ ] **Step 1 : Lire** les modèles ci-dessus, `p-lycee-offre-emploi.yaml` et `j-lycee-vestiaire.yaml` (pour **ne pas** reprendre les mêmes situations), la spec §5 et le dossier (B1, B4, C0, C1, C4, « Idées reçues »).
- [ ] **Step 2 : `p-lycee-parcours.yaml`** — « Le stage de seconde » : `tranches: ['lycee']`, `duree: 25`, titre `L’île aux hameçons : …`. Forme : 1 → 2 (bifurcation) → 3a 4a | 3b 4b | 3c 4c → tri → 5. Bifurcation : `bon` je vérifie l’entreprise par son site ou son numéro officiel ; `aide` je demande de l’aide au professeur principal ; risque à `suite` j’envoie les documents. Route c : conséquence sans dramatiser, puis réparation dans l’ordre du dossier (stopper l’échange, garder offre et échanges, prévenir le lycée, 17Cyber, plainte selon le préjudice), avec des choix risqués tirés des idées reçues. Tri « le bon recours » : 6 cartes, 3 catégories (ex. « 33700 », « 17Cyber », « Le service lui-même, par son site officiel »). Au moins un personnage ou un lieu de voie professionnelle sur l’ensemble des parcours (à répartir entre T6–T8 : ici, la PFMP peut être évoquée).
- [ ] **Step 3 : `j-lycee-parcours.yaml`** — « La calculatrice vendue avant le bac » : faux acheteur, lien « pour recevoir le paiement », faux conseiller très bien informé. `bon` je vérifie dans l’appli de la plateforme et de ma banque ; `aide` je demande de l’aide à mes parents ; risque à `suite` je saisis ma carte sur le lien. Route c : banque et opposition avec un parent, relevé, Perceval seulement si ses conditions sont réunies (représentant légal), preuves ; choix risqué type « je signale sur PHAROS pour récupérer mon argent ». Tri : « Ma banque d’abord », « 33700 », « SignalConso » (SignalConso seulement pour un professionnel).
- [ ] **Step 4 : Vérifier** : `npm run build` ; `npx vitest run tests/unit/node/content-real.test.ts` ; `npm run export:relecture -- --toutes`, relire les 2 Markdown (fluidité, fautes, aucun indice de forme, aucune route meilleure, chaque fait retrouvé dans le dossier). Jouer les 3 routes d’un parcours au clavier (`npx vite --port 5199 --strictPort`).
- [ ] **Step 5 : Commit** `feat(contenu): parcours lycée de l’île aux hameçons et de l’île aux pièces d’or`

### Task 7 : Parcours lycée — clés et rumeurs (publiés)

Mêmes étapes que la Task 6, avec :
- `content/missions/comptes/c-lycee-parcours.yaml` — « Le projet de groupe » : `bon` je vérifie auprès du camarade par un autre canal ; `aide` je demande de l’aide au référent numérique du lycée ; risque à `suite` je donne le code. Route c : messagerie d’abord, mots de passe réutilisés, moyens de récupération et sessions, double authentification, prévenir les contacts (dossier C2) ; choix risqué type « je change juste ce mot de passe-là ». Ne pas reprendre `c-lycee-gestionnaire.yaml`.
- `content/missions/desinformation/d-lycee-parcours.yaml` — « L’audio du proviseur » (et/ou l’exposé avec une référence d’IA introuvable) : `bon` je vérifie l’origine et cherche une confirmation indépendante ; `aide` je demande de l’aide au professeur documentaliste ; risque à `suite` je relaie dans le groupe. Route c : arrêter de relayer, retrouver l’origine, corriger auprès du même groupe sans republier le contenu (C5) ; deepfake : formulation du dossier D5, sans peine chiffrée appliquée à l’élève. Ne pas reprendre `d-lycee-deepfake.yaml`.

Commit : `feat(contenu): parcours lycée de l’île des clés et de l’île aux rumeurs`.

### Task 8 : Parcours lycée — secrets et antennes (brouillons)

Mêmes étapes que la Task 6, avec `relecture: { statut: a-relire }` dans les deux fichiers :
- `content/missions/vie-privee/v-lycee-parcours.yaml` — « La PFMP » : CV en lien public, photo d’équipe, localisation pendant une sortie. `bon` je règle moi-même qui voit quoi ; `aide` je demande de l’aide au tuteur (ou au CPE) ; risque à `suite` je publie la photo d’équipe sans demander. Route c : procédure C3 (retirer ma publication, demander le retrait, prévenir les personnes, régler l’audience) sans promettre que tout disparaît ; formulation D4. Ne pas reprendre `v-lycee-traces.yaml`.
- `content/missions/appareils/a-lycee-parcours.yaml` — « Le job de festival » (décor `festival`) ou l’ordinateur de PFMP (décor `entreprise`) : Wi-Fi public, outil « pour aller plus vite », appli de billetterie qui demande tout. `bon` je vérifie moi-même (source officielle, permissions, données mobiles) ; `aide` je demande de l’aide au tuteur ou au service informatique ; risque à `suite` j’installe l’outil. Route c : procédure C6 (ne plus saisir de secrets, sécuriser les comptes depuis un appareil sain, faire examiner, désinstaller ne suffit pas) ; Wi-Fi : citation et nuance du dossier B6 ; aucun VPN recommandé. Ne pas reprendre `a-lycee-wifi-gare.yaml`.

Vérifier en plus : `npm run build; npx tsx scripts/verifier-publication.ts` → les deux identifiants absents de `dist/assets`.

Commit : `feat(contenu): parcours lycée de l’île aux secrets et de l’île aux antennes (brouillons)`.

---

### Task 9 : Relecture d’exactitude, E2E, couverture, documentation

**Files :**
- Modify : `tests/unit/node/content-real.test.ts` (dé-skip), `tests/e2e/parcours-routes.spec.ts`, `README.md`

- [ ] **Step 1 : Relecture « pédagogie et exactitude »** des 6 parcours par un relecteur dédié, **dossier en main** : chaque fait, dispositif et formulation juridique retrouvé dans le dossier ; idées reçues absentes des bons choix ; aucune route meilleure ; voie pro représentée ; vocabulaire 15-18 ans. Corriger toutes les remarques.
- [ ] **Step 2 : Couverture** : dé-skipper « les 6 îles ont un parcours lycée » → vert.
- [ ] **Step 3 : E2E** (`tests/e2e/parcours-routes.spec.ts`, helpers existants) : `commencer(page, 'Lycée', 'Solo')`, parcours de l’île aux hameçons par chacune des 3 routes (bifurcation : `[data-qualite="bon"]`, `[data-qualite="aide"]`, puis le choix risqué de réparation par son texte lu dans le YAML) ; route c : « Tu avances quand même », « Continuer », un lieu propre à la route c visible, fin avec « c’est aussi un réflexe » et « Rejouer pour découvrir les autres routes ». Audit axe (Chromium) à la bifurcation, sur la réaction « Tu avances quand même » et en fin de mission, en `light` et `dark`. Les specs collège et 6e restent vertes.
- [ ] **Step 4 : README** : section « Parcours à deux routes » → « Parcours à routes » : route de réparation (`suite` sur un risque de bifurcation, règles, numéros 3c) ; renvoi vers le dossier de recherche pour le contenu lycée.
- [ ] **Step 5 : Suite complète** : `npm run lint; npm run typecheck; npm test; npm run build; npx tsx scripts/verifier-publication.ts; npx playwright test` (le test WebKit instable connu peut être relancé une fois).
- [ ] **Step 6 : Commit** `test(parcours): routes lycée de bout en bout, relecture d’exactitude ; README`
