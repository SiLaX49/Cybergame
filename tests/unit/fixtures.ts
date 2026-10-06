import {
  confidentialiteConfigSchema,
  leviersFileSchema,
  missionSchema,
  motdepasseConfigSchema,
  permissionsConfigSchema,
  repereConfigSchema,
  themesFileSchema,
  triConfigSchema,
  verificationConfigSchema,
  type ConfidentialiteConfig,
  type Leviers,
  type Mission,
  type MotdepasseConfig,
  type PermissionsConfig,
  type RepereConfig,
  type Theme,
  type TriConfig,
  type VerificationConfig,
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
          texte: 'Votre colis est bloqué : payez 1,99 € sur colis-expres.info avant ce soir',
          texteSimple: 'Ton colis est bloqué, paie 1,99 €.',
        },
      ],
    },
    question: 'Que fais-tu ?',
    choix: [
      { id: 'clic', texte: 'Je clique et je paie', qualite: 'risque', geste: 'ouvrir-lien', consequence: 'La carte est volée.', consequenceSimple: 'On vole la carte.' },
      { id: 'verif', texte: 'Je vérifie sur l’appli officielle', qualite: 'bon', geste: 'verifier', consequence: 'Aucun colis en attente.' },
      { id: 'aide', texte: 'Je demande de l’aide à quelqu’un', qualite: 'aide', consequence: 'Ta mère confirme : arnaque.' },
    ],
    indices: [
      { id: 'url', libelle: 'L’adresse est bizarre', passage: 'colis-expres.info' },
      { id: 'urgence', libelle: 'On me presse', passage: 'avant ce soir' },
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

export function rawMotdepasse() {
  return {
    consigne: 'Crée une phrase de passe solide.',
    contexte: 'Tu crées ton compte GameBox. Ton pseudo est Léa2012.',
    objectif: 'solide',
    interdits: ['Léa', '2012'],
  }
}
export function rawConfidentialite() {
  return {
    consigne: 'Rends ce profil plus sûr.',
    appNom: 'SnapTalk',
    reglages: [
      { id: 'profil', libelle: 'Qui peut voir mon profil', options: [{ id: 'tous', libelle: 'Tout le monde' }, { id: 'amis', libelle: 'Mes amis' }], initial: 'tous', conseille: 'amis', explication: 'Un profil public est visible par des inconnus.' },
      { id: 'position', libelle: 'Partager ma position', options: [{ id: 'oui', libelle: 'Oui' }, { id: 'non', libelle: 'Non' }], initial: 'oui', conseille: 'non', explication: 'Ta position dit où tu habites et où tu vas.' },
      { id: 'anniv', libelle: 'Afficher ma date d’anniversaire', options: [{ id: 'oui', libelle: 'Oui' }, { id: 'non', libelle: 'Non' }], initial: 'non', conseille: 'non', explication: 'Ta date de naissance sert à deviner tes mots de passe.' },
    ],
  }
}
export function rawVerification() {
  return {
    consigne: 'Cette photo est-elle vraie ?',
    publication: {
      auteur: 'InfosChoc',
      texte: 'Un requin nage dans une rue de la ville après l’orage !',
      date: 'Aujourd’hui',
      image: { description: 'Un requin dans une rue inondée, devant une boulangerie.' },
    },
    actions: [
      { id: 'source', libelle: 'Chercher la source', resultat: 'Aucun média ne parle de ce requin.' },
      { id: 'image', libelle: 'Recherche d’image inversée', resultat: 'La même image circule depuis 2017, dans d’autres villes.' },
    ],
    verdict: 'faux',
    explication: 'C’est un montage ancien, partagé à chaque orage.',
  }
}
export function rawPermissions() {
  return {
    consigne: 'Accepte seulement ce dont l’appli a besoin.',
    apps: [
      { id: 'lampe', nom: 'Super Lampe', description: 'Une lampe torche.', permissions: [
        { id: 'flash', libelle: 'Utiliser le flash', necessaire: true, explication: 'Une lampe a besoin du flash.' },
        { id: 'contacts', libelle: 'Lire tes contacts', necessaire: false, explication: 'Une lampe n’a aucune raison de lire tes contacts.' },
      ] },
      { id: 'carte', nom: 'Mon Trajet', description: 'Un GPS pour le vélo.', permissions: [
        { id: 'position', libelle: 'Connaître ta position', necessaire: true, explication: 'Un GPS a besoin de ta position.' },
        { id: 'micro', libelle: 'Utiliser le micro', necessaire: false, explication: 'Un GPS n’a pas besoin du micro.' },
      ] },
    ],
  }
}
export const motdepasseFixture = (): MotdepasseConfig => motdepasseConfigSchema.parse(rawMotdepasse())
export const confidentialiteFixture = (): ConfidentialiteConfig => confidentialiteConfigSchema.parse(rawConfidentialite())
export const verificationFixture = (): VerificationConfig => verificationConfigSchema.parse(rawVerification())
export const permissionsFixture = (): PermissionsConfig => permissionsConfigSchema.parse(rawPermissions())

export function rawLieu(id = 'lieu-1') {
  return {
    type: 'lieu',
    id,
    lieu: 'La cour',
    decor: 'cour',
    guide: 'Dans la cour, Lina te dit : « Donne-moi ton mot de passe, je garde ta série ! »',
    guideSimple: 'Lina te dit : « Donne-moi ton mot de passe, je garde ta série ! »',
    question: 'Que fais-tu ?',
    choix: [
      { id: 'donne', texte: 'Je lui donne', qualite: 'risque', reaction: 'Son frère voit ton mot de passe.', reactionSimple: 'Son frère le voit.' },
      { id: 'garde', texte: 'Je garde mon mot de passe', qualite: 'bon', reaction: 'Ton compte reste à toi.' },
      { id: 'aide', texte: 'Je demande de l’aide à un adulte', qualite: 'aide', reaction: 'Ton père t’aide à dire non.' },
    ],
    aRetenir: 'Un mot de passe ne se prête pas.',
    aRetenirSimple: 'Garde ton mot de passe.',
    recuperation: { action: 'changer-mdp', siChoix: ['donne'] },
    pourquoi: [
      { levier: 'confiance', truc: 'Lina est ton amie.', parade: 'Garde ton mot de passe, même avec elle.' },
      { levier: 'gain', truc: 'Ta série compte pour toi.', parade: 'Une série se recommence.' },
      { levier: 'urgence', truc: 'Tu pars demain.', parade: 'Prends le temps d’en parler.' },
    ],
  }
}

export function rawParcours(overrides: Record<string, unknown> = {}) {
  return rawMission({
    id: 'p-parcours',
    format: 'parcours',
    titre: 'La traversée de l’île test',
    etapes: [rawLieu('l1'), { ...rawLieu('l2'), recuperation: undefined }, rawLieu('l3'), rawLieu('l4')],
    ...overrides,
  })
}
export const parcoursFixture = (overrides: Record<string, unknown> = {}): Mission =>
  missionSchema.parse(rawParcours(overrides))
