/**
 * Textes des actions de récupération des thèmes sensibles : lus par les composants de src/recovery/
 * et par l’export de relecture (scripts/export-relecture.ts), pour que les relecteurs voient le texte exact.
 * Ce module n’importe rien : il doit rester utilisable depuis Node (tsx) comme depuis Vite.
 */

export const CONTEXTES_SENSIBLES = ['harcelement', 'rencontres'] as const
export type ContexteSensible = (typeof CONTEXTES_SENSIBLES)[number]

/** Contexte des textes de récupération, tiré du thème de la mission (undefined hors thème sensible connu). */
export function contexteSensible(themeId: string | undefined): ContexteSensible | undefined {
  return (CONTEXTES_SENSIBLES as readonly string[]).includes(themeId ?? '') ? (themeId as ContexteSensible) : undefined
}

/** Une option proposée à l’élève ; `retour` vide = bonne option, qui fait avancer. */
export interface OptionRecuperation {
  id: string
  texte: string
  retour: string
}

export interface TextesSoutenir {
  titre: string
  question: string
  messages: OptionRecuperation[]
  envoye: string
  rappel: string
}

export const SOUTENIR: Record<ContexteSensible, TextesSoutenir> = {
  harcelement: {
    titre: 'Écris à la personne visée, en privé',
    question: 'Quel message lui envoies-tu ?',
    messages: [
      { id: 'ecoute', texte: 'Je suis là si tu veux en parler.', retour: '' },
      { id: 'adulte', texte: 'Tu veux que j’en parle à un adulte avec toi ?', retour: '' },
      {
        id: 'minimise',
        texte: 'Laisse tomber, ils sont bêtes.',
        retour:
          'Ton message part d’une bonne intention, mais il peut donner l’impression que ce n’est pas grave. Dis plutôt que tu es là.',
      },
      {
        id: 'public',
        texte: '(Tu réponds aux harceleurs dans le groupe.)',
        retour: 'Répondre en public peut relancer les attaques. Écris d’abord en privé à la personne visée.',
      },
    ],
    envoye: 'Message envoyé.',
    rappel:
      'Ne réponds pas aux harceleurs en public à la place de la personne visée. Garde une capture des messages, et préviens un adulte : ensemble, vous pouvez faire cesser le harcèlement.',
  },
  rencontres: {
    titre: 'Écris à ton ami·e, en privé',
    question: 'Quel message lui envoies-tu ?',
    messages: [
      { id: 'ecoute', texte: 'Ce n’est pas ta faute, je suis là.', retour: '' },
      { id: 'adulte', texte: 'On va voir un adulte ensemble ?', retour: '' },
      {
        id: 'minimise',
        texte: 'T’inquiète, ça va passer.',
        retour:
          'Ton message part d’une bonne intention, mais il laisse croire qu’il suffit d’attendre. Dis plutôt que tu es là, et propose d’en parler à un adulte.',
      },
      {
        id: 'secret',
        texte: 'Promis, je ne dirai rien.',
        retour:
          'Tu veux garder sa confiance, et c’est normal. Mais ce secret-là ne se garde pas : ton ami·e a besoin qu’un adulte l’aide. Propose-lui d’y aller ensemble.',
      },
    ],
    envoye: 'Message envoyé.',
    rappel: 'Ce secret-là ne se garde pas : préviens un adulte ou le 3018. Si c’est tout de suite, l’adulte appelle le 17.',
  },
}

export const RETIRER_PUBLICATION = {
  titre: 'Répare ce que tu as publié',
  supprimer: 'Supprimer ma publication',
  supprimee: 'Publication supprimée.',
  question: 'Quelles excuses envoies-tu ?',
  excuses: [
    { id: 'sinceres', texte: 'Je suis désolé·e, ce que j’ai publié était blessant. Je l’ai supprimé.', retour: '' },
    {
      id: 'pas-vraiment',
      texte: 'Désolé·e si tu t’es senti·e vexé·e, c’était pour rire.',
      retour: 'Cette excuse rejette la faute sur l’autre (« si tu t’es senti·e vexé·e »). Une vraie excuse dit ce qu’on a fait.',
    },
    {
      id: 'rien',
      texte: '(Tu ne dis rien.)',
      retour: 'Supprimer ne suffit pas toujours : la personne a vu le message. Des excuses comptent.',
    },
  ] satisfies OptionRecuperation[],
  envoyees: 'Excuses envoyées.',
  repartager: 'Demander aux autres de ne pas repartager',
  rappel: 'C’est possible de réparer. En parler à un adulte t’aide aussi.',
}

export const CAPTURE_PREUVE = {
  titre: 'Garde des preuves, puis bloque',
  consigne: 'Avant de bloquer, fais une capture d’écran : une fois le compte bloqué, tu risques de ne plus voir les messages.',
  capture: 'Faire une capture d’écran',
  bloquer: 'Bloquer le compte',
  captureFaite: 'Capture enregistrée dans ta galerie, avec la date et le nom du compte.',
  rappel: 'Preuves gardées et compte bloqué. Tu pourras montrer les captures à un adulte ou au 3018.',
}

export const BLOQUER_SIGNALER = {
  titre: 'Bloque et signale ce compte',
  menu: 'Ouvre le menu du contact.',
  boutonMenu: 'Menu du contact',
  bloquerConsigne: 'Commence par bloquer : ce compte ne pourra plus te contacter.',
  boutonBloquer: 'Bloquer',
  question: 'Compte bloqué. Maintenant, signale-le : pourquoi ?',
  motifs: ['Arnaque ou fraude', 'Harcèlement', 'Faux compte', 'Autre'],
  /** Motif ajouté dans les thèmes sensibles, avant « Autre ». */
  motifSensible: 'Comportement inquiétant envers un mineur',
  envoyer: 'Envoyer le signalement',
  rappel: 'Bloqué et signalé. La plateforme va examiner le compte, et tu protèges aussi les autres.',
}

/** Motifs de signalement proposés, selon que la mission est sensible ou non. */
export function motifsSignalement(contexte: ContexteSensible | undefined): string[] {
  const { motifs, motifSensible } = BLOQUER_SIGNALER
  return contexte ? [...motifs.slice(0, -1), motifSensible, ...motifs.slice(-1)] : motifs
}

export const DEMANDER_AIDE = {
  titre: 'À qui en parler ?',
  consigne: 'Tu n’as pas à gérer ça seul·e. Choisis la personne à qui tu en parlerais :',
  personnes: [
    { id: 'parent', nom: 'Un parent ou un adulte de ta famille', role: 'Il ou elle peut t’aider à sécuriser tes comptes et à contacter la banque ou la plateforme.' },
    { id: 'prof', nom: 'Un·e prof', role: 'Il ou elle peut t’écouter et prévenir les bonnes personnes dans l’établissement.' },
    { id: 'cpe', nom: 'Le ou la CPE', role: 'Il ou elle gère les situations difficiles entre élèves et peut agir vite.' },
    { id: 'infirmier', nom: 'L’infirmier·e scolaire', role: 'Il ou elle peut t’écouter en toute confidentialité si ça te pèse.' },
    { id: '3018', nom: 'Le 3018 (gratuit, confidentiel, 7 j/7 de 9 h à 23 h)', role: 'Des spécialistes t’écoutent et peuvent faire supprimer des contenus sur les réseaux.' },
  ],
  bonChoix: 'Bon choix.',
  toutes: 'Toutes ces personnes sont de bonnes options.',
}

const option = (o: OptionRecuperation) => (o.retour ? `« ${o.texte} » → retour : ${o.retour}` : `« ${o.texte} » (bonne réponse, fait avancer)`)

/**
 * Texte complet d’une action de récupération, ligne par ligne, pour l’export de relecture.
 * null pour une action qui n’a pas (encore) ses textes ici (actions des thèmes non sensibles).
 */
export function texteRecuperation(action: string, contexte: ContexteSensible | undefined): string[] | null {
  switch (action) {
    case 'soutenir': {
      const s = SOUTENIR[contexte ?? 'harcelement']
      return [`Titre : ${s.titre}`, `Question : ${s.question}`, ...s.messages.map((m) => `- ${option(m)}`), `Après envoi : ${s.envoye}`, `Rappel final : ${s.rappel}`]
    }
    case 'retirer-publication': {
      const r = RETIRER_PUBLICATION
      return [
        `Titre : ${r.titre}`,
        `Bouton : ${r.supprimer} → ${r.supprimee}`,
        `Question : ${r.question}`,
        ...r.excuses.map((e) => `- ${option(e)}`),
        `Après envoi : ${r.envoyees}`,
        `Bouton : ${r.repartager}`,
        `Rappel final : ${r.rappel}`,
      ]
    }
    case 'capture-preuve': {
      const c = CAPTURE_PREUVE
      return [`Titre : ${c.titre}`, `Consigne : ${c.consigne}`, `Bouton : ${c.capture} → ${c.captureFaite}`, `Bouton : ${c.bloquer}`, `Rappel final : ${c.rappel}`]
    }
    case 'bloquer-signaler': {
      const b = BLOQUER_SIGNALER
      return [
        `Titre : ${b.titre}`,
        `Consigne : ${b.menu} (bouton : ${b.boutonMenu})`,
        `Consigne : ${b.bloquerConsigne} (bouton : ${b.boutonBloquer})`,
        `Question : ${b.question}`,
        ...motifsSignalement(contexte).map((m) => `- ${m}`),
        `Bouton : ${b.envoyer}`,
        `Rappel final : ${b.rappel}`,
      ]
    }
    case 'demander-aide': {
      const d = DEMANDER_AIDE
      return [
        `Titre : ${d.titre}`,
        `Consigne : ${d.consigne}`,
        ...d.personnes.map((p) => `- ${p.nom} → ${d.bonChoix} ${p.role} ${d.toutes}`),
      ]
    }
    default:
      return null
  }
}
