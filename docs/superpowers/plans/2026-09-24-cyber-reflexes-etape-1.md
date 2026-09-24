# Cyber Réflexes (étape 1) : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** construire le jeu web statique « Cyber Réflexes » (moteur complet, 3 modes, faux téléphone, mini-jeux, missions Rappel, espace enseignant, hors ligne) avec les 9 missions de l'étape 1, puis le déployer sur GitHub Pages.

**Architecture :** SPA Vue 3 sans back-end. Le contenu (YAML) est validé par Zod au build via un plugin Vite qui expose un module virtuel `virtual:content`. La logique de jeu est un réducteur pur (`src/engine/`), indépendant de Vue. La progression est stockée dans `localStorage` (une seule clé versionnée) à travers un store réactif. Les composants ne font qu'afficher l'état et émettre des événements.

**Tech Stack :** Vue 3.5, Vue Router 5 (hash history), TypeScript 5.9 strict + vue-tsc, Vite 8, Zod 4, yaml 2, vite-plugin-pwa 1, lucide-vue-next, @fontsource/atkinson-hyperlegible, Vitest 5 + @vue/test-utils + jsdom, Playwright + @axe-core/playwright, ESLint 10 + Prettier, GitHub Actions et Pages.

**Spec :** `docs/superpowers/specs/2026-09-24-cyber-reflexes-design.md`

## Global Constraints

- Node 22 ; TypeScript `~5.9` (**pas** TypeScript 7) ; Vue `^3.5` ; Vue Router `^5` avec `createWebHashHistory` ; Vite `^8` ; Zod `^4` ; Vitest `^5`.
- Site 100 % statique : **aucun** appel réseau externe à l'exécution, aucune police, aucun script ni aucune image depuis un CDN, aucun cookie, aucun analytics.
- Tous les textes visibles sont en français, avec l'apostrophe typographique `’` dans les chaînes d'interface.
- Faux écrans : **marques fictives uniquement** (SnapTalk, GameBox, Colis Express, StreamTube, ChatCord, Vestiaire…). Aucune marque réelle dans les champs `ecran`, `notifications`, `cartes` et `lignes`.
- Aucun temps limite obligatoire : le chrono des mini-jeux est désactivé par défaut.
- Aucun score chiffré affiché, aucun classement.
- Chaque scénario contient un choix de `qualite: aide` (« Je demande de l’aide… »).
- Accessibilité : boutons d'au moins 44 px de haut, focus visible, aucune information portée uniquement par la couleur, respect de `prefers-reduced-motion`, pas de texte justifié.
- Les fichiers de `src/content/` s'importent entre eux **uniquement par chemins relatifs**, car ils sont aussi chargés par `vite.config.ts`, qui ne connaît pas l'alias `@`.
- `localStorage` : une seule clé `cyber-reflexes:v1`, et chaque accès se fait dans un `try/catch`.
- Messages de commit au format conventionnel (`feat:`, `test:`, `chore:`…) terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Double-clic** sur un choix ou sur « Continuer » (fréquent en vidéoprojection) : le second événement arrive dans une phase où il n'a plus de sens. Il doit être ignoré, sans plantage ni étape sautée. Test ajouté à la tâche 14.
2. **Lien direct vers une mission** (`#/mission/:id`, partagé par un prof) sans niveau ni mode choisis : la mission doit se jouer en mode solo. Test ajouté à la tâche 14.
3. **Progression enregistrée qui cite des missions supprimées ou renommées** : la carte doit s'afficher normalement et ignorer ces identifiants. Test ajouté à la tâche 8.
4. **Rechargement de la page en pleine mission** : la mission recommence proprement à l'étape 1, sans état corrompu. Test ajouté à la tâche 14.
5. **Activation de la lecture simplifiée en plein scénario** : le texte bascule sans perdre la phase en cours. Test ajouté à la tâche 11.

---

## Structure des fichiers

```
.github/workflows/ci.yml            CI + déploiement Pages
content/themes.yaml                 les 8 thèmes
content/missions/<theme>/<id>.yaml  une mission par fichier
public/favicon.svg, public/icon.svg icônes
scripts/build-content.ts            lecture YAML + validation → ContentBundle (Node)
scripts/vite-plugin-content.ts      module virtuel `virtual:content`
src/main.ts, src/App.vue, src/env.d.ts
src/styles/base.css, src/styles/print.css
src/content/schema.ts               schémas Zod + types (imports relatifs !)
src/content/validate.ts             règles inter-fichiers + formatage d'erreurs
src/content/acces.ts                fonctions d'accès au contenu (pures)
src/content/index.ts                accès au contenu réel (virtual:content)
src/content/virtual.d.ts            typage du module virtuel
src/engine/mission-runner.ts        réducteur de mission (pur)
src/engine/badges.ts                calcul des badges
src/engine/rappel.ts                échéances J+7 / J+30
src/store/progress.ts               (dé)sérialisation localStorage, migrations
src/store/useProgress.ts            store réactif singleton
src/router/index.ts                 routes
src/ui/…                            en-tête, réglages, bandeau d'aide, icônes, useTexte
src/phone/…                         faux téléphone
src/recovery/…                      6 actions de récupération + registre
src/minigames/…                     TriGame, RepereGame
src/mission/…                       étapes de mission, fin de mission
src/pages/…                         pages routées
tests/unit/…                        Vitest (jsdom) ; tests/unit/node/… (Node)
tests/e2e/…                         Playwright
```

---

### Task 1 : squelette du projet (Vite + Vue + TS + outils + routeur)

**Files :**
- Create : `package.json` (via npm), `.gitignore`, `.prettierrc.json`, `eslint.config.js`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/env.d.ts`, `src/main.ts`, `src/App.vue`, `src/styles/base.css`, `src/router/index.ts`, `src/pages/AccueilPage.vue` (provisoire), `src/pages/IntrouvablePage.vue`
- Test : `tests/unit/router-test.ts`, `tests/unit/router.test.ts`

**Interfaces :**
- Produces : `routes: RouteRecordRaw[]` et `router` exportés par `src/router/index.ts` ; helper de test `routerTest(chemin?: string): Promise<Router>` ; classes CSS `.btn`, `.btn-primaire`, `.btn-danger`, `.btn-discret`, `.conteneur`, `.carte`, `.visually-hidden` ; attributs `data-taille`, `data-interligne`, `data-animations` et `data-mode` sur `<html>`, lus par le CSS.

- [ ] **Step 1 : initialiser npm et installer les dépendances**

```bash
npm init -y
npm pkg set name=cyber-reflexes private=true version=0.1.0 type=module
npm pkg delete main scripts.test keywords author license description
npm pkg set scripts.dev="vite" scripts.build="vue-tsc -b && vite build" scripts.preview="vite preview --port 4173 --strictPort" scripts.typecheck="vue-tsc -b" scripts.lint="eslint ." scripts.format="prettier --write ." scripts.test="vitest run" scripts.test:watch="vitest" scripts.test:e2e="playwright test"
npm i vue@^3.5 vue-router@^5 zod@^4 lucide-vue-next@^1 @fontsource/atkinson-hyperlegible@^5
npm i -D vite@^8 @vitejs/plugin-vue@^6 typescript@~5.9 vue-tsc@^3 @types/node@^22 yaml@^2 vitest@^5 jsdom @vue/test-utils@^2 eslint@^10 @eslint/js eslint-plugin-vue@^10 @vue/eslint-config-typescript@^14 typescript-eslint@^8 prettier@^3 eslint-config-prettier vite-plugin-pwa@^1 @playwright/test@^1.63 @axe-core/playwright@^4
```

- [ ] **Step 2 : fichiers de configuration**

`.gitignore` :
```
node_modules/
dist/
dev-dist/
playwright-report/
test-results/
*.local
.env
.DS_Store
.idea/
.vscode/
```

`.prettierrc.json` :
```json
{ "semi": false, "singleQuote": true, "printWidth": 100 }
```

`eslint.config.js` :
```js
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  { ignores: ['dist/**', 'dev-dist/**', 'playwright-report/**', 'test-results/**'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  skipFormatting,
)
```

`tsconfig.json` :
```json
{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }
```

`tsconfig.app.json` :
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "jsx": "preserve",
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vite/client"],
    "paths": { "@/*": ["./src/*"] },
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "tests/unit/**/*.ts"],
  "exclude": ["tests/unit/node/**"]
}
```

`tsconfig.node.json` :
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"],
    "paths": { "@/*": ["./src/*"] },
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo"
  },
  "include": ["vite.config.ts", "playwright.config.ts", "scripts/**/*.ts", "tests/e2e/**/*.ts", "tests/unit/node/**/*.ts"]
}
```

`vite.config.ts` :
```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
  },
})
```

- [ ] **Step 3 : écrire le test du routeur (qui doit échouer)**

`tests/unit/router-test.ts` :
```ts
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { routes } from '@/router'

export async function routerTest(chemin = '/'): Promise<Router> {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(chemin)
  await router.isReady()
  return router
}
```

`tests/unit/router.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { routerTest } from './router-test'

describe('routeur', () => {
  it('résout l’accueil', async () => {
    const router = await routerTest('/')
    expect(router.currentRoute.value.name).toBe('accueil')
  })

  it('envoie les chemins inconnus vers la page introuvable', async () => {
    const router = await routerTest('/nimporte/quoi')
    expect(router.currentRoute.value.name).toBe('introuvable')
  })
})
```

- [ ] **Step 4 : lancer le test pour vérifier qu'il échoue**

Run : `npx vitest run tests/unit/router.test.ts`
Expected : FAIL, « Failed to resolve import "@/router" »

- [ ] **Step 5 : application minimale**

`index.html` :
```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Jeu gratuit de sensibilisation aux risques numériques, de la 6e à la Terminale."
    />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>Cyber Réflexes</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/env.d.ts` :
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_URL?: string
}
```

`src/main.ts` :
```ts
import { createApp } from 'vue'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import './styles/base.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')
```

`src/App.vue` (provisoire, complété à la tâche 7) :
```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView :key="$route.fullPath" />
</template>
```

`src/styles/base.css` :
```css
:root {
  --fond: #f7f7fb;
  --surface: #ffffff;
  --texte: #1b1b2f;
  --texte-doux: #4a4a63;
  --primaire: #3b2fc9;
  --primaire-texte: #ffffff;
  --bon: #0f7a3d;
  --risque: #b3261e;
  --aide: #7a4f00;
  --bord: #c9c9d9;
  --focus: #ff9f1c;
  --rayon: 12px;
  --taille-base: 1.125rem;
  --interligne: 1.5;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  color-scheme: light;
}
:root[data-taille='grand'] { --taille-base: 1.3rem; }
:root[data-taille='tres-grand'] { --taille-base: 1.5rem; }
:root[data-interligne='large'] { --interligne: 1.9; }
:root[data-mode='classe'] { --taille-base: 1.6rem; }

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--fond);
  color: var(--texte);
  font-size: var(--taille-base);
  line-height: var(--interligne);
  text-align: left;
}
h1, h2, h3 { line-height: 1.2; }
a { color: var(--primaire); }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

.conteneur { max-width: 64rem; margin: 0 auto; padding: 1rem; }
.carte { background: var(--surface); border: 1px solid var(--bord); border-radius: var(--rayon); padding: 1rem; }
.btn {
  display: inline-flex; align-items: center; gap: 0.5em;
  min-height: 44px; padding: 0.6em 1.1em;
  border-radius: var(--rayon); border: 2px solid var(--primaire);
  background: var(--surface); color: var(--primaire);
  font: inherit; font-weight: 700; cursor: pointer; text-decoration: none;
}
.btn-primaire { background: var(--primaire); color: var(--primaire-texte); }
.btn-danger { border-color: var(--risque); color: var(--risque); }
.btn-discret { border-color: var(--bord); color: var(--texte-doux); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
.option { display: flex; align-items: center; gap: 0.5em; min-height: 44px; }
fieldset { border: 1px solid var(--bord); border-radius: var(--rayon); margin: 0 0 1rem; }
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

`src/pages/AccueilPage.vue` (provisoire, remplacé à la tâche 8) :
```vue
<template>
  <main class="conteneur"><h1>Cyber Réflexes</h1></main>
</template>
```

`src/pages/IntrouvablePage.vue` :
```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="conteneur">
    <h1>Page introuvable</h1>
    <p>Cette page n’existe pas ou plus.</p>
    <RouterLink class="btn" to="/">Retour à l’accueil</RouterLink>
  </main>
</template>
```

`src/router/index.ts` :
```ts
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AccueilPage from '@/pages/AccueilPage.vue'
import IntrouvablePage from '@/pages/IntrouvablePage.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'accueil', component: AccueilPage },
  { path: '/:chemin(.*)*', name: 'introuvable', component: IntrouvablePage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
```

- [ ] **Step 6 : vérifier tests, types, lint et build**

Run : `npx vitest run && npm run typecheck && npm run lint && npx vite build`
Expected : 2 tests PASS ; typecheck et lint sans erreur ; build OK (`dist/index.html` créé).

- [ ] **Step 7 : commit**

```bash
git add -A
git commit -m "chore: squelette Vite + Vue 3 + TypeScript, routeur et outillage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : schéma du contenu (Zod) et validation inter-fichiers

**Files :**
- Create : `src/content/schema.ts`, `src/content/validate.ts`
- Test : `tests/unit/fixtures.ts`, `tests/unit/schema.test.ts`, `tests/unit/validate.test.ts`

**Interfaces :**
- Produces (`src/content/schema.ts`) : `TRANCHES`, `Tranche`, `TRANCHE_LIBELLES`, `RECOVERY_ACTIONS`, `RecoveryAction`, `ICONES`, `FIL_ACTIONS`, `FilAction`, schémas `aideSchema`, `themeSchema`, `themesFileSchema`, `ecranSchema`, `scenarioSchema`, `triConfigSchema`, `repereConfigSchema`, `minijeuSchema`, `filSchema`, `etapeSchema`, `missionSchema` ; types `Aide`, `Theme`, `Scenario`, `TriConfig`, `RepereConfig`, `Minijeu`, `Fil`, `Etape`, `Mission`, `Qualite`, `ContentBundle { generatedAt: string; themes: Theme[]; missions: Mission[] }`.
- Produces (`src/content/validate.ts`) : `ContentIssue { fichier: string; chemin: string; message: string }`, `formatIssue(issue): string`, `zodIssues(fichier: string, error: z.ZodError): ContentIssue[]`, `validateCross(themes: Theme[], missions: { fichier: string; mission: Mission }[]): ContentIssue[]`.
- Produces (fixtures) : `rawScenario(id?)`, `rawTri()`, `rawRepere()`, `rawMission(overrides?)`, `rawRappel(overrides?)`, `rawThemes()`, `missionFixture(overrides?)`, `rappelFixture(overrides?)`, `themesFixture()`, `triFixture()`, `repereFixture()`.

- [ ] **Step 1 : fixtures de test**

`tests/unit/fixtures.ts` :
```ts
import {
  missionSchema,
  repereConfigSchema,
  themesFileSchema,
  triConfigSchema,
  type Mission,
  type RepereConfig,
  type Theme,
  type TriConfig,
} from '@/content/schema'

export function rawScenario(id = 'sc-1') {
  return {
    type: 'scenario',
    id,
    ecran: {
      app: 'sms',
      appNom: 'Messages',
      contact: 'Colis Express',
      messages: [
        {
          de: 'contact',
          texte: 'Votre colis est bloqué : payez 1,99 € sur colis-expres.info',
          texteSimple: 'Ton colis est bloqué, paie 1,99 €.',
        },
      ],
    },
    question: 'Que fais-tu ?',
    choix: [
      { id: 'clic', texte: 'Je clique et je paie', qualite: 'risque', consequence: 'La carte est volée.', consequenceSimple: 'On vole la carte.' },
      { id: 'verif', texte: 'Je vérifie sur l’appli officielle', qualite: 'bon', consequence: 'Aucun colis en attente.' },
      { id: 'aide', texte: 'Je demande de l’aide à quelqu’un', qualite: 'aide', consequence: 'Ta mère confirme : arnaque.' },
    ],
    indices: [
      { id: 'url', libelle: 'L’adresse est bizarre', pertinent: true },
      { id: 'urgence', libelle: 'On me presse', pertinent: true },
      { id: 'montant', libelle: 'Le montant est petit', pertinent: false },
    ],
    explicationIndices: 'L’adresse imite le vrai site et le message crée l’urgence.',
    aRetenir: 'Un transporteur ne demande pas de payer par SMS.',
    aRetenirSimple: 'Ne paie jamais un colis par SMS.',
    recuperation: { action: 'bloquer-signaler', siChoix: ['clic'] },
  }
}

export function rawTri() {
  return {
    consigne: 'Range chaque message.',
    categories: [
      { id: 'arnaque', libelle: 'Arnaque' },
      { id: 'ok', libelle: 'Légitime' },
    ],
    cartes: [
      { id: 'c1', texte: 'Payez 2 € pour votre colis', categorie: 'arnaque', explication: 'Faux colis.' },
      { id: 'c2', texte: 'Maman : je rentre à 19 h', categorie: 'ok', explication: 'Message normal.' },
      { id: 'c3', texte: 'Tu as gagné une console !', categorie: 'arnaque', explication: 'Faux concours.' },
      { id: 'c4', texte: 'Le collège : sortie annulée', categorie: 'ok', explication: 'Information normale.' },
    ],
  }
}

export function rawRepere() {
  return {
    consigne: 'Trouve les indices suspects.',
    titre: 'Connexion GameBox',
    lignes: [
      { id: 'l1', texte: 'Adresse : gamebox-login.xyz', indice: true, explication: 'Ce n’est pas le vrai site.' },
      { id: 'l2', texte: 'Identifiant' },
      { id: 'l3', texte: 'Offre limitée : 10 000 Coins gratuits !', indice: true, explication: 'Trop beau pour être vrai.' },
      { id: 'l4', texte: 'Mot de passe' },
    ],
  }
}

export function rawMission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm-test',
    theme: 'phishing',
    tranches: ['6e'],
    titre: 'Mission test',
    resume: 'Un résumé.',
    duree: 15,
    objectifs: ['Reconnaître un SMS piège'],
    competences: { crcn: ['4.1'] },
    etapes: [rawScenario('sc-1'), { type: 'minijeu', id: 'mj-1', jeu: 'tri', config: rawTri() }],
    debrief: { questions: ['Q1 ?', 'Q2 ?', 'Q3 ?'], reponses: 'Réponses.', erreursFrequentes: ['Erreur.'] },
    fiche: { deroulement: 'Déroulé.' },
    ...overrides,
  }
}

export function rawRappel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r-test',
    type: 'rappel',
    themesCouverts: ['phishing'],
    tranches: ['6e'],
    titre: 'Rappel test',
    resume: 'Un rappel.',
    duree: 5,
    objectifs: ['Rester vigilant'],
    competences: { crcn: ['4.1'] },
    etapes: [
      {
        type: 'fil',
        id: 'fil-1',
        consigne: 'Tu reçois ces notifications. Que fais-tu ?',
        notifications: [
          { id: 'n1', appNom: 'SnapTalk', de: 'Léa', texte: 'On se retrouve à 14 h ?', explication: 'Message normal d’une amie.' },
          { id: 'n2', appNom: 'Messages', de: 'Colis Express', texte: 'Frais de douane : payez 2,99 € ici', surprise: true, explication: 'Arnaque au faux colis.' },
          { id: 'n3', appNom: 'GameBox', de: 'GameBox', texte: 'Nouvelle saison disponible !', explication: 'Notification normale de l’appli.' },
        ],
      },
    ],
    debrief: { questions: ['Q1 ?', 'Q2 ?', 'Q3 ?'], reponses: 'Réponses.', erreursFrequentes: ['Erreur.'] },
    fiche: { deroulement: 'Déroulé.' },
    ...overrides,
  }
}

export function rawThemes() {
  return [
    { id: 'phishing', titre: 'Phishing et arnaques', description: 'Faux messages.', icone: 'Fish' },
    { id: 'jeux-achats', titre: 'Jeux et achats', description: 'Arnaques de jeux.', icone: 'Gamepad2' },
    {
      id: 'harcelement',
      titre: 'Cyberharcèlement',
      description: 'Agir face au harcèlement.',
      icone: 'Users',
      sensible: true,
      aides: [{ numero: '3018', libelle: 'Harcèlement et violences numériques', type: 'humaine' }],
    },
  ]
}

export const missionFixture = (overrides: Record<string, unknown> = {}): Mission =>
  missionSchema.parse(rawMission(overrides))
export const rappelFixture = (overrides: Record<string, unknown> = {}): Mission =>
  missionSchema.parse(rawRappel(overrides))
export const themesFixture = (): Theme[] => themesFileSchema.parse(rawThemes())
export const triFixture = (): TriConfig => triConfigSchema.parse(rawTri())
export const repereFixture = (): RepereConfig => repereConfigSchema.parse(rawRepere())
```

- [ ] **Step 2 : écrire les tests du schéma (qui doivent échouer)**

`tests/unit/schema.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { missionSchema } from '@/content/schema'
import { rawMission, rawRappel, rawScenario } from './fixtures'

function problemes(raw: unknown) {
  const res = missionSchema.safeParse(raw)
  return res.success ? [] : res.error.issues.map((i) => ({ chemin: i.path.join('.'), message: i.message }))
}

describe('missionSchema', () => {
  it('accepte une mission valide et applique les valeurs par défaut', () => {
    const m = missionSchema.parse(rawMission())
    expect(m.type).toBe('mission')
    const sc = m.etapes[0]
    expect(sc?.type === 'scenario' && sc.role).toBeNull()
    expect(m.competences.phare).toBe(false)
  })

  it('exige un choix de qualité "aide" dans chaque scénario', () => {
    const sc = rawScenario()
    sc.choix = sc.choix.filter((c) => c.qualite !== 'aide')
    expect(problemes(rawMission({ etapes: [sc] }))).toContainEqual(
      expect.objectContaining({ chemin: 'etapes.0.choix' }),
    )
  })

  it('exige au moins un indice pertinent', () => {
    const sc = rawScenario()
    sc.indices = sc.indices.map((i) => ({ ...i, pertinent: false }))
    expect(problemes(rawMission({ etapes: [sc] }))).toContainEqual(
      expect.objectContaining({ chemin: 'etapes.0.indices' }),
    )
  })

  it('refuse une récupération liée à un choix inconnu ou au choix "aide"', () => {
    const inconnu = { ...rawScenario(), recuperation: { action: 'bloquer-signaler', siChoix: ['zzz'] } }
    expect(problemes(rawMission({ etapes: [inconnu] }))).toContainEqual(
      expect.objectContaining({ chemin: 'etapes.0.recuperation.siChoix.0', message: 'choix inconnu : zzz' }),
    )
    const aide = { ...rawScenario(), recuperation: { action: 'bloquer-signaler', siChoix: ['aide'] } }
    expect(problemes(rawMission({ etapes: [aide] }))).toContainEqual(
      expect.objectContaining({ chemin: 'etapes.0.recuperation.siChoix.0' }),
    )
  })

  it('limite à 3 objectifs', () => {
    expect(problemes(rawMission({ objectifs: ['a', 'b', 'c', 'd'] }))).toContainEqual(
      expect.objectContaining({ chemin: 'objectifs', message: '3 objectifs maximum par mission' }),
    )
  })

  it('refuse deux étapes avec le même identifiant', () => {
    expect(problemes(rawMission({ etapes: [rawScenario('x'), rawScenario('x')] }))).toContainEqual(
      expect.objectContaining({ chemin: 'etapes.1.id', message: 'étape en double : x' }),
    )
  })

  it('valide la config du mini-jeu tri (catégorie inconnue)', () => {
    const m = rawMission()
    const tri = m.etapes[1] as { config: { cartes: { categorie: string }[] } }
    tri.config.cartes[0]!.categorie = 'inconnue'
    expect(problemes(m)).toContainEqual(
      expect.objectContaining({ chemin: 'etapes.1.config.cartes.0.categorie' }),
    )
  })

  it('exige une explication pour chaque ligne indice du mini-jeu repère', () => {
    const repere = {
      type: 'minijeu',
      id: 'mj-r',
      jeu: 'repere',
      config: { consigne: 'c', titre: 't', lignes: [{ id: 'a', texte: 'A', indice: true }, { id: 'b', texte: 'B' }, { id: 'c', texte: 'C' }] },
    }
    expect(problemes(rawMission({ etapes: [repere] }))).toContainEqual(
      expect.objectContaining({ chemin: 'etapes.0.config.lignes.0.explication' }),
    )
  })

  it('exige un thème pour une mission classique', () => {
    const m: Record<string, unknown> = rawMission()
    delete m.theme
    expect(problemes(m)).toContainEqual(expect.objectContaining({ chemin: 'theme' }))
  })

  it('exige exactement une notification surprise dans une mission rappel', () => {
    expect(problemes(rawRappel())).toEqual([])
    const sans = rawRappel()
    sans.etapes[0]!.notifications = sans.etapes[0]!.notifications.map((n) => ({ ...n, surprise: false }))
    expect(problemes(sans)).toContainEqual(expect.objectContaining({ chemin: 'etapes' }))
    const deux = rawRappel()
    deux.etapes[0]!.notifications = deux.etapes[0]!.notifications.map((n) => ({ ...n, surprise: true }))
    expect(problemes(deux)).toContainEqual(expect.objectContaining({ chemin: 'etapes' }))
  })

  it('exige les thèmes couverts dans une mission rappel', () => {
    expect(problemes(rawRappel({ themesCouverts: [] }))).toContainEqual(
      expect.objectContaining({ chemin: 'themesCouverts' }),
    )
  })
})
```

`tests/unit/validate.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { missionSchema } from '@/content/schema'
import { formatIssue, validateCross, zodIssues } from '@/content/validate'
import { missionFixture, themesFixture } from './fixtures'

describe('validateCross', () => {
  const themes = themesFixture()

  it('ne signale rien pour un contenu cohérent', () => {
    expect(validateCross(themes, [{ fichier: 'a.yaml', mission: missionFixture() }])).toEqual([])
  })

  it('signale un thème inconnu', () => {
    const issues = validateCross(themes, [{ fichier: 'a.yaml', mission: missionFixture({ theme: 'inconnu' }) }])
    expect(issues).toEqual([{ fichier: 'a.yaml', chemin: 'theme', message: 'thème inconnu : inconnu' }])
  })

  it('signale un identifiant de mission utilisé deux fois', () => {
    const issues = validateCross(themes, [
      { fichier: 'a.yaml', mission: missionFixture() },
      { fichier: 'b.yaml', mission: missionFixture() },
    ])
    expect(issues).toEqual([{ fichier: 'b.yaml', chemin: 'id', message: 'identifiant déjà utilisé dans a.yaml' }])
  })

  it('exige fiche.siRevelation pour un thème sensible', () => {
    const issues = validateCross(themes, [{ fichier: 'a.yaml', mission: missionFixture({ theme: 'harcelement' }) }])
    expect(issues).toEqual([
      { fichier: 'a.yaml', chemin: 'fiche.siRevelation', message: 'obligatoire pour un thème sensible' },
    ])
  })
})

describe('formatage des erreurs', () => {
  it('indique fichier, chemin et message', () => {
    const res = missionSchema.safeParse({})
    if (res.success) throw new Error('devrait échouer')
    const [premiere] = zodIssues('missions/x.yaml', res.error)
    expect(formatIssue(premiere!)).toMatch(/^missions\/x\.yaml › \S+ : .+/)
    expect(formatIssue({ fichier: 'f', chemin: '', message: 'm' })).toBe('f › (racine) : m')
  })
})
```

- [ ] **Step 3 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/schema.test.ts tests/unit/validate.test.ts`
Expected : FAIL, « Failed to resolve import "@/content/schema" »

- [ ] **Step 4 : implémenter le schéma**

`src/content/schema.ts` :
```ts
import { z } from 'zod'

export const TRANCHES = ['6e', '5e-3e', 'lycee'] as const
export const trancheSchema = z.enum(TRANCHES)
export type Tranche = z.infer<typeof trancheSchema>
export const TRANCHE_LIBELLES: Record<Tranche, string> = { '6e': '6e', '5e-3e': '5e – 3e', lycee: 'Lycée' }

export const RECOVERY_ACTIONS = [
  'bloquer-signaler',
  'changer-mdp',
  'activer-2fa',
  'capture-preuve',
  'prevenir-contacts',
  'demander-aide',
] as const
export type RecoveryAction = (typeof RECOVERY_ACTIONS)[number]

export const ICONES = ['Fish', 'KeyRound', 'Eye', 'Users', 'Gamepad2', 'HeartHandshake', 'Newspaper', 'Wifi'] as const

export const FIL_ACTIONS = ['ouvrir', 'verifier', 'signaler', 'ignorer'] as const
export type FilAction = (typeof FIL_ACTIONS)[number]

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'identifiant attendu en minuscules-avec-tirets')
const texte = z.string().trim().min(1, 'texte vide')

function idsUniques<T>(ids: string[], ctx: z.RefinementCtx<T>, chemin: (string | number)[], quoi: string) {
  const vus = new Set<string>()
  ids.forEach((id, i) => {
    if (vus.has(id)) ctx.addIssue({ code: 'custom', message: `${quoi} en double : ${id}`, path: [...chemin, i, 'id'] })
    vus.add(id)
  })
}

export const aideSchema = z.object({
  numero: texte,
  libelle: texte,
  type: z.enum(['humaine', 'urgence', 'signalement', 'technique']),
})

export const themeSchema = z.object({
  id: slug,
  titre: texte,
  description: texte,
  icone: z.enum(ICONES),
  sensible: z.boolean().default(false),
  aides: z.array(aideSchema).default([]),
})

export const themesFileSchema = z
  .array(themeSchema)
  .min(1)
  .superRefine((themes, ctx) => idsUniques(themes.map((t) => t.id), ctx, [], 'thème'))

const messageSchema = z.object({
  de: z.enum(['contact', 'moi']),
  texte,
  texteSimple: texte.optional(),
})

export const ecranSchema = z.object({
  app: z.enum(['sms', 'chat', 'social', 'mail', 'web']),
  appNom: texte,
  contact: texte,
  sujet: texte.optional(),
  url: texte.optional(),
  messages: z.array(messageSchema).min(1),
})

const choixSchema = z.object({
  id: slug,
  texte,
  qualite: z.enum(['bon', 'risque', 'aide']),
  consequence: texte,
  consequenceSimple: texte.optional(),
})

const indiceSchema = z.object({ id: slug, libelle: texte, pertinent: z.boolean() })

export const scenarioSchema = z
  .object({
    type: z.literal('scenario'),
    id: slug,
    role: z.enum(['victime', 'temoin', 'auteur']).nullable().default(null),
    ecran: ecranSchema,
    question: texte,
    choix: z.array(choixSchema).min(2).max(4),
    indices: z.array(indiceSchema).min(2),
    explicationIndices: texte,
    aRetenir: texte,
    aRetenirSimple: texte.optional(),
    recuperation: z.object({ action: z.enum(RECOVERY_ACTIONS), siChoix: z.array(slug).min(1) }).optional(),
  })
  .superRefine((s, ctx) => {
    idsUniques(s.choix.map((c) => c.id), ctx, ['choix'], 'choix')
    idsUniques(s.indices.map((i) => i.id), ctx, ['indices'], 'indice')
    if (!s.choix.some((c) => c.qualite === 'aide')) {
      ctx.addIssue({ code: 'custom', path: ['choix'], message: 'il faut un choix de qualité "aide" (Je demande de l’aide…)' })
    }
    if (!s.indices.some((i) => i.pertinent)) {
      ctx.addIssue({ code: 'custom', path: ['indices'], message: 'il faut au moins un indice pertinent' })
    }
    s.recuperation?.siChoix.forEach((id, i) => {
      const choix = s.choix.find((c) => c.id === id)
      if (!choix) {
        ctx.addIssue({ code: 'custom', path: ['recuperation', 'siChoix', i], message: `choix inconnu : ${id}` })
      } else if (choix.qualite === 'aide') {
        ctx.addIssue({ code: 'custom', path: ['recuperation', 'siChoix', i], message: 'la récupération ne peut pas suivre le choix "aide"' })
      }
    })
  })

export const triConfigSchema = z
  .object({
    consigne: texte,
    categories: z.array(z.object({ id: slug, libelle: texte })).min(2).max(3),
    cartes: z.array(z.object({ id: slug, texte, categorie: slug, explication: texte })).min(4),
  })
  .superRefine((c, ctx) => {
    idsUniques(c.cartes.map((x) => x.id), ctx, ['cartes'], 'carte')
    c.cartes.forEach((carte, i) => {
      if (!c.categories.some((cat) => cat.id === carte.categorie)) {
        ctx.addIssue({ code: 'custom', path: ['cartes', i, 'categorie'], message: `catégorie inconnue : ${carte.categorie}` })
      }
    })
  })

export const repereConfigSchema = z
  .object({
    consigne: texte,
    titre: texte,
    lignes: z
      .array(z.object({ id: slug, texte, indice: z.boolean().default(false), explication: texte.optional() }))
      .min(3),
  })
  .superRefine((c, ctx) => {
    idsUniques(c.lignes.map((l) => l.id), ctx, ['lignes'], 'ligne')
    if (!c.lignes.some((l) => l.indice)) {
      ctx.addIssue({ code: 'custom', path: ['lignes'], message: 'il faut au moins une ligne indice' })
    }
    c.lignes.forEach((l, i) => {
      if (l.indice && !l.explication) {
        ctx.addIssue({ code: 'custom', path: ['lignes', i, 'explication'], message: 'une ligne indice doit avoir une explication' })
      }
    })
  })

export const minijeuSchema = z.discriminatedUnion('jeu', [
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('tri'), config: triConfigSchema }),
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('repere'), config: repereConfigSchema }),
])

export const filSchema = z
  .object({
    type: z.literal('fil'),
    id: slug,
    consigne: texte,
    notifications: z
      .array(
        z.object({
          id: slug,
          appNom: texte,
          de: texte,
          texte,
          surprise: z.boolean().default(false),
          explication: texte,
        }),
      )
      .min(3),
  })
  .superRefine((f, ctx) => idsUniques(f.notifications.map((n) => n.id), ctx, ['notifications'], 'notification'))

export const etapeSchema = z.discriminatedUnion('type', [scenarioSchema, minijeuSchema, filSchema])

export const missionSchema = z
  .object({
    id: slug,
    type: z.enum(['mission', 'rappel']).default('mission'),
    theme: slug.optional(),
    themesCouverts: z.array(slug).optional(),
    tranches: z.array(trancheSchema).min(1),
    titre: texte,
    resume: texte,
    duree: z.number().int().min(3).max(25),
    objectifs: z.array(texte).min(1).max(3, '3 objectifs maximum par mission'),
    competences: z.object({
      crcn: z.array(z.string().regex(/^[1-5]\.[1-4]$/, 'compétence CRCN attendue, ex. "4.1"')).min(1),
      programmes: z.array(texte).default([]),
      phare: z.boolean().default(false),
    }),
    etapes: z.array(etapeSchema).min(1),
    debrief: z.object({
      questions: z.array(texte).length(3),
      reponses: texte,
      erreursFrequentes: z.array(texte).min(1),
    }),
    fiche: z.object({ deroulement: texte, siRevelation: texte.optional() }),
  })
  .superRefine((m, ctx) => {
    idsUniques(m.etapes.map((e) => e.id), ctx, ['etapes'], 'étape')
    if (m.type === 'mission') {
      if (!m.theme) ctx.addIssue({ code: 'custom', path: ['theme'], message: 'une mission doit avoir un thème' })
      return
    }
    if (!m.themesCouverts?.length) {
      ctx.addIssue({ code: 'custom', path: ['themesCouverts'], message: 'une mission rappel doit lister les thèmes couverts' })
    }
    const surprises = m.etapes.flatMap((e) => (e.type === 'fil' ? e.notifications.filter((n) => n.surprise) : []))
    if (surprises.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['etapes'],
        message: `une mission rappel doit contenir exactement une notification surprise (trouvé : ${surprises.length})`,
      })
    }
  })

export type Aide = z.infer<typeof aideSchema>
export type Theme = z.infer<typeof themeSchema>
export type Scenario = z.infer<typeof scenarioSchema>
export type TriConfig = z.infer<typeof triConfigSchema>
export type RepereConfig = z.infer<typeof repereConfigSchema>
export type Minijeu = z.infer<typeof minijeuSchema>
export type Fil = z.infer<typeof filSchema>
export type Etape = z.infer<typeof etapeSchema>
export type Mission = z.infer<typeof missionSchema>
export type Qualite = Scenario['choix'][number]['qualite']

export interface ContentBundle {
  generatedAt: string
  themes: Theme[]
  missions: Mission[]
}
```

`src/content/validate.ts` (imports **relatifs** uniquement) :
```ts
import type { z } from 'zod'
import type { Mission, Theme } from './schema'

export interface ContentIssue {
  fichier: string
  chemin: string
  message: string
}

export function formatIssue(issue: ContentIssue): string {
  return `${issue.fichier} › ${issue.chemin || '(racine)'} : ${issue.message}`
}

export function zodIssues(fichier: string, error: z.ZodError): ContentIssue[] {
  return error.issues.map((i) => ({ fichier, chemin: i.path.map(String).join('.'), message: i.message }))
}

export function validateCross(themes: Theme[], missions: { fichier: string; mission: Mission }[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const themesParId = new Map(themes.map((t) => [t.id, t]))
  const fichierParId = new Map<string, string>()

  for (const { fichier, mission } of missions) {
    const autre = fichierParId.get(mission.id)
    if (autre) issues.push({ fichier, chemin: 'id', message: `identifiant déjà utilisé dans ${autre}` })
    else fichierParId.set(mission.id, fichier)

    if (mission.theme && !themesParId.has(mission.theme)) {
      issues.push({ fichier, chemin: 'theme', message: `thème inconnu : ${mission.theme}` })
    }
    mission.themesCouverts?.forEach((id, i) => {
      if (!themesParId.has(id)) issues.push({ fichier, chemin: `themesCouverts.${i}`, message: `thème inconnu : ${id}` })
    })
    const theme = mission.theme ? themesParId.get(mission.theme) : undefined
    if (theme?.sensible && !mission.fiche.siRevelation) {
      issues.push({ fichier, chemin: 'fiche.siRevelation', message: 'obligatoire pour un thème sensible' })
    }
  }
  return issues
}
```

- [ ] **Step 5 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/schema.test.ts tests/unit/validate.test.ts && npm run typecheck`
Expected : tous PASS, typecheck OK.

- [ ] **Step 6 : commit**

```bash
git add -A
git commit -m "feat(contenu): schéma Zod des missions et validation inter-fichiers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : compilation du contenu YAML et module virtuel

**Files :**
- Create : `scripts/build-content.ts`, `scripts/vite-plugin-content.ts`, `src/content/acces.ts`, `src/content/index.ts`, `src/content/virtual.d.ts`, `content/themes.yaml`, `content/missions/.gitkeep`
- Modify : `vite.config.ts` (ajout du plugin)
- Test : `tests/unit/node/build-content.test.ts`, `tests/unit/acces.test.ts`

**Interfaces :**
- Consumes : `missionSchema`, `themesFileSchema`, `ContentBundle` (tâche 2) ; `validateCross`, `zodIssues`, `formatIssue`, `ContentIssue` (tâche 2).
- Produces : `buildContent(racine: string, maintenant?: Date): ContentBundle` (lève `ContentError`) ; `listContentFiles(racine: string): string[]` ; `class ContentError extends Error { issues: ContentIssue[] }` ; `contentPlugin(dossier?: string): Plugin` ; `creerAcces(bundle: ContentBundle)`, qui renvoie `{ contenu, getThemes, getTheme, getMission, missionsPour, rappelPour, toutesLesMissions }` ; `src/content/index.ts` réexporte ces fonctions, liées au contenu réel.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/node/build-content.test.ts` :
```ts
// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { buildContent, ContentError, listContentFiles } from '../../../scripts/build-content'
import { rawMission, rawThemes } from '../fixtures'

function dossier(missions: Record<string, string>, themes = stringify(rawThemes())) {
  const racine = mkdtempSync(join(tmpdir(), 'cr-contenu-'))
  writeFileSync(join(racine, 'themes.yaml'), themes)
  for (const [chemin, texte] of Object.entries(missions)) {
    const complet = join(racine, 'missions', chemin)
    mkdirSync(join(complet, '..'), { recursive: true })
    writeFileSync(complet, texte)
  }
  return racine
}

function erreur(fn: () => unknown): ContentError {
  try {
    fn()
  } catch (e) {
    if (e instanceof ContentError) return e
    throw e
  }
  throw new Error('aucune erreur levée')
}

describe('buildContent', () => {
  it('compile un dossier valide', () => {
    const racine = dossier({ 'phishing/m.yaml': stringify(rawMission()) })
    const bundle = buildContent(racine, new Date('2026-09-01T10:00:00Z'))
    expect(bundle.generatedAt).toBe('2026-09-01T10:00:00.000Z')
    expect(bundle.themes.map((t) => t.id)).toEqual(['phishing', 'jeux-achats', 'harcelement'])
    expect(bundle.missions.map((m) => m.id)).toEqual(['m-test'])
  })

  it('rejette une mission invalide en indiquant fichier et champ', () => {
    const m = rawMission()
    ;(m.etapes[0] as { choix: unknown[] }).choix = []
    const racine = dossier({ 'phishing/m.yaml': stringify(m) })
    const e = erreur(() => buildContent(racine))
    expect(e.message).toContain('missions/phishing/m.yaml › etapes.0.choix')
  })

  it('signale un YAML illisible', () => {
    const racine = dossier({ 'phishing/m.yaml': 'id: [pas fermé' })
    expect(erreur(() => buildContent(racine)).message).toContain('YAML illisible')
  })

  it('applique les règles inter-fichiers', () => {
    const racine = dossier({ 'x/m.yaml': stringify(rawMission({ theme: 'inconnu' })) })
    expect(erreur(() => buildContent(racine)).message).toContain('thème inconnu : inconnu')
  })

  it('liste themes.yaml et tous les YAML des missions', () => {
    const racine = dossier({ 'a/m1.yaml': stringify(rawMission()), 'b/m2.yml': 'x: 1', 'b/notes.txt': 'rien' })
    const fichiers = listContentFiles(racine).map((f) => f.slice(racine.length + 1).replaceAll('\\', '/'))
    expect(fichiers).toEqual(['themes.yaml', 'missions/a/m1.yaml', 'missions/b/m2.yml'])
  })

  it('compile le vrai dossier content/', () => {
    const bundle = buildContent(join(process.cwd(), 'content'))
    expect(bundle.themes).toHaveLength(8)
  })
})
```

`tests/unit/acces.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { creerAcces } from '@/content/acces'
import { missionFixture, rappelFixture, themesFixture } from './fixtures'

const acces = creerAcces({
  generatedAt: '2026-09-01T10:00:00.000Z',
  themes: themesFixture(),
  missions: [missionFixture(), missionFixture({ id: 'm-lycee', tranches: ['lycee'] }), rappelFixture()],
})

describe('creerAcces', () => {
  it('filtre les missions par tranche et par thème, sans les rappels', () => {
    expect(acces.missionsPour('6e', 'phishing').map((m) => m.id)).toEqual(['m-test'])
    expect(acces.missionsPour('lycee', 'phishing').map((m) => m.id)).toEqual(['m-lycee'])
    expect(acces.missionsPour('6e', 'jeux-achats')).toEqual([])
  })

  it('trouve le rappel de la tranche', () => {
    expect(acces.rappelPour('6e')?.id).toBe('r-test')
    expect(acces.rappelPour('lycee')).toBeUndefined()
  })

  it('trouve missions et thèmes par identifiant', () => {
    expect(acces.getMission('m-test')?.titre).toBe('Mission test')
    expect(acces.getMission('absente')).toBeUndefined()
    expect(acces.getTheme('harcelement')?.sensible).toBe(true)
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/node/build-content.test.ts tests/unit/acces.test.ts`
Expected : FAIL, modules `scripts/build-content` et `@/content/acces` introuvables.

- [ ] **Step 3 : implémenter la compilation**

`scripts/build-content.ts` :
```ts
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'
import { missionSchema, themesFileSchema, type ContentBundle, type Mission } from '../src/content/schema'
import { formatIssue, validateCross, zodIssues, type ContentIssue } from '../src/content/validate'

export class ContentError extends Error {
  constructor(public readonly issues: ContentIssue[]) {
    super(`Contenu invalide (${issues.length} problème(s)) :\n${issues.map((i) => `  - ${formatIssue(i)}`).join('\n')}`)
    this.name = 'ContentError'
  }
}

function listerYaml(dossier: string): string[] {
  return readdirSync(dossier)
    .sort()
    .flatMap((nom) => {
      const chemin = join(dossier, nom)
      if (statSync(chemin).isDirectory()) return listerYaml(chemin)
      return /\.ya?ml$/.test(nom) ? [chemin] : []
    })
}

export function listContentFiles(racine: string): string[] {
  const missions = join(racine, 'missions')
  return [join(racine, 'themes.yaml'), ...(existsSync(missions) ? listerYaml(missions) : [])]
}

const nomRelatif = (racine: string, chemin: string) => relative(racine, chemin).replaceAll('\\', '/')

function lireYaml(racine: string, chemin: string, issues: ContentIssue[]): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: parse(readFileSync(chemin, 'utf8')) }
  } catch (e) {
    issues.push({ fichier: nomRelatif(racine, chemin), chemin: '', message: `YAML illisible : ${(e as Error).message}` })
    return { ok: false }
  }
}

export function buildContent(racine: string, maintenant: Date = new Date()): ContentBundle {
  const issues: ContentIssue[] = []
  const [cheminThemes, ...cheminsMissions] = listContentFiles(racine)

  let themes: ContentBundle['themes'] = []
  const lecture = lireYaml(racine, cheminThemes!, issues)
  if (lecture.ok) {
    const res = themesFileSchema.safeParse(lecture.data)
    if (res.success) themes = res.data
    else issues.push(...zodIssues('themes.yaml', res.error))
  }

  const missions: { fichier: string; mission: Mission }[] = []
  for (const chemin of cheminsMissions) {
    const fichier = nomRelatif(racine, chemin)
    const brut = lireYaml(racine, chemin, issues)
    if (!brut.ok) continue
    const res = missionSchema.safeParse(brut.data)
    if (res.success) missions.push({ fichier, mission: res.data })
    else issues.push(...zodIssues(fichier, res.error))
  }

  if (themes.length) issues.push(...validateCross(themes, missions))
  if (issues.length) throw new ContentError(issues)
  return { generatedAt: maintenant.toISOString(), themes, missions: missions.map((m) => m.mission) }
}
```

`scripts/vite-plugin-content.ts` :
```ts
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { buildContent, listContentFiles } from './build-content'

const ID_VIRTUEL = 'virtual:content'
const ID_RESOLU = '\0' + ID_VIRTUEL

/** Expose le contenu validé via `import contenu from 'virtual:content'`.
 *  En dev, modifier un YAML recharge la page ; ajouter un fichier demande de relancer `npm run dev`. */
export function contentPlugin(dossier = resolve(process.cwd(), 'content')): Plugin {
  return {
    name: 'cyber-reflexes-contenu',
    resolveId(id) {
      return id === ID_VIRTUEL ? ID_RESOLU : undefined
    },
    load(id) {
      if (id !== ID_RESOLU) return undefined
      for (const fichier of listContentFiles(dossier)) this.addWatchFile(fichier)
      return `export default ${JSON.stringify(buildContent(dossier))}`
    },
  }
}
```

`src/content/virtual.d.ts` :
```ts
declare module 'virtual:content' {
  const contenu: import('./schema').ContentBundle
  export default contenu
}
```

`src/content/acces.ts` :
```ts
import type { ContentBundle, Tranche } from './schema'

export function creerAcces(bundle: ContentBundle) {
  return {
    contenu: bundle,
    getThemes: () => bundle.themes,
    getTheme: (id: string) => bundle.themes.find((t) => t.id === id),
    getMission: (id: string) => bundle.missions.find((m) => m.id === id),
    missionsPour: (tranche: Tranche, themeId: string) =>
      bundle.missions.filter((m) => m.type === 'mission' && m.theme === themeId && m.tranches.includes(tranche)),
    rappelPour: (tranche: Tranche) => bundle.missions.find((m) => m.type === 'rappel' && m.tranches.includes(tranche)),
    toutesLesMissions: () => bundle.missions,
  }
}
```

`src/content/index.ts` :
```ts
import bundle from 'virtual:content'
import { creerAcces } from './acces'

export const { contenu, getThemes, getTheme, getMission, missionsPour, rappelPour, toutesLesMissions } =
  creerAcces(bundle)
```

Dans `vite.config.ts`, ajouter l'import et le plugin :
```ts
import { contentPlugin } from './scripts/vite-plugin-content'
// …
  plugins: [vue(), contentPlugin()],
```

Créer `content/missions/.gitkeep` (fichier vide).

`content/themes.yaml` :
```yaml
- id: phishing
  titre: Phishing et arnaques
  description: Faux SMS, faux mails, faux concours. Apprends à repérer les pièges avant de cliquer.
  icone: Fish
- id: comptes
  titre: Mots de passe et comptes
  description: Protéger ses comptes, créer un bon mot de passe, activer la double authentification.
  icone: KeyRound
- id: vie-privee
  titre: Réseaux sociaux et vie privée
  description: Ce que révèlent tes photos et ton profil, et comment garder le contrôle.
  icone: Eye
- id: harcelement
  titre: Cyberharcèlement
  description: Que faire quand on est visé, témoin, ou quand on a dérapé.
  icone: Users
  sensible: true
  aides:
    - { numero: '3018', libelle: 'Harcèlement, chantage, photo diffusée : appel, tchat ou appli, gratuit et confidentiel, 7 j/7 de 9 h à 23 h', type: humaine }
    - { numero: '119', libelle: 'Enfance en danger : si un mineur est en danger ou risque de l’être', type: humaine }
    - { numero: '17 ou 112', libelle: 'Danger immédiat : police ou gendarmerie', type: urgence }
    - { numero: '114', libelle: 'Urgence par SMS (personnes sourdes ou malentendantes)', type: urgence }
    - { numero: 'PHAROS', libelle: 'Signaler un contenu illégal en ligne : internet-signalement.gouv.fr', type: signalement }
- id: jeux-achats
  titre: Jeux vidéo et achats en ligne
  description: Faux générateurs, vols de comptes, arnaques entre particuliers.
  icone: Gamepad2
- id: rencontres
  titre: Rencontres en ligne
  description: Inconnus trop gentils, demandes de photos, chantage. Savoir dire stop et demander de l’aide.
  icone: HeartHandshake
  sensible: true
  aides:
    - { numero: '3018', libelle: 'Chantage, photo intime diffusée, contact inquiétant : gratuit et confidentiel, 7 j/7 de 9 h à 23 h', type: humaine }
    - { numero: '119', libelle: 'Enfance en danger : si un mineur est en danger ou risque de l’être', type: humaine }
    - { numero: '17 ou 112', libelle: 'Danger immédiat : police ou gendarmerie', type: urgence }
    - { numero: '114', libelle: 'Urgence par SMS (personnes sourdes ou malentendantes)', type: urgence }
    - { numero: 'PHAROS', libelle: 'Signaler un contenu illégal en ligne : internet-signalement.gouv.fr', type: signalement }
- id: desinformation
  titre: Fake news et deepfakes
  description: Vérifier une info, repérer une image truquée ou générée par IA.
  icone: Newspaper
- id: appareils
  titre: Wi-Fi, applis et mises à jour
  description: Wi-Fi public, permissions des applis, logiciels piratés.
  icone: Wifi
```

- [ ] **Step 4 : lancer les tests et le build**

Run : `npx vitest run && npm run typecheck && npx vite build`
Expected : tous les tests PASS, dont « compile le vrai dossier content/ » ; build OK.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(contenu): compilation YAML validée au build et module virtual:content

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : moteur de mission (réducteur pur)

**Files :**
- Create : `src/engine/mission-runner.ts`
- Test : `tests/unit/mission-runner.test.ts`

**Interfaces :**
- Consumes : `Mission`, `Etape`, `FilAction`, `Qualite` (tâche 2).
- Produces :
  - types `PhaseScenario = 'situation' | 'indices' | 'consequence' | 'recuperation'`, `SurpriseResultat = 'verifie' | 'ignore' | 'signale' | 'piege'`, `ScenarioResultat`, `MinijeuResultat`, `FilResultat`, `EtapeResultat`, `RunState { index; phase; choixId; resultats; termine }`, `RunEvent` (voir le code)
  - `class RunError extends Error`
  - `demarrer(mission): RunState`, `etapeCourante(mission, etat): Etape | null`, `reduire(mission, etat, evenement): RunState` (lève `RunError` si l'événement est impossible dans la phase courante), `surpriseResultat(action: FilAction): SurpriseResultat`, `resultatSurprise(etat): SurpriseResultat | null`, `choixDuRun(etat): Record<string, string>`

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/mission-runner.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import {
  choixDuRun,
  demarrer,
  etapeCourante,
  reduire,
  resultatSurprise,
  RunError,
  type RunEvent,
  type RunState,
} from '@/engine/mission-runner'
import type { Mission } from '@/content/schema'
import { missionFixture, rappelFixture } from './fixtures'

const jouer = (m: Mission, ...evenements: RunEvent[]): RunState =>
  evenements.reduce((etat, ev) => reduire(m, etat, ev), demarrer(m))

describe('mission-runner', () => {
  const m = missionFixture()

  it('démarre sur la situation du premier scénario', () => {
    const etat = demarrer(m)
    expect(etat).toMatchObject({ index: 0, phase: 'situation', termine: false })
    expect(etapeCourante(m, etat)?.id).toBe('sc-1')
  })

  it('enchaîne choix → indices → conséquence → étape suivante', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'verif' },
      { type: 'valider-indices', indices: ['url', 'montant'] },
    )
    expect(etat.phase).toBe('consequence')
    expect(etat.resultats['sc-1']).toEqual({
      type: 'scenario',
      choixId: 'verif',
      qualite: 'bon',
      indicesChoisis: ['url', 'montant'],
      indicesJustes: 1,
      indicesFaux: 1,
      recuperationFaite: null,
      passe: false,
    })
    const suite = reduire(m, etat, { type: 'continuer' })
    expect(suite).toMatchObject({ index: 1, phase: null, choixId: null })
    expect(etapeCourante(m, suite)?.type).toBe('minijeu')
  })

  it('impose la récupération après un choix risqué qui la prévoit', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'valider-indices', indices: [] },
      { type: 'continuer' },
    )
    expect(etat.phase).toBe('recuperation')
    expect(etat.resultats['sc-1']).toMatchObject({ recuperationFaite: false })
    const suite = reduire(m, etat, { type: 'recuperation-faite' })
    expect(suite.index).toBe(1)
    expect(suite.resultats['sc-1']).toMatchObject({ recuperationFaite: true })
  })

  it('ignore les indices inconnus', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'aide' }, { type: 'valider-indices', indices: ['url', 'zzz'] })
    expect(etat.resultats['sc-1']).toMatchObject({ indicesChoisis: ['url'], indicesJustes: 1, indicesFaux: 0 })
  })

  it('permet de rejouer un scénario depuis la conséquence', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'valider-indices', indices: [] },
      { type: 'rejouer' },
    )
    expect(etat).toMatchObject({ index: 0, phase: 'situation', choixId: null, resultats: {} })
  })

  it('permet de passer un scénario', () => {
    const etat = jouer(m, { type: 'passer' })
    expect(etat.index).toBe(1)
    expect(etat.resultats['sc-1']).toMatchObject({ passe: true, choixId: null })
  })

  it('termine la mission après le mini-jeu', () => {
    const etat = jouer(m, { type: 'passer' }, { type: 'minijeu-termine', reussites: 3, erreurs: 1 })
    expect(etat.termine).toBe(true)
    expect(etat.resultats['mj-1']).toEqual({ type: 'minijeu', reussites: 3, erreurs: 1 })
    expect(etapeCourante(m, etat)).toBeNull()
    expect(() => reduire(m, etat, { type: 'continuer' })).toThrow(RunError)
  })

  it('refuse un événement impossible dans la phase courante', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'verif' })
    expect(() => reduire(m, etat, { type: 'choisir', choixId: 'aide' })).toThrow(RunError)
    expect(() => reduire(m, demarrer(m), { type: 'minijeu-termine', reussites: 0, erreurs: 0 })).toThrow(RunError)
    expect(() => reduire(m, demarrer(m), { type: 'choisir', choixId: 'inconnu' })).toThrow(RunError)
  })

  it('résume les choix du run', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'verif' }, { type: 'valider-indices', indices: [] })
    expect(choixDuRun(etat)).toEqual({ 'sc-1': 'verif' })
  })

  describe('fil de notifications', () => {
    const r = rappelFixture()

    it('exige une action pour chaque notification', () => {
      expect(() => reduire(r, demarrer(r), { type: 'fil-termine', actions: { n1: 'ignorer' } })).toThrow(
        'notifications sans action : n2, n3',
      )
    })

    it.each([
      ['ouvrir', 'piege'],
      ['verifier', 'verifie'],
      ['signaler', 'signale'],
      ['ignorer', 'ignore'],
    ] as const)('traduit l’action « %s » sur la surprise en « %s »', (action, attendu) => {
      const etat = reduire(r, demarrer(r), {
        type: 'fil-termine',
        actions: { n1: 'ouvrir', n2: action, n3: 'ignorer' },
      })
      expect(etat.termine).toBe(true)
      expect(resultatSurprise(etat)).toBe(attendu)
    })
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/mission-runner.test.ts`
Expected : FAIL, « Failed to resolve import "@/engine/mission-runner" »

- [ ] **Step 3 : implémenter le réducteur**

`src/engine/mission-runner.ts` :
```ts
import type { Etape, FilAction, Mission, Qualite } from '@/content/schema'

export type PhaseScenario = 'situation' | 'indices' | 'consequence' | 'recuperation'
export type SurpriseResultat = 'verifie' | 'ignore' | 'signale' | 'piege'

export interface ScenarioResultat {
  type: 'scenario'
  choixId: string | null
  qualite: Qualite | null
  indicesChoisis: string[]
  indicesJustes: number
  indicesFaux: number
  recuperationFaite: boolean | null
  passe: boolean
}
export interface MinijeuResultat {
  type: 'minijeu'
  reussites: number
  erreurs: number
}
export interface FilResultat {
  type: 'fil'
  actions: Record<string, FilAction>
  surprise: SurpriseResultat | null
}
export type EtapeResultat = ScenarioResultat | MinijeuResultat | FilResultat

export interface RunState {
  index: number
  phase: PhaseScenario | null
  choixId: string | null
  resultats: Record<string, EtapeResultat>
  termine: boolean
}

export type RunEvent =
  | { type: 'choisir'; choixId: string }
  | { type: 'valider-indices'; indices: string[] }
  | { type: 'continuer' }
  | { type: 'recuperation-faite' }
  | { type: 'rejouer' }
  | { type: 'passer' }
  | { type: 'minijeu-termine'; reussites: number; erreurs: number }
  | { type: 'fil-termine'; actions: Record<string, FilAction> }

export class RunError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RunError'
  }
}

const phaseInitiale = (etape: Etape | undefined): PhaseScenario | null =>
  etape?.type === 'scenario' ? 'situation' : null

export function demarrer(mission: Mission): RunState {
  return { index: 0, phase: phaseInitiale(mission.etapes[0]), choixId: null, resultats: {}, termine: false }
}

export function etapeCourante(mission: Mission, etat: RunState): Etape | null {
  return etat.termine ? null : (mission.etapes[etat.index] ?? null)
}

function suivante(mission: Mission, etat: RunState, resultats: Record<string, EtapeResultat>): RunState {
  const index = etat.index + 1
  const termine = index >= mission.etapes.length
  return { index, phase: termine ? null : phaseInitiale(mission.etapes[index]), choixId: null, resultats, termine }
}

const SURPRISES: Record<FilAction, SurpriseResultat> = {
  ouvrir: 'piege',
  verifier: 'verifie',
  signaler: 'signale',
  ignorer: 'ignore',
}
export const surpriseResultat = (action: FilAction): SurpriseResultat => SURPRISES[action]

export function reduire(mission: Mission, etat: RunState, evenement: RunEvent): RunState {
  const etape = etapeCourante(mission, etat)
  if (!etape) throw new RunError('la mission est terminée')
  const refuser = (): never => {
    throw new RunError(`événement « ${evenement.type} » impossible (étape ${etape.type}, phase ${etat.phase})`)
  }

  switch (evenement.type) {
    case 'choisir': {
      if (etape.type !== 'scenario' || etat.phase !== 'situation') return refuser()
      if (!etape.choix.some((c) => c.id === evenement.choixId)) throw new RunError(`choix inconnu : ${evenement.choixId}`)
      return { ...etat, phase: 'indices', choixId: evenement.choixId }
    }
    case 'valider-indices': {
      if (etape.type !== 'scenario' || etat.phase !== 'indices') return refuser()
      const choix = etape.choix.find((c) => c.id === etat.choixId)
      if (!choix) return refuser()
      const pertinents = new Set(etape.indices.filter((i) => i.pertinent).map((i) => i.id))
      const connus = new Set(etape.indices.map((i) => i.id))
      const indices = evenement.indices.filter((id) => connus.has(id))
      const resultat: ScenarioResultat = {
        type: 'scenario',
        choixId: choix.id,
        qualite: choix.qualite,
        indicesChoisis: indices,
        indicesJustes: indices.filter((id) => pertinents.has(id)).length,
        indicesFaux: indices.filter((id) => !pertinents.has(id)).length,
        recuperationFaite: null,
        passe: false,
      }
      return { ...etat, phase: 'consequence', resultats: { ...etat.resultats, [etape.id]: resultat } }
    }
    case 'continuer': {
      if (etape.type !== 'scenario' || etat.phase !== 'consequence') return refuser()
      const resultat = etat.resultats[etape.id] as ScenarioResultat
      if (etape.recuperation && etat.choixId && etape.recuperation.siChoix.includes(etat.choixId)) {
        return {
          ...etat,
          phase: 'recuperation',
          resultats: { ...etat.resultats, [etape.id]: { ...resultat, recuperationFaite: false } },
        }
      }
      return suivante(mission, etat, etat.resultats)
    }
    case 'recuperation-faite': {
      if (etape.type !== 'scenario' || etat.phase !== 'recuperation') return refuser()
      const resultat = etat.resultats[etape.id] as ScenarioResultat
      return suivante(mission, etat, { ...etat.resultats, [etape.id]: { ...resultat, recuperationFaite: true } })
    }
    case 'rejouer': {
      if (etape.type !== 'scenario' || etat.phase !== 'consequence') return refuser()
      const resultats = { ...etat.resultats }
      delete resultats[etape.id]
      return { ...etat, phase: 'situation', choixId: null, resultats }
    }
    case 'passer': {
      if (etape.type !== 'scenario') return refuser()
      const resultat: ScenarioResultat = {
        type: 'scenario',
        choixId: null,
        qualite: null,
        indicesChoisis: [],
        indicesJustes: 0,
        indicesFaux: 0,
        recuperationFaite: null,
        passe: true,
      }
      return suivante(mission, etat, { ...etat.resultats, [etape.id]: resultat })
    }
    case 'minijeu-termine': {
      if (etape.type !== 'minijeu') return refuser()
      return suivante(mission, etat, {
        ...etat.resultats,
        [etape.id]: { type: 'minijeu', reussites: evenement.reussites, erreurs: evenement.erreurs },
      })
    }
    case 'fil-termine': {
      if (etape.type !== 'fil') return refuser()
      const manquantes = etape.notifications.filter((n) => !evenement.actions[n.id])
      if (manquantes.length) {
        throw new RunError(`notifications sans action : ${manquantes.map((n) => n.id).join(', ')}`)
      }
      const surprise = etape.notifications.find((n) => n.surprise)
      return suivante(mission, etat, {
        ...etat.resultats,
        [etape.id]: {
          type: 'fil',
          actions: { ...evenement.actions },
          surprise: surprise ? surpriseResultat(evenement.actions[surprise.id]!) : null,
        },
      })
    }
  }
}

export function resultatSurprise(etat: RunState): SurpriseResultat | null {
  for (const r of Object.values(etat.resultats)) if (r.type === 'fil' && r.surprise) return r.surprise
  return null
}

export function choixDuRun(etat: RunState): Record<string, string> {
  const choix: Record<string, string> = {}
  for (const [id, r] of Object.entries(etat.resultats)) if (r.type === 'scenario' && r.choixId) choix[id] = r.choixId
  return choix
}
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/mission-runner.test.ts && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(moteur): réducteur de mission (scénarios, mini-jeux, fil de notifications)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : badges et échéances des rappels

**Files :**
- Create : `src/engine/badges.ts`, `src/engine/rappel.ts`
- Test : `tests/unit/badges.test.ts`, `tests/unit/rappel.test.ts`

**Interfaces :**
- Consumes : `RunState`, `ScenarioResultat`, `FilResultat`, `reduire`, `demarrer` (tâche 4).
- Produces : `BADGES: Record<BadgeId, { titre: string; description: string }>`, `BadgeId = 'mission-accomplie' | 'oeil-de-lynx' | 'reflexe-verif' | 'reparateur' | 'vigilant'`, `calculerBadges(etat: RunState): BadgeId[]` ; `Echeance = 'J+7' | 'J+30'`, `rappelDu(datesTerminees: string[], rappelsFaits: number, maintenant: Date): Echeance | null`.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/badges.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { calculerBadges } from '@/engine/badges'
import { demarrer, reduire, type RunEvent } from '@/engine/mission-runner'
import type { Mission } from '@/content/schema'
import { missionFixture, rappelFixture } from './fixtures'

const jouer = (m: Mission, ...evs: RunEvent[]) => evs.reduce((e, ev) => reduire(m, e, ev), demarrer(m))
const finTri: RunEvent = { type: 'minijeu-termine', reussites: 4, erreurs: 0 }

describe('calculerBadges', () => {
  const m = missionFixture()

  it('ne donne rien tant que la mission n’est pas terminée', () => {
    expect(calculerBadges(demarrer(m))).toEqual([])
  })

  it('récompense le bon processus : indices justes et choix prudent', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'verif' },
      { type: 'valider-indices', indices: ['url', 'urgence'] },
      { type: 'continuer' },
      finTri,
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'oeil-de-lynx', 'reflexe-verif'])
  })

  it('récompense la réparation après un choix risqué', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'valider-indices', indices: ['montant'] },
      { type: 'continuer' },
      { type: 'recuperation-faite' },
      finTri,
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'reparateur'])
  })

  it('ne donne pas les badges de processus si tous les scénarios sont passés', () => {
    expect(calculerBadges(jouer(m, { type: 'passer' }, finTri))).toEqual(['mission-accomplie'])
  })

  it('donne « vigilant » si la surprise n’a pas piégé', () => {
    const r = rappelFixture()
    const ok = jouer(r, { type: 'fil-termine', actions: { n1: 'ignorer', n2: 'signaler', n3: 'ignorer' } })
    expect(calculerBadges(ok)).toEqual(['mission-accomplie', 'vigilant'])
    const piege = jouer(r, { type: 'fil-termine', actions: { n1: 'ignorer', n2: 'ouvrir', n3: 'ignorer' } })
    expect(calculerBadges(piege)).toEqual(['mission-accomplie'])
  })
})
```

`tests/unit/rappel.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { rappelDu } from '@/engine/rappel'

const jour = (n: number) => new Date(Date.UTC(2026, 8, 1 + n, 12))
const iso = (n: number) => jour(n).toISOString()

describe('rappelDu', () => {
  it('aucun rappel sans mission terminée', () => {
    expect(rappelDu([], 0, jour(40))).toBeNull()
  })
  it('J+7 à partir de 7 jours après la première mission', () => {
    expect(rappelDu([iso(0)], 0, jour(6))).toBeNull()
    expect(rappelDu([iso(3), iso(0)], 0, jour(7))).toBe('J+7')
  })
  it('J+30 après un premier rappel', () => {
    expect(rappelDu([iso(0)], 1, jour(20))).toBeNull()
    expect(rappelDu([iso(0)], 1, jour(30))).toBe('J+30')
  })
  it('plus rien après deux rappels', () => {
    expect(rappelDu([iso(0)], 2, jour(90))).toBeNull()
  })
  it('ignore les dates illisibles', () => {
    expect(rappelDu(['pas une date'], 0, jour(40))).toBeNull()
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/badges.test.ts tests/unit/rappel.test.ts`
Expected : FAIL, modules introuvables.

- [ ] **Step 3 : implémenter**

`src/engine/badges.ts` :
```ts
import type { FilResultat, RunState, ScenarioResultat } from './mission-runner'

export const BADGES = {
  'mission-accomplie': { titre: 'Mission accomplie', description: 'Tu es allé·e jusqu’au bout de la mission.' },
  'oeil-de-lynx': { titre: 'Œil de lynx', description: 'Tu as repéré de vrais indices sans te laisser piéger par les faux.' },
  'reflexe-verif': { titre: 'Réflexe vérif', description: 'À chaque fois, tu as vérifié ou demandé de l’aide avant d’agir.' },
  reparateur: { titre: 'Réparateur·rice', description: 'Tu as appliqué les bons gestes pour limiter les dégâts.' },
  vigilant: { titre: 'Vigilant·e', description: 'Tu n’es pas tombé·e dans le piège glissé parmi tes notifications.' },
} as const

export type BadgeId = keyof typeof BADGES

export function calculerBadges(etat: RunState): BadgeId[] {
  if (!etat.termine) return []
  const badges: BadgeId[] = ['mission-accomplie']
  const resultats = Object.values(etat.resultats)
  const scenarios = resultats.filter((r): r is ScenarioResultat => r.type === 'scenario' && !r.passe)
  if (scenarios.length && scenarios.every((r) => r.indicesJustes > 0 && r.indicesFaux === 0)) badges.push('oeil-de-lynx')
  if (scenarios.length && scenarios.every((r) => r.qualite !== 'risque')) badges.push('reflexe-verif')
  if (scenarios.some((r) => r.recuperationFaite === true)) badges.push('reparateur')
  const fils = resultats.filter((r): r is FilResultat => r.type === 'fil' && r.surprise !== null)
  if (fils.length && fils.every((r) => r.surprise !== 'piege')) badges.push('vigilant')
  return badges
}
```

`src/engine/rappel.ts` :
```ts
export type Echeance = 'J+7' | 'J+30'

const JOUR_MS = 86_400_000

/** Rappel à proposer : J+7 après la première mission terminée, puis J+30 une fois le premier rappel fait. */
export function rappelDu(datesTerminees: string[], rappelsFaits: number, maintenant: Date): Echeance | null {
  const dates = datesTerminees.map((d) => Date.parse(d)).filter(Number.isFinite)
  if (!dates.length) return null
  const jours = (maintenant.getTime() - Math.min(...dates)) / JOUR_MS
  if (rappelsFaits === 0 && jours >= 7) return 'J+7'
  if (rappelsFaits === 1 && jours >= 30) return 'J+30'
  return null
}
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/badges.test.ts tests/unit/rappel.test.ts && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(moteur): badges de processus et échéances des rappels J+7/J+30

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : progression locale (localStorage) et store réactif

**Files :**
- Create : `src/store/progress.ts`, `src/store/useProgress.ts`
- Test : `tests/unit/memory-storage.ts`, `tests/unit/progress.test.ts`, `tests/unit/use-progress.test.ts`

**Interfaces :**
- Consumes : `trancheSchema`, `Tranche` (tâche 2) ; `SurpriseResultat` (tâche 4).
- Produces (`progress.ts`) : `STORAGE_KEY = 'cyber-reflexes:v1'`, `MODES`, `Mode = 'solo' | 'binome' | 'classe'`, `progressSchema`, `Progress`, `Reglages`, `progressionVide(): Progress`, `stockageSur(): Storage | null`, `migrer(brut: unknown): Progress | null`, `chargerProgression(storage: Storage | null): Progress`, `sauverProgression(storage: Storage | null, p: Progress): boolean`, `effacerProgression(storage: Storage | null): void`.
- Produces (`useProgress.ts`) : `creerStore(storage: Storage | null)`, qui renvoie `{ etat (readonly Progress), persistant (Readonly<Ref<boolean>>), choisirTranche(t), choisirMode(m), modifierReglages(r: Partial<Reglages>), enregistrerMission(id, badges: string[], choix: Record<string,string>, maintenant?), enregistrerRappel(id, resultat: SurpriseResultat | null, maintenant?), effacer() }` ; `type ProgressStore` ; `useProgress(): ProgressStore` (singleton) ; `definirStore(store: ProgressStore): void` (réservé aux tests).
- Produces (tests) : `MemoryStorage` (implémente `Storage`), `StorageQuiRefuse` (lève une erreur sur `setItem`).

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/memory-storage.ts` :
```ts
export class MemoryStorage implements Storage {
  private donnees = new Map<string, string>()
  get length() {
    return this.donnees.size
  }
  clear() {
    this.donnees.clear()
  }
  getItem(cle: string) {
    return this.donnees.get(cle) ?? null
  }
  key(i: number) {
    return [...this.donnees.keys()][i] ?? null
  }
  removeItem(cle: string) {
    this.donnees.delete(cle)
  }
  setItem(cle: string, valeur: string) {
    this.donnees.set(cle, valeur)
  }
}

export class StorageQuiRefuse extends MemoryStorage {
  override setItem(): void {
    throw new DOMException('Quota dépassé', 'QuotaExceededError')
  }
}
```

`tests/unit/progress.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import {
  chargerProgression,
  effacerProgression,
  migrer,
  progressionVide,
  sauverProgression,
  STORAGE_KEY,
} from '@/store/progress'
import { MemoryStorage, StorageQuiRefuse } from './memory-storage'

describe('progression', () => {
  it('part d’une progression vide sans stockage', () => {
    expect(chargerProgression(null)).toEqual(progressionVide())
    expect(progressionVide()).toMatchObject({
      version: 1,
      tranche: null,
      mode: null,
      reglages: { taille: 'normal', interligne: 'normal', lectureSimple: false, animations: true, chrono: false },
      missions: {},
      rappels: {},
    })
  })

  it('sauve puis recharge', () => {
    const s = new MemoryStorage()
    const p = { ...progressionVide(), tranche: '6e' as const }
    expect(sauverProgression(s, p)).toBe(true)
    expect(chargerProgression(s).tranche).toBe('6e')
  })

  it('repart de zéro si les données sont corrompues', () => {
    const s = new MemoryStorage()
    s.setItem(STORAGE_KEY, '{pas du json')
    expect(chargerProgression(s)).toEqual(progressionVide())
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tranche: 'cm2' }))
    expect(chargerProgression(s)).toEqual(progressionVide())
  })

  it('refuse une version inconnue', () => {
    expect(migrer({ version: 99 })).toBeNull()
    expect(migrer('texte')).toBeNull()
    expect(migrer({ version: 1 })).toEqual(progressionVide())
  })

  it('signale l’échec d’écriture sans lever d’erreur', () => {
    expect(sauverProgression(new StorageQuiRefuse(), progressionVide())).toBe(false)
    expect(sauverProgression(null, progressionVide())).toBe(false)
  })

  it('efface la clé', () => {
    const s = new MemoryStorage()
    sauverProgression(s, progressionVide())
    effacerProgression(s)
    expect(s.getItem(STORAGE_KEY)).toBeNull()
    expect(() => effacerProgression(null)).not.toThrow()
  })
})
```

`tests/unit/use-progress.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '@/store/progress'
import { creerStore } from '@/store/useProgress'
import { MemoryStorage, StorageQuiRefuse } from './memory-storage'

const lire = (s: Storage) => JSON.parse(s.getItem(STORAGE_KEY) ?? 'null')

describe('store de progression', () => {
  it('persiste chaque modification', () => {
    const s = new MemoryStorage()
    const store = creerStore(s)
    store.choisirTranche('lycee')
    store.choisirMode('classe')
    store.modifierReglages({ taille: 'grand' })
    expect(lire(s)).toMatchObject({ tranche: 'lycee', mode: 'classe', reglages: { taille: 'grand' } })
    expect(store.persistant.value).toBe(true)
  })

  it('enregistre une mission terminée', () => {
    const s = new MemoryStorage()
    const store = creerStore(s)
    store.enregistrerMission('m-test', ['mission-accomplie'], { 'sc-1': 'verif' }, new Date('2026-09-01T10:00:00Z'))
    expect(lire(s).missions['m-test']).toEqual({
      termineeLe: '2026-09-01T10:00:00.000Z',
      badges: ['mission-accomplie'],
      choix: { 'sc-1': 'verif' },
    })
  })

  it('compte les rappels faits', () => {
    const store = creerStore(new MemoryStorage())
    store.enregistrerRappel('r-6e', 'piege', new Date('2026-09-08T10:00:00Z'))
    store.enregistrerRappel('r-6e', 'verifie', new Date('2026-10-01T10:00:00Z'))
    expect(store.etat.rappels['r-6e']).toEqual({
      faitLe: '2026-10-01T10:00:00.000Z',
      fois: 2,
      resultatSurprise: 'verifie',
    })
  })

  it('fonctionne sans stockage, en le signalant', () => {
    const store = creerStore(null)
    store.choisirTranche('6e')
    expect(store.etat.tranche).toBe('6e')
    expect(store.persistant.value).toBe(false)
  })

  it('signale un stockage qui refuse les écritures', () => {
    const store = creerStore(new StorageQuiRefuse())
    store.choisirTranche('6e')
    expect(store.etat.tranche).toBe('6e')
    expect(store.persistant.value).toBe(false)
  })

  it('efface tout, y compris la clé', () => {
    const s = new MemoryStorage()
    const store = creerStore(s)
    store.choisirTranche('6e')
    store.effacer()
    expect(store.etat.tranche).toBeNull()
    expect(s.getItem(STORAGE_KEY)).toBeNull()
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/progress.test.ts tests/unit/use-progress.test.ts`
Expected : FAIL, modules introuvables.

- [ ] **Step 3 : implémenter**

`src/store/progress.ts` :
```ts
import { z } from 'zod'
import { trancheSchema } from '@/content/schema'

export const STORAGE_KEY = 'cyber-reflexes:v1'
export const MODES = ['solo', 'binome', 'classe'] as const
export type Mode = (typeof MODES)[number]

const reglagesSchema = z.object({
  taille: z.enum(['normal', 'grand', 'tres-grand']).default('normal'),
  interligne: z.enum(['normal', 'large']).default('normal'),
  lectureSimple: z.boolean().default(false),
  animations: z.boolean().default(true),
  chrono: z.boolean().default(false),
})

export const progressSchema = z.object({
  version: z.literal(1),
  tranche: trancheSchema.nullable().default(null),
  mode: z.enum(MODES).nullable().default(null),
  reglages: reglagesSchema.default(() => reglagesSchema.parse({})),
  missions: z
    .record(z.string(), z.object({ termineeLe: z.string(), badges: z.array(z.string()), choix: z.record(z.string(), z.string()) }))
    .default({}),
  rappels: z
    .record(
      z.string(),
      z.object({
        faitLe: z.string(),
        fois: z.number().int().min(1),
        resultatSurprise: z.enum(['verifie', 'ignore', 'signale', 'piege']).nullable(),
      }),
    )
    .default({}),
})

export type Progress = z.infer<typeof progressSchema>
export type Reglages = Progress['reglages']

export const progressionVide = (): Progress => progressSchema.parse({ version: 1 })

/** Renvoie localStorage s'il est réellement utilisable, sinon null (navigation privée, blocage…). */
export function stockageSur(): Storage | null {
  try {
    const s = globalThis.localStorage
    const cle = '__cyber-reflexes-test__'
    s.setItem(cle, '1')
    s.removeItem(cle)
    return s
  } catch {
    return null
  }
}

/** Migrations des anciennes versions : clé = version d'origine, valeur = données converties vers la suivante. */
const MIGRATIONS: Record<number, (ancien: Record<string, unknown>) => Record<string, unknown>> = {}

export function migrer(brut: unknown): Progress | null {
  if (typeof brut !== 'object' || brut === null) return null
  let donnees = brut as Record<string, unknown>
  let version = typeof donnees.version === 'number' ? donnees.version : Number.NaN
  while (version !== 1) {
    const migration = MIGRATIONS[version]
    if (!migration) return null
    donnees = migration(donnees)
    version = donnees.version as number
  }
  const res = progressSchema.safeParse(donnees)
  return res.success ? res.data : null
}

export function chargerProgression(storage: Storage | null): Progress {
  if (!storage) return progressionVide()
  try {
    const texte = storage.getItem(STORAGE_KEY)
    return (texte && migrer(JSON.parse(texte))) || progressionVide()
  } catch {
    return progressionVide()
  }
}

export function sauverProgression(storage: Storage | null, p: Progress): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p))
    return true
  } catch {
    return false
  }
}

export function effacerProgression(storage: Storage | null): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // stockage indisponible : rien à effacer
  }
}
```

`src/store/useProgress.ts` :
```ts
import { reactive, readonly, ref, watch } from 'vue'
import type { Tranche } from '@/content/schema'
import type { SurpriseResultat } from '@/engine/mission-runner'
import {
  chargerProgression,
  effacerProgression,
  progressionVide,
  sauverProgression,
  stockageSur,
  type Mode,
  type Progress,
  type Reglages,
} from './progress'

export function creerStore(storage: Storage | null) {
  const etat = reactive(chargerProgression(storage)) as Progress
  const persistant = ref(storage !== null)

  watch(
    etat,
    () => {
      if (!sauverProgression(storage, etat)) persistant.value = false
    },
    { deep: true, flush: 'sync' },
  )

  return {
    etat: readonly(etat),
    persistant: readonly(persistant),
    choisirTranche(tranche: Tranche) {
      etat.tranche = tranche
    },
    choisirMode(mode: Mode) {
      etat.mode = mode
    },
    modifierReglages(reglages: Partial<Reglages>) {
      Object.assign(etat.reglages, reglages)
    },
    enregistrerMission(id: string, badges: string[], choix: Record<string, string>, maintenant = new Date()) {
      etat.missions[id] = { termineeLe: maintenant.toISOString(), badges, choix }
    },
    enregistrerRappel(id: string, resultatSurprise: SurpriseResultat | null, maintenant = new Date()) {
      const fois = (etat.rappels[id]?.fois ?? 0) + 1
      etat.rappels[id] = { faitLe: maintenant.toISOString(), fois, resultatSurprise }
    },
    effacer() {
      Object.assign(etat, progressionVide())
      effacerProgression(storage)
    },
  }
}

export type ProgressStore = ReturnType<typeof creerStore>

let instance: ProgressStore | null = null

export function useProgress(): ProgressStore {
  instance ??= creerStore(stockageSur())
  return instance
}

/** Réservé aux tests : remplace le store global. */
export function definirStore(store: ProgressStore): void {
  instance = store
}
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/progress.test.ts tests/unit/use-progress.test.ts && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(store): progression locale versionnée et tolérante aux pannes de stockage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7 : socle d'interface (réglages, en-tête, bandeau d'aide, icônes)

**Files :**
- Create : `src/ui/appliquerReglages.ts`, `src/ui/useTexte.ts`, `src/ui/icons.ts`, `src/ui/BandeauAide.vue`, `src/ui/EffacerProgression.vue`, `src/ui/ReglagesPanel.vue`, `src/ui/AppHeader.vue`
- Modify : `src/App.vue`
- Test : `tests/unit/helpers.ts`, `tests/unit/content-mock.ts`, `tests/unit/ui.test.ts`

**Interfaces :**
- Consumes : `ProgressStore`, `useProgress`, `creerStore`, `definirStore` (tâche 6) ; `Aide`, `Theme` (tâche 2) ; `creerAcces` (tâche 3).
- Produces : `appliquerReglages(store: ProgressStore, racine?: HTMLElement): WatchStopHandle` ; `useTexte(): (texte: string, texteSimple?: string) => string` ; `ICONES_THEMES: Record<Theme['icone'], Component>` ; composants `BandeauAide` (props `aides: Aide[]`), `EffacerProgression`, `ReglagesPanel` (emit `fermer`), `AppHeader`.
- Produces (tests) : `cliquer(wrapper, texte): Promise<void>` et `bouton(wrapper, texte)` dans `tests/unit/helpers.ts` ; `contentMock`, à utiliser via `vi.mock('@/content', async () => (await import('./content-mock')).contentMock)`.

- [ ] **Step 1 : helpers de test**

`tests/unit/helpers.ts` :
```ts
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

type Enveloppe = VueWrapper | DOMWrapper<Element>

export function bouton(w: Enveloppe, texte: string): DOMWrapper<HTMLButtonElement> {
  const trouve = w.findAll('button').find((b) => b.text().includes(texte))
  if (!trouve) throw new Error(`bouton introuvable : « ${texte} » (boutons : ${w.findAll('button').map((b) => b.text()).join(' | ')})`)
  return trouve as DOMWrapper<HTMLButtonElement>
}

export async function cliquer(w: Enveloppe, texte: string): Promise<void> {
  await bouton(w, texte).trigger('click')
}
```

`tests/unit/content-mock.ts` :
```ts
import { creerAcces } from '@/content/acces'
import { missionFixture, rappelFixture, themesFixture } from './fixtures'

export const contentMock = creerAcces({
  generatedAt: '2026-09-01T10:00:00.000Z',
  themes: themesFixture(),
  missions: [
    missionFixture(),
    missionFixture({
      id: 'm-sensible',
      theme: 'harcelement',
      titre: 'Mission sensible',
      fiche: { deroulement: 'Déroulé.', siRevelation: 'Prévenir le ou la CPE et l’infirmier·e scolaire.' },
    }),
    rappelFixture(),
  ],
})
```

- [ ] **Step 2 : écrire les tests (qui doivent échouer)**

`tests/unit/ui.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import BandeauAide from '@/ui/BandeauAide.vue'
import EffacerProgression from '@/ui/EffacerProgression.vue'
import ReglagesPanel from '@/ui/ReglagesPanel.vue'
import { appliquerReglages } from '@/ui/appliquerReglages'
import { useTexte } from '@/ui/useTexte'
import { themesFixture } from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

describe('appliquerReglages', () => {
  it('reflète réglages et mode sur l’élément racine', async () => {
    const racine = document.createElement('div')
    appliquerReglages(store, racine)
    expect(racine.dataset.taille).toBe('normal')
    expect(racine.dataset.animations).toBe('on')
    expect(racine.dataset.mode).toBe('solo')
    store.modifierReglages({ taille: 'tres-grand', interligne: 'large', animations: false })
    store.choisirMode('classe')
    await nextTick()
    expect(racine.dataset.taille).toBe('tres-grand')
    expect(racine.dataset.interligne).toBe('large')
    expect(racine.dataset.animations).toBe('off')
    expect(racine.dataset.mode).toBe('classe')
  })
})

describe('useTexte', () => {
  it('utilise le texte simplifié seulement si le réglage est actif et le texte existe', () => {
    const t = useTexte()
    expect(t('long', 'court')).toBe('long')
    store.modifierReglages({ lectureSimple: true })
    expect(t('long', 'court')).toBe('court')
    expect(t('long')).toBe('long')
  })
})

describe('BandeauAide', () => {
  it('affiche les numéros et distingue les types d’aide', () => {
    const aides = themesFixture().find((t) => t.id === 'harcelement')!.aides
    const w = mount(BandeauAide, { props: { aides } })
    expect(w.text()).toContain('3018')
    expect(w.text()).toContain('Parler à quelqu’un')
    expect(w.find('aside').attributes('aria-label')).toBe('Besoin d’aide ?')
  })
})

describe('ReglagesPanel', () => {
  it('modifie les réglages du store', async () => {
    const w = mount(ReglagesPanel)
    await w.find('input[name="taille"][value="grand"]').setValue()
    await w.find('input[name="lecture-simple"]').setValue(true)
    await w.find('input[name="chrono"]').setValue(true)
    expect(store.etat.reglages).toMatchObject({ taille: 'grand', lectureSimple: true, chrono: true })
    await cliquer(w, 'Fermer')
    expect(w.emitted('fermer')).toHaveLength(1)
  })
})

describe('EffacerProgression', () => {
  it('demande confirmation avant d’effacer', async () => {
    store.choisirTranche('6e')
    const w = mount(EffacerProgression)
    await cliquer(w, 'Effacer ma progression')
    expect(store.etat.tranche).toBe('6e')
    await cliquer(w, 'Oui, tout effacer')
    expect(store.etat.tranche).toBeNull()
    expect(w.text()).toContain('Ta progression a été effacée.')
  })
})

describe('AppHeader', () => {
  it('ouvre et ferme le panneau de réglages', async () => {
    const router = await routerTest('/')
    const w = mount(AppHeader, { global: { plugins: [router] } })
    expect(w.find('#panneau-reglages').exists()).toBe(false)
    await cliquer(w, 'Réglages')
    expect(w.find('#panneau-reglages').exists()).toBe(true)
    expect(w.find('button[aria-controls="panneau-reglages"]').attributes('aria-expanded')).toBe('true')
  })
})
```

- [ ] **Step 3 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/ui.test.ts`
Expected : FAIL, modules `@/ui/...` introuvables.

- [ ] **Step 4 : implémenter**

`src/ui/appliquerReglages.ts` :
```ts
import { watchEffect, type WatchStopHandle } from 'vue'
import type { ProgressStore } from '@/store/useProgress'

/** Reporte réglages et mode sur <html> (data-*), lus par base.css. */
export function appliquerReglages(store: ProgressStore, racine: HTMLElement = document.documentElement): WatchStopHandle {
  return watchEffect(() => {
    const r = store.etat.reglages
    racine.dataset.taille = r.taille
    racine.dataset.interligne = r.interligne
    racine.dataset.animations = r.animations ? 'on' : 'off'
    racine.dataset.mode = store.etat.mode ?? 'solo'
  })
}
```

`src/ui/useTexte.ts` :
```ts
import { useProgress } from '@/store/useProgress'

/** Choisit la version simplifiée d'un texte quand la « lecture simplifiée » est active. */
export function useTexte() {
  const store = useProgress()
  return (texte: string, texteSimple?: string): string =>
    store.etat.reglages.lectureSimple && texteSimple ? texteSimple : texte
}
```

`src/ui/icons.ts` :
```ts
import { Eye, Fish, Gamepad2, HeartHandshake, KeyRound, Newspaper, Users, Wifi } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { Theme } from '@/content/schema'

export const ICONES_THEMES: Record<Theme['icone'], Component> = {
  Fish,
  KeyRound,
  Eye,
  Users,
  Gamepad2,
  HeartHandshake,
  Newspaper,
  Wifi,
}
```

`src/ui/BandeauAide.vue` :
```vue
<script setup lang="ts">
import type { Aide } from '@/content/schema'

defineProps<{ aides: Aide[] }>()

const TYPES: Record<Aide['type'], string> = {
  humaine: 'Parler à quelqu’un',
  urgence: 'Urgence',
  signalement: 'Signaler un contenu',
  technique: 'Aide technique',
}
</script>

<template>
  <aside class="bandeau-aide" aria-label="Besoin d’aide ?">
    <p><strong>Besoin d’aide ? C’est gratuit et confidentiel.</strong></p>
    <ul>
      <li v-for="aide in aides" :key="aide.numero">
        <span class="type">{{ TYPES[aide.type] }}</span>
        <strong>{{ aide.numero }}</strong> : {{ aide.libelle }}
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.bandeau-aide {
  position: sticky;
  bottom: 0;
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  background: #fff8e6;
  border: 2px solid var(--aide);
  border-radius: var(--rayon);
  font-size: 0.95em;
}
.bandeau-aide ul { margin: 0.25rem 0 0; padding-left: 1.2rem; }
.type { display: inline-block; min-width: 11rem; color: var(--texte-doux); }
</style>
```

`src/ui/EffacerProgression.vue` :
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useProgress } from '@/store/useProgress'

const store = useProgress()
const confirmation = ref(false)
const fait = ref(false)

function demander() {
  confirmation.value = true
  fait.value = false
}
function effacer() {
  store.effacer()
  confirmation.value = false
  fait.value = true
}
</script>

<template>
  <div class="effacer">
    <button v-if="!confirmation" type="button" class="btn btn-danger" @click="demander">
      Effacer ma progression
    </button>
    <template v-else>
      <p>Tout effacer sur cet appareil ? (niveau, missions terminées, badges, réglages)</p>
      <div class="actions">
        <button type="button" class="btn btn-danger" @click="effacer">Oui, tout effacer</button>
        <button type="button" class="btn" @click="confirmation = false">Annuler</button>
      </div>
    </template>
    <p v-if="fait" role="status">Ta progression a été effacée.</p>
  </div>
</template>
```

`src/ui/ReglagesPanel.vue` :
```vue
<script setup lang="ts">
import type { Reglages } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import EffacerProgression from './EffacerProgression.vue'

const emit = defineEmits<{ fermer: [] }>()
const store = useProgress()

const TAILLES: { valeur: Reglages['taille']; libelle: string }[] = [
  { valeur: 'normal', libelle: 'Normale' },
  { valeur: 'grand', libelle: 'Grande' },
  { valeur: 'tres-grand', libelle: 'Très grande' },
]
const INTERLIGNES: { valeur: Reglages['interligne']; libelle: string }[] = [
  { valeur: 'normal', libelle: 'Normal' },
  { valeur: 'large', libelle: 'Large' },
]
const coche = (e: Event) => (e.target as HTMLInputElement).checked
</script>

<template>
  <section id="panneau-reglages" class="reglages carte conteneur" aria-labelledby="titre-reglages">
    <h2 id="titre-reglages">Réglages</h2>
    <fieldset>
      <legend>Taille du texte</legend>
      <label v-for="t in TAILLES" :key="t.valeur" class="option">
        <input
          type="radio"
          name="taille"
          :value="t.valeur"
          :checked="store.etat.reglages.taille === t.valeur"
          @change="store.modifierReglages({ taille: t.valeur })"
        />
        {{ t.libelle }}
      </label>
    </fieldset>
    <fieldset>
      <legend>Espacement des lignes</legend>
      <label v-for="i in INTERLIGNES" :key="i.valeur" class="option">
        <input
          type="radio"
          name="interligne"
          :value="i.valeur"
          :checked="store.etat.reglages.interligne === i.valeur"
          @change="store.modifierReglages({ interligne: i.valeur })"
        />
        {{ i.libelle }}
      </label>
    </fieldset>
    <label class="option">
      <input
        type="checkbox"
        name="lecture-simple"
        :checked="store.etat.reglages.lectureSimple"
        @change="store.modifierReglages({ lectureSimple: coche($event) })"
      />
      Lecture simplifiée (phrases plus courtes)
    </label>
    <label class="option">
      <input
        type="checkbox"
        name="animations"
        :checked="store.etat.reglages.animations"
        @change="store.modifierReglages({ animations: coche($event) })"
      />
      Animations
    </label>
    <label class="option">
      <input
        type="checkbox"
        name="chrono"
        :checked="store.etat.reglages.chrono"
        @change="store.modifierReglages({ chrono: coche($event) })"
      />
      Chronomètre dans les mini-jeux
    </label>
    <EffacerProgression />
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="emit('fermer')">Fermer</button>
    </div>
  </section>
</template>
```

`src/ui/AppHeader.vue` :
```vue
<script setup lang="ts">
import { Settings, ShieldCheck } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ReglagesPanel from './ReglagesPanel.vue'

const ouvert = ref(false)
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="logo"><ShieldCheck aria-hidden="true" /> Cyber Réflexes</RouterLink>
    <nav aria-label="Navigation principale" class="nav">
      <RouterLink to="/enseignants">Enseignants</RouterLink>
      <button
        type="button"
        class="btn"
        aria-controls="panneau-reglages"
        :aria-expanded="ouvert"
        @click="ouvert = !ouvert"
      >
        <Settings aria-hidden="true" /> Réglages
      </button>
    </nav>
  </header>
  <ReglagesPanel v-if="ouvert" @fermer="ouvert = false" />
</template>

<style scoped>
.app-header {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
  gap: 0.5rem; padding: 0.5rem 1rem; background: var(--surface); border-bottom: 1px solid var(--bord);
}
.logo { display: inline-flex; align-items: center; gap: 0.4em; font-weight: 700; font-size: 1.2em; text-decoration: none; }
.nav { display: flex; align-items: center; gap: 1rem; }
</style>
```

`src/App.vue` (version finale, sans la mise à jour PWA ajoutée à la tâche 16) :
```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useProgress } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import { appliquerReglages } from '@/ui/appliquerReglages'

const store = useProgress()
appliquerReglages(store)

function allerAuContenu() {
  const main = document.querySelector('main')
  if (!main) return
  main.setAttribute('tabindex', '-1')
  main.focus()
}
</script>

<template>
  <button type="button" class="lien-evitement" @click="allerAuContenu">Aller au contenu</button>
  <AppHeader />
  <p v-if="!store.persistant.value" class="alerte-stockage conteneur" role="status">
    Ta progression ne pourra pas être enregistrée sur cet appareil. Tu peux jouer quand même !
  </p>
  <RouterView :key="$route.fullPath" />
</template>

<style>
.lien-evitement { position: absolute; left: -999px; }
.lien-evitement:focus { left: 1rem; top: 1rem; z-index: 10; }
.alerte-stockage { background: #fff8e6; border-left: 4px solid var(--aide); }
</style>
```

- [ ] **Step 5 : lancer les tests, les types et le lint**

Run : `npx vitest run && npm run typecheck && npm run lint`
Expected : tous PASS.

- [ ] **Step 6 : commit**

```bash
git add -A
git commit -m "feat(ui): réglages d'accessibilité, en-tête, bandeau d'aide et effacement

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8 : accueil et carte des thèmes

**Files :**
- Modify : `src/pages/AccueilPage.vue` (remplacement complet), `src/router/index.ts`
- Create : `src/pages/CartePage.vue`
- Test : `tests/unit/accueil-carte.test.ts`

**Interfaces :**
- Consumes : `getThemes`, `missionsPour`, `rappelPour` (tâche 3) ; `TRANCHES`, `TRANCHE_LIBELLES` (tâche 2) ; `MODES`, `Mode`, `useProgress` (tâche 6) ; `rappelDu` (tâche 5) ; `ICONES_THEMES` (tâche 7).
- Produces : route `carte` (`/carte`), qui renvoie vers `accueil` tant qu'aucune tranche n'est choisie ; liens de mission `/mission/:id`.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/accueil-carte.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccueilPage from '@/pages/AccueilPage.vue'
import CartePage from '@/pages/CartePage.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})
afterEach(() => vi.useRealTimers())

describe('AccueilPage', () => {
  it('attend le niveau et le mode avant de lancer', async () => {
    const router = await routerTest('/')
    const w = mount(AccueilPage, { global: { plugins: [router] } })
    const lancer = w.find('button[type="submit"]')
    expect(lancer.attributes('disabled')).toBeDefined()
    await w.find('input[name="tranche"][value="6e"]').setValue()
    await w.find('input[name="mode"][value="binome"]').setValue()
    expect(store.etat).toMatchObject({ tranche: '6e', mode: 'binome' })
    expect(lancer.attributes('disabled')).toBeUndefined()
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('carte'))
  })

  it('propose « Continuer » quand une mission a déjà été jouée', async () => {
    store.enregistrerMission('m-test', [], {})
    const w = mount(AccueilPage, { global: { plugins: [await routerTest('/')] } })
    expect(w.find('button[type="submit"]').text()).toBe('Continuer')
  })
})

describe('CartePage', () => {
  it('renvoie vers l’accueil sans niveau choisi', async () => {
    const router = await routerTest('/carte')
    expect(router.currentRoute.value.name).toBe('accueil')
  })

  it('liste les thèmes, les missions de la tranche et les thèmes à venir', async () => {
    store.choisirTranche('6e')
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.findAll('h2').map((h) => h.text())).toEqual(
      expect.arrayContaining(['Phishing et arnaques', 'Jeux et achats', 'Cyberharcèlement']),
    )
    expect(w.find('a[href="#/mission/m-test"]').exists() || w.find('a[href="/mission/m-test"]').exists()).toBe(true)
    expect(w.text()).toContain('Bientôt disponible')
    expect(w.text()).not.toContain('Terminée')
  })

  it('marque les missions terminées', async () => {
    store.choisirTranche('6e')
    store.enregistrerMission('m-test', ['mission-accomplie'], {})
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.text()).toContain('Terminée')
  })

  it('met le rappel en avant à J+7', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'))
    store.choisirTranche('6e')
    store.enregistrerMission('m-test', [], {}, new Date('2026-09-10T10:00:00Z'))
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.find('.rappel').classes()).toContain('rappel-du')
    expect(w.text()).toContain('C’est le moment de ton rappel (J+7)')
  })

  it('ignore une progression qui cite une mission disparue', async () => {
    store.choisirTranche('6e')
    store.enregistrerMission('ancienne-mission', ['mission-accomplie'], {})
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.text()).toContain('Phishing et arnaques')
    expect(w.text()).not.toContain('Terminée')
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/accueil-carte.test.ts`
Expected : FAIL, `@/pages/CartePage.vue` introuvable.

- [ ] **Step 3 : implémenter**

`src/pages/AccueilPage.vue` :
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { TRANCHES, TRANCHE_LIBELLES } from '@/content/schema'
import { MODES, type Mode } from '@/store/progress'
import { useProgress } from '@/store/useProgress'

const store = useProgress()
const router = useRouter()

const MODE_INFOS: Record<Mode, { titre: string; description: string }> = {
  solo: { titre: 'Solo', description: 'Je joue seul·e, à mon rythme.' },
  binome: { titre: 'Binôme', description: 'On joue à deux sur le même écran et on discute avant chaque choix.' },
  classe: { titre: 'Classe entière', description: 'Le jeu est projeté, la classe vote, l’adulte valide.' },
}

const aDejaJoue = computed(() => Object.keys(store.etat.missions).length > 0)
const pret = computed(() => store.etat.tranche !== null && store.etat.mode !== null)

function commencer() {
  if (pret.value) void router.push({ name: 'carte' })
}
</script>

<template>
  <main class="conteneur accueil">
    <h1>Cyber Réflexes</h1>
    <p class="accroche">
      Des situations du quotidien pour apprendre les bons réflexes sur Internet. Pas de compte, rien à
      installer.
    </p>
    <form @submit.prevent="commencer">
      <fieldset>
        <legend>Je suis en…</legend>
        <label v-for="t in TRANCHES" :key="t" class="option">
          <input
            type="radio"
            name="tranche"
            :value="t"
            :checked="store.etat.tranche === t"
            @change="store.choisirTranche(t)"
          />
          {{ TRANCHE_LIBELLES[t] }}
        </label>
      </fieldset>
      <fieldset>
        <legend>Comment on joue ?</legend>
        <label v-for="m in MODES" :key="m" class="option">
          <input
            type="radio"
            name="mode"
            :value="m"
            :checked="store.etat.mode === m"
            @change="store.choisirMode(m)"
          />
          <span>
            <strong>{{ MODE_INFOS[m].titre }}</strong>
            <span class="description"> : {{ MODE_INFOS[m].description }}</span>
          </span>
        </label>
      </fieldset>
      <button type="submit" class="btn btn-primaire" :disabled="!pret">
        {{ aDejaJoue ? 'Continuer' : 'C’est parti' }}
      </button>
    </form>
    <nav aria-label="Liens utiles" class="liens">
      <RouterLink to="/enseignants">Espace enseignants</RouterLink>
      <RouterLink to="/confidentialite">Confidentialité</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.accroche { font-size: 1.1em; color: var(--texte-doux); }
.description { color: var(--texte-doux); }
.liens { display: flex; gap: 1.5rem; margin-top: 2rem; }
</style>
```

`src/pages/CartePage.vue` :
```vue
<script setup lang="ts">
import { Check, RotateCcw } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getThemes, missionsPour, rappelPour } from '@/content'
import { TRANCHE_LIBELLES, type Tranche } from '@/content/schema'
import { rappelDu } from '@/engine/rappel'
import { useProgress } from '@/store/useProgress'
import { ICONES_THEMES } from '@/ui/icons'

const store = useProgress()
const tranche = computed<Tranche>(() => store.etat.tranche ?? '6e')

const tuiles = computed(() =>
  getThemes().map((theme) => ({ theme, missions: missionsPour(tranche.value, theme.id) })),
)
const rappel = computed(() => rappelPour(tranche.value))
const echeance = computed(() =>
  rappelDu(
    Object.values(store.etat.missions).map((m) => m.termineeLe),
    Object.values(store.etat.rappels).reduce((total, r) => total + r.fois, 0),
    new Date(),
  ),
)
const terminee = (id: string) => id in store.etat.missions
</script>

<template>
  <main class="conteneur">
    <h1>Choisis un thème</h1>
    <p>
      Niveau : <strong>{{ TRANCHE_LIBELLES[tranche] }}</strong> ·
      <RouterLink to="/">changer</RouterLink>
    </p>

    <section v-if="rappel" class="carte rappel" :class="{ 'rappel-du': echeance }" aria-labelledby="titre-rappel">
      <h2 id="titre-rappel"><RotateCcw aria-hidden="true" /> Mission rappel</h2>
      <p v-if="echeance">
        C’est le moment de ton rappel ({{ echeance }}) : 5 minutes pour vérifier que les bons réflexes sont
        restés.
      </p>
      <p v-else>5 minutes pour réviser les bons réflexes, quand tu veux.</p>
      <RouterLink class="btn" :class="{ 'btn-primaire': echeance }" :to="`/mission/${rappel.id}`">
        {{ rappel.titre }}
      </RouterLink>
    </section>

    <ul class="grille-themes">
      <li v-for="{ theme, missions } in tuiles" :key="theme.id" class="carte tuile">
        <h2><component :is="ICONES_THEMES[theme.icone]" aria-hidden="true" /> {{ theme.titre }}</h2>
        <p>{{ theme.description }}</p>
        <p v-if="!missions.length" class="bientot">Bientôt disponible</p>
        <ul v-else class="missions">
          <li v-for="m in missions" :key="m.id">
            <RouterLink :to="`/mission/${m.id}`">{{ m.titre }}</RouterLink>
            <span class="meta"> · {{ m.duree }} min</span>
            <span v-if="terminee(m.id)" class="terminee"> · <Check aria-hidden="true" :size="16" /> Terminée</span>
          </li>
        </ul>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.grille-themes {
  list-style: none; padding: 0; display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}
.tuile h2 { display: flex; align-items: center; gap: 0.4em; font-size: 1.2em; }
.missions { padding-left: 1.1rem; }
.bientot, .meta { color: var(--texte-doux); }
.terminee { color: var(--bon); font-weight: 700; }
.rappel { margin-bottom: 1.5rem; }
.rappel-du { border: 3px solid var(--primaire); }
</style>
```

Dans `src/router/index.ts`, ajouter la route (après `accueil`) :
```ts
import CartePage from '@/pages/CartePage.vue'
import { useProgress } from '@/store/useProgress'
// …
  {
    path: '/carte',
    name: 'carte',
    component: CartePage,
    beforeEnter: () => (useProgress().etat.tranche ? true : { name: 'accueil' }),
  },
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(pages): accueil (niveau, mode) et carte des thèmes avec rappels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9 : faux téléphone

**Files :**
- Create : `src/phone/PhoneFrame.vue`, `src/phone/ThreadScreen.vue`, `src/phone/MailScreen.vue`, `src/phone/WebScreen.vue`, `src/phone/EcranTelephone.vue`
- Test : `tests/unit/phone.test.ts`

**Interfaces :**
- Consumes : `Scenario['ecran']` (tâche 2) ; `useTexte` (tâche 7).
- Produces : `EcranTelephone` (props `ecran: Scenario['ecran']`). C'est le seul composant utilisé en dehors de `src/phone/`.

Note : SMS, messagerie et réseau social partagent `ThreadScreen` (prop `variante`), car seul leur style diffère.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/phone.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import EcranTelephone from '@/phone/EcranTelephone.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const ecran = (surcharge: Partial<Scenario['ecran']>): Scenario['ecran'] => ({
  app: 'sms',
  appNom: 'Messages',
  contact: 'Colis Express',
  messages: [
    { de: 'contact', texte: 'Payez 1,99 €', texteSimple: 'Paie 1,99 €' },
    { de: 'moi', texte: 'C’est quoi ?' },
  ],
  ...surcharge,
})

describe('EcranTelephone', () => {
  it('affiche une conversation avec qui parle', () => {
    const w = mount(EcranTelephone, { props: { ecran: ecran({}) } })
    expect(w.find('figure').attributes('aria-label')).toBe('Écran de téléphone : Messages')
    const bulles = w.findAll('li.bulle')
    expect(bulles).toHaveLength(2)
    expect(bulles[0]!.text()).toBe('Colis Express : Payez 1,99 €')
    expect(bulles[1]!.text()).toBe('Toi : C’est quoi ?')
  })

  it('affiche un mail avec expéditeur et objet', () => {
    const w = mount(EcranTelephone, { props: { ecran: ecran({ app: 'mail', sujet: 'Compte suspendu' }) } })
    expect(w.text()).toContain('De : Colis Express')
    expect(w.text()).toContain('Objet : Compte suspendu')
  })

  it('affiche l’adresse d’une page web', () => {
    const w = mount(EcranTelephone, { props: { ecran: ecran({ app: 'web', url: 'colis-expres.info/payer' }) } })
    expect(w.find('.barre-adresse').text()).toContain('colis-expres.info/payer')
  })

  it('utilise le texte simplifié si le réglage est actif', async () => {
    store.modifierReglages({ lectureSimple: true })
    const w = mount(EcranTelephone, { props: { ecran: ecran({}) } })
    expect(w.findAll('li.bulle')[0]!.text()).toContain('Paie 1,99 €')
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/phone.test.ts`
Expected : FAIL, `@/phone/EcranTelephone.vue` introuvable.

- [ ] **Step 3 : implémenter**

`src/phone/PhoneFrame.vue` :
```vue
<script setup lang="ts">
defineProps<{ appNom: string; contact: string }>()
</script>

<template>
  <figure class="telephone" :aria-label="`Écran de téléphone : ${appNom}`">
    <div class="barre-etat" aria-hidden="true"><span>14:32</span><span>4G ▮▮▮</span></div>
    <div class="entete-app">
      <span class="nom-app">{{ appNom }}</span>
      <strong class="contact">{{ contact }}</strong>
    </div>
    <div class="ecran"><slot /></div>
  </figure>
</template>

<style scoped>
.telephone {
  margin: 0; width: 100%; max-width: 22rem;
  border: 10px solid #1b1b2f; border-radius: 32px; background: #fff; overflow: hidden;
}
.barre-etat { display: flex; justify-content: space-between; padding: 0.2rem 1rem; font-size: 0.8em; background: #1b1b2f; color: #fff; }
.entete-app { display: flex; flex-direction: column; padding: 0.5rem 1rem; border-bottom: 1px solid var(--bord); }
.nom-app { font-size: 0.8em; color: var(--texte-doux); }
.contact { overflow-wrap: anywhere; }
.ecran { padding: 0.75rem; max-height: 30rem; overflow-y: auto; }
</style>
```

`src/phone/ThreadScreen.vue` :
```vue
<script setup lang="ts">
import type { Scenario } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'

defineProps<{ messages: Scenario['ecran']['messages']; contact: string; variante: 'sms' | 'chat' | 'social' }>()
const t = useTexte()
</script>

<template>
  <ol class="fil-messages" :class="variante">
    <li v-for="(m, i) in messages" :key="i" class="bulle" :class="m.de">
      <span class="visually-hidden">{{ m.de === 'moi' ? 'Toi' : contact }} :</span>
      {{ t(m.texte, m.texteSimple) }}
    </li>
  </ol>
</template>

<style scoped>
.fil-messages { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.bulle { max-width: 85%; padding: 0.5rem 0.75rem; border-radius: 16px; overflow-wrap: anywhere; }
.bulle.contact { align-self: flex-start; background: #ececf4; }
.bulle.moi { align-self: flex-end; background: var(--primaire); color: var(--primaire-texte); }
.chat .bulle.contact { background: #e8f0fb; }
.social .bulle.contact { background: #fdf0e6; }
</style>
```

Attention : le test attend `'Colis Express : Payez 1,99 €'`. Vue condense les espaces du template et `text()` enlève ceux du début et de la fin. Garder donc le libellé masqué **dans** le `<li>`, suivi d'un saut de ligne puis du message.

`src/phone/MailScreen.vue` :
```vue
<script setup lang="ts">
import type { Scenario } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'

defineProps<{ contact: string; sujet?: string; messages: Scenario['ecran']['messages'] }>()
const t = useTexte()
</script>

<template>
  <div class="mail">
    <p class="champ"><span class="libelle">De :</span> {{ contact }}</p>
    <p v-if="sujet" class="champ"><span class="libelle">Objet :</span> <strong>{{ sujet }}</strong></p>
    <hr />
    <p v-for="(m, i) in messages" :key="i">{{ t(m.texte, m.texteSimple) }}</p>
  </div>
</template>

<style scoped>
.champ { margin: 0.2rem 0; overflow-wrap: anywhere; }
.libelle { color: var(--texte-doux); }
</style>
```

`src/phone/WebScreen.vue` :
```vue
<script setup lang="ts">
import { Lock } from 'lucide-vue-next'
import type { Scenario } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'

defineProps<{ url?: string; messages: Scenario['ecran']['messages'] }>()
const t = useTexte()
</script>

<template>
  <div class="web">
    <p class="barre-adresse">
      <Lock aria-hidden="true" :size="14" />
      <span class="visually-hidden">Adresse du site :</span>
      {{ url ?? 'adresse masquée' }}
    </p>
    <div class="page">
      <p v-for="(m, i) in messages" :key="i">{{ t(m.texte, m.texteSimple) }}</p>
    </div>
  </div>
</template>

<style scoped>
.barre-adresse {
  display: flex; align-items: center; gap: 0.4em; margin: 0 0 0.75rem;
  padding: 0.3rem 0.6rem; border-radius: 999px; background: #ececf4; font-size: 0.9em; overflow-wrap: anywhere;
}
</style>
```

`src/phone/EcranTelephone.vue` :
```vue
<script setup lang="ts">
import type { Scenario } from '@/content/schema'
import MailScreen from './MailScreen.vue'
import PhoneFrame from './PhoneFrame.vue'
import ThreadScreen from './ThreadScreen.vue'
import WebScreen from './WebScreen.vue'

defineProps<{ ecran: Scenario['ecran'] }>()
</script>

<template>
  <PhoneFrame :app-nom="ecran.appNom" :contact="ecran.contact">
    <MailScreen v-if="ecran.app === 'mail'" :contact="ecran.contact" :sujet="ecran.sujet" :messages="ecran.messages" />
    <WebScreen v-else-if="ecran.app === 'web'" :url="ecran.url" :messages="ecran.messages" />
    <ThreadScreen v-else :variante="ecran.app" :contact="ecran.contact" :messages="ecran.messages" />
  </PhoneFrame>
</template>
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/phone.test.ts && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(téléphone): faux écrans SMS, messagerie, réseau social, mail et web

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10 : actions de récupération

**Files :**
- Create : `src/recovery/motDePasse.ts`, `src/recovery/BloquerSignaler.vue`, `src/recovery/ChangerMdp.vue`, `src/recovery/Activer2fa.vue`, `src/recovery/CapturePreuve.vue`, `src/recovery/PrevenirContacts.vue`, `src/recovery/DemanderAide.vue`, `src/recovery/registry.ts`
- Test : `tests/unit/recovery.test.ts`

**Interfaces :**
- Consumes : `RECOVERY_ACTIONS`, `RecoveryAction` (tâche 2).
- Produces : `evaluerMotDePasse(mdp: string): string[]` (liste des problèmes, vide si le mot de passe est solide) ; `RECUPERATIONS: Record<RecoveryAction, Component>`. Chaque composant émet `fait` (sans argument) quand l'élève a terminé l'action.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/recovery.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { RECOVERY_ACTIONS } from '@/content/schema'
import Activer2fa from '@/recovery/Activer2fa.vue'
import BloquerSignaler from '@/recovery/BloquerSignaler.vue'
import CapturePreuve from '@/recovery/CapturePreuve.vue'
import ChangerMdp from '@/recovery/ChangerMdp.vue'
import DemanderAide from '@/recovery/DemanderAide.vue'
import PrevenirContacts from '@/recovery/PrevenirContacts.vue'
import { evaluerMotDePasse } from '@/recovery/motDePasse'
import { RECUPERATIONS } from '@/recovery/registry'
import { bouton, cliquer } from './helpers'

describe('evaluerMotDePasse', () => {
  it.each([
    ['abc', 'Au moins 12 caractères'],
    ['azerty123456789', 'suites connues'],
    ['aaaaaaaaaaaaaaa', 'caractères variés'],
  ])('refuse « %s »', (mdp, probleme) => {
    expect(evaluerMotDePasse(mdp).join(' ')).toContain(probleme)
  })
  it('accepte une phrase de passe', () => {
    expect(evaluerMotDePasse('chat-bleu-mange-pizza')).toEqual([])
  })
})

describe('actions de récupération', () => {
  it('a un composant pour chaque action du schéma', () => {
    expect(Object.keys(RECUPERATIONS).sort()).toEqual([...RECOVERY_ACTIONS].sort())
  })

  it('bloquer-signaler : menu, bloquer, motif, envoyer', async () => {
    const w = mount(BloquerSignaler)
    await cliquer(w, 'Menu du contact')
    await cliquer(w, 'Bloquer')
    expect(bouton(w, 'Envoyer le signalement').attributes('disabled')).toBeDefined()
    await w.find('input[value="Faux compte"]').setValue()
    await cliquer(w, 'Envoyer le signalement')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('changer-mdp : exige un mot de passe solide et la déconnexion des autres appareils', async () => {
    const w = mount(ChangerMdp)
    await cliquer(w, 'Paramètres')
    await cliquer(w, 'Sécurité et connexion')
    await w.find('input#nouveau-mdp').setValue('abc')
    expect(bouton(w, 'Enregistrer').attributes('disabled')).toBeDefined()
    await w.find('input#nouveau-mdp').setValue('chat-bleu-mange-pizza')
    expect(bouton(w, 'Enregistrer').attributes('disabled')).toBeDefined()
    await w.find('input[type="checkbox"]').setValue(true)
    await w.find('form').trigger('submit')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('activer-2fa : méthode puis code', async () => {
    const w = mount(Activer2fa)
    await cliquer(w, 'Paramètres')
    await cliquer(w, 'Activer la double authentification')
    await w.find('input[value="appli"]').setValue()
    await cliquer(w, 'Suivant')
    await w.find('input#code-2fa').setValue('000000')
    expect(bouton(w, 'Valider').attributes('disabled')).toBeDefined()
    await w.find('input#code-2fa').setValue('482 913')
    await cliquer(w, 'Valider')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('capture-preuve : impossible de bloquer avant la capture', async () => {
    const w = mount(CapturePreuve)
    expect(bouton(w, 'Bloquer le compte').attributes('disabled')).toBeDefined()
    await cliquer(w, 'Faire une capture d’écran')
    await cliquer(w, 'Bloquer le compte')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('prevenir-contacts : explique pourquoi un mauvais message ne convient pas', async () => {
    const w = mount(PrevenirContacts)
    await w.find('input[value="codes"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('C’est exactement ce que ferait un pirate')
    expect(w.emitted('fait')).toBeUndefined()
    await w.find('input[value="bon"]').setValue()
    await cliquer(w, 'Envoyer')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('demander-aide : toute personne choisie est valable', async () => {
    const w = mount(DemanderAide)
    await cliquer(w, 'Le 3018')
    expect(w.text()).toContain('Des spécialistes t’écoutent')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/recovery.test.ts`
Expected : FAIL, modules `@/recovery/...` introuvables.

- [ ] **Step 3 : implémenter**

`src/recovery/motDePasse.ts` :
```ts
/** Problèmes d'un mot de passe (liste vide = solide). Règles volontairement simples et pédagogiques. */
export function evaluerMotDePasse(mdp: string): string[] {
  const problemes: string[] = []
  if (mdp.length < 12) problemes.push('Au moins 12 caractères : une phrase de 3 ou 4 mots, c’est long et facile à retenir.')
  if (/123|azerty|qwerty|motdepasse|password|0000/i.test(mdp)) problemes.push('Évite les suites connues comme « 123 » ou « azerty ».')
  if (mdp.length > 0 && new Set(mdp).size <= 3) problemes.push('Utilise des caractères variés.')
  return problemes
}
```

`src/recovery/BloquerSignaler.vue` :
```vue
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const etape = ref<'menu' | 'options' | 'signaler' | 'fini'>('menu')
const motif = ref<string | null>(null)
const MOTIFS = ['Arnaque ou fraude', 'Harcèlement', 'Faux compte', 'Autre']
</script>

<template>
  <section class="recuperation carte">
    <h3>Bloque et signale ce compte</h3>
    <template v-if="etape === 'menu'">
      <p>Ouvre le menu du contact.</p>
      <button type="button" class="btn" @click="etape = 'options'"><span aria-hidden="true">⋮</span> Menu du contact</button>
    </template>
    <template v-else-if="etape === 'options'">
      <p>Commence par bloquer : ce compte ne pourra plus te contacter.</p>
      <button type="button" class="btn" @click="etape = 'signaler'"><span aria-hidden="true">🚫</span> Bloquer</button>
    </template>
    <template v-else-if="etape === 'signaler'">
      <fieldset>
        <legend>Compte bloqué. Maintenant, signale-le : pourquoi ?</legend>
        <label v-for="m in MOTIFS" :key="m" class="option">
          <input v-model="motif" type="radio" name="motif" :value="m" /> {{ m }}
        </label>
      </fieldset>
      <button type="button" class="btn btn-primaire" :disabled="!motif" @click="etape = 'fini'">Envoyer le signalement</button>
    </template>
    <template v-else>
      <p role="status">
        <span aria-hidden="true">✅</span> Bloqué et signalé. La plateforme va examiner le compte, et tu protèges
        aussi les autres.
      </p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
```

`src/recovery/ChangerMdp.vue` :
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { evaluerMotDePasse } from './motDePasse'

const emit = defineEmits<{ fait: [] }>()
const etape = ref<'parametres' | 'securite' | 'formulaire' | 'fini'>('parametres')
const mdp = ref('')
const deconnecter = ref(false)
const problemes = computed(() => evaluerMotDePasse(mdp.value))
const valide = computed(() => mdp.value.length > 0 && problemes.value.length === 0 && deconnecter.value)

function enregistrer() {
  if (valide.value) etape.value = 'fini'
}
</script>

<template>
  <section class="recuperation carte">
    <h3>Change ton mot de passe</h3>
    <template v-if="etape === 'parametres'">
      <p>Ouvre les paramètres de ton compte.</p>
      <button type="button" class="btn" @click="etape = 'securite'"><span aria-hidden="true">⚙️</span> Paramètres</button>
    </template>
    <template v-else-if="etape === 'securite'">
      <p>Va dans la rubrique qui protège ton compte.</p>
      <button type="button" class="btn" @click="etape = 'formulaire'"><span aria-hidden="true">🔒</span> Sécurité et connexion</button>
    </template>
    <form v-else-if="etape === 'formulaire'" @submit.prevent="enregistrer">
      <p class="avertissement">C’est un jeu : n’écris pas ton vrai mot de passe !</p>
      <label for="nouveau-mdp">Nouveau mot de passe</label>
      <input id="nouveau-mdp" v-model="mdp" type="text" autocomplete="off" aria-describedby="conseils-mdp" />
      <ul id="conseils-mdp" aria-live="polite">
        <li v-for="p in problemes" :key="p">{{ p }}</li>
        <li v-if="mdp && !problemes.length"><span aria-hidden="true">✅</span> Mot de passe solide.</li>
      </ul>
      <label class="option">
        <input v-model="deconnecter" type="checkbox" />
        Déconnecter tous les autres appareils (au cas où quelqu’un d’autre serait connecté)
      </label>
      <button type="submit" class="btn btn-primaire" :disabled="!valide">Enregistrer</button>
    </form>
    <template v-else>
      <p role="status">
        <span aria-hidden="true">✅</span> Mot de passe changé et autres appareils déconnectés. Si quelqu’un avait
        ton ancien mot de passe, il est dehors.
      </p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
```

`src/recovery/Activer2fa.vue` :
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const CODE = '482913'
const etape = ref<'parametres' | 'securite' | 'methode' | 'code' | 'fini'>('parametres')
const methode = ref<'appli' | 'sms' | null>(null)
const code = ref('')
const codeOk = computed(() => code.value.replace(/\s/g, '') === CODE)
</script>

<template>
  <section class="recuperation carte">
    <h3>Active la double authentification</h3>
    <template v-if="etape === 'parametres'">
      <p>Ouvre les paramètres de ton compte.</p>
      <button type="button" class="btn" @click="etape = 'securite'"><span aria-hidden="true">⚙️</span> Paramètres</button>
    </template>
    <template v-else-if="etape === 'securite'">
      <p>Avec la double authentification, même quelqu’un qui connaît ton mot de passe ne pourra pas se connecter sans un code.</p>
      <button type="button" class="btn" @click="etape = 'methode'">Activer la double authentification</button>
    </template>
    <template v-else-if="etape === 'methode'">
      <fieldset>
        <legend>Comment veux-tu recevoir tes codes ?</legend>
        <label class="option"><input v-model="methode" type="radio" name="methode" value="appli" /> Une appli d’authentification (le plus sûr)</label>
        <label class="option"><input v-model="methode" type="radio" name="methode" value="sms" /> Par SMS</label>
      </fieldset>
      <button type="button" class="btn btn-primaire" :disabled="!methode" @click="etape = 'code'">Suivant</button>
    </template>
    <template v-else-if="etape === 'code'">
      <p>Code reçu : <strong>482 913</strong></p>
      <label for="code-2fa">Recopie le code</label>
      <input id="code-2fa" v-model="code" inputmode="numeric" autocomplete="off" />
      <p class="avertissement">Ne donne JAMAIS ce code à quelqu’un, même à un ami ou à un « support ».</p>
      <button type="button" class="btn btn-primaire" :disabled="!codeOk" @click="etape = 'fini'">Valider</button>
    </template>
    <template v-else>
      <p role="status"><span aria-hidden="true">✅</span> Double authentification activée. Ton compte est bien mieux protégé.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
```

`src/recovery/CapturePreuve.vue` :
```vue
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const capture = ref(false)
const bloque = ref(false)
</script>

<template>
  <section class="recuperation carte">
    <h3>Garde des preuves, puis bloque</h3>
    <p>Avant de bloquer, fais une capture d’écran : une fois le compte bloqué, tu risques de ne plus voir les messages.</p>
    <template v-if="!bloque">
      <div class="actions">
        <button type="button" class="btn" :disabled="capture" @click="capture = true">
          <span aria-hidden="true">📸</span> Faire une capture d’écran
        </button>
        <button type="button" class="btn" :disabled="!capture" @click="bloque = true">
          <span aria-hidden="true">🚫</span> Bloquer le compte
        </button>
      </div>
      <p v-if="capture" role="status">Capture enregistrée dans ta galerie, avec la date et le nom du compte.</p>
    </template>
    <template v-else>
      <p role="status">
        <span aria-hidden="true">✅</span> Preuves gardées et compte bloqué. Tu pourras montrer les captures à un
        adulte ou au 3018.
      </p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
```

`src/recovery/PrevenirContacts.vue` :
```vue
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const MESSAGES = [
  {
    id: 'bon',
    texte: 'On a piraté mon compte. Si tu reçois un message bizarre de moi, ne clique sur rien et ne donne aucun code.',
    retour: '',
  },
  {
    id: 'codes',
    texte: 'Salut, envoie-moi le code que tu vas recevoir, c’est pour vérifier mon compte.',
    retour: 'C’est exactement ce que ferait un pirate ! Ne demande jamais de code à tes amis.',
  },
  {
    id: 'rien',
    texte: 'Coucou 😊',
    retour: 'Tes amis ne sauront pas qu’il faut se méfier des messages envoyés depuis ton compte.',
  },
]
const choix = ref<string | null>(null)
const retour = ref('')
const envoye = ref(false)

function envoyer() {
  const message = MESSAGES.find((m) => m.id === choix.value)
  if (!message) return
  if (message.id === 'bon') envoye.value = true
  else retour.value = message.retour
}
</script>

<template>
  <section class="recuperation carte">
    <h3>Préviens tes contacts</h3>
    <template v-if="!envoye">
      <fieldset>
        <legend>Quel message envoies-tu à tes amis ?</legend>
        <label v-for="m in MESSAGES" :key="m.id" class="option">
          <input v-model="choix" type="radio" name="message-contacts" :value="m.id" @change="retour = ''" /> {{ m.texte }}
        </label>
      </fieldset>
      <p v-if="retour" role="status">{{ retour }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!choix" @click="envoyer">Envoyer</button>
    </template>
    <template v-else>
      <p role="status"><span aria-hidden="true">✅</span> Message envoyé. Tes amis savent qu’il faut se méfier.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
```

`src/recovery/DemanderAide.vue` :
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const PERSONNES = [
  { id: 'parent', nom: 'Un parent ou un adulte de ta famille', role: 'Il ou elle peut t’aider à sécuriser tes comptes et à contacter la banque ou la plateforme.' },
  { id: 'prof', nom: 'Un·e prof', role: 'Il ou elle peut t’écouter et prévenir les bonnes personnes dans l’établissement.' },
  { id: 'cpe', nom: 'Le ou la CPE', role: 'Il ou elle gère les situations difficiles entre élèves et peut agir vite.' },
  { id: 'infirmier', nom: 'L’infirmier·e scolaire', role: 'Il ou elle peut t’écouter en toute confidentialité si ça te pèse.' },
  { id: '3018', nom: 'Le 3018 (gratuit, confidentiel, 7 j/7 de 9 h à 23 h)', role: 'Des spécialistes t’écoutent et peuvent faire supprimer des contenus sur les réseaux.' },
]
const choisi = ref<string | null>(null)
const personne = computed(() => PERSONNES.find((p) => p.id === choisi.value))
</script>

<template>
  <section class="recuperation carte">
    <h3>À qui en parler ?</h3>
    <p>Tu n’as pas à gérer ça seul·e. Choisis la personne à qui tu en parlerais :</p>
    <ul class="personnes">
      <li v-for="p in PERSONNES" :key="p.id">
        <button type="button" class="btn" :aria-pressed="choisi === p.id" @click="choisi = p.id">{{ p.nom }}</button>
      </li>
    </ul>
    <template v-if="personne">
      <p role="status">Bon choix. {{ personne.role }} Toutes ces personnes sont de bonnes options.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.personnes { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
</style>
```

`src/recovery/registry.ts` :
```ts
import type { Component } from 'vue'
import type { RecoveryAction } from '@/content/schema'
import Activer2fa from './Activer2fa.vue'
import BloquerSignaler from './BloquerSignaler.vue'
import CapturePreuve from './CapturePreuve.vue'
import ChangerMdp from './ChangerMdp.vue'
import DemanderAide from './DemanderAide.vue'
import PrevenirContacts from './PrevenirContacts.vue'

export const RECUPERATIONS: Record<RecoveryAction, Component> = {
  'bloquer-signaler': BloquerSignaler,
  'changer-mdp': ChangerMdp,
  'activer-2fa': Activer2fa,
  'capture-preuve': CapturePreuve,
  'prevenir-contacts': PrevenirContacts,
  'demander-aide': DemanderAide,
}
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/recovery.test.ts && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(récupération): six gestes pratiqués dans le faux téléphone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11 : étape « scénario » (choix, indices, conséquence, récupération)

**Files :**
- Create : `src/mission/ChoixList.vue`, `src/mission/IndicesForm.vue`, `src/mission/ConsequencePanel.vue`, `src/mission/ScenarioStep.vue`
- Test : `tests/unit/scenario-step.test.ts`

**Interfaces :**
- Consumes : `Scenario` (tâche 2) ; `PhaseScenario`, `RunEvent`, `ScenarioResultat` (tâche 4) ; `Mode`, `useProgress` (tâche 6) ; `useTexte` (tâche 7) ; `EcranTelephone` (tâche 9) ; `RECUPERATIONS` (tâche 10).
- Produces : `ScenarioStep` (props `scenario: Scenario`, `phase: PhaseScenario`, `resultat?: ScenarioResultat`, `mode: Mode`, `sensible: boolean` ; emit `evenement: [RunEvent]`). Attributs DOM utilisés par les tests E2E : `data-qualite` et `data-choix` sur les boutons de choix.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/scenario-step.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { missionFixture } from './fixtures'
import { bouton, cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const scenario = () => missionFixture().etapes[0] as Scenario
const resultatClic: ScenarioResultat = {
  type: 'scenario',
  choixId: 'clic',
  qualite: 'risque',
  indicesChoisis: ['url'],
  indicesJustes: 1,
  indicesFaux: 0,
  recuperationFaite: null,
  passe: false,
}
const monter = (props: Record<string, unknown> = {}) =>
  mount(ScenarioStep, { props: { scenario: scenario(), phase: 'situation', mode: 'solo', sensible: false, ...props } })

describe('ScenarioStep', () => {
  it('situation (solo) : un clic sur un choix l’envoie', async () => {
    const w = monter()
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    await w.find('[data-choix="aide"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'aide' }]])
  })

  it('binôme : invite à discuter', () => {
    expect(monter({ mode: 'binome' }).text()).toContain('Discutez à deux avant de choisir')
  })

  it('classe : le choix doit être validé par l’adulte', async () => {
    const w = monter({ mode: 'classe' })
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('evenement')).toBeUndefined()
    expect(w.find('[data-choix="verif"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider le choix de la classe')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'verif' }]])
  })

  it('indices : « Je ne sais pas » ou sélection', async () => {
    const w = monter({ phase: 'indices' })
    expect(bouton(w, 'Valider').attributes('disabled')).toBeDefined()
    await cliquer(w, 'Je ne sais pas')
    await w.find('input[value="url"]').setValue(true)
    await w.find('form').trigger('submit')
    expect(w.emitted('evenement')).toEqual([
      [{ type: 'valider-indices', indices: [] }],
      [{ type: 'valider-indices', indices: ['url'] }],
    ])
  })

  it('conséquence : verdict, indices, à retenir, continuer ou rejouer', async () => {
    const w = monter({ phase: 'consequence', resultat: resultatClic })
    expect(w.text()).toContain('C’était risqué')
    expect(w.text()).toContain('La carte est volée.')
    expect(w.text()).toContain('tu l’avais coché')
    expect(w.text()).toContain('Un transporteur ne demande pas de payer par SMS.')
    await cliquer(w, 'Rejouer ce scénario')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }], [{ type: 'continuer' }]])
  })

  it('lecture simplifiée activée pendant la conséquence : le texte change, la phase reste', async () => {
    const w = monter({ phase: 'consequence', resultat: resultatClic })
    store.modifierReglages({ lectureSimple: true })
    await w.vm.$nextTick()
    expect(w.text()).toContain('On vole la carte.')
    expect(w.text()).toContain('Ne paie jamais un colis par SMS.')
    expect(bouton(w, 'Continuer').exists()).toBe(true)
  })

  it('récupération : affiche l’action prévue et signale quand elle est faite', async () => {
    const w = monter({ phase: 'recuperation', resultat: resultatClic })
    expect(w.text()).toContain('Bloque et signale ce compte')
    await cliquer(w, 'Menu du contact')
    await cliquer(w, 'Bloquer')
    await w.find('input[value="Arnaque ou fraude"]').setValue()
    await cliquer(w, 'Envoyer le signalement')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'recuperation-faite' }]])
  })

  it('thème sensible : bouton « Passer ce scénario »', async () => {
    expect(monter().text()).not.toContain('Passer ce scénario')
    const w = monter({ sensible: true })
    await cliquer(w, 'Passer ce scénario')
    expect(w.emitted('evenement')).toEqual([[{ type: 'passer' }]])
  })

  it('annonce le rôle joué', () => {
    const w = monter({ scenario: { ...scenario(), role: 'temoin' } })
    expect(w.text()).toContain('Dans ce scénario, tu joues un·e témoin.')
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/scenario-step.test.ts`
Expected : FAIL, `@/mission/ScenarioStep.vue` introuvable.

- [ ] **Step 3 : implémenter**

`src/mission/ChoixList.vue` :
```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Scenario } from '@/content/schema'
import type { Mode } from '@/store/progress'

const props = defineProps<{ choix: Scenario['choix']; mode: Mode }>()
const emit = defineEmits<{ choisir: [choixId: string] }>()
const selection = ref<string | null>(null)

function cliquer(id: string) {
  if (props.mode === 'classe') selection.value = id
  else emit('choisir', id)
}
function validerClasse() {
  if (selection.value) emit('choisir', selection.value)
}
</script>

<template>
  <div class="choix">
    <p v-if="mode === 'binome'" class="consigne-mode"><span aria-hidden="true">💬</span> Discutez à deux avant de choisir.</p>
    <p v-if="mode === 'classe'" class="consigne-mode">
      <span aria-hidden="true">✋</span> Votez à main levée, puis l’adulte valide le choix de la classe.
    </p>
    <ol class="liste-choix">
      <li v-for="c in choix" :key="c.id">
        <button
          type="button"
          class="btn choix-btn"
          :data-qualite="c.qualite"
          :data-choix="c.id"
          :aria-pressed="mode === 'classe' ? selection === c.id : undefined"
          @click="cliquer(c.id)"
        >
          {{ c.texte }}
        </button>
      </li>
    </ol>
    <button v-if="mode === 'classe'" type="button" class="btn btn-primaire" :disabled="!selection" @click="validerClasse">
      Valider le choix de la classe
    </button>
  </div>
</template>

<style scoped>
.liste-choix { display: flex; flex-direction: column; gap: 0.6rem; padding-left: 1.5rem; }
.choix-btn { width: 100%; text-align: left; justify-content: flex-start; }
.choix-btn[aria-pressed='true'] { background: var(--primaire); color: var(--primaire-texte); }
.consigne-mode { font-weight: 700; }
</style>
```

`src/mission/IndicesForm.vue` :
```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Scenario } from '@/content/schema'

defineProps<{ indices: Scenario['indices'] }>()
const emit = defineEmits<{ valider: [ids: string[]] }>()
const coches = ref<string[]>([])
</script>

<template>
  <form class="indices" @submit.prevent="emit('valider', [...coches])">
    <fieldset>
      <legend>Coche ce qui t’a fait réagir (plusieurs réponses possibles).</legend>
      <label v-for="i in indices" :key="i.id" class="option">
        <input v-model="coches" type="checkbox" :value="i.id" /> {{ i.libelle }}
      </label>
    </fieldset>
    <div class="actions">
      <button type="submit" class="btn btn-primaire" :disabled="!coches.length">Valider</button>
      <button type="button" class="btn" @click="emit('valider', [])">Je ne sais pas</button>
    </div>
  </form>
</template>
```

`src/mission/ConsequencePanel.vue` :
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Qualite, Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { useTexte } from '@/ui/useTexte'

const props = defineProps<{ scenario: Scenario; resultat: ScenarioResultat }>()
const emit = defineEmits<{ continuer: []; rejouer: [] }>()
const t = useTexte()

const choix = computed(() => props.scenario.choix.find((c) => c.id === props.resultat.choixId))
const VERDICTS: Record<Qualite, { icone: string; titre: string }> = {
  bon: { icone: '✅', titre: 'Bon réflexe !' },
  aide: { icone: '🤝', titre: 'Demander de l’aide, c’est toujours une bonne idée.' },
  risque: { icone: '⚠️', titre: 'C’était risqué. Voyons ce qui se passe.' },
}
</script>

<template>
  <section v-if="choix" class="consequence">
    <p class="verdict" :class="choix.qualite">
      <span aria-hidden="true">{{ VERDICTS[choix.qualite].icone }}</span> <strong>{{ VERDICTS[choix.qualite].titre }}</strong>
    </p>
    <p><strong>Ton choix :</strong> {{ choix.texte }}</p>
    <p>{{ t(choix.consequence, choix.consequenceSimple) }}</p>
    <h3>Les indices</h3>
    <ul class="liste-indices">
      <li v-for="i in scenario.indices" :key="i.id">
        <strong>{{ i.pertinent ? 'Vrai indice' : 'Pas un indice' }} :</strong> {{ i.libelle }}
        <span v-if="resultat.indicesChoisis.includes(i.id)" class="coche"> (tu l’avais coché)</span>
      </li>
    </ul>
    <p>{{ scenario.explicationIndices }}</p>
    <div class="a-retenir" role="note">
      <h3>À retenir</h3>
      <p>{{ t(scenario.aRetenir, scenario.aRetenirSimple) }}</p>
    </div>
    <div class="actions">
      <button type="button" class="btn" @click="emit('rejouer')">Rejouer ce scénario</button>
      <button type="button" class="btn btn-primaire" @click="emit('continuer')">Continuer</button>
    </div>
  </section>
</template>

<style scoped>
.verdict { font-size: 1.15em; }
.verdict.bon { color: var(--bon); }
.verdict.risque { color: var(--risque); }
.verdict.aide { color: var(--aide); }
.coche { color: var(--texte-doux); }
.a-retenir { background: #eef0ff; border-left: 6px solid var(--primaire); padding: 0.5rem 1rem; border-radius: var(--rayon); }
</style>
```

`src/mission/ScenarioStep.vue` :
```vue
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { Scenario } from '@/content/schema'
import type { PhaseScenario, RunEvent, ScenarioResultat } from '@/engine/mission-runner'
import EcranTelephone from '@/phone/EcranTelephone.vue'
import { RECUPERATIONS } from '@/recovery/registry'
import type { Mode } from '@/store/progress'
import ChoixList from './ChoixList.vue'
import ConsequencePanel from './ConsequencePanel.vue'
import IndicesForm from './IndicesForm.vue'

const props = defineProps<{
  scenario: Scenario
  phase: PhaseScenario
  resultat?: ScenarioResultat
  mode: Mode
  sensible: boolean
}>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()

const TITRES: Record<Exclude<PhaseScenario, 'situation'>, string> = {
  indices: 'Qu’est-ce qui t’a décidé ?',
  consequence: 'Et alors, que se passe-t-il ?',
  recuperation: 'Maintenant, limite les dégâts',
}
const ROLES = { victime: 'la personne visée', temoin: 'un·e témoin', auteur: 'celui ou celle qui a dérapé' } as const

const titre = ref<HTMLElement | null>(null)
watch(
  () => props.phase,
  async () => {
    await nextTick()
    titre.value?.focus()
  },
)
</script>

<template>
  <article class="scenario">
    <p v-if="scenario.role" class="role">Dans ce scénario, tu joues {{ ROLES[scenario.role] }}.</p>
    <div class="scenario-grille">
      <EcranTelephone :ecran="scenario.ecran" />
      <div class="scenario-panneau">
        <h2 ref="titre" tabindex="-1">{{ phase === 'situation' ? scenario.question : TITRES[phase] }}</h2>
        <ChoixList
          v-if="phase === 'situation'"
          :choix="scenario.choix"
          :mode="mode"
          @choisir="(id) => emit('evenement', { type: 'choisir', choixId: id })"
        />
        <IndicesForm
          v-else-if="phase === 'indices'"
          :indices="scenario.indices"
          @valider="(ids) => emit('evenement', { type: 'valider-indices', indices: ids })"
        />
        <ConsequencePanel
          v-else-if="phase === 'consequence' && resultat"
          :scenario="scenario"
          :resultat="resultat"
          @continuer="emit('evenement', { type: 'continuer' })"
          @rejouer="emit('evenement', { type: 'rejouer' })"
        />
        <component
          :is="RECUPERATIONS[scenario.recuperation.action]"
          v-else-if="phase === 'recuperation' && scenario.recuperation"
          @fait="emit('evenement', { type: 'recuperation-faite' })"
        />
        <div v-if="sensible" class="actions">
          <button type="button" class="btn btn-discret" @click="emit('evenement', { type: 'passer' })">
            Passer ce scénario
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.scenario-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 22rem) minmax(0, 1fr); align-items: start; }
@media (max-width: 48rem) { .scenario-grille { grid-template-columns: minmax(0, 1fr); } }
.role { font-weight: 700; color: var(--primaire); }
h2:focus { outline: none; }
h2:focus-visible { outline: 3px solid var(--focus); }
</style>
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/scenario-step.test.ts && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(mission): étape scénario en 4 temps avec modes solo/binôme/classe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12 : mini-jeux « tri » et « repère »

**Files :**
- Create : `src/minigames/TriGame.vue`, `src/minigames/RepereGame.vue`, `src/mission/MinijeuStep.vue`
- Test : `tests/unit/minigames.test.ts`

**Interfaces :**
- Consumes : `TriConfig`, `RepereConfig`, `Minijeu` (tâche 2) ; `RunEvent` (tâche 4).
- Produces : `TriGame` (props `config: TriConfig`, `chrono: boolean` ; emit `termine: [{ reussites: number; erreurs: number }]`) ; `RepereGame` (props `config: RepereConfig` ; même emit) ; `MinijeuStep` (props `etape: Minijeu`, `chrono: boolean` ; emit `evenement: [RunEvent]` de type `minijeu-termine`). Les boutons de catégorie du tri sont dans `.tri-categories`. Les libellés utilisés par les tests E2E sont « Suivant », « Terminer le mini-jeu » et « Voir la solution ».

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/minigames.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RepereGame from '@/minigames/RepereGame.vue'
import TriGame from '@/minigames/TriGame.vue'
import MinijeuStep from '@/mission/MinijeuStep.vue'
import { repereFixture, triFixture } from './fixtures'
import { cliquer } from './helpers'

afterEach(() => vi.useRealTimers())

describe('TriGame', () => {
  it('compte réussites et erreurs puis termine', async () => {
    const w = mount(TriGame, { props: { config: triFixture(), chrono: false } })
    expect(w.text()).toContain('Carte 1 sur 4')
    expect(w.find('[role="timer"]').exists()).toBe(false)
    await cliquer(w, 'Arnaque')
    expect(w.text()).toContain('Bien vu !')
    await cliquer(w, 'Suivant')
    await cliquer(w, 'Arnaque')
    expect(w.text()).toContain('Pas tout à fait : c’était « Légitime »')
    await cliquer(w, 'Suivant')
    await cliquer(w, 'Arnaque')
    await cliquer(w, 'Suivant')
    await cliquer(w, 'Légitime')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 3, erreurs: 1 }]])
  })

  it('avec chrono, le temps écoulé compte comme une erreur', async () => {
    vi.useFakeTimers()
    const w = mount(TriGame, { props: { config: triFixture(), chrono: true } })
    expect(w.find('[role="timer"]').text()).toContain('20 s')
    vi.advanceTimersByTime(20_000)
    await w.vm.$nextTick()
    expect(w.text()).toContain('Temps écoulé')
    expect(w.findAll('.tri-categories button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })
})

describe('RepereGame', () => {
  it('trouver tous les indices permet de terminer', async () => {
    const w = mount(RepereGame, { props: { config: repereFixture() } })
    expect(w.text()).toContain('Indices trouvés : 0 sur 2')
    await cliquer(w, 'Identifiant')
    expect(w.text()).toContain('Rien de suspect ici.')
    await cliquer(w, 'gamebox-login.xyz')
    expect(w.text()).toContain('Ce n’est pas le vrai site.')
    await cliquer(w, '10 000 Coins')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 2, erreurs: 1 }]])
  })

  it('« Voir la solution » révèle tout et compte les indices manqués', async () => {
    const w = mount(RepereGame, { props: { config: repereFixture() } })
    await cliquer(w, 'gamebox-login.xyz')
    await cliquer(w, 'Voir la solution')
    expect(w.text()).toContain('Trop beau pour être vrai.')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 1, erreurs: 1 }]])
  })
})

describe('MinijeuStep', () => {
  it('affiche le bon jeu et émet minijeu-termine', async () => {
    const etape = { type: 'minijeu' as const, id: 'mj', jeu: 'repere' as const, config: repereFixture() }
    const w = mount(MinijeuStep, { props: { etape, chrono: false } })
    expect(w.findComponent(RepereGame).exists()).toBe(true)
    await cliquer(w, 'Voir la solution')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('evenement')).toEqual([[{ type: 'minijeu-termine', reussites: 0, erreurs: 2 }]])
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/minigames.test.ts`
Expected : FAIL, modules introuvables.

- [ ] **Step 3 : implémenter**

`src/minigames/TriGame.vue` :
```vue
<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { TriConfig } from '@/content/schema'

const props = defineProps<{ config: TriConfig; chrono: boolean }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const DUREE = 20
const TEMPS_ECOULE = '__temps__' // ne peut pas être un identifiant de catégorie (pas de « _ » dans les slugs)

const index = ref(0)
const reponse = ref<string | null>(null)
const reussites = ref(0)
const erreurs = ref(0)
const restant = ref(DUREE)
let minuteur: ReturnType<typeof setInterval> | undefined

const carte = computed(() => props.config.cartes[index.value]!)
const categorieJuste = computed(() => props.config.categories.find((c) => c.id === carte.value.categorie)!)
const derniere = computed(() => index.value === props.config.cartes.length - 1)

function arreterChrono() {
  clearInterval(minuteur)
  minuteur = undefined
}
function demarrerChrono() {
  arreterChrono()
  if (!props.chrono) return
  restant.value = DUREE
  minuteur = setInterval(() => {
    restant.value -= 1
    if (restant.value <= 0) repondre(TEMPS_ECOULE)
  }, 1000)
}
function repondre(id: string) {
  if (reponse.value !== null) return
  arreterChrono()
  reponse.value = id
  if (id === carte.value.categorie) reussites.value += 1
  else erreurs.value += 1
}
function suivant() {
  if (derniere.value) {
    emit('termine', { reussites: reussites.value, erreurs: erreurs.value })
    return
  }
  index.value += 1
  reponse.value = null
  demarrerChrono()
}

demarrerChrono()
onUnmounted(arreterChrono)
</script>

<template>
  <div class="tri">
    <p>{{ config.consigne }}</p>
    <p class="compteur">Carte {{ index + 1 }} sur {{ config.cartes.length }}</p>
    <p v-if="chrono && reponse === null" class="chrono" role="timer" aria-live="off">
      <span aria-hidden="true">⏱️</span> {{ restant }} s
    </p>
    <blockquote class="carte carte-tri">{{ carte.texte }}</blockquote>
    <div class="tri-categories actions" role="group" aria-label="Choisis une catégorie">
      <button
        v-for="c in config.categories"
        :key="c.id"
        type="button"
        class="btn"
        :disabled="reponse !== null"
        @click="repondre(c.id)"
      >
        {{ c.libelle }}
      </button>
    </div>
    <div v-if="reponse !== null" class="retour" role="status">
      <p v-if="reponse === carte.categorie"><span aria-hidden="true">✅</span> Bien vu !</p>
      <p v-else-if="reponse === TEMPS_ECOULE">
        <span aria-hidden="true">⏱️</span> Temps écoulé : c’était « {{ categorieJuste.libelle }} ».
      </p>
      <p v-else><span aria-hidden="true">❌</span> Pas tout à fait : c’était « {{ categorieJuste.libelle }} ».</p>
      <p>{{ carte.explication }}</p>
      <button type="button" class="btn btn-primaire" @click="suivant">
        {{ derniere ? 'Terminer le mini-jeu' : 'Suivant' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.carte-tri { margin: 1rem 0; font-size: 1.1em; }
.chrono { font-weight: 700; }
</style>
```

`src/minigames/RepereGame.vue` :
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RepereConfig } from '@/content/schema'

type Ligne = RepereConfig['lignes'][number]

const props = defineProps<{ config: RepereConfig }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const trouves = ref<string[]>([])
const erreurs = ref(0)
const message = ref('')
const revele = ref(false)

const indices = computed(() => props.config.lignes.filter((l) => l.indice))
const fini = computed(() => revele.value || trouves.value.length === indices.value.length)
const marquee = (l: Ligne) => trouves.value.includes(l.id) || (revele.value && l.indice)

function cliquer(l: Ligne) {
  if (fini.value || trouves.value.includes(l.id)) return
  if (l.indice) {
    trouves.value.push(l.id)
    message.value = l.explication ?? ''
  } else {
    erreurs.value += 1
    message.value = 'Rien de suspect ici.'
  }
}
function reveler() {
  erreurs.value += indices.value.length - trouves.value.length
  revele.value = true
  message.value = ''
}
</script>

<template>
  <div class="repere">
    <p>{{ config.consigne }}</p>
    <p class="compteur">Indices trouvés : {{ trouves.length }} sur {{ indices.length }}</p>
    <div class="carte ecran-repere">
      <p><strong>{{ config.titre }}</strong></p>
      <ul class="lignes">
        <li v-for="l in config.lignes" :key="l.id">
          <button type="button" class="ligne" :class="{ marquee: marquee(l) }" :aria-pressed="marquee(l)" @click="cliquer(l)">
            {{ l.texte }}<span v-if="marquee(l)" class="marque"> (indice)</span>
          </button>
          <p v-if="revele && l.indice" class="explication">{{ l.explication }}</p>
        </li>
      </ul>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <div class="actions">
      <button v-if="!fini" type="button" class="btn" @click="reveler">Voir la solution</button>
      <button v-else type="button" class="btn btn-primaire" @click="emit('termine', { reussites: trouves.length, erreurs })">
        Terminer le mini-jeu
      </button>
    </div>
  </div>
</template>

<style scoped>
.lignes { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.ligne {
  width: 100%; min-height: 44px; text-align: left; padding: 0.4rem 0.6rem; font: inherit;
  background: transparent; border: 2px dashed var(--bord); border-radius: 8px; cursor: pointer;
}
.ligne.marquee { border: 3px solid var(--risque); background: #fdecea; }
.marque { font-weight: 700; color: var(--risque); }
.explication { margin: 0.2rem 0 0.5rem 0.6rem; color: var(--texte-doux); }
</style>
```

`src/mission/MinijeuStep.vue` :
```vue
<script setup lang="ts">
import type { Minijeu } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'
import RepereGame from '@/minigames/RepereGame.vue'
import TriGame from '@/minigames/TriGame.vue'

defineProps<{ etape: Minijeu; chrono: boolean }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()

function terminer(resultat: { reussites: number; erreurs: number }) {
  emit('evenement', { type: 'minijeu-termine', ...resultat })
}
</script>

<template>
  <section class="minijeu">
    <h2>Mini-jeu</h2>
    <TriGame v-if="etape.jeu === 'tri'" :config="etape.config" :chrono="chrono" @termine="terminer" />
    <RepereGame v-else :config="etape.config" @termine="terminer" />
  </section>
</template>
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run tests/unit/minigames.test.ts && npm run typecheck`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(mini-jeux): tri de messages (chrono optionnel) et repérage d'indices

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13 : étape « fil de notifications » (missions Rappel)

**Files :**
- Create : `src/mission/FilStep.vue`
- Test : `tests/unit/fil-step.test.ts`

**Interfaces :**
- Consumes : `Fil`, `FIL_ACTIONS`, `FilAction` (tâche 2) ; `RunEvent` (tâche 4).
- Produces : `FilStep` (props `fil: Fil` ; emit `evenement: [RunEvent]` de type `fil-termine`). Libellés utilisés par les tests E2E : « Je vérifie autrement », « J’ouvre / je clique » et « Valider mes choix ». Aucun indice visuel ne distingue la notification surprise.

- [ ] **Step 1 : écrire le test (qui doit échouer)**

`tests/unit/fil-step.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Fil } from '@/content/schema'
import FilStep from '@/mission/FilStep.vue'
import { rappelFixture } from './fixtures'
import { bouton } from './helpers'

const fil = () => rappelFixture().etapes[0] as Fil

describe('FilStep', () => {
  it('exige une action par notification puis les envoie', async () => {
    const w = mount(FilStep, { props: { fil: fil() } })
    expect(w.findAll('fieldset')).toHaveLength(3)
    expect(w.html()).not.toContain('surprise')
    expect(bouton(w, 'Valider mes choix').attributes('disabled')).toBeDefined()
    await w.find('input[name="notif-n1"][value="ignorer"]').setValue()
    await w.find('input[name="notif-n2"][value="verifier"]').setValue()
    expect(bouton(w, 'Valider mes choix').attributes('disabled')).toBeDefined()
    await w.find('input[name="notif-n3"][value="ouvrir"]').setValue()
    await w.find('form').trigger('submit')
    expect(w.emitted('evenement')).toEqual([
      [{ type: 'fil-termine', actions: { n1: 'ignorer', n2: 'verifier', n3: 'ouvrir' } }],
    ])
  })
})
```

- [ ] **Step 2 : lancer le test pour vérifier qu'il échoue**

Run : `npx vitest run tests/unit/fil-step.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : implémenter**

`src/mission/FilStep.vue` :
```vue
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { FIL_ACTIONS, type Fil, type FilAction } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'

const props = defineProps<{ fil: Fil }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()

const LIBELLES: Record<FilAction, string> = {
  ouvrir: 'J’ouvre / je clique',
  verifier: 'Je vérifie autrement',
  signaler: 'Je signale',
  ignorer: 'J’ignore',
}
const actions = reactive<Record<string, FilAction>>({})
const complet = computed(() => props.fil.notifications.every((n) => actions[n.id]))

function valider() {
  if (complet.value) emit('evenement', { type: 'fil-termine', actions: { ...actions } })
}
</script>

<template>
  <section class="fil">
    <h2>{{ fil.consigne }}</h2>
    <form @submit.prevent="valider">
      <fieldset v-for="n in fil.notifications" :key="n.id" class="carte notification">
        <legend><span class="app">{{ n.appNom }}</span> · <strong>{{ n.de }}</strong></legend>
        <p>{{ n.texte }}</p>
        <div class="actions-notif">
          <label v-for="a in FIL_ACTIONS" :key="a" class="option">
            <input v-model="actions[n.id]" type="radio" :name="`notif-${n.id}`" :value="a" /> {{ LIBELLES[a] }}
          </label>
        </div>
      </fieldset>
      <button type="submit" class="btn btn-primaire" :disabled="!complet">Valider mes choix</button>
    </form>
  </section>
</template>

<style scoped>
.notification { margin-bottom: 1rem; }
.app { color: var(--texte-doux); }
.actions-notif { display: flex; flex-wrap: wrap; gap: 0 1.25rem; }
</style>
```

- [ ] **Step 4 : lancer le test pour vérifier qu'il passe**

Run : `npx vitest run tests/unit/fil-step.test.ts && npm run typecheck`
Expected : PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(mission): fil de notifications avec message piège non annoncé

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14 : page de mission, avertissement sensible et fin de mission

**Files :**
- Create : `src/mission/SensibleAvertissement.vue`, `src/mission/FinMission.vue`, `src/pages/MissionPage.vue`
- Modify : `src/router/index.ts` (route `mission`)
- Test : `tests/unit/mission-page.test.ts`

**Interfaces :**
- Consumes : `getMission`, `getTheme` (tâche 3) ; tout `mission-runner` (tâche 4) ; `calculerBadges`, `BADGES` (tâche 5) ; `useProgress` (tâche 6) ; `BandeauAide`, `useTexte` (tâche 7) ; `ScenarioStep` (tâche 11) ; `MinijeuStep` (tâche 12) ; `FilStep` (tâche 13).
- Produces : route `mission` (`/mission/:id`) ; `FinMission` (props `mission: Mission`, `etat: RunState` ; emit `rejouer`), qui affiche le titre « Mission terminée ! » ; `SensibleAvertissement` (emit `commencer`), qui affiche le bouton « Commencer ».

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/mission-page.test.ts` :
```ts
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MissionPage from '@/pages/MissionPage.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

let store: ProgressStore
let erreurs: unknown[]
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
  erreurs = []
})

async function monter(id: string) {
  const router = await routerTest(`/mission/${id}`)
  return mount(MissionPage, {
    global: { plugins: [router], config: { errorHandler: (e) => erreurs.push(e) } },
  })
}

async function finirTri(w: VueWrapper) {
  for (let i = 0; i < 4; i++) {
    await w.find('.tri-categories button').trigger('click')
    await cliquer(w, i === 3 ? 'Terminer le mini-jeu' : 'Suivant')
  }
}

describe('MissionPage', () => {
  it('se joue depuis un lien direct, sans niveau ni mode choisis, puis enregistre la mission', async () => {
    const w = await monter('m-test')
    expect(w.find('h1').text()).toBe('Mission test')
    expect(w.text()).toContain('Étape 1 sur 2')
    expect(w.text()).not.toContain('Valider le choix de la classe')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    await cliquer(w, 'Continuer')
    expect(w.text()).toContain('Étape 2 sur 2')
    await finirTri(w)
    expect(w.text()).toContain('Mission terminée !')
    expect(w.text()).toContain('Mission accomplie')
    expect(store.etat.missions['m-test']).toMatchObject({
      badges: ['mission-accomplie', 'reflexe-verif'],
      choix: { 'sc-1': 'aide' },
    })
  })

  it('ignore le double clic sur « Continuer »', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    const continuer = w.findAll('button').find((b) => b.text() === 'Continuer')!
    void continuer.trigger('click')
    await continuer.trigger('click')
    expect(erreurs).toEqual([])
    expect(w.text()).toContain('Carte 1 sur 4')
  })

  it('recommence à l’étape 1 après un rechargement en pleine mission', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    w.unmount()
    const w2 = await monter('m-test')
    expect(w2.text()).toContain('Étape 1 sur 2')
    expect(w2.find('[data-choix="aide"]').exists()).toBe(true)
  })

  it('permet de rejouer la mission depuis la fin', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    await cliquer(w, 'Rejouer la mission')
    expect(w.text()).toContain('Étape 1 sur 2')
  })

  it('affiche un message clair pour une mission inconnue', async () => {
    const w = await monter('mission-disparue')
    expect(w.find('h1').text()).toBe('Cette mission n’existe plus')
  })

  it('thème sensible : avertissement, bandeau d’aide et bouton passer', async () => {
    const w = await monter('m-sensible')
    expect(w.text()).toContain('Ce sujet peut être difficile')
    expect(w.find('[data-choix="aide"]').exists()).toBe(false)
    expect(w.find('aside').text()).toContain('3018')
    await cliquer(w, 'Commencer')
    await cliquer(w, 'Passer ce scénario')
    expect(w.text()).toContain('Étape 2 sur 2')
    expect(w.find('aside').text()).toContain('3018')
  })

  it('mission rappel : révèle le piège et enregistre le résultat', async () => {
    const w = await monter('r-test')
    for (const n of ['n1', 'n2', 'n3']) await w.find(`input[name="notif-${n}"][value="ouvrir"]`).setValue()
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('Le message piège était')
    expect(w.text()).toContain('Frais de douane : payez 2,99 € ici')
    expect(w.text()).toContain('Tu as ouvert ce message piège')
    expect(store.etat.rappels['r-test']).toMatchObject({ fois: 1, resultatSurprise: 'piege' })
    expect(store.etat.missions['r-test']).toBeUndefined()
  })

  it('ouvre les questions de débrief en grand', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    await cliquer(w, 'Afficher les questions en grand')
    expect(w.find('[role="dialog"]').text()).toContain('Q1 ?')
    await cliquer(w.find('[role="dialog"]'), 'Fermer')
    expect(w.find('[role="dialog"]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/mission-page.test.ts`
Expected : FAIL, `@/pages/MissionPage.vue` introuvable.

- [ ] **Step 3 : implémenter**

`src/mission/SensibleAvertissement.vue` :
```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'

const emit = defineEmits<{ commencer: [] }>()
</script>

<template>
  <section class="carte avertissement-sensible">
    <h2>Avant de commencer</h2>
    <p>Ce sujet peut être difficile. Tu peux passer un scénario à tout moment, sans aucune pénalité.</p>
    <p>
      Si quelque chose te rappelle une situation que tu vis, tu n’as pas à en parler devant les autres. Tu peux en
      parler plus tard à un adulte de confiance, ou appeler le 3018.
    </p>
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="emit('commencer')">Commencer</button>
      <RouterLink class="btn" to="/carte">Revenir à la carte</RouterLink>
    </div>
  </section>
</template>
```

`src/mission/FinMission.vue` :
```vue
<script setup lang="ts">
import { Award } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Mission, Scenario } from '@/content/schema'
import { BADGES, calculerBadges } from '@/engine/badges'
import type { RunState, SurpriseResultat } from '@/engine/mission-runner'
import { useTexte } from '@/ui/useTexte'

const props = defineProps<{ mission: Mission; etat: RunState }>()
const emit = defineEmits<{ rejouer: [] }>()
const t = useTexte()

const badges = computed(() => calculerBadges(props.etat))
const aRetenir = computed(() =>
  props.mission.etapes
    .filter((e): e is Scenario => e.type === 'scenario')
    .filter((s) => {
      const r = props.etat.resultats[s.id]
      return r?.type === 'scenario' && !r.passe
    }),
)

const MESSAGES_SURPRISE: Record<SurpriseResultat, string> = {
  piege: 'Tu as ouvert ce message piège. Pas de panique : l’important, c’est de reconnaître les signaux la prochaine fois.',
  verifie: 'Tu as vérifié autrement : c’est le meilleur réflexe !',
  signale: 'Tu l’as signalé : bravo, tu protèges aussi les autres.',
  ignore: 'Tu l’as ignoré : tu ne t’es pas fait piéger. Le signaler aide aussi les autres.',
}
const surprise = computed(() => {
  for (const e of props.mission.etapes) {
    if (e.type !== 'fil') continue
    const notification = e.notifications.find((n) => n.surprise)
    const r = props.etat.resultats[e.id]
    if (notification && r?.type === 'fil' && r.surprise) return { notification, resultat: r.surprise }
  }
  return null
})

const pleinEcran = ref(false)
const boutonFermer = ref<HTMLButtonElement | null>(null)
async function ouvrirPleinEcran() {
  pleinEcran.value = true
  await nextTick()
  boutonFermer.value?.focus()
}
</script>

<template>
  <section class="fin-mission">
    <h2>Mission terminée !</h2>

    <h3>Tes badges</h3>
    <ul class="badges">
      <li v-for="b in badges" :key="b" class="carte badge">
        <Award aria-hidden="true" /> <strong>{{ BADGES[b].titre }}</strong> : {{ BADGES[b].description }}
      </li>
    </ul>

    <section v-if="surprise" class="carte surprise">
      <h3>Le message piège était…</h3>
      <p><strong>{{ surprise.notification.de }}</strong> : « {{ surprise.notification.texte }} »</p>
      <p>{{ surprise.notification.explication }}</p>
      <p>{{ MESSAGES_SURPRISE[surprise.resultat] }}</p>
    </section>

    <section v-if="aRetenir.length">
      <h3>Ce que tu retiens</h3>
      <ul>
        <li v-for="s in aRetenir" :key="s.id">{{ t(s.aRetenir, s.aRetenirSimple) }}</li>
      </ul>
    </section>

    <section class="debrief">
      <h3>On en parle ?</h3>
      <ol>
        <li v-for="q in mission.debrief.questions" :key="q">{{ q }}</li>
      </ol>
      <button type="button" class="btn" @click="ouvrirPleinEcran">Afficher les questions en grand</button>
    </section>

    <div class="actions">
      <button type="button" class="btn" @click="emit('rejouer')">Rejouer la mission</button>
      <RouterLink class="btn btn-primaire" to="/carte">Retour à la carte</RouterLink>
    </div>

    <div
      v-if="pleinEcran"
      class="plein-ecran"
      role="dialog"
      aria-modal="true"
      aria-label="Questions de débrief"
      @keydown.esc="pleinEcran = false"
    >
      <ol>
        <li v-for="q in mission.debrief.questions" :key="q">{{ q }}</li>
      </ol>
      <button ref="boutonFermer" type="button" class="btn btn-primaire" @click="pleinEcran = false">Fermer</button>
    </div>
  </section>
</template>

<style scoped>
.badges { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.badge { display: flex; align-items: center; gap: 0.5rem; }
.surprise { margin: 1rem 0; border-left: 6px solid var(--aide); }
.plein-ecran {
  position: fixed; inset: 0; z-index: 20; background: var(--surface);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 2rem; font-size: 2rem; gap: 2rem;
}
</style>
```

`src/pages/MissionPage.vue` :
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getMission, getTheme } from '@/content'
import { calculerBadges } from '@/engine/badges'
import {
  choixDuRun,
  demarrer,
  etapeCourante,
  reduire,
  resultatSurprise,
  RunError,
  type RunEvent,
  type RunState,
} from '@/engine/mission-runner'
import FilStep from '@/mission/FilStep.vue'
import FinMission from '@/mission/FinMission.vue'
import MinijeuStep from '@/mission/MinijeuStep.vue'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import SensibleAvertissement from '@/mission/SensibleAvertissement.vue'
import { useProgress } from '@/store/useProgress'
import BandeauAide from '@/ui/BandeauAide.vue'

const route = useRoute()
const store = useProgress()

// La page est recréée à chaque changement d'URL (RouterView :key) : pas besoin de réagir à l'id.
const mission = getMission(String(route.params.id))
const theme = mission?.theme ? getTheme(mission.theme) : undefined
const sensible = theme?.sensible ?? false

const mode = computed(() => store.etat.mode ?? 'solo')
const avertissementLu = ref(false)
const etat = ref<RunState | null>(mission ? demarrer(mission) : null)

const etape = computed(() => (mission && etat.value ? etapeCourante(mission, etat.value) : null))
const resultatCourant = computed(() => {
  const r = etape.value && etat.value ? etat.value.resultats[etape.value.id] : undefined
  return r?.type === 'scenario' ? r : undefined
})

function envoyer(evenement: RunEvent) {
  if (!mission || !etat.value) return
  try {
    etat.value = reduire(mission, etat.value, evenement)
  } catch (e) {
    if (e instanceof RunError) return // événement périmé (double clic…) : ignoré
    throw e
  }
  if (etat.value.termine) enregistrer(etat.value)
}

function enregistrer(fin: RunState) {
  if (!mission) return
  if (mission.type === 'rappel') store.enregistrerRappel(mission.id, resultatSurprise(fin))
  else store.enregistrerMission(mission.id, calculerBadges(fin), choixDuRun(fin))
}

function recommencer() {
  if (mission) etat.value = demarrer(mission)
}
</script>

<template>
  <main class="conteneur mission">
    <template v-if="!mission || !etat">
      <h1>Cette mission n’existe plus</h1>
      <p>Elle a peut-être été renommée ou retirée.</p>
      <RouterLink class="btn" to="/carte">Retour à la carte</RouterLink>
    </template>
    <template v-else>
      <header class="mission-entete">
        <h1>{{ mission.titre }}</h1>
        <p v-if="!etat.termine" class="progression">
          <label for="progression-mission">Étape {{ etat.index + 1 }} sur {{ mission.etapes.length }}</label>
          <progress id="progression-mission" :value="etat.index" :max="mission.etapes.length" />
        </p>
      </header>

      <SensibleAvertissement v-if="sensible && !avertissementLu" @commencer="avertissementLu = true" />
      <FinMission v-else-if="etat.termine" :mission="mission" :etat="etat" @rejouer="recommencer" />
      <template v-else-if="etape">
        <ScenarioStep
          v-if="etape.type === 'scenario'"
          :key="etape.id"
          :scenario="etape"
          :phase="etat.phase ?? 'situation'"
          :resultat="resultatCourant"
          :mode="mode"
          :sensible="sensible"
          @evenement="envoyer"
        />
        <MinijeuStep
          v-else-if="etape.type === 'minijeu'"
          :key="etape.id"
          :etape="etape"
          :chrono="store.etat.reglages.chrono"
          @evenement="envoyer"
        />
        <FilStep v-else :key="etape.id" :fil="etape" @evenement="envoyer" />
      </template>

      <BandeauAide v-if="sensible && theme" :aides="theme.aides" />
    </template>
  </main>
</template>

<style scoped>
.progression { display: flex; align-items: center; gap: 0.75rem; }
progress { flex: 1; max-width: 20rem; height: 0.8rem; }
</style>
```

Dans `src/router/index.ts`, ajouter :
```ts
import MissionPage from '@/pages/MissionPage.vue'
// …
  { path: '/mission/:id', name: 'mission', component: MissionPage },
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run && npm run typecheck && npm run lint`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(mission): page de mission, avertissement sensible, fin et débrief

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15 : espace enseignant, version papier, confidentialité, test technique

**Files :**
- Create : `src/styles/print.css`, `src/pages/testTechnique.ts`, `src/pages/EnseignantsPage.vue`, `src/pages/FicheMissionPage.vue`, `src/pages/PlanBPage.vue`, `src/pages/ConfidentialitePage.vue`, `src/pages/TestTechniquePage.vue`
- Modify : `src/main.ts` (import de `print.css`), `src/router/index.ts` (5 routes)
- Test : `tests/unit/enseignants.test.ts`

**Interfaces :**
- Consumes : `contenu`, `getMission`, `getTheme`, `getThemes`, `toutesLesMissions` (tâche 3) ; `TRANCHES`, `TRANCHE_LIBELLES` (tâche 2) ; `stockageSur` (tâche 6) ; `BandeauAide`, `EffacerProgression` (tâche 7).
- Produces : routes `enseignants` (`/enseignants`), `fiche` (`/enseignants/:id`), `plan-b` (`/enseignants/:id/plan-b`), `confidentialite`, `test-technique` (`/test`) ; `verifierPoste(env: EnvPoste): { verifs: VerifPoste[]; pret: boolean }`. Classe CSS `.no-print` (masquée à l'impression) et `.saut-page`.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/enseignants.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConfidentialitePage from '@/pages/ConfidentialitePage.vue'
import EnseignantsPage from '@/pages/EnseignantsPage.vue'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import TestTechniquePage from '@/pages/TestTechniquePage.vue'
import { verifierPoste, type EnvPoste } from '@/pages/testTechnique'
import { creerStore, definirStore } from '@/store/useProgress'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

const monter = async (composant: Parameters<typeof mount>[0], chemin: string) =>
  mount(composant, { global: { plugins: [await routerTest(chemin)] } })

describe('verifierPoste', () => {
  const ok: EnvPoste = { stockage: true, serviceWorker: true, horsLigneActif: true, largeur: 1024, nbMissions: 9 }

  it('déclare le poste prêt quand tout va bien', () => {
    expect(verifierPoste(ok).pret).toBe(true)
  })
  it('reste prêt sans stockage ni hors ligne (non bloquants)', () => {
    const r = verifierPoste({ ...ok, stockage: false, serviceWorker: false, horsLigneActif: false })
    expect(r.pret).toBe(true)
    expect(r.verifs.find((v) => v.id === 'hors-ligne')?.conseil).toContain('il faudra rester connecté')
  })
  it('n’est pas prêt si l’écran est trop étroit ou le contenu absent', () => {
    expect(verifierPoste({ ...ok, largeur: 300 }).pret).toBe(false)
    expect(verifierPoste({ ...ok, nbMissions: 0 }).pret).toBe(false)
  })
})

describe('EnseignantsPage', () => {
  it('liste et filtre les missions, affiche la date de mise à jour', async () => {
    const w = await monter(EnseignantsPage, '/enseignants')
    expect(w.findAll('tbody tr')).toHaveLength(3)
    expect(w.text()).toContain('1 septembre 2026')
    await w.find('select#filtre-theme').setValue('harcelement')
    expect(w.findAll('tbody tr')).toHaveLength(1)
    expect(w.find('tbody').text()).toContain('Mission sensible')
    await w.find('select#filtre-theme').setValue('')
    await w.find('select#filtre-tranche').setValue('lycee')
    expect(w.text()).toContain('Aucune mission ne correspond à ces filtres.')
  })
})

describe('FicheMissionPage', () => {
  it('affiche la conduite à tenir et les aides d’un thème sensible, et imprime', async () => {
    const imprimer = vi.spyOn(window, 'print').mockImplementation(() => {})
    const w = await monter(FicheMissionPage, '/enseignants/m-sensible')
    expect(w.find('h1').text()).toBe('Mission sensible')
    expect(w.text()).toContain('Prévenir le ou la CPE')
    expect(w.text()).toContain('3018')
    expect(w.text()).toContain('4.1')
    await cliquer(w, 'Imprimer la fiche')
    expect(imprimer).toHaveBeenCalled()
  })
})

describe('PlanBPage', () => {
  it('produit une version papier avec corrigé', async () => {
    const w = await monter(PlanBPage, '/enseignants/m-test/plan-b')
    expect(w.text()).toContain('☐ Je clique et je paie')
    expect(w.text()).toContain('Corrigé (pour l’adulte)')
    expect(w.text()).toContain('Vrais indices : L’adresse est bizarre / On me presse')
    expect(w.findAll('table tbody tr')).toHaveLength(4)
  })
})

describe('ConfidentialitePage et TestTechniquePage', () => {
  it('explique les données et permet d’effacer', async () => {
    const w = await monter(ConfidentialitePage, '/confidentialite')
    expect(w.text()).toContain('Rien n’est envoyé sur Internet')
    expect(w.text()).toContain('Effacer ma progression')
  })
  it('affiche les 4 vérifications', async () => {
    const w = await monter(TestTechniquePage, '/test')
    expect(w.findAll('li.verif')).toHaveLength(4)
  })
})
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/enseignants.test.ts`
Expected : FAIL, modules introuvables.

- [ ] **Step 3 : implémenter**

`src/styles/print.css` :
```css
@page { margin: 1.5cm; }
@media print {
  .app-header, .lien-evitement, .alerte-stockage, .no-print, .bandeau-aide, .maj { display: none !important; }
  body { background: #fff; font-size: 12pt; }
  .conteneur { max-width: none; padding: 0; }
  .saut-page { break-before: page; }
  section, table, .etape-papier { break-inside: avoid; }
  a { color: inherit; text-decoration: none; }
}
```
Dans `src/main.ts`, ajouter `import './styles/print.css'` après `base.css`.

`src/pages/testTechnique.ts` :
```ts
export interface EnvPoste {
  stockage: boolean
  serviceWorker: boolean
  horsLigneActif: boolean
  largeur: number
  nbMissions: number
}

export interface VerifPoste {
  id: 'contenu' | 'ecran' | 'stockage' | 'hors-ligne'
  libelle: string
  ok: boolean
  bloquant: boolean
  conseil: string
}

export function verifierPoste(env: EnvPoste): { verifs: VerifPoste[]; pret: boolean } {
  const verifs: VerifPoste[] = [
    { id: 'contenu', libelle: 'Missions chargées', ok: env.nbMissions > 0, bloquant: true, conseil: 'Aucune mission n’a pu être chargée : recharge la page.' },
    { id: 'ecran', libelle: 'Taille d’écran suffisante', ok: env.largeur >= 320, bloquant: true, conseil: 'Écran très étroit : préfère une tablette ou un ordinateur.' },
    {
      id: 'stockage',
      libelle: 'Enregistrement de la progression',
      ok: env.stockage,
      bloquant: false,
      conseil: 'Le navigateur bloque l’enregistrement (navigation privée ?). Le jeu fonctionne, mais sans sauvegarde.',
    },
    {
      id: 'hors-ligne',
      libelle: 'Mode hors ligne',
      ok: env.serviceWorker && env.horsLigneActif,
      bloquant: false,
      conseil: env.serviceWorker
        ? 'Recharge la page une fois : le jeu sera ensuite disponible même sans réseau.'
        : 'Ce navigateur ne permet pas le mode hors ligne : il faudra rester connecté.',
    },
  ]
  return { verifs, pret: verifs.every((v) => v.ok || !v.bloquant) }
}
```

`src/pages/TestTechniquePage.vue` :
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toutesLesMissions } from '@/content'
import { stockageSur } from '@/store/progress'
import { verifierPoste } from './testTechnique'

const lancer = () =>
  verifierPoste({
    stockage: stockageSur() !== null,
    serviceWorker: 'serviceWorker' in navigator,
    horsLigneActif: Boolean(navigator.serviceWorker?.controller),
    largeur: window.innerWidth,
    nbMissions: toutesLesMissions().length,
  })
const resultat = ref(lancer())
</script>

<template>
  <main class="conteneur">
    <h1>Test technique du poste</h1>
    <p role="status" class="verdict">
      <strong v-if="resultat.pret"><span aria-hidden="true">✅</span> Ce poste est prêt pour jouer.</strong>
      <strong v-else><span aria-hidden="true">❌</span> Ce poste n’est pas prêt : voir ci-dessous.</strong>
    </p>
    <ul class="verifs">
      <li v-for="v in resultat.verifs" :key="v.id" class="verif">
        <span aria-hidden="true">{{ v.ok ? '✅' : v.bloquant ? '❌' : '⚠️' }}</span>
        <strong>{{ v.libelle }}</strong> : {{ v.ok ? 'OK' : v.conseil }}
      </li>
    </ul>
    <div class="actions">
      <button type="button" class="btn" @click="resultat = lancer()">Relancer le test</button>
      <RouterLink class="btn" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </div>
  </main>
</template>
```

`src/pages/EnseignantsPage.vue` :
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { contenu, getTheme, getThemes, toutesLesMissions } from '@/content'
import { TRANCHES, TRANCHE_LIBELLES, type Mission, type Tranche } from '@/content/schema'

const CONTACT_URL = import.meta.env.VITE_CONTACT_URL
const tranche = ref<Tranche | ''>('')
const themeId = ref('')

const missions = computed(() =>
  toutesLesMissions().filter(
    (m) =>
      (!tranche.value || m.tranches.includes(tranche.value)) &&
      (!themeId.value || m.theme === themeId.value || m.themesCouverts?.includes(themeId.value)),
  ),
)
const nomTheme = (m: Mission) =>
  m.type === 'rappel' ? 'Rappel (plusieurs thèmes)' : (getTheme(m.theme ?? '')?.titre ?? m.theme)
const miseAJour = new Date(contenu.generatedAt).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
</script>

<template>
  <main class="conteneur">
    <h1>Espace enseignants</h1>
    <p>
      Cyber Réflexes est gratuit, sans compte ni installation. Chaque mission dure 15 à 20 minutes et se termine par
      trois questions de débrief. Le jeu seul ne suffit pas : <strong>c’est le débrief qui ancre les réflexes</strong>,
      et les missions Rappel (J+7, J+30) les entretiennent.
    </p>

    <section class="carte">
      <h2>Une séance type (55 min)</h2>
      <ol>
        <li>5 min : cadre. Personne n’est obligé de raconter une expérience personnelle.</li>
        <li>15 à 20 min : jeu (solo, binôme ou classe entière vidéoprojetée).</li>
        <li>20 min : débrief à partir des trois questions de fin de mission.</li>
        <li>5 min : où trouver de l’aide (3018, adultes de l’établissement).</li>
        <li>5 min : un engagement concret (vérifier un réglage, parler à un adulte…).</li>
      </ol>
    </section>

    <h2>Missions disponibles</h2>
    <div class="filtres">
      <label for="filtre-tranche">Niveau</label>
      <select id="filtre-tranche" v-model="tranche">
        <option value="">Tous</option>
        <option v-for="t in TRANCHES" :key="t" :value="t">{{ TRANCHE_LIBELLES[t] }}</option>
      </select>
      <label for="filtre-theme">Thème</label>
      <select id="filtre-theme" v-model="themeId">
        <option value="">Tous</option>
        <option v-for="t in getThemes()" :key="t.id" :value="t.id">{{ t.titre }}</option>
      </select>
    </div>
    <table v-if="missions.length" class="table-missions">
      <thead>
        <tr><th scope="col">Mission</th><th scope="col">Thème</th><th scope="col">Niveaux</th><th scope="col">Durée</th><th scope="col">Objectifs</th></tr>
      </thead>
      <tbody>
        <tr v-for="m in missions" :key="m.id">
          <td><RouterLink :to="`/enseignants/${m.id}`">{{ m.titre }}</RouterLink></td>
          <td>{{ nomTheme(m) }}</td>
          <td>{{ m.tranches.map((t) => TRANCHE_LIBELLES[t]).join(', ') }}</td>
          <td>{{ m.duree }} min</td>
          <td><ul><li v-for="o in m.objectifs" :key="o">{{ o }}</li></ul></td>
        </tr>
      </tbody>
    </table>
    <p v-else>Aucune mission ne correspond à ces filtres.</p>

    <section>
      <h2>Outils</h2>
      <ul>
        <li><RouterLink to="/test">Test technique du poste (30 secondes)</RouterLink></li>
        <li><RouterLink to="/confidentialite">Confidentialité : aucune donnée ne quitte l’appareil</RouterLink></li>
        <li v-if="CONTACT_URL"><a :href="CONTACT_URL" rel="noopener">Signaler une erreur ou proposer une amélioration</a></li>
      </ul>
      <p>Dernière mise à jour du contenu : {{ miseAJour }}.</p>
    </section>
  </main>
</template>

<style scoped>
.filtres { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; margin-bottom: 1rem; }
select { font: inherit; min-height: 44px; }
.table-missions { width: 100%; border-collapse: collapse; }
.table-missions th, .table-missions td { border-bottom: 1px solid var(--bord); padding: 0.5rem; text-align: left; vertical-align: top; }
</style>
```

`src/pages/FicheMissionPage.vue` :
```vue
<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { getMission, getTheme } from '@/content'
import { TRANCHE_LIBELLES } from '@/content/schema'
import BandeauAide from '@/ui/BandeauAide.vue'

const route = useRoute()
const mission = getMission(String(route.params.id))
const theme = mission?.theme ? getTheme(mission.theme) : undefined
const imprimer = () => window.print()
</script>

<template>
  <main class="conteneur fiche">
    <template v-if="!mission">
      <h1>Cette mission n’existe plus</h1>
      <RouterLink class="btn" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </template>
    <template v-else>
      <div class="actions no-print">
        <button type="button" class="btn btn-primaire" @click="imprimer">Imprimer la fiche</button>
        <RouterLink class="btn" :to="`/enseignants/${mission.id}/plan-b`">Version papier (plan B)</RouterLink>
        <RouterLink class="btn" :to="`/mission/${mission.id}`">Lancer la mission</RouterLink>
      </div>
      <h1>{{ mission.titre }}</h1>
      <p>{{ mission.resume }}</p>
      <dl class="meta">
        <dt>Niveaux</dt><dd>{{ mission.tranches.map((t) => TRANCHE_LIBELLES[t]).join(', ') }}</dd>
        <dt>Durée de jeu</dt><dd>{{ mission.duree }} min</dd>
        <dt>Thème</dt><dd>{{ theme?.titre ?? 'Rappel (plusieurs thèmes)' }}</dd>
        <dt>Compétences CRCN</dt><dd>{{ mission.competences.crcn.join(', ') }}</dd>
        <dt v-if="mission.competences.programmes.length">Programmes</dt>
        <dd v-if="mission.competences.programmes.length">{{ mission.competences.programmes.join(' ; ') }}</dd>
        <dt>Programme pHARe</dt><dd>{{ mission.competences.phare ? 'Oui, utilisable comme séance pHARe' : 'Non' }}</dd>
      </dl>
      <h2>Objectifs</h2>
      <ol><li v-for="o in mission.objectifs" :key="o">{{ o }}</li></ol>
      <h2>Déroulé suggéré</h2>
      <p class="pre">{{ mission.fiche.deroulement }}</p>
      <h2>Débrief</h2>
      <ol><li v-for="q in mission.debrief.questions" :key="q">{{ q }}</li></ol>
      <h3>Éléments de réponse</h3>
      <p class="pre">{{ mission.debrief.reponses }}</p>
      <h3>Erreurs fréquentes</h3>
      <ul><li v-for="e in mission.debrief.erreursFrequentes" :key="e">{{ e }}</li></ul>
      <template v-if="mission.fiche.siRevelation">
        <h2>Si un élève révèle une situation réelle</h2>
        <p class="pre">{{ mission.fiche.siRevelation }}</p>
        <BandeauAide v-if="theme" :aides="theme.aides" class="bandeau-imprimable" />
      </template>
    </template>
  </main>
</template>

<style scoped>
.meta { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; }
.meta dt { font-weight: 700; }
.pre { white-space: pre-line; }
@media print { .bandeau-imprimable { display: block !important; position: static; } }
</style>
```

`src/pages/PlanBPage.vue` :
```vue
<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { getMission } from '@/content'
import { FIL_ACTIONS } from '@/content/schema'

const route = useRoute()
const mission = getMission(String(route.params.id))
const imprimer = () => window.print()
const ACTIONS_PAPIER: Record<(typeof FIL_ACTIONS)[number], string> = {
  ouvrir: 'J’ouvre',
  verifier: 'Je vérifie',
  signaler: 'Je signale',
  ignorer: 'J’ignore',
}
</script>

<template>
  <main class="conteneur plan-b">
    <template v-if="!mission">
      <h1>Cette mission n’existe plus</h1>
      <RouterLink class="btn" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </template>
    <template v-else>
      <div class="actions no-print">
        <button type="button" class="btn btn-primaire" @click="imprimer">Imprimer</button>
        <RouterLink class="btn" :to="`/enseignants/${mission.id}`">Retour à la fiche</RouterLink>
      </div>
      <h1>{{ mission.titre }} : version papier</h1>
      <p>Nom : ______________________ Classe : ________</p>

      <section v-for="(e, i) in mission.etapes" :key="e.id" class="etape-papier">
        <template v-if="e.type === 'scenario'">
          <h2>Situation {{ i + 1 }}</h2>
          <div class="carte">
            <p><strong>{{ e.ecran.appNom }} · {{ e.ecran.contact }}</strong></p>
            <p v-if="e.ecran.sujet">Objet : {{ e.ecran.sujet }}</p>
            <p v-if="e.ecran.url">Adresse : {{ e.ecran.url }}</p>
            <p v-for="(m, j) in e.ecran.messages" :key="j">{{ m.de === 'moi' ? 'Moi' : e.ecran.contact }} : {{ m.texte }}</p>
          </div>
          <p><strong>{{ e.question }}</strong></p>
          <ul class="cases"><li v-for="c in e.choix" :key="c.id">☐ {{ c.texte }}</li></ul>
          <p>Quel indice t’a décidé ?</p>
          <ul class="cases"><li v-for="ind in e.indices" :key="ind.id">☐ {{ ind.libelle }}</li></ul>
        </template>
        <template v-else-if="e.type === 'minijeu' && e.jeu === 'tri'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <table>
            <thead><tr><th scope="col">Message</th><th v-for="c in e.config.categories" :key="c.id" scope="col">{{ c.libelle }}</th></tr></thead>
            <tbody>
              <tr v-for="carte in e.config.cartes" :key="carte.id">
                <td>{{ carte.texte }}</td>
                <td v-for="c in e.config.categories" :key="c.id">☐</td>
              </tr>
            </tbody>
          </table>
        </template>
        <template v-else-if="e.type === 'minijeu'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <p>Entoure les lignes suspectes.</p>
          <div class="carte">
            <p><strong>{{ e.config.titre }}</strong></p>
            <p v-for="l in e.config.lignes" :key="l.id">{{ l.texte }}</p>
          </div>
        </template>
        <template v-else>
          <h2>Notifications {{ i + 1 }} : {{ e.consigne }}</h2>
          <table>
            <thead><tr><th scope="col">Notification</th><th v-for="a in FIL_ACTIONS" :key="a" scope="col">{{ ACTIONS_PAPIER[a] }}</th></tr></thead>
            <tbody>
              <tr v-for="n in e.notifications" :key="n.id">
                <td>{{ n.appNom }} · {{ n.de }} : {{ n.texte }}</td>
                <td v-for="a in FIL_ACTIONS" :key="a">☐</td>
              </tr>
            </tbody>
          </table>
        </template>
      </section>

      <section class="corrige saut-page">
        <h2>Corrigé (pour l’adulte)</h2>
        <div v-for="(e, i) in mission.etapes" :key="e.id">
          <template v-if="e.type === 'scenario'">
            <h3>Situation {{ i + 1 }}</h3>
            <p>Bons choix : {{ e.choix.filter((c) => c.qualite !== 'risque').map((c) => c.texte).join(' / ') }}</p>
            <p>Vrais indices : {{ e.indices.filter((x) => x.pertinent).map((x) => x.libelle).join(' / ') }}</p>
            <p>À retenir : {{ e.aRetenir }}</p>
          </template>
          <template v-else-if="e.type === 'minijeu' && e.jeu === 'tri'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <ul>
              <li v-for="carte in e.config.cartes" :key="carte.id">
                {{ carte.texte }} → {{ e.config.categories.find((c) => c.id === carte.categorie)?.libelle }} ({{ carte.explication }})
              </li>
            </ul>
          </template>
          <template v-else-if="e.type === 'minijeu'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <ul><li v-for="l in e.config.lignes.filter((x) => x.indice)" :key="l.id">{{ l.texte }} : {{ l.explication }}</li></ul>
          </template>
          <template v-else>
            <h3>Notifications {{ i + 1 }}</h3>
            <ul>
              <li v-for="n in e.notifications" :key="n.id">
                {{ n.de }} : {{ n.explication }}<strong v-if="n.surprise"> (message piège)</strong>
              </li>
            </ul>
          </template>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; }
th, td { border: 1px solid var(--bord); padding: 0.4rem; text-align: left; }
.cases { list-style: none; padding-left: 0.5rem; }
</style>
```

`src/pages/ConfidentialitePage.vue` :
```vue
<script setup lang="ts">
import EffacerProgression from '@/ui/EffacerProgression.vue'
</script>

<template>
  <main class="conteneur">
    <h1>Confidentialité</h1>
    <h2>Ce que le jeu enregistre</h2>
    <p>Ton niveau, ta façon de jouer (solo, binôme, classe), tes réglages, les missions terminées et tes badges. C’est tout.</p>
    <h2>Où ?</h2>
    <p>Uniquement dans ce navigateur, sur cet appareil. Rien n’est envoyé sur Internet.</p>
    <h2>Ce que le jeu ne fait pas</h2>
    <p>Pas de compte, pas de nom, pas d’adresse mail, pas de publicité, pas de cookie de suivi, pas de statistiques.</p>
    <h2>Sur un ordinateur partagé ?</h2>
    <p>Efface ta progression avant de partir :</p>
    <EffacerProgression />
    <h2>Hébergement</h2>
    <p>
      Le site est hébergé par GitHub Pages (GitHub, Inc.). Comme tout hébergeur, GitHub peut enregistrer des informations
      techniques, comme l’adresse IP, pour assurer la sécurité du service.
    </p>
  </main>
</template>
```

Dans `src/router/index.ts`, ajouter :
```ts
import ConfidentialitePage from '@/pages/ConfidentialitePage.vue'
import EnseignantsPage from '@/pages/EnseignantsPage.vue'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import TestTechniquePage from '@/pages/TestTechniquePage.vue'
// … avant la route « introuvable » :
  { path: '/enseignants', name: 'enseignants', component: EnseignantsPage },
  { path: '/enseignants/:id', name: 'fiche', component: FicheMissionPage },
  { path: '/enseignants/:id/plan-b', name: 'plan-b', component: PlanBPage },
  { path: '/confidentialite', name: 'confidentialite', component: ConfidentialitePage },
  { path: '/test', name: 'test-technique', component: TestTechniquePage },
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `npx vitest run && npm run typecheck && npm run lint`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(enseignants): fiches, version papier imprimable, confidentialité et test technique

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16 : mode hors ligne (PWA) et proposition de mise à jour

**Files :**
- Create : `public/favicon.svg`, `public/icon.svg`, `src/ui/UpdatePrompt.vue`, `tests/unit/pwa-register-stub.ts`
- Modify : `vite.config.ts`, `src/env.d.ts`, `src/App.vue`
- Test : `tests/unit/update-prompt.test.ts`

**Interfaces :**
- Consumes : `useRegisterSW` de `virtual:pwa-register/vue` (vite-plugin-pwa).
- Produces : `UpdatePrompt`, un bandeau `.maj` qui propose « Recharger » ou « Plus tard » et ne recharge jamais de force. Un service worker (`sw.js`) et un `manifest.webmanifest` sont générés au build.

- [ ] **Step 1 : écrire le test (qui doit échouer)**

`tests/unit/pwa-register-stub.ts` :
```ts
import { ref } from 'vue'
import { vi } from 'vitest'

export const needRefresh = ref(false)
export const offlineReady = ref(false)
export const updateServiceWorker = vi.fn(async () => {})

export function useRegisterSW() {
  return { needRefresh, offlineReady, updateServiceWorker }
}
```

`tests/unit/update-prompt.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UpdatePrompt from '@/ui/UpdatePrompt.vue'
import { cliquer } from './helpers'
import { needRefresh, updateServiceWorker } from './pwa-register-stub'

describe('UpdatePrompt', () => {
  it('propose la mise à jour sans l’imposer', async () => {
    const w = mount(UpdatePrompt)
    expect(w.find('.maj').exists()).toBe(false)
    needRefresh.value = true
    await w.vm.$nextTick()
    expect(w.text()).toContain('Une nouvelle version du jeu est disponible.')
    await cliquer(w, 'Plus tard')
    expect(w.find('.maj').exists()).toBe(false)
    expect(updateServiceWorker).not.toHaveBeenCalled()
    needRefresh.value = true
    await w.vm.$nextTick()
    await cliquer(w, 'Recharger')
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2 : configurer Vitest pour remplacer le module virtuel, puis vérifier que le test échoue**

Dans `vite.config.ts`, compléter la section `test` :
```ts
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    alias: {
      'virtual:pwa-register/vue': fileURLToPath(new URL('./tests/unit/pwa-register-stub.ts', import.meta.url)),
    },
  },
```

Run : `npx vitest run tests/unit/update-prompt.test.ts`
Expected : FAIL, `@/ui/UpdatePrompt.vue` introuvable.

- [ ] **Step 3 : implémenter**

`public/favicon.svg` et `public/icon.svg` (même contenu) :
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#3b2fc9"/><path d="M32 10 50 17v14c0 11-7.6 19.6-18 23-10.4-3.4-18-12-18-23V17z" fill="#fff"/><path d="m24 32 6 6 11-12" fill="none" stroke="#3b2fc9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

`vite.config.ts` (version complète) :
```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { contentPlugin } from './scripts/vite-plugin-content'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    vue(),
    contentPlugin(),
    ...(process.env.VITEST
      ? []
      : [
          VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'Cyber Réflexes',
              short_name: 'Cyber Réflexes',
              description: 'Jeu gratuit de sensibilisation aux risques numériques, de la 6e à la Terminale.',
              lang: 'fr',
              theme_color: '#3b2fc9',
              background_color: '#f7f7fb',
              display: 'standalone',
              icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
            },
            workbox: { globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'] },
          }),
        ]),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    alias: {
      'virtual:pwa-register/vue': fileURLToPath(new URL('./tests/unit/pwa-register-stub.ts', import.meta.url)),
    },
  },
})
```

Dans `src/env.d.ts`, ajouter en tête :
```ts
/// <reference types="vite-plugin-pwa/vue" />
```

`src/ui/UpdatePrompt.vue` :
```vue
<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
const plusTard = () => {
  needRefresh.value = false
}
</script>

<template>
  <div v-if="needRefresh" class="maj carte conteneur" role="status">
    <p>Une nouvelle version du jeu est disponible.</p>
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="updateServiceWorker(true)">Recharger</button>
      <button type="button" class="btn" @click="plusTard">Plus tard</button>
    </div>
  </div>
</template>
```

Dans `src/App.vue`, importer `UpdatePrompt from '@/ui/UpdatePrompt.vue'` et l'insérer juste après `<AppHeader />` :
```vue
  <AppHeader />
  <UpdatePrompt />
```

- [ ] **Step 4 : vérifier le test et le build PWA**

Run : `npx vitest run && npm run typecheck && npm run build && ls dist/sw.js dist/manifest.webmanifest`
Expected : tests PASS ; build OK ; les deux fichiers existent.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(pwa): jeu disponible hors ligne et mise à jour proposée sans forcer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Règles d'écriture du contenu (tâches 17 à 19)

Ces règles s'appliquent à chaque fichier de mission. Les tests du contenu vérifient celles qui sont automatisables.

- **Tutoiement**, ton bienveillant, jamais culpabilisant. Un choix risqué mène à une conséquence **réaliste et réparable** (« tu peux encore agir »), jamais à une catastrophe.
- **6e** : phrases de 20 mots au plus. `texteSimple` pour chaque message du faux écran, `consequenceSimple` pour chaque choix `risque` et `aRetenirSimple` pour chaque scénario. **5e-3e et lycée** : ces champs sont facultatifs.
- Chaque scénario compte 3 choix : un `risque`, un `bon` et un `aide`. Le texte du choix `aide` commence par « Je demande de l’aide ». Il y a 3 ou 4 indices, dont **au moins un** non pertinent mais plausible (« le montant est petit », « il y a un emoji »…).
- `recuperation` est présente dans **au moins 2 scénarios sur 3**, toujours liée au choix `risque`.
- **Marques fictives uniquement** dans les faux écrans : Colis Express, GameBox (et ses « Coins »), StreamTube, SnapTalk, ChatCord, Vestiaire, NovaStation, BanqueNova, ENT « Mon Collège » / « Mon Lycée ». Adresses web en `.info`, `.shop`, `.xyz`, `.net`, `.com` à consonance crédible.
- `debrief.questions` : exactement ces 3 questions, adaptées au thème si besoin, dans cet ordre : « Quel était le piège ? », « Quel indice pourras-tu réutiliser la prochaine fois ? », « Que faire si ça t’est déjà arrivé ? ».
- `fiche.deroulement` : 5 lignes (cadre 5 min / jeu 15-20 min / débrief 20 min / aide 5 min / engagement 5 min), avec **un engagement concret propre à la mission**.
- `competences.crcn` : codes CRCN (`4.1`, `4.2`, `1.1`, `2.1`, `2.2`, `2.4`, `4.3`, `5.1`). `programmes` : « EMI cycle 3 », « EMI cycle 4 », « SNT 2de »…
- Mini-jeu `tri` : 6 cartes, catégories `arnaque` (« Arnaque »), `legitime` (« Légitime ») et `verifier` (« Je vérifie d’abord »). Mini-jeu `repere` : 6 à 8 lignes dont 3 ou 4 indices, chacun avec son explication.

---

### Task 17 : contenu « Phishing » (3 missions), tests du contenu et guide de rédaction

**Files :**
- Create : `content/missions/phishing/p-6e-colis.yaml`, `content/missions/phishing/p-college-ami-pirate.yaml`, `content/missions/phishing/p-lycee-offre-emploi.yaml`, `tests/unit/node/content-real.test.ts`, `README.md`
- Delete : `content/missions/.gitkeep`

**Interfaces :**
- Consumes : `buildContent` (tâche 3) ; `TRANCHES`, `Mission` (tâche 2).
- Produces : missions `p-6e-colis`, `p-college-ami-pirate` et `p-lycee-offre-emploi`. **Les tests E2E dépendent de `p-6e-colis`** : titre « Le colis mystère », 3 scénarios puis 1 mini-jeu (donc 4 étapes), 1er scénario avec le choix `clic` (`risque`) suivi de la récupération `demander-aide`, choix `aide` dont le texte commence par « Je demande de l’aide ».

- [ ] **Step 1 : écrire le test du contenu réel (qui doit échouer)**

`tests/unit/node/content-real.test.ts` :
```ts
// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContent } from '../../../scripts/build-content'
import { TRANCHES, type Mission } from '../../../src/content/schema'

const bundle = buildContent(join(process.cwd(), 'content'))
const missions = bundle.missions.filter((m) => m.type === 'mission')

const MARQUES_REELLES = [
  'snapchat', 'instagram', 'tiktok', 'roblox', 'robux', 'discord', 'fortnite', 'v-bucks', 'vinted', 'leboncoin',
  'la poste', 'colissimo', 'chronopost', 'amazon', 'whatsapp', 'facebook', 'youtube', 'paypal', 'iphone',
  'playstation', 'xbox', 'nintendo', 'telegram',
]

function textesDesFauxEcrans(m: Mission): string[] {
  return m.etapes.flatMap((e) => {
    if (e.type === 'scenario') {
      const { appNom, contact, sujet, url, messages } = e.ecran
      return [appNom, contact, sujet ?? '', url ?? '', ...messages.flatMap((x) => [x.texte, x.texteSimple ?? ''])]
    }
    if (e.type === 'fil') return e.notifications.flatMap((n) => [n.appNom, n.de, n.texte])
    if (e.jeu === 'tri') return e.config.cartes.map((c) => c.texte)
    return [e.config.titre, ...e.config.lignes.map((l) => l.texte)]
  })
}

const missionsDuTheme = (theme: string) => missions.filter((m) => m.theme === theme)

describe('contenu réel', () => {
  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les faux écrans', (_id, m) => {
    const texte = textesDesFauxEcrans(m).join(' ').toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(missions.map((m) => [m.id, m] as const))('%s : 3 ou 4 scénarios et 1 mini-jeu', (_id, m) => {
    const scenarios = m.etapes.filter((e) => e.type === 'scenario')
    expect(scenarios.length).toBeGreaterThanOrEqual(3)
    expect(scenarios.length).toBeLessThanOrEqual(4)
    expect(m.etapes.filter((e) => e.type === 'minijeu')).toHaveLength(1)
    expect(scenarios.filter((s) => s.type === 'scenario' && s.recuperation).length).toBeGreaterThanOrEqual(2)
  })

  it.each(missions.filter((m) => m.tranches.includes('6e')).map((m) => [m.id, m] as const))(
    '%s (6e) : textes simplifiés présents',
    (_id, m) => {
      for (const e of m.etapes) {
        if (e.type !== 'scenario') continue
        expect(e.aRetenirSimple, `${e.id}.aRetenirSimple`).toBeTruthy()
        e.ecran.messages.forEach((msg, i) => expect(msg.texteSimple, `${e.id}.messages.${i}`).toBeTruthy())
        e.choix
          .filter((c) => c.qualite === 'risque')
          .forEach((c) => expect(c.consequenceSimple, `${e.id}.${c.id}`).toBeTruthy())
      }
    },
  )

  it.each(TRANCHES)('phishing : au moins une mission pour la tranche %s', (t) => {
    expect(missionsDuTheme('phishing').some((m) => m.tranches.includes(t))).toBe(true)
  })
})
```

Run : `npx vitest run tests/unit/node/content-real.test.ts`
Expected : FAIL, aucune mission (les tests `it.each` sur les missions sont vides et « phishing : au moins une mission… » échoue pour les 3 tranches).

- [ ] **Step 2 : écrire la mission de référence `p-6e-colis`**

`content/missions/phishing/p-6e-colis.yaml` :
```yaml
id: p-6e-colis
theme: phishing
tranches: ['6e']
titre: Le colis mystère
resume: Un SMS, un message privé et un mail te promettent un cadeau ou te menacent. Arnaque ou pas ?
duree: 15
objectifs:
  - Reconnaître un message d’hameçonnage (faux colis, faux concours, fausse alerte)
  - Vérifier une information par un autre moyen avant d’agir
  - Savoir quoi faire après une erreur
competences:
  crcn: ['4.1', '1.1']
  programmes: ['EMI cycle 3', 'Référentiel données personnelles cycle 3']
etapes:
  - type: scenario
    id: sms-colis
    ecran:
      app: sms
      appNom: Messages
      contact: '+33 7 56 12 48 90'
      messages:
        - de: contact
          texte: 'Colis Express : votre colis n°FR4471 est bloqué. Réglez 1,99 € de frais sous 24 h : colis-expres-suivi.info'
          texteSimple: 'Colis Express : ton colis est bloqué. Paie 1,99 € tout de suite sur colis-expres-suivi.info'
    question: Tu n’attends pas de colis, mais tes parents peut-être… Que fais-tu ?
    choix:
      - id: clic
        texte: Je clique et je paie avec la carte de mes parents, ce n’est que 1,99 €.
        qualite: risque
        consequence: 'Le site ressemble à celui d’un transporteur. Tu tapes les numéros de la carte… Deux jours plus tard, la banque bloque la carte : quelqu’un a essayé de payer 450 € en ligne. Les 1,99 € servaient à voler les numéros. Bonne nouvelle : en prévenant vite, on peut limiter les dégâts.'
        consequenceSimple: 'Le faux site a volé les numéros de la carte. Quelqu’un essaie de payer 450 € avec. Il faut vite prévenir un adulte.'
      - id: verif
        texte: Je demande à mes parents s’ils attendent un colis, sans cliquer sur le lien.
        qualite: bon
        consequence: 'Ta mère n’attend rien. Elle vérifie dans l’appli officielle du transporteur : aucun colis bloqué. C’était une arnaque, et personne n’a cliqué.'
      - id: aide
        texte: Je demande de l’aide à quelqu’un avant de faire quoi que ce soit.
        qualite: aide
        consequence: 'Ton grand frère regarde le message : « C’est une arnaque, tout le monde la reçoit. » Vous supprimez le SMS et vous bloquez le numéro.'
    indices:
      - { id: url, libelle: 'L’adresse du site est bizarre (colis-expres-suivi.info)', pertinent: true }
      - { id: urgence, libelle: 'On me presse : « sous 24 h »', pertinent: true }
      - { id: numero, libelle: 'Le SMS vient d’un numéro de portable inconnu', pertinent: true }
      - { id: montant, libelle: 'Le montant est très petit', pertinent: false }
    explicationIndices: 'Les arnaqueurs imitent les transporteurs avec des adresses qui ressemblent aux vraies et te pressent pour que tu ne réfléchisses pas. Le petit montant n’est pas un signe de sécurité : c’est un appât pour récupérer les numéros de carte.'
    aRetenir: 'Un vrai transporteur ne te demande jamais de payer par un lien reçu par SMS. En cas de doute, on vérifie sur l’appli ou le site officiel, en le tapant soi-même.'
    aRetenirSimple: 'Ne clique jamais sur un lien de colis reçu par SMS. Vérifie sur l’appli officielle.'
    recuperation: { action: demander-aide, siChoix: [clic] }

  - type: scenario
    id: concours-streamtube
    ecran:
      app: social
      appNom: StreamTube
      contact: 'NoaGaming_Officiel'
      messages:
        - de: contact
          texte: 'BRAVO 🎉 Tu fais partie des 10 gagnants de la console NovaStation ! Pour la recevoir, envoie ton nom, ton adresse et 2 € de frais de port ici : noagaming-cadeaux.shop'
          texteSimple: 'Bravo, tu as gagné une console ! Envoie ton adresse et 2 € sur noagaming-cadeaux.shop'
    question: Ce message privé vient d’un compte qui ressemble à celui de ton youtubeur préféré. Que fais-tu ?
    choix:
      - id: donne
        texte: J’envoie mes infos et je paie les 2 €, c’est une chance unique !
        qualite: risque
        consequence: 'Aucune console n’arrive. Par contre, ton nom et ton adresse circulent maintenant : tu reçois d’autres faux messages qui les citent pour paraître vrais.'
        consequenceSimple: 'Pas de console. Mais ton nom et ton adresse sont partis chez des arnaqueurs.'
      - id: verifie
        texte: Je vais sur la vraie chaîne du youtubeur pour voir s’il a annoncé un concours.
        qualite: bon
        consequence: 'Sur sa vraie chaîne, NoaGaming a épinglé un message : « Des faux comptes se font passer pour moi. Je ne demande JAMAIS d’argent. » Le compte qui t’a écrit était un imposteur.'
      - id: aide
        texte: Je demande de l’aide à quelqu’un avant de répondre.
        qualite: aide
        consequence: 'Ton prof de techno t’explique que c’est une arnaque très courante et te montre comment signaler le faux compte.'
    indices:
      - { id: frais, libelle: 'On me demande de l’argent pour recevoir un cadeau', pertinent: true }
      - { id: nom-compte, libelle: 'Le nom du compte a « _Officiel » en plus', pertinent: true }
      - { id: lien, libelle: 'Le lien n’est pas celui de la plateforme', pertinent: true }
      - { id: emoji, libelle: 'Il y a un emoji fête dans le message', pertinent: false }
    explicationIndices: 'Un faux compte peut copier le nom et la photo d’une personne connue. Le vrai signal, c’est la demande d’argent et le lien vers un autre site. L’emoji, lui, ne prouve rien.'
    aRetenir: 'Un vrai concours ne te demande jamais de payer pour recevoir ton lot. Vérifie sur le compte officiel de la personne.'
    aRetenirSimple: 'Un vrai cadeau ne se paie pas. Vérifie sur le vrai compte.'
    recuperation: { action: bloquer-signaler, siChoix: [donne] }

  - type: scenario
    id: mail-gamebox
    ecran:
      app: mail
      appNom: Mail
      contact: 'GameBox Sécurité <securite@gamebox-verif.com>'
      sujet: 'Ton compte sera supprimé dans 24 h'
      messages:
        - de: contact
          texte: 'Bonjour, une activité anormale a été détectée sur ton compte GameBox. Pour éviter sa suppression, confirme ton identifiant et ton mot de passe dans les 24 h en cliquant sur « Sauver mon compte ».'
          texteSimple: 'Ton compte GameBox va être supprimé. Donne ton mot de passe ici pour le sauver.'
    question: Tu as passé des heures sur ce jeu. Que fais-tu ?
    choix:
      - id: clique
        texte: Je clique sur « Sauver mon compte » et je me connecte.
        qualite: risque
        consequence: 'Le faux site enregistre ton mot de passe. Le soir même, quelqu’un se connecte, change ton pseudo et dépense tes Coins. Tu peux encore reprendre la main.'
        consequenceSimple: 'Le faux site a volé ton mot de passe. Quelqu’un utilise ton compte. Tu peux encore le récupérer.'
      - id: appli
        texte: J’ouvre moi-même l’appli GameBox pour voir si j’ai une alerte.
        qualite: bon
        consequence: 'Dans l’appli officielle : aucune alerte, ton compte va très bien. Le mail était faux.'
      - id: aide
        texte: Je demande de l’aide à quelqu’un avant de cliquer.
        qualite: aide
        consequence: 'Ta cousine regarde l’adresse de l’expéditeur : « gamebox-verif.com, ce n’est pas GameBox ! » Vous signalez le mail comme hameçonnage.'
    indices:
      - { id: expediteur, libelle: 'L’adresse de l’expéditeur n’est pas celle de GameBox', pertinent: true }
      - { id: menace, libelle: 'On me menace de supprimer mon compte', pertinent: true }
      - { id: mdp, libelle: 'On me demande mon mot de passe', pertinent: true }
      - { id: bonjour, libelle: 'Le message commence par « Bonjour »', pertinent: false }
    explicationIndices: 'Aucun service sérieux ne te demande ton mot de passe par mail. La menace et le délai très court servent à te faire paniquer.'
    aRetenir: 'On ne donne jamais son mot de passe suite à un mail. Pour vérifier, on ouvre soi-même l’appli ou le site officiel.'
    aRetenirSimple: 'Ne donne jamais ton mot de passe dans un mail. Ouvre toi-même l’appli.'
    recuperation: { action: changer-mdp, siChoix: [clique] }

  - type: minijeu
    id: tri-messages
    jeu: tri
    config:
      consigne: Pour chaque message, arnaque, message normal, ou il faut vérifier d’abord ?
      categories:
        - { id: arnaque, libelle: Arnaque }
        - { id: legitime, libelle: Légitime }
        - { id: verifier, libelle: Je vérifie d’abord }
      cartes:
        - { id: c1, texte: 'Colis Express : livraison impossible, payez 2,49 € sur colisexpress-livraison.top', categorie: arnaque, explication: 'Lien bizarre et paiement demandé par SMS : arnaque au faux colis.' }
        - { id: c2, texte: 'Maman : je rentre vers 19 h, pense à sortir le chien 🐶', categorie: legitime, explication: 'Un message normal d’une personne que tu connais.' }
        - { id: c3, texte: 'Félicitations ! Tu as gagné un smartphone dernier cri, clique vite pour le réclamer !', categorie: arnaque, explication: 'Tu n’as participé à rien : faux concours.' }
        - { id: c4, texte: 'GameBox : ta commande de 500 Coins est confirmée (tu n’as rien acheté)', categorie: verifier, explication: 'Ne clique pas dans le message : ouvre toi-même l’appli pour vérifier ton historique.' }
        - { id: c5, texte: 'Mon Collège : les cours de demain sont annulés, consulte l’ENT', categorie: verifier, explication: 'Ça peut être vrai : vérifie directement sur l’ENT, sans passer par un lien.' }
        - { id: c6, texte: 'Léo : trop drôle cette vidéo de toi 😂 regarde : vid-eo-partage.xyz', categorie: arnaque, explication: 'Le compte de Léo a sûrement été piraté : le lien sert à voler ton compte.' }
debrief:
  questions:
    - Quel était le piège ?
    - Quel indice pourras-tu réutiliser la prochaine fois ?
    - Que faire si ça t’est déjà arrivé ?
  reponses: 'Le piège commun : pousser à agir vite (urgence, menace ou cadeau) sur un lien qui n’est pas celui du vrai service. Indices réutilisables : adresse du site ou de l’expéditeur, demande d’argent ou de mot de passe, pression du temps. Si c’est déjà arrivé : prévenir un adulte tout de suite, changer le mot de passe, faire opposition sur la carte si elle a été donnée. Ce n’est pas grave d’avoir été piégé, c’est grave de le cacher.'
  erreursFrequentes:
    - 'Croire qu’un petit montant est sans risque (c’est un appât pour voler la carte).'
    - 'Penser qu’un compte avec le bon nom et la bonne photo est forcément le vrai.'
    - 'Croire que les fautes d’orthographe sont le seul indice : les arnaques récentes sont souvent bien écrites.'
fiche:
  deroulement: |
    5 min : cadre. Qui a déjà reçu un SMS bizarre ? (sans obligation de raconter)
    15 min : jeu, en binômes ou en classe entière vidéoprojetée.
    20 min : débrief des 3 questions, puis retour sur le mini-jeu (cartes « Je vérifie d’abord »).
    5 min : où trouver de l’aide (adulte de confiance, cybermalveillance.gouv.fr pour les parents).
    5 min : engagement. Ce soir, je montre à un adulte de ma famille comment repérer un faux SMS de colis.
```

- [ ] **Step 3 : écrire `p-college-ami-pirate` et `p-lycee-offre-emploi`**

Suivre la structure de `p-6e-colis` et les règles d'écriture ci-dessus.

`content/missions/phishing/p-college-ami-pirate.yaml` : `tranches: ['5e-3e']`, titre « Mon ami a changé », `duree: 18`, `crcn: ['4.1', '2.1']`, `programmes: ['EMI cycle 4']`.
| Étape | Écran | Situation | Choix risque (id) → récupération | Indices pertinents / non pertinent |
|---|---|---|---|---|
| `code-ami` | `chat`, SnapTalk, contact « Inès » (une amie) | « Oups je t’ai envoyé un code par erreur 😅 tu peux me le renvoyer ? » alors que tu viens de recevoir un SMS de code SnapTalk | `renvoie` : tu renvoies le code, ton compte est pris et le pirate écrit à tes contacts → `changer-mdp` | Code reçu sans l’avoir demandé ; une amie ne peut pas « se tromper » de code de connexion ; demande pressante / non pertinent : Inès utilise des emojis |
| `faux-ent` | `mail`, Mail, « Mon Collège <support@moncollege-ent.net> », objet « Votre mot de passe expire aujourd’hui » | Lien pour « renouveler » le mot de passe ENT | `connecte` : tu te connectes au faux ENT, quelqu’un lit tes messages et envoie des messages en ton nom → `changer-mdp` | Domaine différent de l’ENT habituel ; urgence « aujourd’hui » ; demande du mot de passe / non pertinent : logo du collège présent |
| `vote-concours` | `chat`, SnapTalk, contact « Tom (3e A) » | « Vote pour moi au concours de dessin stp, faut juste te connecter avec ton SnapTalk ici : snaptalk-vote.xyz » | `vote` : ton compte est volé à son tour → `activer-2fa` | Lien hors appli qui demande de se reconnecter ; message identique envoyé à toute la classe / non pertinent : le concours existe vraiment au collège |
| mini-jeu `repere` | titre « Mon Collège : connexion » | 7 lignes : adresse `moncollege-ent.net/login` (indice), « Votre session expire dans 5 min » (indice), « Identifiant », « Mot de passe », « Code de vérification reçu par SMS » (indice : on ne donne jamais ce code sur une page arrivée par lien), « Mentions légales », « Se souvenir de moi » | | |

`content/missions/phishing/p-lycee-offre-emploi.yaml` : `tranches: ['lycee']`, titre « Trop beau pour être vrai », `duree: 20`, `crcn: ['4.1', '1.1', '4.2']`, `programmes: ['SNT 2de', 'EMC lycée']`.
| Étape | Écran | Situation | Choix risque (id) → récupération | Indices pertinents / non pertinent |
|---|---|---|---|---|
| `job-likes` | `sms`, Messages, numéro inconnu | « Job étudiant : 30 €/h pour liker des vidéos depuis ton téléphone. Rejoins l’équipe ici » puis on te demande 25 € de « frais d’inscription » | `inscrit` : tu paies, on te demande ensuite plus pour « débloquer tes gains » → `capture-preuve` | Salaire irréaliste ; payer pour travailler ; contact par numéro inconnu / non pertinent : le message est poli |
| `logement` | `mail`, Mail, « Julie Martin <julie.location75@mail-perso.com> », objet « Studio 350 €/mois centre-ville » | Loyer très bas, propriétaire « à l’étranger », virement de caution avant toute visite | `vire` : la caution est perdue, l’annonce disparaît → `capture-preuve` | Prix très en dessous du marché ; pas de visite possible ; paiement avant visite / non pertinent : il y a des photos de l’appartement |
| `banque-perso` | `web`, BanqueNova, url `banquenova-securite.com/confirmation` | Page qui affiche ton prénom et demande de « confirmer une opération suspecte » avec ton code, puis un « conseiller » t’appelle | `valide` : tu valides l’opération dans l’appli, 600 € partent → `demander-aide` (parent, puis opposition bancaire) | L’adresse n’est pas celle de la banque ; une banque ne demande jamais de valider une opération pour « l’annuler » ; pression du conseiller / non pertinent : la page connaît ton prénom (données faciles à trouver) |
| mini-jeu `repere` | titre « Mail : Offre de stage rémunéré » | 8 lignes : expéditeur en adresse gratuite (indice), « Rémunération : 2 500 €/mois pour 10 h/semaine » (indice), « Envoie une copie de ta carte d’identité et ton RIB » (indice), « Réponds sous 2 heures » (indice), « Bonjour », signature, « Entreprise : Nova Conseil », « Lieu : télétravail » | | |

- [ ] **Step 4 : écrire le README (avec le guide de rédaction)**

`README.md` :
````markdown
# Cyber Réflexes

Jeu web gratuit de sensibilisation aux risques numériques, de la 6e à la Terminale. Sans compte ni installation,
jouable hors ligne. Aucune donnée ne quitte l’appareil.

## Commandes

| Commande | Rôle |
|---|---|
| `npm install` | Installer les dépendances (Node 22) |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests unitaires et tests du contenu |
| `npm run test:e2e` | Tests de bout en bout et d’accessibilité (Playwright) |
| `npm run lint` / `npm run typecheck` | Qualité du code |
| `npm run build` | Site statique dans `dist/` |

Variable optionnelle `VITE_CONTACT_URL` : lien « Signaler une erreur » de l’espace enseignants.

## Écrire une mission

Une mission est un fichier YAML dans `content/missions/<thème>/<id>.yaml`. Le schéma complet est dans
`src/content/schema.ts`. Le build **refuse** un fichier invalide et indique le fichier, le champ et la règle en cause.
Après avoir ajouté un fichier, relancer `npm run dev`.

Règles principales :
- 3 objectifs maximum ; 3 ou 4 scénarios et 1 mini-jeu (`tri` ou `repere`) par mission.
- Chaque scénario a un choix `aide` (« Je demande de l’aide… »), au moins un indice pertinent et un `aRetenir`.
- `recuperation.siChoix` ne cite que des choix `risque` ou `bon`, jamais le choix `aide`.
- Marques **fictives** uniquement dans les faux écrans (un test le vérifie).
- 6e : `texteSimple`, `consequenceSimple` (choix risqués) et `aRetenirSimple` obligatoires.
- Thème sensible : `fiche.siRevelation` obligatoire, et relecture par une association spécialisée avant publication.
- Ton : tutoiement, jamais culpabilisant, une conséquence réaliste et toujours une action possible.

Exemple de référence : `content/missions/phishing/p-6e-colis.yaml`.
````

Supprimer `content/missions/.gitkeep`.

- [ ] **Step 5 : lancer les tests et le build**

Run : `npx vitest run && npx vite build`
Expected : tous PASS (dont 3 × « aucune marque réelle », 3 × « 3 ou 4 scénarios », 1 × « textes simplifiés » et 3 × « phishing : au moins une mission ») ; build OK.

- [ ] **Step 6 : relecture humaine du ton**

Relire les trois fichiers à voix haute : pas de culpabilisation, conséquence réparable, vocabulaire adapté à l'âge. Corriger si nécessaire, puis relancer `npx vitest run tests/unit/node/content-real.test.ts`.

- [ ] **Step 7 : commit**

```bash
git add -A
git commit -m "content: thème Phishing pour les 3 tranches, tests du contenu et guide de rédaction

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18 : contenu « Jeux vidéo et achats » (3 missions)

**Files :**
- Create : `content/missions/jeux-achats/j-6e-generateur.yaml`, `content/missions/jeux-achats/j-college-faux-modo.yaml`, `content/missions/jeux-achats/j-lycee-vestiaire.yaml`
- Modify : `tests/unit/node/content-real.test.ts`

**Interfaces :**
- Consumes : règles d'écriture ; test de contenu de la tâche 17.
- Produces : missions `j-6e-generateur`, `j-college-faux-modo` et `j-lycee-vestiaire`.

- [ ] **Step 1 : ajouter le test de couverture (qui doit échouer)**

Dans `tests/unit/node/content-real.test.ts`, ajouter dans le `describe` :
```ts
  it.each(TRANCHES)('jeux et achats : au moins une mission pour la tranche %s', (t) => {
    expect(missionsDuTheme('jeux-achats').some((m) => m.tranches.includes(t))).toBe(true)
  })
```

Run : `npx vitest run tests/unit/node/content-real.test.ts`
Expected : FAIL sur les 3 cas « jeux et achats ».

- [ ] **Step 2 : écrire les trois missions**

`j-6e-generateur.yaml` : `tranches: ['6e']`, titre « Coins gratuits ? », `duree: 15`, `crcn: ['4.1', '1.1']`, `programmes: ['EMI cycle 3']`. Textes simplifiés obligatoires (6e).
| Étape | Écran | Situation | Choix risque (id) → récupération | Indices pertinents / non pertinent |
|---|---|---|---|---|
| `generateur` | `web`, url `gamebox-coins-gratuits.net` | Vidéo puis site « Générateur de 10 000 GameBox Coins », qui demande pseudo + mot de passe puis une « vérification humaine » (télécharger une appli) | `genere` : le compte est volé → `changer-mdp` | Personne ne peut « générer » des Coins ; on demande le mot de passe hors du jeu ; téléchargement demandé / non pertinent : le site a un compteur de « joueurs connectés » |
| `echange-objet` | `chat`, GameBox Chat, « DarkWolf_77 » | « Je te donne mon épée légendaire contre ton dragon, mais donne le tien en premier » | `donne-premier` : l’objet est perdu, DarkWolf te bloque → `bloquer-signaler` | Il faut donner en premier ; échange hors du système sécurisé du jeu ; offre trop belle / non pertinent : il a un bon niveau |
| `copain-mdp` | `chat`, SnapTalk, « Sacha (6e C) » | « File-moi ton mot de passe GameBox, je te monte niveau 50 ce soir, promis 🙏 » | `partage` : Sacha dépense tes Coins et change ton mot de passe « pour rire » → `changer-mdp` | On demande le mot de passe, même un ami ; aucune raison d’en avoir besoin / non pertinent : Sacha est vraiment dans ta classe |
| mini-jeu `repere` | titre « GameBox Coins GRATUITS » | 7 lignes : adresse `gamebox-coins-gratuits.net` (indice), « 10 000 Coins offerts à tous ! » (indice), « Entre ton mot de passe » (indice), « Télécharge l’appli de vérification » (indice), « Choisis ta plateforme », « 2 847 joueurs connectés », « Conditions d’utilisation » | | |

`j-college-faux-modo.yaml` : `tranches: ['5e-3e']`, titre « Le faux modérateur », `duree: 18`, `crcn: ['4.1', '5.1']`, `programmes: ['EMI cycle 4']`.
| Étape | Écran | Situation | Choix risque (id) → récupération | Indices pertinents / non pertinent |
|---|---|---|---|---|
| `signale-erreur` | `chat`, ChatCord, « Lucas » (ami de serveur) | « J’ai signalé ton compte par erreur 😬 il va être banni, contacte vite @Support_ChatCord pour annuler » ; le « support » demande le code reçu par SMS | `donne-code` : le compte est volé → `activer-2fa` (après changement de mot de passe raconté dans la conséquence) | Le « support » contacte par message privé ; on demande un code ; urgence « banni » / non pertinent : Lucas est vraiment ton ami |
| `teste-jeu` | `chat`, ChatCord, « Nova_Dev » | « J’ai codé un jeu, tu peux le tester ? » + fichier `NovaQuest_beta.exe` | `lance` : le programme vole tes sessions et mots de passe enregistrés → `changer-mdp` | Fichier exécutable envoyé par un inconnu ; flatterie / non pertinent : le nom du jeu est stylé |
| `mod-gratuit` | `web`, url `gamebox-mods-free.xyz` | Mod « skins illimités » qui demande de désactiver l’antivirus | `desactive` : l’ordinateur familial est infecté → `demander-aide` | Désactiver l’antivirus ; site non officiel ; « gratuit et illimité » / non pertinent : beaucoup de commentaires positifs |
| mini-jeu `tri` | | 6 messages ChatCord : faux support (arnaque), invitation d’un ami à une partie (légitime), lien « skin gratuit » (arnaque), annonce officielle dans le salon officiel (légitime), ami qui envoie un `.exe` (vérifier), « ton compte sera banni, clique ici » (arnaque) | | |

`j-lycee-vestiaire.yaml` : `tranches: ['lycee']`, titre « Vente entre particuliers », `duree: 20`, `crcn: ['4.1', '1.1']`, `programmes: ['SNT 2de']`.
| Étape | Écran | Situation | Choix risque (id) → récupération | Indices pertinents / non pertinent |
|---|---|---|---|---|
| `qr-paiement` | `chat`, Vestiaire, acheteur « Camille_B » | Tu vends une veste ; l’acheteur envoie un QR code pour « confirmer la réception du paiement » sur un site externe | `scanne` : tu saisis ta carte, on la débite → `capture-preuve` | Sortir de la plateforme ; QR code envoyé par l’acheteur ; on demande ta carte pour *recevoir* de l’argent / non pertinent : l’acheteur a 4,8 étoiles |
| `console-virement` | `chat`, Vestiaire, vendeur « GamerShop » | NovaStation à −40 %, « paiement par virement direct, c’est plus rapide » | `vire` : aucun colis, le compte du vendeur disparaît → `bloquer-signaler` | Prix très bas ; paiement hors plateforme (plus de protection) ; pression « d’autres acheteurs attendent » / non pertinent : belles photos |
| `faux-conseiller` | `sms`, Messages, « BanqueNova » | SMS « Opération suspecte de 480 € », puis appel d’un « conseiller » qui demande de valider une notification dans l’appli bancaire pour « bloquer » l’opération | `valide` : tu as validé le paiement toi-même → `demander-aide` | La banque ne demande jamais de valider pour annuler ; appel juste après un SMS ; urgence / non pertinent : le numéro affiché ressemble à celui de la banque (il peut être usurpé) |
| mini-jeu `tri` | | 6 situations d’achat/vente : paiement dans la plateforme (légitime), QR code « pour recevoir l’argent » (arnaque), vendeur qui demande un virement direct (arnaque), acheteur qui pose des questions sur la taille (légitime), mail « Vestiaire » d’une adresse inconnue (vérifier), prix 60 % sous le marché (vérifier) | | |

- [ ] **Step 3 : lancer les tests et le build**

Run : `npx vitest run && npx vite build`
Expected : tous PASS ; build OK.

- [ ] **Step 4 : relecture humaine du ton** (voir la tâche 17, step 6).

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "content: thème Jeux vidéo et achats pour les 3 tranches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19 : missions Rappel (une par tranche)

**Files :**
- Create : `content/missions/rappel/r-6e.yaml`, `content/missions/rappel/r-college.yaml`, `content/missions/rappel/r-lycee.yaml`
- Modify : `tests/unit/node/content-real.test.ts`

**Interfaces :**
- Produces : missions `r-6e`, `r-college` et `r-lycee` (`type: rappel`). **Les tests E2E dépendent de `r-6e`** : un fil d'au moins 4 notifications (dont une surprise) suivi d'un scénario.

- [ ] **Step 1 : ajouter les tests (qui doivent échouer)**

Dans `tests/unit/node/content-real.test.ts`, ajouter dans le `describe` :
```ts
  it.each(TRANCHES)('rappel : exactement une mission rappel pour la tranche %s', (t) => {
    expect(bundle.missions.filter((m) => m.type === 'rappel' && m.tranches.includes(t))).toHaveLength(1)
  })

  it('les rappels sont courts et contiennent un fil d’au moins 4 notifications', () => {
    const rappels = bundle.missions.filter((m) => m.type === 'rappel')
    expect(rappels.length).toBeGreaterThan(0)
    for (const r of rappels) {
      expect(r.duree, r.id).toBeLessThanOrEqual(8)
      const fil = r.etapes.find((e) => e.type === 'fil')
      expect(fil?.type === 'fil' ? fil.notifications.length : 0, r.id).toBeGreaterThanOrEqual(4)
    }
  })
```

Run : `npx vitest run tests/unit/node/content-real.test.ts`
Expected : FAIL sur les nouveaux tests.

- [ ] **Step 2 : écrire `r-6e` (référence)**

`content/missions/rappel/r-6e.yaml` :
```yaml
id: r-6e
type: rappel
themesCouverts: [phishing, jeux-achats]
tranches: ['6e']
titre: Rappel express
resume: Cinq minutes, quelques notifications… et peut-être un piège. Tes réflexes sont-ils toujours là ?
duree: 5
objectifs:
  - Réutiliser les bons réflexes appris plus tôt
  - Repérer un piège glissé parmi des messages normaux
competences:
  crcn: ['4.1']
  programmes: ['EMI cycle 3']
etapes:
  - type: fil
    id: fil-notifs
    consigne: Ton téléphone vibre. Pour chaque notification, que fais-tu ?
    notifications:
      - { id: mamie, appNom: Messages, de: Mamie, texte: 'Coucou ! On mange ensemble dimanche ? Bisous', explication: 'Un message normal de quelqu’un que tu connais.' }
      - { id: saison, appNom: GameBox, de: GameBox, texte: 'La saison 12 commence aujourd’hui ! Ouvre le jeu pour découvrir les nouveautés.', explication: 'Notification normale de l’appli officielle : elle ne demande ni lien, ni mot de passe, ni argent.' }
      - { id: douane, appNom: Messages, de: '+33 6 44 81 20 37', texte: 'Colis Express : 2,99 € de frais de douane à régler avant demain pour recevoir votre colis : colis-exp-douane.com', surprise: true, explication: 'Le piège ! Numéro inconnu, urgence, lien bizarre et petit montant : la même arnaque qu’au début.' }
      - { id: classe, appNom: SnapTalk, de: 'Groupe 6e B', texte: 'Quelqu’un a les devoirs de maths pour jeudi ?', explication: 'Message normal de ta classe.' }
      - { id: meteo, appNom: Météo, de: Météo, texte: 'Alerte pluie cet après-midi : prends un parapluie ☔', explication: 'Notification normale d’une appli installée.' }
  - type: scenario
    id: ami-coins
    ecran:
      app: chat
      appNom: GameBox Chat
      contact: 'Maxime (ta classe)'
      messages:
        - de: contact
          texte: 'Trop fort, j’ai eu 5 000 Coins gratuits sur coins-gratuits-gamebox.net !! Mets ton pseudo et ton mot de passe et c’est bon 😎'
          texteSimple: 'J’ai eu 5 000 Coins gratuits ! Mets ton pseudo et ton mot de passe sur ce site.'
    question: C’est un copain de classe qui t’envoie ça. Que fais-tu ?
    choix:
      - id: essaie
        texte: Je mets mon pseudo et mon mot de passe, Maxime l’a bien fait.
        qualite: risque
        consequence: 'Pas de Coins. Le lendemain, ton compte envoie le même message à tous tes amis : il a été piraté, comme celui de Maxime. Tu peux encore le reprendre.'
        consequenceSimple: 'Ton compte est piraté et envoie le message à tes amis. Tu peux encore le reprendre.'
      - id: demande-maxime
        texte: Je demande à Maxime en vrai, au collège, s’il a vraiment envoyé ce message.
        qualite: bon
        consequence: 'Maxime n’a rien envoyé : son compte a été piraté, et le pirate écrit à tous ses contacts. Grâce à toi, il change vite son mot de passe.'
      - id: aide
        texte: Je demande de l’aide à quelqu’un avant de faire quoi que ce soit.
        qualite: aide
        consequence: 'Ta prof principale reconnaît l’arnaque et prévient la classe : plusieurs élèves avaient reçu le même message.'
    indices:
      - { id: mdp, libelle: 'On me demande mon mot de passe sur un autre site', pertinent: true }
      - { id: gratuit, libelle: 'Des Coins gratuits, c’est trop beau pour être vrai', pertinent: true }
      - { id: ami, libelle: 'Le message vient d’un ami', pertinent: false }
    explicationIndices: 'Un message d’ami n’est pas forcément écrit par ton ami : son compte a pu être piraté. La demande de mot de passe sur un site extérieur au jeu est le vrai signal.'
    aRetenir: 'Même venant d’un ami, une offre de Coins gratuits qui demande ton mot de passe est une arnaque. Vérifie en vrai avec ton ami.'
    aRetenirSimple: 'Même si c’est un ami, ne donne jamais ton mot de passe. Demande-lui en vrai.'
    recuperation: { action: changer-mdp, siChoix: [essaie] }
debrief:
  questions:
    - Quel était le piège caché dans les notifications ?
    - Quel indice t’a permis de le repérer (ou t’aurait permis) ?
    - Que faire si un ami t’envoie un message qui ne lui ressemble pas ?
  reponses: 'Le SMS de frais de douane reprend les indices du faux colis : numéro inconnu, urgence, lien, petit montant. Un message d’ami peut venir d’un compte piraté : on vérifie autrement (en vrai, par appel).'
  erreursFrequentes:
    - 'Penser qu’un message d’ami est forcément sûr.'
    - 'Traiter toutes les notifications de la même façon, sans lire l’expéditeur.'
fiche:
  deroulement: |
    À lancer 7 jours puis 30 jours après une mission (la carte le propose aux élèves).
    5 min : jeu, sans prévenir qu’un piège est caché.
    10 min : débrief. Qui a repéré le piège ? Quel indice ?
    Engagement : reconnaître un message « pas comme d’habitude » d’un ami et vérifier en vrai.
```

- [ ] **Step 3 : écrire `r-college` et `r-lycee`**

Même structure : un `fil` de 5 notifications (une `surprise`), puis un scénario avec récupération. `duree: 5`, `themesCouverts: [phishing, jeux-achats]`.
- `r-college` (`tranches: ['5e-3e']`) : notifications ChatCord (salon de classe), Mon Collège (vrai rappel de sortie scolaire), SnapTalk (ami), **surprise** « ChatCord Support : ton compte sera désactivé dans 1 h, confirme ton identité : chatcord-verify.net », Météo. Scénario : un ami demande « le code que tu vas recevoir » → choix risque → `activer-2fa`.
- `r-lycee` (`tranches: ['lycee']`) : notifications Vestiaire (vraie notification « ton article a été vu 12 fois »), BanqueNova (vrai relevé mensuel dans l’appli), Mon Lycée, **surprise** « Vestiaire : ton acheteur a payé ! Confirme la réception en scannant ce QR code : vestiaire-paiement-securise.com », SnapTalk. Scénario : offre de job « likes payés » relayée par un camarade → choix risque → `capture-preuve`.

- [ ] **Step 4 : lancer les tests et le build**

Run : `npx vitest run && npx vite build`
Expected : tous PASS ; build OK.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "content: missions Rappel (J+7/J+30) avec message piège pour les 3 tranches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20 : tests de bout en bout et d'accessibilité (Playwright + axe)

**Files :**
- Create : `playwright.config.ts`, `tests/e2e/helpers.ts`, `tests/e2e/parcours.spec.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/hors-ligne.spec.ts`

**Interfaces :**
- Consumes : l'application complète ; les missions `p-6e-colis` et `r-6e` (tâches 17 et 19) ; les libellés d'interface des tâches 8 et 11 à 16.
- Produces : `commencer(page, tranche, mode)`, `jouerMission(page)`, `tabJusqua(page, texte)`.

- [ ] **Step 1 : installer les navigateurs**

Run : `npx playwright install --with-deps chromium firefox webkit`
Expected : navigateurs installés. Sous Windows, l'option `--with-deps` est ignorée sans erreur.

- [ ] **Step 2 : configuration et helpers**

`playwright.config.ts` :
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['iPad (gen 7)'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
```

`tests/e2e/helpers.ts` :
```ts
import { expect, type Page } from '@playwright/test'

export async function commencer(page: Page, tranche: '6e' | '5e – 3e' | 'Lycée', mode: 'Solo' | 'Binôme' | 'Classe entière') {
  await page.goto('/')
  await page.getByRole('radio', { name: tranche, exact: true }).check()
  await page.getByRole('radio', { name: new RegExp(mode) }).check()
  await page.getByRole('button', { name: /C.est parti|Continuer/ }).click()
  await expect(page.getByRole('heading', { name: 'Choisis un thème' })).toBeVisible()
}

/** Joue la mission affichée jusqu'à la fin en choisissant toujours « demander de l'aide » et « Je ne sais pas ». */
export async function jouerMission(page: Page) {
  const fin = page.getByRole('heading', { name: 'Mission terminée !' })
  for (let i = 0; i < 300; i++) {
    if (await fin.isVisible()) return
    const suivant = page.getByRole('button', { name: /^(Suivant|Terminer le mini-jeu)$/ })
    const validerClasse = page.getByRole('button', { name: 'Valider le choix de la classe' })
    const aide = page.locator('[data-qualite="aide"]')
    const jeNeSaisPas = page.getByRole('button', { name: 'Je ne sais pas' })
    const continuer = page.getByRole('button', { name: 'Continuer', exact: true })
    const categorie = page.locator('.tri-categories button:not([disabled])').first()
    const solution = page.getByRole('button', { name: 'Voir la solution' })
    const verifier = page.getByRole('radio', { name: 'Je vérifie autrement' })
    const commencerSensible = page.getByRole('button', { name: 'Commencer' })

    if (await suivant.isVisible()) await suivant.click()
    else if ((await validerClasse.isVisible()) && (await validerClasse.isEnabled())) await validerClasse.click()
    else if (await aide.isVisible()) await aide.click()
    else if (await jeNeSaisPas.isVisible()) await jeNeSaisPas.click()
    else if (await continuer.isVisible()) await continuer.click()
    else if (await categorie.isVisible()) await categorie.click()
    else if (await solution.isVisible()) await solution.click()
    else if (await verifier.first().isVisible()) {
      for (const radio of await verifier.all()) await radio.check()
      await page.getByRole('button', { name: 'Valider mes choix' }).click()
    } else if (await commencerSensible.isVisible()) await commencerSensible.click()
    else await page.waitForTimeout(100)
  }
  throw new Error('La mission ne s’est pas terminée')
}

export async function tabJusqua(page: Page, texte: string) {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    const actif = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
    if (actif.includes(texte)) return
  }
  throw new Error(`Élément introuvable au clavier : ${texte}`)
}
```

- [ ] **Step 3 : écrire les parcours**

`tests/e2e/parcours.spec.ts` :
```ts
import { expect, test } from '@playwright/test'
import { commencer, jouerMission, tabJusqua } from './helpers'

test('solo 6e : une mission complète, puis la carte la marque terminée', async ({ page }) => {
  await commencer(page, '6e', 'Solo')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await jouerMission(page)
  await expect(page.getByText('Mission accomplie')).toBeVisible()
  await page.getByRole('link', { name: 'Retour à la carte' }).click()
  await expect(page.getByText('Terminée').first()).toBeVisible()
})

test('un choix risqué mène à un geste de récupération', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await page.locator('[data-choix="clic"]').click()
  await page.getByRole('button', { name: 'Je ne sais pas' }).click()
  await expect(page.getByText('C’était risqué')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'À qui en parler ?' })).toBeVisible()
  await page.getByRole('button', { name: /Un parent/ }).click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByText('Étape 2 sur 4')).toBeVisible()
})

test('un scénario complet au clavier', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit ne tabule pas vers les boutons par défaut')
  await page.goto('/#/mission/p-6e-colis')
  await tabJusqua(page, 'Je demande de l’aide')
  await page.keyboard.press('Enter')
  await tabJusqua(page, 'Je ne sais pas')
  await page.keyboard.press('Enter')
  await tabJusqua(page, 'Continuer')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Étape 2 sur 4')).toBeVisible()
})

test('classe entière : l’adulte valide le choix de la classe', async ({ page }) => {
  await commencer(page, '6e', 'Classe entière')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await page.locator('[data-qualite="aide"]').click()
  await expect(page.getByRole('heading', { name: 'Qu’est-ce qui t’a décidé ?' })).toBeHidden()
  await page.getByRole('button', { name: 'Valider le choix de la classe' }).click()
  await expect(page.getByRole('heading', { name: 'Qu’est-ce qui t’a décidé ?' })).toBeVisible()
})

test('rappel : le message piège est révélé à la fin', async ({ page }) => {
  await page.goto('/#/mission/r-6e')
  for (const radio of await page.getByRole('radio', { name: 'J’ouvre / je clique' }).all()) await radio.check()
  await page.getByRole('button', { name: 'Valider mes choix' }).click()
  await jouerMission(page)
  await expect(page.getByRole('heading', { name: 'Le message piège était…' })).toBeVisible()
  await expect(page.getByText('Tu as ouvert ce message piège')).toBeVisible()
})

test('stockage bloqué : le jeu reste jouable et le signale', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Accès refusé', 'SecurityError')
      },
    })
  })
  await commencer(page, 'Lycée', 'Solo')
  await expect(page.getByText('Ta progression ne pourra pas être enregistrée sur cet appareil.')).toBeVisible()
})

test('enseignant : fiche imprimable et version papier', async ({ page }) => {
  await page.goto('/#/enseignants/p-6e-colis')
  await expect(page.getByRole('heading', { name: 'Le colis mystère', level: 1 })).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.app-header')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Imprimer la fiche' })).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('link', { name: 'Version papier (plan B)' }).click()
  await expect(page.getByRole('heading', { name: 'Corrigé (pour l’adulte)' })).toBeVisible()
})
```

`tests/e2e/a11y.spec.ts` :
```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { commencer, jouerMission } from './helpers'

async function verifierA11y(page: Page, ecran: string) {
  const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = resultat.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(graves.map((v) => `${ecran} — ${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([])
}

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'audit axe exécuté une fois, sous Chromium')
})

test('pages élève', async ({ page }) => {
  await page.goto('/')
  await verifierA11y(page, 'accueil')
  await commencer(page, '6e', 'Solo')
  await verifierA11y(page, 'carte')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await verifierA11y(page, 'situation')
  await page.locator('[data-qualite="aide"]').click()
  await verifierA11y(page, 'indices')
  await page.getByRole('button', { name: 'Je ne sais pas' }).click()
  await verifierA11y(page, 'conséquence')
  await jouerMission(page)
  await verifierA11y(page, 'fin de mission')
})

test('mission rappel (fil de notifications)', async ({ page }) => {
  await page.goto('/#/mission/r-6e')
  await verifierA11y(page, 'fil')
})

for (const [nom, chemin] of [
  ['enseignants', '/#/enseignants'],
  ['fiche', '/#/enseignants/p-6e-colis'],
  ['plan B', '/#/enseignants/p-6e-colis/plan-b'],
  ['confidentialité', '/#/confidentialite'],
  ['test technique', '/#/test'],
  ['introuvable', '/#/nimporte-quoi'],
] as const) {
  test(`page ${nom}`, async ({ page }) => {
    await page.goto(chemin)
    await verifierA11y(page, nom)
  })
}
```

`tests/e2e/hors-ligne.spec.ts` :
```ts
import { expect, test } from '@playwright/test'

test('fonctionne hors ligne après un premier chargement', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'service worker testé sous Chromium')
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cyber Réflexes', level: 1 })).toBeVisible()
  await page.goto('/#/mission/p-6e-colis')
  await expect(page.getByRole('heading', { name: 'Le colis mystère', level: 1 })).toBeVisible()
})
```

- [ ] **Step 4 : lancer les tests E2E**

Run : `npm run test:e2e`
Expected : tous PASS sur les 3 navigateurs (les tests marqués `skip` sont ignorés). Si axe signale une violation (souvent un contraste ou un libellé manquant), corriger le composant concerné, puis relancer `npx vitest run` et `npm run test:e2e`.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "test(e2e): parcours élève et enseignant, accessibilité axe et mode hors ligne

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21 : intégration continue et déploiement GitHub Pages

**Files :**
- Create : `.github/workflows/ci.yml`
- Modify : `README.md` (section Déploiement)

**Interfaces :**
- Consumes : scripts npm `lint`, `typecheck`, `test`, `test:e2e`, `build` ; variable `BASE_PATH`.
- Produces : un pipeline qui vérifie chaque push et chaque PR, et publie sur GitHub Pages à chaque push sur `main`.

- [ ] **Step 1 : workflow**

`.github/workflows/ci.yml` :
```yaml
name: CI et déploiement

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verifier:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          CI: 'true'
      - name: Build pour GitHub Pages
        run: npm run build
        env:
          BASE_PATH: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        with:
          path: dist

  deployer:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: verifier
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploiement.outputs.page_url }}
    steps:
      - id: deploiement
        uses: actions/deploy-pages@v4
```

Avant de pousser, vérifier que les actions n'ont pas de version majeure plus récente : `gh api repos/actions/checkout/releases/latest --jq .tag_name` (et de même pour `setup-node`, `upload-pages-artifact`, `deploy-pages`). Mettre à jour les `@vN` si c'est le cas.

- [ ] **Step 2 : section Déploiement du README**

Ajouter à la fin de `README.md` :
```markdown
## Déploiement

Le site est publié sur GitHub Pages par `.github/workflows/ci.yml` à chaque push sur `main`, une fois lint,
types, tests unitaires, tests du contenu et tests E2E passés.

Première mise en place :
1. Créer le dépôt sur GitHub et pousser la branche `main`.
2. Dans *Settings → Pages*, choisir *Source : GitHub Actions*.
3. (Optionnel) Dans *Settings → Secrets and variables → Actions → Variables*, ajouter `VITE_CONTACT_URL`
   (par exemple l’URL des issues du dépôt), puis l’exposer au build dans le workflow si besoin.
```

- [ ] **Step 3 : vérification complète en local**

Run : `npm run lint && npm run typecheck && npm test && npm run test:e2e && BASE_PATH=/Cybergame/ npm run build`
Expected : tout passe ; `dist/index.html` référence `/Cybergame/assets/...`.

- [ ] **Step 4 : commit**

```bash
git add -A
git commit -m "ci: vérifications complètes et déploiement GitHub Pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5 : branche et publication (avec l'accord de l'utilisateur)**

Le dépôt local est sur `master` ; le workflow publie depuis `main`. **Demander à l'utilisateur** avant d'agir :
- renommer la branche : `git branch -m master main` ;
- créer le dépôt GitHub et pousser (`gh repo create`, `git push -u origin main`) : action visible publiquement, qui nécessite son accord explicite ;
- activer Pages (*Source : GitHub Actions*).
