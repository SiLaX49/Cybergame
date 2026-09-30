# « Pourquoi as-tu fait ce choix ? » : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** après un choix risqué, demander à l'élève pourquoi il l'a fait (leviers de manipulation), lui répondre selon sa raison, récapituler ses leviers en fin de mission, et réécrire les choix risqués des 21 scénarios pour qu'ils tentent vraiment.

**Architecture :** une liste commune de 8 leviers dans `content/leviers.yaml` (validée par Zod, ajoutée au `ContentBundle`). Chaque scénario gagne un bloc `pourquoi` (3 ou 4 leviers, chacun avec `truc` et `parade`). Le réducteur de mission ajoute une phase `pourquoi` entre `situation` et `consequence` pour les choix `risque`. L'interface gagne `PourquoiForm`, un encadré dans la conséquence et un bloc en fin de mission ; les pages enseignant listent les leviers.

**Tech Stack :** Vue 3.5, TypeScript 5.9, Zod 4, Vitest 5 + @vue/test-utils, Playwright + axe (existants).

**Spec :** `docs/superpowers/specs/2026-09-28-pourquoi-leviers-design.md` (et la spec de l'étape 1, `docs/superpowers/specs/2026-09-24-cyber-reflexes-design.md`).

## Global Constraints

- Branche `feat/pourquoi` (créée depuis `main`). Messages de commit conventionnels terminés par la ligne `Co-Authored-By: Claude … <noreply@anthropic.com>` fournie par la session.
- Textes visibles en français avec l'apostrophe typographique `’` (U+2019), jamais `'` ASCII ni échappée.
- Faux écrans : marques fictives uniquement ; numéros de téléphone dans les plages fictives ARCEP (`06 39 98 …`, `01 99 00 …`).
- 6e : 20 mots maximum par phrase dans les textes lus par l'élève qui n'ont pas de version simplifiée (dont `truc`, `parade`, textes des choix).
- Ton : tutoiement, jamais culpabilisant ; la question « pourquoi » ne juge pas.
- Aucune nouvelle donnée stockée ; aucune requête réseau ; accessibilité WCAG 2.1 AA (boutons réels, focus sur le titre de la nouvelle phase, pas d'information par la couleur seule).
- `src/content/*.ts` et `scripts/*.ts` s'importent entre eux par chemins relatifs uniquement.
- L'ordre d'affichage des leviers utilise `ordreAffichage(items, `${scenario.id}:pourquoi`)` partout (jeu et version papier) ; « Autre chose / je ne sais pas » toujours en dernier.

## Review Focus

1. **Double clic sur une raison** (vidéoprojection) : le second `expliquer` arrive en phase `consequence` → ignoré, pas de plantage. Test ajouté à la tâche 4.
2. **Rejouer après le chemin risqué** : retour à la situation ; si l'élève choisit alors le bon choix, c'est l'étape « indices » qui s'affiche, pas « pourquoi ». Test ajouté à la tâche 2.
3. **Passer un scénario (thème sensible) pendant l'étape « pourquoi »** : le scénario est passé, sans levier enregistré. Test ajouté à la tâche 2.
4. **Mode classe à l'étape « pourquoi »** : un clic ne fait que sélectionner ; seule la validation de l'adulte envoie la raison. Test ajouté à la tâche 3.
5. **Fin de mission sans aucun levier possible** (mission dont aucun scénario n'a de bloc `pourquoi`, ex. données anciennes) : le bloc « Ce qui t'a fait craquer » ne s'affiche pas du tout (pas de liste vide). Test ajouté à la tâche 4.

---

### Task 1 : leviers et bloc `pourquoi` dans le contenu

**Files :**
- Create : `content/leviers.yaml`
- Modify : `src/content/schema.ts`, `src/content/acces.ts`, `scripts/build-content.ts`, `tests/unit/fixtures.ts`, `tests/unit/content-mock.ts`, `tests/unit/acces.test.ts`, `tests/unit/node/build-content.test.ts`
- Test : `tests/unit/leviers-schema.test.ts`

**Interfaces :**
- Produces (`src/content/schema.ts`) : `LEVIERS` (tuple des 8 ids), `LevierId`, `ReponseLevier = LevierId | 'autre'`, `leviersFileSchema`, `Leviers` (`{ leviers: Record<LevierId, { libelle; parade; questionDebrief }>; autre: { libelle; truc; parade } }`), `Scenario['pourquoi']` (optionnel pour l'instant : `{ levier: LevierId; truc: string; parade: string }[]`, 3 à 4 entrées), `ContentBundle.leviers: Leviers`.
- Produces : `creerAcces(bundle).getLeviers(): Leviers` ; `src/content/index.ts` réexporte `getLeviers` ; `listContentFiles` renvoie `[themes.yaml, leviers.yaml, ...missions]`.
- Produces (fixtures) : `rawLeviers()`, `leviersFixture(): Leviers` ; `rawScenario()` contient un bloc `pourquoi` avec les leviers `urgence`, `petit-montant`, `reflexe`.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

Dans `tests/unit/fixtures.ts`, ajouter à l'import depuis `@/content/schema` : `leviersFileSchema`, `type Leviers`. Ajouter dans `rawScenario()`, après `recuperation` :
```ts
    pourquoi: [
      { levier: 'urgence', truc: 'Le délai de 24 h est là exprès.', parade: 'Plus on te presse, plus tu ralentis.' },
      { levier: 'petit-montant', truc: 'Le petit montant est un appât.', parade: 'C’est ta carte qu’on veut, pas les 1,99 €.' },
      { levier: 'reflexe', truc: 'Le message imite un vrai SMS.', parade: 'Prends trois secondes avant de cliquer.' },
    ],
```
et à la fin du fichier :
```ts
export function rawLeviers() {
  const info = (libelle: string) => ({ libelle, parade: `Parade ${libelle}.`, questionDebrief: `Question ${libelle} ?` })
  return {
    leviers: {
      urgence: info('Il fallait faire vite'),
      peur: info('J’avais peur de perdre mon compte'),
      gain: info('C’était trop tentant'),
      confiance: info('Ça venait de quelqu’un que je connais'),
      'petit-montant': info('C’était pas cher, pas grave'),
      autorite: info('Ça avait l’air officiel'),
      groupe: info('Les autres le font aussi'),
      reflexe: info('Je n’ai pas vraiment réfléchi'),
    },
    autre: { libelle: 'Autre chose / je ne sais pas', truc: 'Truc générique.', parade: 'Parade générique.' },
  }
}
export const leviersFixture = (): Leviers => leviersFileSchema.parse(rawLeviers())
```

`tests/unit/leviers-schema.test.ts` :
```ts
import { describe, expect, it } from 'vitest'
import { leviersFileSchema, missionSchema } from '@/content/schema'
import { rawLeviers, rawMission, rawScenario } from './fixtures'

const chemins = (raw: unknown) => {
  const res = missionSchema.safeParse(raw)
  return res.success ? [] : res.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`)
}

describe('leviers.yaml', () => {
  it('accepte les 8 leviers et « autre »', () => {
    expect(leviersFileSchema.safeParse(rawLeviers()).success).toBe(true)
  })
  it('exige tous les leviers', () => {
    const raw = rawLeviers()
    delete (raw.leviers as Record<string, unknown>).groupe
    expect(leviersFileSchema.safeParse(raw).success).toBe(false)
  })
  it('refuse un levier inconnu', () => {
    const raw = rawLeviers()
    ;(raw.leviers as Record<string, unknown>).flatterie = raw.leviers.gain
    expect(leviersFileSchema.safeParse(raw).success).toBe(false)
  })
})

describe('bloc pourquoi d’un scénario', () => {
  it('est accepté sur un scénario avec un choix risqué', () => {
    expect(chemins(rawMission())).toEqual([])
  })
  it('refuse un levier inconnu ou en double', () => {
    const sc = rawScenario()
    sc.pourquoi = [...sc.pourquoi.slice(0, 2), { levier: 'urgence', truc: 'T.', parade: 'P.' }]
    expect(chemins(rawMission({ etapes: [sc] }))).toContainEqual(expect.stringMatching(/^etapes\.0\.pourquoi\.2\.levier : levier en double : urgence/))
    const inconnu = rawScenario()
    inconnu.pourquoi[0]!.levier = 'flatterie'
    expect(chemins(rawMission({ etapes: [inconnu] }))).toContainEqual(expect.stringMatching(/^etapes\.0\.pourquoi\.0\.levier/))
  })
  it('exige 3 ou 4 leviers', () => {
    const sc = rawScenario()
    sc.pourquoi = sc.pourquoi.slice(0, 2)
    expect(chemins(rawMission({ etapes: [sc] }))).toContainEqual(expect.stringMatching(/^etapes\.0\.pourquoi/))
  })
  it('refuse un bloc pourquoi sans choix risqué', () => {
    const sc = rawScenario()
    sc.choix = sc.choix.filter((c) => c.qualite !== 'risque')
    delete (sc as { recuperation?: unknown }).recuperation
    expect(chemins(rawMission({ etapes: [sc] }))).toContainEqual(
      'etapes.0.pourquoi : le bloc pourquoi suppose un choix de qualité "risque"',
    )
  })
})
```

Dans `tests/unit/acces.test.ts`, ajouter `leviersFixture` à l'import depuis `./fixtures`, ajouter `leviers: leviersFixture(),` dans l'objet passé à `creerAcces`, et ce test :
```ts
  it('expose les leviers', () => {
    expect(acces.getLeviers().leviers.urgence.libelle).toBe('Il fallait faire vite')
  })
```

Dans `tests/unit/node/build-content.test.ts` :
- importer `rawLeviers` depuis `../fixtures` ;
- dans `dossier()`, après l'écriture de `themes.yaml`, ajouter `writeFileSync(join(racine, 'leviers.yaml'), stringify(rawLeviers()))` ;
- dans le test « liste themes.yaml et tous les YAML des missions », attendre `['themes.yaml', 'leviers.yaml', 'missions/a/m1.yaml', 'missions/b/m2.yml']` ;
- ajouter :
```ts
  it('exige leviers.yaml', () => {
    const racine = dossier({ 'phishing/m.yaml': stringify(rawMission()) })
    rmSync(join(racine, 'leviers.yaml'))
    expect(erreur(() => buildContent(racine)).message).toContain('leviers.yaml')
  })
  it('expose les leviers dans le bundle', () => {
    const racine = dossier({ 'phishing/m.yaml': stringify(rawMission()) })
    expect(buildContent(racine).leviers.autre.libelle).toBe('Autre chose / je ne sais pas')
  })
```
(ajouter `rmSync` à l'import de `node:fs`).

Dans `tests/unit/content-mock.ts`, ajouter `leviersFixture` à l'import et `leviers: leviersFixture(),` dans l'objet passé à `creerAcces`.

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/leviers-schema.test.ts tests/unit/acces.test.ts tests/unit/node/build-content.test.ts`
Expected : FAIL (`leviersFileSchema` n'existe pas, `getLeviers` n'existe pas, `leviers.yaml` non lu).

- [ ] **Step 3 : implémenter**

Dans `src/content/schema.ts`, juste après la définition de `const texte = …` :
```ts
export const LEVIERS = ['urgence', 'peur', 'gain', 'confiance', 'petit-montant', 'autorite', 'groupe', 'reflexe'] as const
export type LevierId = (typeof LEVIERS)[number]
export type ReponseLevier = LevierId | 'autre'

const levierInfoSchema = z.object({ libelle: texte, parade: texte, questionDebrief: texte })

/** content/leviers.yaml : les 8 leviers (tous obligatoires, aucun autre) et la réponse « Autre chose ». */
export const leviersFileSchema = z.object({
  leviers: z.record(z.enum(LEVIERS), levierInfoSchema),
  autre: z.object({ libelle: texte, truc: texte, parade: texte }),
})
export type Leviers = z.infer<typeof leviersFileSchema>

const pourquoiSchema = z.array(z.object({ levier: z.enum(LEVIERS), truc: texte, parade: texte })).min(3).max(4)
```
Dans `scenarioSchema`, ajouter le champ après `recuperation` :
```ts
    pourquoi: pourquoiSchema.optional(),
```
et à la fin de son `superRefine` :
```ts
    const leviersVus = new Set<string>()
    s.pourquoi?.forEach((p, i) => {
      if (leviersVus.has(p.levier)) {
        ctx.addIssue({ code: 'custom', path: ['pourquoi', i, 'levier'], message: `levier en double : ${p.levier}` })
      }
      leviersVus.add(p.levier)
    })
    if (s.pourquoi && !s.choix.some((c) => c.qualite === 'risque')) {
      ctx.addIssue({ code: 'custom', path: ['pourquoi'], message: 'le bloc pourquoi suppose un choix de qualité "risque"' })
    }
```
Dans `ContentBundle`, ajouter `leviers: Leviers`.

Dans `src/content/acces.ts`, ajouter dans l'objet renvoyé : `getLeviers: () => bundle.leviers,`.
Dans `src/content/index.ts`, ajouter `getLeviers` à la déstructuration exportée.

Dans `scripts/build-content.ts` :
- importer `leviersFileSchema` et `type Leviers` depuis `../src/content/schema` ;
- `listContentFiles` : `return [join(racine, 'themes.yaml'), join(racine, 'leviers.yaml'), ...(existsSync(missions) ? listerYaml(missions) : [])]` ;
- `buildContent` : `const [cheminThemes, cheminLeviers, ...cheminsMissions] = listContentFiles(racine)`, puis après la lecture des thèmes :
```ts
  let leviers: Leviers | null = null
  const lectureLeviers = lireYaml(racine, cheminLeviers!, issues)
  if (lectureLeviers.ok) {
    const res = leviersFileSchema.safeParse(lectureLeviers.data)
    if (res.success) leviers = res.data
    else issues.push(...zodIssues('leviers.yaml', res.error))
  }
```
  et le retour devient `return { generatedAt: maintenant.toISOString(), themes, leviers: leviers!, missions: missions.map((m) => m.mission) }` (le `throw` sur `issues` juste avant garantit que `leviers` est défini).

`content/leviers.yaml` :
```yaml
leviers:
  urgence:
    libelle: Il fallait faire vite
    parade: Plus on te presse, plus tu ralentis. Un vrai service te laisse toujours le temps de vérifier.
    questionDebrief: Pourquoi a-t-on envie de se dépêcher quand un message fixe un délai ?
  peur:
    libelle: J’avais peur de perdre mon compte ou d’avoir des problèmes
    parade: Quand un message te fait peur, c’est le moment d’en parler à quelqu’un, pas d’obéir.
    questionDebrief: Qu’est-ce qui fait peur dans ce message, et qui a intérêt à ce qu’on ait peur ?
  gain:
    libelle: C’était trop tentant
    parade: Si c’est trop beau pour être vrai, c’est que ce n’est pas vrai.
    questionDebrief: Pourquoi les arnaqueurs promettent-ils des cadeaux plutôt que de demander directement de l’argent ?
  confiance:
    libelle: Ça venait de quelqu’un que je connais
    parade: Un compte peut être piraté. Si un proche demande quelque chose d’inhabituel, vérifie avec lui en vrai.
    questionDebrief: Comment vérifier qu’un message d’ami vient vraiment de lui ?
  petit-montant:
    libelle: C’était pas cher, pas grave
    parade: Le petit montant est un appât. Ce qu’on veut, c’est ta carte ou ton compte.
    questionDebrief: Pourquoi un arnaqueur demanderait-il seulement quelques euros ?
  autorite:
    libelle: Ça avait l’air officiel
    parade: Un logo ou un nom officiel se copie en deux secondes. Passe toi-même par l’appli ou le site officiel.
    questionDebrief: Qu’est-ce qui donne l’air « officiel » à un message, et est-ce facile à copier ?
  groupe:
    libelle: Les autres le font aussi
    parade: Que beaucoup de gens le fassent ne prouve rien. Les arnaques circulent justement de groupe en groupe.
    questionDebrief: Est-ce que « tout le monde le fait » rend une chose plus sûre ?
  reflexe:
    libelle: Je n’ai pas vraiment réfléchi
    parade: Avant de cliquer, payer ou donner un code, prends trois secondes pour te demander qui t’écrit vraiment.
    questionDebrief: Dans quelles situations est-ce qu’on clique sans réfléchir ?
autre:
  libelle: Autre chose / je ne sais pas
  truc: Les arnaqueurs mélangent souvent plusieurs pièges pour qu’on agisse sans réfléchir.
  parade: Au moindre doute, fais une pause et demande à quelqu’un de confiance avant d’agir.
```

- [ ] **Step 4 : lancer les tests, les types et le build**

Run : `npx vitest run && npm run typecheck && npm run lint && npx vite build`
Expected : tous PASS ; build OK (les missions réelles n'ont pas encore de bloc `pourquoi`, c'est permis à ce stade).

- [ ] **Step 5 : commit**

```bash
git add content/leviers.yaml src/content scripts tests/unit
git commit -m "feat(contenu): leviers de manipulation et bloc « pourquoi » des scénarios"
```

---

### Task 2 : phase « pourquoi » dans le moteur

**Files :**
- Modify : `src/engine/mission-runner.ts`, `src/engine/badges.ts`, `tests/unit/mission-runner.test.ts`, `tests/unit/badges.test.ts`

**Interfaces :**
- Consumes : `LevierId`, `ReponseLevier`, `Scenario['pourquoi']` (tâche 1) ; fixture `rawScenario` avec `pourquoi` (leviers `urgence`, `petit-montant`, `reflexe`).
- Produces : `PhaseScenario` inclut `'pourquoi'` ; `RunEvent` inclut `{ type: 'expliquer'; levier: ReponseLevier }` ; `ScenarioResultat.levier: ReponseLevier | null` ; `leviersDuRun(mission: Mission, etat: RunState): ReponseLevier[]` (ordre des scénarios, sans doublon) ; `leviersDeLaMission(mission: Mission): LevierId[]` (leviers présents dans les blocs `pourquoi`, ordre d'apparition, sans doublon).

- [ ] **Step 1 : adapter et écrire les tests (qui doivent échouer)**

Dans `tests/unit/mission-runner.test.ts` :
- ajouter `leviersDeLaMission`, `leviersDuRun` à l'import depuis `@/engine/mission-runner`, et `type Scenario` à l'import depuis `@/content/schema` ;
- dans le test « enchaîne choix → indices → conséquence… », ajouter `levier: null,` dans l'objet attendu de `etat.resultats['sc-1']` (après `indicesFaux`) ;
- remplacer le test « impose la récupération après un choix risqué qui la prévoit » par :
```ts
  it('après un choix risqué, demande pourquoi puis impose la récupération', () => {
    const apresChoix = jouer(m, { type: 'choisir', choixId: 'clic' })
    expect(apresChoix.phase).toBe('pourquoi')
    const etat = reduire(m, apresChoix, { type: 'expliquer', levier: 'urgence' })
    expect(etat.phase).toBe('consequence')
    expect(etat.resultats['sc-1']).toMatchObject({ qualite: 'risque', levier: 'urgence', indicesChoisis: [], indicesJustes: 0 })
    const recup = reduire(m, etat, { type: 'continuer' })
    expect(recup.phase).toBe('recuperation')
    expect(recup.resultats['sc-1']).toMatchObject({ recuperationFaite: false })
    const suite = reduire(m, recup, { type: 'recuperation-faite' })
    expect(suite.index).toBe(1)
    expect(suite.resultats['sc-1']).toMatchObject({ recuperationFaite: true, levier: 'urgence' })
  })

  it('accepte « autre » et refuse un levier absent du scénario', () => {
    const apresChoix = jouer(m, { type: 'choisir', choixId: 'clic' })
    expect(reduire(m, apresChoix, { type: 'expliquer', levier: 'autre' }).resultats['sc-1']).toMatchObject({ levier: 'autre' })
    expect(() => reduire(m, apresChoix, { type: 'expliquer', levier: 'groupe' })).toThrow('levier inconnu : groupe')
  })

  it('refuse les événements hors phase autour de « pourquoi »', () => {
    const apresChoix = jouer(m, { type: 'choisir', choixId: 'clic' })
    expect(() => reduire(m, apresChoix, { type: 'valider-indices', indices: [] })).toThrow(RunError)
    const indices = jouer(m, { type: 'choisir', choixId: 'verif' })
    expect(() => reduire(m, indices, { type: 'expliquer', levier: 'urgence' })).toThrow(RunError)
  })

  it('sans bloc pourquoi, un choix risqué passe par les indices', () => {
    const sc = { ...(m.etapes[0] as Scenario) }
    delete sc.pourquoi
    const sansPourquoi = { ...m, etapes: [sc, ...m.etapes.slice(1)] }
    expect(jouer(sansPourquoi, { type: 'choisir', choixId: 'clic' }).phase).toBe('indices')
  })

  it('permet de passer un scénario pendant « pourquoi »', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'clic' }, { type: 'passer' })
    expect(etat.index).toBe(1)
    expect(etat.resultats['sc-1']).toMatchObject({ passe: true, levier: null })
  })
```
- remplacer le test « permet de rejouer un scénario depuis la conséquence » par :
```ts
  it('rejouer après le chemin risqué revient à la situation, puis un bon choix mène aux indices', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'reflexe' },
      { type: 'rejouer' },
    )
    expect(etat).toMatchObject({ index: 0, phase: 'situation', choixId: null, resultats: {} })
    expect(reduire(m, etat, { type: 'choisir', choixId: 'verif' }).phase).toBe('indices')
  })
```
- ajouter :
```ts
  it('liste les leviers du run et ceux de la mission', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'clic' }, { type: 'expliquer', levier: 'urgence' })
    expect(leviersDuRun(m, etat)).toEqual(['urgence'])
    expect(leviersDuRun(m, jouer(m, { type: 'choisir', choixId: 'aide' }, { type: 'valider-indices', indices: [] }))).toEqual([])
    expect(leviersDeLaMission(m)).toEqual(['urgence', 'petit-montant', 'reflexe'])
  })
```

Dans `tests/unit/badges.test.ts`, remplacer, dans le test « récompense la réparation après un choix risqué », l'événement `{ type: 'valider-indices', indices: ['montant'] }` par `{ type: 'expliquer', levier: 'urgence' }`, et ajouter :
```ts
  it('« Œil de lynx » ne compte que les scénarios où l’on a désigné des indices', () => {
    const deux = missionFixture({
      etapes: [rawScenario('sc-1'), rawScenario('sc-2'), { type: 'minijeu', id: 'mj-1', jeu: 'tri', config: rawTri() }],
    })
    const etat = jouer(
      deux,
      { type: 'choisir', choixId: 'verif' },
      { type: 'valider-indices', indices: ['url'] },
      { type: 'continuer' },
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'urgence' },
      { type: 'continuer' },
      { type: 'recuperation-faite' },
      finTri,
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'oeil-de-lynx', 'reparateur'])
  })
```
(ajouter `rawScenario`, `rawTri` à l'import depuis `./fixtures`).

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/mission-runner.test.ts tests/unit/badges.test.ts`
Expected : FAIL (phase `pourquoi` inexistante, `expliquer` inconnu, `leviersDuRun` inexistant).

- [ ] **Step 3 : implémenter**

Dans `src/engine/mission-runner.ts` :
- import : `import type { Etape, FilAction, LevierId, Mission, Qualite, ReponseLevier } from '@/content/schema'` ;
- `export type PhaseScenario = 'situation' | 'pourquoi' | 'indices' | 'consequence' | 'recuperation'` ;
- `ScenarioResultat` : ajouter `levier: ReponseLevier | null` après `indicesFaux` ;
- `RunEvent` : ajouter `| { type: 'expliquer'; levier: ReponseLevier }` ;
- `case 'choisir'` devient :
```ts
    case 'choisir': {
      if (etape.type !== 'scenario' || etat.phase !== 'situation') return refuser()
      const choix = etape.choix.find((c) => c.id === evenement.choixId)
      if (!choix) throw new RunError(`choix inconnu : ${evenement.choixId}`)
      const phase: PhaseScenario = choix.qualite === 'risque' && etape.pourquoi ? 'pourquoi' : 'indices'
      return { ...etat, phase, choixId: choix.id }
    }
    case 'expliquer': {
      if (etape.type !== 'scenario' || etat.phase !== 'pourquoi') return refuser()
      const choix = etape.choix.find((c) => c.id === etat.choixId)
      if (!choix) return refuser()
      if (evenement.levier !== 'autre' && !etape.pourquoi?.some((p) => p.levier === evenement.levier)) {
        throw new RunError(`levier inconnu : ${evenement.levier}`)
      }
      const resultat: ScenarioResultat = {
        type: 'scenario',
        choixId: choix.id,
        qualite: choix.qualite,
        indicesChoisis: [],
        indicesJustes: 0,
        indicesFaux: 0,
        levier: evenement.levier,
        recuperationFaite: null,
        passe: false,
      }
      return { ...etat, phase: 'consequence', resultats: { ...etat.resultats, [etape.id]: resultat } }
    }
```
- dans `case 'valider-indices'` et `case 'passer'`, ajouter `levier: null,` dans l'objet `resultat` (après `indicesFaux`) ;
- à la fin du fichier :
```ts
/** Leviers choisis pendant la mission, dans l'ordre des scénarios, sans doublon. */
export function leviersDuRun(mission: Mission, etat: RunState): ReponseLevier[] {
  const leviers: ReponseLevier[] = []
  for (const e of mission.etapes) {
    if (e.type !== 'scenario') continue
    const r = etat.resultats[e.id]
    if (r?.type === 'scenario' && r.levier && !leviers.includes(r.levier)) leviers.push(r.levier)
  }
  return leviers
}

/** Leviers travaillés par la mission (blocs « pourquoi »), dans l'ordre d'apparition, sans doublon. */
export function leviersDeLaMission(mission: Mission): LevierId[] {
  const leviers: LevierId[] = []
  for (const e of mission.etapes) {
    if (e.type !== 'scenario') continue
    for (const p of e.pourquoi ?? []) if (!leviers.includes(p.levier)) leviers.push(p.levier)
  }
  return leviers
}
```

Dans `src/engine/badges.ts`, remplacer la ligne du badge `oeil-de-lynx` par :
```ts
  const avecIndices = scenarios.filter((r) => r.qualite !== 'risque')
  if (avecIndices.length && avecIndices.every((r) => r.indicesJustes > 0 && r.indicesFaux === 0)) badges.push('oeil-de-lynx')
```

- [ ] **Step 4 : lancer tous les tests**

Run : `npx vitest run && npm run typecheck`
Expected : tous PASS. Si un test d'interface existant construit un `ScenarioResultat` sans `levier` (erreur de type), ajouter `levier: null` à cet objet.

- [ ] **Step 5 : commit**

```bash
git add src/engine tests/unit
git commit -m "feat(moteur): phase « pourquoi » après un choix risqué et leviers du run"
```

---

### Task 3 : étape « pourquoi » et encadré de conséquence

**Files :**
- Create : `src/mission/PourquoiForm.vue`
- Modify : `src/mission/ScenarioStep.vue`, `src/mission/ConsequencePanel.vue`, `src/pages/MissionPage.vue` (passer `leviers` à `ScenarioStep`), `tests/unit/scenario-step.test.ts`
- Test : `tests/unit/pourquoi-form.test.ts`

**Interfaces :**
- Consumes : `Leviers`, `ReponseLevier`, `Scenario['pourquoi']` (tâche 1) ; phase `pourquoi`, événement `expliquer`, `ScenarioResultat.levier` (tâche 2) ; `ordreAffichage` (existant) ; `getLeviers` de `@/content` (tâche 1).
- Produces : `PourquoiForm` (props `pourquoi`, `leviers`, `graine`, `mode` ; emit `expliquer: [ReponseLevier]` ; boutons `data-levier="<id>"`) ; `ScenarioStep` a une prop obligatoire `leviers: Leviers` ; `ConsequencePanel` a une prop obligatoire `leviers: Leviers` et affiche « Ce qui a marché sur toi » quand `resultat.levier` est défini.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

`tests/unit/pourquoi-form.test.ts` :
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import PourquoiForm from '@/mission/PourquoiForm.vue'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { leviersFixture, missionFixture } from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

const scenario = () => missionFixture().etapes[0] as Scenario
const monter = (mode: 'solo' | 'binome' | 'classe' = 'solo') =>
  mount(PourquoiForm, { props: { pourquoi: scenario().pourquoi!, leviers: leviersFixture(), graine: 'sc-1', mode } })

describe('PourquoiForm', () => {
  it('propose les leviers du scénario puis « Autre chose » en dernier', () => {
    const w = monter()
    const boutons = w.findAll('[data-levier]')
    expect(boutons.map((b) => b.attributes('data-levier')).sort()).toEqual(['autre', 'petit-montant', 'reflexe', 'urgence'])
    expect(boutons.at(-1)!.attributes('data-levier')).toBe('autre')
    expect(w.text()).toContain('Beaucoup de gens auraient fait pareil.')
    expect(w.text()).toContain('Il fallait faire vite')
  })

  it('solo : un clic envoie la raison', async () => {
    const w = monter()
    await w.find('[data-levier="urgence"]').trigger('click')
    expect(w.emitted('expliquer')).toEqual([['urgence']])
  })

  it('binôme : invite à en discuter', () => {
    expect(monter('binome').text()).toContain('Discutez à deux')
  })

  it('classe : un clic sélectionne, l’adulte valide', async () => {
    const w = monter('classe')
    await w.find('[data-levier="reflexe"]').trigger('click')
    expect(w.emitted('expliquer')).toBeUndefined()
    expect(w.find('[data-levier="reflexe"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider la raison de la classe')
    expect(w.emitted('expliquer')).toEqual([['reflexe']])
  })
})

describe('ScenarioStep et « pourquoi »', () => {
  const monterEtape = (props: Record<string, unknown>) =>
    mount(ScenarioStep, {
      props: { scenario: scenario(), phase: 'pourquoi', mode: 'solo', sensible: false, leviers: leviersFixture(), ...props },
    })

  it('affiche la question « pourquoi » et émet expliquer', async () => {
    const w = monterEtape({})
    expect(w.find('h2').text()).toBe('Qu’est-ce qui t’a donné envie de le faire ?')
    await w.find('[data-levier="petit-montant"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'expliquer', levier: 'petit-montant' }]])
  })

  it('la conséquence répond à la raison choisie', () => {
    const w = monterEtape({
      phase: 'consequence',
      resultat: {
        type: 'scenario', choixId: 'clic', qualite: 'risque', indicesChoisis: [], indicesJustes: 0, indicesFaux: 0,
        levier: 'urgence', recuperationFaite: null, passe: false,
      },
    })
    expect(w.text()).toContain('Ce qui a marché sur toi')
    expect(w.text()).toContain('Tu as répondu : « Il fallait faire vite »')
    expect(w.text()).toContain('Le délai de 24 h est là exprès.')
    expect(w.text()).toContain('Ta parade : Plus on te presse, plus tu ralentis.')
    expect(w.text()).not.toContain('tu l’avais coché')
  })

  it('« Autre chose » reçoit la réponse générique', () => {
    const w = monterEtape({
      phase: 'consequence',
      resultat: {
        type: 'scenario', choixId: 'clic', qualite: 'risque', indicesChoisis: [], indicesJustes: 0, indicesFaux: 0,
        levier: 'autre', recuperationFaite: null, passe: false,
      },
    })
    expect(w.text()).toContain('Tu as répondu : « Autre chose / je ne sais pas »')
    expect(w.text()).toContain('Truc générique.')
  })
})
```

Dans `tests/unit/scenario-step.test.ts` :
- ajouter `leviersFixture` à l'import depuis `./fixtures` ;
- dans `monter`, ajouter `leviers: leviersFixture(),` aux props par défaut ;
- `resultatClic` devient un résultat de bon choix avec indices, pour garder le test « tu l’avais coché » : remplacer son contenu par `{ type: 'scenario', choixId: 'verif', qualite: 'bon', indicesChoisis: ['url'], indicesJustes: 1, indicesFaux: 0, levier: null, recuperationFaite: null, passe: false }` ; dans le test « conséquence : verdict, indices… », remplacer les attentes `'C’était risqué'` et `'La carte est volée.'` par `'Bon réflexe !'` et `'Aucun colis en attente.'` ; dans le test « lecture simplifiée… », remplacer l'attente `'On vole la carte.'` par `'Ne paie jamais un colis par SMS.'` (seule attente conservée avec « Continuer ») ; le test « récupération » reste valable (il ne dépend que de la phase).

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/pourquoi-form.test.ts tests/unit/scenario-step.test.ts`
Expected : FAIL (`PourquoiForm.vue` introuvable, prop `leviers` inconnue).

- [ ] **Step 3 : implémenter**

`src/mission/PourquoiForm.vue` :
```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Leviers, ReponseLevier, Scenario } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'

const props = defineProps<{ pourquoi: NonNullable<Scenario['pourquoi']>; leviers: Leviers; graine: string; mode: Mode }>()
const emit = defineEmits<{ expliquer: [levier: ReponseLevier] }>()
const selection = ref<ReponseLevier | null>(null)

const options = computed<{ id: ReponseLevier; libelle: string }[]>(() => [
  ...ordreAffichage(
    props.pourquoi.map((p) => ({ id: p.levier })),
    `${props.graine}:pourquoi`,
  ).map((o) => ({ id: o.id, libelle: props.leviers.leviers[o.id].libelle })),
  { id: 'autre', libelle: props.leviers.autre.libelle },
])

function cliquer(id: ReponseLevier) {
  if (props.mode === 'classe') selection.value = id
  else emit('expliquer', id)
}
function validerClasse() {
  if (selection.value) emit('expliquer', selection.value)
}
</script>

<template>
  <div class="pourquoi">
    <p class="accroche">Beaucoup de gens auraient fait pareil. Choisis ce qui te ressemble le plus.</p>
    <p v-if="mode === 'binome'" class="consigne-mode">
      <span aria-hidden="true">💬</span> Discutez à deux : qu’est-ce qui vous a donné envie ?
    </p>
    <p v-if="mode === 'classe'" class="consigne-mode">
      <span aria-hidden="true">✋</span> Votez à main levée, puis l’adulte valide la raison de la classe.
    </p>
    <ul class="liste-raisons">
      <li v-for="o in options" :key="o.id">
        <button
          type="button"
          class="btn raison-btn"
          :data-levier="o.id"
          :aria-pressed="mode === 'classe' ? selection === o.id : undefined"
          @click="cliquer(o.id)"
        >
          {{ o.libelle }}
        </button>
      </li>
    </ul>
    <button v-if="mode === 'classe'" type="button" class="btn btn-primaire" :disabled="!selection" @click="validerClasse">
      Valider la raison de la classe
    </button>
  </div>
</template>

<style scoped>
.accroche { color: var(--texte-doux); }
.liste-raisons { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.raison-btn { width: 100%; text-align: left; justify-content: flex-start; }
.raison-btn[aria-pressed='true'] { background: var(--primaire); color: var(--primaire-texte); }
.consigne-mode { font-weight: 700; }
</style>
```

`src/mission/ScenarioStep.vue` :
- imports : ajouter `type Leviers` à l'import depuis `@/content/schema` et `import PourquoiForm from './PourquoiForm.vue'` ;
- props : ajouter `leviers: Leviers` ;
- `TITRES` : ajouter `pourquoi: 'Qu’est-ce qui t’a donné envie de le faire ?',` ;
- template, juste après `<ChoixList … />` :
```vue
        <PourquoiForm
          v-else-if="phase === 'pourquoi' && scenario.pourquoi"
          :pourquoi="scenario.pourquoi"
          :leviers="leviers"
          :graine="scenario.id"
          :mode="mode"
          @expliquer="(levier) => emit('evenement', { type: 'expliquer', levier })"
        />
```
- sur `<ConsequencePanel …>`, ajouter `:leviers="leviers"`.

`src/mission/ConsequencePanel.vue` :
- props : `defineProps<{ scenario: Scenario; resultat: ScenarioResultat; leviers: Leviers }>()` (importer `type Leviers`) ;
- ajouter :
```ts
const reponse = computed(() => {
  const levier = props.resultat.levier
  if (!levier) return null
  if (levier === 'autre') return { libelle: props.leviers.autre.libelle, truc: props.leviers.autre.truc, parade: props.leviers.autre.parade }
  const p = props.scenario.pourquoi?.find((x) => x.levier === levier)
  return p ? { libelle: props.leviers.leviers[levier].libelle, truc: p.truc, parade: p.parade } : null
})
```
- template, juste après `<p>{{ t(choix.consequence, choix.consequenceSimple) }}</p>` :
```vue
    <div v-if="reponse" class="ce-qui-a-marche" role="note">
      <h3>Ce qui a marché sur toi</h3>
      <p>Tu as répondu : « {{ reponse.libelle }} »</p>
      <p>{{ reponse.truc }}</p>
      <p><strong>Ta parade :</strong> {{ reponse.parade }}</p>
    </div>
```
- style : `.ce-qui-a-marche { background: #fff8e6; border-left: 6px solid var(--aide); padding: 0.5rem 1rem; border-radius: var(--rayon); }`.

`src/pages/MissionPage.vue` : importer `getLeviers` depuis `@/content`, déclarer `const leviers = getLeviers()` et ajouter `:leviers="leviers"` sur `<ScenarioStep …>`.

- [ ] **Step 4 : lancer tous les tests, types et lint**

Run : `npx vitest run && npm run typecheck && npm run lint`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add src/mission src/pages/MissionPage.vue tests/unit
git commit -m "feat(mission): étape « pourquoi » et réponse selon la raison choisie"
```

---

### Task 4 : « Ce qui t'a fait craquer » en fin de mission

**Files :**
- Modify : `src/mission/FinMission.vue`, `src/pages/MissionPage.vue` (passer `leviers` à `FinMission`), `tests/unit/mission-page.test.ts`

**Interfaces :**
- Consumes : `leviersDuRun`, `leviersDeLaMission` (tâche 2) ; `Leviers`, `getLeviers` (tâche 1) ; `PourquoiForm` (tâche 3, `data-levier`).
- Produces : `FinMission` a une prop obligatoire `leviers: Leviers` ; section `.craquer` titrée « Ce qui t’a fait craquer ».

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

Dans `tests/unit/mission-page.test.ts`, ajouter :
```ts
  it('chemin risqué : pourquoi, réponse, récupération, puis « Ce qui t’a fait craquer »', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="clic"]').trigger('click')
    expect(w.find('h2').text()).toBe('Qu’est-ce qui t’a donné envie de le faire ?')
    await w.find('[data-levier="urgence"]').trigger('click')
    expect(w.text()).toContain('Ce qui a marché sur toi')
    await cliquer(w, 'Continuer')
    await cliquer(w, 'Menu du contact')
    await cliquer(w, 'Bloquer')
    await w.find('input[value="Faux compte"]').setValue()
    await cliquer(w, 'Envoyer le signalement')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    const bloc = w.find('.craquer')
    expect(bloc.text()).toContain('Ce qui t’a fait craquer')
    expect(bloc.text()).toContain('Il fallait faire vite')
    expect(bloc.text()).toContain('Parade Il fallait faire vite.')
  })

  it('ignore le double clic sur une raison', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="clic"]').trigger('click')
    const raison = w.find('[data-levier="reflexe"]')
    void raison.trigger('click')
    await raison.trigger('click')
    expect(erreurs).toEqual([])
    expect(w.text()).toContain('Ce qui a marché sur toi')
  })

  it('sans piège : rappelle les leviers à surveiller', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    const bloc = w.find('.craquer')
    expect(bloc.text()).toContain('Aucun piège n’a marché sur toi cette fois.')
    expect(bloc.text()).toContain('C’était pas cher, pas grave')
  })

  it('mission sans bloc pourquoi : pas de bloc « Ce qui t’a fait craquer »', async () => {
    const w = await monter('r-test')
    for (const n of ['n1', 'n2', 'n3']) await w.find(`input[name="notif-${n}"][value="ignorer"]`).setValue()
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('Mission terminée !')
    expect(w.find('.craquer').exists()).toBe(false)
  })
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/mission-page.test.ts`
Expected : FAIL (pas de `.craquer`).

- [ ] **Step 3 : implémenter**

`src/mission/FinMission.vue` :
- imports : `import type { Leviers, Mission, Scenario } from '@/content/schema'` et `import { leviersDeLaMission, leviersDuRun, type RunState, type SurpriseResultat } from '@/engine/mission-runner'` ;
- props : `defineProps<{ mission: Mission; etat: RunState; leviers: Leviers }>()` ;
- ajouter :
```ts
const leviersChoisis = computed(() =>
  leviersDuRun(props.mission, props.etat).map((id) =>
    id === 'autre'
      ? { id, libelle: props.leviers.autre.libelle, parade: props.leviers.autre.parade }
      : { id, libelle: props.leviers.leviers[id].libelle, parade: props.leviers.leviers[id].parade },
  ),
)
const aSurveiller = computed(() => leviersDeLaMission(props.mission).map((id) => props.leviers.leviers[id].libelle))
```
- template, juste après la liste des badges (`</ul>` de `.badges`) :
```vue
    <section v-if="leviersChoisis.length || aSurveiller.length" class="carte craquer">
      <h3>Ce qui t’a fait craquer</h3>
      <ul v-if="leviersChoisis.length">
        <li v-for="l in leviersChoisis" :key="l.id"><strong>{{ l.libelle }}</strong> : {{ l.parade }}</li>
      </ul>
      <template v-else>
        <p>Aucun piège n’a marché sur toi cette fois. Les leviers à surveiller :</p>
        <ul>
          <li v-for="l in aSurveiller" :key="l">{{ l }}</li>
        </ul>
      </template>
    </section>
```
- style : `.craquer { margin: 1rem 0; border-left: 6px solid var(--aide); }`.

`src/pages/MissionPage.vue` : ajouter `:leviers="leviers"` sur `<FinMission …>`.

- [ ] **Step 4 : lancer tous les tests, types et lint**

Run : `npx vitest run && npm run typecheck && npm run lint`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add src/mission/FinMission.vue src/pages/MissionPage.vue tests/unit/mission-page.test.ts
git commit -m "feat(mission): récapitulatif « Ce qui t’a fait craquer » en fin de mission"
```

---

### Task 5 : leviers dans la fiche enseignant et la version papier

**Files :**
- Modify : `src/pages/FicheMissionPage.vue`, `src/pages/PlanBPage.vue`, `tests/unit/enseignants.test.ts`

**Interfaces :**
- Consumes : `getLeviers` (tâche 1) ; `ordreAffichage` (existant) ; bloc `pourquoi` des scénarios.
- Produces : fiche : section « Leviers travaillés » ; version papier : « Si tu as choisi le piège, pourquoi ? » et corrigé des leviers.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

Dans `tests/unit/enseignants.test.ts`, ajouter dans le `describe('FicheMissionPage')` :
```ts
  it('liste les leviers travaillés avec leur question de débrief', async () => {
    const w = await monter(FicheMissionPage, '/enseignants/m-test')
    expect(w.text()).toContain('Leviers travaillés')
    expect(w.text()).toContain('Il fallait faire vite : Question Il fallait faire vite ?')
  })
```
et dans le `describe('PlanBPage')` :
```ts
  it('ajoute la question « pourquoi » et son corrigé', async () => {
    const w = await monter(PlanBPage, '/enseignants/m-test/plan-b')
    expect(w.text()).toContain('Si tu as choisi le piège, pourquoi ?')
    expect(w.text()).toContain('☐ Il fallait faire vite')
    expect(w.text()).toContain('☐ Autre chose / je ne sais pas')
    expect(w.text()).toContain('Le délai de 24 h est là exprès.')
  })
```

- [ ] **Step 2 : lancer les tests pour vérifier qu'ils échouent**

Run : `npx vitest run tests/unit/enseignants.test.ts`
Expected : FAIL.

- [ ] **Step 3 : implémenter**

`src/pages/FicheMissionPage.vue` :
- import : `import { getLeviers, getMission, getTheme } from '@/content'` ;
- script :
```ts
const leviers = getLeviers()
const scenariosAvecLeviers = (mission?.etapes ?? []).flatMap((e, i) =>
  e.type === 'scenario' && e.pourquoi ? [{ id: e.id, numero: i + 1, question: e.question, pourquoi: e.pourquoi }] : [],
)
```
- template, juste avant `<template v-if="mission.fiche.siRevelation">` :
```vue
      <template v-if="scenariosAvecLeviers.length">
        <h2>Leviers travaillés</h2>
        <section v-for="s in scenariosAvecLeviers" :key="s.id">
          <h3>Situation {{ s.numero }} : {{ s.question }}</h3>
          <ul>
            <li v-for="p in s.pourquoi" :key="p.levier">
              <strong>{{ leviers.leviers[p.levier].libelle }}</strong> : {{ leviers.leviers[p.levier].questionDebrief }}
            </li>
          </ul>
        </section>
      </template>
```

`src/pages/PlanBPage.vue` :
- import : `import { getLeviers, getMission } from '@/content'` ; script : `const leviers = getLeviers()` ;
- template, dans le bloc `v-if="e.type === 'scenario'"` de l'énoncé, juste après la liste des indices :
```vue
          <template v-if="e.pourquoi">
            <p>Si tu as choisi le piège, pourquoi ?</p>
            <ul class="cases">
              <li v-for="p in ordreAffichage(e.pourquoi.map((x) => ({ id: x.levier })), `${e.id}:pourquoi`)" :key="p.id">
                ☐ {{ leviers.leviers[p.id].libelle }}
              </li>
              <li>☐ {{ leviers.autre.libelle }}</li>
            </ul>
          </template>
```
- dans le corrigé, bloc scénario, juste après `<p>À retenir : {{ e.aRetenir }}</p>` :
```vue
            <template v-if="e.pourquoi">
              <p>Si l’élève a choisi le piège :</p>
              <ul>
                <li v-for="p in e.pourquoi" :key="p.levier">
                  <strong>{{ leviers.leviers[p.levier].libelle }}</strong> : {{ p.truc }} Parade : {{ p.parade }}
                </li>
              </ul>
            </template>
```

- [ ] **Step 4 : lancer tous les tests, types et lint**

Run : `npx vitest run && npm run typecheck && npm run lint`
Expected : tous PASS.

- [ ] **Step 5 : commit**

```bash
git add src/pages tests/unit/enseignants.test.ts
git commit -m "feat(enseignants): leviers travaillés dans la fiche et la version papier"
```

---

## Règles de réécriture du contenu (tâches 6 à 8)

Pour **chaque scénario** du fichier :
1. **Réécrire le texte du choix `risque`** (garder son `id` et sa `qualite`) comme la **pensée réelle** d'un ado de la tranche, avec sa justification intérieure, pour qu'il tente vraiment. Exemples de ton : « C’est Maxime, il est dans ma classe : je lui fais confiance et je mets mon mot de passe. » ; « 1,99 €, c’est rien, et si c’est le colis de maman ça serait bête de le perdre : je paie. » Jamais d'ironie ni d'évidence (« je clique sur le lien douteux »). Adapter si besoin la `consequence` pour qu'elle suive le nouveau texte.
2. **Ajouter un bloc `pourquoi`** de 3 ou 4 leviers **plausibles dans cette situation**, pris dans : `urgence`, `peur`, `gain`, `confiance`, `petit-montant`, `autorite`, `groupe`, `reflexe` (sans doublon). Chaque entrée :
   - `truc` : comment l'arnaqueur a joué sur ce levier **dans cette situation précise**, en citant un élément visible à l'écran (le délai, le nom de l'ami, le montant, le logo…) ;
   - `parade` : un geste concret et faisable par un élève de cet âge la prochaine fois.
   Les leviers proposés doivent inclure celui sur lequel repose la justification du nouveau texte du choix risqué.
3. Règles de l'étape 1 inchangées : tutoiement, jamais culpabilisant ; U+2019 ; marques et numéros fictifs ; **6e : 20 mots maximum par phrase** dans le texte du choix, `truc` et `parade` ; vérifier la cohérence avec les `indices`, `explicationIndices`, `aRetenir` et la `recuperation` (dont `siChoix`, qui cite l'id du choix risqué : l'id ne change pas).
4. **Ne pas changer** les ids de choix, les ids de scénario, les titres, la structure ; le reste du texte seulement si la cohérence l'exige.
5. Relecture du ton à la fin (comme un élève de l'âge visé, puis comme un enseignant), avec la liste des changements dans le rapport.

Le bloc `pourquoi` se place après `recuperation` dans chaque scénario, par exemple :
```yaml
    recuperation: { action: demander-aide, siChoix: [clic] }
    pourquoi:
      - levier: urgence
        truc: 'Le SMS dit « sous 24 h ». Ce délai est là pour que tu paies sans vérifier.'
        parade: 'Un vrai transporteur te laisse le temps. Ouvre toi-même son appli avant de payer.'
      - levier: petit-montant
        truc: '1,99 €, ça paraît rien. Mais le faux site veut surtout les numéros de la carte.'
        parade: 'Ne tape jamais une carte sur un site reçu par SMS, même pour 1 €.'
      - levier: reflexe
        truc: 'Le message ressemble aux vrais SMS de livraison qu’on reçoit souvent.'
        parade: 'Avant de cliquer, demande-toi : est-ce que j’attends vraiment un colis ?'
```

### Task 6 : contenu Phishing (9 scénarios)

**Files :**
- Modify : `content/missions/phishing/p-6e-colis.yaml`, `content/missions/phishing/p-college-ami-pirate.yaml`, `content/missions/phishing/p-lycee-offre-emploi.yaml`

**Interfaces :**
- Consumes : schéma `pourquoi` (tâche 1).
- Produces : les 9 scénarios Phishing ont un bloc `pourquoi` et un choix risqué réécrit. **Les tests E2E dépendent de `p-6e-colis`** : ids `clic` (scénario `sms-colis`, récupération `demander-aide`) et `donne` (scénario `concours-streamtube`) inchangés.

Scénarios et choix risqués actuels :
- `p-6e-colis` : `sms-colis` / `clic` ; `concours-streamtube` / `donne` ; `mail-gamebox` / `clique`
- `p-college-ami-pirate` : `code-ami` / `renvoie` ; `faux-ent` / `connecte` ; `vote-concours` / `vote`
- `p-lycee-offre-emploi` : `job-likes` / `inscrit` ; `logement` / `vire` ; `banque-perso` / `valide`

- [ ] **Step 1 : appliquer les règles de réécriture** aux 9 scénarios (voir la section ci-dessus).
- [ ] **Step 2 : vérifier** : `npx vitest run && npx vite build` → tous PASS, build OK.
- [ ] **Step 3 : relecture du ton**, puis relancer `npx vitest run tests/unit/node/content-real.test.ts`.
- [ ] **Step 4 : commit**
```bash
git add content/missions/phishing
git commit -m "content(phishing): choix risqués réalistes et leviers « pourquoi »"
```

### Task 7 : contenu Jeux vidéo et achats (9 scénarios)

**Files :**
- Modify : `content/missions/jeux-achats/j-6e-generateur.yaml`, `content/missions/jeux-achats/j-college-faux-modo.yaml`, `content/missions/jeux-achats/j-lycee-vestiaire.yaml`

**Interfaces :**
- Consumes : schéma `pourquoi` (tâche 1).
- Produces : les 9 scénarios Jeux et achats ont un bloc `pourquoi` et un choix risqué réécrit.

Scénarios et choix risqués actuels :
- `j-6e-generateur` : `generateur` / `genere` ; `echange-objet` / `donne-premier` ; `copain-mdp` / `partage`
- `j-college-faux-modo` : `signale-erreur` / `donne-code` ; `teste-jeu` / `lance` ; `mod-gratuit` / `desactive`
- `j-lycee-vestiaire` : `qr-paiement` / `scanne` ; `console-virement` / `vire` ; `cartes-cadeaux` / `paie`

- [ ] **Step 1 : appliquer les règles de réécriture** aux 9 scénarios.
- [ ] **Step 2 : vérifier** : `npx vitest run && npx vite build` → tous PASS, build OK.
- [ ] **Step 3 : relecture du ton**, puis relancer `npx vitest run tests/unit/node/content-real.test.ts`.
- [ ] **Step 4 : commit**
```bash
git add content/missions/jeux-achats
git commit -m "content(jeux-achats): choix risqués réalistes et leviers « pourquoi »"
```

### Task 8 : contenu Rappels (3 scénarios)

**Files :**
- Modify : `content/missions/rappel/r-6e.yaml`, `content/missions/rappel/r-college.yaml`, `content/missions/rappel/r-lycee.yaml`

**Interfaces :**
- Consumes : schéma `pourquoi` (tâche 1).
- Produces : les 3 scénarios Rappel ont un bloc `pourquoi` et un choix risqué réécrit. Le fil de notifications n'est pas modifié.

Scénarios et choix risqués actuels : `r-6e` : `ami-coins` / `essaie` ; `r-college` : `code-tournoi` / `envoie` ; `r-lycee` : `likes-payes` / `depot`.

- [ ] **Step 1 : appliquer les règles de réécriture** aux 3 scénarios.
- [ ] **Step 2 : vérifier** : `npx vitest run && npx vite build` → tous PASS, build OK.
- [ ] **Step 3 : relecture du ton**, puis relancer `npx vitest run tests/unit/node/content-real.test.ts`.
- [ ] **Step 4 : commit**
```bash
git add content/missions/rappel
git commit -m "content(rappel): choix risqués réalistes et leviers « pourquoi »"
```

---

### Task 9 : bloc `pourquoi` obligatoire, tests de contenu, E2E et guide

**Files :**
- Modify : `src/content/schema.ts`, `tests/unit/leviers-schema.test.ts`, `tests/unit/node/content-real.test.ts`, `tests/e2e/helpers.ts`, `tests/e2e/parcours.spec.ts`, `tests/e2e/a11y.spec.ts`, `README.md`

**Interfaces :**
- Consumes : tout ce qui précède ; contenu réel des tâches 6 à 8.
- Produces : la validation refuse un scénario avec un choix `risque` sans bloc `pourquoi` ; helper E2E `tabJusquaSelecteur(page, selecteur)`.

- [ ] **Step 1 : écrire les tests (qui doivent échouer)**

Dans `tests/unit/leviers-schema.test.ts`, ajouter dans `describe('bloc pourquoi d’un scénario')` :
```ts
  it('est obligatoire dès qu’un choix est risqué', () => {
    const sc = rawScenario()
    delete (sc as { pourquoi?: unknown }).pourquoi
    expect(chemins(rawMission({ etapes: [sc] }))).toContainEqual(
      'etapes.0.pourquoi : il faut un bloc pourquoi : un choix risqué est suivi de la question « pourquoi ? »',
    )
  })
```

Dans `tests/unit/node/content-real.test.ts` :
- dans `textesSansVersionSimple`, pour les scénarios, ajouter à la liste renvoyée :
```ts
        ...(e.pourquoi ?? []).flatMap((p): [string, string][] => [
          [`${e.id}.pourquoi.${p.levier}.truc`, p.truc],
          [`${e.id}.pourquoi.${p.levier}.parade`, p.parade],
        ]),
```
- ajouter dans le `describe` :
```ts
  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : chaque scénario a son bloc « pourquoi »', (_id, m) => {
    for (const e of m.etapes) {
      if (e.type !== 'scenario') continue
      expect(e.pourquoi?.length ?? 0, e.id).toBeGreaterThanOrEqual(3)
    }
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les réponses « pourquoi »', (_id, m) => {
    const texte = m.etapes
      .flatMap((e) => (e.type === 'scenario' ? (e.pourquoi ?? []).flatMap((p) => [p.truc, p.parade]) : []))
      .join(' ')
      .toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it('leviers.yaml : phrases de 20 mots maximum', () => {
    const textes = [
      ...Object.values(bundle.leviers.leviers).flatMap((l) => [l.libelle, l.parade]),
      bundle.leviers.autre.libelle,
      bundle.leviers.autre.truc,
      bundle.leviers.autre.parade,
    ]
    expect(textes.flatMap(phrases).filter((p) => mots(p).length > 20)).toEqual([])
  })
```

- [ ] **Step 2 : lancer les tests pour vérifier que le test de schéma échoue**

Run : `npx vitest run tests/unit/leviers-schema.test.ts tests/unit/node/content-real.test.ts`
Expected : FAIL sur « est obligatoire dès qu’un choix est risqué » (les tests de contenu réel passent déjà si les tâches 6 à 8 sont faites).

- [ ] **Step 3 : implémenter la règle**

Dans `src/content/schema.ts`, dans le `superRefine` de `scenarioSchema`, après le contrôle « le bloc pourquoi suppose un choix risqué » :
```ts
    if (!s.pourquoi && s.choix.some((c) => c.qualite === 'risque')) {
      ctx.addIssue({
        code: 'custom',
        path: ['pourquoi'],
        message: 'il faut un bloc pourquoi : un choix risqué est suivi de la question « pourquoi ? »',
      })
    }
```

- [ ] **Step 4 : E2E**

`tests/e2e/helpers.ts` — ajouter :
```ts
/** Tabule jusqu'à l'élément qui correspond au sélecteur CSS (indépendant du texte, qui peut évoluer). */
export async function tabJusquaSelecteur(page: Page, selecteur: string) {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selecteur)) return
  }
  throw new Error(`Élément introuvable au clavier : ${selecteur}`)
}
```
et, dans `jouerMission`, juste avant `else if (await jeNeSaisPas.isVisible())`, une branche pour l'étape « pourquoi » :
```ts
    else if (await page.locator('[data-levier="autre"]').isVisible()) await page.locator('[data-levier="autre"]').click()
```

`tests/e2e/parcours.spec.ts` :
- test « un choix risqué mène à un geste de récupération » : remplacer la ligne `await page.getByRole('button', { name: 'Je ne sais pas' }).click()` par :
```ts
  await expect(page.getByRole('heading', { name: 'Qu’est-ce qui t’a donné envie de le faire ?' })).toBeFocused()
  await page.locator('[data-levier="urgence"]').click()
  await expect(page.getByRole('heading', { name: 'Ce qui a marché sur toi' })).toBeVisible()
```
  (si le scénario `sms-colis` réécrit ne propose pas `urgence`, prendre le premier levier de son bloc `pourquoi`) ;
- test « un scénario complet au clavier » : importer `tabJusquaSelecteur` ; remplacer `await activer('J’envoie mes infos')` et le `await activer('Je ne sais pas')` qui le suit par :
```ts
  await tabJusquaSelecteur(page, '[data-choix="donne"]')
  await page.keyboard.press('Enter')
  await focusConserve(page)
  await expect(page.getByRole('heading', { name: 'Qu’est-ce qui t’a donné envie de le faire ?' })).toBeFocused()
  await tabJusquaSelecteur(page, '[data-levier="autre"]')
  await page.keyboard.press('Enter')
  await focusConserve(page)
```

`tests/e2e/a11y.spec.ts` — ajouter :
```ts
test('étape « pourquoi » et réponse personnalisée', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await page.locator('[data-choix="clic"]').click()
  await verifierA11y(page, 'pourquoi')
  await page.locator('[data-levier="autre"]').click()
  await verifierA11y(page, 'conséquence après piège')
})
```

`README.md`, section « Écrire une mission », ajouter aux règles principales :
```markdown
- Chaque scénario avec un choix `risque` a un bloc `pourquoi` : 3 ou 4 leviers (`content/leviers.yaml`), chacun avec
  `truc` (comment l’arnaqueur a joué sur ce levier ici) et `parade` (le geste à faire la prochaine fois).
- Le texte du choix `risque` est la vraie pensée d’un ado, qui tente vraiment : jamais une évidence.
```

- [ ] **Step 5 : vérification complète**

Run : `npx vitest run && npm run typecheck && npm run lint && npm run test:e2e && MSYS_NO_PATHCONV=1 BASE_PATH=/Cybergame/ npm run build`
Expected : tout passe (E2E : aucun échec ; les tests volontairement ignorés restent ignorés).

- [ ] **Step 6 : commit**

```bash
git add src/content/schema.ts tests README.md
git commit -m "feat: bloc « pourquoi » obligatoire, tests de contenu et E2E du parcours risqué"
```

---

## Corrections reportées de l'étape 1 (ajoutées au plan le 2026-09-30)

Les deux limites connues de l'étape 1, décrites dans le cahier des charges (section 9), sont corrigées sur la même branche.

### Task 10 : le lecteur d'écran commence par la situation

**Files :**
- Modify : `src/mission/ScenarioStep.vue`, `tests/unit/focus.test.ts`, `tests/e2e/parcours.spec.ts`

**Interfaces :**
- Consumes : `focusAuMontage`, `focusAuChangement` (`src/ui/focus.ts`, existants) ; prop `leviers` de `ScenarioStep` (tâche 3).
- Produces : à l'affichage d'un nouveau scénario, le focus va sur l'`<article class="scenario">` (placé avant la ligne de rôle et le faux téléphone), `tabindex="-1"`, nommé par `aria-label` ; à chaque changement de phase, le focus va toujours sur le titre `h2` de la phase.

- [ ] **Step 1 : adapter le test (qui doit échouer)**

Dans `tests/unit/focus.test.ts`, remplacer le test « ScenarioStep : le titre de la phase reçoit le focus dès l’affichage, puis à chaque phase » par :
```ts
  it('ScenarioStep : la situation reçoit le focus à l’affichage, puis le titre à chaque phase', async () => {
    const scenario = missionFixture().etapes[0] as Scenario
    const w = monter(ScenarioStep, {
      props: { scenario, phase: 'situation', mode: 'solo', sensible: false, leviers: leviersFixture() },
    })
    await flushPromises()
    expect(actif()?.tagName).toBe('ARTICLE')
    expect(actif()?.getAttribute('aria-label')).toBe('Situation : message de Colis Express dans Messages')
    await w.setProps({ phase: 'indices' })
    await flushPromises()
    expect(actif()?.textContent).toBe('Qu’est-ce qui t’a décidé ?')
  })
```
(ajouter `leviersFixture` à l'import depuis `./fixtures`).

- [ ] **Step 2 : vérifier l'échec** — Run : `npx vitest run tests/unit/focus.test.ts` → FAIL (le focus est sur le `H2`).

- [ ] **Step 3 : implémenter**

Dans `src/mission/ScenarioStep.vue` :
- script : `const situation = ref<HTMLElement | null>(null)` ; remplacer `focusAuMontage(titre)` par `focusAuMontage(situation)` (garder `focusAuChangement(() => props.phase, titre)`) ;
- template : la balise ouvrante de l'article devient
```vue
  <article
    ref="situation"
    class="scenario"
    tabindex="-1"
    :aria-label="`Situation : message de ${scenario.ecran.contact} dans ${scenario.ecran.appNom}`"
  >
```
- style : `.scenario:focus { outline: none; } .scenario:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }`.

Dans `tests/e2e/parcours.spec.ts`, test « un scénario complet au clavier » : les deux lignes `await expect(page.getByRole('heading', { level: 2 })).toBeFocused()` qui suivent l'arrivée sur une nouvelle étape (« Étape 2 sur 4 », « Étape 3 sur 4 ») deviennent `await expect(page.locator('article.scenario')).toBeFocused()`.

- [ ] **Step 4 : vérifier** — Run : `npx vitest run && npm run typecheck && npm run lint && npm run test:e2e` → tout passe.

- [ ] **Step 5 : commit**
```bash
git add src/mission/ScenarioStep.vue tests/unit/focus.test.ts tests/e2e/parcours.spec.ts
git commit -m "fix(a11y): le focus arrive sur la situation d’un nouveau scénario"
```

### Task 11 : un rappel joué avant la première mission ne fait plus sauter le J+30

**Files :**
- Modify : `src/engine/rappel.ts`, `tests/unit/rappel.test.ts`

**Interfaces :**
- Consumes / Produces : `rappelDu(datesTerminees: string[], rappels: { faitLe: string; fois: number }[], maintenant: Date): Echeance | null` — signature inchangée.

- [ ] **Step 1 : écrire le test (qui doit échouer)**

Dans `tests/unit/rappel.test.ts`, ajouter :
```ts
  it('un rappel joué avant la première mission puis à J+7 laisse venir le J+30', () => {
    // Un seul enregistrement par rappel : dernière date + nombre total de fois.
    expect(rappelDu([iso(2)], [{ faitLe: iso(10), fois: 2 }], jour(31))).toBeNull()
    expect(rappelDu([iso(2)], [{ faitLe: iso(10), fois: 2 }], jour(32))).toBe('J+30')
  })
```

- [ ] **Step 2 : vérifier l'échec** — Run : `npx vitest run tests/unit/rappel.test.ts` → FAIL (`fois = 2` fait renvoyer `null`).

- [ ] **Step 3 : implémenter**

Dans `src/engine/rappel.ts`, remplacer le corps de `rappelDu` après le calcul de `debut` par :
```ts
  const jours = (maintenant.getTime() - debut) / JOUR_MS
  const faitsDepuis = rappels.map((r) => Date.parse(r.faitLe)).filter((t) => Number.isFinite(t) && t >= debut)
  if (!faitsDepuis.length) return jours >= 7 ? 'J+7' : null
  // Le J+30 est dû tant qu'aucun rappel n'a été fait à partir de J+30.
  const dernier = Math.max(...faitsDepuis)
  if (jours >= 30 && dernier < debut + 30 * JOUR_MS) return 'J+30'
  return null
```
et mettre à jour le commentaire de la fonction : « J+7 après la première mission terminée tant qu'aucun rappel n'a été fait depuis ; puis J+30 tant qu'aucun rappel n'a été fait à partir de J+30. Un rappel joué avant la première mission ne compte pas. »

- [ ] **Step 4 : vérifier** — Run : `npx vitest run && npm run typecheck` → tous PASS (les tests existants de `rappel.test.ts` restent valables).

- [ ] **Step 5 : commit**
```bash
git add src/engine/rappel.ts tests/unit/rappel.test.ts
git commit -m "fix(rappel): un rappel joué avant la première mission ne fait plus sauter le J+30"
```
