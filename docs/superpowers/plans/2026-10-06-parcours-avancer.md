# Parcours : n’avancer que sur une bonne réponse — plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** dans les parcours livrés sur `main`, l’élève n’avance que sur un choix `bon` ou `aide` ; après un piège il réessaie (choix barré). Un personnage choisi saute de plateforme en plateforme sur l’île du thème.

**Architecture :** extension du moteur existant (`LieuResultat.essais`, règles des événements sur un lieu), de `ChoixList`, `LieuStep` et `ReactionPanel`. Le choix du personnage et la scène de l’île sont repris de la branche `feat/parcours` (code déjà relu) et adaptés : 4 à 6 étapes, mini-jeu possible, 13 décors de `main`. `CheminIle` est conservé.

**Tech Stack :** Vue 3.5, TypeScript 5.9, Zod 4, Vitest 5, Playwright + axe. Aucune dépendance ajoutée.

**Spec :** `docs/superpowers/specs/2026-10-06-parcours-avancer-design.md` (et `2026-10-05-parcours-iles-design.md` pour le format livré).

**Source du code repris :** branche locale `feat/parcours` (récupérer un fichier : `git show feat/parcours:<chemin>`).

## Global Constraints

- Branche `feat/parcours-avancer` (depuis `main` 04f0f3f). Messages de commit conventionnels terminés par la ligne `Co-Authored-By: Claude … <noreply@anthropic.com>` fournie par la session.
- Textes visibles en français avec l’apostrophe typographique `’` (U+2019), saisie comme vrai caractère.
- Tout au clavier ; aucune information par la couleur seule ; focus géré à chaque changement d’état (`src/ui/focus.ts`) ; dessins décoratifs (`aria-hidden="true"`) doublés d’un texte ; réglage « animations » (`:root[data-animations='off']`) et `prefers-reduced-motion` respectés.
- Missions classiques (faux téléphone) strictement inchangées. Lieux : « Rejouer ce lieu » après un bon choix et « Passer ce lieu » (thèmes sensibles) inchangés.
- Stockage : seul ajout `personnage` (null par défaut), sans changer `version`.
- Ne jamais affaiblir une assertion ni désactiver une règle axe ; un test existant qui décrit l’ancien comportement (avancer après un piège) est **réécrit** pour décrire le nouveau.

## Review Focus

1. **Piège sans récupération** : « Continuer » est refusé, seul « Réessayer » s’affiche ; l’élève ne peut pas avancer. Tests tâches 1 et 2.
2. **Piège avec récupération** : après le geste, retour au même lieu (pas au suivant), le choix risqué barré. Tests tâches 1, 2 et 4.
3. **Double clic / choix barré** : refusé par `RunError` et avalé par la page. Tests tâches 1 et 4.
4. **Progression enregistrée avant cette version** (sans `personnage`) : chargée sans erreur, le premier parcours demande le personnage. Test tâche 3.
5. **Parcours de 4 ou 6 étapes, ou avec un mini-jeu** : la scène place autant de plateformes que d’étapes, plus l’arrivée. Test tâche 3.

---

### Task 1 : moteur — n’avancer que sur une bonne réponse

**Files :** Modify `src/engine/mission-runner.ts`, `src/engine/badges.ts`, `tests/unit/parcours-moteur.test.ts`.

**Interfaces :**
- Produces : `LieuResultat` gagne `essais: string[]` (choix risqués déjà essayés, dans l’ordre). Sur une étape `lieu` :
  - `choisir` : refuse (`RunError « choix déjà essayé : <id> »`) un choix présent dans `essais` ; garde `essais` du résultat précédent ; un choix bon/aide remet `levier` à `null`.
  - `expliquer` : ajoute le choix risqué à `essais`.
  - `continuer` (phase `consequence`) : après bon/aide, inchangé ; après risque : vers `recuperation` si `recuperation.siChoix` contient le choix, sinon `RunError`.
  - `recuperation-faite` : après risque, retour en `situation` du même lieu (`choixId: null`, résultat conservé avec `recuperationFaite: true`) ; après bon/aide, inchangé.
  - `rejouer` (phase `consequence`) : après risque = **Réessayer** : retour en `situation`, résultat conservé ; après bon/aide : résultat remis à vide **en gardant `essais`**.
- Badges : « Réflexe vérif » exige, pour chaque lieu, `essais.length === 0` (en plus de la règle actuelle).

- [ ] **Step 1 : tests (qui doivent échouer)** — dans `tests/unit/parcours-moteur.test.ts`, remplacer le test « un choix risqué passe par « pourquoi », puis la réaction et la récupération » par :
```ts
  it('un choix risqué : pourquoi, réaction, récupération, puis retour au même lieu', () => {
    let etat = jouer(m, { type: 'choisir', choixId: 'donne' })
    expect(etat.phase).toBe('pourquoi')
    etat = reduire(m, etat, { type: 'expliquer', levier: 'confiance' })
    expect(etat.phase).toBe('consequence')
    expect(etat.resultats.l1).toMatchObject({ type: 'lieu', qualite: 'risque', levier: 'confiance', essais: ['donne'] })
    expect(etat.leviersCedes).toEqual(['confiance'])
    etat = reduire(m, etat, { type: 'continuer' })
    expect(etat.phase).toBe('recuperation')
    etat = reduire(m, etat, { type: 'recuperation-faite' })
    expect(etat).toMatchObject({ index: 0, phase: 'situation', choixId: null })
    expect(etat.resultats.l1).toMatchObject({ recuperationFaite: true, essais: ['donne'] })
    expect(() => reduire(m, etat, { type: 'choisir', choixId: 'donne' })).toThrow(RunError)
    etat = reduire(m, reduire(m, etat, { type: 'choisir', choixId: 'garde' }), { type: 'continuer' })
    expect(etat).toMatchObject({ index: 1, phase: 'situation' })
    expect(etat.resultats.l1).toMatchObject({ choixId: 'garde', qualite: 'bon', levier: null, essais: ['donne'] })
  })

  it('un choix risqué sans récupération : « Continuer » refusé, « Réessayer » ramène au même lieu', () => {
    let etat = jouer(m, ...avancer(1), { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'gain' })
    expect(etat.index).toBe(1)
    expect(() => reduire(m, etat, { type: 'continuer' })).toThrow(RunError)
    etat = reduire(m, etat, { type: 'rejouer' })
    expect(etat).toMatchObject({ index: 1, phase: 'situation', choixId: null })
    expect(etat.resultats.l2).toMatchObject({ essais: ['donne'] })
  })

  it('double clic : un second choix est refusé', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'garde' })
    expect(() => reduire(m, etat, { type: 'choisir', choixId: 'aide' })).toThrow(RunError)
  })
```
avec, en haut du `describe`, `const avancer = (n: number): RunEvent[] => Array.from({ length: n }, (): RunEvent[] => [{ type: 'choisir', choixId: 'garde' }, { type: 'continuer' }]).flat()` (le 2e lieu de `parcoursFixture` n’a pas de récupération). Remplacer « rejouer un lieu efface son résultat » par :
```ts
  it('rejouer après un bon choix vide le résultat mais garde les essais', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'gain' }, { type: 'continuer' }, { type: 'recuperation-faite' },
      { type: 'choisir', choixId: 'garde' }, { type: 'rejouer' },
    )
    expect(etat.phase).toBe('situation')
    expect(etat.resultats.l1).toMatchObject({ choixId: null, qualite: null, essais: ['donne'] })
  })
```
Dans `describe('badges d’un parcours')`, remplacer « réparer après un choix risqué » par :
```ts
  it('réparer après un choix risqué, puis trouver le bon choix', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'gain' }, { type: 'continuer' }, { type: 'recuperation-faite' },
      { type: 'choisir', choixId: 'garde' }, { type: 'continuer' },
      ...prudent(3),
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'reparateur', 'explorateur'])
  })
```
(« Réflexe vérif » absent car un essai risqué a eu lieu, même si le dernier choix est bon.)

- [ ] **Step 2 : vérifier l’échec** — `npx vitest run tests/unit/parcours-moteur.test.ts` → FAIL.

- [ ] **Step 3 : implémenter** (`src/engine/mission-runner.ts`) :
  - `LieuResultat` : ajouter `essais: string[]` ; `resultatVide` pour un lieu : `essais: []`.
  - Ajouter `const essaisDe = (r: EtapeResultat | undefined): string[] => (r?.type === 'lieu' ? r.essais : [])`.
  - `choisir` : pour un lieu, après avoir trouvé `choix`, `if (essaisDe(etat.resultats[etape.id]).includes(choix.id)) throw new RunError(\`choix déjà essayé : ${choix.id}\`)` ; le résultat d’un choix bon/aide devient `{ ...(resultatVide(etape) as LieuResultat), essais: essaisDe(etat.resultats[etape.id]), choixId: choix.id, qualite: choix.qualite }`.
  - `expliquer` : pour un lieu, `{ ...resultatVide(etape), essais: [...essaisDe(etat.resultats[etape.id]), choix.id], choixId: choix.id, qualite: choix.qualite, levier: evenement.levier }` (scénario inchangé).
  - `continuer` : avant le comportement actuel, `if (etape.type === 'lieu' && resultat.qualite === 'risque' && !(etape.recuperation && etat.choixId && etape.recuperation.siChoix.includes(etat.choixId))) return refuser()`.
  - `recuperation-faite` : pour un lieu dont `resultat.qualite === 'risque'`, retourner `{ ...etat, phase: 'situation', choixId: null, resultats: { ...etat.resultats, [etape.id]: { ...resultat, recuperationFaite: true } } }`.
  - `rejouer` : pour un lieu, si `resultat.qualite === 'risque'` → `{ ...etat, phase: 'situation', choixId: null }` (résultat conservé) ; sinon `resultats[etape.id] = { ...(resultatVide(etape) as LieuResultat), essais: essaisDe(resultat) }` au lieu de le supprimer. Scénario inchangé.
  - `src/engine/badges.ts` : la règle `reflexe-verif` devient `scenarios.every((r) => r.qualite !== 'risque' && (r.type !== 'lieu' || r.essais.length === 0))`.

- [ ] **Step 4 : vérifier** — `npx vitest run && npm run typecheck && npm run lint` → PASS (corriger tout autre test unitaire qui construit un `LieuResultat` littéral en ajoutant `essais: []`, sans changer ce qu’il vérifie).

- [ ] **Step 5 : commit** — `git commit -m "feat(moteur): dans un parcours, on n’avance que sur une bonne réponse"`.

---

### Task 2 : lieu — choix barré, « Réessayer »

**Files :** Modify `src/mission/ChoixList.vue`, `src/mission/LieuStep.vue`, `src/mission/ReactionPanel.vue`, `tests/unit/parcours-ui.test.ts`.

**Interfaces :**
- Consumes : `LieuResultat.essais` et règles de la tâche 1.
- Produces : `ChoixList` prop optionnelle `essayes?: string[]` ; `LieuStep` passe `resultat?.essais ?? []` et, en phase `situation` avec au moins un essai, affiche `<p class="rester" role="status">Tu restes sur ta plateforme : essaie un autre choix.</p>` ; `ReactionPanel` : après un choix risqué, ligne « Tu restes sur ta plateforme. » et un seul bouton : « Continuer » si une récupération suit ce choix, sinon « Réessayer » (émet `rejouer`) ; après bon/aide : ligne « Tu avances ! », boutons inchangés (« Rejouer ce lieu », « Continuer »).

- [ ] **Step 1 : tests (qui doivent échouer)** — dans `tests/unit/parcours-ui.test.ts` : ajouter `essais: []` au résultat par défaut de `resultat()`. Remplacer « réaction : verdict, réaction, ce qui a marché, à retenir, rejouer et continuer » par :
```ts
  it('réaction après un piège avec récupération : on reste, un seul bouton « Continuer » vers le geste', async () => {
    const w = monterLieu({ phase: 'consequence', resultat: resultat({ choixId: 'donne', qualite: 'risque', levier: 'confiance', essais: ['donne'] }) })
    expect(w.text()).toContain('C’était risqué')
    expect(w.text()).toContain('Tu restes sur ta plateforme.')
    expect(w.text()).toContain('Son frère voit ton mot de passe.')
    expect(w.text()).toContain('Lina est ton amie.')
    expect(w.findAll('button').map((b) => b.text())).toEqual(['Continuer'])
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'continuer' }]])
  })

  it('réaction après un piège sans récupération : seulement « Réessayer »', async () => {
    const sansRecup = { ...lieu(), recuperation: undefined }
    const w = monterLieu({ lieu: sansRecup, phase: 'consequence', resultat: resultat({ choixId: 'donne', qualite: 'risque', levier: 'gain', essais: ['donne'] }) })
    expect(w.findAll('button').map((b) => b.text())).toEqual(['Réessayer'])
    await cliquer(w, 'Réessayer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }]])
  })

  it('réaction après un bon choix : on avance, « Rejouer ce lieu » et « Continuer »', async () => {
    const w = monterLieu({ phase: 'consequence', resultat: resultat() })
    expect(w.text()).toContain('Tu avances !')
    await cliquer(w, 'Rejouer ce lieu')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }], [{ type: 'continuer' }]])
  })

  it('après un essai, le choix risqué est barré et désactivé', () => {
    const w = monterLieu({ resultat: resultat({ choixId: null, qualite: null, essais: ['donne'] }) })
    const b = w.find('[data-choix="donne"]')
    expect(b.attributes('disabled')).toBeDefined()
    expect(b.text()).toContain('(déjà essayé)')
    expect(w.find('.rester').text()).toBe('Tu restes sur ta plateforme : essaie un autre choix.')
  })
```
(Si `monterLieu` n’accepte pas de surcharger `lieu`, l’étendre : `props: { lieu: lieu(), …, ...props }` le permet déjà.)

- [ ] **Step 2 : vérifier l’échec** — `npx vitest run tests/unit/parcours-ui.test.ts` → FAIL.

- [ ] **Step 3 : implémenter**
  - `ChoixList.vue` : reprendre l’ajout de `feat/parcours` (`git show feat/parcours:src/mission/ChoixList.vue`) : `withDefaults(…, { essayes: () => [] })`, bouton `:class="{ essaye: essayes.includes(c.id) }" :disabled="essayes.includes(c.id)"`, mention `<span v-if="essayes.includes(c.id)" class="deja"> (déjà essayé)</span>`, styles `.choix-btn.essaye { text-decoration: line-through; }` et `.deja { text-decoration: none; display: inline-block; }` (pas d’`opacity` : contraste conservé).
  - `LieuStep.vue` : `:essayes="resultat?.essais ?? []"` sur `ChoixList` ; au-dessus de la liste, en phase `situation` si `resultat?.essais.length`, le paragraphe `.rester` (texte ci-dessus).
  - `ReactionPanel.vue` :
```ts
const risque = computed(() => choix.value?.qualite === 'risque')
const recupSuit = computed(() => !!props.lieu.recuperation && !!choix.value && props.lieu.recuperation.siChoix.includes(choix.value.id))
```
    sous le verdict : `<p class="deplacement"><strong>{{ risque ? 'Tu restes sur ta plateforme.' : 'Tu avances !' }}</strong></p>` ; actions :
```vue
    <div class="actions">
      <template v-if="risque">
        <button v-if="recupSuit" type="button" class="btn btn-primaire" @click="emit('continuer')">Continuer</button>
        <button v-else type="button" class="btn btn-primaire" @click="emit('rejouer')">Réessayer</button>
      </template>
      <template v-else>
        <button type="button" class="btn" @click="emit('rejouer')">Rejouer ce lieu</button>
        <button type="button" class="btn btn-primaire" @click="emit('continuer')">Continuer</button>
      </template>
    </div>
```

- [ ] **Step 4 : vérifier** — `npx vitest run && npm run typecheck && npm run lint` → PASS (les scénarios classiques n’utilisent pas `essayes` : leurs tests restent verts).

- [ ] **Step 5 : commit** — `git commit -m "feat(parcours): on reste sur place après un piège, choix déjà essayé barré"`.

---

### Task 3 : personnage et île (repris de `feat/parcours`)

**Files :**
- Create (depuis `feat/parcours`, puis adapter) : `src/parcours/personnages.ts`, `src/parcours/PersonnageG.vue`, `src/parcours/ChoixPersonnage.vue`, `src/parcours/iles.ts`, `src/parcours/ParcoursScene.vue`, `tests/unit/choix-personnage.test.ts`, `tests/unit/parcours-scene.test.ts`
- Create : `src/parcours/decors.ts` (nouveau contenu, voir ci-dessous)
- Modify : `src/store/progress.ts`, `src/store/useProgress.ts`, `src/ui/ReglagesPanel.vue`

**Interfaces :**
- Produces : `PERSONNAGES`, `PersonnageId`, `progress.personnage`, `store.choisirPersonnage(id)` ; `ChoixPersonnage` (props `modelValue`, `legende?`, `name?` défaut `'personnage'`) ; `ILES_INFO: Record<IleId, Ile>` et `estIle(id): id is IleId` exportés par `src/parcours/iles.ts` (`IleId` = les 6 thèmes jouables) ; `DECORS_EMOJI: Record<Decor, string>` (`src/parcours/decors.ts`) ; `ParcoursScene` (props `ile: IleId`, `etapes: { id: string; nom: string; emoji: string }[]`, `position: number` de 0 à `etapes.length`, `personnage: PersonnageId`).

- [ ] **Step 1 : reprendre les fichiers** — `git show feat/parcours:<chemin> > <chemin>` pour chaque fichier « Create (depuis feat/parcours) ». Reprendre aussi, à la main, les ajouts de `feat/parcours` dans `src/store/progress.ts` (`PERSONNAGES`, `PersonnageId`, champ `personnage: z.enum(PERSONNAGES).nullable().default(null)`), `src/store/useProgress.ts` (`choisirPersonnage`) et `src/ui/ReglagesPanel.vue` (`<ChoixPersonnage legende="Personnage des parcours" name="personnage-reglages" :model-value="store.etat.personnage" @update:model-value="store.choisirPersonnage" />`). Comparer avec `git diff 5be1161 feat/parcours -- <fichier>`.

- [ ] **Step 2 : adapter**
  - `iles.ts` : ne plus importer `IleId` du schéma ; définir `export const ILES = ['phishing', 'jeux-achats', 'comptes', 'vie-privee', 'desinformation', 'appareils'] as const`, `export type IleId = (typeof ILES)[number]`, `export const estIle = (id: string): id is IleId => (ILES as readonly string[]).includes(id)`. Noms : phishing « Île aux hameçons », jeux-achats « Île aux pièces d’or », comptes « Île des clés », vie-privee « Île aux secrets », desinformation « Île aux rumeurs », appareils « Île aux antennes » ; objets inchangés.
  - `decors.ts` (remplace celui de `feat/parcours`) :
```ts
import type { Decor } from '@/content/schema'

/** Petit dessin posé sur la plateforme de chaque lieu (décoratif). */
export const DECORS_EMOJI: Record<Decor, string> = {
  cour: '🏀', cantine: '🍽️', cdi: '📚', classe: '✏️', parc: '🌳', 'salle-jeux': '🕹️', salon: '🛋️',
  chambre: '🛏️', cuisine: '🍳', gare: '🚉', magasin: '🛒', rue: '🚦', bus: '🚌',
}
export const EMOJI_MINIJEU = '🎲'
```
  - `ParcoursScene.vue` : props `etapes` au lieu de `lieux` ; plateformes calculées pour `n = etapes.length + 1` (arrivée comprise) : `x = 20 + i * Math.floor(540 / (n - 1))`, `y` pris dans `[170, 145, 160, 130, 150, 120, 105]` ; l’emoji de chaque plateforme vient de `etapes[i].emoji` ; texte de position `Étape ${position + 1} sur ${etapes.length} : ${etapes[position].nom}` et, à l’arrivée, `Arrivée ! Tu as gagné ${objet.nom}` (inchangé).
  - `tests/unit/parcours-scene.test.ts` : adapter à `etapes` (`{ id, nom, emoji }`) et aux noms d’îles ; ajouter :
```ts
  it.each([4, 6])('place %i plateformes plus l’arrivée', (n) => {
    const etapes = Array.from({ length: n }, (_, i) => ({ id: `e${i}`, nom: `Lieu ${i + 1}`, emoji: '📚' }))
    const w = mount(ParcoursScene, { props: { ile: 'comptes', etapes, position: 0, personnage: 'p1' } })
    expect(w.findAll('[data-plateforme]')).toHaveLength(n + 1)
  })
  it('chaque décor a son dessin', () => {
    for (const d of DECORS) expect(DECORS_EMOJI[d], d).toBeTruthy()
  })
```
  - `tests/unit/choix-personnage.test.ts` : garder les tests (progression sans `personnage` → `null`, mémorisation, 4 choix décrits, réglages avec `name="personnage-reglages"`).

- [ ] **Step 3 : vérifier** — `npx vitest run && npm run typecheck && npm run lint` → PASS.

- [ ] **Step 4 : commit** — `git commit -m "feat(parcours): choix du personnage et île où il saute de plateforme en plateforme"`.

---

### Task 4 : intégration, E2E et guide

**Files :** Modify `src/pages/MissionPage.vue`, `tests/unit/parcours-ui.test.ts`, `tests/e2e/helpers.ts`, `tests/e2e/parcours-ile.spec.ts`, `tests/e2e/a11y.spec.ts`, `README.md`.

**Interfaces :** Consumes : tâches 1 à 3.

- [ ] **Step 1 : tests (qui doivent échouer)**
  - `tests/unit/parcours-ui.test.ts`, dans le `describe` de `MissionPage` : le test « se joue lieu après lieu… » choisit d’abord un personnage (`store.choisirPersonnage('p1')` avant le montage) ; ajouter :
```ts
  it('demande le personnage au premier parcours', async () => {
    const w = await monterMission()
    expect(w.text()).toContain('Choisis ton personnage')
    await w.find('input[name="personnage"][value="p2"]').setValue()
    await cliquer(w, 'C’est parti !')
    expect(store.etat.personnage).toBe('p2')
    expect(w.find('.position').text()).toContain('Étape 1 sur')
  })

  it('un piège ne fait pas avancer ; après le geste, on réessaie le même lieu', async () => {
    store.choisirPersonnage('p1')
    const w = await monterMission()
    await w.find('[data-choix="donne"]').trigger('click')
    await w.find('[data-levier="gain"]').trigger('click')
    await cliquer(w, 'Continuer')
    expect(w.find('.position').text()).toContain('Étape 1 sur')
    expect(w.find('h2').text()).toBe('Maintenant, limite les dégâts')
  })
```
  (`monterMission` = le helper existant du fichier qui monte `MissionPage` sur le parcours de test ; le créer s’il n’existe pas, sur le modèle du test « se joue lieu après lieu ».)
  - `tests/e2e/helpers.ts` : ajouter `choisirPersonnageSiDemande(page)` (si le bouton « C’est parti ! » est visible : cocher le premier `input[name="personnage"]`, cliquer) et l’appeler au début de chaque tour de boucle de `jouerMission`.
  - `tests/e2e/parcours-ile.spec.ts` : appeler `choisirPersonnageSiDemande(page)` juste après chaque `goto` / clic qui ouvre un parcours ; réécrire « un lieu : choix risqué, pourquoi, réaction, puis geste de récupération » pour la nouvelle règle : après le geste et « Continuer », on est **toujours** à l’« Étape 1 sur 5 », le choix `ecrit` est désactivé, `.rester` est visible ; puis le choix `aide` + « Continuer » mène à « Étape 2 sur 5 ». Le test « parcours au clavier » sélectionne d’abord le personnage au clavier (Espace sur le premier `input[name="personnage"]`, puis Entrée sur « C’est parti ! »).
  - `tests/e2e/a11y.spec.ts` : ajouter un audit de l’écran « Choisis ton personnage » et de la scène (premier lieu) sur `/#/mission/v-6e-parcours`.

- [ ] **Step 2 : vérifier l’échec** — `npx vitest run tests/unit/parcours-ui.test.ts` → FAIL.

- [ ] **Step 3 : implémenter** `src/pages/MissionPage.vue` :
  - importer `ChoixPersonnage`, `ParcoursScene`, `estIle`, `ILES_INFO` n’est pas nécessaire, `DECORS_EMOJI`, `EMOJI_MINIJEU`, `type PersonnageId` ; ajouter :
```ts
const parcours = mission?.format === 'parcours'
const ile = theme && estIle(theme.id) ? theme.id : null
const etapesScene = (mission?.etapes ?? []).map((e) =>
  e.type === 'lieu' ? { id: e.id, nom: e.lieu, emoji: DECORS_EMOJI[e.decor] } : { id: e.id, nom: 'Mini-jeu', emoji: EMOJI_MINIJEU },
)
const personnageChoisi = ref<PersonnageId | null>(null)
function commencerParcours() {
  if (personnageChoisi.value) store.choisirPersonnage(personnageChoisi.value)
}
```
  - la barre « Étape x sur y » devient `v-if="!etat.termine && !parcours"` (la scène donne la position) ; `CheminIle` reste.
  - après `SensibleAvertissement`, avant `FinMission` : `<section v-else-if="parcours && !store.etat.personnage" class="choix-depart"><h2 ref="titreDepart" tabindex="-1">Avant de partir</h2><ChoixPersonnage v-model="personnageChoisi" /><button type="button" class="btn btn-primaire" :disabled="!personnageChoisi" @click="commencerParcours">C’est parti !</button></section>` avec `focusAuMontage(titreDepart)` ; si `focusAuMontage` ne convient pas à un élément conditionnel, utiliser `focusAuChangement(() => parcours && !store.etat.personnage, titreDepart)` plus un focus au montage.
  - la scène s’affiche au-dessus de l’étape et de la fin : `<ParcoursScene v-if="parcours && ile && store.etat.personnage" :ile="ile" :etapes="etapesScene" :position="etat.termine ? etapesScene.length : etat.index" :personnage="store.etat.personnage" />` (la placer de façon à rester visible pendant l’étape et sur l’écran de fin, sans toucher au rendu des missions classiques) ; `FilStep` passe en `v-else-if="etape.type === 'fil'"`.
  - `README.md`, section « Parcours de l’île » : ajouter la règle (on n’avance que sur un choix bon ou aide ; après un piège : pourquoi, réaction, geste éventuel, puis nouvel essai avec le choix barré), le choix du personnage et l’île.

- [ ] **Step 4 : vérification complète** — Git Bash : `npx vitest run && npm run typecheck && npm run lint && npm run test:e2e && MSYS_NO_PATHCONV=1 BASE_PATH=/Cybergame/ npm run build` → tout passe.

- [ ] **Step 5 : commit** — `git commit -m "feat(parcours): personnage et île dans la mission ; tests de bout en bout"`.

---

### Task 5 : relecture du contenu pour la nouvelle règle

**Files :** Modify `content/missions/*/?-6e-parcours.yaml` (les 6 parcours livrés).

- [ ] **Step 1 :** pour chaque lieu, relire la `reaction` / `reactionSimple` du choix risqué : elle ne doit pas laisser croire qu’on continue (« tu continues ta route », « direction le prochain lieu »…) ; elle peut annoncer qu’on va réessayer. Relire l’`aRetenir` (affiché aussi après un piège). Vérifier que le choix risqué n’est pas repérable à sa forme (longueur, tournure en négation, « raison : action »…) : il bloque désormais. Corriger au minimum, en gardant toutes les règles de contenu (`’`, 6e ≤ 20 mots, citations des `truc` dans `guide` et `guideSimple`).
- [ ] **Step 2 :** `npx vitest run && npx vite build` → PASS.
- [ ] **Step 3 :** commit `git commit -m "content(parcours): réactions adaptées au nouvel essai après un piège"`.
