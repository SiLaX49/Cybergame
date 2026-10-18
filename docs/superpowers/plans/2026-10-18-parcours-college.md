# Parcours collège à deux routes — plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ajouter des parcours à deux routes (le choix `bon` et le choix `aide` mènent à des lieux différents, qui se rejoignent à la fin) et écrire les 6 parcours 5e – 3e.

**Architecture :** un module pur `src/engine/routes.ts` calcule l’étape suivante, les routes d’un parcours et leur validité ; le schéma l’utilise pour refuser les parcours mal formés ; le moteur suit l’étape courante par identifiant (`etapeId`, `chemin`) au lieu de l’index dans le fichier ; l’interface (chemin, scène, compteur, fin), la fiche, le plan B et l’export s’appuient sur `routesDe`. Les 6e restent linéaires (aucun `suite`), donc rien ne change pour eux.

**Tech Stack :** Vue 3.5 `<script setup>`, TypeScript strict, Zod 4, Vite 8, Vitest 5 (jsdom + `tests/unit/node`), Playwright + @axe-core/playwright, contenu YAML dans `content/missions/`.

**Spec :** `docs/superpowers/specs/2026-10-18-parcours-college-design.md`

## Global Constraints

- Les parcours 6e, les missions classiques, les rappels et les thèmes sensibles ne changent pas ; tous les tests existants restent verts (seuls ceux qui supposent « 5 lieux dans le fichier » passent à « 5 lieux par route »).
- Une route = suite d’étapes de la première étape du fichier à la dernière ; toutes les routes d’un parcours ont la même longueur, entre 4 et 6 lieux ; une bifurcation sépare exactement le choix `bon` et le choix `aide` ; `suite` est interdit sur un choix `risque` ; un choix `risque` fait toujours rester sur place et réessayer.
- `suite` n’est accepté que sur les **lieux** et leurs **choix** (pas sur les mini-jeux : un mini-jeu enchaîne toujours sur l’étape suivante du fichier).
- Aucune des deux routes n’est présentée comme meilleure ; les deux terminent la mission et gagnent l’objet de l’île.
- Contenu : marques fictives ; le choix `aide` commence par « Je demande de l’aide » ; aucun « tic de forme » (contrôles existants de `tests/unit/node/content-real.test.ts`) ; version simplifiée facultative hors 6e ; aucun lien réel autre que les sites officiels déjà utilisés.
- Accessibilité : tout au clavier, état des étapes en texte (pas seulement en couleur), focus géré comme aujourd’hui, audit axe sans violation critique ou sérieuse en clair et en sombre. Couleurs des `<style>` uniquement via jetons (test « sans hex ») ; les dessins SVG gardent leurs couleurs littérales dans le template.
- Aucun script temporaire dans le dépôt ; ne jamais committer `Cahier des charges — Cyber Réflexes.docx`, `.superpowers/`, `dist-relecture/`.
- Commits en français, style conventionnel, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Avant chaque commit : `npm run lint`, `npm run typecheck`, `npm test` verts.

## Review Focus

1. **« Passer ce lieu » sur la bifurcation** : l’élève passe le lieu qui décide de la route → il suit la route du choix `bon`, sans blocage ni étape fantôme → test T2.
2. **Rejouer après un bon choix sur la bifurcation** puis choisir l’autre bonne réponse : la route change bien, l’historique ne garde pas l’ancienne branche → test T2.
3. **Mode Classe entière** : le vote valide un choix de bifurcation comme un autre et mène à la bonne route → test T2 (événements identiques) et e2e T8.
4. **Compteur et scène** : « Étape *n* sur 5 » (et pas « sur 7 ») sur un parcours à deux routes ; le personnage avance d’une case par lieu réussi → test T3.
5. **Lecteur d’écran avant la bifurcation** : les lieux à venir ne donnent aucun indice sur la bonne réponse (« selon ton choix ») et l’état reste lisible en texte → test T3.

---

## Fichiers

| Fichier | Rôle | Tâche |
|---|---|---|
| `src/engine/routes.ts` | `successeurs`, `etapeSuivante`, `routesDe`, `longueurRoute`, `verifierRoutes`, `aVenir` | T1 |
| `src/content/schema.ts` | champs `suite` (lieu, choix de lieu), règle des routes, décors | T1, T5 |
| `tests/unit/routes.test.ts`, `tests/unit/schema.test.ts` | tests T1 | T1 |
| `src/engine/mission-runner.ts`, `tests/unit/parcours-moteur.test.ts` | moteur par identifiant | T2 |
| `src/mission/CheminIle.vue`, `src/pages/MissionPage.vue`, `src/mission/FinMission.vue`, `tests/unit/parcours-routes-ui.test.ts` | chemin, compteur, scène, fin | T3 |
| `src/pages/FicheMissionPage.vue`, `src/pages/PlanBPage.vue`, `scripts/export-relecture.ts`, tests | fiche, plan B, export | T4 |
| `src/mission/DecorScene.vue`, `src/parcours/decors.ts`, `tests/unit/node/content-real.test.ts` | 3 décors, règles de contenu | T5 |
| `content/missions/{phishing,comptes}/…-college-parcours.yaml` | 2 parcours | T6 |
| `content/missions/{vie-privee,jeux-achats}/…-college-parcours.yaml` | 2 parcours | T7a |
| `content/missions/{desinformation,appareils}/…-college-parcours.yaml` | 2 parcours | T7b |
| `tests/e2e/parcours-routes.spec.ts`, `README.md` | e2e, doc | T8 |

Ordre : T1 → T2 → T3 → T4 → T5 → (T6, T7a, T7b en parallèle : fichiers YAML disjoints) → T8.

---

### Task 1 : Routes (module pur) et schéma

**Files :**
- Create : `src/engine/routes.ts`, `tests/unit/routes.test.ts`
- Modify : `src/content/schema.ts` (`choixLieuSchema`, `lieuSchema`, `verifierFormat`), `tests/unit/schema.test.ts`

**Interfaces :**
- Produces (`src/engine/routes.ts`) :
  - `successeurs(etapes: Etape[], id: string): string[]` — étapes suivantes possibles après une bonne réponse (sans doublon, dans l’ordre des choix)
  - `etapeSuivante(etapes: Etape[], id: string, choixId: string | null): string | null` — `null` = arrivée
  - `routesDe(etapes: Etape[]): string[][]` — toutes les routes (ids), dans l’ordre (route du choix `bon` d’abord)
  - `longueurRoute(etapes: Etape[]): number` — longueur de la première route
  - `verifierRoutes(etapes: Etape[]): { chemin: (string | number)[]; message: string }[]` — erreurs de forme (vide si valide)
  - `aVenir(etapes: Etape[], depuis: string): (string | null)[]` — étapes après `depuis` sur la route ; `null` pour une étape qui dépend d’une bifurcation pas encore décidée
  - `bifurcation(etapes: Etape[], id: string): { bon: string; aide: string } | null` — si l’étape est une bifurcation, la cible de chaque route

- [ ] **Step 1 : Tests (échouent)**

`tests/unit/routes.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import type { Etape } from '@/content/schema'
import { aVenir, bifurcation, etapeSuivante, longueurRoute, routesDe, successeurs, verifierRoutes } from '@/engine/routes'

type C = { id: string; qualite: 'bon' | 'risque' | 'aide'; suite?: string }
const lieu = (id: string, choix: C[] = [{ id: 'b', qualite: 'bon' }, { id: 'r', qualite: 'risque' }, { id: 'a', qualite: 'aide' }], suite?: string) =>
  ({ type: 'lieu', id, lieu: id, decor: 'cour', guide: 'g', question: 'q', aRetenir: 'x', suite,
     choix: choix.map((c) => ({ texte: c.id, reaction: 'r', ...c })) }) as unknown as Etape

const lineaire = ['l1', 'l2', 'l3', 'l4', 'l5'].map((id) => lieu(id))
const fourche = [
  lieu('l1'),
  lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3' }, { id: 'r', qualite: 'risque' }, { id: 'a', qualite: 'aide', suite: 'b3' }]),
  lieu('a3'),
  lieu('a4', undefined, 'l5'),
  lieu('b3'),
  lieu('b4'),
  lieu('l5'),
]

describe('routes', () => {
  it('linéaire : étape suivante du fichier, une seule route', () => {
    expect(etapeSuivante(lineaire, 'l2', 'b')).toBe('l3')
    expect(etapeSuivante(lineaire, 'l5', 'b')).toBeNull()
    expect(routesDe(lineaire)).toEqual([['l1', 'l2', 'l3', 'l4', 'l5']])
    expect(longueurRoute(lineaire)).toBe(5)
    expect(verifierRoutes(lineaire)).toEqual([])
    expect(bifurcation(lineaire, 'l2')).toBeNull()
  })
  it('fourche : suite du choix, puis suite du lieu, puis fichier', () => {
    expect(etapeSuivante(fourche, 'l2', 'b')).toBe('a3')
    expect(etapeSuivante(fourche, 'l2', 'a')).toBe('b3')
    expect(etapeSuivante(fourche, 'a4', 'b')).toBe('l5')
    expect(etapeSuivante(fourche, 'b4', 'a')).toBe('l5')
    expect(successeurs(fourche, 'l2')).toEqual(['a3', 'b3'])
    expect(bifurcation(fourche, 'l2')).toEqual({ bon: 'a3', aide: 'b3' })
  })
  it('fourche : deux routes de même longueur, route « bon » d’abord', () => {
    expect(routesDe(fourche)).toEqual([
      ['l1', 'l2', 'a3', 'a4', 'l5'],
      ['l1', 'l2', 'b3', 'b4', 'l5'],
    ])
    expect(longueurRoute(fourche)).toBe(5)
    expect(verifierRoutes(fourche)).toEqual([])
  })
  it('à venir : inconnu tant que la bifurcation n’est pas décidée', () => {
    expect(aVenir(fourche, 'l1')).toEqual(['l2', null, null, 'l5'])
    expect(aVenir(fourche, 'a3')).toEqual(['a4', 'l5'])
    expect(aVenir(fourche, 'b3')).toEqual(['b4', 'l5'])
    expect(aVenir(lineaire, 'l3')).toEqual(['l4', 'l5'])
  })
  it('refuse : suite inconnue, sur soi, sur un choix risqué', () => {
    const e1 = verifierRoutes([lieu('l1', [{ id: 'b', qualite: 'bon', suite: 'x' }, { id: 'a', qualite: 'aide' }]), ...lineaire.slice(1)])
    expect(e1.map((e) => e.message).join('\n')).toMatch(/inconnue/)
    const e2 = verifierRoutes([lieu('l1', undefined, 'l1'), ...lineaire.slice(1)])
    expect(e2.map((e) => e.message).join('\n')).toMatch(/elle-même/)
    const e3 = verifierRoutes([lieu('l1', [{ id: 'b', qualite: 'bon' }, { id: 'r', qualite: 'risque', suite: 'l3' }, { id: 'a', qualite: 'aide' }]), ...lineaire.slice(1)])
    expect(e3.map((e) => e.message).join('\n')).toMatch(/risqué/)
  })
  it('refuse : boucle, étape inatteignable, routes de longueurs différentes', () => {
    const boucle = [lieu('l1'), lieu('l2', undefined, 'l1'), lieu('l3'), lieu('l4'), lieu('l5')]
    expect(verifierRoutes(boucle).map((e) => e.message).join('\n')).toMatch(/boucle/)
    const orpheline = [lieu('l1', undefined, 'l3'), lieu('l2'), lieu('l3'), lieu('l4'), lieu('l5')]
    expect(verifierRoutes(orpheline).map((e) => e.message).join('\n')).toMatch(/inatteignable/)
    const inegale = [
      lieu('l1'),
      lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3' }, { id: 'a', qualite: 'aide', suite: 'b3' }]),
      lieu('a3', undefined, 'l5'),
      lieu('b3'),
      lieu('b4'),
      lieu('l5'),
    ]
    expect(verifierRoutes(inegale).map((e) => e.message).join('\n')).toMatch(/même longueur/)
  })
  it('refuse : bifurcation qui ne sépare pas bon et aide', () => {
    const deuxBons = [
      lieu('l1'),
      lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3' }, { id: 'b2', qualite: 'bon', suite: 'b3' }, { id: 'a', qualite: 'aide', suite: 'a3' }]),
      lieu('a3'), lieu('a4', undefined, 'l5'), lieu('b3'), lieu('b4'), lieu('l5'),
    ]
    expect(verifierRoutes(deuxBons).map((e) => e.message).join('\n')).toMatch(/bon.*aide/)
  })
})
```

Dans `tests/unit/schema.test.ts`, ajouter (en reprenant la fabrique de parcours valide déjà utilisée par ce fichier pour les parcours ; si elle n’existe pas, construire un parcours minimal à partir de `tests/unit/fixtures.ts`) :
- un parcours à deux routes valide (7 lieux, routes de 5) est accepté ;
- un parcours avec une `suite` inconnue est refusé, avec un message contenant « inconnue » ;
- un parcours linéaire de 7 lieux est refusé (« 4 à 6 lieux par route ») ;
- un parcours 6e existant (fixture) reste valide.

Run : `npx vitest run tests/unit/routes.test.ts tests/unit/schema.test.ts` → FAIL.

- [ ] **Step 2 : `src/engine/routes.ts`**

```ts
import type { Etape } from '@/content/schema'

type Choix = { id: string; qualite: 'bon' | 'risque' | 'aide'; suite?: string }
const choixDe = (e: Etape): Choix[] => (e.type === 'lieu' ? (e.choix as Choix[]) : [])
const suiteDe = (e: Etape): string | undefined => (e.type === 'lieu' ? e.suite : undefined)
const index = (etapes: Etape[], id: string) => etapes.findIndex((e) => e.id === id)

/** Étape suivante après le choix `choixId` (ou après une étape sans choix). `null` : arrivée. */
export function etapeSuivante(etapes: Etape[], id: string, choixId: string | null): string | null {
  const i = index(etapes, id)
  const e = etapes[i]
  if (!e) return null
  const c = choixId ? choixDe(e).find((x) => x.id === choixId) : undefined
  return c?.suite ?? suiteDe(e) ?? etapes[i + 1]?.id ?? null
}

/** Étapes suivantes possibles après une bonne réponse (sans doublon). */
export function successeurs(etapes: Etape[], id: string): string[] {
  const e = etapes[index(etapes, id)]
  if (!e) return []
  const bons = choixDe(e).filter((c) => c.qualite !== 'risque')
  const ids = bons.length ? bons.map((c) => etapeSuivante(etapes, id, c.id)) : [etapeSuivante(etapes, id, null)]
  return [...new Set(ids.filter((x): x is string => x !== null))]
}

/** Si l’étape est une bifurcation : la cible de la route « bon » et celle de la route « aide ». */
export function bifurcation(etapes: Etape[], id: string): { bon: string; aide: string } | null {
  if (successeurs(etapes, id).length < 2) return null
  const e = etapes[index(etapes, id)]!
  const cible = (q: 'bon' | 'aide') => {
    const c = choixDe(e).find((x) => x.qualite === q)
    return c ? etapeSuivante(etapes, id, c.id) : null
  }
  const bon = cible('bon')
  const aide = cible('aide')
  return bon && aide ? { bon, aide } : null
}

/** Toutes les routes depuis la première étape (route « bon » d’abord). S’arrête sur une boucle. */
export function routesDe(etapes: Etape[]): string[][] {
  const routes: string[][] = []
  const explorer = (id: string, chemin: string[]) => {
    if (chemin.includes(id)) return
    const suivants = successeurs(etapes, id)
    if (!suivants.length) routes.push([...chemin, id])
    for (const s of suivants) explorer(s, [...chemin, id])
  }
  if (etapes[0]) explorer(etapes[0].id, [])
  return routes
}

export const longueurRoute = (etapes: Etape[]): number => routesDe(etapes)[0]?.length ?? 0

/** Étapes après `depuis` sur la route ; `null` pour celles qui dépendent d’une bifurcation non décidée. */
export function aVenir(etapes: Etape[], depuis: string): (string | null)[] {
  const longueur = longueurRoute(etapes)
  const route = routesDe(etapes).find((r) => r.includes(depuis))
  const rang = route ? route.indexOf(depuis) : -1
  const resultat: (string | null)[] = []
  let courant: string | null = depuis
  for (let pos = rang + 1; pos < longueur; pos++) {
    const suivants: string[] = courant ? successeurs(etapes, courant) : []
    courant = suivants.length === 1 ? suivants[0]! : null
    // Après une bifurcation, toutes les routes se rejoignent sur l’arrivée : on la reconnaît si toutes les routes la partagent à ce rang.
    if (courant === null) {
      const communs = new Set(routesDe(etapes).map((r) => r[pos]))
      if (communs.size === 1) courant = [...communs][0] ?? null
    }
    resultat.push(courant)
  }
  return resultat
}

/** Erreurs de forme d’un parcours (vide si valide). */
export function verifierRoutes(etapes: Etape[]): { chemin: (string | number)[]; message: string }[] {
  const erreurs: { chemin: (string | number)[]; message: string }[] = []
  const ids = new Set(etapes.map((e) => e.id))
  etapes.forEach((e, i) => {
    const s = suiteDe(e)
    if (s && !ids.has(s)) erreurs.push({ chemin: ['etapes', i, 'suite'], message: `suite inconnue : ${s}` })
    if (s === e.id) erreurs.push({ chemin: ['etapes', i, 'suite'], message: 'une étape ne peut pas mener à elle-même' })
    choixDe(e).forEach((c, j) => {
      if (!c.suite) return
      const chemin = ['etapes', i, 'choix', j, 'suite']
      if (c.qualite === 'risque') erreurs.push({ chemin, message: 'un choix risqué fait rester sur place : pas de suite' })
      if (!ids.has(c.suite)) erreurs.push({ chemin, message: `suite inconnue : ${c.suite}` })
      if (c.suite === e.id) erreurs.push({ chemin, message: 'une étape ne peut pas mener à elle-même' })
    })
  })
  if (erreurs.length) return erreurs

  // Boucles (parcours en profondeur avec pile).
  const pile = new Set<string>()
  const vus = new Set<string>()
  let boucle = false
  const visiter = (id: string) => {
    if (pile.has(id)) { boucle = true; return }
    if (vus.has(id)) return
    vus.add(id); pile.add(id)
    for (const s of successeurs(etapes, id)) visiter(s)
    pile.delete(id)
  }
  if (etapes[0]) visiter(etapes[0].id)
  if (boucle) return [{ chemin: ['etapes'], message: 'les étapes forment une boucle' }]

  etapes.forEach((e, i) => {
    if (!vus.has(e.id)) erreurs.push({ chemin: ['etapes', i], message: `étape inatteignable : ${e.id}` })
  })
  const derniere = etapes.at(-1)?.id
  const routes = routesDe(etapes)
  if (routes.some((r) => r.at(-1) !== derniere)) erreurs.push({ chemin: ['etapes'], message: 'toutes les routes doivent finir sur la dernière étape' })
  const lieux = (r: string[]) => r.filter((id) => etapes[index(etapes, id)]?.type === 'lieu').length
  if (new Set(routes.map((r) => r.length)).size > 1) erreurs.push({ chemin: ['etapes'], message: 'toutes les routes doivent avoir la même longueur' })
  for (const r of routes) {
    const n = lieux(r)
    if (n < 4 || n > 6) erreurs.push({ chemin: ['etapes'], message: `un parcours compte 4 à 6 lieux par route (trouvé : ${n})` })
  }
  etapes.forEach((e, i) => {
    const s = successeurs(etapes, e.id)
    if (s.length < 2) return
    const parQualite = new Map<string, Set<string>>()
    for (const c of choixDe(e).filter((x) => x.qualite !== 'risque')) {
      const cible = etapeSuivante(etapes, e.id, c.id)!
      parQualite.set(c.qualite, (parQualite.get(c.qualite) ?? new Set()).add(cible))
    }
    const bon = parQualite.get('bon')
    const aide = parQualite.get('aide')
    if (s.length !== 2 || !bon || !aide || bon.size !== 1 || aide.size !== 1 || [...bon][0] === [...aide][0]) {
      erreurs.push({ chemin: ['etapes', i], message: 'une bifurcation sépare exactement le choix « bon » et le choix « aide »' })
    }
  })
  return [...new Map(erreurs.map((e) => [e.message, e])).values()]
}
```

(Vérifier `aVenir(fourche, 'l1')` = `['l2', null, null, 'l5']` : l2 unique successeur de l1 ; à l2, deux successeurs → `null` aux rangs 2 et 3 ; au rang 4, toutes les routes ont `l5` → `l5`. Si le résultat diffère, corriger l’implémentation, pas le test.)

- [ ] **Step 3 : Schéma**

`src/content/schema.ts` :
- `choixLieuSchema` : ajouter `suite: slug.optional(),`
- `lieuSchema` : ajouter `suite: slug.optional(),`
- `verifierFormat` (branche parcours) : remplacer le contrôle « 4 à 6 lieux » sur tout le fichier par l’appel à `verifierRoutes` — attention au type : `verifierFormat` reçoit `{ type; format; etapes: { type: string }[] }` ; élargir sa signature pour recevoir `etapes: Etape[]` (la mission complète est déjà disponible là où elle est appelée) et :

```ts
  for (const err of verifierRoutes(m.etapes)) ctx.addIssue({ code: 'custom', path: err.chemin, message: err.message })
```

Garder les contrôles « ne contient que des lieux et au plus un mini-jeu » et « une mission rappel ne peut pas être un parcours ». `import { verifierRoutes } from '@/engine/routes'` : vérifier qu’il n’y a pas d’import circulaire (`routes.ts` n’importe que des **types** de `schema.ts` → `import type`, sans effet à l’exécution). Le build de contenu (`scripts/build-content.ts`) utilise `schema.ts` sous Node : vérifier que l’alias `@/` y est résolu (sinon importer par chemin relatif `../engine/routes`).

- [ ] **Step 4 : Tests et commit**

Run : `npx vitest run tests/unit/routes.test.ts tests/unit/schema.test.ts` → PASS ; `npm run lint; npm run typecheck; npm test` (le contenu réel doit toujours se valider : les 6e n’ont pas de `suite`).

```bash
git add src/engine/routes.ts src/content/schema.ts tests/unit/routes.test.ts tests/unit/schema.test.ts
git commit -m "feat(parcours): routes d’un parcours (suite, bifurcation) et règles du schéma"
```

---

### Task 2 : Moteur par identifiant

**Files :**
- Modify : `src/engine/mission-runner.ts`, `tests/unit/parcours-moteur.test.ts` (ajouts), autres tests unitaires du moteur seulement s’ils construisent un `RunState` à la main (ajouter les nouveaux champs)

**Interfaces :**
- Consumes : T1 (`etapeSuivante`, `bifurcation`).
- Produces : `RunState` gagne `etapeId: string | null` (étape courante) et `chemin: string[]` (étapes déjà quittées, dans l’ordre) ; `index` devient le **rang dans la route** (0 à longueur − 1). `etapeCourante` lit `etapeId`. Signatures publiques inchangées (`demarrer`, `reduire`, `etapeCourante`, `choixDuRun`…).

- [ ] **Step 1 : Tests (échouent)**

Dans `tests/unit/parcours-moteur.test.ts`, ajouter un `describe('parcours à deux routes', …)` avec une mission construite comme la fourche de T1 (réutiliser la fabrique de lieu complet du fichier ; les lieux doivent avoir des `reaction`, `aRetenir`, `pourquoi` si un choix est risqué, comme l’exige le schéma — ou construire l’objet sans passer par Zod, le moteur ne revalide pas) :

```ts
it('le choix « bon » de la bifurcation mène à la route a, jusqu’à l’arrivée', () => {
  let e = demarrer(m)
  e = bien(m, e)                              // l1 : choisir « b », continuer
  e = reduire(m, e, { type: 'choisir', choixId: 'b' })  // l2 : bifurcation
  e = reduire(m, e, { type: 'continuer' })
  expect(e.etapeId).toBe('a3')
  expect(e.index).toBe(2)
  e = bien(m, e); e = bien(m, e)              // a3, a4
  expect(e.etapeId).toBe('l5')
  expect(e.index).toBe(4)
  e = bien(m, e)
  expect(e.termine).toBe(true)
  expect(e.chemin).toEqual(['l1', 'l2', 'a3', 'a4', 'l5'])
})
it('le choix « aide » mène à la route b', () => { /* idem avec 'a' → b3, b4, l5 */ })
it('un choix risqué fait toujours rester sur place', () => { /* l2 : choisir 'r', pourquoi, récupération si demandée, rejouer → etapeId reste 'l2' */ })
it('passer la bifurcation suit la route « bon »', () => {
  let e = bien(m, demarrer(m))
  e = reduire(m, e, { type: 'passer' })
  expect(e.etapeId).toBe('a3')
})
it('rejouer sur la bifurcation après un bon choix permet de changer de route', () => {
  let e = bien(m, demarrer(m))
  e = reduire(m, e, { type: 'choisir', choixId: 'b' })
  e = reduire(m, e, { type: 'rejouer' })
  e = reduire(m, e, { type: 'choisir', choixId: 'a' })
  e = reduire(m, e, { type: 'continuer' })
  expect(e.etapeId).toBe('b3')
  expect(e.chemin).toEqual(['l1', 'l2'])
})
it('un parcours linéaire se joue comme avant', () => { /* fixture 6e existante : etapeId suit l’ordre du fichier, index = position */ })
```

(`bien(m, e)` : helper local qui choisit le premier choix non risqué de l’étape courante puis envoie « continuer » ; si l’étape demande une récupération après un bon choix, ce n’est jamais le cas — la récupération ne suit que les choix risqués.)

Run : `npx vitest run tests/unit/parcours-moteur.test.ts` → FAIL.

- [ ] **Step 2 : Implémentation**

Dans `src/engine/mission-runner.ts` :

```ts
import { bifurcation, etapeSuivante } from './routes'

export interface RunState {
  /** Rang de l’étape courante dans la route (0 = première), pour le compteur et la scène. */
  index: number
  /** Identifiant de l’étape courante (null quand la mission est terminée). */
  etapeId: string | null
  /** Étapes déjà quittées, dans l’ordre de la route jouée. */
  chemin: string[]
  // … champs existants inchangés
}

export function demarrer(mission: Mission): RunState {
  const premiere = mission.etapes[0]
  return { index: 0, etapeId: premiere?.id ?? null, chemin: [], phase: phaseInitiale(premiere), choixId: null,
    resultats: {}, termine: !premiere, leviersCedes: [], indiceUtilise: false }
}

export function etapeCourante(mission: Mission, etat: RunState): Etape | null {
  return etat.termine || !etat.etapeId ? null : (mission.etapes.find((e) => e.id === etat.etapeId) ?? null)
}

/** Passe à l’étape suivante sur la route décidée par `choixId` (le choix fait à l’étape courante, ou null). */
function suivante(mission: Mission, etat: RunState, resultats: Record<string, EtapeResultat>, choixId: string | null): RunState {
  const courante = etat.etapeId!
  const id = etapeSuivante(mission.etapes, courante, choixId)
  const prochaine = id ? mission.etapes.find((e) => e.id === id) : undefined
  return {
    ...etat,
    index: etat.index + 1,
    etapeId: prochaine?.id ?? null,
    chemin: [...etat.chemin, courante],
    phase: prochaine ? phaseInitiale(prochaine) : null,
    choixId: null,
    resultats,
    termine: !prochaine,
    indiceUtilise: false,
  }
}
```

Appels à `suivante` :
- après un bon choix (`continuer` sur une conséquence non risquée, et après la récupération) : passer `resultat.choixId` ;
- `passer` : passer l’id du choix `bon` de l’étape si elle est une bifurcation (`bifurcation(mission.etapes, etape.id) ? etape.choix.find(c => c.qualite === 'bon')!.id : null`) ;
- `minijeu-termine`, `fil-termine` : `null`.

Missions classiques et rappels : `etapeSuivante` sans `suite` = étape suivante du fichier → comportement identique. Vérifier qu’aucun appelant n’utilise `mission.etapes[etat.index]` ailleurs (`grep -rn "etapes\[etat.index\]\|etapes\[.*index\]" src`).

- [ ] **Step 3 : Tests et commit**

`npx vitest run tests/unit/parcours-moteur.test.ts tests/unit/mission-runner.test.ts` → PASS ; `npm run lint; npm run typecheck; npm test`.

```bash
git add src/engine/mission-runner.ts tests/unit
git commit -m "feat(parcours): le moteur suit la route jouée (étape courante par identifiant)"
```

---

### Task 3 : Chemin, compteur, scène, fin de mission

**Files :**
- Modify : `src/mission/CheminIle.vue`, `src/pages/MissionPage.vue`, `src/mission/FinMission.vue`
- Create : `tests/unit/parcours-routes-ui.test.ts`

**Interfaces :**
- Consumes : T1 (`aVenir`, `longueurRoute`, `bifurcation`, `routesDe`), T2 (`etat.etapeId`, `etat.chemin`, `etat.index`).
- Produces : `CheminIle` props `{ mission: Mission; chemin: string[]; courante: string | null }` (remplace `index`) ; `FinMission` reçoit déjà l’état final (lire comment) : il affiche la route prise si la mission a une bifurcation.

- [ ] **Step 1 : Tests (échouent)**

`tests/unit/parcours-routes-ui.test.ts` (mission fourche complète construite comme en T2, mais passée par `missionSchema.parse` pour avoir les valeurs par défaut ; ou ajouter un parcours à deux routes dans `tests/unit/content-mock-parcours.ts`) :

```ts
it('avant la bifurcation : lieux à venir « selon ton choix », sans nom', () => {
  const w = mount(CheminIle, { props: { mission, chemin: ['l1'], courante: 'l2' } })
  const items = w.findAll('li.halte').map((li) => li.text())
  expect(items).toHaveLength(5)
  expect(items[2]).toContain('selon ton choix')
  expect(items[3]).toContain('selon ton choix')
  expect(w.text()).not.toContain(nomDe('a3'))
  expect(w.text()).not.toContain(nomDe('b3'))
  expect(items[4]).toContain(nomDe('l5'))
})
it('après la bifurcation : seule la route prise, avec ses noms', () => {
  const w = mount(CheminIle, { props: { mission, chemin: ['l1', 'l2'], courante: 'b3' } })
  expect(w.text()).toContain(nomDe('b3'))
  expect(w.text()).toContain(nomDe('b4'))
  expect(w.text()).not.toContain(nomDe('a3'))
  expect(w.find('[aria-current="step"]').text()).toContain(nomDe('b3'))
})
it('un parcours linéaire affiche tous ses lieux comme avant', () => { /* fixture 6e */ })
it('compteur « Étape n sur 5 » sur un parcours à 7 lieux', () => { /* monter MissionPage sur la mission fourche, vérifier le total affiché = 5 */ })
it('fin : « Tu as pris la route … » et « Rejouer pour découvrir l’autre route »', () => { /* FinMission avec l’état final route b : texte contient le texte court du choix « aide » de la bifurcation ; un bouton/lien « Rejouer pour découvrir l’autre route » relance la mission */ })
it('fin d’un parcours linéaire : aucune mention de route', () => { /* … */ })
```

Run → FAIL.

- [ ] **Step 2 : `CheminIle.vue`**

```ts
const props = defineProps<{ mission: Mission; chemin: string[]; courante: string | null }>()
const nom = (id: string) => {
  const e = props.mission.etapes.find((x) => x.id === id)
  return e?.type === 'lieu' ? e.lieu : 'Mini-jeu'
}
const etapes = computed(() => {
  const visites = props.chemin.map((id) => ({ id, nom: nom(id), etat: 'visite' as const }))
  if (!props.courante) return visites
  const ici = { id: props.courante, nom: nom(props.courante), etat: 'ici' as const }
  const suite = aVenir(props.mission.etapes, props.courante).map((id, i) =>
    id ? { id, nom: nom(id), etat: 'a-venir' as const } : { id: `inconnu-${i}`, nom: 'selon ton choix', etat: 'a-venir' as const, inconnu: true },
  )
  return [...visites, ici, ...suite]
})
```

Dans le template, afficher `Lieu {{ i + 1 }} — selon ton choix` pour un élément `inconnu` (texte en `--texte-doux`, italique), le reste inchangé. `ETATS` et la mention visuellement masquée inchangées.

- [ ] **Step 3 : `MissionPage.vue`**

- `:total="longueurRoute(mission.etapes)"` (au lieu de `mission.etapes.length`).
- `CheminIle` : `:chemin="etat.chemin" :courante="etat.etapeId"`.
- `etapesScene` : construire la liste **de la route** pour la scène : `computed` = `[...etat.chemin, etat.etapeId, ...aVenir(...)]` (ids ou `null`, tronqué à `longueurRoute`), chaque élément converti en `{ id, nom, emoji }` ; pour `null` : `{ id: 'inconnu-<rang>', nom: 'selon ton choix', emoji: '❔' }`. Une fois la mission terminée : `etat.chemin`. `:position="etat.termine ? longueur : etat.index"`.

- [ ] **Step 4 : `FinMission.vue`**

Si `routesDe(mission.etapes).length > 1` : trouver la bifurcation (première étape de `etat.chemin` pour laquelle `bifurcation(...)` n’est pas nulle), le choix fait (`etat.resultats[id].choixId`) et afficher dans un `.encadre.encadre-info` :
« Tu as pris la route « *texte du choix fait* ». Il existe une autre bonne route. » suivi d’un bouton `btn` « Rejouer pour découvrir l’autre route » qui émet l’événement de recommencement déjà utilisé par le bouton « Rejouer la mission » (lire `FinMission.vue` / `MissionPage.vue` : `recommencer`). Ne rien afficher pour un parcours linéaire. Aucun texte ne compare les routes.

- [ ] **Step 5 : Tests, contrôle visuel, commit**

Run : `npx vitest run tests/unit/parcours-routes-ui.test.ts tests/unit/parcours-ui.test.ts tests/unit/refonte-parcours.test.ts` puis `npm run lint; npm run typecheck; npm test`.
Pas de contrôle visuel à ce stade (aucun parcours collège réel) : il se fait en T6.

```bash
git add src/mission/CheminIle.vue src/pages/MissionPage.vue src/mission/FinMission.vue tests/unit
git commit -m "feat(parcours): chemin « selon ton choix », compteur par route et fin de mission avec la route prise"
```

---

### Task 4 : Fiche enseignant, plan B, export de relecture

**Files :**
- Modify : `src/pages/FicheMissionPage.vue`, `src/pages/PlanBPage.vue`, `scripts/export-relecture.ts`
- Create/Modify : tests de la fiche et du plan B (fichier existant `tests/unit/enseignants.test.ts` ou nouveau `tests/unit/parcours-routes-enseignant.test.ts`), `tests/unit/node/export-relecture.test.ts`

**Interfaces :**
- Consumes : T1 (`routesDe`, `bifurcation`).
- Produces : fonction pure `numerosLieux(etapes: Etape[]): Record<string, string>` dans `src/engine/routes.ts` (avec son test dans `tests/unit/routes.test.ts`) : numéros affichés « 1, 2, 3a, 4a, 3b, 4b, 5 » (tronc commun : rang + 1 ; sur une route après la bifurcation : rang + 1 suivi de `a` pour la route « bon », `b` pour la route « aide » ; après la jonction : rang + 1). Linéaire : « 1 … n ».

- [ ] **Step 1 : Tests (échouent)**

- `numerosLieux(fourche)` = `{ l1: '1', l2: '2', a3: '3a', a4: '4a', b3: '3b', b4: '4b', l5: '5' }` ; linéaire : `{ l1: '1', …, l5: '5' }`.
- Fiche d’un parcours à deux routes : contient « Lieux 1 – 2, puis selon le choix : 3a – 4a ou 3b – 4b, puis 5 » et la piste de débrief « Comparez les deux routes : les deux sont bonnes, qu’est-ce qui change ? ».
- Plan B : chaque lieu titré « Lieu 3a : <nom> » ; à la bifurcation, après les choix, la consigne « Si tu choisis « <texte bon> », va au lieu 3a. Si tu choisis « <texte aide> », va au lieu 3b. » ; à la fin de chaque route avant la jonction, « Va au lieu 5. » ; le corrigé liste les 7 lieux.
- Export : chaque lieu « ### Lieu 3a (route « <texte bon> ») : … » ; tronc commun sans mention de route.
- Fiche, plan B et export d’un parcours 6e : inchangés (snapshot ou textes existants des tests actuels).

- [ ] **Step 2 : Implémentation**

`numerosLieux` dans `routes.ts` à partir de `routesDe` (route 0 = « bon » → `a`, route 1 = « aide » → `b`) ; un id présent dans les deux routes au même rang garde le numéro simple.
`FicheMissionPage.vue` : section « Les deux routes » (si `routesDe(...).length > 1`) avec le schéma en texte, et pour chaque route : le texte du choix de bifurcation, la liste de ses lieux (numéro + nom) ; ajouter la piste de débrief à la liste du débrief.
`PlanBPage.vue` : titres `Lieu {{ numeros[e.id] }}` au lieu de `Lieu {{ i + 1 }}` (pour tous les parcours : identique en linéaire) ; consignes de renvoi comme ci-dessus ; corrigé par numéro.
`scripts/export-relecture.ts` : titre de lieu avec numéro et route.

- [ ] **Step 3 : Tests et commit**

Run les tests ciblés puis `npm run lint; npm run typecheck; npm test`.

```bash
git add src/engine/routes.ts src/pages/FicheMissionPage.vue src/pages/PlanBPage.vue scripts/export-relecture.ts tests/unit
git commit -m "feat(parcours): routes dans la fiche, plan B « livre dont tu es le héros » et export de relecture"
```

---

### Task 5 : Trois décors et règles de contenu des parcours collège

**Files :**
- Modify : `src/content/schema.ts` (`DECORS`), `src/mission/DecorScene.vue`, `src/parcours/decors.ts`, `tests/unit/node/content-real.test.ts`, tests de `DecorScene` s’ils énumèrent les décors

**Interfaces :**
- Produces : décors `gymnase`, `musee`, `fete` ; règles de contenu (Step 3) que T6–T7b doivent satisfaire.

- [ ] **Step 1 : Décors**

`DECORS` : ajouter `'gymnase', 'musee', 'fete'`. `DECORS_EMOJI` : `gymnase: '🏐'`, `musee: '🏛️'`, `fete: '🎂'`. `DecorScene.vue` : trois nouveaux `<template v-else-if>` dans le même style que les existants (viewBox 320×160, formes simples, couleurs littérales dans le template) :
- `gymnase` : parquet clair, lignes de terrain, panier ou filet, gradins, fenêtres hautes ;
- `musee` : façade à colonnes et fronton, marches, un car scolaire garé devant ;
- `fete` : salon avec guirlande de fanions, ballons, table avec gâteau et bougies.

Contrôle visuel : dans un fichier HTML du scratchpad (hors dépôt), recopier les trois SVG et en faire une capture (`npx playwright screenshot file:///…`), vérifier qu’ils se lisent et ne ressemblent pas aux décors existants.

- [ ] **Step 2 : Règles de contenu existantes adaptées**

Dans `tests/unit/node/content-real.test.ts` :
- le test « 5 lieux, 2 récupérations ou plus, 15 min » devient : **chaque route** a 5 lieux (`routesDe(m.etapes)`), au moins 2 lieux avec récupération dans tout le fichier, `duree` 15 (6e) ou 20 (5e-3e), un décor différent par lieu **sur chaque route** ;
- le test « un parcours de l’île pour les 6e » reste ;
- ajouter le test de couverture « les 6 îles ont un parcours 5e – 3e » en `it.skip` (il ne peut passer qu’une fois les 6 parcours écrits) : **T8** le dé-skippe.

- [ ] **Step 3 : Nouvelles règles (parcours 5e – 3e)**

Ajouter dans `content-real.test.ts`, pour chaque parcours dont `tranches` contient `'5e-3e'` :
- exactement une bifurcation (`etapes.filter((e) => bifurcation(m.etapes, e.id)).length === 1`) et deux routes ;
- au moins un lieu avec récupération **sur chaque route** ;
- aucun texte de route ne compare les routes : les textes (`guide`, `reaction`, `aRetenir`) des lieux propres à une route ne contiennent ni « meilleur », ni « aurais dû », ni « l’autre route » (regex insensible à la casse) ;
- le choix `bon` de la bifurcation ne commence pas par « Je demande » (il doit dire ce que l’élève fait lui-même).

Les règles transverses existantes (marques fictives, longueur équilibrée des choix, « Je demande de l’aide », pas de liens réels…) s’appliquent déjà à tous les parcours : vérifier qu’elles parcourent bien les 7 lieux.

- [ ] **Step 4 : Tests et commit**

`npx vitest run tests/unit/node/content-real.test.ts` puis `npm run lint; npm run typecheck; npm test`.

```bash
git add src/content/schema.ts src/mission/DecorScene.vue src/parcours/decors.ts tests/unit
git commit -m "feat(parcours): décors gymnase, musée et fête ; règles de contenu des parcours 5e – 3e"
```

---

### Task 6 : Parcours collège — hameçons et clés

**Files :**
- Create : `content/missions/phishing/p-college-parcours.yaml`, `content/missions/comptes/c-college-parcours.yaml`

**Interfaces :**
- Consumes : format des parcours (`content/missions/phishing/p-6e-parcours.yaml` comme modèle complet de champs), `suite` (T1), décors (T5), règles (T5), leviers (`content/leviers.yaml`), actions de récupération (`RECOVERY_ACTIONS` dans `src/content/schema.ts`).

- [ ] **Step 1 : Lire les modèles**

Lire en entier `content/missions/phishing/p-6e-parcours.yaml`, `content/missions/phishing/p-college-ami-pirate.yaml` (pour **ne pas** reprendre la même situation), `content/missions/comptes/c-6e-parcours.yaml`, `content/missions/comptes/c-college-compte-vole.yaml`, `content/leviers.yaml`, et la section 5 de la spec.

- [ ] **Step 2 : Écrire `p-college-parcours.yaml`** — « Le concours de l’influenceur »

`id: p-college-parcours`, `theme: phishing`, `format: parcours`, `tranches: ['5e-3e']`, `titre: La traversée de l’île aux hameçons`, `duree: 20`, `resume`, `objectifs`, `competences`, `debrief`, `fiche` comme le modèle 6e (sans les champs `…Simple`, facultatifs). 7 lieux, forme 1 → 2 → (3a → 4a | 3b → 4b) → 5 ; bifurcation au lieu 2, deux lieux par route. Fil rouge : un DM « tu as gagné le concours de *[influenceur fictif]* », une fausse page de marque fictive, un QR code collé au tournoi (décor `gymnase`), etc. Route « bon » (« je vérifie moi-même sur le compte officiel ») : l’élève vérifie, signale la fausse page, prévient son groupe ; route « aide » (« Je demande de l’aide à… ») : un adulte (CPE, parent) aide à vérifier et à signaler, explique la suite. Dernier lieu commun : le tournoi se termine, ce qu’on retient. Chaque lieu : 3 ou 4 choix dont un `risque` crédible (pression du groupe, urgence, gain), `pourquoi` (3–4 leviers) si un choix est risqué, `aRetenir`, et au moins une récupération par route (actions existantes : `changer-mdp`, `activer-2fa`, `prevenir-contacts`, `bloquer-signaler`…).

- [ ] **Step 3 : Écrire `c-college-parcours.yaml`** — « Le compte partagé du club »

Mêmes règles ; `theme: comptes` ; décors variés (dont `gymnase`) ; fil rouge : le mot de passe d’équipe du compte du club circule dans le groupe, quelqu’un demande « le code que tu viens de recevoir », un appareil inconnu se connecte… Route « bon » : je sécurise moi-même (nouveau mot de passe, double authentification, je préviens le groupe) ; route « aide » : je préviens l’entraîneur·e, qui reprend la main sur le compte.

- [ ] **Step 4 : Vérifier**

`npm run build` (le contenu est validé au build) ; `npx vitest run tests/unit/node/content-real.test.ts` ; `npm run export:relecture` puis relire les deux Markdown produits dans `dist-relecture/` (non committé) : texte fluide, pas de faute, aucun indice de forme, aucune route meilleure que l’autre.
Contrôle visuel : `npx vite --port 5199 --strictPort`, jouer les deux routes d’un parcours au clavier ; capture de la bifurcation (`CheminIle` « selon ton choix ») et de la fin, en clair et sombre (PNG dans le scratchpad).

- [ ] **Step 5 : Commit**

```bash
git add content/missions/phishing/p-college-parcours.yaml content/missions/comptes/c-college-parcours.yaml
git commit -m "feat(contenu): parcours collège de l’île aux hameçons et de l’île des clés"
```

---

### Task 7a : Parcours collège — secrets et pièces d’or

Mêmes étapes que la Task 6, avec :
- `content/missions/vie-privee/v-college-parcours.yaml` — « La fête d’anniversaire » (décor `fete`) : photos, story géolocalisée, un ami qui identifie sans demander. Route « bon » : j’en parle moi-même à l’ami (demande de retrait, réglages de qui voit quoi) ; route « aide » : je demande de l’aide à un adulte. Ne pas reprendre `v-college-story.yaml`.
- `content/missions/jeux-achats/j-college-parcours.yaml` — « Le skin à moitié prix » : échange sur un serveur de jeu fictif, faux « intermédiaire », cartes cadeaux, carte bancaire des parents. Route « bon » : je signale et bloque moi-même ; route « aide » : je préviens mes parents (opposition bancaire si besoin, signalement). Ne pas reprendre `j-college-faux-modo.yaml`.

Commit : `feat(contenu): parcours collège de l’île aux secrets et de l’île aux pièces d’or`.

### Task 7b : Parcours collège — rumeurs et antennes

Mêmes étapes que la Task 6, avec :
- `content/missions/desinformation/d-college-parcours.yaml` — « La sortie est annulée ! » (décor `musee`) : message vocal viral dans le groupe de classe, capture retouchée. Route « bon » : je vérifie les sources moi-même (site du collège, ENT, recherche inversée) ; route « aide » : je demande au professeur. Ne pas reprendre `d-college-hors-contexte.yaml`.
- `content/missions/appareils/a-college-parcours.yaml` — « Le car de la sortie » (décors `musee`, `bus`…) : Wi-Fi ouvert, image reçue par partage sans fil, borne de recharge publique, appli « sortie » qui demande tout. Route « bon » : je règle moi-même mon téléphone ; route « aide » : je demande à l’adulte accompagnateur. Ne pas reprendre `a-college-hors-store.yaml`.

Commit : `feat(contenu): parcours collège de l’île aux rumeurs et de l’île aux antennes`.

---

### Task 8 : E2E, couverture des îles, documentation

**Files :**
- Create : `tests/e2e/parcours-routes.spec.ts`
- Modify : `tests/unit/node/content-real.test.ts` (dé-skipper « les 6 îles ont un parcours 5e – 3e »), `README.md`

- [ ] **Step 1 : Couverture**

Dé-skipper le test posé en T5 ; il doit être vert (6 parcours 5e – 3e).

- [ ] **Step 2 : `tests/e2e/parcours-routes.spec.ts`**

Avec les helpers existants (`commencer`, `ouvrirMission`, `choisirPersonnageSiDemande`, `verifierA11y` à recopier comme dans les autres specs) :
- **route « bon »** : `commencer(page, '5e – 3e', 'Solo')`, `ouvrirMission(page, 'Île aux hameçons', 'La traversée de l’île aux hameçons')`, personnage si demandé ; jouer chaque lieu en choisissant le choix `bon` (sélecteur `[data-qualite="bon"]` comme dans les specs existantes) puis « Continuer » ; vérifier au lieu 2 que le chemin affiche « selon ton choix » ; vérifier en fin de mission « Tu as pris la route » et le lien « Rejouer pour découvrir l’autre route » ;
- **route « aide »** : idem avec `[data-qualite="aide"]` à la bifurcation, et vérifier qu’un lieu propre à la route « aide » (nom lu dans le YAML) apparaît ;
- **audit axe** (Chromium) à la bifurcation et en fin de mission, en `colorScheme` `light` et `dark` ;
- **compteur** : « Étape 1 sur 5 » (ou le libellé réel du compteur de `MissionBarre`, qui ne s’affiche pas sur l’île : dans ce cas vérifier le nom accessible de la scène « Étape 1 sur 5 »).

- [ ] **Step 3 : README**

Section « Parcours à deux routes » : format `suite`, règles (même longueur, bifurcation `bon` / `aide`), où sont vérifiées les routes (`src/engine/routes.ts`), numéros 3a / 3b du plan B.

- [ ] **Step 4 : Suite complète et commit**

`npm run lint; npm run typecheck; npm test; npm run build; npx playwright test` (le test WebKit instable connu peut être relancé une fois).

```bash
git add tests README.md
git commit -m "test(parcours): routes collège de bout en bout, audit ; README"
```
