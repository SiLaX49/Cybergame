import { describe, expect, it } from 'vitest'
import { missionSchema } from '@/content/schema'
import { rawMission, rawRappel, rawScenario } from './fixtures'

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
