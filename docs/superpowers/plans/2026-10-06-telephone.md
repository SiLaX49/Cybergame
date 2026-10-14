# Nouveau faux téléphone : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le faux téléphone par un composant unique `<Telephone>`, réaliste, dans lequel l'élève répond, et qui affiche aussi l'écran verrouillé des missions Rappel.

**Architecture:** `src/phone/Telephone.vue` est le seul composant importé par le jeu ; il aiguille vers une appli par fichier (`apps/`) bâtie sur des briques partagées (`parts/`) et des fonctions pures testées à part. `ecran` devient une union Zod discriminée par `app`, le contenu est migré vers les nouveaux champs, le moteur ne change pas.

**Tech Stack:** Vue 3.5 (`<script setup>`, `useId`), TypeScript 5.9, Zod 4, @lucide/vue, Vitest 5 + @vue/test-utils (jsdom), Playwright + @axe-core/playwright.

**Spec:** `docs/superpowers/specs/2026-10-06-telephone-design.md`

## Environnement

Les dépendances ne sont installées que dans le conteneur de développement (volume Docker). Toutes les commandes passent par lui :

```bash
dx() { docker exec -w /workspaces/Cybergame "$(docker ps -q --filter ancestor=mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm | head -1)" "$@"; }
dx npx vitest run tests/unit/telephone.test.ts
```
Vérification complète en fin de tâche : `dx npm run lint && dx npm run typecheck && dx npx vitest run`.

## Global Constraints

- Le reste du jeu n'importe que `src/phone/Telephone.vue` (plus les fonctions pures `src/phone/*.ts`).
- Aucun fichier de `src/phone/` ne dépasse 150 lignes.
- Le moteur `src/engine/mission-runner.ts` et le stockage `src/store/` ne changent pas.
- Marques fictives uniquement ; textes en français avec accents complets et apostrophe U+2019 dans les libellés visibles.
- Jamais de tiret cadratin ni demi-cadratin dans le code, les textes et les commits.
- Aplats opaques, contraste du texte d'au moins 4.5:1 ; aucun cadenas « sécurisé », seule une adresse `http://` affiche « Non sécurisé ».
- Les bannières de geste sont neutres : le téléphone ne dit jamais si le choix était bon.
- Commits Conventional Commits en anglais, impératif, 72 caractères maximum, trailer `build with cc`, email `58286681+enixCode@users.noreply.github.com` (déjà configuré dans le dépôt). Les sous-agents ne committent pas : l'orchestrateur rejoue l'oracle puis committe.

## Review Focus

1. Un texte sans lien qui contient un point (« M. Durand. », « 18 h. », « 1,99 € ») ne doit jamais être mis en forme comme un lien ; une adresse mail non plus (tests en tâche 2).
2. « Rejouer ce scénario » remet le téléphone en attente : les actions réapparaissent et la bulle ou bannière disparaît (test en tâche 6).
3. Au clavier, après une action sur une notification de l'écran verrouillé, le focus revient sur cette notification et ne se perd pas dans le document (test en tâche 7).
4. Une citation « … » d'un `truc` qui vit maintenant dans un champ structuré (adresse, média, compteurs) doit rester trouvée par le test des citations, en lecture normale et simplifiée (tâches 1 et 3).
5. Contact sans lettre (numéro de téléphone) : l'avatar affiche une icône, jamais des chiffres ni un vide (test en tâche 2).

---

### Task 1: Schéma des écrans en union par appli

**Files:**
- Modify: `src/content/schema.ts` (bloc `messageSchema`/`ecranSchema` vers la ligne 70, `choixSchema` vers la ligne 85, notification de `filSchema` vers la ligne 320)
- Create: `src/phone/stats.ts`
- Create: `tests/unit/node/textes-ecran.ts`
- Modify: `tests/unit/node/content-real.test.ts` (fonction `textesDesFauxEcrans`, tests « questions et choix » et « citations »)
- Modify: `src/pages/PlanBPage.vue:40-41` (accès typés à `sujet` et `url`)
- Test: `tests/unit/ecran-schema.test.ts`

**Interfaces:**
- Produces : `GESTES`, `type Geste`, `type Ecran`, `type Message`, `type Choix` exportés par `src/content/schema.ts` ; `texteStats(s: { vues?: string; jaime?: string; partages?: string }): string` dans `src/phone/stats.ts` ; `textesEcran(e: Ecran, simple?: boolean): string[]` dans `tests/unit/node/textes-ecran.ts`.

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/unit/ecran-schema.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { filSchema, scenarioSchema } from '@/content/schema'
import { texteStats } from '@/phone/stats'
import { rawRappel, rawScenario } from './fixtures'

type Resultat = { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }
const erreurs = (r: Resultat) => (r.success ? [] : r.error!.issues.map((i) => `${i.path.join('.')} : ${i.message}`))
const messages = [{ de: 'contact', texte: 'Bonjour' }]
const avecEcran = (ecran: Record<string, unknown>) => ({ ...rawScenario(), ecran })

describe('écran du téléphone', () => {
  it('accepte les champs propres à chaque appli', () => {
    const ecrans = [
      { app: 'sms', appNom: 'Messages', contact: 'Léa', messages: [{ de: 'contact', texte: 'Salut', heure: '09:12', apercu: { titre: 'Suivi', domaine: 'colis-xp.net' } }] },
      { app: 'chat', appNom: 'ChatCord', contact: 'Yanis', messages },
      {
        app: 'social', appNom: 'SnapTalk', contact: 'infoeclair', messages, certifie: true, abonnes: '2 400', bio: 'Parodie',
        media: { description: 'Vidéo de 5 secondes' }, stats: { vues: '1 200', partages: '87' }, commentaires: [{ de: 'lea_42', texte: 'Trop drôle' }],
      },
      { app: 'mail', appNom: 'Mail', contact: 'Mon Collège', adresse: 'support@moncollege-ent.net', sujet: 'Mot de passe', pieceJointe: { nom: 'devoir.pdf' }, messages },
      { app: 'web', appNom: 'Navigateur', contact: 'Wi-Fi Gare', url: 'http://gare-wifi.com', messages },
      { app: 'web', appNom: 'Magasin d’applis', contact: 'TunnelZéro VPN', messages },
    ]
    for (const e of ecrans) expect(erreurs(scenarioSchema.safeParse(avecEcran(e))), e.app).toEqual([])
  })

  it('refuse une appli inconnue', () => {
    expect(scenarioSchema.safeParse(avecEcran({ app: 'fax', appNom: 'Fax', contact: 'X', messages })).success).toBe(false)
  })

  it('vérifie le format des heures et des adresses mail', () => {
    const sms = { app: 'sms', appNom: 'Messages', contact: 'Léa', messages: [{ de: 'contact', texte: 'Salut', heure: '9h12' }] }
    expect(erreurs(scenarioSchema.safeParse(avecEcran(sms)))).toEqual(['ecran.messages.0.heure : heure attendue au format HH:MM'])
    const mail = { app: 'mail', appNom: 'Mail', contact: 'X', adresse: 'pas une adresse', messages }
    expect(erreurs(scenarioSchema.safeParse(avecEcran(mail)))).toEqual(['ecran.adresse : adresse mail attendue (nom@domaine.fr)'])
  })

  it('la réponse va avec le geste « repondre », et seulement avec lui', () => {
    const s = rawScenario()
    const sansReponse = { ...s, choix: s.choix.map((c) => (c.id === 'verif' ? { ...c, geste: 'repondre' } : c)) }
    expect(erreurs(scenarioSchema.safeParse(sansReponse))).toEqual([
      'choix.1.reponse : le geste "repondre" demande une reponse (la bulle envoyée)',
    ])
    const reponseEnTrop = { ...s, choix: s.choix.map((c) => (c.id === 'verif' ? { ...c, geste: 'bloquer', reponse: 'Non' } : c)) }
    expect(erreurs(scenarioSchema.safeParse(reponseEnTrop))).toEqual(['choix.1.reponse : reponse réservée au geste "repondre"'])
    const ok = { ...s, choix: s.choix.map((c) => (c.id === 'verif' ? { ...c, geste: 'repondre', reponse: 'C’est qui ?' } : c)) }
    expect(erreurs(scenarioSchema.safeParse(ok))).toEqual([])
  })

  it('une notification peut avoir une heure', () => {
    const fil = rawRappel().etapes[0] as unknown as { notifications: Record<string, unknown>[] }
    const avecHeure = (heure: string) => ({ ...fil, notifications: fil.notifications.map((n, i) => (i === 0 ? { ...n, heure } : n)) })
    expect(filSchema.safeParse(avecHeure('07:45')).success).toBe(true)
    expect(erreurs(filSchema.safeParse(avecHeure('25:00')))).toEqual(['notifications.0.heure : heure attendue au format HH:MM'])
  })
})

describe('texteStats', () => {
  it('écrit les compteurs présents avec leur unité', () => {
    expect(texteStats({ vues: '1 200', partages: '87' })).toBe('1 200 vues · 87 partages')
    expect(texteStats({ jaime: '3' })).toBe('3 j’aime')
    expect(texteStats({})).toBe('')
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `dx npx vitest run tests/unit/ecran-schema.test.ts`
Expected: FAIL (module `@/phone/stats` introuvable, puis champs inconnus ou règles absentes).

- [ ] **Step 3: Implémenter le schéma**

Dans `src/content/schema.ts`, à côté de `FIL_ACTIONS` :
```ts
/** Ce que le téléphone montre quand l'élève fait un choix (bulle envoyée ou bannière système). */
export const GESTES = [
  'repondre', 'ouvrir-lien', 'se-connecter', 'telecharger', 'installer', 'payer', 'partager',
  'verifier', 'bloquer', 'signaler', 'ignorer', 'supprimer', 'demander-aide',
] as const
export type Geste = (typeof GESTES)[number]

const heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'heure attendue au format HH:MM')
```
Remplacer `messageSchema` et `ecranSchema` :
```ts
const messageSchema = z.object({
  de: z.enum(['contact', 'moi']),
  texte,
  texteSimple: texte.optional(),
  heure: heure.optional(),
  apercu: z.object({ titre: texte, domaine: texte }).optional(),
})
export type Message = z.infer<typeof messageSchema>

const ecranCommun = { appNom: texte, contact: texte, messages: z.array(messageSchema).min(1) }

/** Faux écran d'un scénario : une forme par appli, chacune avec ses seuls champs. */
export const ecranSchema = z.discriminatedUnion('app', [
  z.object({ app: z.literal('sms'), ...ecranCommun }),
  z.object({ app: z.literal('chat'), ...ecranCommun }),
  z.object({
    app: z.literal('social'),
    ...ecranCommun,
    certifie: z.boolean().default(false),
    abonnes: texte.optional(),
    bio: texte.optional(),
    media: z.object({ description: texte, descriptionSimple: texte.optional() }).optional(),
    stats: z.object({ vues: texte.optional(), jaime: texte.optional(), partages: texte.optional() }).optional(),
    commentaires: z.array(z.object({ de: texte, texte, texteSimple: texte.optional() })).min(1).max(5).optional(),
  }),
  z.object({
    app: z.literal('mail'),
    ...ecranCommun,
    sujet: texte.optional(),
    adresse: z.string().trim().regex(/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/, 'adresse mail attendue (nom@domaine.fr)').optional(),
    pieceJointe: z.object({ nom: texte }).optional(),
  }),
  z.object({ app: z.literal('web'), ...ecranCommun, url: texte.optional() }),
])
export type Ecran = z.infer<typeof ecranSchema>
```
Remplacer `choixSchema` :
```ts
const choixSchema = z
  .object({
    id: slug,
    texte,
    qualite: z.enum(['bon', 'risque', 'aide']),
    geste: z.enum(GESTES).optional(),
    reponse: texte.optional(),
    reponseSimple: texte.optional(),
    consequence: texte,
    consequenceSimple: texte.optional(),
  })
  .superRefine((c, ctx) => {
    if (c.geste === 'repondre' && !c.reponse) {
      ctx.addIssue({ code: 'custom', path: ['reponse'], message: 'le geste "repondre" demande une reponse (la bulle envoyée)' })
    }
    if (c.geste !== 'repondre' && (c.reponse || c.reponseSimple)) {
      ctx.addIssue({ code: 'custom', path: ['reponse'], message: 'reponse réservée au geste "repondre"' })
    }
  })
export type Choix = z.infer<typeof choixSchema>
```
Dans `filSchema`, ajouter `heure: heure.optional(),` à l'objet notification (après `texte,`).

`src/phone/stats.ts` :
```ts
/** Compteurs d'une publication tels qu'affichés : « 1 200 vues · 87 partages ». */
export function texteStats(s: { vues?: string; jaime?: string; partages?: string }): string {
  return [s.vues && `${s.vues} vues`, s.jaime && `${s.jaime} j’aime`, s.partages && `${s.partages} partages`]
    .filter(Boolean)
    .join(' · ')
}
```

- [ ] **Step 4: Adapter les consommateurs typés**

`src/pages/PlanBPage.vue:40-41` :
```vue
<p v-if="e.ecran.app === 'mail' && e.ecran.sujet">Objet : {{ e.ecran.sujet }}</p>
<p v-if="e.ecran.app === 'web' && e.ecran.url">Adresse : {{ e.ecran.url }}</p>
```
`tests/unit/node/textes-ecran.ts` (miroir exact de ce que le téléphone affiche ; à tenir à jour avec `src/phone/apps/`) :
```ts
import type { Ecran } from '../../../src/content/schema'
import { texteStats } from '../../../src/phone/stats'

/** Tous les textes visibles d'un faux écran, en lecture normale ou simplifiée. */
export function textesEcran(e: Ecran, simple = false): string[] {
  const t = (x: { texte: string; texteSimple?: string }) => (simple ? (x.texteSimple ?? x.texte) : x.texte)
  const textes = [e.appNom, e.contact, ...e.messages.flatMap((m) => [t(m), m.apercu?.titre ?? '', m.apercu?.domaine ?? ''])]
  if (e.app === 'mail') textes.push(e.sujet ?? '', e.adresse ?? '', e.pieceJointe?.nom ?? '')
  if (e.app === 'web') textes.push(e.url ?? '')
  if (e.app === 'social') {
    textes.push(e.abonnes ? `${e.abonnes} abonnés` : '', e.bio ?? '', texteStats(e.stats ?? {}))
    if (e.media) textes.push(simple ? (e.media.descriptionSimple ?? e.media.description) : e.media.description)
    for (const c of e.commentaires ?? []) textes.push(c.de, t(c))
  }
  return textes
}
```
Dans `tests/unit/node/content-real.test.ts` :
- importer `import { textesEcran } from './textes-ecran'` ;
- dans `textesDesFauxEcrans`, la branche `scenario` devient `if (e.type === 'scenario') return [...textesEcran(e.ecran), ...textesEcran(e.ecran, true)]` ;
- dans le test « aucune marque réelle dans les questions et les choix », remplacer `...e.choix.map((c) => c.texte)` par
  `...e.choix.flatMap((c) => [c.texte, 'reponse' in c ? (c.reponse ?? '') : '', 'reponseSimple' in c ? (c.reponseSimple ?? '') : ''])` ;
- dans le test des citations, la branche `else` devient :
```ts
normal = aplatir([...textesEcran(e.ecran), e.question].join(' '))
simple = aplatir([...textesEcran(e.ecran, true), e.question].join(' '))
```

- [ ] **Step 5: Lancer les tests et la vérification complète**

Run: `dx npx vitest run tests/unit/ecran-schema.test.ts tests/unit/node && dx npm run typecheck`
Expected: PASS (le contenu actuel reste valide : tous les nouveaux champs sont optionnels).

- [ ] **Step 6: Commit**

```bash
git add src/content/schema.ts src/phone/stats.ts src/pages/PlanBPage.vue tests/unit/ecran-schema.test.ts tests/unit/node/textes-ecran.ts tests/unit/node/content-real.test.ts
git commit -m "feat(schema): phone screen as a per-app union with gestures"
```

---

### Task 2: Fonctions pures du téléphone (liens, avatar, gestes)

**Files:**
- Create: `src/phone/liens.ts`, `src/phone/avatar.ts`, `src/phone/gestes.ts`
- Modify: `src/engine/ordre.ts:2` (exporter `empreinte`)
- Test: `tests/unit/telephone-outils.test.ts`

**Interfaces:**
- Consumes : `Geste`, `GESTES`, `Qualite` de `@/content/schema`.
- Produces :
  - `type Morceau = { type: 'texte' | 'lien'; texte: string }` et `decouperLiens(texte: string): Morceau[]`
  - `decouperUrl(url: string): { nonSecurise: boolean; domaine: string; reste: string }`
  - `initiales(nom: string): string` (chaîne vide si aucun mot ne commence par une lettre) et `teinte(nom: string): number` (0 à 359)
  - `GESTES_TELEPHONE: Record<Geste, { icone: Component; banniere: string }>` et `gesteDuChoix(c: { geste?: Geste; qualite: Qualite }): Geste`
  - `empreinte(texte: string): number` exporté par `src/engine/ordre.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/unit/telephone-outils.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { GESTES } from '@/content/schema'
import { initiales, teinte } from '@/phone/avatar'
import { GESTES_TELEPHONE, gesteDuChoix } from '@/phone/gestes'
import { decouperLiens, decouperUrl } from '@/phone/liens'

const texte = (t: string) => ({ type: 'texte', texte: t })
const lien = (t: string) => ({ type: 'lien', texte: t })

describe('decouperLiens', () => {
  it('repère un domaine avec son chemin, sans la ponctuation finale', () => {
    expect(decouperLiens('Paie ici : colis-xp.net/payer.')).toEqual([texte('Paie ici : '), lien('colis-xp.net/payer'), texte('.')])
  })
  it('repère plusieurs liens, avec ou sans https', () => {
    expect(decouperLiens('https://snaptalk-vote.xyz et clipforge-full-crack.zip !')).toEqual([
      lien('https://snaptalk-vote.xyz'), texte(' et '), lien('clipforge-full-crack.zip'), texte(' !'),
    ])
  })
  it('ignore les adresses mail', () => {
    const t = 'Écris à support@moncollege-ent.net ou prenom.nom@ecole.fr'
    expect(decouperLiens(t)).toEqual([texte(t)])
  })
  it('ignore les points ordinaires et les majuscules', () => {
    for (const t of ['Payez 1,99 € avant 18 h. Merci M. Durand.', 'Ok.Je pars', 'n°FR4471 · 3e A']) {
      expect(decouperLiens(t), t).toEqual([texte(t)])
    }
  })
  it('texte vide', () => expect(decouperLiens('')).toEqual([]))
})

describe('decouperUrl', () => {
  it('sépare domaine et chemin, et repère le http', () => {
    expect(decouperUrl('http://gare-wifi.com/connexion')).toEqual({ nonSecurise: true, domaine: 'gare-wifi.com', reste: '/connexion' })
    expect(decouperUrl('https://gare-libre-wifi.com')).toEqual({ nonSecurise: false, domaine: 'gare-libre-wifi.com', reste: '' })
    expect(decouperUrl('colis-xp.net/payer?id=4')).toEqual({ nonSecurise: false, domaine: 'colis-xp.net', reste: '/payer?id=4' })
  })
})

describe('avatar', () => {
  it('initiales des deux premiers mots qui commencent par une lettre', () => {
    expect(initiales('Mon Collège')).toBe('MC')
    expect(initiales('Inès')).toBe('IN')
    expect(initiales('Tom (3e A)')).toBe('TA')
    expect(initiales('drole_de_college_42')).toBe('DD')
  })
  it('aucune initiale pour un numéro de téléphone', () => expect(initiales('+33 6 39 98 12 48')).toBe(''))
  it('teinte stable entre 0 et 359', () => {
    expect(teinte('Léa')).toBe(teinte('Léa'))
    expect(teinte('Léa')).toBeGreaterThanOrEqual(0)
    expect(teinte('Léa')).toBeLessThan(360)
  })
})

describe('gestes', () => {
  it('chaque geste a une icône et une bannière', () => {
    for (const g of GESTES) {
      expect(GESTES_TELEPHONE[g].icone, g).toBeTruthy()
      expect(GESTES_TELEPHONE[g].banniere, g).not.toBe('')
    }
  })
  it('le choix « aide » demande de l’aide par défaut', () => {
    expect(gesteDuChoix({ qualite: 'aide' })).toBe('demander-aide')
    expect(gesteDuChoix({ qualite: 'bon', geste: 'bloquer' })).toBe('bloquer')
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `dx npx vitest run tests/unit/telephone-outils.test.ts`
Expected: FAIL (modules introuvables).

- [ ] **Step 3: Implémenter**

`src/engine/ordre.ts` ligne 2 : `function empreinte` devient `export function empreinte`.

`src/phone/liens.ts` :
```ts
export type Morceau = { type: 'texte' | 'lien'; texte: string }

// Domaine en minuscules avec au moins un point, chemin éventuel. Pas précédé de @ ni d'un caractère de mot,
// pas suivi de @ : les adresses mail et les « M. Durand. » ne sont pas des liens.
const LIEN = /(?<![\w@./-])(?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}(?![\w@-])(?:\/[^\s«»"]*)?/gu

/** Découpe un message en morceaux de texte et liens (affichés soulignés, jamais cliquables). */
export function decouperLiens(texte: string): Morceau[] {
  const morceaux: Morceau[] = []
  let curseur = 0
  for (const m of texte.matchAll(LIEN)) {
    const lien = m[0].replace(/[.,;:!?)]+$/u, '')
    if (m.index > curseur) morceaux.push({ type: 'texte', texte: texte.slice(curseur, m.index) })
    morceaux.push({ type: 'lien', texte: lien })
    curseur = m.index + lien.length
  }
  if (curseur < texte.length) morceaux.push({ type: 'texte', texte: texte.slice(curseur) })
  return morceaux
}

/** Barre d'adresse : domaine mis en avant, reste atténué ; seul le http est signalé. */
export function decouperUrl(url: string) {
  const sansSchema = url.replace(/^https?:\/\//, '')
  const i = sansSchema.search(/[/?#]/)
  return {
    nonSecurise: url.startsWith('http://'),
    domaine: i < 0 ? sansSchema : sansSchema.slice(0, i),
    reste: i < 0 ? '' : sansSchema.slice(i),
  }
}
```

`src/phone/avatar.ts` :
```ts
import { empreinte } from '@/engine/ordre'

/** Initiales des deux premiers mots qui commencent par une lettre ; vide pour un numéro. */
export function initiales(nom: string): string {
  const mots = nom.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter((m) => /^\p{L}/u.test(m))
  if (mots.length === 0) return ''
  if (mots.length === 1) return [...mots[0]!].slice(0, 2).join('').toUpperCase()
  return ([...mots[0]!][0]! + [...mots[1]!][0]!).toUpperCase()
}

/** Teinte stable d'un nom, pour la couleur de son avatar. */
export const teinte = (nom: string): number => empreinte(nom) % 360
```

`src/phone/gestes.ts` (si une icône n'existe pas dans la version installée, prendre la plus proche : `dx ls node_modules/@lucide/vue/dist/esm/icons | grep <nom>`) :
```ts
import {
  Ban, CreditCard, Download, EyeOff, Flag, HandHelping, Link, LogIn, PackagePlus, Reply, SearchCheck, Share2, Trash2,
} from '@lucide/vue'
import type { Component } from 'vue'
import type { Geste, Qualite } from '@/content/schema'

/** Icône et bannière de chaque geste. Formulations neutres : le débrief dit si c'était un bon choix. */
export const GESTES_TELEPHONE: Record<Geste, { icone: Component; banniere: string }> = {
  repondre: { icone: Reply, banniere: 'Message envoyé' },
  'ouvrir-lien': { icone: Link, banniere: 'Lien ouvert' },
  'se-connecter': { icone: LogIn, banniere: 'Connexion en cours…' },
  telecharger: { icone: Download, banniere: 'Téléchargement lancé' },
  installer: { icone: PackagePlus, banniere: 'Installation lancée' },
  payer: { icone: CreditCard, banniere: 'Paiement envoyé' },
  partager: { icone: Share2, banniere: 'Publication partagée' },
  verifier: { icone: SearchCheck, banniere: 'Tu vérifies par un autre moyen' },
  bloquer: { icone: Ban, banniere: 'Contact bloqué' },
  signaler: { icone: Flag, banniere: 'Signalement envoyé' },
  ignorer: { icone: EyeOff, banniere: 'Message ignoré' },
  supprimer: { icone: Trash2, banniere: 'Message supprimé' },
  'demander-aide': { icone: HandHelping, banniere: 'Tu poses ton téléphone pour demander de l’aide' },
}

/** Le schéma impose un geste à chaque choix sauf « aide », qui demande de l'aide par défaut. */
export const gesteDuChoix = (c: { geste?: Geste; qualite: Qualite }): Geste => c.geste ?? 'demander-aide'
```
(`Qualite` est le type déjà exporté par `schema.ts` et utilisé par `ChoixList.vue`.)

- [ ] **Step 4: Vérifier**

Run: `dx npx vitest run tests/unit/telephone-outils.test.ts tests/unit/node/ordre.test.ts && dx npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/phone/liens.ts src/phone/avatar.ts src/phone/gestes.ts src/engine/ordre.ts tests/unit/telephone-outils.test.ts
git commit -m "feat(phone): add link, avatar and gesture helpers"
```

---

### Task 3: Migration du contenu et geste obligatoire

Tâche de contenu : à confier à un sous-agent (Opus) avec ce bloc comme contrat ; l'orchestrateur relit le diff fichier par fichier.

**Files:**
- Modify: `src/content/schema.ts` (`scenarioSchema.superRefine`)
- Modify: `tests/unit/fixtures.ts` (`rawScenario` : gestes)
- Modify: les 21 fichiers `content/missions/*/*.yaml` **sauf** `*-parcours.yaml`
- Test: `tests/unit/ecran-schema.test.ts`

**Interfaces:**
- Consumes : schéma de la tâche 1, `textesEcran` (tests de contenu).
- Produces : contenu où chaque choix non `aide` a un `geste` (et une `reponse` si `repondre`).

- [ ] **Step 1: Test du geste obligatoire**

Ajouter dans `tests/unit/ecran-schema.test.ts` :
```ts
describe('gestes des choix', () => {
  it('chaque choix sauf « aide » a un geste', () => {
    const s = rawScenario()
    const sansGeste = { ...s, choix: s.choix.map((c) => (c.id === 'verif' ? { ...c, geste: undefined } : c)) }
    expect(erreurs(scenarioSchema.safeParse(sansGeste))).toEqual([
      'choix.1.geste : il faut un geste (ce que le téléphone montre quand on choisit)',
    ])
  })
})
```
Dans `tests/unit/fixtures.ts`, `rawScenario` : ajouter `geste: 'ouvrir-lien'` au choix `clic` et `geste: 'verifier'` au choix `verif`.

- [ ] **Step 2: Vérifier l'échec**

Run: `dx npx vitest run tests/unit/ecran-schema.test.ts`
Expected: FAIL sur « chaque choix sauf aide a un geste ».

- [ ] **Step 3: Règle dans le schéma**

Dans le `superRefine` de `scenarioSchema`, après `verifierChoix(s, ctx)` :
```ts
s.choix.forEach((c, i) => {
  if (!c.geste && c.qualite !== 'aide') {
    ctx.addIssue({ code: 'custom', path: ['choix', i, 'geste'], message: 'il faut un geste (ce que le téléphone montre quand on choisit)' })
  }
})
```
Run: `dx npx vitest run tests/unit/ecran-schema.test.ts` : PASS. Les tests de contenu échouent désormais (gestes manquants) : c'est l'oracle de l'étape suivante.

- [ ] **Step 4: Migrer les 21 missions**

Règles (ne jamais changer le sens ni la formulation d'un texte ; seulement déplacer vers des champs structurés et ajouter les gestes) :
1. **Gestes** : chaque choix `bon` ou `risque` reçoit le `geste` qui décrit ce que l'élève fait dans le téléphone (`ouvrir-lien`, `se-connecter`, `payer`, `partager`, `telecharger`, `installer`, `bloquer`, `signaler`, `ignorer`, `supprimer`, `verifier` pour toute vérification hors de l'appli, `repondre` s'il écrit au contact). Le choix `aide` n'a pas de geste.
2. **Réponses** : un geste `repondre` exige `reponse`, le message réellement envoyé (court, à la première personne, ton d'ado, pas la pensée du choix) ; `reponseSimple` en 6e si la réponse dépasse 10 mots.
3. **Mail** : `contact: 'Nom <adresse>'` devient `contact: 'Nom'` et `adresse: 'adresse'`.
4. **Social** : un `contact` du type `'Nom · 2 400 abonnés · bio : Parodie…'` devient `contact`, `abonnes: '2 400'`, `bio`. Une description entre crochets dans un texte (« [Vidéo de 5 secondes : …] ») devient `media.description` (et `media.descriptionSimple` depuis `texteSimple`), retirée du texte. Des compteurs écrits dans le texte (« 1 200 vues · 87 partages ») deviennent `stats` (nombres seuls). Les crochets dans les écrans `chat` restent tels quels.
5. **Heures** : ajouter une `heure` plausible (HH:MM, croissante) aux messages `sms`, `chat` et `mail`.
6. Les fichiers `*-parcours.yaml` ne sont pas touchés.

Oracle : `dx npx vitest run tests/unit/node && dx npm run build` (exit 0). Si le test des citations échoue, la citation doit rester verbatim dans le champ où elle a été déplacée.

- [ ] **Step 5: Vérification complète**

Run: `dx npm run lint && dx npm run typecheck && dx npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/content/schema.ts tests/unit/fixtures.ts tests/unit/ecran-schema.test.ts content/missions
git commit -m "content(phone): structured screen fields and a gesture on every choice"
```

---

### Task 4: Coque du téléphone, briques et conversation

**Files:**
- Create: `src/phone/Telephone.vue`, `src/phone/theme.css`, `src/phone/types.ts`
- Create: `src/phone/parts/BarreEtat.vue`, `EnteteApp.vue`, `Avatar.vue`, `Bulle.vue`, `TexteRiche.vue`, `ApercuLien.vue`
- Create: `src/phone/apps/ConversationApp.vue`
- Test: `tests/unit/telephone.test.ts`

**Interfaces:**
- Consumes : `Ecran`, `Message` (tâche 1), `decouperLiens`, `initiales`, `teinte` (tâche 2), `useTexte` (`@/ui/useTexte`).
- Produces :
  - `src/phone/types.ts` : `export type EcranTelephone = Ecran | { app: 'verrouillage'; notifications: Fil['notifications'] }`
  - `Telephone.vue` props (complétées en tâches 6 et 7) : `ecran: EcranTelephone`
  - `Bulle.vue` props : `{ message: Message; nom: string }`

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/unit/telephone.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Ecran } from '@/content/schema'
import Telephone from '@/phone/Telephone.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const sms = (surcharge: Partial<Ecran> = {}) =>
  ({
    app: 'sms',
    appNom: 'Messages',
    contact: 'Colis Express',
    messages: [
      { de: 'contact', texte: 'Payez 1,99 € sur colis-xp.net', texteSimple: 'Paie 1,99 €', heure: '09:12', apercu: { titre: 'Suivi de colis', domaine: 'colis-xp.net' } },
      { de: 'moi', texte: 'C’est quoi ?', heure: '09:14' },
    ],
    ...surcharge,
  }) as Ecran

describe('Telephone : coque', () => {
  it('figure nommée, appli repérée, zone défilante atteignable au clavier', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    const figure = w.find('figure')
    expect(figure.attributes('aria-label')).toBe('Écran de téléphone : Messages')
    expect(figure.attributes('data-app')).toBe('sms')
    const zone = w.find('.ecran')
    expect(zone.attributes('tabindex')).toBe('0')
    expect(zone.attributes('role')).toBe('region')
    expect(zone.attributes('aria-label')).toBe('Contenu de l’écran : Messages')
  })

  it('barre d’état décorative à l’heure du dernier message, 14:32 sinon', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    expect(w.find('.barre-etat').attributes('aria-hidden')).toBe('true')
    expect(w.find('.barre-etat').text()).toContain('09:14')
    const sansHeure = sms({ messages: [{ de: 'contact', texte: 'Salut' }] })
    expect(mount(Telephone, { props: { ecran: sansHeure } }).find('.barre-etat').text()).toContain('14:32')
  })

  it('en-tête : contact, nom de l’appli, avatar décoratif (icône pour un numéro)', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    expect(w.find('.entete-app').text()).toContain('Colis Express')
    expect(w.find('.entete-app').text()).toContain('Messages')
    expect(w.find('.avatar').attributes('aria-hidden')).toBe('true')
    expect(w.find('.avatar').text()).toBe('CE')
    const numero = mount(Telephone, { props: { ecran: sms({ contact: '+33 6 39 98 12 48' }) } })
    expect(numero.find('.avatar').text()).toBe('')
    expect(numero.find('.avatar svg').exists()).toBe(true)
  })
})

describe('Telephone : conversation', () => {
  it('bulles avec qui parle, heure, lien repéré et aperçu', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    const bulles = w.findAll('.conversation > li')
    expect(bulles).toHaveLength(2)
    expect(bulles[0]!.text()).toContain('Colis Express :')
    expect(bulles[0]!.find('.lien').text()).toContain('colis-xp.net')
    expect(bulles[0]!.find('.lien .visually-hidden').text()).toBe('lien :')
    expect(bulles[0]!.find('.apercu').text()).toContain('Suivi de colis')
    expect(bulles[0]!.find('.heure').text()).toContain('09:12')
    expect(bulles[1]!.text()).toContain('Toi :')
    expect(bulles[1]!.find('.bulle').classes()).toContain('moi')
  })

  it('chat : même conversation, thème de l’appli', () => {
    const w = mount(Telephone, { props: { ecran: sms({ app: 'chat', appNom: 'ChatCord' }) } })
    expect(w.find('figure').attributes('data-app')).toBe('chat')
    expect(w.findAll('.conversation > li')).toHaveLength(2)
  })

  it('lecture simplifiée', () => {
    store.modifierReglages({ lectureSimple: true })
    const w = mount(Telephone, { props: { ecran: sms() } })
    expect(w.findAll('.conversation > li')[0]!.text()).toContain('Paie 1,99 €')
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `dx npx vitest run tests/unit/telephone.test.ts`
Expected: FAIL (`@/phone/Telephone.vue` introuvable).

- [ ] **Step 3: Implémenter les briques**

`src/phone/types.ts` :
```ts
import type { Ecran, Fil } from '@/content/schema'

/** Ce que le téléphone sait afficher : l'écran d'un scénario ou l'écran verrouillé d'un fil. */
export type EcranTelephone = Ecran | { app: 'verrouillage'; notifications: Fil['notifications'] }
```

`src/phone/theme.css` :
```css
/* Variables du faux téléphone, par appli. Aplats opaques ; texte d'au moins 4.5:1 sur son fond. */
.telephone {
  --tel-coque: #1b1b2f;
  --tel-fond: #ffffff;
  --tel-texte: #1b1b2f;
  --tel-doux: #55556a;
  --tel-bord: #d9d9e3;
  --tel-accent: #2f5bd3;
  --tel-accent-texte: #ffffff;
  --tel-recu: #ececf1;
  --tel-envoye: #2f5bd3;
  --tel-envoye-texte: #ffffff;
  --tel-lien: #1d4ed8;
}
.telephone[data-app='sms'] { --tel-accent: #1f7a3a; --tel-envoye: #1f7a3a; }
.telephone[data-app='chat'] { --tel-fond: #f3f2fb; --tel-recu: #ffffff; --tel-accent: #5a3fc0; --tel-envoye: #5a3fc0; }
.telephone[data-app='social'] { --tel-accent: #b0174f; }
.telephone[data-app='mail'] { --tel-accent: #1d4ed8; }
.telephone[data-app='web'] { --tel-accent: #3b3b4f; }
.telephone[data-app='verrouillage'] { --tel-fond: #23214a; --tel-texte: #ffffff; --tel-doux: #d6d4f0; --tel-recu: #34316a; }
```

`src/phone/parts/BarreEtat.vue` :
```vue
<script setup lang="ts">
import { BatteryMedium, Signal, Wifi } from '@lucide/vue'

defineProps<{ heure: string }>()
</script>

<template>
  <div class="barre-etat" aria-hidden="true">
    <span>{{ heure }}</span>
    <span class="icones"><Signal :size="14" /><Wifi :size="14" /><BatteryMedium :size="16" /></span>
  </div>
</template>

<style scoped>
.barre-etat { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 1rem; font-size: 0.8em; font-weight: 700; background: var(--tel-coque); color: #fff; }
.icones { display: inline-flex; gap: 0.3rem; }
</style>
```

`src/phone/parts/Avatar.vue` :
```vue
<script setup lang="ts">
import { User } from '@lucide/vue'
import { computed } from 'vue'
import { initiales, teinte } from '../avatar'

const props = defineProps<{ nom: string }>()
const lettres = computed(() => initiales(props.nom))
</script>

<template>
  <span class="avatar" aria-hidden="true" :style="{ background: `hsl(${teinte(nom)} 45% 30%)` }">
    <template v-if="lettres">{{ lettres }}</template>
    <User v-else :size="18" />
  </span>
</template>

<style scoped>
.avatar { flex: none; display: inline-grid; place-items: center; width: 2.2em; height: 2.2em; border-radius: 50%; color: #fff; font-size: 0.85em; font-weight: 700; }
</style>
```

`src/phone/parts/EnteteApp.vue` :
```vue
<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import Avatar from './Avatar.vue'

defineProps<{ titre: string; sousTitre?: string; avatar?: boolean }>()
</script>

<template>
  <div class="entete-app">
    <ChevronLeft aria-hidden="true" :size="20" />
    <Avatar v-if="avatar" :nom="titre" />
    <p class="titres">
      <strong>{{ titre }}</strong>
      <span v-if="sousTitre" class="sous-titre">{{ sousTitre }}</span>
    </p>
  </div>
</template>

<style scoped>
.entete-app { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--tel-bord); background: var(--tel-fond); color: var(--tel-texte); }
.titres { display: flex; flex-direction: column; margin: 0; min-width: 0; overflow-wrap: anywhere; }
.sous-titre { font-size: 0.8em; color: var(--tel-doux); }
</style>
```

`src/phone/parts/TexteRiche.vue` :
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { decouperLiens } from '../liens'

const props = defineProps<{ texte: string }>()
const morceaux = computed(() => decouperLiens(props.texte))
</script>

<template>
  <template v-for="(m, i) in morceaux" :key="i">
    <span v-if="m.type === 'lien'" class="lien"><span class="visually-hidden">lien : </span>{{ m.texte }}</span>
    <template v-else>{{ m.texte }}</template>
  </template>
</template>

<style scoped>
.lien { color: var(--tel-lien); text-decoration: underline; overflow-wrap: anywhere; }
</style>
```

`src/phone/parts/ApercuLien.vue` :
```vue
<script setup lang="ts">
defineProps<{ apercu: { titre: string; domaine: string } }>()
</script>

<template>
  <p class="apercu">
    <span class="visually-hidden">Aperçu du lien : </span>
    <strong>{{ apercu.titre }}</strong>
    <span class="domaine">{{ apercu.domaine }}</span>
  </p>
</template>

<style scoped>
.apercu { display: flex; flex-direction: column; margin: 0.4rem 0 0; padding: 0.4rem 0.6rem; border-radius: 10px; background: var(--tel-fond); color: var(--tel-texte); overflow-wrap: anywhere; }
.domaine { font-size: 0.8em; color: var(--tel-doux); }
</style>
```

`src/phone/parts/Bulle.vue` :
```vue
<script setup lang="ts">
import type { Message } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import ApercuLien from './ApercuLien.vue'
import TexteRiche from './TexteRiche.vue'

defineProps<{ message: Message; nom: string }>()
const t = useTexte()
</script>

<template>
  <div class="bulle" :class="message.de">
    <p class="texte">
      <span class="visually-hidden">{{ message.de === 'moi' ? 'Toi' : nom }} : </span>
      <TexteRiche :texte="t(message.texte, message.texteSimple)" />
    </p>
    <ApercuLien v-if="message.apercu" :apercu="message.apercu" />
    <p v-if="message.heure" class="heure"><span class="visually-hidden">à </span>{{ message.heure }}</p>
  </div>
</template>

<style scoped>
.bulle { max-width: 85%; padding: 0.5rem 0.75rem; border-radius: 18px; overflow-wrap: anywhere; }
.bulle.contact { align-self: flex-start; background: var(--tel-recu); color: var(--tel-texte); border-bottom-left-radius: 4px; }
.bulle.moi { align-self: flex-end; background: var(--tel-envoye); color: var(--tel-envoye-texte); border-bottom-right-radius: 4px; }
.bulle.moi :deep(.lien) { color: inherit; }
.texte { margin: 0; }
.heure { margin: 0.2rem 0 0; font-size: 0.75em; text-align: right; opacity: 0.85; }
</style>
```

`src/phone/apps/ConversationApp.vue` :
```vue
<script setup lang="ts">
import type { Ecran } from '@/content/schema'
import Bulle from '../parts/Bulle.vue'

defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }> }>()
</script>

<template>
  <ol class="conversation">
    <li v-for="(m, i) in ecran.messages" :key="i" :class="m.de"><Bulle :message="m" :nom="ecran.contact" /></li>
  </ol>
</template>

<style scoped>
.conversation { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.conversation > li { display: flex; flex-direction: column; }
</style>
```

- [ ] **Step 4: Implémenter la coque**

`src/phone/Telephone.vue` (les autres applis arrivent en tâche 5, les choix en tâche 6, l'écran verrouillé en tâche 7) :
```vue
<script setup lang="ts">
import { computed } from 'vue'
import ConversationApp from './apps/ConversationApp.vue'
import BarreEtat from './parts/BarreEtat.vue'
import EnteteApp from './parts/EnteteApp.vue'
import type { EcranTelephone } from './types'
import './theme.css'

const props = defineProps<{ ecran: EcranTelephone }>()

const nomApp = computed(() => (props.ecran.app === 'verrouillage' ? 'écran verrouillé' : props.ecran.appNom))
const heure = computed(() => {
  const heures = props.ecran.app === 'verrouillage' ? props.ecran.notifications.map((n) => n.heure) : props.ecran.messages.map((m) => m.heure)
  return heures.filter(Boolean).at(-1) ?? '14:32'
})
/** En-tête : la conversation porte le nom du contact ; le web a sa barre d'adresse ; l'écran verrouillé n'en a pas. */
const entete = computed(() => {
  const e = props.ecran
  if (e.app === 'sms' || e.app === 'chat') return { titre: e.contact, sousTitre: e.appNom, avatar: true }
  if (e.app === 'social' || e.app === 'mail') return { titre: e.appNom, avatar: false }
  return null
})
</script>

<template>
  <figure class="telephone" :data-app="ecran.app" :aria-label="`Écran de téléphone : ${nomApp}`">
    <BarreEtat :heure="heure" />
    <EnteteApp v-if="entete" v-bind="entete" />
    <!-- Zone défilante (grands textes, mode classe) : focusable pour défiler au clavier. -->
    <div class="ecran" tabindex="0" role="region" :aria-label="`Contenu de l’écran : ${nomApp}`">
      <ConversationApp v-if="ecran.app === 'sms' || ecran.app === 'chat'" :ecran="ecran" />
    </div>
  </figure>
</template>

<style scoped>
.telephone {
  margin: 0; width: min(100%, 24rem); display: flex; flex-direction: column;
  border: 10px solid var(--tel-coque); border-radius: 32px; overflow: hidden;
  background: var(--tel-fond); color: var(--tel-texte);
}
:root[data-taille='tres-grand'] .telephone { width: min(100%, 28rem); }
.ecran { padding: 0.75rem; max-height: 28em; overflow-y: auto; background: var(--tel-fond); }
</style>
```

- [ ] **Step 5: Vérifier**

Run: `dx npx vitest run tests/unit/telephone.test.ts && dx npm run lint && dx npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/phone tests/unit/telephone.test.ts
git commit -m "feat(phone): add the phone shell, shared parts and conversation app"
```

---

### Task 5: Applis mail, web et social ; le jeu passe au nouveau téléphone

**Files:**
- Create: `src/phone/apps/MailApp.vue`, `WebApp.vue`, `SocialApp.vue`
- Modify: `src/phone/Telephone.vue` (aiguillage)
- Modify: `src/mission/ScenarioStep.vue:5,55` (import et usage)
- Delete: `src/phone/EcranTelephone.vue`, `PhoneFrame.vue`, `ThreadScreen.vue`, `MailScreen.vue`, `WebScreen.vue`, `tests/unit/phone.test.ts`
- Test: `tests/unit/telephone.test.ts`

**Interfaces:**
- Consumes : `TexteRiche`, `Avatar`, `useTexte`, `decouperUrl`, `texteStats`.
- Produces : chaque appli prend une prop `ecran` réduite à sa forme (`Extract<Ecran, { app: 'mail' }>`, etc.).

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à `tests/unit/telephone.test.ts` :
```ts
const messages = [{ de: 'contact' as const, texte: 'Votre mot de passe expire.', heure: '07:58' }]

describe('Telephone : mail', () => {
  const mail = { app: 'mail', appNom: 'Mail', contact: 'Mon Collège', adresse: 'support@moncollege-ent.net', sujet: 'Mot de passe', pieceJointe: { nom: 'procedure.pdf' }, messages } as Ecran
  it('objet, expéditeur avec sa vraie adresse, heure, pièce jointe', () => {
    const w = mount(Telephone, { props: { ecran: mail } })
    expect(w.find('.sujet').text()).toContain('Mot de passe')
    expect(w.find('.expediteur').text()).toContain('De :')
    expect(w.find('.expediteur').text()).toContain('Mon Collège')
    expect(w.find('.adresse').text()).toBe('support@moncollege-ent.net')
    expect(w.find('.expediteur').text()).toContain('07:58')
    expect(w.find('.piece-jointe').text()).toContain('Pièce jointe :')
    expect(w.find('.piece-jointe').text()).toContain('procedure.pdf')
    expect(w.find('.entete-app').text()).toContain('Mail')
  })
})

describe('Telephone : web', () => {
  const web = (url?: string) => ({ app: 'web', appNom: 'Navigateur', contact: 'Wi-Fi Gare Libre', url, messages }) as Ecran
  it('barre d’adresse : domaine mis en avant, jamais de cadenas', () => {
    const w = mount(Telephone, { props: { ecran: web('https://gare-libre-wifi.com/connexion') } })
    expect(w.find('.domaine').text()).toBe('gare-libre-wifi.com')
    expect(w.find('.reste').text()).toBe('/connexion')
    expect(w.text()).not.toContain('Non sécurisé')
    expect(w.find('.titre-page').text()).toBe('Wi-Fi Gare Libre')
    expect(w.find('.entete-app').exists()).toBe(false)
  })
  it('« Non sécurisé » pour une adresse http', () => {
    expect(mount(Telephone, { props: { ecran: web('http://gare-wifi.com') } }).find('.non-securise').text()).toContain('Non sécurisé')
  })
  it('sans adresse : écran d’appli, pas de barre', () => {
    expect(mount(Telephone, { props: { ecran: web() } }).find('.barre-adresse').exists()).toBe(false)
  })
})

describe('Telephone : social', () => {
  const social = {
    app: 'social', appNom: 'StreamTube', contact: 'drole_de_college_42', messages, certifie: true, abonnes: '2 400', bio: 'Parodie',
    media: { description: 'Vidéo de 5 secondes : M. Durand crie.', descriptionSimple: 'Une vidéo de 5 secondes.' },
    stats: { vues: '1 200', partages: '87' }, commentaires: [{ de: 'lea_42', texte: 'Trop drôle' }],
  } as Ecran
  it('compte, publication, média décrit, compteurs, commentaires', () => {
    const w = mount(Telephone, { props: { ecran: social } })
    expect(w.find('.compte').text()).toContain('drole_de_college_42')
    expect(w.find('.compte').text()).toContain('(compte certifié)')
    expect(w.find('.compte').text()).toContain('2 400 abonnés')
    expect(w.find('.compte').text()).toContain('Parodie')
    expect(w.find('.media').text()).toContain('Vidéo de 5 secondes : M. Durand crie.')
    expect(w.find('.stats').text()).toBe('1 200 vues · 87 partages')
    expect(w.find('.commentaires').text()).toContain('lea_42')
    expect(w.find('.commentaires').text()).toContain('Trop drôle')
  })
  it('média en lecture simplifiée', () => {
    store.modifierReglages({ lectureSimple: true })
    expect(mount(Telephone, { props: { ecran: social } }).find('.media').text()).toContain('Une vidéo de 5 secondes.')
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `dx npx vitest run tests/unit/telephone.test.ts`
Expected: FAIL sur les blocs mail, web et social.

- [ ] **Step 3: Implémenter les applis**

`src/phone/apps/MailApp.vue` :
```vue
<script setup lang="ts">
import { Paperclip } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import Avatar from '../parts/Avatar.vue'
import TexteRiche from '../parts/TexteRiche.vue'

defineProps<{ ecran: Extract<Ecran, { app: 'mail' }> }>()
const t = useTexte()
</script>

<template>
  <div class="mail">
    <p v-if="ecran.sujet" class="sujet"><span class="visually-hidden">Objet : </span>{{ ecran.sujet }}</p>
    <div class="expediteur">
      <Avatar :nom="ecran.contact" />
      <p class="identite">
        <span><span class="visually-hidden">De : </span><strong>{{ ecran.contact }}</strong></span>
        <span v-if="ecran.adresse" class="adresse">{{ ecran.adresse }}</span>
      </p>
      <span v-if="ecran.messages[0]?.heure" class="heure">{{ ecran.messages[0].heure }}</span>
    </div>
    <p v-for="(m, i) in ecran.messages" :key="i" class="corps"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
    <p v-if="ecran.pieceJointe" class="piece-jointe">
      <Paperclip aria-hidden="true" :size="16" />
      <span class="visually-hidden">Pièce jointe : </span>{{ ecran.pieceJointe.nom }}
    </p>
  </div>
</template>

<style scoped>
.sujet { margin: 0 0 0.75rem; font-size: 1.15em; font-weight: 700; overflow-wrap: anywhere; }
.expediteur { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.identite { display: flex; flex-direction: column; margin: 0; min-width: 0; flex: 1; overflow-wrap: anywhere; }
.adresse, .heure { font-size: 0.8em; color: var(--tel-doux); }
.corps { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
.piece-jointe { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.7rem; border: 1px solid var(--tel-bord); border-radius: 10px; overflow-wrap: anywhere; }
</style>
```

`src/phone/apps/WebApp.vue` :
```vue
<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import { decouperUrl } from '../liens'
import TexteRiche from '../parts/TexteRiche.vue'

const props = defineProps<{ ecran: Extract<Ecran, { app: 'web' }> }>()
const t = useTexte()
const adresse = computed(() => (props.ecran.url ? decouperUrl(props.ecran.url) : null))
</script>

<template>
  <div class="web">
    <p v-if="adresse" class="barre-adresse">
      <span v-if="adresse.nonSecurise" class="non-securise"><TriangleAlert aria-hidden="true" :size="14" /> Non sécurisé</span>
      <span class="visually-hidden">Adresse du site : </span>
      <span class="url"><span class="domaine">{{ adresse.domaine }}</span><span class="reste">{{ adresse.reste }}</span></span>
    </p>
    <p class="titre-page">{{ ecran.contact }}</p>
    <p v-for="(m, i) in ecran.messages" :key="i" class="bloc"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
  </div>
</template>

<style scoped>
.barre-adresse { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4em; margin: 0 0 0.75rem; padding: 0.35rem 0.7rem; border-radius: 999px; background: var(--tel-recu); font-size: 0.9em; }
.non-securise { display: inline-flex; align-items: center; gap: 0.2em; font-weight: 700; color: #a3200f; }
.url { overflow-wrap: anywhere; }
.domaine { font-weight: 700; }
.reste { color: var(--tel-doux); }
.titre-page { margin: 0 0 0.5rem; font-size: 1.15em; font-weight: 700; }
.bloc { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
</style>
```

`src/phone/apps/SocialApp.vue` :
```vue
<script setup lang="ts">
import { BadgeCheck, Image } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import Avatar from '../parts/Avatar.vue'
import TexteRiche from '../parts/TexteRiche.vue'
import { texteStats } from '../stats'

defineProps<{ ecran: Extract<Ecran, { app: 'social' }> }>()
const t = useTexte()
</script>

<template>
  <article class="publication">
    <div class="compte">
      <Avatar :nom="ecran.contact" />
      <p class="identite">
        <span>
          <strong>{{ ecran.contact }}</strong>
          <span v-if="ecran.certifie" class="certifie"><BadgeCheck aria-hidden="true" :size="16" /><span class="visually-hidden"> (compte certifié)</span></span>
        </span>
        <span v-if="ecran.abonnes" class="doux">{{ ecran.abonnes }} abonnés</span>
        <span v-if="ecran.bio" class="doux">{{ ecran.bio }}</span>
      </p>
    </div>
    <p v-for="(m, i) in ecran.messages" :key="i" class="texte"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
    <p v-if="ecran.media" class="media">
      <Image aria-hidden="true" :size="20" />
      <span>{{ t(ecran.media.description, ecran.media.descriptionSimple) }}</span>
    </p>
    <p v-if="ecran.stats" class="stats">{{ texteStats(ecran.stats) }}</p>
    <template v-if="ecran.commentaires">
      <p class="visually-hidden">Commentaires</p>
      <ol class="commentaires">
        <li v-for="(c, i) in ecran.commentaires" :key="i"><strong>{{ c.de }}</strong> <TexteRiche :texte="t(c.texte, c.texteSimple)" /></li>
      </ol>
    </template>
  </article>
</template>

<style scoped>
.compte { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.6rem; }
.identite { display: flex; flex-direction: column; margin: 0; min-width: 0; overflow-wrap: anywhere; }
.certifie { color: var(--tel-accent); vertical-align: middle; }
.doux, .stats { font-size: 0.85em; color: var(--tel-doux); }
.texte { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
.media { display: flex; gap: 0.5rem; align-items: center; margin: 0 0 0.6rem; padding: 1.25rem 0.75rem; border-radius: 12px; background: var(--tel-recu); font-style: italic; }
.commentaires { list-style: none; margin: 0.5rem 0 0; padding: 0.5rem 0 0; border-top: 1px solid var(--tel-bord); display: flex; flex-direction: column; gap: 0.4rem; overflow-wrap: anywhere; }
</style>
```
(Si `Image` entre en conflit de nom avec le constructeur global dans le lint, importer `ImageIcon` ou `Image as IconeImage`.)

Dans `src/phone/Telephone.vue`, importer les trois applis et compléter l'aiguillage :
```vue
<ConversationApp v-if="ecran.app === 'sms' || ecran.app === 'chat'" :ecran="ecran" />
<SocialApp v-else-if="ecran.app === 'social'" :ecran="ecran" />
<MailApp v-else-if="ecran.app === 'mail'" :ecran="ecran" />
<WebApp v-else-if="ecran.app === 'web'" :ecran="ecran" />
```

- [ ] **Step 4: Brancher le jeu et supprimer l'ancien téléphone**

`src/mission/ScenarioStep.vue` : remplacer `import EcranTelephone from '@/phone/EcranTelephone.vue'` par `import Telephone from '@/phone/Telephone.vue'`, et `<EcranTelephone :ecran="scenario.ecran" />` par `<Telephone :ecran="scenario.ecran" />`. Dans la grille, `grid-template-columns: minmax(0, 22rem)` devient `minmax(0, auto)` pour laisser la largeur au téléphone.

```bash
git rm src/phone/EcranTelephone.vue src/phone/PhoneFrame.vue src/phone/ThreadScreen.vue src/phone/MailScreen.vue src/phone/WebScreen.vue tests/unit/phone.test.ts
```

- [ ] **Step 5: Vérifier**

Run: `dx npm run lint && dx npm run typecheck && dx npx vitest run`
Expected: PASS (dont `scenario-step.test.ts`, inchangé à ce stade).

- [ ] **Step 6: Commit**

```bash
git add -A src/phone src/mission/ScenarioStep.vue tests/unit
git commit -m "feat(phone): add mail, web and social apps and switch the game to them"
```

---

### Task 6: Les choix dans le téléphone

**Files:**
- Create: `src/phone/parts/ActionsApp.vue`, `src/phone/parts/BanniereSysteme.vue`
- Modify: `src/phone/Telephone.vue` (props `choix`, `mode`, `graine`, `choixJoue`, événement `choisir`, zone du choix joué)
- Modify: `src/mission/ScenarioStep.vue` (prop `choixId`, plus de `ChoixList` en situation, consignes par mode)
- Modify: `src/pages/MissionPage.vue:120-130` (passer `:choix-id`)
- Test: `tests/unit/telephone.test.ts`, `tests/unit/scenario-step.test.ts`

**Interfaces:**
- Consumes : `Choix`, `Geste`, `GESTES_TELEPHONE`, `gesteDuChoix`, `ordreAffichage`, `Mode`, `Bulle`.
- Produces : `Telephone` props `{ ecran: EcranTelephone; choix?: Choix[]; mode?: Mode; graine?: string; choixJoue?: string | null }`, emit `choisir: [choixId: string]` ; `ScenarioStep` prop `choixId?: string | null`.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à `tests/unit/telephone.test.ts` (imports complémentaires : `import type { Scenario } from '@/content/schema'`, `import { ordreAffichage } from '@/engine/ordre'`, `import { missionFixture } from './fixtures'`, `import { cliquer } from './helpers'`) :
```ts
describe('Telephone : choix', () => {
  const scenario = () => missionFixture().etapes[0] as Scenario
  const monter = (props: Record<string, unknown> = {}) => {
    const s = scenario()
    return mount(Telephone, { props: { ecran: s.ecran, choix: s.choix, graine: s.id, ...props } })
  }

  it('affiche les choix en bas de l’appli, dans l’ordre du scénario, et émet le choix', async () => {
    const s = scenario()
    const w = monter()
    expect(w.find('.actions-app').text()).toContain('Que fais-tu ?')
    expect(w.findAll('[data-choix]').map((b) => b.attributes('data-choix'))).toEqual(ordreAffichage(s.choix, s.id).map((c) => c.id))
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('choisir')).toEqual([['verif']])
  })

  it('classe : un clic sélectionne, l’adulte valide', async () => {
    const w = monter({ mode: 'classe' })
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('choisir')).toBeUndefined()
    expect(w.find('[data-choix="verif"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider le choix de la classe')
    expect(w.emitted('choisir')).toEqual([['verif']])
  })

  it('zone du choix joué présente dès le départ, vide', () => {
    const zone = monter().find('.choix-joue')
    expect(zone.attributes('role')).toBe('status')
    expect(zone.text()).toBe('')
  })

  it('un geste se joue en bannière neutre, et les actions disparaissent', async () => {
    const w = monter({ choixJoue: null })
    await w.setProps({ choixJoue: 'clic' })
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.find('.choix-joue').text()).toContain('Lien ouvert')
  })

  it('une réponse se joue en bulle « Toi »', async () => {
    const s = scenario()
    const choix = s.choix.map((c) => (c.id === 'verif' ? { ...c, geste: 'repondre' as const, reponse: 'C’est qui ?' } : c))
    const w = monter({ choix, choixJoue: 'verif' })
    expect(w.find('.choix-joue').text()).toContain('Toi :')
    expect(w.find('.choix-joue').text()).toContain('C’est qui ?')
  })

  it('le choix « aide » pose le téléphone', () => {
    expect(monter({ choixJoue: 'aide' }).find('.choix-joue').text()).toContain('Tu poses ton téléphone pour demander de l’aide')
  })

  it('« Rejouer » remet le téléphone en attente', async () => {
    const w = monter({ choixJoue: 'clic' })
    await w.setProps({ choixJoue: null })
    expect(w.find('.choix-joue').text()).toBe('')
    expect(w.findAll('[data-choix]')).toHaveLength(3)
  })
})
```
Dans `tests/unit/scenario-step.test.ts` :
- le test « binôme » attend désormais `'Discutez à deux, puis choisissez en bas du téléphone.'` ;
- ajouter :
```ts
it('après le choix, le téléphone joue le geste et le panneau passe à la suite', () => {
  const w = monter({ phase: 'indices', choixId: 'clic' })
  expect(w.find('.choix-joue').text()).toContain('Lien ouvert')
  expect(w.find('[data-choix]').exists()).toBe(false)
  expect(w.find('h2').text()).toBe('Qu’est-ce qui t’a décidé ?')
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `dx npx vitest run tests/unit/telephone.test.ts tests/unit/scenario-step.test.ts`
Expected: FAIL sur les nouveaux tests.

- [ ] **Step 3: Implémenter**

`src/phone/parts/BanniereSysteme.vue` :
```vue
<script setup lang="ts">
import type { Geste } from '@/content/schema'
import { GESTES_TELEPHONE } from '../gestes'

defineProps<{ geste: Geste }>()
</script>

<template>
  <p class="banniere">
    <component :is="GESTES_TELEPHONE[geste].icone" aria-hidden="true" :size="16" />
    {{ GESTES_TELEPHONE[geste].banniere }}
  </p>
</template>

<style scoped>
.banniere { display: flex; align-items: center; gap: 0.4rem; margin: 0.75rem auto 0; padding: 0.4rem 0.8rem; width: fit-content; max-width: 100%; border-radius: 999px; background: var(--tel-coque); color: #fff; font-size: 0.9em; animation: apparaitre 150ms ease-out; }
@keyframes apparaitre { from { opacity: 0; } to { opacity: 1; } }
</style>
```
(`base.css` coupe déjà toutes les animations avec `prefers-reduced-motion` et `data-animations='off'`.)

`src/phone/parts/ActionsApp.vue` :
```vue
<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Choix } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'
import { GESTES_TELEPHONE, gesteDuChoix } from '../gestes'

const props = defineProps<{ choix: Choix[]; graine: string; mode: Mode }>()
const emit = defineEmits<{ choisir: [choixId: string] }>()
const id = useId()
const selection = ref<string | null>(null)
const choixAffiches = computed(() => ordreAffichage(props.choix, props.graine))

function cliquer(choixId: string) {
  if (props.mode === 'classe') selection.value = choixId
  else emit('choisir', choixId)
}
function validerClasse() {
  if (selection.value) emit('choisir', selection.value)
}
</script>

<template>
  <div class="actions-app" role="group" :aria-labelledby="id">
    <p :id="id" class="intitule">Que fais-tu ?</p>
    <ul class="liste">
      <li v-for="c in choixAffiches" :key="c.id">
        <button
          type="button"
          class="action"
          :data-choix="c.id"
          :data-qualite="c.qualite"
          :aria-pressed="mode === 'classe' ? selection === c.id : undefined"
          @click="cliquer(c.id)"
        >
          <component :is="GESTES_TELEPHONE[gesteDuChoix(c)].icone" aria-hidden="true" :size="18" />
          <span>{{ c.texte }}</span>
        </button>
      </li>
    </ul>
    <button v-if="mode === 'classe'" type="button" class="action valider" :disabled="!selection" @click="validerClasse">
      Valider le choix de la classe
    </button>
  </div>
</template>

<style scoped>
.actions-app { padding: 0.6rem 0.75rem 0.9rem; border-top: 1px solid var(--tel-bord); background: var(--tel-fond); }
.intitule { margin: 0 0 0.5rem; font-size: 0.85em; font-weight: 700; color: var(--tel-doux); text-align: center; }
.liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.45rem; }
.action { display: flex; align-items: center; gap: 0.5rem; width: 100%; min-height: 44px; padding: 0.5rem 0.8rem; text-align: left; border: 2px solid var(--tel-accent); border-radius: 18px; background: var(--tel-fond); color: var(--tel-texte); font: inherit; cursor: pointer; }
.action:hover, .action[aria-pressed='true'] { background: var(--tel-accent); color: var(--tel-accent-texte); }
.action:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.valider { margin-top: 0.6rem; justify-content: center; font-weight: 700; }
.valider:disabled { opacity: 0.6; cursor: not-allowed; }
.telephone[data-app='mail'] .action, .telephone[data-app='web'] .action, .telephone[data-app='social'] .action { border-radius: 10px; }
</style>
```
(Le dernier sélecteur ne s'appliquera pas en style scoped : le mettre dans `theme.css` en `.telephone[data-app='mail'] .action { border-radius: 10px; }`, etc.)

`src/phone/Telephone.vue` : props et zone du choix joué.
```ts
import { computed, nextTick, ref, watch } from 'vue'
import type { Choix } from '@/content/schema'
import type { Mode } from '@/store/progress'
import { gesteDuChoix } from './gestes'
import ActionsApp from './parts/ActionsApp.vue'
import BanniereSysteme from './parts/BanniereSysteme.vue'
import Bulle from './parts/Bulle.vue'

const props = withDefaults(
  defineProps<{ ecran: EcranTelephone; choix?: Choix[]; mode?: Mode; graine?: string; choixJoue?: string | null }>(),
  { choix: undefined, mode: 'solo', graine: '', choixJoue: null },
)
const emit = defineEmits<{ choisir: [choixId: string] }>()

const joue = computed(() => (props.choixJoue ? (props.choix?.find((c) => c.id === props.choixJoue) ?? null) : null))
const zone = ref<HTMLElement | null>(null)
// Le choix joué apparaît en bas de l'écran : on y fait défiler la zone.
watch(joue, async (c) => {
  if (!c) return
  await nextTick()
  if (zone.value) zone.value.scrollTop = zone.value.scrollHeight
})
```
Template : ajouter `ref="zone"` sur `.ecran`, puis à la fin de `.ecran` :
```vue
<div class="choix-joue" role="status">
  <template v-if="joue">
    <Bulle
      v-if="gesteDuChoix(joue) === 'repondre' && joue.reponse"
      :message="{ de: 'moi', texte: joue.reponse, texteSimple: joue.reponseSimple }"
      nom=""
    />
    <BanniereSysteme v-else :geste="gesteDuChoix(joue)" />
  </template>
</div>
```
et après `.ecran`, dans la `figure` :
```vue
<ActionsApp v-if="choix && !choixJoue" :choix="choix" :graine="graine" :mode="mode" @choisir="(id) => emit('choisir', id)" />
```
Style : `.choix-joue { display: flex; flex-direction: column; }`.

`src/mission/ScenarioStep.vue` :
- props : ajouter `choixId?: string | null` ;
- remplacer le `<Telephone>` par :
```vue
<Telephone
  :ecran="scenario.ecran"
  :choix="scenario.choix"
  :mode="mode"
  :graine="scenario.id"
  :choix-joue="phase === 'situation' ? null : (choixId ?? null)"
  @choisir="(id) => emit('evenement', { type: 'choisir', choixId: id })"
/>
```
- remplacer le bloc `<ChoixList v-if="phase === 'situation'" … />` par `<p v-if="phase === 'situation'" class="consigne-mode">{{ CONSIGNES[mode] }}</p>`, retirer l'import de `ChoixList`, et ajouter dans le script :
```ts
const CONSIGNES: Record<Mode, string> = {
  solo: 'Choisis ta réponse en bas du téléphone.',
  binome: 'Discutez à deux, puis choisissez en bas du téléphone.',
  classe: 'Votez à main levée, puis l’adulte valide le choix de la classe en bas du téléphone.',
}
```
Les `PourquoiForm`, `IndicesForm`, `ConsequencePanel` et la récupération passent de `v-else-if` à `v-if` sur leur phase (le premier maillon de la chaîne a disparu).

`src/pages/MissionPage.vue` : ajouter `:choix-id="etat.choixId"` sur `<ScenarioStep>`.

- [ ] **Step 4: Vérifier**

Run: `dx npm run lint && dx npm run typecheck && dx npx vitest run`
Expected: PASS (`mission-page.test.ts` et `focus.test.ts` cliquent `[data-choix]`, qui est maintenant dans le téléphone).

- [ ] **Step 5: Commit**

```bash
git add src/phone src/mission/ScenarioStep.vue src/pages/MissionPage.vue tests/unit
git commit -m "feat(phone): answer inside the phone and play the chosen gesture"
```

---

### Task 7: Écran verrouillé pour le fil de notifications

**Files:**
- Create: `src/phone/apps/VerrouillageApp.vue`
- Modify: `src/phone/Telephone.vue` (prop `actionsNotif`, événement `agir`, aiguillage `verrouillage`)
- Modify: `src/mission/FilStep.vue` (téléphone, compteur, validation)
- Modify: `tests/unit/fil-step.test.ts`, `tests/unit/focus.test.ts:80,89`, `tests/e2e/helpers.ts:39,55-57`, `tests/e2e/parcours.spec.ts:81-82`
- Test: `tests/unit/fil-step.test.ts`

**Interfaces:**
- Consumes : `FIL_ACTIONS`, `FilAction`, `Fil`, `Avatar`.
- Produces : `Telephone` props `actionsNotif?: Record<string, FilAction>`, emit `agir: [notificationId: string, action: FilAction]` ; attribut `data-notif="<id>"` sur le bouton de chaque notification.

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/unit/fil-step.test.ts` (remplacer le contenu du `describe`) :
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Fil } from '@/content/schema'
import FilStep from '@/mission/FilStep.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { rappelFixture } from './fixtures'
import { bouton, cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

beforeEach(() => definirStore(creerStore(new MemoryStorage())))
const fil = () => rappelFixture().etapes[0] as Fil

describe('FilStep', () => {
  it('chaque notification se déplie, reçoit une action, puis on valide', async () => {
    const w = mount(FilStep, { props: { fil: fil() }, attachTo: document.body })
    expect(w.find('figure').attributes('data-app')).toBe('verrouillage')
    expect(w.findAll('[data-notif]')).toHaveLength(3)
    expect(w.html()).not.toContain('surprise')
    expect(w.text()).toContain('Notifications traitées : 0 sur 3')
    expect(bouton(w, 'Valider mes choix').attributes('disabled')).toBeDefined()

    const n1 = w.find('[data-notif="n1"]')
    await n1.trigger('click')
    expect(n1.attributes('aria-expanded')).toBe('true')
    await cliquer(w, 'J’ignore')
    expect(n1.attributes('aria-expanded')).toBe('false')
    expect(n1.text()).toContain('Ignorée')
    expect(document.activeElement).toBe(n1.element)

    for (const [n, action] of [['n2', 'Je vérifie autrement'], ['n3', 'J’ouvre / je clique']] as const) {
      await w.find(`[data-notif="${n}"]`).trigger('click')
      await cliquer(w, action)
    }
    expect(w.text()).toContain('Notifications traitées : 3 sur 3')
    await cliquer(w, 'Valider mes choix')
    expect(w.emitted('evenement')).toEqual([[{ type: 'fil-termine', actions: { n1: 'ignorer', n2: 'verifier', n3: 'ouvrir' } }]])
    w.unmount()
  })

  it('une seule notification ouverte à la fois', async () => {
    const w = mount(FilStep, { props: { fil: fil() } })
    await w.find('[data-notif="n1"]').trigger('click')
    await w.find('[data-notif="n2"]').trigger('click')
    expect(w.find('[data-notif="n1"]').attributes('aria-expanded')).toBe('false')
    expect(w.find('[data-notif="n2"]').attributes('aria-expanded')).toBe('true')
    expect(w.findAll('.actions-notif')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `dx npx vitest run tests/unit/fil-step.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

`src/phone/apps/VerrouillageApp.vue` :
```vue
<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'
import { FIL_ACTIONS, type Fil, type FilAction } from '@/content/schema'
import Avatar from '../parts/Avatar.vue'

defineProps<{ notifications: Fil['notifications']; actions: Record<string, FilAction>; heure: string }>()
const emit = defineEmits<{ agir: [notificationId: string, action: FilAction] }>()

const LIBELLES: Record<FilAction, string> = {
  ouvrir: 'J’ouvre / je clique',
  verifier: 'Je vérifie autrement',
  signaler: 'Je signale',
  ignorer: 'J’ignore',
}
const ETATS: Record<FilAction, string> = { ouvrir: 'Ouverte', verifier: 'Vérifiée autrement', signaler: 'Signalée', ignorer: 'Ignorée' }

const base = useId()
const ouverte = ref<string | null>(null)
const boutons: Record<string, HTMLElement> = {}

function agir(id: string, action: FilAction) {
  emit('agir', id, action)
  ouverte.value = null
  // Le groupe d'actions disparaît : le focus revient sur la notification.
  void nextTick(() => boutons[id]?.focus())
}
</script>

<template>
  <div class="verrouillage">
    <p class="grande-heure" aria-hidden="true">{{ heure }}</p>
    <ul class="notifications">
      <li v-for="n in notifications" :key="n.id" class="notification">
        <button
          :ref="(el) => { if (el) boutons[n.id] = el as HTMLElement }"
          type="button"
          class="entete-notif"
          :data-notif="n.id"
          :aria-expanded="ouverte === n.id"
          :aria-controls="`${base}-${n.id}`"
          @click="ouverte = ouverte === n.id ? null : n.id"
        >
          <Avatar :nom="n.appNom" />
          <span class="corps">
            <span class="ligne"><span class="app">{{ n.appNom }}</span><span v-if="n.heure" class="heure">{{ n.heure }}</span></span>
            <strong>{{ n.de }}</strong>
            <span>{{ n.texte }}</span>
            <span class="etat">{{ actions[n.id] ? ETATS[actions[n.id]!] : 'À traiter' }}</span>
          </span>
        </button>
        <div v-if="ouverte === n.id" :id="`${base}-${n.id}`" class="actions-notif" role="group" :aria-label="`Que fais-tu de la notification de ${n.de} ?`">
          <button
            v-for="a in FIL_ACTIONS"
            :key="a"
            type="button"
            class="action-notif"
            :aria-pressed="actions[n.id] === a"
            @click="agir(n.id, a)"
          >
            {{ LIBELLES[a] }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.grande-heure { margin: 0.5rem 0 1rem; text-align: center; font-size: 3em; font-weight: 700; }
.notifications { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.entete-notif { display: flex; gap: 0.6rem; width: 100%; padding: 0.6rem; text-align: left; border: 0; border-radius: 16px; background: var(--tel-recu); color: var(--tel-texte); font: inherit; cursor: pointer; }
.entete-notif:focus-visible, .action-notif:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.corps { display: flex; flex-direction: column; min-width: 0; overflow-wrap: anywhere; }
.ligne { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.8em; color: var(--tel-doux); }
.etat { margin-top: 0.2rem; font-size: 0.8em; font-weight: 700; color: var(--tel-doux); }
.actions-notif { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.4rem; }
.action-notif { min-height: 44px; padding: 0.4rem; border: 2px solid var(--tel-doux); border-radius: 12px; background: transparent; color: var(--tel-texte); font: inherit; cursor: pointer; }
.action-notif[aria-pressed='true'] { background: var(--tel-texte); color: var(--tel-fond); }
</style>
```

`src/phone/Telephone.vue` : ajouter `actionsNotif?: Record<string, FilAction>` aux props (défaut `() => ({})`), `agir: [notificationId: string, action: FilAction]` aux événements, et la branche :
```vue
<VerrouillageApp
  v-else-if="ecran.app === 'verrouillage'"
  :notifications="ecran.notifications"
  :actions="actionsNotif"
  :heure="heure"
  @agir="(id, a) => emit('agir', id, a)"
/>
```

`src/mission/FilStep.vue` :
```vue
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Fil, FilAction } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'
import Telephone from '@/phone/Telephone.vue'
import { focusAuMontage } from '@/ui/focus'

const props = defineProps<{ fil: Fil }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()
const titre = ref<HTMLElement | null>(null)
focusAuMontage(titre)

const actions = reactive<Record<string, FilAction>>({})
const traitees = computed(() => props.fil.notifications.filter((n) => actions[n.id]).length)
const complet = computed(() => traitees.value === props.fil.notifications.length)

function valider() {
  if (complet.value) emit('evenement', { type: 'fil-termine', actions: { ...actions } })
}
</script>

<template>
  <section class="fil">
    <h2 ref="titre" tabindex="-1">{{ fil.consigne }}</h2>
    <div class="fil-grille">
      <Telephone
        :ecran="{ app: 'verrouillage', notifications: fil.notifications }"
        :actions-notif="actions"
        @agir="(id, a) => (actions[id] = a)"
      />
      <div class="fil-panneau">
        <p role="status">Notifications traitées : {{ traitees }} sur {{ fil.notifications.length }}</p>
        <button type="button" class="btn btn-primaire" :disabled="!complet" @click="valider">Valider mes choix</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fil-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, auto) minmax(0, 1fr); align-items: start; }
@media (max-width: 48rem) { .fil-grille { grid-template-columns: minmax(0, 1fr); } }
</style>
```

- [ ] **Step 4: Adapter les autres tests**

`tests/unit/focus.test.ts` lignes 80 et 89, remplacer la boucle et la soumission du formulaire par :
```ts
for (const n of ['n1', 'n2', 'n3']) {
  await w.find(`[data-notif="${n}"]`).trigger('click')
  await cliquer(w, 'J’ouvre / je clique')
}
await cliquer(w, 'Valider mes choix')
```
`tests/e2e/helpers.ts` : la constante `verifier` (ligne 39) devient `const notifs = page.locator('[data-notif]')`, et sa branche :
```ts
} else if (await notifs.first().isVisible()) {
  for (const n of await notifs.all()) {
    await n.click()
    await page.getByRole('button', { name: 'Je vérifie autrement' }).click()
  }
  await page.getByRole('button', { name: 'Valider mes choix' }).click()
}
```
`tests/e2e/parcours.spec.ts`, test « rappel » :
```ts
for (const n of await page.locator('[data-notif]').all()) {
  await n.click()
  await page.getByRole('button', { name: 'J’ouvre / je clique' }).click()
}
```

- [ ] **Step 5: Vérifier**

Run: `dx npm run lint && dx npm run typecheck && dx npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/phone src/mission/FilStep.vue tests/unit tests/e2e
git commit -m "feat(phone): show the notification feed as a lock screen"
```

---

### Task 8: Version papier des nouveaux champs

**Files:**
- Create: `src/phone/papier.ts`
- Modify: `src/pages/PlanBPage.vue:38-43` (carte de la situation)
- Test: `tests/unit/telephone-outils.test.ts`

**Interfaces:**
- Consumes : `Ecran`, `texteStats`.
- Produces : `lignesPapier(e: Ecran): string[]` (la première ligne est le titre de la carte).

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `tests/unit/telephone-outils.test.ts` (import `import { lignesPapier } from '@/phone/papier'` et `import type { Ecran } from '@/content/schema'`) :
```ts
describe('lignesPapier', () => {
  const messages = [{ de: 'contact' as const, texte: 'Bonjour', apercu: { titre: 'Suivi', domaine: 'colis-xp.net' } }]
  it('mail : adresse, objet, message, aperçu, pièce jointe', () => {
    const mail = { app: 'mail', appNom: 'Mail', contact: 'Mon Collège', adresse: 'support@x.net', sujet: 'Urgent', pieceJointe: { nom: 'a.pdf' }, messages } as Ecran
    expect(lignesPapier(mail)).toEqual([
      'Mail · Mon Collège', 'Adresse de l’expéditeur : support@x.net', 'Objet : Urgent',
      'Mon Collège : Bonjour', 'Aperçu du lien : Suivi (colis-xp.net)', 'Pièce jointe : a.pdf',
    ])
  })
  it('social : compte, publication, média, compteurs, commentaires', () => {
    const social = {
      app: 'social', appNom: 'StreamTube', contact: 'anonyme', certifie: false, abonnes: '2 400', bio: 'Parodie',
      messages: [{ de: 'contact' as const, texte: 'Regardez !' }], media: { description: 'Vidéo de 5 secondes' },
      stats: { vues: '1 200' }, commentaires: [{ de: 'lea', texte: 'Ouah' }],
    } as Ecran
    expect(lignesPapier(social)).toEqual([
      'StreamTube · anonyme', '2 400 abonnés · Bio : Parodie', 'anonyme : Regardez !', '[Vidéo de 5 secondes]', '1 200 vues', 'lea : Ouah',
    ])
  })
  it('web : adresse ; sms : « Moi » pour mes messages', () => {
    expect(lignesPapier({ app: 'web', appNom: 'Navigateur', contact: 'Page', url: 'x.fr', messages: [{ de: 'contact', texte: 'A' }] } as Ecran))
      .toEqual(['Navigateur · Page', 'Adresse : x.fr', 'Page : A'])
    expect(lignesPapier({ app: 'sms', appNom: 'Messages', contact: 'Léa', messages: [{ de: 'moi', texte: 'Oui' }] } as Ecran))
      .toEqual(['Messages · Léa', 'Moi : Oui'])
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `dx npx vitest run tests/unit/telephone-outils.test.ts`
Expected: FAIL (module `@/phone/papier` introuvable).

- [ ] **Step 3: Implémenter**

`src/phone/papier.ts` :
```ts
import type { Ecran } from '@/content/schema'
import { texteStats } from './stats'

/** Version papier d'un faux écran : tout ce que l'élève verrait, dans l'ordre de l'écran. */
export function lignesPapier(e: Ecran): string[] {
  const lignes = [`${e.appNom} · ${e.contact}`]
  if (e.app === 'mail') {
    if (e.adresse) lignes.push(`Adresse de l’expéditeur : ${e.adresse}`)
    if (e.sujet) lignes.push(`Objet : ${e.sujet}`)
  }
  if (e.app === 'web' && e.url) lignes.push(`Adresse : ${e.url}`)
  if (e.app === 'social') {
    const compte = [e.certifie ? 'Compte certifié' : '', e.abonnes ? `${e.abonnes} abonnés` : '', e.bio ? `Bio : ${e.bio}` : '']
    if (compte.some(Boolean)) lignes.push(compte.filter(Boolean).join(' · '))
  }
  for (const m of e.messages) {
    lignes.push(`${m.de === 'moi' ? 'Moi' : e.contact} : ${m.texte}`)
    if (m.apercu) lignes.push(`Aperçu du lien : ${m.apercu.titre} (${m.apercu.domaine})`)
  }
  if (e.app === 'social') {
    if (e.media) lignes.push(`[${e.media.description}]`)
    const stats = texteStats(e.stats ?? {})
    if (stats) lignes.push(stats)
    for (const c of e.commentaires ?? []) lignes.push(`${c.de} : ${c.texte}`)
  }
  if (e.app === 'mail' && e.pieceJointe) lignes.push(`Pièce jointe : ${e.pieceJointe.nom}`)
  return lignes
}
```
`src/pages/PlanBPage.vue`, la carte de la situation (lignes 38 à 43) devient :
```vue
<div class="carte">
  <p v-for="(ligne, j) in lignesPapier(e.ecran)" :key="j">
    <strong v-if="j === 0">{{ ligne }}</strong>
    <template v-else>{{ ligne }}</template>
  </p>
</div>
```
avec `import { lignesPapier } from '@/phone/papier'` dans le script.

- [ ] **Step 4: Vérifier**

Run: `dx npx vitest run tests/unit/telephone-outils.test.ts tests/unit/enseignants.test.ts tests/unit/minijeux-integration.test.ts && dx npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/phone/papier.ts src/pages/PlanBPage.vue tests/unit/telephone-outils.test.ts
git commit -m "feat(planb): print the new phone screen fields"
```

---

### Task 9: Bout en bout, accessibilité et vérification finale

**Files:**
- Modify: `tests/e2e/a11y.spec.ts` (un audit par appli)
- Modify: `README.md` (section « Écrire une mission » : champs d'écran, `geste`, `reponse`)

**Interfaces:**
- Consumes : tout ce qui précède ; missions réelles (premier écran : `p-6e-colis` sms, `p-college-ami-pirate` chat, `d-college-hors-contexte` social, `a-lycee-wifi-gare` web ; le mail est le 2e scénario de `p-6e-colis`, à confirmer avec `grep -n "app:" content/missions/phishing/p-6e-colis.yaml`).

- [ ] **Step 1: Ajouter les audits par appli**

Dans `tests/e2e/a11y.spec.ts` :
```ts
for (const [nom, id] of [
  ['téléphone sms', 'p-6e-colis'],
  ['téléphone chat', 'p-college-ami-pirate'],
  ['téléphone social', 'd-college-hors-contexte'],
  ['téléphone web', 'a-lycee-wifi-gare'],
] as const) {
  test(nom, async ({ page }) => {
    await page.goto(`/#/mission/${id}`)
    await expect(page.locator('[data-choix]').first()).toBeVisible()
    await verifierA11y(page, nom)
  })
}

test('téléphone mail et choix joué', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await page.locator('[data-qualite="aide"]').click()
  await expect(page.locator('.choix-joue')).toContainText('demander de l’aide')
  await verifierA11y(page, 'choix joué')
  await page.getByRole('button', { name: 'Je ne sais pas' }).click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.locator('figure[data-app="mail"]')).toBeVisible()
  await verifierA11y(page, 'téléphone mail')
})

test('écran verrouillé avec une notification ouverte', async ({ page }) => {
  await page.goto('/#/mission/r-6e')
  await page.locator('[data-notif]').first().click()
  await verifierA11y(page, 'notification ouverte')
})
```

- [ ] **Step 2: Lancer toute la suite**

Run: `dx npm run lint && dx npm run typecheck && dx npx vitest run && dx npm run test:e2e`
Expected: PASS sur les 3 navigateurs. En cas d'échec axe sur un contraste, corriger la variable concernée dans `src/phone/theme.css`.

- [ ] **Step 3: Documenter le format**

Dans `README.md`, section « Écrire une mission », ajouter après la liste des mini-jeux :
```markdown
- Faux écran (`ecran.app`) : `sms`, `chat`, `social` (`certifie`, `abonnes`, `bio`, `media`, `stats`, `commentaires`),
  `mail` (`adresse`, `sujet`, `pieceJointe`), `web` (`url`, sans `url` pour l’écran d’une appli). Chaque message peut avoir
  une `heure` (HH:MM) et un `apercu` de lien ; les liens sont repérés automatiquement dans le texte.
- Chaque choix `bon` ou `risque` a un `geste` (ce que le téléphone montre quand on le choisit : `ouvrir-lien`, `bloquer`…) ;
  le geste `repondre` exige une `reponse`, le message envoyé. La liste est dans `src/content/schema.ts` (`GESTES`).
```

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/a11y.spec.ts README.md
git commit -m "test(phone): audit each phone app and document the screen format"
```

- [ ] **Step 5: Revue humaine**

Lancer `dx npm run dev -- --host` puis ouvrir `http://localhost:5173` : jouer une mission par appli et une mission Rappel, en solo, en mode classe et en taille de texte « très grand ». Vérifier avec NVDA (Windows) l'annonce du choix joué (zone `role="status"`).

---

### Task 10: Page mission plein écran (mode confort) avec repli en flux

Ajoutée le 2026-10-06 après la recette visuelle : la page défilait, le téléphone dépassait et des zones défilaient les unes dans les autres. Le design a été validé dans la conversation et appuyé par une recherche UX (WCAG 1.4.10 et 1.4.12, unités `svh`, container queries).

**Files:**
- Create: `src/mission/MissionBarre.vue` (barre unique de la mission)
- Modify: `src/App.vue` (pas d'`AppHeader` sur la route `mission`)
- Modify: `src/pages/MissionPage.vue` (barre, cadre plein écran pour les étapes à téléphone)
- Modify: `src/mission/ScenarioStep.vue`, `src/mission/FilStep.vue` (grille qui remplit la hauteur, panneau défilant nommé)
- Modify: `src/phone/Telephone.vue`, `src/phone/theme.css` (hauteur = espace disponible, largeur bornée)
- Test: `tests/unit/mission-page.test.ts`, `tests/unit/scenario-step.test.ts`, `tests/unit/fil-step.test.ts`

**Interfaces:**
- Consumes : `ReglagesPanel.vue` (émet `fermer`), `useProgress`, les données de progression déjà calculées dans `MissionPage` (`etat.index`, `mission.etapes.length`, `surIle`).
- Produces : `MissionBarre` props `{ titre: string; etape?: number; total?: number }` (progression absente si `etape` est absente) ; classe `mission--scene` sur le `<main>` quand l'étape courante est un `scenario` ou un `fil` non terminé, sans avertissement sensible en attente.

**Comportement attendu**
1. **Barre unique** (remplace, sur la route `mission` seulement, l'`AppHeader` global ET l'ancien `<header class="mission-entete">` pour le titre et la progression) :
   - lien « ← Carte » vers `/carte` ;
   - le titre de la mission en `<h1>` (taille modeste, environ 1.25rem, une ligne, ellipsis si trop long) ;
   - la progression compacte : texte visible « Étape 2 sur 4 » et une barre fine (`<progress>` existant, ou pastilles). Absente sur un parcours sur île (la scène d'île garde sa propre progression) et à la fin de la mission ;
   - le bouton « Réglages » (`aria-expanded`, `aria-controls="panneau-reglages"`) qui ouvre `ReglagesPanel` comme `AppHeader` le fait (focus rendu au bouton à la fermeture).
   - Le lien « Enseignants » n'apparaît pas pendant une mission (décision validée). `ParcoursScene` et `CheminIle` restent sous la barre, inchangés.
   - Le lien d'évitement « Aller au contenu » de `App.vue` reste.
2. **Mode confort** (classe `mission--scene`, sur ordinateur et tablette) :
   - le `<main>` fait `height: 100svh` (pas de `100dvh`), en grille `grid-template-rows: auto 1fr auto` : barre, zone de jeu, bandeau d'aide éventuel (`BandeauAide` des thèmes sensibles, toujours visible) ;
   - la zone de jeu (`min-height: 0`) contient la grille téléphone | panneau qui remplit la hauteur ; **la page ne défile pas** ;
   - le téléphone remplit la hauteur disponible : `container-type: size` sur la zone de jeu, hauteur `min(100cqh - 1rem, 52rem)`, largeur `clamp(20rem, (100cqh - 1rem) * 9 / 19, 23rem)` (le ratio n'est qu'un plafond) ; plus de `position: sticky` ni de `--tel-hauteur` en `vh` dans ce mode ;
   - le panneau de droite défile seul : `overflow-y: auto`, `tabindex="0"`, `role="region"`, `aria-label="Question et explications"` (la règle axe `scrollable-region-focusable` le vérifie ; Chrome ne le rend pas focalisable seul puisqu'il contient des boutons) ;
   - la ligne « Dans ce scénario, tu joues… » passe en tête du panneau.
3. **Repli en flux** (la page défile, zones internes ouvertes, téléphone à `--tel-largeur` et hauteur `min(40rem, 80svh)` comme aujourd'hui) dès que l'une de ces conditions est vraie :
   - `@media (max-height: 34em), (max-width: 48em)` ;
   - `:root[data-taille='tres-grand']` ou `:root[data-interligne='large']` (posés par `appliquerReglages` : les `em` des media queries ignorent la taille de police de la page, d'où ce sélecteur) ;
   - dans ce mode, le panneau perd `overflow`, mais garde `role="region"` et son nom (pas de `tabindex` inutile n'est pas exigé : le garder est sans danger).
4. Les autres étapes (mini-jeux, lieux de parcours, avertissement sensible, écran de départ, fin de mission) restent en flux, avec la nouvelle barre en haut.

**Tests à écrire (TDD)**
- `mission-page.test.ts` :
  - la barre affiche le titre en `h1`, « Étape 1 sur N », un lien vers `/carte`, et pas de lien « Enseignants » ;
  - « Réglages » ouvre `#panneau-reglages`, et la fermeture rend le focus au bouton ;
  - le `<main>` a la classe `mission--scene` sur une étape scénario, et ne l'a pas sur un mini-jeu ni sur l'écran de fin ;
  - la progression est absente à la fin de la mission.
- `scenario-step.test.ts` : le panneau a `role="region"`, `tabindex="0"` et l'`aria-label` « Question et explications », et la ligne de rôle est dedans.
- `fil-step.test.ts` : même chose pour le panneau du fil (compteur et « Valider mes choix » dedans).
- Le test d'`App.vue` (s'il existe, sinon dans `mission-page.test.ts` via le routeur de test) : pas d'`AppHeader` (`.app-header`) sur la route `mission`, présent ailleurs.

**Oracle**
`npx vitest run --maxWorkers=2 && npm run typecheck && npm run lint && PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright npx playwright test --project=chromium --workers=1` (exit 0), dans le conteneur. L'orchestrateur fait ensuite la recette visuelle avec Playwright : 1366×768, 1920×1080, 390×844, zoom 200 % (viewport 683×384) et texte très grand.

- [ ] **Commit**

```bash
git add src/App.vue src/mission src/pages/MissionPage.vue src/phone tests/unit
git commit -m "feat(mission): full-screen mission page with a single top bar"
```
