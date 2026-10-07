# Refonte visuelle — plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** donner à Cyber Réflexes une identité ludique (façon Duolingo / Kahoot) avec un système de design maison, clair et sombre, sans perdre en accessibilité.

**Architecture :** une source de vérité des couleurs (`src/styles/palette.ts`) recopiée dans `src/styles/tokens.css` et vérifiée par test (contraste WCAG + cohérence) ; des briques CSS globales (`composants.css`) ; deux composants d’interface (`Hulotte.vue`, `PastilleTheme.vue`) ; puis chaque écran repassé sur les jetons et les briques, sans toucher au contenu ni à la logique.

**Tech Stack :** Vue 3.5 `<script setup>`, TypeScript strict, Vite 8, Vitest 5 + @vue/test-utils (jsdom), Playwright + @axe-core/playwright, @fontsource (Atkinson Hyperlegible, Fredoka), @lucide/vue.

**Spec :** `docs/superpowers/specs/2026-10-07-refonte-visuelle-design.md`

## Global Constraints

- Contraste ≥ 4,5:1 pour tout texte, ≥ 3:1 pour composants d’interface et repère de focus, **en clair et en sombre** (vérifié par `tests/unit/palette.test.ts`).
- Aucune couleur hexadécimale (ni `rgb()`/`hsl()` littéral) dans les `<style>` des `.vue` ; les couleurs passent par les jetons `var(--…)`. Les dessins SVG gardent leurs `fill="#…"` dans le `<template>` (îles, décors, personnages). `print.css` garde ses couleurs.
- Aucune information portée par la couleur seule : chaque état (coché, choisi, désactivé, verdict) a aussi une forme, un texte ou une icône.
- Cibles cliquables ≥ 44 × 44 px (boutons de choix ≥ 56 px de haut).
- Animations et transitions ≤ 120 ms (`--duree`), toutes coupées par `prefers-reduced-motion: reduce` et par `:root[data-animations='off']` (règles déjà présentes dans `base.css`, à conserver).
- Bouton désactivé : **pas d’opacité réduite** ; motif hachuré, pas d’ombre, texte `--texte-doux`.
- Hulotte est toujours `aria-hidden="true"` et toujours accompagnée d’un texte réel.
- Aucun changement de contenu (`content/`), de moteur, de règles de jeu, ni du stockage hormis le réglage `theme` (défaut `auto`, **sans** changer `version: 1`).
- Ne jamais renommer ni retirer une classe, un `data-*`, un `id`, un rôle ou un nom accessible utilisé par les tests existants (`tests/unit`, `tests/e2e`) ; on **ajoute** des classes. Les tests existants restent verts ; seul un sélecteur purement visuel peut être adapté, jamais une assertion de comportement.
- Polices intégrées (aucune ressource externe), le site reste hors ligne.
- Ne rien écrire hors du périmètre de fichiers de sa tâche ; aucun script temporaire dans le dépôt (utiliser le dossier scratchpad indiqué par le contrôleur ou `%TEMP%`). Ne jamais committer `Cahier des charges — Cyber Réflexes.docx`, `.superpowers/`, `dist-relecture/`.
- Commits en français, style conventionnel (`feat(design): …`, `test(design): …`), terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Vérification avant chaque commit : `npm run lint`, `npm run typecheck`, `npm test` verts.

## Review Focus

1. **Mode sombre réellement appliqué partout** : un écran qui garde un fond blanc codé en dur ou un texte `#000` en sombre donne du texte illisible → couvert par le test « sans hex » (T1, vidé en T7) et l’audit axe en sombre (T7).
2. **Réglage de thème avant le premier rendu / sans JavaScript** : sans attribut `data-theme`, le mode automatique doit suivre `prefers-color-scheme` → `tokens.css` utilise `:root:not([data-theme='clair']):not([data-theme='sombre'])` dans la media query ; test de cohérence en T1 et e2e en T7.
3. **Ancienne sauvegarde sans `theme`** : un élève qui revient avec une progression enregistrée avant la refonte ne doit rien perdre → test de migration en T1.
4. **Animations coupées** : élève qui a désactivé les animations ou `prefers-reduced-motion` → aucun déplacement des boutons (`transition-duration: 0s`, pas de `transform` à l’appui) → e2e en T7.
5. **Focus visible sur toutes les surfaces** (fond crème, carte blanche, encadrés teintés, fond sombre, bouton violet) → double anneau orange + liseré, contraste vérifié en T1, contrôlé visuellement en T3–T6.

---

## Fichiers

| Fichier | Rôle | Tâche |
|---|---|---|
| `src/styles/palette.ts` | valeurs des jetons clair/sombre, liste des thèmes | T1 |
| `src/styles/tokens.css` | jetons CSS, clair, sombre, auto, accents de thèmes | T1 |
| `src/styles/base.css` | reset, typographie, focus, mise en page, mouvements | T1 |
| `src/styles/composants.css` | briques (`.btn*`, `.carte`, `.tuile`, `.badge*`, `.pastille-theme`, `progress`, `.encadre*`, `.choix-btn`, `.option`) | T1 |
| `src/main.ts`, `package.json` | polices Fredoka, ordre des feuilles | T1 |
| `src/store/progress.ts`, `src/ui/appliquerReglages.ts`, `src/ui/ReglagesPanel.vue` | réglage `theme` | T1 |
| `tests/unit/palette.test.ts`, `tests/unit/styles-sans-hex.test.ts` | contraste, cohérence, absence de hex | T1 |
| `src/ui/Hulotte.vue`, `src/ui/PastilleTheme.vue`, `tests/unit/hulotte.test.ts` | mascotte, pastille | T2 |
| coquille et pages simples | voir T3 | T3 |
| écrans de mission, téléphone, bandeaux | voir T4 | T4 |
| mini-jeux, récupération | voir T5 | T5 |
| parcours, enseignants, fiche, plan B | voir T6 | T6 |
| `tests/e2e/theme.spec.ts`, `index.html`, `vite.config.ts`, `README.md` | audit sombre, animations, PWA | T7 |

Ordre : T1 → T2 → (T3, T4, T5, T6 en parallèle, fichiers disjoints) → T7.

**Contrôle visuel (T3–T6)** — après les tests, chaque tâche regarde ses écrans en clair et en sombre :

```bash
npx vite --port 5199 --strictPort   # en arrière-plan
# fichier d’état hors dépôt, ex. "$TEMP/etat.json" :
# {"cookies":[],"origins":[{"origin":"http://localhost:5199","localStorage":[{"name":"cyber-reflexes:v1","value":"{\"version\":1,\"tranche\":\"6e\",\"mode\":\"solo\",\"personnage\":\"p1\"}"}]}]}
npx playwright screenshot --load-storage "$TEMP/etat.json" --full-page --viewport-size "390,844" "http://localhost:5199/#/carte" "$TEMP/carte-clair.png"
npx playwright screenshot --load-storage "$TEMP/etat.json" --full-page --color-scheme dark --viewport-size "1280,800" "http://localhost:5199/#/carte" "$TEMP/carte-sombre.png"
```

Ouvrir les PNG avec l’outil de lecture d’images, corriger ce qui est illisible, chevauché ou trop « brut », puis arrêter le serveur. Les captures restent hors du dépôt.

---

### Task 1 : Fondations (jetons, briques, polices, réglage de thème, tests)

**Files :**
- Create : `src/styles/palette.ts`, `src/styles/tokens.css`, `src/styles/composants.css`, `tests/unit/palette.test.ts`, `tests/unit/styles-sans-hex.test.ts`
- Modify : `src/styles/base.css` (réécrit), `src/main.ts`, `package.json` / `package-lock.json`, `src/store/progress.ts:10-16`, `src/ui/appliquerReglages.ts`, `src/ui/ReglagesPanel.vue`, `tests/unit/ui.test.ts`, `tests/unit/progress.test.ts:19`

**Interfaces :**
- Produces :
  - `export const THEMES_COULEURS = ['phishing','comptes','vie-privee','jeux-achats','desinformation','appareils','harcelement','rencontres'] as const` et `export type ThemeCouleur = (typeof THEMES_COULEURS)[number]` (dans `palette.ts`)
  - `export const CLAIR: Record<string, string>`, `export const SOMBRE: Record<string, string>` (clés = noms de jetons sans `--`)
  - `export function ratioContraste(a: string, b: string): number`
  - jetons CSS : `--fond --surface --surface-2 --texte --texte-doux --bord --bord-fort --primaire --primaire-ombre --primaire-texte --bon --risque --aide --bon-fond --risque-fond --aide-fond --focus --focus-lisere --hulotte-corps --hulotte-ventre --hulotte-oeil --hulotte-pupille --hulotte-bec --accent-<theme> --teinte-<theme>` + non colorés `--rayon --rayon-btn --rayon-carte --duree --police-titres --police-texte --taille-base --interligne`
  - `[data-accent='<theme>']` pose `--accent` et `--teinte`
  - classes : `.btn .btn-primaire .btn-secondaire .btn-discret .btn-danger .choix-btn .carte .tuile .badge .badge-bon .badge-risque .badge-aide .pastille-theme .encadre .encadre-bon .encadre-risque .encadre-aide .encadre-info .encadre-doux .option .actions .conteneur .visually-hidden`
  - store : `Reglages['theme']: 'auto' | 'clair' | 'sombre'` ; `appliquerReglages` pose `racine.dataset.theme`

- [ ] **Step 1 : Ajouter la police**

```bash
npm install @fontsource/fredoka
```

- [ ] **Step 2 : Écrire le test de contraste et de cohérence (échoue : modules absents)**

`tests/unit/palette.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import tokensCss from '@/styles/tokens.css?raw'
import { CLAIR, SOMBRE, THEMES_COULEURS, ratioContraste } from '@/styles/palette'

type Paire = [string, string]
const PALETTES = { clair: CLAIR, sombre: SOMBRE } as const

const TEXTE: Paire[] = [
  ['texte', 'fond'], ['texte', 'surface'], ['texte', 'surface-2'],
  ['texte-doux', 'fond'], ['texte-doux', 'surface'], ['texte-doux', 'surface-2'],
  ['primaire-texte', 'primaire'],
  ['primaire', 'fond'], ['primaire', 'surface'], ['primaire', 'surface-2'],
  ['bon', 'surface'], ['risque', 'surface'], ['aide', 'surface'],
  ['bon', 'bon-fond'], ['risque', 'risque-fond'], ['aide', 'aide-fond'],
  ['texte', 'bon-fond'], ['texte', 'risque-fond'], ['texte', 'aide-fond'],
  ['texte-doux', 'bon-fond'], ['texte-doux', 'risque-fond'], ['texte-doux', 'aide-fond'],
  ...THEMES_COULEURS.flatMap((t): Paire[] => [['texte', `teinte-${t}`], ['texte-doux', `teinte-${t}`]]),
]
const INTERFACE: Paire[] = [
  ['bord-fort', 'fond'], ['bord-fort', 'surface'],
  ...THEMES_COULEURS.flatMap((t): Paire[] => [
    [`accent-${t}`, 'surface'], [`accent-${t}`, 'surface-2'], [`accent-${t}`, `teinte-${t}`],
  ]),
]
const FONDS_FOCUS = ['fond', 'surface', 'surface-2', 'bon-fond', 'risque-fond', 'aide-fond']

describe('ratioContraste', () => {
  it('donne 21 pour noir sur blanc et 1 pour une couleur sur elle-même', () => {
    expect(ratioContraste('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(ratioContraste('#5b3df5', '#5b3df5')).toBeCloseTo(1, 5)
  })
})

for (const [nom, p] of Object.entries(PALETTES)) {
  describe(`palette ${nom}`, () => {
    it('définit les mêmes jetons dans les deux modes', () => {
      expect(Object.keys(p).sort()).toEqual(Object.keys(CLAIR).sort())
    })
    it.each(TEXTE)('texte %s sur %s ≥ 4,5:1', (a, b) => {
      expect(p[a], a).toBeDefined()
      expect(p[b], b).toBeDefined()
      expect(ratioContraste(p[a]!, p[b]!)).toBeGreaterThanOrEqual(4.5)
    })
    it.each(INTERFACE)('interface %s sur %s ≥ 3:1', (a, b) => {
      expect(ratioContraste(p[a]!, p[b]!)).toBeGreaterThanOrEqual(3)
    })
    it.each(FONDS_FOCUS)('anneau de focus visible sur %s', (fond) => {
      const meilleur = Math.max(ratioContraste(p.focus!, p[fond]!), ratioContraste(p['focus-lisere']!, p[fond]!))
      expect(meilleur).toBeGreaterThanOrEqual(3)
    })
  })
}

/** Extrait les déclarations `--nom: valeur;` du premier bloc dont le sélecteur commence par `selecteur`. */
function bloc(selecteur: string): Record<string, string> {
  const debut = tokensCss.indexOf(selecteur)
  expect(debut, selecteur).toBeGreaterThanOrEqual(0)
  const ouvre = tokensCss.indexOf('{', debut)
  const ferme = tokensCss.indexOf('}', ouvre)
  const corps = tokensCss.slice(ouvre + 1, ferme)
  return Object.fromEntries([...corps.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]))
}

describe('tokens.css reprend palette.ts', () => {
  it('mode clair (racine)', () => {
    expect(bloc(':root,')).toEqual(CLAIR)
  })
  it('mode sombre forcé', () => {
    expect(bloc(":root[data-theme='sombre']")).toEqual(SOMBRE)
  })
  it('mode automatique sombre, y compris sans attribut data-theme', () => {
    expect(tokensCss).toContain('@media (prefers-color-scheme: dark)')
    expect(bloc(":root:not([data-theme='clair']):not([data-theme='sombre'])")).toEqual(SOMBRE)
  })
  it('chaque thème a son sélecteur d’accent', () => {
    for (const t of THEMES_COULEURS) {
      expect(tokensCss).toContain(`[data-accent='${t}'] { --accent: var(--accent-${t}); --teinte: var(--teinte-${t}); }`)
    }
  })
})
```

`tests/unit/styles-sans-hex.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

const fichiers = import.meta.glob('/src/**/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Fichiers pas encore repassés sur les jetons. Chaque tâche d’écran retire les siens ; la tâche 7 vide la liste. */
const EN_ATTENTE = new Set<string>([
  '/src/App.vue',
  '/src/minigames/MotDePasseGame.vue',
  '/src/minigames/RepereGame.vue',
  '/src/mission/CheminIle.vue',
  '/src/mission/ConsequencePanel.vue',
  '/src/mission/ReactionPanel.vue',
  '/src/phone/PhoneFrame.vue',
  '/src/phone/ThreadScreen.vue',
  '/src/phone/WebScreen.vue',
  '/src/ui/BandeauAide.vue',
  '/src/ui/BandeauBrouillon.vue',
])

const COULEUR_LITTERALE = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i

function styles(source: string): string {
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}

describe('aucune couleur codée en dur dans les styles des composants', () => {
  it('trouve les composants', () => {
    expect(Object.keys(fichiers).length).toBeGreaterThan(40)
  })
  it.each(Object.keys(fichiers).filter((f) => !EN_ATTENTE.has(f)))('%s', (f) => {
    const lignes = styles(fichiers[f]!).split('\n').filter((l) => COULEUR_LITTERALE.test(l))
    expect(lignes).toEqual([])
  })
  it('la liste d’attente ne contient que des fichiers existants', () => {
    for (const f of EN_ATTENTE) expect(fichiers[f], f).toBeDefined()
  })
})
```

Si `?raw` n’est pas typé, ajouter dans `src/content/virtual.d.ts` (ou un nouveau `src/env.d.ts` déjà inclus par `tsconfig`) : `/// <reference types="vite/client" />` — vérifier d’abord s’il y est déjà.

- [ ] **Step 3 : Lancer les tests, constater l’échec**

Run : `npx vitest run tests/unit/palette.test.ts tests/unit/styles-sans-hex.test.ts`
Expected : FAIL (`@/styles/palette` introuvable) pour le premier ; le second passe déjà (sert de garde-fou).

- [ ] **Step 4 : Écrire `src/styles/palette.ts`**

```ts
/**
 * Source de vérité des couleurs. tokens.css reprend exactement ces valeurs
 * (vérifié par tests/unit/palette.test.ts, qui contrôle aussi les contrastes).
 */
export const THEMES_COULEURS = [
  'phishing', 'comptes', 'vie-privee', 'jeux-achats', 'desinformation', 'appareils', 'harcelement', 'rencontres',
] as const
export type ThemeCouleur = (typeof THEMES_COULEURS)[number]

export const CLAIR: Record<string, string> = {
  fond: '#fff8ec',
  surface: '#ffffff',
  'surface-2': '#f6f1ff',
  texte: '#1f1a3a',
  'texte-doux': '#544d6e',
  bord: '#e8e1f5',
  'bord-fort': '#8a80a8',
  primaire: '#5b3df5',
  'primaire-ombre': '#3b23b8',
  'primaire-texte': '#ffffff',
  bon: '#0f6b3a',
  risque: '#b3261e',
  aide: '#7a4f00',
  'bon-fond': '#e3f6ea',
  'risque-fond': '#fde8e6',
  'aide-fond': '#fff1d6',
  focus: '#ff9f1c',
  'focus-lisere': '#1f1a3a',
  'hulotte-corps': '#8a6bd1',
  'hulotte-ventre': '#e9defc',
  'hulotte-oeil': '#ffffff',
  'hulotte-pupille': '#1f1a3a',
  'hulotte-bec': '#ffb627',
  'accent-phishing': '#0f8a7a',
  'teinte-phishing': '#d8f3ef',
  'accent-comptes': '#5b3df5',
  'teinte-comptes': '#ece6ff',
  'accent-vie-privee': '#c92a62',
  'teinte-vie-privee': '#ffe3ef',
  'accent-jeux-achats': '#c4480a',
  'teinte-jeux-achats': '#ffe6d6',
  'accent-desinformation': '#8a6a00',
  'teinte-desinformation': '#fff3c4',
  'accent-appareils': '#1971c2',
  'teinte-appareils': '#dbeafe',
  'accent-harcelement': '#b8400c',
  'teinte-harcelement': '#ffedd5',
  'accent-rencontres': '#2b8a3e',
  'teinte-rencontres': '#dcfce7',
}

export const SOMBRE: Record<string, string> = {
  fond: '#151226',
  surface: '#221d3b',
  'surface-2': '#2a2448',
  texte: '#f4f1ff',
  'texte-doux': '#c9c2e8',
  bord: '#3a3360',
  'bord-fort': '#8a80b8',
  primaire: '#9d8bff',
  'primaire-ombre': '#6b56e0',
  'primaire-texte': '#151226',
  bon: '#6ee7a0',
  risque: '#ff8a80',
  aide: '#ffc857',
  'bon-fond': '#173a2a',
  'risque-fond': '#3f1d22',
  'aide-fond': '#3a2e12',
  focus: '#ffb347',
  'focus-lisere': '#151226',
  'hulotte-corps': '#a78bfa',
  'hulotte-ventre': '#3b3266',
  'hulotte-oeil': '#ffffff',
  'hulotte-pupille': '#151226',
  'hulotte-bec': '#ffb627',
  'accent-phishing': '#2dd4bf',
  'teinte-phishing': '#123f3a',
  'accent-comptes': '#9d8bff',
  'teinte-comptes': '#2e2752',
  'accent-vie-privee': '#f06595',
  'teinte-vie-privee': '#4a1730',
  'accent-jeux-achats': '#ff922b',
  'teinte-jeux-achats': '#4a2414',
  'accent-desinformation': '#fcc419',
  'teinte-desinformation': '#3d3210',
  'accent-appareils': '#4dabf7',
  'teinte-appareils': '#13304d',
  'accent-harcelement': '#ff8a4c',
  'teinte-harcelement': '#47220f',
  'accent-rencontres': '#69db7c',
  'teinte-rencontres': '#143d22',
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Ratio de contraste WCAG 2 entre deux couleurs #rrggbb. */
export function ratioContraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
```

(Ces valeurs ont été calculées avant le plan : toutes les paires de texte sont ≥ 4,5:1 et toutes les paires d’interface ≥ 3:1. Si un cas échoue malgré tout, ajuster **la valeur** au minimum dans `palette.ts` et `tokens.css`, jamais le seuil.)

- [ ] **Step 5 : Écrire `src/styles/tokens.css`**

Recopier chaque jeton de `CLAIR` dans le premier bloc et de `SOMBRE` dans les deux blocs sombres, dans le même ordre, au format exact `  --nom: #rrggbb;` (minuscules). Structure :

```css
/* Valeurs reprises de src/styles/palette.ts (vérifié par tests/unit/palette.test.ts). */
:root,
:root[data-theme='clair'] {
  color-scheme: light;
  --fond: #fff8ec;
  --surface: #ffffff;
  /* … tous les jetons de CLAIR, même ordre … */
  --teinte-rencontres: #dcfce7;
}

:root[data-theme='sombre'] {
  color-scheme: dark;
  --fond: #151226;
  /* … tous les jetons de SOMBRE … */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='clair']):not([data-theme='sombre']) {
    color-scheme: dark;
    --fond: #151226;
    /* … tous les jetons de SOMBRE, identiques au bloc précédent … */
  }
}

:root {
  --rayon: 14px;
  --rayon-btn: 14px;
  --rayon-carte: 20px;
  --duree: 120ms;
  --police-titres: 'Fredoka', 'Atkinson Hyperlegible', system-ui, sans-serif;
  --police-texte: 'Atkinson Hyperlegible', system-ui, sans-serif;
  --taille-base: 1.125rem;
  --interligne: 1.5;
}
:root[data-taille='grand'] { --taille-base: 1.3rem; }
:root[data-taille='tres-grand'] { --taille-base: 1.5rem; }
:root[data-interligne='large'] { --interligne: 1.9; }
:root[data-mode='classe'] { --taille-base: 1.6rem; }

[data-accent='phishing'] { --accent: var(--accent-phishing); --teinte: var(--teinte-phishing); }
[data-accent='comptes'] { --accent: var(--accent-comptes); --teinte: var(--teinte-comptes); }
[data-accent='vie-privee'] { --accent: var(--accent-vie-privee); --teinte: var(--teinte-vie-privee); }
[data-accent='jeux-achats'] { --accent: var(--accent-jeux-achats); --teinte: var(--teinte-jeux-achats); }
[data-accent='desinformation'] { --accent: var(--accent-desinformation); --teinte: var(--teinte-desinformation); }
[data-accent='appareils'] { --accent: var(--accent-appareils); --teinte: var(--teinte-appareils); }
[data-accent='harcelement'] { --accent: var(--accent-harcelement); --teinte: var(--teinte-harcelement); }
[data-accent='rencontres'] { --accent: var(--accent-rencontres); --teinte: var(--teinte-rencontres); }
```

Le bloc « clair » ne contient que des jetons hexadécimaux (le test compare l’ensemble exact) : `color-scheme` n’est pas un jeton `--`, il est ignoré par l’extraction.

- [ ] **Step 6 : Réécrire `src/styles/base.css`**

```css
* { box-sizing: border-box; }
html { font-family: var(--police-texte); }
body {
  margin: 0;
  background: var(--fond);
  color: var(--texte);
  font-size: var(--taille-base);
  line-height: var(--interligne);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 {
  font-family: var(--police-titres);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.005em;
}
h1 { font-size: clamp(1.7em, 1.4em + 1.2vw, 2.25em); }
h2 { font-size: 1.35em; }
h3 { font-size: 1.15em; }
a { color: var(--primaire); text-underline-offset: 0.18em; text-decoration-thickness: 0.08em; }
a:hover { text-decoration-thickness: 0.14em; }
input, select, textarea, button { font: inherit; color: inherit; }
input[type='radio'], input[type='checkbox'] { accent-color: var(--primaire); width: 1.25em; height: 1.25em; flex: none; }

/* Repère de focus : anneau orange + liseré (lisible sur toutes les surfaces, clair comme sombre). */
:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 0;
  box-shadow: 0 0 0 6px var(--focus-lisere);
}
[tabindex='-1']:focus:not(:focus-visible) { outline: none; }

.conteneur { max-width: 64rem; margin: 0 auto; padding: 1rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.25rem; }
.visually-hidden {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
:root[data-animations='off'] *,
:root[data-animations='off'] *::before,
:root[data-animations='off'] *::after { animation: none !important; transition: none !important; }
```

- [ ] **Step 7 : Écrire `src/styles/composants.css`**

```css
/* ---------- Boutons « épais » ---------- */
.btn {
  --btn-fond: var(--surface);
  --btn-texte: var(--primaire);
  --btn-bord: var(--bord-fort);
  --btn-ombre: var(--bord-fort);
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5em;
  min-height: 48px; min-width: 44px; padding: 0.6em 1.15em;
  font-family: var(--police-titres); font-weight: 600; font-size: 1em; line-height: 1.2; letter-spacing: 0.01em;
  color: var(--btn-texte); background: var(--btn-fond);
  border: 2px solid var(--btn-bord); border-radius: var(--rayon-btn);
  box-shadow: 0 4px 0 var(--btn-ombre);
  cursor: pointer; text-decoration: none;
  transition: transform var(--duree) ease, box-shadow var(--duree) ease;
}
.btn-secondaire { /* forme par défaut, nommée explicitement */ }
.btn-primaire {
  --btn-fond: var(--primaire); --btn-texte: var(--primaire-texte);
  --btn-bord: var(--primaire-ombre); --btn-ombre: var(--primaire-ombre);
}
.btn-danger { --btn-texte: var(--risque); --btn-bord: var(--risque); --btn-ombre: var(--risque); }
.btn-discret {
  --btn-fond: transparent; --btn-texte: var(--texte-doux); --btn-bord: transparent;
  box-shadow: none; text-decoration: underline; text-underline-offset: 0.18em;
}
@media (hover: hover) {
  .btn:not(:disabled, .btn-discret):hover { transform: translateY(-1px); box-shadow: 0 5px 0 var(--btn-ombre); }
}
.btn:not(:disabled, .btn-discret):active { transform: translateY(4px); box-shadow: 0 0 0 var(--btn-ombre); }
.btn:focus-visible { box-shadow: 0 0 0 6px var(--focus-lisere), 0 4px 0 var(--btn-ombre); }
.btn:disabled, .btn[aria-disabled='true'] {
  --btn-fond: var(--surface-2); --btn-texte: var(--texte-doux); --btn-bord: var(--bord-fort);
  box-shadow: none; cursor: not-allowed;
  background-image: repeating-linear-gradient(135deg, transparent 0 7px, var(--bord) 7px 9px);
}

/* ---------- Choix de réponse ---------- */
.btn.choix-btn {
  --btn-texte: var(--texte);
  display: flex; width: 100%; justify-content: flex-start; text-align: left;
  min-height: 56px; padding: 0.85em 1.1em;
  font-family: var(--police-texte); font-weight: 700;
}
.btn.choix-btn[aria-pressed='true'], .btn.choix-btn[aria-checked='true'] {
  --btn-fond: var(--surface-2); --btn-bord: var(--primaire); --btn-ombre: var(--primaire-ombre);
  box-shadow: inset 6px 0 0 var(--primaire), 0 4px 0 var(--btn-ombre);
}

/* ---------- Cartes, tuiles, badges ---------- */
.carte {
  background: var(--surface); color: var(--texte);
  border: 2px solid var(--bord); border-radius: var(--rayon-carte);
  box-shadow: 0 4px 0 var(--bord);
  padding: 1.25rem;
}
.tuile { border-top: 6px solid var(--accent, var(--primaire)); }
.badge {
  display: inline-flex; align-items: center; gap: 0.3em;
  padding: 0.15em 0.7em; border-radius: 999px;
  font-size: 0.85em; font-weight: 700; line-height: 1.4;
  background: var(--surface-2); color: var(--texte); border: 1px solid var(--bord-fort);
}
.badge-bon { background: var(--bon-fond); color: var(--bon); border-color: var(--bon); }
.badge-risque { background: var(--risque-fond); color: var(--risque); border-color: var(--risque); }
.badge-aide { background: var(--aide-fond); color: var(--aide); border-color: var(--aide); }

:where(.pastille-theme) { --accent: var(--primaire); --teinte: var(--surface-2); }
.pastille-theme {
  display: inline-grid; place-items: center; flex: none;
  width: 2.75rem; height: 2.75rem; border-radius: 14px;
  background: var(--teinte); color: var(--accent);
}

/* ---------- Barre de progression (élément <progress> natif) ---------- */
progress {
  appearance: none; -webkit-appearance: none;
  width: 100%; height: 0.8rem; border: 0; border-radius: 999px; overflow: hidden;
  background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--bord-fort);
  color: var(--accent, var(--primaire));
}
progress::-webkit-progress-bar { background: var(--surface-2); border-radius: 999px; }
progress::-webkit-progress-value { background: var(--accent, var(--primaire)); border-radius: 999px; }
progress::-moz-progress-bar { background: var(--accent, var(--primaire)); border-radius: 999px; }

/* ---------- Encadrés ---------- */
.encadre {
  --encadre-fond: var(--surface-2); --encadre-trait: var(--primaire);
  background: var(--encadre-fond); color: var(--texte);
  border: 2px solid var(--encadre-trait); border-left-width: 8px;
  border-radius: 18px; padding: 1rem 1.25rem;
}
.encadre > :first-child { margin-top: 0; }
.encadre > :last-child { margin-bottom: 0; }
.encadre-bon { --encadre-fond: var(--bon-fond); --encadre-trait: var(--bon); }
.encadre-risque { --encadre-fond: var(--risque-fond); --encadre-trait: var(--risque); }
.encadre-aide { --encadre-fond: var(--aide-fond); --encadre-trait: var(--aide); }
.encadre-info { --encadre-fond: var(--surface-2); --encadre-trait: var(--primaire); }
.encadre-doux { --encadre-fond: var(--surface-2); --encadre-trait: var(--bord-fort); }

/* ---------- Options (radios, cases) ---------- */
fieldset {
  border: 2px solid var(--bord); border-radius: var(--rayon-carte);
  margin: 0 0 1rem; padding: 0.75rem 1rem 1rem;
}
legend { font-family: var(--police-titres); font-weight: 600; padding: 0 0.4em; }
.option {
  display: flex; align-items: center; gap: 0.65em;
  min-height: 48px; padding: 0.5em 0.9em; margin: 0.4rem 0;
  background: var(--surface); border: 2px solid var(--bord-fort); border-radius: var(--rayon-btn);
  cursor: pointer;
}
.option:has(input:checked) {
  border-color: var(--primaire); background: var(--surface-2);
  box-shadow: inset 6px 0 0 var(--primaire);
  font-weight: 700;
}
.option:has(input:focus-visible) { outline: 3px solid var(--focus); box-shadow: 0 0 0 6px var(--focus-lisere); }
.option input:focus-visible { outline: none; box-shadow: none; }
```

- [ ] **Step 8 : Brancher polices et feuilles dans `src/main.ts`**

```ts
import { createApp } from 'vue'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/composants.css'
import './styles/print.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')
```

Vérifier `print.css` : il doit continuer à forcer noir sur blanc ; s’il repose sur d’anciens jetons, garder ses couleurs littérales (autorisé). Ajouter en tête de `print.css`, dans son `@media print`, `:root { color-scheme: light; } .btn, .carte, .encadre, .option { box-shadow: none !important; background-image: none !important; }` si absent.

- [ ] **Step 9 : Lancer le test de palette**

Run : `npx vitest run tests/unit/palette.test.ts tests/unit/styles-sans-hex.test.ts`
Expected : PASS.

- [ ] **Step 10 : Test du réglage de thème (échoue)**

Dans `tests/unit/ui.test.ts`, dans `describe('appliquerReglages', …)` ajouter :

```ts
  it('pose le thème choisi, automatique par défaut', () => {
    const racine = document.createElement('div')
    appliquerReglages(store, racine)
    expect(racine.dataset.theme).toBe('auto')
    store.modifierReglages({ theme: 'sombre' })
    return nextTick().then(() => expect(racine.dataset.theme).toBe('sombre'))
  })
```

Et un nouveau `describe('ReglagesPanel — thème', …)` :

```ts
describe('ReglagesPanel — thème', () => {
  it('propose Automatique, Clair et Sombre et enregistre le choix', async () => {
    const w = mount(ReglagesPanel)
    const groupe = w.findAll('fieldset').find((f) => f.find('legend').text() === 'Thème')
    expect(groupe).toBeDefined()
    expect(groupe!.findAll('label').map((l) => l.text())).toEqual(['Automatique (comme l’appareil)', 'Clair', 'Sombre'])
    expect((groupe!.find('input[value="auto"]').element as HTMLInputElement).checked).toBe(true)
    await groupe!.find('input[value="sombre"]').setValue(true)
    expect(store.etat.reglages.theme).toBe('sombre')
  })
})
```

Dans `tests/unit/progress.test.ts`, ajouter un cas :

```ts
  it('une sauvegarde sans réglage de thème passe en automatique', () => {
    const ancienne = { version: 1, reglages: { taille: 'grand', interligne: 'normal', lectureSimple: false, animations: true, chrono: false } }
    const etat = migrer(ancienne)
    expect(etat?.reglages.theme).toBe('auto')
    expect(etat?.reglages.taille).toBe('grand')
  })
```

et ajouter `theme: 'auto'` à l’objet `reglages` attendu ligne 19.

Run : `npx vitest run tests/unit/ui.test.ts tests/unit/progress.test.ts` → FAIL (`theme` inconnu).

- [ ] **Step 11 : Implémenter le réglage**

`src/store/progress.ts`, dans `reglagesSchema` :

```ts
  theme: z.enum(['auto', 'clair', 'sombre']).default('auto'),
```

`src/ui/appliquerReglages.ts`, dans le `watchEffect` :

```ts
    racine.dataset.theme = r.theme
```

et mettre à jour le commentaire : `/** Reporte réglages et mode sur <html> (data-*), lus par tokens.css et base.css. */`.

`src/ui/ReglagesPanel.vue` : ajouter la constante et, **avant** le fieldset « Taille du texte », le groupe :

```ts
const THEMES: { valeur: Reglages['theme']; libelle: string }[] = [
  { valeur: 'auto', libelle: 'Automatique (comme l’appareil)' },
  { valeur: 'clair', libelle: 'Clair' },
  { valeur: 'sombre', libelle: 'Sombre' },
]
```

```vue
    <fieldset>
      <legend>Thème</legend>
      <label v-for="t in THEMES" :key="t.valeur" class="option">
        <input
          type="radio"
          name="theme"
          :value="t.valeur"
          :checked="store.etat.reglages.theme === t.valeur"
          @change="store.modifierReglages({ theme: t.valeur })"
        />
        {{ t.libelle }}
      </label>
    </fieldset>
```

Vérifier que `modifierReglages` accepte un `Partial<Reglages>` (sinon, l’adapter au même type que les autres champs).

- [ ] **Step 12 : Tout vérifier**

Run : `npm run lint; npm run typecheck; npm test`
Expected : tout vert. Si un test existant échoue parce qu’il compare l’objet `reglages` complet, ajouter `theme: 'auto'` à l’attendu (assertion de données, pas de comportement).

- [ ] **Step 13 : Commit**

```bash
git add package.json package-lock.json src/main.ts src/styles src/store/progress.ts src/ui/appliquerReglages.ts src/ui/ReglagesPanel.vue tests/unit/palette.test.ts tests/unit/styles-sans-hex.test.ts tests/unit/ui.test.ts tests/unit/progress.test.ts
git commit -m "feat(design): jetons clair/sombre vérifiés, briques, Fredoka et réglage de thème"
```

(Ajouter `src/env.d.ts` ou `src/content/virtual.d.ts` au `git add` si modifié au Step 2.)

---

### Task 2 : Hulotte et pastille de thème

**Files :**
- Create : `src/ui/Hulotte.vue`, `src/ui/PastilleTheme.vue`, `tests/unit/hulotte.test.ts`

**Interfaces :**
- Consumes : jetons `--hulotte-*`, classe `.pastille-theme`, `[data-accent]` (T1) ; `ICONES_THEMES` de `src/ui/icons.ts` ; type `Theme` de `@/content/schema`.
- Produces :
  - `Hulotte.vue` : props `expression?: ExpressionHulotte` (défaut `'accueil'`), `taille?: number` (px, défaut `96`) ; rend `<svg class="hulotte" :data-expression aria-hidden="true" focusable="false">` ; `export type ExpressionHulotte = 'accueil' | 'reflechit' | 'bravo' | 'encourage' | 'douce'` exporté depuis `src/ui/hulotte.ts`.
  - `PastilleTheme.vue` : props `theme: Pick<Theme, 'id' | 'icone'>`, `taille?: number` (px de l’icône, défaut `24`) ; rend `<span class="pastille-theme" :data-accent="theme.id" aria-hidden="true">` + icône Lucide.

- [ ] **Step 1 : Écrire le test (échoue)**

`tests/unit/hulotte.test.ts` :

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Hulotte from '@/ui/Hulotte.vue'
import sourceHulotte from '@/ui/Hulotte.vue?raw'
import PastilleTheme from '@/ui/PastilleTheme.vue'
import { EXPRESSIONS_HULOTTE } from '@/ui/hulotte'

describe('Hulotte', () => {
  it.each(EXPRESSIONS_HULOTTE)('rend l’expression %s, décorative', (expression) => {
    const w = mount(Hulotte, { props: { expression, taille: 64 } })
    const svg = w.find('svg.hulotte')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.attributes('data-expression')).toBe(expression)
    expect(svg.attributes('width')).toBe('64')
    expect(w.findAll('.h-corps').length).toBeGreaterThan(0)
  })
  it('ne fait la fête qu’en « bravo »', () => {
    expect(mount(Hulotte, { props: { expression: 'bravo' } }).find('.h-etoiles').exists()).toBe(true)
    for (const e of EXPRESSIONS_HULOTTE.filter((x) => x !== 'bravo')) {
      expect(mount(Hulotte, { props: { expression: e } }).find('.h-etoiles').exists()).toBe(false)
    }
  })
  it('prend toutes ses couleurs dans les jetons', () => {
    expect(sourceHulotte).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(sourceHulotte).toContain('var(--hulotte-corps)')
  })
})

describe('PastilleTheme', () => {
  it('porte l’accent du thème et reste décorative', () => {
    const w = mount(PastilleTheme, { props: { theme: { id: 'phishing', icone: 'Fish' } } })
    const s = w.find('.pastille-theme')
    expect(s.attributes('data-accent')).toBe('phishing')
    expect(s.attributes('aria-hidden')).toBe('true')
    expect(s.find('svg').exists()).toBe(true)
  })
})
```

Run : `npx vitest run tests/unit/hulotte.test.ts` → FAIL (modules absents).

- [ ] **Step 2 : `src/ui/hulotte.ts`**

```ts
export const EXPRESSIONS_HULOTTE = ['accueil', 'reflechit', 'bravo', 'encourage', 'douce'] as const
export type ExpressionHulotte = (typeof EXPRESSIONS_HULOTTE)[number]
```

- [ ] **Step 3 : `src/ui/Hulotte.vue`**

```vue
<script setup lang="ts">
import type { ExpressionHulotte } from './hulotte'

withDefaults(defineProps<{ expression?: ExpressionHulotte; taille?: number }>(), {
  expression: 'accueil',
  taille: 96,
})
</script>

<template>
  <svg
    class="hulotte"
    :data-expression="expression"
    :width="taille"
    :height="taille"
    viewBox="0 0 64 64"
    aria-hidden="true"
    focusable="false"
  >
    <!-- aigrettes -->
    <path class="h-corps" d="M13 12 L23 21 L15 25 Z M51 12 L41 21 L49 25 Z" />
    <!-- ailes, selon l’expression -->
    <g v-if="expression === 'accueil'" class="h-corps">
      <path d="M12 38 Q2 26 7 16 Q13 27 16 34 Z" />
      <path d="M52 38 Q62 26 57 16 Q51 27 48 34 Z" />
    </g>
    <g v-else-if="expression === 'encourage'" class="h-corps">
      <path d="M12 44 Q6 40 9 32 Q13 38 15 40 Z" />
      <path d="M52 38 Q62 26 57 16 Q51 27 48 34 Z" />
    </g>
    <g v-else class="h-corps">
      <path d="M12 44 Q6 40 9 32 Q13 38 15 40 Z" />
      <path d="M52 44 Q58 40 55 32 Q51 38 49 40 Z" />
    </g>
    <!-- corps et ventre -->
    <ellipse class="h-corps" cx="32" cy="37" rx="21" ry="23" />
    <ellipse class="h-ventre" cx="32" cy="46" rx="12.5" ry="11.5" />
    <path class="h-plume" d="M27 44 q2 2 4 0 M33 44 q2 2 4 0 M30 49 q2 2 4 0" />
    <!-- yeux -->
    <circle class="h-oeil" cx="23" cy="29" r="8.5" />
    <circle class="h-oeil" cx="41" cy="29" r="8.5" />
    <template v-if="expression === 'bravo'">
      <path class="h-trait" d="M18.5 30 Q23 25 27.5 30 M36.5 30 Q41 25 45.5 30" />
    </template>
    <template v-else-if="expression === 'douce'">
      <path class="h-trait" d="M18.5 29 Q23 33 27.5 29 M36.5 29 Q41 33 45.5 29" />
    </template>
    <template v-else-if="expression === 'reflechit'">
      <circle class="h-pupille" cx="21.5" cy="26.5" r="4" />
      <circle class="h-pupille" cx="39.5" cy="26.5" r="4" />
      <circle class="h-oeil" cx="20.5" cy="25.5" r="1.2" />
      <circle class="h-oeil" cx="38.5" cy="25.5" r="1.2" />
    </template>
    <template v-else>
      <circle class="h-pupille" cx="24" cy="30" r="4.2" />
      <circle class="h-pupille" cx="40" cy="30" r="4.2" />
      <circle class="h-oeil" cx="25.4" cy="28.6" r="1.3" />
      <circle class="h-oeil" cx="41.4" cy="28.6" r="1.3" />
    </template>
    <!-- bec -->
    <path class="h-bec" d="M29 36 L32 41 L35 36 Z" />
    <!-- aile au menton (réfléchit) -->
    <path v-if="expression === 'reflechit'" class="h-corps h-contour" d="M44 52 Q36 50 34 44 Q40 44 46 47 Z" />
    <!-- pattes -->
    <path class="h-patte" d="M24 59 q3 -3 6 0 M34 59 q3 -3 6 0" />
    <!-- étoiles (bravo seulement) -->
    <g v-if="expression === 'bravo'" class="h-etoiles">
      <path d="M8 8 l1.5 3.2 3.5 .4 -2.6 2.4 .7 3.4 -3.1 -1.7 -3.1 1.7 .7 -3.4 -2.6 -2.4 3.5 -.4 Z" />
      <path d="M56 6 l1.2 2.5 2.7 .3 -2 1.9 .5 2.6 -2.4 -1.3 -2.4 1.3 .5 -2.6 -2 -1.9 2.7 -.3 Z" />
    </g>
  </svg>
</template>

<style scoped>
.hulotte { display: block; flex: none; overflow: visible; }
.h-corps { fill: var(--hulotte-corps); }
.h-contour { stroke: var(--hulotte-pupille); stroke-width: 0.6; stroke-opacity: 0.25; }
.h-ventre { fill: var(--hulotte-ventre); }
.h-plume { fill: none; stroke: var(--hulotte-corps); stroke-width: 1.2; stroke-linecap: round; }
.h-oeil { fill: var(--hulotte-oeil); }
.h-pupille { fill: var(--hulotte-pupille); }
.h-trait { fill: none; stroke: var(--hulotte-pupille); stroke-width: 2.4; stroke-linecap: round; }
.h-bec { fill: var(--hulotte-bec); }
.h-patte { fill: none; stroke: var(--hulotte-bec); stroke-width: 3; stroke-linecap: round; }
.h-etoiles { fill: var(--hulotte-bec); }
</style>
```

- [ ] **Step 4 : `src/ui/PastilleTheme.vue`**

```vue
<script setup lang="ts">
import type { Theme } from '@/content/schema'
import { ICONES_THEMES } from './icons'

withDefaults(defineProps<{ theme: Pick<Theme, 'id' | 'icone'>; taille?: number }>(), { taille: 24 })
</script>

<template>
  <span class="pastille-theme" :data-accent="theme.id" aria-hidden="true">
    <component :is="ICONES_THEMES[theme.icone]" :size="taille" />
  </span>
</template>
```

- [ ] **Step 5 : Tests**

Run : `npx vitest run tests/unit/hulotte.test.ts` → PASS ; puis `npm run lint; npm run typecheck; npm test` → vert.

Contrôle visuel rapide : monter temporairement rien dans le dépôt ; à la place, ouvrir une capture de l’accueil n’est pas encore possible (Hulotte n’y est pas). Créer dans le scratchpad un fichier HTML qui recopie le SVG avec les valeurs de `CLAIR` et `SOMBRE` pour les jetons `--hulotte-*`, l’ouvrir en capture (`npx playwright screenshot file:///…`) et vérifier que les 5 expressions sont distinctes et lisibles à 32, 64 et 120 px. Ajuster les tracés si besoin (sans couleur littérale).

- [ ] **Step 6 : Commit**

```bash
git add src/ui/hulotte.ts src/ui/Hulotte.vue src/ui/PastilleTheme.vue tests/unit/hulotte.test.ts
git commit -m "feat(design): Hulotte (5 expressions) et pastille de thème"
```

---

### Task 3 : Coquille, accueil, carte et pages simples

**Files :**
- Modify : `src/App.vue`, `src/ui/AppHeader.vue`, `src/ui/ReglagesPanel.vue` (mise en page seulement), `src/ui/EffacerProgression.vue`, `src/ui/UpdatePrompt.vue`, `src/pages/AccueilPage.vue`, `src/pages/CartePage.vue`, `src/pages/IntrouvablePage.vue`, `src/pages/ConfidentialitePage.vue`, `src/pages/TestTechniquePage.vue`
- Modify : `tests/unit/styles-sans-hex.test.ts` — retirer `'/src/App.vue'` de `EN_ATTENTE`
- Create : `tests/unit/refonte-coquille.test.ts`

**Interfaces :**
- Consumes : `Hulotte` (`expression`, `taille`), `PastilleTheme` (`theme`), briques et jetons de T1.
- Produces : rien pour les autres tâches.

- [ ] **Step 1 : Test (échoue)**

Lire `tests/unit/accueil-carte.test.ts` et `tests/unit/ui.test.ts` pour reprendre exactement leur façon de monter les pages (store, router, fixtures). Puis `tests/unit/refonte-coquille.test.ts` avec ces assertions (même préparation que ces fichiers) :

```ts
// En-tête : le logo contient Hulotte miniature et le texte « Cyber Réflexes ».
expect(enTete.find('.logo svg.hulotte').exists()).toBe(true)
expect(enTete.find('.logo').text()).toContain('Cyber Réflexes')
// Bouton Réglages : bouton secondaire.
expect(enTete.find('button[aria-controls="panneau-reglages"]').classes()).toContain('btn-secondaire')

// Accueil : Hulotte « accueil » + un vrai titre de niveau 1.
expect(accueil.find('svg.hulotte[data-expression="accueil"]').exists()).toBe(true)
expect(accueil.find('h1').text().length).toBeGreaterThan(0)

// Carte : Hulotte « reflechit » ; une tuile par thème, avec pastille et accent du thème.
expect(carte.find('svg.hulotte[data-expression="reflechit"]').exists()).toBe(true)
const tuiles = carte.findAll('.tuile')
expect(tuiles.length).toBe(themesFixture.length)
for (const [i, t] of tuiles.entries()) {
  expect(t.attributes('data-accent')).toBe(themesFixture[i]!.id)
  expect(t.find('.pastille-theme').exists()).toBe(true)
}
// Mention « Parcours » sous forme de badge texte.
expect(carte.findAll('.badge').some((b) => b.text() === 'Parcours')).toBe(true)

// Introuvable : Hulotte « reflechit » + texte.
expect(introuvable.find('svg.hulotte[data-expression="reflechit"]').exists()).toBe(true)
```

(Adapter `themesFixture` / la fixture de mission parcours si la fixture ne contient pas de parcours : dans ce cas, assertion du badge sur une mission de format `parcours` de `content-mock-parcours.ts`, ou retirer cette assertion et la remplacer par la vérification que `.meta` contient « Parcours » dans un `.badge`.)

Run : `npx vitest run tests/unit/refonte-coquille.test.ts` → FAIL.

- [ ] **Step 2 : En-tête (`AppHeader.vue`) et `App.vue`**

- Logo : `<RouterLink to="/" class="logo"><Hulotte expression="accueil" :taille="36" /> <span>Cyber <b>Réflexes</b></span></RouterLink>` (retirer `ShieldCheck`). `.logo` : `font-family: var(--police-titres); font-weight: 700; font-size: 1.3em; color: var(--texte); text-decoration: none; display: inline-flex; align-items: center; gap: .5rem; min-height: 44px;` ; `.logo b { color: var(--primaire); }`.
- Bouton Réglages : classes `btn btn-secondaire`.
- En-tête : fond `var(--surface)`, `border-bottom: 2px solid var(--bord)`, `position: sticky; top: 0; z-index: 10;`, contenu centré `max-width: 64rem`. Lien « Enseignants » : `font-weight: 700`, cible ≥ 44 px (`display: inline-flex; align-items: center; min-height: 44px; padding: 0 .5rem`).
- `App.vue` : retirer la couleur codée en dur de son `<style>` (remplacer par le jeton équivalent) ; lien d’évitement (s’il existe) en `.btn btn-primaire` visible au focus.

- [ ] **Step 3 : Accueil (`AccueilPage.vue`)**

- Héro en `.carte` : `display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap;` avec `<Hulotte expression="accueil" :taille="112" />` et, à côté, le `h1` + la phrase d’accroche existants (texte inchangé) en `color: var(--texte-doux)`.
- Choix du niveau et du mode : les `label.option` existants deviennent des cartes-radios en grille : conteneur `display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));` ; chaque `.option` : `min-height: 64px; font-family: var(--police-titres); font-weight: 600;` (l’état coché vient de `.option:has(input:checked)`). Garder radios natives visibles (aucune réimplémentation).
- Bouton « C’est parti ! » : `btn btn-primaire`, `font-size: 1.15em; padding: .8em 1.6em;`.

- [ ] **Step 4 : Carte des thèmes (`CartePage.vue`)**

- En tête de page : `<div class="entete-carte"><Hulotte expression="reflechit" :taille="72" /><h1>…titre existant…</h1></div>` (flex, centré verticalement).
- Chaque tuile : `<li … class="carte tuile" :data-accent="theme.id">` ; titre : `<h2><PastilleTheme :theme="theme" /> {{ theme.titre }}</h2>` (retirer l’icône nue).
- Missions : chaque `<li>` devient une ligne `display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .6rem; padding: .5rem 0; border-top: 2px solid var(--bord);` ; le lien garde son texte ; « Parcours » devient `<span class="badge">Parcours</span>` (garder le texte exact) ; durée en `.meta` ; « Terminée » en `<span class="badge badge-bon"><Check …/> Terminée</span>`. « Bientôt disponible » en `<p class="badge">Bientôt disponible</p>`.
- Barre de progression du thème : `<progress :value="nbTerminees" :max="missions.length" :aria-label="`Progression ${theme.titre}`">` + texte visible `{{ nbTerminees }} / {{ missions.length }} terminée(s)` (calcul avec la fonction `terminee` existante ; seulement si `missions.length`). La barre prend `--accent` de la tuile.
- Rappel : `.carte.encadre-info` → garder les classes existantes (`rappel`, `rappel-du`) et ajouter `encadre encadre-info` ; `rappel-du` : `--encadre-trait: var(--primaire); border-width: 3px; border-left-width: 10px;`.

- [ ] **Step 5 : Pages simples**

- `IntrouvablePage.vue` : `<Hulotte expression="reflechit" :taille="120" />` au-dessus du `h1`, contenu centré dans une `.carte`, bouton retour en `btn btn-primaire`.
- `ConfidentialitePage.vue`, `TestTechniquePage.vue` : sections en `.carte` espacées (`display: grid; gap: 1rem`), résultats du test technique : réussite → `badge badge-bon`, échec → `badge badge-risque`, avec le texte existant (jamais la couleur seule).
- `UpdatePrompt.vue` : `.carte` flottante (`position: fixed; inset: auto 1rem 1rem auto; max-width: 24rem; z-index: 20;`), bouton principal `btn btn-primaire`.
- `EffacerProgression.vue` : bouton en `btn btn-danger` ; confirmation dans un `.encadre encadre-risque`.
- `ReglagesPanel.vue` (mise en page) : `.reglages` : `display: grid; gap: .5rem; margin-top: 1rem;` ; options des groupes Thème / Taille / Interligne en ligne sur grand écran (`fieldset` en `display: flex; flex-wrap: wrap; gap: .5rem;` sauf `legend`) ; boutons du bas en `.actions`.

Partout : remplacer les couleurs et bordures existantes par les jetons ; aucune couleur littérale dans les `<style>`.

- [ ] **Step 6 : Tests et contrôle visuel**

Retirer `'/src/App.vue'` de `EN_ATTENTE`. Run : `npm run lint; npm run typecheck; npm test` → vert.
Contrôle visuel (section « Contrôle visuel ») : `/#/` (état vide : fichier d’état avec seulement `{"version":1}`), `/#/carte`, `/#/nimporte-quoi`, `/#/confidentialite`, `/#/test`, en 390 px clair et 1280 px sombre ; ouvrir aussi les réglages n’est pas faisable en capture CLI — vérifier le panneau via le test unitaire seulement.

- [ ] **Step 7 : Commit**

```bash
git add src/App.vue src/ui/AppHeader.vue src/ui/ReglagesPanel.vue src/ui/EffacerProgression.vue src/ui/UpdatePrompt.vue src/pages/AccueilPage.vue src/pages/CartePage.vue src/pages/IntrouvablePage.vue src/pages/ConfidentialitePage.vue src/pages/TestTechniquePage.vue tests/unit/refonte-coquille.test.ts tests/unit/styles-sans-hex.test.ts
git commit -m "feat(design): en-tête, accueil, carte des thèmes et pages simples"
```

---

### Task 4 : Écrans de mission, téléphone, bandeaux

**Files :**
- Modify : `src/pages/MissionPage.vue`, `src/mission/ScenarioStep.vue`, `src/mission/ChoixList.vue`, `src/mission/ConsequencePanel.vue`, `src/mission/ReactionPanel.vue`, `src/mission/IndicesForm.vue`, `src/mission/PourquoiForm.vue`, `src/mission/FinMission.vue`, `src/mission/FilStep.vue`, `src/mission/SensibleAvertissement.vue`, `src/mission/MinijeuStep.vue`, `src/phone/EcranTelephone.vue`, `src/phone/MailScreen.vue`, `src/phone/PhoneFrame.vue`, `src/phone/ThreadScreen.vue`, `src/phone/WebScreen.vue`, `src/ui/BandeauAide.vue`, `src/ui/BandeauBrouillon.vue`
- Modify : `tests/unit/styles-sans-hex.test.ts` — retirer `ConsequencePanel`, `ReactionPanel`, `PhoneFrame`, `ThreadScreen`, `WebScreen`, `BandeauAide`, `BandeauBrouillon` de `EN_ATTENTE`
- Create : `tests/unit/refonte-mission.test.ts`

**Interfaces :**
- Consumes : `Hulotte`, `PastilleTheme`, briques et jetons de T1.

- [ ] **Step 1 : Test (échoue)**

Lire `tests/unit/fin-mission-sensible.test.ts`, `tests/unit/scenario-step.test.ts`, `tests/unit/phone.test.ts` pour reprendre la façon de monter `FinMission`, `SensibleAvertissement`, `ChoixList`, `BandeauAide`. Puis `tests/unit/refonte-mission.test.ts` :

```ts
// FinMission, thème non sensible : Hulotte « bravo ».
expect(finNormale.find('svg.hulotte[data-expression="bravo"]').exists()).toBe(true)
// FinMission, thème sensible : Hulotte « douce », aucune étoile ni animation festive.
expect(finSensible.find('svg.hulotte[data-expression="douce"]').exists()).toBe(true)
expect(finSensible.find('.h-etoiles').exists()).toBe(false)
expect(finSensible.find('.fete').exists()).toBe(false)
// Avertissement des thèmes sensibles : Hulotte « douce ».
expect(avertissement.find('svg.hulotte[data-expression="douce"]').exists()).toBe(true)
// Bandeau d’aide : encadré doux.
expect(bandeauAide.classes()).toEqual(expect.arrayContaining(['encadre', 'encadre-doux']))
// Bandeau brouillon : encadré « aide » avec badge texte « Brouillon ».
expect(bandeauBrouillon.classes()).toEqual(expect.arrayContaining(['encadre', 'encadre-aide']))
expect(bandeauBrouillon.find('.badge').text()).toContain('Brouillon')
// Choix : boutons épais pleine largeur ; un choix déjà essayé garde sa mention texte.
const boutons = choix.findAll('button.choix-btn')
expect(boutons.length).toBeGreaterThan(1)
```

(Si `BandeauBrouillon` n’affiche pas aujourd’hui le mot « Brouillon », l’ajouter dans un `<span class="badge badge-aide">Brouillon</span>` à côté du texte existant, sans modifier ce texte.)

Run : `npx vitest run tests/unit/refonte-mission.test.ts` → FAIL.

- [ ] **Step 2 : `MissionPage.vue`**

- `.mission-entete` en `.carte` avec le titre `h1`.
- Espacements : sections de mission en `display: grid; gap: 1rem;`.

- [ ] **Step 3 : Étapes et choix**

- `ChoixList.vue` : la liste reste `ol.liste-choix` (`list-style: none; padding: 0; display: grid; gap: .75rem;`) ; les boutons gardent `btn choix-btn` et `essaye` ; `.essaye` : `--btn-fond: var(--surface-2); --btn-texte: var(--texte-doux);` + motif hachuré de `:disabled` s’il est désactivé ; `.deja` en `font-weight: 400; font-style: italic;`. `.consigne-mode` en `.encadre encadre-info`.
- `ScenarioStep.vue`, `IndicesForm.vue`, `PourquoiForm.vue`, `MinijeuStep.vue`, `FilStep.vue` : conteneurs en `.carte`, consignes en `color: var(--texte-doux)`, cases et radios en `.option` (les `label` existants), boutons d’action dans `.actions` avec `btn-primaire` pour l’action principale (garder les noms accessibles).
- `ConsequencePanel.vue`, `ReactionPanel.vue` : remplacer les fonds codés en dur par `.encadre` + variante selon la qualité (`bon` → `encadre-bon`, `risque` → `encadre-risque`, `aide` → `encadre-aide`), en gardant l’icône et le texte du verdict ; « À retenir » / « Ce qui a marché sur toi » en `.encadre encadre-info`.
- `FinMission.vue` : en tête `<Hulotte :expression="sensible ? 'douce' : 'bravo'" :taille="120" />` (utiliser la prop/condition « sensible » existante, voir `fin-mission-sensible.test.ts`) ; badges gagnés en médailles : `.badge` agrandi (`font-size: 1em; padding: .4em .9em; border-width: 2px; box-shadow: 0 3px 0 var(--bord-fort);`) ; aucune animation (`.fete` interdite) en thème sensible ; en non sensible, une animation d’apparition ≤ 120 ms sur les médailles est permise (coupée par les règles globales).
- `SensibleAvertissement.vue` : `.encadre encadre-doux` avec `<Hulotte expression="douce" :taille="80" />` à gauche (flex, `align-items: flex-start`), texte inchangé, boutons en `.actions`.

- [ ] **Step 4 : Faux téléphone**

- `PhoneFrame.vue` : coque `background: var(--texte)` en clair n’est **pas** voulu ; coque en `var(--surface)` avec `border: 10px solid var(--texte); border-radius: 36px; box-shadow: 0 6px 0 var(--bord-fort);` en clair, et en sombre la même règle donne une coque claire sur fond sombre — acceptable et lisible. Encoche : `width: 40%; height: 1.1rem; margin: .4rem auto; border-radius: 999px; background: var(--texte);`. Écran : `background: var(--fond); color: var(--texte);`.
- `ThreadScreen.vue` : bulles reçues `background: var(--surface-2); color: var(--texte);`, bulles envoyées `background: var(--primaire); color: var(--primaire-texte);`, `border-radius: 18px` avec coin réduit (`border-bottom-left-radius: 6px` / `right`), en-tête de conversation `border-bottom: 2px solid var(--bord)`.
- `MailScreen.vue`, `WebScreen.vue`, `EcranTelephone.vue` : en-têtes en `var(--surface-2)`, barre d’adresse en `badge`-like (`border-radius: 999px; border: 1px solid var(--bord-fort); padding: .25em .8em;`), liens du faux écran en `var(--primaire)`. Les indices visuels (adresse suspecte, etc.) restent identiques en texte.

- [ ] **Step 5 : Bandeaux**

- `BandeauAide.vue` : élément racine avec `class="… encadre encadre-doux"` (garder ses classes actuelles), icône + texte inchangés, numéros (17, 3114, 3018…) en `font-weight: 700`.
- `BandeauBrouillon.vue` : racine `encadre encadre-aide` + `<span class="badge badge-aide">Brouillon</span>`.

- [ ] **Step 6 : Tests et contrôle visuel**

Retirer les 7 fichiers de `EN_ATTENTE`. Run : `npm run lint; npm run typecheck; npm test` → vert.
Contrôle visuel : `/#/mission/p-6e-colis` (situation), `/#/mission/r-6e` (fil), une mission sensible (fichier d’état + `VITE_BROUILLONS=1 npx vite --port 5199` ; trouver un identifiant de mission sensible dans `content/missions`), en 390 px clair et 1280 px sombre. Pour les étapes au-delà de la première, un petit script Playwright **dans le scratchpad** (jamais dans le dépôt) peut cliquer puis capturer.

- [ ] **Step 7 : Commit**

```bash
git add src/pages/MissionPage.vue src/mission src/phone src/ui/BandeauAide.vue src/ui/BandeauBrouillon.vue tests/unit/refonte-mission.test.ts tests/unit/styles-sans-hex.test.ts
git commit -m "feat(design): écrans de mission, faux téléphone et bandeaux"
```

(Attention : `git add src/mission` ne doit inclure que les fichiers listés dans **Files** ; ne pas toucher `CheminIle.vue`, `LieuStep.vue`, `DecorScene.vue`, qui appartiennent à T6. Vérifier avec `git status` avant de committer.)

---

### Task 5 : Mini-jeux et récupération

**Files :**
- Modify : `src/minigames/ConfidentialiteGame.vue`, `src/minigames/MotDePasseGame.vue`, `src/minigames/PermissionsGame.vue`, `src/minigames/RepereGame.vue`, `src/minigames/TriGame.vue`, `src/minigames/VerificationGame.vue`, `src/recovery/Activer2fa.vue`, `src/recovery/BloquerSignaler.vue`, `src/recovery/CapturePreuve.vue`, `src/recovery/ChangerMdp.vue`, `src/recovery/CorrigerPartage.vue`, `src/recovery/DemanderAide.vue`, `src/recovery/PrevenirContacts.vue`, `src/recovery/RetirerPublication.vue`, `src/recovery/Soutenir.vue`
- Modify : `tests/unit/styles-sans-hex.test.ts` — retirer `MotDePasseGame` et `RepereGame` de `EN_ATTENTE`
- Create : `tests/unit/refonte-minijeux.test.ts`

**Interfaces :**
- Consumes : briques et jetons de T1.

- [ ] **Step 1 : Test (échoue)**

Lire `tests/unit/motdepasse-game.test.ts` et `tests/unit/minigames.test.ts` pour la préparation. Puis `tests/unit/refonte-minijeux.test.ts` :

```ts
// Jauge du mot de passe : barre arrondie native avec libellé texte associé.
const jauge = motDePasse.find('progress.jauge')
expect(jauge.exists()).toBe(true)
const id = jauge.attributes('id')
expect(motDePasse.find(`label[for="${id}"]`).text().length).toBeGreaterThan(0)
// Le niveau est aussi donné en texte (jamais par la couleur seule).
expect(motDePasse.find('.jauge-niveau').text().length).toBeGreaterThan(0)
```

Si la jauge actuelle est un `<meter>` ou une `div`, la transformer en `<progress class="jauge" :id :value :max>` avec `<label :for>` et `<span class="jauge-niveau">{{ libellé existant }}</span>` ; garder le texte et les noms accessibles existants. Si `motdepasse-game.test.ts` cible l’ancien élément par sélecteur purement visuel, l’adapter ; sinon ne rien changer.

Run : `npx vitest run tests/unit/refonte-minijeux.test.ts` → FAIL.

- [ ] **Step 2 : Mini-jeux**

- Conteneurs en `.carte`, consignes `color: var(--texte-doux)`, actions en `.actions` (`btn-primaire` pour valider).
- Cartes à trier (`TriGame`), éléments à repérer (`RepereGame`), interrupteurs (`PermissionsGame`, `ConfidentialiteGame`), sources (`VerificationGame`) : boutons en `btn choix-btn` ou `.option` selon leur nature actuelle (bouton → `choix-btn`, label + input → `.option`) ; état sélectionné par `aria-pressed`/`:checked` (forme : barre intérieure gauche des briques) ; feedback en `.encadre` + variante de qualité, icône et texte conservés.
- Catégories du tri : colonnes en `.carte` avec titre `h3` et zone de dépôt `border: 2px dashed var(--bord-fort); border-radius: 18px; min-height: 4rem;`.
- `MotDePasseGame` : jauge (Step 1), `--accent` par niveau : faible `var(--risque)`, moyen `var(--aide)`, fort `var(--bon)` posé en style sur le `progress` (`:style="{ '--accent': … }"` avec des `var(--…)`, aucune couleur littérale).
- `RepereGame` : remplacer la couleur codée en dur (surlignage) par `background: var(--aide-fond); outline: 2px solid var(--aide);` pour un élément trouvé, + l’icône/texte existants.
- Chrono (si affiché) : `.badge` avec icône.

- [ ] **Step 3 : Récupération**

Les 9 composants : chaque étape en `.carte`, checklists en `.option`, conseils en `.encadre encadre-info`, numéros d’aide en gras, bouton principal `btn-primaire`. Thèmes sensibles (`Soutenir`, `DemanderAide`, `CapturePreuve`, `BloquerSignaler`, `RetirerPublication`) : encadrés `encadre-doux`, jamais `encadre-risque`.

- [ ] **Step 4 : Tests et contrôle visuel**

Retirer les 2 fichiers de `EN_ATTENTE`. Run : `npm run lint; npm run typecheck; npm test` → vert.
Contrôle visuel : `/#/test` liste parfois les mini-jeux ; sinon atteindre un mini-jeu par un script Playwright dans le scratchpad (cf. `jouerJusquAuMiniJeu` de `tests/e2e/helpers.ts`) en clair et sombre.

- [ ] **Step 5 : Commit**

```bash
git add src/minigames src/recovery tests/unit/refonte-minijeux.test.ts tests/unit/styles-sans-hex.test.ts
git commit -m "feat(design): mini-jeux et étapes de récupération"
```

(`src/minigames/robustesse.ts`, `src/recovery/*.ts` : ne pas modifier.)

---

### Task 6 : Parcours, enseignants, fiche, plan B

**Files :**
- Modify : `src/parcours/ChoixPersonnage.vue`, `src/parcours/ParcoursScene.vue` (panneaux autour du dessin seulement), `src/mission/CheminIle.vue`, `src/mission/LieuStep.vue`, `src/pages/EnseignantsPage.vue`, `src/pages/FicheMissionPage.vue`, `src/pages/PlanBPage.vue`, `src/styles/print.css` (vérification seulement, voir Step 4)
- Modify : `tests/unit/styles-sans-hex.test.ts` — retirer `CheminIle` de `EN_ATTENTE`
- Create : `tests/unit/refonte-parcours.test.ts`

**Interfaces :**
- Consumes : `Hulotte`, `PastilleTheme`, briques et jetons de T1. Ne pas modifier les couleurs des dessins (`DecorScene.vue`, `PersonnageG.vue`, `decors.ts`, `iles.ts`, `personnages.ts`, `fill="#…"` du template de `ParcoursScene.vue`).

- [ ] **Step 1 : Test (échoue)**

Lire `tests/unit/parcours-ui.test.ts`, `tests/unit/choix-personnage.test.ts`, `tests/unit/enseignants.test.ts`. Puis `tests/unit/refonte-parcours.test.ts` :

```ts
// Bulle du guide dans un lieu : Hulotte remplace l’icône Compass.
expect(lieu.find('.recit svg.hulotte').exists()).toBe(true)
expect(lieu.find('.recit').text().length).toBeGreaterThan(0)
// Écran « Choisis ton personnage » (si ChoixPersonnage reçoit une prop d’accueil, sinon l’écran de départ du parcours) : Hulotte « accueil ».
expect(depart.find('svg.hulotte[data-expression="accueil"]').exists()).toBe(true)
// Espace enseignant : chaque mission listée a son badge de thème.
expect(enseignants.findAll('.pastille-theme').length).toBeGreaterThan(0)
```

Run : `npx vitest run tests/unit/refonte-parcours.test.ts` → FAIL.

- [ ] **Step 2 : Parcours**

- `LieuStep.vue` : dans `.recit`, remplacer `<Compass aria-hidden="true" class="recit-icone" />` par `<Hulotte expression="reflechit" :taille="56" class="recit-icone" />` ; `.recit` devient une bulle : `.carte` + `display: flex; gap: .75rem; align-items: flex-start; border-radius: 20px 20px 20px 6px;`. Phase de réussite : expression `encourage` si une info de phase le permet (`phase !== 'situation'`), sinon garder `reflechit`. `.rester` en `.encadre encadre-info`.
- Écran de départ « Avant de partir » (là où il est rendu — chercher `Avant de partir`) : `<Hulotte expression="accueil" :taille="96" />` à côté du titre.
- `ChoixPersonnage.vue` : chaque personnage en `.option` carrée (grille `repeat(auto-fit, minmax(7rem, 1fr))`, dessin centré, nom dessous), état coché par `.option:has(input:checked)`.
- `ParcoursScene.vue` : seulement le cadre (`border-radius: var(--rayon-carte); border: 2px solid var(--bord); box-shadow: 0 4px 0 var(--bord);`), ne pas toucher au dessin.
- `CheminIle.vue` : remplacer la couleur codée en dur du `<style>` par un jeton (étape courante : `var(--primaire)`, faites : `var(--bon)`, à venir : `var(--bord-fort)`), en gardant les textes et `aria-*` existants ; étapes en pastilles rondes ≥ 44 px si cliquables, sinon ≥ 1.75rem.

- [ ] **Step 3 : Enseignants, fiche, plan B (écran)**

- `EnseignantsPage.vue` : liste des missions en tableau ou cartes `.carte` avec `PastilleTheme` (via le thème de la mission, à retrouver comme le fait déjà la page), badges `.badge` pour niveau, durée, format (« Parcours »), et `badge-aide` pour « Brouillon ».
- `FicheMissionPage.vue`, `PlanBPage.vue` : sections en `.carte`, encadrés pédagogiques en `.encadre encadre-info`, consignes sensibles en `.encadre encadre-doux`, bouton imprimer en `btn btn-primaire`.

- [ ] **Step 4 : Impression**

Lancer `npx playwright` n’est pas nécessaire : vérifier par lecture que `print.css` (dans `@media print`) neutralise `box-shadow`, `background-image`, fonds colorés des `.carte`, `.encadre`, `.badge`, `.btn`, `.option`, `.pastille-theme` (noir sur blanc, bordure fine `1px solid #000` permise dans `print.css`), masque l’en-tête et Hulotte (`.hulotte { display: none !important; }`). Compléter `print.css` si besoin. Capture d’impression : `npx playwright pdf "http://localhost:5199/#/enseignants/p-6e-colis" "$TEMP/fiche.pdf"` puis lire le PDF.

- [ ] **Step 5 : Tests et contrôle visuel**

Retirer `CheminIle` de `EN_ATTENTE`. Run : `npm run lint; npm run typecheck; npm test` → vert.
Contrôle visuel : `/#/mission/c-6e-parcours` (fichier d’état avec `personnage`), `/#/enseignants`, `/#/enseignants/p-6e-colis`, `/#/enseignants/c-6e-parcours/plan-b`, clair 390 px et sombre 1280 px.

- [ ] **Step 6 : Commit**

```bash
git add src/parcours/ChoixPersonnage.vue src/parcours/ParcoursScene.vue src/mission/CheminIle.vue src/mission/LieuStep.vue src/pages/EnseignantsPage.vue src/pages/FicheMissionPage.vue src/pages/PlanBPage.vue src/styles/print.css tests/unit/refonte-parcours.test.ts tests/unit/styles-sans-hex.test.ts
git commit -m "feat(design): parcours, espace enseignant, fiche et plan B"
```

---

### Task 7 : Mode sombre de bout en bout, animations, PWA, documentation

**Files :**
- Create : `tests/e2e/theme.spec.ts`
- Modify : `tests/unit/styles-sans-hex.test.ts` (vider `EN_ATTENTE`), `index.html`, `vite.config.ts:24-25`, `README.md`

**Interfaces :**
- Consumes : tout ce qui précède ; helpers `commencer`, `jouerMission` de `tests/e2e/helpers.ts`.

- [ ] **Step 1 : Vider la liste d’attente**

Dans `tests/unit/styles-sans-hex.test.ts` : `const EN_ATTENTE = new Set<string>([])` et retirer le commentaire « Chaque tâche d’écran… » (remplacer par « Aucun composant n’est exempté. »). Run : `npx vitest run tests/unit/styles-sans-hex.test.ts` → PASS (sinon, corriger le fichier fautif avec des jetons).

- [ ] **Step 2 : E2E thème (échoue en partie)**

`tests/e2e/theme.spec.ts` :

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { commencer, jouerMission } from './helpers'

async function verifierA11y(page: Page, ecran: string) {
  const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = resultat.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(graves.map((v) => `${ecran} — ${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([])
}

const fondSombre = 'rgb(21, 18, 38)'
const fondClair = 'rgb(255, 248, 236)'
const fondPage = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test.describe('mode sombre automatique', () => {
  test.use({ colorScheme: 'dark' })
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'audit axe exécuté une fois, sous Chromium')
  })

  test('pages élève en sombre', async ({ page }) => {
    await page.goto('/')
    expect(await fondPage(page)).toBe(fondSombre)
    await verifierA11y(page, 'accueil sombre')
    await commencer(page, '6e', 'Solo')
    await verifierA11y(page, 'carte sombre')
    await page.getByRole('link', { name: 'Le colis mystère' }).click()
    await verifierA11y(page, 'situation sombre')
    await page.locator('[data-qualite="aide"]').click()
    await verifierA11y(page, 'indices sombre')
    await page.getByRole('button', { name: 'Je ne sais pas' }).click()
    await verifierA11y(page, 'conséquence sombre')
    await jouerMission(page)
    await verifierA11y(page, 'fin de mission sombre')
  })

  for (const [nom, chemin] of [
    ['enseignants', '/#/enseignants'],
    ['fiche', '/#/enseignants/p-6e-colis'],
    ['plan B parcours', '/#/enseignants/c-6e-parcours/plan-b'],
    ['fil', '/#/mission/r-6e'],
    ['introuvable', '/#/nimporte-quoi'],
  ] as const) {
    test(`page ${nom} en sombre`, async ({ page }) => {
      await page.goto(chemin)
      await verifierA11y(page, `${nom} sombre`)
    })
  }
})

test('le réglage Thème force le clair ou le sombre et reste après rechargement', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Réglages' }).click()
  await page.getByRole('radio', { name: 'Clair', exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'clair')
  expect(await fondPage(page)).toBe(fondClair)
  await page.getByRole('radio', { name: 'Sombre', exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre')
  expect(await fondPage(page)).toBe(fondSombre)
})

test('animations désactivées : les boutons ne bougent pas', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Réglages' }).click()
  await page.getByRole('checkbox', { name: 'Animations' }).uncheck()
  const bouton = page.getByRole('button', { name: 'Réglages' })
  const duree = await bouton.evaluate((b) => getComputedStyle(b).transitionDuration)
  expect(duree.split(',').every((d) => parseFloat(d) === 0)).toBe(true)
})

test.describe('mouvement réduit demandé par l’appareil', () => {
  test.use({ reducedMotion: 'reduce' })
  test('aucune transition sur les boutons', async ({ page }) => {
    await page.goto('/')
    const duree = await page.getByRole('button', { name: 'Réglages' }).evaluate((b) => getComputedStyle(b).transitionDuration)
    expect(duree.split(',').every((d) => parseFloat(d) === 0)).toBe(true)
  })
})
```

Run : `npm run build` puis `npx playwright test tests/e2e/theme.spec.ts --project=chromium`.
Expected : les tests de réglage et d’animations passent ; si un audit axe sombre échoue, corriger la cause dans le composant concerné (jeton manquant, couleur héritée du navigateur) — jamais en désactivant une règle axe.

(Vérifier le nom accessible exact du bouton « Réglages » et de la case « Animations » dans `AppHeader.vue` / `ReglagesPanel.vue` ; le bouton reste ouvert après le clic, ce qui ne gêne pas la mesure.)

- [ ] **Step 3 : Couleurs du navigateur et de la PWA**

`index.html`, dans `<head>` :

```html
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#fff8ec" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#151226" media="(prefers-color-scheme: dark)" />
```

`vite.config.ts` : `theme_color: '#5b3df5'`, `background_color: '#fff8ec'`.

Vérifier `public/icon.svg` et `public/favicon.svg` : s’ils utilisent l’ancien violet `#3b2fc9`, le remplacer par `#5b3df5` (dessin, couleur littérale permise).

- [ ] **Step 4 : README**

Ajouter une section « Design et accessibilité » (courte) : jetons dans `src/styles/palette.ts` + `tokens.css` (modifier les deux, le test vérifie), briques de `composants.css`, Hulotte (`expression`), `PastilleTheme`, règle « pas de couleur en dur dans les `<style>` », mode sombre automatique + réglage, contrôle des contrastes par `npm test`.

- [ ] **Step 5 : Suite complète**

Run : `npm run lint; npm run typecheck; npm test; npm run build; npx playwright test`
Expected : tout vert (le test WebKit instable connu depuis l’étape 1 peut être relancé une fois ; le signaler s’il échoue).

- [ ] **Step 6 : Commit**

```bash
git add tests/e2e/theme.spec.ts tests/unit/styles-sans-hex.test.ts index.html vite.config.ts README.md public/icon.svg public/favicon.svg
git commit -m "test(design): audit axe en sombre, réglage de thème, animations coupées ; couleurs PWA ; README"
```

(Ne pas ajouter `public/*.svg` s’ils n’ont pas changé.)
