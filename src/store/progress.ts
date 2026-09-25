import { z } from 'zod'
import { trancheSchema } from '@/content/schema'

export const STORAGE_KEY = 'cyber-reflexes:v1'
export const MODES = ['solo', 'binome', 'classe'] as const
export type Mode = (typeof MODES)[number]

const reglagesSchema = z.object({
  taille: z.enum(['normal', 'grand', 'tres-grand']).default('normal'),
  interligne: z.enum(['normal', 'large']).default('normal'),
  lectureSimple: z.boolean().default(false),
  animations: z.boolean().default(true),
  chrono: z.boolean().default(false),
})

export const progressSchema = z.object({
  version: z.literal(1),
  tranche: trancheSchema.nullable().default(null),
  mode: z.enum(MODES).nullable().default(null),
  reglages: reglagesSchema.default(() => reglagesSchema.parse({})),
  missions: z
    .record(z.string(), z.object({ termineeLe: z.string(), badges: z.array(z.string()), choix: z.record(z.string(), z.string()) }))
    .default({}),
  rappels: z
    .record(
      z.string(),
      z.object({
        faitLe: z.string(),
        fois: z.number().int().min(1),
        resultatSurprise: z.enum(['verifie', 'ignore', 'signale', 'piege']).nullable(),
      }),
    )
    .default({}),
})

export type Progress = z.infer<typeof progressSchema>
export type Reglages = Progress['reglages']

export const progressionVide = (): Progress => progressSchema.parse({ version: 1 })

/** Renvoie localStorage s'il est réellement utilisable, sinon null (navigation privée, blocage…). */
export function stockageSur(): Storage | null {
  try {
    const s = globalThis.localStorage
    const cle = '__cyber-reflexes-test__'
    s.setItem(cle, '1')
    s.removeItem(cle)
    return s
  } catch {
    return null
  }
}

/** Migrations des anciennes versions : clé = version d'origine, valeur = données converties vers la suivante. */
const MIGRATIONS: Record<number, (ancien: Record<string, unknown>) => Record<string, unknown>> = {}

export function migrer(brut: unknown): Progress | null {
  if (typeof brut !== 'object' || brut === null) return null
  let donnees = brut as Record<string, unknown>
  let version = typeof donnees.version === 'number' ? donnees.version : Number.NaN
  while (version !== 1) {
    const migration = MIGRATIONS[version]
    if (!migration) return null
    donnees = migration(donnees)
    version = donnees.version as number
  }
  const res = progressSchema.safeParse(donnees)
  return res.success ? res.data : null
}

export function chargerProgression(storage: Storage | null): Progress {
  if (!storage) return progressionVide()
  try {
    const texte = storage.getItem(STORAGE_KEY)
    return (texte && migrer(JSON.parse(texte))) || progressionVide()
  } catch {
    return progressionVide()
  }
}

export function sauverProgression(storage: Storage | null, p: Progress): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p))
    return true
  } catch {
    return false
  }
}

export function effacerProgression(storage: Storage | null): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // stockage indisponible : rien à effacer
  }
}
