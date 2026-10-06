# Téléphone v2 : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire du faux téléphone un vrai téléphone « qui y ressemble » : retour immédiat après le choix (réaction, halo, verdict, indices surlignés), explication courte à côté, contenu enrichi, écran verrouillé, accueil et habillage de chaque appli fictive.

**Architecture:** `src/phone/Telephone.vue` reste le seul point d'entrée. Une machine à étapes pure (`sequence.ts`) pilote le retour ; un découpage pur (`surlignage.ts`) place les passages numérotés dans les textes ; un registre (`applis.ts`) décrit chaque appli fictive et ses coques de marque. Le moteur perd la phase « indices ».

**Tech Stack:** Vue 3.5, TypeScript 5.9, Zod 4, @lucide/vue, Vitest 5 (jsdom, `vi.useFakeTimers`), Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-06-telephone-v2-design.md` (notes de recherche : `.superpowers/sdd/telephone-v2-recherche.md`).

## Environnement
Tout passe par le conteneur de dev (dépendances et navigateurs uniquement dedans), avec une machine juste en mémoire :
```bash
C=$(docker ps -q --filter ancestor=mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm | head -1)
MSYS_NO_PATHCONV=1 docker exec -e PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright -w /workspaces/Cybergame $C sh -c "<commande>"
```
Vitest toujours avec `--maxWorkers=2` ; Playwright avec `--project=chromium --workers=1`. Oracle complet d'une tâche : `npx vitest run --maxWorkers=2 && npm run typecheck && npm run lint`, plus les e2e Chromium quand la tâche touche le parcours d'une mission.

## Global Constraints
- Le reste du jeu n'importe que `src/phone/Telephone.vue` (et les fonctions pures de `src/phone/*.ts`).
- Aucun fichier de `src/phone/` au-delà de 150 lignes.
- Verdict jamais porté par la couleur seule (icône + texte) ; aucun clignotement ; halo en fondu 200 ms puis fixe ; secousse et rebond coupés en `prefers-reduced-motion` ; réglage « animations » désactivé = séquence instantanée.
- Rien ne disparaît tout seul : on avance avec « Continuer » ou « Rejouer ».
- Ton : le panneau n'accuse jamais la personne ; la moquerie éventuelle vient de l'arnaqueur, dans le téléphone.
- Marques fictives uniquement, aucun logo ni nom réel ; français avec accents complets, apostrophe ’ dans les libellés visibles ; jamais de tiret cadratin.
- Les sous-agents ne font pas de git ; l'orchestrateur rejoue l'oracle, relit et committe (Conventional Commits en anglais, trailer `build with cc`).

## Review Focus
1. « Rejouer ce scénario » pendant ou après la séquence : minuteries annulées, téléphone remis en attente, aucun panneau fantôme (tâche 3).
2. Changer d'étape ou quitter la page en pleine séquence : aucune minuterie qui modifie un composant démonté (tâche 3).
3. Un `passage` qui contient un lien ou chevauche un autre passage : rendu sans texte dupliqué ni perdu (tâche 2).
4. Mode classe : la séquence ne part qu'après « Valider le choix de la classe » (tâche 3).
5. Lecture simplifiée : un `passage` doit être trouvé dans `texteSimple` aussi, sinon pas de surlignage cassé (tâches 2 et 5).

---

## Lot 1 : le déroulé du choix

### Task 1: Moteur sans phase « indices », données de réaction et de passage

**Files:**
- Modify: `src/content/schema.ts` (`choixSchema` : `reaction`, `reactionSimple` facultatifs ; `indiceSchema` : `passage` facultatif)
- Modify: `src/engine/mission-runner.ts` (phase `indices` et événement `valider-indices` supprimés ; événement `indice` ; `ScenarioResultat`)
- Modify: `src/engine/badges.ts` (« Œil de lynx »)
- Modify: `src/mission/ScenarioStep.vue` (plus d'`IndicesForm`), `src/mission/ConsequencePanel.vue` (liste des seuls indices pertinents, sans « tu l’avais coché »), `src/mission/LieuStep.vue` (titre `indices` retiré du dictionnaire si présent)
- Delete: `src/mission/IndicesForm.vue`
- Modify: `src/pages/PlanBPage.vue` (question et corrigé des indices)
- Test: `tests/unit/mission-runner.test.ts`, `tests/unit/badges.test.ts`, `tests/unit/scenario-step.test.ts`, `tests/unit/mission-page.test.ts`, `tests/unit/focus.test.ts`, `tests/unit/enseignants.test.ts`, `tests/unit/ecran-schema.test.ts`, `tests/e2e/helpers.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/parcours.spec.ts`

**Interfaces:**
- Produces :
  - `PhaseScenario = 'situation' | 'pourquoi' | 'consequence' | 'recuperation'`
  - `RunEvent` : `valider-indices` retiré, ajout `{ type: 'indice' }` (accepté seulement en phase `situation` d'un scénario, idempotent)
  - `ScenarioResultat` : `{ type: 'scenario'; choixId; qualite; levier; recuperationFaite; passe; indiceUtilise: boolean }` (plus de `indicesChoisis`, `indicesJustes`, `indicesFaux`)
  - `RunState` gagne `indiceUtilise: boolean` pour l'étape courante (remis à `false` à chaque nouvelle étape ; conservé au « Rejouer » de la même étape)
  - schéma : `Choix.reaction?: string`, `Choix.reactionSimple?: string`, `Indice.passage?: string`

**Comportement**
- `choisir` sur un scénario : risque + `pourquoi` → phase `pourquoi` (inchangé) ; sinon → phase `consequence` directement, avec le résultat (`indiceUtilise` recopié de l'état).
- `expliquer` : résultat avec `indiceUtilise` recopié.
- `indice` : phase `situation` d'un scénario uniquement, sinon `RunError` ; met `indiceUtilise: true`.
- Badge `oeil-de-lynx` : au moins un scénario non passé, et tous les scénarios non passés ont `qualite !== 'risque'` et `indiceUtilise === false`. Nouvelle description : « Tu as déjoué les pièges sans demander d’indice. »
- PlanB : « Quel indice t’a décidé ? » et ses cases deviennent « Souligne dans le message ce qui devait t’alerter. » ; le corrigé « Vrais indices : … » liste `libelle` et, s'il existe, « (« passage ») ».
- e2e et tests unitaires : toute étape « Je ne sais pas » disparaît des parcours (après un choix non risqué, on arrive directement sur la conséquence).

**Tests (TDD)** dans `mission-runner.test.ts` :
- un choix `bon` passe directement en `consequence` avec `indiceUtilise: false` ;
- `indice` puis choix `bon` : résultat `indiceUtilise: true` ; `indice` hors phase `situation` : `RunError` ;
- `valider-indices` n'existe plus (le type ne compile pas : retirer les anciens tests correspondants) ;
- « Rejouer » garde `indiceUtilise` de l'étape ; l'étape suivante repart à `false`.
`badges.test.ts` : œil de lynx avec et sans indice utilisé, et avec un piège.

- [ ] Écrire les tests, les voir échouer, implémenter, oracle complet + e2e Chromium, commit `refactor(engine): drop the clue checklist phase and track hint use`.

### Task 2: Fonctions pures de la séquence et du surlignage

**Files:**
- Create: `src/phone/sequence.ts`, `src/phone/surlignage.ts`
- Test: `tests/unit/telephone-sequence.test.ts`

**Interfaces (code à reprendre)**
```ts
// src/phone/sequence.ts
export const ETAPES = ['attente', 'envoi', 'ecrit', 'reaction', 'verdict', 'indices', 'fin'] as const
export type EtapeSequence = (typeof ETAPES)[number]
export interface PasSequence { etape: EtapeSequence; a: number }

/** Instants (ms après le choix) de chaque étape du retour ; instantané = tout d'un coup (animations coupées). */
export function planSequence(o: { reaction: boolean; instantane: boolean }): PasSequence[] {
  if (o.instantane) return [{ etape: 'fin', a: 0 }]
  const pas: PasSequence[] = [{ etape: 'envoi', a: 0 }]
  if (o.reaction) pas.push({ etape: 'ecrit', a: 150 }, { etape: 'reaction', a: 900 }, { etape: 'verdict', a: 1000 })
  else pas.push({ etape: 'verdict', a: 600 })
  const verdict = pas.at(-1)!.a
  pas.push({ etape: 'indices', a: verdict + 400 }, { etape: 'fin', a: verdict + 800 })
  return pas
}

/** Vrai si l'étape `courante` a atteint ou dépassé `cible`. */
export const atteinte = (courante: EtapeSequence, cible: EtapeSequence) => ETAPES.indexOf(courante) >= ETAPES.indexOf(cible)
```
```ts
// src/phone/surlignage.ts
import { decouperLiens } from './liens'

export interface Passage { texte: string; numero: number | null }
export type MorceauRiche =
  | { type: 'texte' | 'lien'; texte: string }
  | { type: 'passage'; texte: string; numero: number | null }

/**
 * Découpe un texte en morceaux : passages à surligner (première occurrence, sans chevauchement, dans l'ordre
 * du texte), puis liens repérés dans le reste. Un passage introuvable est ignoré.
 */
export function decouperTexte(texte: string, passages: readonly Passage[]): MorceauRiche[]
```
- `numero` : rang (1, 2, 3…) de l'indice parmi les indices pertinents qui ont un `passage`, dans l'ordre du contenu ; `null` pour le surlignage du bouton « Indice ».
- Deux passages qui se chevauchent : le premier trouvé dans le texte gagne, l'autre est ignoré dans ce texte.

**Tests (TDD)** :
- `planSequence` : avec réaction (envoi 0, ecrit 150, reaction 900, verdict 1000, indices 1400, fin 1800), sans réaction (envoi 0, verdict 600, indices 1000, fin 1400), instantané (`[{ fin, 0 }]`) ; `atteinte`.
- `decouperTexte` : texte sans passage = `decouperLiens` ; un passage au milieu ; deux passages dans l'ordre inverse du texte ; passage introuvable ignoré ; passage qui contient un domaine (le passage reste un seul morceau `passage`) ; lien hors passage toujours repéré ; chevauchement ; rien de perdu (la concaténation des morceaux redonne le texte).

- [ ] TDD, oracle, commit `feat(phone): add the feedback sequence and clue highlighting helpers`.

### Task 3: La séquence dans le téléphone

**Files:**
- Create: `src/phone/useSequence.ts` (composable), `src/phone/parts/Verdict.vue`, `src/phone/parts/EnTrainDEcrire.vue`
- Modify: `src/phone/Telephone.vue`, `src/phone/parts/TexteRiche.vue` (morceaux `passage`), `src/phone/parts/Bulle.vue`, `src/phone/theme.css`
- Modify: `src/pages/AtelierTelephonePage.vue` (bouton « Rejouer la séquence », réglage animations)
- Test: `tests/unit/telephone.test.ts`

**Interfaces**
- `useSequence(declencheur: () => string | null, options: () => { reaction: boolean; instantane: boolean }): { etape: Readonly<Ref<EtapeSequence>> }` : à chaque nouvelle valeur non nulle, annule les minuteries et rejoue `planSequence` ; valeur `null` = `attente` ; minuteries annulées au démontage.
- `Telephone` props ajoutées : `indices?: { libelle: string; passage?: string }[]` (indices pertinents, dans l'ordre), `indiceVisible?: boolean` (surlignage sans numéros avant le choix) ; événements ajoutés : `sequence-finie: []` (à l'étape `fin`), `indice: []` (bouton « Indice »).
- Les passages sont fournis aux applis par `provide`/`inject` (clé exportée depuis `src/phone/surlignage.ts` : `CLE_PASSAGES`), lus par `TexteRiche`. Avant `indices` : passages sans numéros si `indiceVisible`, sinon aucun ; à partir de `indices` : passages numérotés.
- Instantané : `store.etat.reglages.animations === false`.

**Comportement**
- `envoi` : la zone d'actions disparaît, la bulle « Toi » ou la bannière du geste apparaît (v1).
- `ecrit` : bulle reçue « <contact> est en train d’écrire… » avec trois points animés (animation coupée en mouvement réduit), seulement si le choix a une `reaction`.
- `reaction` : bulle reçue avec `t(reaction, reactionSimple)`.
- `verdict` : attribut `data-verdict="piege" | "bon"` sur la `figure` (bon pour `bon` et `aide`) ; halo `box-shadow` rouge (`#ff2d55`) ou vert (`#16a34a`) en fondu 200 ms puis fixe ; classe d'animation `secousse` (piège) ou `rebond` (bon), désactivée par `@media (prefers-reduced-motion: reduce)` ; composant `Verdict` en bas de l'écran : icône SVG (X ou Check de lucide, `aria-hidden`) + texte « Piège » ou « Bon réflexe », dans la zone `role="status"` existante.
- `indices` : passages surlignés (fond jaune `#fff1a8`, texte foncé, contraste ≥ 4.5:1) avec pastille numérotée ① ② ③ (texte, pas seulement couleur ; lecteurs d'écran : « indice 1 : »).
- `fin` : émet `sequence-finie` une seule fois par choix joué.
- Bouton « Indice » : en haut de l'écran de l'appli, visible seulement en attente d'un choix, s'il y a au moins un passage ; il émet `indice` ; le surlignage sans numéros suit `indiceVisible`.
- Mode classe : la séquence part quand `choixJoue` est renseigné, donc après validation (inchangé).

**Tests (TDD, `vi.useFakeTimers()`)** :
- après `choixJoue`, à 0 ms la bannière ou la bulle « Toi », à 150 ms « en train d’écrire », à 900 ms la réaction, à 1000 ms `data-verdict` et le texte « Piège » ou « Bon réflexe » dans `[role=status]`, à 1400 ms des `.passage` numérotés, à 1800 ms l'événement `sequence-finie` (une seule fois) ;
- sans réaction : pas d'« en train d’écrire », verdict à 600 ms ;
- animations désactivées (`store.modifierReglages({ animations: false })`) : tout présent immédiatement, `sequence-finie` émis au prochain tick ;
- repasser `choixJoue` à `null` en pleine séquence : retour à l'attente, aucune étape ultérieure n'apparaît après avancement du temps ;
- démontage en pleine séquence : aucune erreur, aucune émission ;
- bouton « Indice » : visible avant le choix s'il y a des passages, émet `indice` ; avec `indiceVisible`, passages surlignés sans numéro.

- [ ] TDD, oracle, commit `feat(phone): play the reply, the reaction and the verdict in the phone`.

### Task 4: Le panneau d'explication branché sur la séquence

**Files:**
- Create: `src/mission/ExplicationPanel.vue` (verdict en une phrase + « Ce qui devait t’alerter » numéroté)
- Modify: `src/mission/ScenarioStep.vue` (attend `sequence-finie` avant d'afficher le panneau ; transmet indices et `indiceVisible` ; relaie `indice` au moteur), `src/mission/ConsequencePanel.vue` (utilise `ExplicationPanel` ; plus de liste d'indices en double), `src/pages/MissionPage.vue` (transmet `etat.indiceUtilise`)
- Test: `tests/unit/scenario-step.test.ts`, `tests/unit/mission-page.test.ts`, `tests/unit/focus.test.ts`, e2e

**Comportement**
- En phase `situation` : panneau = question + consigne du mode (v1).
- Après le choix : tant que la séquence n'est pas finie, le panneau garde la question (et rien d'autre) ; à `sequence-finie`, il affiche la phase en cours (`pourquoi` : `ExplicationPanel` puis `PourquoiForm` ; `consequence` : verdict, conséquence, « Ce qui a marché sur toi », `ExplicationPanel` si pas déjà vu, « À retenir », boutons) et le focus va sur son titre (mécanisme `focusAuChangement`, déclenché par l'affichage).
- « Rejouer ce scénario » : le moteur repasse en `situation`, la séquence repart de zéro au prochain choix.
- `ExplicationPanel` : « Ce qui devait t’alerter » = liste ordonnée des indices pertinents avec leur numéro (même numérotation que `decouperTexte`), libellé, et le passage cité ; une phrase d'explication tirée de `explicationIndices`.
- Tests unitaires existants qui enchaînent choix et panneau : poser `store.modifierReglages({ animations: false })` dans leur `beforeEach` (séquence instantanée) plutôt que des minuteries.

**Tests (TDD)** :
- `scenario-step.test.ts` : avec animations, après un choix le panneau ne montre que la question, puis la phase suivante après `sequence-finie` ; `ExplicationPanel` liste ① ② dans l'ordre ; le bouton « Indice » émet l'événement moteur `{ type: 'indice' }`.
- `mission-page.test.ts` : un parcours complet avec animations coupées ; « Rejouer » relance proprement.
- e2e Chromium : les parcours existants passent (attendre le titre du panneau après chaque choix) ; nouvel audit axe « verdict piège affiché » et « verdict bon réflexe affiché » sur `p-6e-colis`.

- [ ] TDD, oracle complet + e2e Chromium, commit `feat(mission): show the explanation beside the phone once the feedback ends`.

### Recette du lot 1 (orchestrateur)
Playwright sur un aperçu fraîchement construit : capture de la séquence (réaction, halo rouge, verdict, indices numérotés, panneau) et du halo vert, bureau et mobile ; mouvement réduit émulé.

---

## Lot 2 : le contenu

### Task 5: Réactions, passages, boutons simulés

**Files:**
- Modify: `src/content/schema.ts` (`passage` obligatoire sur chaque indice ; `pertinent` supprimé ; au moins un indice ; écran `web` : `boutons?: texte[]` 1 à 4)
- Modify: `src/phone/apps/WebApp.vue` (boutons inertes : `<span class="bouton-page">`, pas de vrai bouton, avec `aria-hidden="false"` et un préfixe « Bouton : » pour lecteurs d'écran)
- Modify: les 21 fichiers `content/missions/*/*.yaml` sauf `*-parcours.yaml`
- Modify: `tests/unit/node/content-real.test.ts`, `tests/unit/node/textes-ecran.ts` (boutons), `tests/unit/fixtures.ts`, `tests/unit/ecran-schema.test.ts`, `src/phone/papier.ts` (boutons)
- Test: contenu réel

**Règles de contenu**
- `reaction` (et `reactionSimple` en 6e si plus de 12 mots) pour chaque choix `bon` et `risque` : 1 ou 2 phrases, dans la voix du contact. Arnaqueur après un piège : il jubile ou insiste (« Merci !! 😈 », « Parfait, ton colis est débloqué »), jamais d'insulte. Arnaqueur après un bon choix : il insiste ou disparaît (« Dernier rappel : ton colis sera détruit ce soir ») ou pas de réaction. Ami ou proche : rassure. Le choix `aide` n'a pas de réaction (l'élève a posé le téléphone).
- `passage` : texte exact (même casse, même ponctuation) présent dans les textes visibles de l'écran, en lecture normale ET simplifiée ; si la version simplifiée diffère, choisir un passage commun ou ajuster `texteSimple` sans changer son sens.
- Indices non pertinents supprimés ; au moins un indice pertinent par scénario ; `libelle` inchangé.
- Boutons simulés en texte (« [Tout autoriser] [Refuser] ») → `boutons: ['Tout autoriser', 'Refuser']`, retirés du texte.
- `appNom` : « Notifications » (sms) devient « Messages ».

**Tests** (`content-real.test.ts`) :
- chaque choix `bon` ou `risque` a une `reaction` ;
- chaque indice a un `passage` trouvé dans `textesEcran(e.ecran)` et dans `textesEcran(e.ecran, true)` ;
- les réactions passent le test des marques réelles ;
- plus aucun texte d'écran ne contient « [ » suivi d'un libellé de bouton et « ] » (motif `\[[A-ZÉ][^\]]{0,30}\]`), sauf les descriptions de capture d'écran en `chat` (motif `\[Capture`).

- [ ] Sous-agent de contenu (Opus), relecture du diff mission par mission par l'orchestrateur, oracle complet + build, commit `content(phone): add contact reactions, clue passages and page buttons`.

---

## Lot 3 : le téléphone

### Task 6: Registre des applis et icônes

**Files:**
- Create: `src/phone/applis.ts` (registre), `src/phone/parts/IconeAppli.vue` (carré arrondi à l'accent, icône lucide blanche ou foncée selon le contraste)
- Modify: `src/content/schema.ts` (`appNom` et `fil.notifications[].appNom` : clés du registre ; le registre ne dépend pas de Vue pour rester lisible côté node, les icônes sont résolues dans `IconeAppli`)
- Test: `tests/unit/applis.test.ts`

**Interfaces**
```ts
export interface Appli {
  nom: string                 // = appNom du contenu
  marque: 'snaptalk' | 'chatcord' | 'streamtube' | 'revendo' | 'gamebox' | 'banquenova' | 'ent' | 'messages' | 'mail' | 'navigateur' | 'magasin' | 'meteo'
  accent: string              // hex de la spec, section 4.3
  texteSurAccent: '#ffffff' | '#1b1b2f'  // le plus contrasté (≥ 4.5:1)
  icone: string               // nom d'icône lucide (ex. 'MessageCircle'), résolu dans IconeAppli
  evoque: string              // ex. 'Snapchat, Instagram' (documentation, jamais affiché)
}
export const APPLIS: Record<string, Appli>   // clés : SnapTalk, ChatCord, StreamTube, Revendo, GameBox, GameBox Chat, BanqueNova, Mon Collège, Mon Lycée, Messages, Mail, Navigateur, Magasin d’applis, Météo
export const appli = (nom: string): Appli    // lève une erreur si inconnue
export const NOMS_APPLIS: [string, ...string[]]
```
**Tests** : chaque appli a un contraste `texteSurAccent`/`accent` ≥ 4.5:1 (calcul de luminance relative dans le test) ; chaque `appNom` du contenu réel est une clé (test node) ; le schéma refuse « Snapchat ».

- [ ] TDD, oracle, commit `feat(phone): add the fictional app registry and icons`.

### Task 7: Écran verrouillé d'entrée et écran d'accueil

**Files:**
- Create: `src/phone/apps/AccueilApp.vue`, `src/phone/parts/NotificationEntrante.vue`
- Modify: `src/phone/Telephone.vue` (état `verrouille | accueil | appli`), `src/phone/apps/VerrouillageApp.vue` (réutilisé pour l'entrée), `src/mission/ScenarioStep.vue`, `src/pages/AtelierTelephonePage.vue`
- Modify: `tests/e2e/helpers.ts`, e2e qui cliquent `[data-choix]` (ouvrir la notification d'abord)
- Test: `tests/unit/telephone.test.ts`, `tests/unit/scenario-step.test.ts`

**Comportement**
- Prop `entree?: boolean` (défaut `false` pour l'atelier et les tests existants ; `ScenarioStep` passe `true`) : le téléphone démarre `verrouille` avec une notification construite depuis l'écran (`appNom`, `contact`, début du premier message tronqué à 60 caractères, ou `ecran.notification` facultatif ajouté au schéma). Bouton `data-notification` « Ouvrir la notification <appNom> de <contact> » ; au clic : état `appli` avec un zoom de 200 ms (coupé en mouvement réduit), focus sur la zone de l'écran.
- Bouton « Accueil » (barre de geste, `aria-label="Revenir à l’écran d’accueil"`) dans l'état `appli` avant le choix : état `accueil`. Accueil : grille de 4 colonnes des applis du registre (`IconeAppli` + libellé) et dock (Messages, Navigateur, Mail, SnapTalk) ; l'appli du scénario en couleur avec pastille ; les autres en blanc (`aria-disabled="true"`) qui affichent « Pas disponible dans ce scénario » dans un `role="status"` ; toucher l'appli du scénario rouvre l'appli.
- Le panneau à côté affiche la question dès le début (inchangé).
- e2e : `helpers.ts` ouvre la notification (`[data-notification]`) si elle est visible avant de chercher les choix.

**Tests (TDD)** : démarrage verrouillé avec notification et sans `[data-choix]` ; ouverture de la notification ; accueil (appli active, appli inactive annoncée) ; retour à l'appli ; `entree` absent = comportement v1.

- [ ] TDD, oracle complet + e2e Chromium, commit `feat(phone): open each scenario from a notification on the lock screen`.

### Task 8: Coques de marque (applis de conversation)

**Files:**
- Create: `src/phone/marques/` : `CoqueSnapTalk.vue`, `CoqueChatCord.vue`, `CoqueMessages.vue`, `CoqueGameBox.vue`, `CoqueRevendo.vue`, `index.ts` (marque → coque)
- Modify: `src/phone/Telephone.vue` (la coque de la marque enveloppe l'appli : en-tête et barre du bas), `src/phone/parts/ActionsApp.vue` (style « réponses suggérées » en pilules pour ces marques), `src/phone/theme.css` (variables par marque issues du registre)
- Test: `tests/unit/telephone-marques.test.ts`

**Marqueurs par coque** (spec 4.3) :
- SnapTalk : en-tête avec avatar à anneau de story, 🔥 + nombre de jours à côté du nom (valeur décorative fixe), icônes d'état colorées dans les bulles (petit carré plein), barre du bas à 5 onglets (Carte, Chat, Caméra, Stories, Spotlight) en icônes ; accent jaune miel, texte foncé.
- ChatCord : colonne étroite de serveurs à gauche (pastilles carrées arrondies, initiales), en-tête « # nom-du-salon » si le contact contient « Salon » ou « # », sinon nom du contact ; barre du bas à 4 onglets.
- Messages : en-tête centré (avatar, nom ou numéro, « Numéro inconnu » si le contact ne contient pas de lettre), « Lu » sous la dernière bulle « Toi ».
- GameBox (et GameBox Chat) : bandeau du haut avec solde « 💎 1 250 Gemmes » (hexagone), onglets Chat / Moi.
- Revendo : fiche de l'objet épinglée en haut de la conversation si le premier message contient un prix (motif `\d+ ?€`) : prix en gras, bouton inerte « Acheter », mention « + frais de protection ».
Tous les éléments ajoutés sont décoratifs (`aria-hidden`) sauf ceux qui portent une information utile (« Numéro inconnu », prix).

**Tests** : chaque marque rend ses marqueurs (sélecteurs `data-marque` et classes) ; aucune coque ne casse la séquence (un test par marque : choix joué → verdict) ; contraste du texte d'en-tête sur l'accent (classe `texteSurAccent`).

- [ ] TDD, oracle, commit `feat(phone): brand shells for conversation apps`.

### Task 9: Coques de marque (publication, mail, web, autres)

**Files:**
- Create: `src/phone/marques/CoqueStreamTube.vue`, `CoqueSnapTalkPublication.vue` (SnapTalk en écran `social`), `CoqueMail.vue`, `CoqueNavigateur.vue`, `CoqueMagasin.vue`, `CoqueBanqueNova.vue`, `CoqueEnt.vue`, `CoqueMeteo.vue` (accueil et notifications seulement) ; compléter `index.ts`
- Modify: `src/phone/apps/SocialApp.vue` (pilule j'aime / commentaires / partages pour StreamTube, bouton inerte « S’abonner »), `src/phone/apps/WebApp.vue` (icône réglages à gauche du domaine, jamais de cadenas ; onglet « Obtenir » et note pour le magasin)
- Test: `tests/unit/telephone-marques.test.ts`

**Marqueurs** : spec 4.3 (StreamTube : pilule d'actions et « S’abonner » ; Mail : bouton flottant « Écrire » décoratif, expéditeur en gras, étoile ; Navigateur : icône réglages, bouton onglets ; Magasin : « Obtenir », étoiles, badge d'âge ; BanqueNova : solde et dernières opérations si le contenu les donne, sinon en-tête seul ; ENT : en-tête « Mon Collège » avec menu Emploi du temps / Notes / Cahier de textes décoratif).

- [ ] TDD, oracle, commit `feat(phone): brand shells for posts, mail, web and other apps`.

### Task 10: Accessibilité, bout en bout, atelier et README

**Files:**
- Modify: `tests/e2e/a11y.spec.ts` (un audit par marque présente dans le contenu, verdict piège et bon, écran verrouillé d'entrée, accueil, mouvement réduit émulé via `page.emulateMedia({ reducedMotion: 'reduce' })`)
- Modify: `src/pages/AtelierTelephonePage.vue` (choix de marque, état verrouillé / accueil / appli, relance de la séquence, animations)
- Modify: `README.md` (`reaction`, `passage`, `boutons`, `notification`, registre des applis)

- [ ] Oracle complet + e2e Chromium, Firefox et WebKit (un navigateur à la fois), commit `test(phone): audit every brand and the feedback sequence`.

### Recette finale (orchestrateur)
Playwright : chaque marque, séquence piège et bon réflexe, écran verrouillé, accueil, bureau / mobile / texte très grand / mouvement réduit ; puis revue de toute la branche par un agent du modèle le plus capable.
