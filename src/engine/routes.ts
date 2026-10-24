import type { Etape } from '../content/schema'

type Choix = { id: string; texte: string; qualite: 'bon' | 'risque' | 'aide'; suite?: string; route?: string }
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

/** Vrai si les choix « bon » et « aide » du lieu mènent chacun à une seule cible, et à deux cibles distinctes. */
function brancheBonAide(etapes: Etape[], e: Etape): boolean {
  if (e.type !== 'lieu') return false
  const cibles = (q: 'bon' | 'aide') => new Set(choixDe(e).filter((c) => c.qualite === q).map((c) => etapeSuivante(etapes, e.id, c.id)))
  const bon = cibles('bon')
  const aide = cibles('aide')
  return bon.size === 1 && aide.size === 1 && [...bon][0] !== [...aide][0]
}

/** Choix risqué à `suite` d’un lieu qui est une bifurcation « bon » / « aide » : il mène à la route de réparation. `null` sinon. */
export function choixReparation(etapes: Etape[], id: string): string | null {
  const e = etapes[index(etapes, id)]
  if (!e || !brancheBonAide(etapes, e)) return null
  const c = choixDe(e).find((x) => x.qualite === 'risque' && x.suite && etapes.some((y) => y.id === x.suite))
  return c?.id ?? null
}

/** Étapes suivantes possibles après une bonne réponse (sans doublon). */
export function successeurs(etapes: Etape[], id: string): string[] {
  const e = etapes[index(etapes, id)]
  if (!e) return []
  // Le choix « bon » d’abord : l’ordre des routes ne dépend pas de l’ordre des choix dans le fichier.
  const bons = choixDe(e).filter((c) => c.qualite !== 'risque').sort((x, y) => Number(y.qualite === 'bon') - Number(x.qualite === 'bon'))
  const ids = bons.length ? bons.map((c) => etapeSuivante(etapes, id, c.id)) : [etapeSuivante(etapes, id, null)]
  const reparation = choixReparation(etapes, id)
  if (reparation) ids.push(etapeSuivante(etapes, id, reparation))
  return [...new Set(ids.filter((x): x is string => x !== null))]
}

/** Si l’étape est une bifurcation : la cible de la route « bon », celle de la route « aide » et, s’il y en a une, celle de la réparation. */
export function bifurcation(etapes: Etape[], id: string): { bon: string; aide: string; reparation?: string } | null {
  if (successeurs(etapes, id).length < 2) return null
  const e = etapes[index(etapes, id)]!
  const cible = (q: 'bon' | 'aide') => {
    const c = choixDe(e).find((x) => x.qualite === q)
    return c ? etapeSuivante(etapes, id, c.id) : null
  }
  const bon = cible('bon')
  const aide = cible('aide')
  if (!bon || !aide) return null
  const choixR = choixReparation(etapes, id)
  const reparation = choixR ? etapeSuivante(etapes, id, choixR) : null
  return reparation ? { bon, aide, reparation } : { bon, aide }
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
    const reparation = choixReparation(etapes, e.id)
    const recup = (e as { recuperation?: { siChoix: string[] } }).recuperation
    if (reparation && recup?.siChoix.includes(reparation)) {
      erreurs.push({ chemin: ['etapes', i, 'recuperation'], message: 'le choix qui mène à la route de réparation n’a pas de récupération : la route répare' })
    }
    choixDe(e).forEach((c, j) => {
      if (!c.suite) return
      const chemin = ['etapes', i, 'choix', j, 'suite']
      if (c.qualite === 'risque') {
        if (!brancheBonAide(etapes, e)) erreurs.push({ chemin, message: 'un choix risqué fait rester sur place : pas de suite' })
        else if (choixDe(e).filter((x) => x.qualite === 'risque' && x.suite).length > 1) {
          erreurs.push({ chemin, message: 'une bifurcation a au plus un choix risqué qui mène à une route de réparation' })
        }
      }
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
    const reparation = choixReparation(etapes, e.id)
    if (reparation) {
      const cible = etapeSuivante(etapes, e.id, reparation)
      const autres = choixDe(e).filter((x) => x.qualite !== 'risque').map((x) => etapeSuivante(etapes, e.id, x.id))
      if (autres.includes(cible)) {
        erreurs.push({ chemin: ['etapes', i], message: 'les routes d’une bifurcation mènent à des lieux différents' })
        return
      }
    }
    const s = successeurs(etapes, e.id)
    if (s.length < 2) return
    const parQualite = new Map<string, Set<string>>()
    for (const c of choixDe(e).filter((x) => x.qualite !== 'risque')) {
      const cible = etapeSuivante(etapes, e.id, c.id)!
      parQualite.set(c.qualite, (parQualite.get(c.qualite) ?? new Set()).add(cible))
    }
    const bon = parQualite.get('bon')
    const aide = parQualite.get('aide')
    if (s.length !== (reparation ? 3 : 2) || !bon || !aide || bon.size !== 1 || aide.size !== 1 || [...bon][0] === [...aide][0]) {
      erreurs.push({ chemin: ['etapes', i], message: 'une bifurcation sépare exactement le choix « bon » et le choix « aide »' })
      return
    }
    choixDe(e).forEach((c, j) => {
      if ((c.qualite !== 'risque' || c.id === reparation) && !c.route) {
        erreurs.push({ chemin: ['etapes', i, 'choix', j, 'route'], message: 'les choix « bon » et « aide » d’une bifurcation ont chacun une étiquette « route » courte' })
      }
    })
  })
  return [...new Map(erreurs.map((e) => [e.message, e])).values()]
}

/**
 * Numéros affichés des lieux : tronc commun et jonction « rang + 1 », puis « 3a, 4a » sur la route « bon »
 * et « 3b, 4b » sur la route « aide » (« 3c, 4c » sur la réparation ; un parcours linéaire donne 1 à n).
 */
export function numerosLieux(etapes: Etape[]): Record<string, string> {
  const routes = routesDe(etapes)
  const numeros: Record<string, string> = {}
  routes.forEach((route, k) => {
    route.forEach((id, rang) => {
      if (id in numeros) return
      const partout = routes.every((r) => r[rang] === id)
      numeros[id] = `${rang + 1}${partout ? '' : String.fromCharCode(97 + k)}`
    })
  })
  return numeros
}

/** Texte du schéma des routes (« Lieux 1 – 2, puis selon le choix : 3a – 4a ou 3b – 4b, puis 5 »), `null` si une seule route. */
export function schemaRoutes(etapes: Etape[]): string | null {
  const routes = routesDe(etapes)
  if (routes.length < 2) return null
  const numeros = numerosLieux(etapes)
  const longueur = routes[0]!.length
  let debut = 0
  while (debut < longueur && routes.every((r) => r[debut] === routes[0]![debut])) debut++
  let fin = 0
  while (fin < longueur - debut && routes.every((r) => r.at(-1 - fin) === routes[0]!.at(-1 - fin))) fin++
  const suite = (ids: string[]) => ids.map((id) => numeros[id]).join(' – ')
  const tronc = routes[0]!.slice(0, debut)
  const branches = routes.map((r) => suite(r.slice(debut, longueur - fin))).join(' ou ')
  const fermeture = suite(routes[0]!.slice(longueur - fin))
  return [
    tronc.length ? `${tronc.length > 1 ? 'Lieux' : 'Lieu'} ${suite(tronc)}, puis ` : '',
    `selon le choix : ${branches}`,
    fermeture ? `, puis ${fermeture}` : '',
  ].join('')
}

/** Étiquette courte d’un choix de bifurcation ; à défaut, son texte sans point final. */
export const etiquetteRoute = (c: { texte: string; route?: string }): string => c.route ?? c.texte.replace(/[.\s]+$/, '')

/**
 * Choix de la bifurcation (route « bon » et route « aide »), `null` sans bifurcation :
 * `bon` et `aide` sont les étiquettes courtes (« route »), `texteBon` et `texteAide` les textes entiers des choix.
 */
export function choixDeBifurcation(etapes: Etape[]): { id: string; bon: string; aide: string; texteBon: string; texteAide: string; reparation?: string; texteReparation?: string } | null {
  for (const e of etapes) {
    if (e.type !== 'lieu' || !bifurcation(etapes, e.id)) continue
    const bon = e.choix.find((c) => c.qualite === 'bon')
    const aide = e.choix.find((c) => c.qualite === 'aide')
    if (!bon || !aide) continue
    const base = { id: e.id, bon: etiquetteRoute(bon), aide: etiquetteRoute(aide), texteBon: bon.texte, texteAide: aide.texte }
    const idR = choixReparation(etapes, e.id)
    const rep = idR ? e.choix.find((c) => c.id === idR) : undefined
    return rep ? { ...base, reparation: etiquetteRoute(rep), texteReparation: rep.texte } : base
  }
  return null
}
