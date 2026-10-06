import { z } from 'zod'

export const TRANCHES = ['6e', '5e-3e', 'lycee'] as const
export const trancheSchema = z.enum(TRANCHES)
export type Tranche = z.infer<typeof trancheSchema>
export const TRANCHE_LIBELLES: Record<Tranche, string> = { '6e': '6e', '5e-3e': '5e – 3e', lycee: 'Lycée' }

export const RECOVERY_ACTIONS = [
  'bloquer-signaler',
  'changer-mdp',
  'activer-2fa',
  'capture-preuve',
  'prevenir-contacts',
  'corriger-partage',
  'demander-aide',
] as const
export type RecoveryAction = (typeof RECOVERY_ACTIONS)[number]

export const ICONES = ['Fish', 'KeyRound', 'Eye', 'Users', 'Gamepad2', 'HeartHandshake', 'Newspaper', 'Wifi'] as const

export const FIL_ACTIONS = ['ouvrir', 'verifier', 'signaler', 'ignorer'] as const
export type FilAction = (typeof FIL_ACTIONS)[number]

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'identifiant attendu en minuscules-avec-tirets')
const texte = z.string().trim().min(1, 'texte vide')

export const LEVIERS = ['urgence', 'peur', 'gain', 'confiance', 'petit-montant', 'autorite', 'groupe', 'reflexe', 'flatterie', 'secret', 'honte', 'humour', 'colere'] as const
export type LevierId = (typeof LEVIERS)[number]
export type ReponseLevier = LevierId | 'autre'

const levierInfoSchema = z.object({ libelle: texte, parade: texte, questionDebrief: texte })

/** content/leviers.yaml : les 13 leviers (tous obligatoires, aucun autre) et la réponse « Autre chose ». */
export const leviersFileSchema = z.object({
  leviers: z.record(z.enum(LEVIERS), levierInfoSchema),
  autre: z.object({ libelle: texte, truc: texte, parade: texte }),
})
export type Leviers = z.infer<typeof leviersFileSchema>

const pourquoiSchema = z.array(z.object({ levier: z.enum(LEVIERS), truc: texte, parade: texte })).min(3).max(4)

function idsUniques<T>(ids: string[], ctx: z.RefinementCtx<T>, chemin: (string | number)[], quoi: string) {
  const vus = new Set<string>()
  ids.forEach((id, i) => {
    if (vus.has(id)) ctx.addIssue({ code: 'custom', message: `${quoi} en double : ${id}`, path: [...chemin, i, 'id'] })
    vus.add(id)
  })
}

export const aideSchema = z.object({
  numero: texte,
  libelle: texte,
  type: z.enum(['humaine', 'urgence', 'signalement', 'technique']),
})

export const themeSchema = z.object({
  id: slug,
  titre: texte,
  description: texte,
  icone: z.enum(ICONES),
  sensible: z.boolean().default(false),
  aides: z.array(aideSchema).default([]),
})

export const themesFileSchema = z
  .array(themeSchema)
  .min(1)
  .superRefine((themes, ctx) => idsUniques(themes.map((t) => t.id), ctx, [], 'thème'))

const messageSchema = z.object({
  de: z.enum(['contact', 'moi']),
  texte,
  texteSimple: texte.optional(),
})

export const ecranSchema = z.object({
  app: z.enum(['sms', 'chat', 'social', 'mail', 'web']),
  appNom: texte,
  contact: texte,
  sujet: texte.optional(),
  url: texte.optional(),
  messages: z.array(messageSchema).min(1),
})

const choixSchema = z.object({
  id: slug,
  texte,
  qualite: z.enum(['bon', 'risque', 'aide']),
  consequence: texte,
  consequenceSimple: texte.optional(),
})

const indiceSchema = z.object({ id: slug, libelle: texte, pertinent: z.boolean() })

const recuperationSchema = z.object({ action: z.enum(RECOVERY_ACTIONS), siChoix: z.array(slug).min(1) })

type AvecChoix = {
  choix: { id: string; qualite: 'bon' | 'risque' | 'aide' }[]
  recuperation?: { siChoix: string[] }
  pourquoi?: { levier: string }[]
}

/** Règles communes aux scénarios et aux lieux : choix « aide », récupération, bloc « pourquoi ». */
function verifierChoix<T>(s: AvecChoix, ctx: z.RefinementCtx<T>) {
  idsUniques(s.choix.map((c) => c.id), ctx, ['choix'], 'choix')
  if (!s.choix.some((c) => c.qualite === 'aide')) {
    ctx.addIssue({ code: 'custom', path: ['choix'], message: 'il faut un choix de qualité "aide" (Je demande de l’aide…)' })
  }
  s.recuperation?.siChoix.forEach((id, i) => {
    const choix = s.choix.find((c) => c.id === id)
    if (!choix) {
      ctx.addIssue({ code: 'custom', path: ['recuperation', 'siChoix', i], message: `choix inconnu : ${id}` })
    } else if (choix.qualite === 'aide') {
      ctx.addIssue({ code: 'custom', path: ['recuperation', 'siChoix', i], message: 'la récupération ne peut pas suivre le choix "aide"' })
    }
  })
  const leviersVus = new Set<string>()
  s.pourquoi?.forEach((p, i) => {
    if (leviersVus.has(p.levier)) {
      ctx.addIssue({ code: 'custom', path: ['pourquoi', i, 'levier'], message: `levier en double : ${p.levier}` })
    }
    leviersVus.add(p.levier)
  })
  if (s.pourquoi && !s.choix.some((c) => c.qualite === 'risque')) {
    ctx.addIssue({ code: 'custom', path: ['pourquoi'], message: 'le bloc pourquoi suppose un choix de qualité "risque"' })
  }
  if (!s.pourquoi && s.choix.some((c) => c.qualite === 'risque')) {
    ctx.addIssue({
      code: 'custom',
      path: ['pourquoi'],
      message: 'il faut un bloc pourquoi : un choix risqué est suivi de la question « pourquoi ? »',
    })
  }
}

export const scenarioSchema = z
  .object({
    type: z.literal('scenario'),
    id: slug,
    role: z.enum(['victime', 'temoin', 'auteur']).nullable().default(null),
    ecran: ecranSchema,
    question: texte,
    choix: z.array(choixSchema).min(2).max(4),
    indices: z.array(indiceSchema).min(2),
    explicationIndices: texte,
    aRetenir: texte,
    aRetenirSimple: texte.optional(),
    recuperation: recuperationSchema.optional(),
    pourquoi: pourquoiSchema.optional(),
  })
  .superRefine((s, ctx) => {
    verifierChoix(s, ctx)
    idsUniques(s.indices.map((i) => i.id), ctx, ['indices'], 'indice')
    if (!s.indices.some((i) => i.pertinent)) {
      ctx.addIssue({ code: 'custom', path: ['indices'], message: 'il faut au moins un indice pertinent' })
    }
  })

/** Décors dessinés des lieux d’un parcours (un SVG par décor dans src/mission/DecorScene.vue). */
export const DECORS = [
  'cour', 'cantine', 'cdi', 'classe', 'parc', 'salle-jeux', 'salon', 'chambre', 'cuisine', 'gare', 'magasin', 'rue', 'bus',
] as const
export type Decor = (typeof DECORS)[number]

const choixLieuSchema = z.object({
  id: slug,
  texte,
  qualite: z.enum(['bon', 'risque', 'aide']),
  reaction: texte,
  reactionSimple: texte.optional(),
})

/** Étape d’un parcours : un lieu de l’île, une situation racontée, un choix. */
export const lieuSchema = z
  .object({
    type: z.literal('lieu'),
    id: slug,
    lieu: texte,
    decor: z.enum(DECORS),
    guide: texte,
    guideSimple: texte.optional(),
    question: texte,
    choix: z.array(choixLieuSchema).min(2).max(4),
    aRetenir: texte,
    aRetenirSimple: texte.optional(),
    recuperation: recuperationSchema.optional(),
    pourquoi: pourquoiSchema.optional(),
  })
  .superRefine((l, ctx) => verifierChoix(l, ctx))

export const triConfigSchema = z
  .object({
    consigne: texte,
    categories: z.array(z.object({ id: slug, libelle: texte })).min(2).max(3),
    cartes: z.array(z.object({ id: slug, texte, categorie: slug, explication: texte })).min(4),
  })
  .superRefine((c, ctx) => {
    idsUniques(c.cartes.map((x) => x.id), ctx, ['cartes'], 'carte')
    c.cartes.forEach((carte, i) => {
      if (!c.categories.some((cat) => cat.id === carte.categorie)) {
        ctx.addIssue({ code: 'custom', path: ['cartes', i, 'categorie'], message: `catégorie inconnue : ${carte.categorie}` })
      }
    })
  })

export const repereConfigSchema = z
  .object({
    consigne: texte,
    titre: texte,
    lignes: z
      .array(z.object({ id: slug, texte, indice: z.boolean().default(false), explication: texte.optional() }))
      .min(3),
  })
  .superRefine((c, ctx) => {
    idsUniques(c.lignes.map((l) => l.id), ctx, ['lignes'], 'ligne')
    if (!c.lignes.some((l) => l.indice)) {
      ctx.addIssue({ code: 'custom', path: ['lignes'], message: 'il faut au moins une ligne indice' })
    }
    c.lignes.forEach((l, i) => {
      if (l.indice && !l.explication) {
        ctx.addIssue({ code: 'custom', path: ['lignes', i, 'explication'], message: 'une ligne indice doit avoir une explication' })
      }
    })
  })

export const motdepasseConfigSchema = z.object({
  consigne: texte,
  contexte: texte,
  objectif: z.enum(['solide', 'tres-solide']),
  interdits: z.array(texte).default([]),
})

export const confidentialiteConfigSchema = z
  .object({
    consigne: texte,
    appNom: texte,
    reglages: z
      .array(
        z.object({
          id: slug,
          libelle: texte,
          options: z.array(z.object({ id: slug, libelle: texte })).min(2),
          initial: slug,
          conseille: slug,
          explication: texte,
        }),
      )
      .min(3)
      .max(8),
  })
  .superRefine((c, ctx) => {
    idsUniques(c.reglages.map((r) => r.id), ctx, ['reglages'], 'réglage')
    c.reglages.forEach((r, i) => {
      idsUniques(r.options.map((o) => o.id), ctx, ['reglages', i, 'options'], 'option')
      for (const champ of ['initial', 'conseille'] as const) {
        if (!r.options.some((o) => o.id === r[champ])) {
          ctx.addIssue({ code: 'custom', path: ['reglages', i, champ], message: `option inconnue : ${r[champ]}` })
        }
      }
    })
    if (c.reglages.every((r) => r.initial === r.conseille)) {
      ctx.addIssue({ code: 'custom', path: ['reglages'], message: 'au moins un réglage doit être à changer (initial différent du conseillé)' })
    }
  })

export const VERDICTS = ['fiable', 'douteux', 'faux'] as const
export const verificationConfigSchema = z
  .object({
    consigne: texte,
    publication: z.object({
      auteur: texte,
      texte,
      date: texte.optional(),
      image: z.object({ description: texte }).optional(),
    }),
    actions: z.array(z.object({ id: slug, libelle: texte, resultat: texte })).min(2).max(5),
    verdict: z.enum(VERDICTS),
    explication: texte,
  })
  .superRefine((c, ctx) => idsUniques(c.actions.map((a) => a.id), ctx, ['actions'], 'action'))

export const permissionsConfigSchema = z
  .object({
    consigne: texte,
    apps: z
      .array(
        z.object({
          id: slug,
          nom: texte,
          description: texte,
          permissions: z
            .array(z.object({ id: slug, libelle: texte, necessaire: z.boolean(), explication: texte }))
            .min(2)
            .max(5),
        }),
      )
      .min(1)
      .max(3),
  })
  .superRefine((c, ctx) => {
    idsUniques(c.apps.map((a) => a.id), ctx, ['apps'], 'appli')
    c.apps.forEach((a, i) => idsUniques(a.permissions.map((p) => p.id), ctx, ['apps', i, 'permissions'], 'permission'))
  })

export const minijeuSchema = z.discriminatedUnion('jeu', [
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('tri'), config: triConfigSchema }),
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('repere'), config: repereConfigSchema }),
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('motdepasse'), config: motdepasseConfigSchema }),
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('confidentialite'), config: confidentialiteConfigSchema }),
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('verification'), config: verificationConfigSchema }),
  z.object({ type: z.literal('minijeu'), id: slug, jeu: z.literal('permissions'), config: permissionsConfigSchema }),
])

export const filSchema = z
  .object({
    type: z.literal('fil'),
    id: slug,
    consigne: texte,
    notifications: z
      .array(
        z.object({
          id: slug,
          appNom: texte,
          de: texte,
          texte,
          surprise: z.boolean().default(false),
          explication: texte,
        }),
      )
      .min(3),
  })
  .superRefine((f, ctx) => idsUniques(f.notifications.map((n) => n.id), ctx, ['notifications'], 'notification'))

export const etapeSchema = z.discriminatedUnion('type', [scenarioSchema, minijeuSchema, filSchema, lieuSchema])

/** Un parcours n’enchaîne que des lieux (et au plus un mini-jeu) ; un lieu n’existe que dans un parcours. */
function verifierFormat<T>(m: { type: string; format: string; etapes: { type: string }[] }, ctx: z.RefinementCtx<T>) {
  if (m.format === 'classique') {
    m.etapes.forEach((e, i) => {
      if (e.type === 'lieu') {
        ctx.addIssue({ code: 'custom', path: ['etapes', i, 'type'], message: 'une étape « lieu » n’existe que dans une mission au format parcours' })
      }
    })
    return
  }
  if (m.type === 'rappel') {
    ctx.addIssue({ code: 'custom', path: ['format'], message: 'une mission rappel ne peut pas être un parcours' })
  }
  m.etapes.forEach((e, i) => {
    if (e.type !== 'lieu' && e.type !== 'minijeu') {
      ctx.addIssue({ code: 'custom', path: ['etapes', i, 'type'], message: 'un parcours ne contient que des lieux et au plus un mini-jeu' })
    }
  })
  const lieux = m.etapes.filter((e) => e.type === 'lieu').length
  if (lieux < 4 || lieux > 6) {
    ctx.addIssue({ code: 'custom', path: ['etapes'], message: `un parcours compte 4 à 6 lieux (trouvé : ${lieux})` })
  }
  if (m.etapes.filter((e) => e.type === 'minijeu').length > 1) {
    ctx.addIssue({ code: 'custom', path: ['etapes'], message: 'un parcours contient au plus un mini-jeu' })
  }
}

export const missionSchema = z
  .object({
    id: slug,
    type: z.enum(['mission', 'rappel']).default('mission'),
    format: z.enum(['classique', 'parcours']).default('classique'),
    theme: slug.optional(),
    themesCouverts: z.array(slug).optional(),
    tranches: z.array(trancheSchema).min(1),
    titre: texte,
    resume: texte,
    duree: z.number().int().min(3).max(25),
    objectifs: z.array(texte).min(1).max(3, '3 objectifs maximum par mission'),
    competences: z.object({
      crcn: z.array(z.string().regex(/^[1-5]\.[1-4]$/, 'compétence CRCN attendue, ex. "4.1"')).min(1),
      programmes: z.array(texte).default([]),
      phare: z.boolean().default(false),
    }),
    etapes: z.array(etapeSchema).min(1),
    debrief: z.object({
      questions: z.array(texte).length(3),
      reponses: texte,
      erreursFrequentes: z.array(texte).min(1),
    }),
    fiche: z.object({ deroulement: texte, siRevelation: texte.optional() }),
  })
  .superRefine((m, ctx) => {
    idsUniques(m.etapes.map((e) => e.id), ctx, ['etapes'], 'étape')
    verifierFormat(m, ctx)
    if (m.type === 'mission') {
      if (!m.theme) ctx.addIssue({ code: 'custom', path: ['theme'], message: 'une mission doit avoir un thème' })
      return
    }
    if (!m.themesCouverts?.length) {
      ctx.addIssue({ code: 'custom', path: ['themesCouverts'], message: 'une mission rappel doit lister les thèmes couverts' })
    }
    const surprises = m.etapes.flatMap((e) => (e.type === 'fil' ? e.notifications.filter((n) => n.surprise) : []))
    if (surprises.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['etapes'],
        message: `une mission rappel doit contenir exactement une notification surprise (trouvé : ${surprises.length})`,
      })
    }
  })

export type Aide = z.infer<typeof aideSchema>
export type Theme = z.infer<typeof themeSchema>
export type Scenario = z.infer<typeof scenarioSchema>
export type TriConfig = z.infer<typeof triConfigSchema>
export type RepereConfig = z.infer<typeof repereConfigSchema>
export type MotdepasseConfig = z.infer<typeof motdepasseConfigSchema>
export type ConfidentialiteConfig = z.infer<typeof confidentialiteConfigSchema>
export type VerificationConfig = z.infer<typeof verificationConfigSchema>
export type PermissionsConfig = z.infer<typeof permissionsConfigSchema>
export type Verdict = (typeof VERDICTS)[number]
export type Minijeu = z.infer<typeof minijeuSchema>
export type Fil = z.infer<typeof filSchema>
export type Lieu = z.infer<typeof lieuSchema>
export type Etape = z.infer<typeof etapeSchema>
export type Mission = z.infer<typeof missionSchema>
export type Qualite = Scenario['choix'][number]['qualite']

export interface ContentBundle {
  generatedAt: string
  themes: Theme[]
  leviers: Leviers
  missions: Mission[]
}
