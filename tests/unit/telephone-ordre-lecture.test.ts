import { describe, expect, it } from 'vitest'
import type { Ecran } from '@/content/schema'
import { ordreLecture, textesLus } from '@/phone/ordreLecture'
import { decouperTexte } from '@/phone/surlignage'

const normal = (texte: string) => texte
const simple = (texte: string, texteSimple?: string) => texteSimple ?? texte
const indice = (id: string, passage?: string) => ({ id, libelle: id, passage })

describe('ordreLecture', () => {
  const textes = ['NoaGaming_Officiel', 'Gagne un iPhone : clique vite sur noa-cadeaux.xyz', 'Dernier jour !']
  it('trie par texte, puis par position dans le texte', () => {
    const indices = [indice('jour', 'Dernier jour'), indice('lien', 'noa-cadeaux.xyz'), indice('gain', 'Gagne un iPhone'), indice('nom', 'Noa')]
    expect(ordreLecture(indices, textes).map((i) => i.id)).toEqual(['nom', 'gain', 'lien', 'jour'])
  })
  it('première apparition seulement : un passage répété compte à sa première place', () => {
    expect(ordreLecture([indice('b', 'clique'), indice('a', 'iPhone')], ['iPhone', 'clique sur iPhone']).map((i) => i.id)).toEqual(['a', 'b'])
  })
  it('sans passage ou passage introuvable : après, dans l’ordre donné', () => {
    const indices = [indice('absent', 'nulle part'), indice('sans'), indice('jour', 'Dernier jour'), indice('vide', '')]
    expect(ordreLecture(indices, textes).map((i) => i.id)).toEqual(['jour', 'absent', 'sans', 'vide'])
  })
  it('ne modifie pas la liste reçue', () => {
    const indices = [indice('jour', 'Dernier jour'), indice('nom', 'Noa')]
    ordreLecture(indices, textes)
    expect(indices.map((i) => i.id)).toEqual(['jour', 'nom'])
  })
})

describe('textesLus', () => {
  const messages = [{ de: 'contact' as const, texte: 'Bonjour', texteSimple: 'Salut' }]
  it('conversation : contact, puis messages ; lecture simplifiée', () => {
    const sms = { app: 'sms', appNom: 'Messages', contact: 'Léa', messages } as Ecran
    expect(textesLus(sms, normal)).toEqual(['Léa', 'Bonjour'])
    expect(textesLus(sms, simple)).toEqual(['Léa', 'Salut'])
  })
  it('mail : objet, expéditeur, adresse, corps', () => {
    const mail = { app: 'mail', appNom: 'Mail', contact: 'GameBox', adresse: 'a@b.fr', sujet: 'Urgent', messages } as Ecran
    expect(textesLus(mail, normal)).toEqual(['Urgent', 'GameBox', 'a@b.fr', 'Bonjour'])
  })
  it('web : domaine, chemin, corps, boutons (le titre de la page n’est pas surligné)', () => {
    const web = { app: 'web', appNom: 'Navigateur', contact: 'Page', url: 'https://x.fr/a', boutons: ['Oui'], messages } as Ecran
    expect(textesLus(web, normal)).toEqual(['x.fr', '/a', 'Bonjour', 'Oui'])
  })
  it('publication : compte, abonnés, bio, texte, média, commentaires', () => {
    const social = {
      app: 'social', appNom: 'StreamTube', contact: 'anonyme', certifie: false, abonnes: '2 400', bio: 'Parodie', messages,
      media: { description: 'Vidéo', descriptionSimple: 'Une vidéo' }, commentaires: [{ de: 'lea', texte: 'Ouah' }],
    } as Ecran
    expect(textesLus(social, simple)).toEqual(['anonyme', '2 400 abonnés', 'Parodie', 'Salut', 'Une vidéo', 'Ouah'])
  })
})

describe('decouperTexte sans liens', () => {
  it('un domaine reste du texte, le passage est toujours trouvé', () => {
    expect(decouperTexte('gare-libre-wifi.com', [], false)).toEqual([{ type: 'texte', texte: 'gare-libre-wifi.com' }])
    expect(decouperTexte('support@gamebox-verif.com', [{ texte: 'gamebox-verif.com', numero: 1 }], false)).toEqual([
      { type: 'texte', texte: 'support@' }, { type: 'passage', texte: 'gamebox-verif.com', numero: 1 },
    ])
    expect(decouperTexte('', [], false)).toEqual([])
  })
})
