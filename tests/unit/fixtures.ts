import {
  leviersFileSchema,
  missionSchema,
  repereConfigSchema,
  themesFileSchema,
  triConfigSchema,
  type Leviers,
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
    pourquoi: [
      { levier: 'urgence', truc: 'Le délai de 24 h est là exprès.', parade: 'Plus on te presse, plus tu ralentis.' },
      { levier: 'petit-montant', truc: 'Le petit montant est un appât.', parade: 'C’est ta carte qu’on veut, pas les 1,99 €.' },
      { levier: 'reflexe', truc: 'Le message imite un vrai SMS.', parade: 'Prends trois secondes avant de cliquer.' },
    ],
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
