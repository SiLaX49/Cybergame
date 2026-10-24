import { describe, expect, it } from 'vitest'
import { missionSchema } from '@/content/schema'
import { rawLieu, rawMission, rawParcours, rawRappel, rawScenario } from './fixtures'

function problemes(raw: unknown) {
  const res = missionSchema.safeParse(raw)
  return res.success ? [] : res.error.issues.map((i) => ({ chemin: i.path.join('.'), message: i.message }))
}

describe('relecture', () => {
  it('accepte a-relire sans relecteur', () => {
    expect(problemes(rawMission({ relecture: { statut: 'a-relire' } }))).toEqual([])
  })
  it('refuse relue-interne sans par ni date', () => {
    const p = problemes(rawMission({ relecture: { statut: 'relue-interne' } }))
    expect(p).toContainEqual({ chemin: 'relecture', message: '« par » et « date » sont obligatoires une fois relue' })
    // Le chemin « relecture » est déjà ajouté par formatIssue : le message ne le répète pas.
    expect(p.map((x) => x.message).join(' ')).not.toMatch(/^relecture :/)
  })
  it('refuse une date qui n’existe pas ou mal formée', () => {
    for (const date of ['2026-02-30', '2026-13-01', '2026-10-1', '20-10-2026']) {
      const p = problemes(rawMission({ relecture: { statut: 'relue-interne', par: 'Noa', date } }))
      expect(p.map((x) => x.chemin), date).toContain('relecture.date')
    }
  })
  it('accepte relue-association avec par et date', () => {
    expect(problemes(rawMission({ relecture: { statut: 'relue-association', par: 'Asso', date: '2026-10-01' } }))).toEqual([])
  })
})

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

  it('exige au moins un indice', () => {
    const sc = rawScenario()
    sc.indices = []
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

describe('parcours à routes', () => {
  const lieu = (id: string, extra: Record<string, unknown> = {}, choixSuites: Record<string, string> = {}, avecRoute = false) => {
    const l = rawLieu(id)
    return { ...l, recuperation: undefined, ...extra, choix: l.choix.map((c) => (choixSuites[c.id] ? { ...c, suite: choixSuites[c.id], ...(avecRoute ? { route: `route ${c.id}` } : {}) } : c)) }
  }
  const deuxRoutes = (suiteBon = 'a3') => [
    lieu('l1'),
    lieu('l2', {}, { garde: suiteBon, aide: 'b3' }, true),
    lieu('a3'),
    lieu('a4', { suite: 'l5' }),
    lieu('b3'),
    lieu('b4'),
    lieu('l5'),
  ]
  it('accepte un parcours à deux routes (7 lieux, routes de 5)', () => {
    expect(problemes(rawParcours({ etapes: deuxRoutes() }))).toEqual([])
  })
  it('refuse une bifurcation sans étiquette « route » sur un choix bon ou aide', () => {
    const etapes = deuxRoutes()
    const sans = etapes.map((e, i) => (i === 1 ? { ...e, choix: (e as { choix: Record<string, unknown>[] }).choix.map((c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'route'))) } : e))
    const p = problemes(rawParcours({ etapes: sans }))
    expect(p.map((x) => x.message).join(' | ')).toMatch(/étiquette « route »/)
    expect(p[0]!.chemin).toMatch(/^etapes\.1\.choix\.\d\.route$/)
  })
  it('refuse une étiquette de route avec point final', () => {
    const etapes = deuxRoutes().map((e, i) => (i === 1 ? { ...e, choix: (e as { choix: Record<string, unknown>[] }).choix.map((c) => (c.route ? { ...c, route: 'je demande.' } : c)) } : e))
    expect(problemes(rawParcours({ etapes })).map((x) => x.message).join(' | ')).toMatch(/sans point final/)
  })
  it('refuse une suite inconnue', () => {
    const p = problemes(rawParcours({ etapes: deuxRoutes('zz') }))
    expect(p.map((x) => x.message).join('\n')).toMatch(/inconnue/)
  })
  it('refuse un parcours linéaire de 7 lieux', () => {
    const etapes = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'].map((id) => lieu(id))
    const p = problemes(rawParcours({ etapes }))
    expect(p.map((x) => x.message).join('\n')).toMatch(/4 à 6 lieux par route/)
  })
  it('garde valide un parcours linéaire de 5 lieux', () => {
    expect(problemes(rawParcours({ etapes: ['l1', 'l2', 'l3', 'l4', 'l5'].map((id) => lieu(id)) }))).toEqual([])
  })
})
