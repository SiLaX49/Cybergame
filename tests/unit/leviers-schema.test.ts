import { describe, expect, it } from 'vitest'
import { LEVIERS, leviersFileSchema, missionSchema } from '@/content/schema'
import { rawLeviers, rawMission, rawScenario } from './fixtures'

const chemins = (raw: unknown) => {
  const res = missionSchema.safeParse(raw)
  return res.success ? [] : res.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`)
}

describe('leviers.yaml', () => {
  it('accepte les 13 leviers et « autre »', () => {
    expect(leviersFileSchema.safeParse(rawLeviers()).success).toBe(true)
  })
  it('liste les 13 leviers dans l’ordre', () => {
    expect(LEVIERS).toEqual(['urgence', 'peur', 'gain', 'confiance', 'petit-montant', 'autorite', 'groupe', 'reflexe', 'flatterie', 'secret', 'honte', 'humour', 'colere'])
  })
  it('refuse leviers.yaml sans le levier honte', () => {
    const raw = rawLeviers()
    delete (raw.leviers as Record<string, unknown>).honte
    expect(leviersFileSchema.safeParse(raw).success).toBe(false)
  })
  it('exige tous les leviers', () => {
    const raw = rawLeviers()
    delete (raw.leviers as Record<string, unknown>).groupe
    expect(leviersFileSchema.safeParse(raw).success).toBe(false)
  })
  it('refuse un levier inconnu', () => {
    const raw = rawLeviers()
    ;(raw.leviers as Record<string, unknown>).inconnu = raw.leviers.gain
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
    inconnu.pourquoi[0]!.levier = 'inconnu'
    expect(chemins(rawMission({ etapes: [inconnu] }))).toContainEqual(expect.stringMatching(/^etapes\.0\.pourquoi\.0\.levier/))
  })
  it('exige 3 ou 4 leviers', () => {
    const sc = rawScenario()
    sc.pourquoi = sc.pourquoi.slice(0, 2)
    expect(chemins(rawMission({ etapes: [sc] }))).toContainEqual(expect.stringMatching(/^etapes\.0\.pourquoi/))
  })
  it('est obligatoire dès qu’un choix est risqué', () => {
    const sc = rawScenario()
    delete (sc as { pourquoi?: unknown }).pourquoi
    expect(chemins(rawMission({ etapes: [sc] }))).toContainEqual(
      'etapes.0.pourquoi : il faut un bloc pourquoi : un choix risqué est suivi de la question « pourquoi ? »',
    )
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
