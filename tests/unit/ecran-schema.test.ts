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
      { app: 'web', appNom: 'Magasin d’applis', contact: 'TunnelZéro VPN', messages, boutons: ['Installer', 'Annuler'] },
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

  it('un choix peut avoir une réaction du contact, un indice un passage à surligner', () => {
    const s = rawScenario()
    const enrichi = {
      ...s,
      choix: s.choix.map((c) => (c.id === 'clic' ? { ...c, reaction: 'Merci, à très vite !', reactionSimple: 'Merci !' } : c)),
      indices: s.indices.map((i) => (i.id === 'urgence' ? { ...i, passage: 'bloqué' } : i)),
    }
    const r = scenarioSchema.safeParse(enrichi)
    expect(erreurs(r)).toEqual([])
    expect(r.data?.choix[0]).toMatchObject({ reaction: 'Merci, à très vite !', reactionSimple: 'Merci !' })
    expect(r.data?.indices[1]).toMatchObject({ passage: 'bloqué' })
    expect(r.data?.choix[1]?.reaction).toBeUndefined()
  })

  it('chaque indice a un passage ; une page a 1 à 4 boutons', () => {
    const s = rawScenario()
    const sansPassage = { ...s, indices: s.indices.map((i) => (i.id === 'urgence' ? { id: i.id, libelle: i.libelle } : i)) }
    expect(erreurs(scenarioSchema.safeParse(sansPassage))).toHaveLength(1)
    const page = (boutons: string[]) => avecEcran({ app: 'web', appNom: 'Navigateur', contact: 'Page', messages, boutons })
    expect(scenarioSchema.safeParse(page([])).success).toBe(false)
    expect(scenarioSchema.safeParse(page(['A', 'B', 'C', 'D', 'E'])).success).toBe(false)
  })

  it('une notification peut avoir une heure', () => {
    const fil = rawRappel().etapes[0] as unknown as { notifications: Record<string, unknown>[] }
    const avecHeure = (heure: string) => ({ ...fil, notifications: fil.notifications.map((n, i) => (i === 0 ? { ...n, heure } : n)) })
    expect(filSchema.safeParse(avecHeure('07:45')).success).toBe(true)
    expect(erreurs(filSchema.safeParse(avecHeure('25:00')))).toEqual(['notifications.0.heure : heure attendue au format HH:MM'])
  })
})

describe('gestes des choix', () => {
  it('chaque choix sauf « aide » a un geste', () => {
    const s = rawScenario()
    const sansGeste = { ...s, choix: s.choix.map((c) => (c.id === 'verif' ? { ...c, geste: undefined } : c)) }
    expect(erreurs(scenarioSchema.safeParse(sansGeste))).toEqual([
      'choix.1.geste : il faut un geste (ce que le téléphone montre quand on choisit)',
    ])
  })
})

describe('texteStats', () => {
  it('écrit les compteurs présents avec leur unité', () => {
    expect(texteStats({ vues: '1 200', partages: '87' })).toBe('1 200 vues · 87 partages')
    expect(texteStats({ jaime: '3' })).toBe('3 j’aime')
    expect(texteStats({})).toBe('')
  })
})
