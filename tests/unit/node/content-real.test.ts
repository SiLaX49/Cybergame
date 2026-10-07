// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContent } from '../../../scripts/build-content'
import { TRANCHES, type Mission } from '../../../src/content/schema'
import { atteint, evaluerRobustesse } from '../../../src/minigames/robustesse'
import * as TEXTES_SENSIBLES from '../../../src/mission/textesSensibles'
import { BLOQUER_SIGNALER, CAPTURE_PREUVE, DEMANDER_AIDE, RETIRER_PUBLICATION, SOUTENIR } from '../../../src/recovery/textes'

const bundle = buildContent(join(process.cwd(), 'content'))
const missions = bundle.missions.filter((m) => m.type === 'mission')
const classiques = missions.filter((m) => m.format === 'classique')
const parcours = missions.filter((m) => m.format === 'parcours')
/** Les étapes à choix d’une mission : scénarios (faux écran) et lieux (parcours). */
const etapesAChoix = (m: Mission) => m.etapes.filter((e) => e.type === 'scenario' || e.type === 'lieu')

const MARQUES_REELLES = [
  'snapchat', 'instagram', 'tiktok', 'roblox', 'robux', 'discord', 'fortnite', 'v-bucks', 'vinted', 'leboncoin',
  'la poste', 'colissimo', 'chronopost', 'amazon', 'whatsapp', 'facebook', 'youtube', 'paypal', 'iphone',
  'playstation', 'xbox', 'nintendo', 'telegram', 'vestiaire', 'steam', 'twitch', 'google', 'apple', 'pronote',
  'nordvpn', 'protonvpn', 'bitwarden', 'lastpass', 'dashlane', '1password', 'keepass', 'orange', 'sfr', 'bouygues',
  'play store', 'app store', 'google play', 'chatgpt', 'midjourney', 'sncf', 'ouigo', 'android', 'windows',
]

/** Numéros réservés à la fiction par l’ARCEP : mobile 06 39 98 xx xx, fixe 01 99 00 xx xx. */
const NUMERO = /(?:\+33\s?|\b0)[1-9](?:[\s.]?\d{2}){4}\b/g
const NUMERO_FICTIF = /^(?:\+33\s?|0)(?:6\s?39\s?98|1\s?99\s?00)/

/** Textes lus par l’élève qui n’ont pas de version simplifiée. */
function textesSansVersionSimple(m: Mission): [string, string][] {
  return m.etapes.flatMap((e): [string, string][] => {
    if (e.type === 'scenario') {
      return [
        [`${e.id}.question`, e.question],
        [`${e.id}.explicationIndices`, e.explicationIndices],
        ...e.choix.map((c): [string, string] => [`${e.id}.${c.id}.texte`, c.texte]),
        ...e.choix.filter((c) => !c.consequenceSimple).map((c): [string, string] => [`${e.id}.${c.id}.consequence`, c.consequence]),
        ...e.indices.map((i): [string, string] => [`${e.id}.${i.id}`, i.libelle]),
        ...(e.pourquoi ?? []).flatMap((p): [string, string][] => [
          [`${e.id}.pourquoi.${p.levier}.truc`, p.truc],
          [`${e.id}.pourquoi.${p.levier}.parade`, p.parade],
        ]),
      ]
    }
    if (e.type === 'lieu') {
      return [
        [`${e.id}.question`, e.question],
        ...e.choix.map((c): [string, string] => [`${e.id}.${c.id}.texte`, c.texte]),
        ...e.choix.filter((c) => !c.reactionSimple).map((c): [string, string] => [`${e.id}.${c.id}.reaction`, c.reaction]),
        ...(e.pourquoi ?? []).flatMap((p): [string, string][] => [
          [`${e.id}.pourquoi.${p.levier}.truc`, p.truc],
          [`${e.id}.pourquoi.${p.levier}.parade`, p.parade],
        ]),
      ]
    }
    if (e.type === 'fil') return e.notifications.map((n): [string, string] => [`${e.id}.${n.id}.explication`, n.explication])
    if (e.jeu === 'tri') return e.config.cartes.map((c): [string, string] => [`${e.id}.${c.id}.explication`, c.explication])
    const consigne: [string, string] = [`${e.id}.consigne`, e.config.consigne]
    if (e.jeu === 'motdepasse') return [consigne, [`${e.id}.contexte`, e.config.contexte]]
    if (e.jeu === 'confidentialite')
      return [
        consigne,
        ...e.config.reglages.flatMap((r): [string, string][] => [
          [`${e.id}.${r.id}.libelle`, r.libelle],
          [`${e.id}.${r.id}.explication`, r.explication],
          ...r.options.map((o): [string, string] => [`${e.id}.${r.id}.${o.id}`, o.libelle]),
        ]),
      ]
    if (e.jeu === 'verification') {
      const { publication } = e.config
      return [
        consigne,
        [`${e.id}.publication.texte`, publication.texte],
        [`${e.id}.publication.image`, publication.image?.description ?? ''],
        [`${e.id}.explication`, e.config.explication],
        ...e.config.actions.flatMap((a): [string, string][] => [
          [`${e.id}.${a.id}.libelle`, a.libelle],
          [`${e.id}.${a.id}.resultat`, a.resultat],
        ]),
      ]
    }
    if (e.jeu === 'permissions')
      return [
        consigne,
        ...e.config.apps.flatMap((a): [string, string][] => [
          [`${e.id}.${a.id}.description`, a.description],
          ...a.permissions.flatMap((p): [string, string][] => [
            [`${e.id}.${a.id}.${p.id}.libelle`, p.libelle],
            [`${e.id}.${a.id}.${p.id}.explication`, p.explication],
          ]),
        ]),
      ]
    return e.config.lignes.map((l): [string, string] => [`${e.id}.${l.id}.explication`, l.explication ?? ''])
  })
}
const phrases = (texte: string) => texte.split(/(?<=[.!?…])\s+/).filter(Boolean)
const mots = (phrase: string) => phrase.split(/\s+/).filter((m) => /[\p{L}\d]/u.test(m))

function textesDesFauxEcrans(m: Mission): string[] {
  return m.etapes.flatMap((e) => {
    if (e.type === 'scenario') {
      const { appNom, contact, sujet, url, messages } = e.ecran
      return [appNom, contact, sujet ?? '', url ?? '', ...messages.flatMap((x) => [x.texte, x.texteSimple ?? ''])]
    }
    if (e.type === 'lieu') return [e.lieu, e.guide, e.guideSimple ?? '', ...e.choix.flatMap((c) => [c.reaction, c.reactionSimple ?? ''])]
    if (e.type === 'fil') return e.notifications.flatMap((n) => [n.appNom, n.de, n.texte])
    if (e.jeu === 'tri') return e.config.cartes.map((c) => c.texte)
    if (e.jeu === 'motdepasse') return [e.config.contexte]
    if (e.jeu === 'confidentialite')
      return [e.config.appNom, ...e.config.reglages.flatMap((r) => [r.libelle, r.explication, ...r.options.map((o) => o.libelle)])]
    if (e.jeu === 'verification') {
      const { auteur, texte, date, image } = e.config.publication
      return [auteur, texte, date ?? '', image?.description ?? '', ...e.config.actions.flatMap((a) => [a.libelle, a.resultat])]
    }
    if (e.jeu === 'permissions') return e.config.apps.flatMap((a) => [a.nom, a.description, ...a.permissions.map((p) => p.libelle)])
    return [e.config.titre, ...e.config.lignes.map((l) => l.texte)]
  })
}

/** Comparaison des citations : casse et espaces (dont insécables) ignorées. */
const aplatir = (t: string) => t.toLowerCase().replace(/\s+/gu, ' ')

const missionsDuTheme = (theme: string) => missions.filter((m) => m.theme === theme)

describe('contenu réel', () => {
  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les faux écrans', (_id, m) => {
    const texte = textesDesFauxEcrans(m).join(' ').toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : chaque scénario a son bloc « pourquoi »', (_id, m) => {
    for (const e of etapesAChoix(m)) expect(e.pourquoi?.length ?? 0, e.id).toBeGreaterThanOrEqual(3)
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les réponses « pourquoi »', (_id, m) => {
    const texte = m.etapes
      .flatMap((e) => (e.type === 'scenario' || e.type === 'lieu' ? (e.pourquoi ?? []).flatMap((p) => [p.truc, p.parade]) : []))
      .join(' ')
      .toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les questions et les choix', (_id, m) => {
    const texte = m.etapes
      .flatMap((e) => (e.type === 'scenario' || e.type === 'lieu' ? [e.question, ...e.choix.map((c) => c.texte)] : []))
      .join(' ')
      .toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))(
    '%s : chaque citation « … » d’un « truc » figure à l’écran (et dans la lecture simplifiée en 6e)',
    (_id, m) => {
      const absentes: string[] = []
      for (const e of etapesAChoix(m)) {
        let normal: string
        let simple: string
        if (e.type === 'lieu') {
          normal = aplatir([e.guide, e.question].join(' '))
          simple = aplatir([e.guideSimple ?? e.guide, e.question].join(' '))
        } else {
          const { appNom, contact, sujet, url, messages } = e.ecran
          const commun = [appNom, contact, sujet ?? '', url ?? '', e.question]
          normal = aplatir([...commun, ...messages.map((x) => x.texte)].join(' '))
          simple = aplatir([...commun, ...messages.map((x) => x.texteSimple ?? x.texte)].join(' '))
        }
        for (const p of e.pourquoi ?? []) {
          for (const [, citation] of p.truc.matchAll(/«\s*([^»]+?)\s*»/g)) {
            const c = aplatir(citation!)
            if (!normal.includes(c)) absentes.push(`${e.id}.${p.levier} : « ${citation} » absent de l’écran`)
            else if (m.tranches.includes('6e') && !simple.includes(c)) {
              absentes.push(`${e.id}.${p.levier} : « ${citation} » absent de la lecture simplifiée`)
            }
          }
        }
      }
      expect(absentes).toEqual([])
    },
  )

  it('le choix risqué n’est pas le plus long dans plus d’un tiers des scénarios', () => {
    const scenarios = classiques.flatMap((m) => m.etapes.filter((e) => e.type === 'scenario'))
    const plusLong = scenarios.filter((s) => {
      const risque = s.choix.find((c) => c.qualite === 'risque')
      if (!risque) return false
      const n = mots(risque.texte).length
      return s.choix.every((c) => c === risque || mots(c.texte).length < n)
    })
    expect(plusLong.length, plusLong.map((s) => s.id).join(', ')).toBeLessThanOrEqual(Math.floor(scenarios.length / 3))
  })

  it('leviers.yaml : phrases de 20 mots maximum', () => {
    const textes = [
      ...Object.values(bundle.leviers.leviers).flatMap((l) => [l.libelle, l.parade]),
      bundle.leviers.autre.libelle,
      bundle.leviers.autre.truc,
      bundle.leviers.autre.parade,
      bundle.leviers.autreSensible.truc,
      bundle.leviers.autreSensible.parade,
    ]
    expect(textes.flatMap(phrases).filter((p) => mots(p).length > 20)).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : numéros de téléphone fictifs (ARCEP)', (_id, m) => {
    const numeros = textesDesFauxEcrans(m).flatMap((t) => t.match(NUMERO) ?? [])
    expect(numeros.filter((n) => !NUMERO_FICTIF.test(n))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : une espace après chaque point', (_id, m) => {
    const texte = JSON.stringify(m)
    expect(texte.match(/\p{Ll}{2}\.\p{Lu}\p{Ll}/gu) ?? []).toEqual([])
  })

  it.each(bundle.missions.filter((m) => m.tranches.includes('6e')).map((m) => [m.id, m] as const))(
    '%s (6e) : pas de phrase de plus de 20 mots sans version simplifiée',
    (_id, m) => {
      const tropLongues = textesSansVersionSimple(m).flatMap(([ou, t]) =>
        phrases(t)
          .filter((p) => mots(p).length > 20)
          .map((p) => `${ou} (${mots(p).length} mots) : ${p}`),
      )
      expect(tropLongues).toEqual([])
    },
  )

  it.each(classiques.map((m) => [m.id, m] as const))('%s : 3 ou 4 scénarios et 1 mini-jeu', (_id, m) => {
    const scenarios = m.etapes.filter((e) => e.type === 'scenario')
    expect(scenarios.length).toBeGreaterThanOrEqual(3)
    expect(scenarios.length).toBeLessThanOrEqual(4)
    expect(m.etapes.filter((e) => e.type === 'minijeu')).toHaveLength(1)
    expect(scenarios.filter((s) => s.type === 'scenario' && s.recuperation).length).toBeGreaterThanOrEqual(2)
  })

  it.each(missions.filter((m) => m.tranches.includes('6e')).map((m) => [m.id, m] as const))(
    '%s (6e) : textes simplifiés présents',
    (_id, m) => {
      for (const e of m.etapes) {
        if (e.type !== 'scenario') continue
        expect(e.aRetenirSimple, `${e.id}.aRetenirSimple`).toBeTruthy()
        e.ecran.messages.forEach((msg, i) => expect(msg.texteSimple, `${e.id}.messages.${i}`).toBeTruthy())
        e.choix
          .filter((c) => c.qualite === 'risque')
          .forEach((c) => expect(c.consequenceSimple, `${e.id}.${c.id}`).toBeTruthy())
      }
    },
  )

  it.each(TRANCHES)('phishing : au moins une mission pour la tranche %s', (t) => {
    expect(missionsDuTheme('phishing').some((m) => m.tranches.includes(t))).toBe(true)
  })

  it.each(TRANCHES)('jeux et achats : au moins une mission pour la tranche %s', (t) => {
    expect(missionsDuTheme('jeux-achats').some((m) => m.tranches.includes(t))).toBe(true)
  })

  it.each(TRANCHES)('rappel : exactement une mission rappel pour la tranche %s', (t) => {
    expect(bundle.missions.filter((m) => m.type === 'rappel' && m.tranches.includes(t))).toHaveLength(1)
  })

  it.each(['harcelement', 'rencontres'].flatMap((theme) => TRANCHES.map((t) => [theme, t] as const)))(
    '%s (thème sensible) : au moins une mission pour la tranche %s',
    (theme, t) => {
      expect(missionsDuTheme(theme).some((m) => m.tranches.includes(t))).toBe(true)
    },
  )

  const MINIJEU_DU_THEME = { comptes: 'motdepasse', 'vie-privee': 'confidentialite', desinformation: 'verification', appareils: 'permissions' } as const

  it.each(Object.keys(MINIJEU_DU_THEME).flatMap((theme) => TRANCHES.map((t) => [theme, t] as const)))(
    '%s : au moins une mission pour la tranche %s',
    (theme, t) => {
      expect(missionsDuTheme(theme).some((m) => m.tranches.includes(t))).toBe(true)
    },
  )

  it.each(Object.entries(MINIJEU_DU_THEME))('%s : chaque mission classique utilise le mini-jeu « %s »', (theme, jeu) => {
    for (const m of missionsDuTheme(theme).filter((x) => x.format === 'classique')) {
      const minijeu = m.etapes.find((e) => e.type === 'minijeu')
      expect(minijeu?.type === 'minijeu' ? minijeu.jeu : null, m.id).toBe(jeu)
    }
  })

  it.each(Object.keys(MINIJEU_DU_THEME))('%s : bon et risque ne sont pas le choix le plus long dans plus d’un tiers des scénarios', (theme) => {
    const scenarios = missionsDuTheme(theme).flatMap((m) => m.etapes.filter((e) => e.type === 'scenario'))
    for (const qualite of ['bon', 'risque'] as const) {
      const plusLong = scenarios.filter((s) => {
        const cible = s.choix.find((c) => c.qualite === qualite)
        if (!cible) return false
        const n = mots(cible.texte).length
        return s.choix.every((c) => c === cible || mots(c.texte).length < n)
      })
      expect(plusLong.length, `${qualite} : ${plusLong.map((s) => s.id).join(', ')}`).toBeLessThanOrEqual(Math.floor(scenarios.length / 3))
    }
  })

  it.each(missionsDuTheme('comptes').filter((m) => m.format === 'classique').map((m) => [m.id, m] as const))(
    '%s : l’objectif du mot de passe est atteignable avec une phrase de passe de 3 mots ou plus',
    (_id, m) => {
      const e = m.etapes.find((x) => x.type === 'minijeu' && x.jeu === 'motdepasse')
      if (e?.type !== 'minijeu' || e.jeu !== 'motdepasse') throw new Error('mini-jeu motdepasse absent')
      const { niveau } = evaluerRobustesse('tortue-rouge-sous-nuage', e.config.interdits)
      expect(atteint(niveau, e.config.objectif), niveau).toBe(true)
    },
  )

  const THEMES_PARCOURS = ['phishing', 'jeux-achats', 'comptes', 'vie-privee', 'desinformation', 'appareils']

  it.each(THEMES_PARCOURS)('%s : un parcours de l’île pour les 6e', (theme) => {
    expect(parcours.filter((m) => m.theme === theme && m.tranches.includes('6e'))).toHaveLength(1)
  })

  it.each(parcours.map((m) => [m.id, m] as const))('%s : 5 lieux, 2 récupérations ou plus, 15 min', (_id, m) => {
    const lieux = m.etapes.filter((e) => e.type === 'lieu')
    expect(lieux).toHaveLength(5)
    expect(lieux.filter((l) => l.recuperation).length).toBeGreaterThanOrEqual(2)
    expect(m.duree).toBe(15)
    expect(new Set(lieux.map((l) => l.decor)).size, 'un décor différent par lieu').toBe(lieux.length)
  })

  it.each(parcours.filter((m) => m.tranches.includes('6e')).map((m) => [m.id, m] as const))(
    '%s (6e) : récit, réactions risquées et « À retenir » simplifiés',
    (_id, m) => {
      for (const e of m.etapes) {
        if (e.type !== 'lieu') continue
        expect(e.guideSimple, `${e.id}.guideSimple`).toBeTruthy()
        expect(e.aRetenirSimple, `${e.id}.aRetenirSimple`).toBeTruthy()
        e.choix.filter((c) => c.qualite === 'risque').forEach((c) => expect(c.reactionSimple, `${e.id}.${c.id}`).toBeTruthy())
      }
    },
  )

  it.each(parcours.map((m) => [m.id, m] as const))('%s : le choix « aide » commence par « Je demande de l’aide »', (_id, m) => {
    for (const e of m.etapes) {
      if (e.type !== 'lieu') continue
      const aide = e.choix.find((c) => c.qualite === 'aide')
      expect(aide?.texte.startsWith('Je demande de l’aide'), e.id).toBe(true)
    }
  })

  it('parcours : bon et risque ne sont pas le choix le plus long dans plus d’un tiers des lieux', () => {
    const lieux = parcours.flatMap((m) => m.etapes.filter((e) => e.type === 'lieu'))
    for (const qualite of ['bon', 'risque'] as const) {
      const plusLong = lieux.filter((l) => {
        const cible = l.choix.find((c) => c.qualite === qualite)
        if (!cible) return false
        const n = mots(cible.texte).length
        return l.choix.every((c) => c === cible || mots(c.texte).length < n)
      })
      expect(plusLong.length, `${qualite} : ${plusLong.map((l) => l.id).join(', ')}`).toBeLessThanOrEqual(Math.floor(lieux.length / 3))
    }
  })

  it('les rappels sont courts et contiennent un fil d’au moins 4 notifications', () => {
    const rappels = bundle.missions.filter((m) => m.type === 'rappel')
    expect(rappels.length).toBeGreaterThan(0)
    for (const r of rappels) {
      expect(r.duree, r.id).toBeLessThanOrEqual(8)
      const fil = r.etapes.find((e) => e.type === 'fil')
      expect(fil?.type === 'fil' ? fil.notifications.length : 0, r.id).toBeGreaterThanOrEqual(4)
    }
  })

  describe('thèmes sensibles : règles éditoriales', () => {
    const SENSIBLES = ['harcelement', 'rencontres'] as const
    const missionsSensibles = missions.filter((m) => m.theme && (SENSIBLES as readonly string[]).includes(m.theme))
    const CULPABILISANT = [
      /\bta faute\b/i,
      /tu (?:n’)?aurais (?:pas |jamais )?d(?:û(?!\p{L})|u(?=\s*(?:[.,;:!?…]|$)|\s+\p{L}+(?:er|ir|re|oir)(?!\p{L})))/iu,
      /c’est bien fait|bien fait pour (?:toi|lui|elle)/i,
      /\bna(?:i|ï)(?:f|fs|ve|ves|vement)\b/i,
      /\bbête\b/i,
      /\bidiot/i,
      /tu l’as cherché/i,
      /à cause de toi/i,
      /tu aurais pu/i,
      /si tu n’avais pas/i,
    ]
    const EXPLICITE = [/\bnue?s?\b/i, /\bnudes?\b/i, /\bsexe\b/i, /\bsext/i, /\bsexy\b/i, /\bsexuel/i, /\bintime/i, /\bseins?\b/i, /\bporno/i]
    // Apostrophe droite et espaces insécables (U+00A0, U+202F) ramenées à la forme des contrôles.
    const normaliser = (t: string) => t.normalize('NFC').replace(/'/g, '’').replace(/[  ]/g, ' ')
    const culpabilisant = (t: string) => {
      const propre = normaliser(t).replace(/ce n’(?:est|était) (?:vraiment |du tout )?(?:pas|jamais)(?: du tout)?(?: de| à)? ta faute/gi, '')
      return CULPABILISANT.filter((re) => re.test(propre))
    }
    const explicite = (t: string) => EXPLICITE.filter((re) => re.test(normaliser(t)))

    it('règles : formules culpabilisantes détectées, formules bienveillantes épargnées', () => {
      for (const t of ['Tu aurais dû réfléchir', "Tu n'aurais pas dû", 'tu aurais du faire attention', 'Tu es naïf', 'Tu es naif', 'naïve', 'C’est ta faute', 'Bien fait pour toi', 'Tu l’as cherché', 'Quel idiot', 'Tu es bête', 'Tu n’aurais jamais dû', 'C’est à cause de toi', 'Tu aurais pu le voir', 'Si tu n’avais pas répondu', 'Tu aurais dû', 'C’est ta faute']) {
        expect(culpabilisant(t), t).not.toEqual([])
      }
      for (const t of ['Tu as bien fait d’en parler', 'Ce n’est pas ta faute', "Ce n'était jamais de ta faute", 'Ce n’est pas à toi la faute', 'Tu aurais du temps pour en parler', 'Un adulte te croira', 'Ce n’est vraiment pas ta faute', 'Ce n’est pas du tout ta faute', 'Ce n’était vraiment pas de ta faute', 'Ce n’est du tout pas ta faute', 'Ce n’est pas ta faute du tout', 'Ce n’est pas ta faute']) {
        expect(culpabilisant(t), t).toEqual([])
      }
    })

    it('règles : vocabulaire explicite détecté', () => {
      for (const t of ['une photo nue', 'des nudes', 'un nude', 'le sexto', 'le sexting', 'trop sexy', 'photo intime']) expect(explicite(t), t).not.toEqual([])
      expect(explicite('Une photo de classe')).toEqual([])
    })

    const scenariosDe = (m: Mission) => m.etapes.filter((e) => e.type === 'scenario')

    it('harcèlement : un scénario de chaque rôle (victime, témoin, auteur) par mission', () => {
      const manques = missionsDuTheme('harcelement').flatMap((m) => {
        const roles = new Set(scenariosDe(m).map((s) => s.role))
        return (['victime', 'temoin', 'auteur'] as const).filter((r) => !roles.has(r)).map((r) => `${m.id} : rôle ${r} absent`)
      })
      expect(manques).toEqual([])
    })

    it('rencontres : rôles victime ou témoin uniquement', () => {
      const intrus = missionsDuTheme('rencontres').flatMap((m) =>
        scenariosDe(m).filter((s) => s.role !== 'victime' && s.role !== 'temoin').map((s) => `${m.id}.${s.id} : rôle ${s.role}`),
      )
      expect(intrus).toEqual([])
    })

    it('chaque scénario sensible avec un choix risqué a une récupération', () => {
      const sans = missionsSensibles.flatMap((m) =>
        scenariosDe(m).filter((s) => s.choix.some((c) => c.qualite === 'risque') && !s.recuperation).map((s) => `${m.id}.${s.id}`),
      )
      expect(sans).toEqual([])
    })

    it('aucune formule culpabilisante dans les textes de retour', () => {
      const trouvees = missionsSensibles.flatMap((m) =>
        m.etapes.flatMap((e): string[] => {
          if (e.type === 'fil') return []
          if (e.type === 'minijeu') {
            const explications =
              e.jeu === 'tri' ? e.config.cartes.map((c) => c.explication) : e.jeu === 'repere' ? e.config.lignes.map((l) => l.explication ?? '') : []
            return explications.flatMap((t) => culpabilisant(t).map((re) => `${m.id}.${e.id} : ${re} dans « ${t} »`))
          }
          const textes: string[] =
            e.type === 'scenario'
              ? [
                  ...e.choix.flatMap((c) => [c.consequence, c.consequenceSimple ?? '']),
                  ...e.indices.map((i) => i.libelle),
                  e.explicationIndices,
                  e.aRetenir,
                  e.aRetenirSimple ?? '',
                ]
              : [...e.choix.flatMap((c) => [c.reaction, c.reactionSimple ?? '']), e.aRetenir, e.aRetenirSimple ?? '']
          textes.push(...(e.pourquoi ?? []).flatMap((p) => [p.truc, p.parade]))
          return textes.flatMap((t) => culpabilisant(t).map((re) => `${m.id}.${e.id} : ${re} dans « ${t} »`))
        }),
      )
      const debriefs = missionsSensibles.flatMap((m) => culpabilisant(m.debrief.reponses).map((re) => `${m.id}.debrief.reponses : ${re}`))
      expect([...trouvees, ...debriefs]).toEqual([])
    })

    it('aucune formule culpabilisante dans les textes des gestes et des écrans sensibles (src/)', () => {
      const chaines = (v: unknown): string[] =>
        typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(chaines) : v && typeof v === 'object' ? Object.values(v).flatMap(chaines) : []
      const textes = [
        ...chaines({ SOUTENIR, RETIRER_PUBLICATION, CAPTURE_PREUVE, BLOQUER_SIGNALER, DEMANDER_AIDE }),
        ...chaines(TEXTES_SENSIBLES),
        bundle.leviers.autreSensible.truc,
        bundle.leviers.autreSensible.parade,
      ]
      expect(textes.length).toBeGreaterThan(30)
      expect(textes.flatMap((t) => culpabilisant(t).map((re) => `${re} dans « ${t} »`))).toEqual([])
    })

    it('chaque « Si un élève révèle » sensible cite le 3018, le 119 et le 3114', () => {
      const manques = missionsSensibles.flatMap((m) =>
        ['3018', '119', '3114'].filter((n) => !new RegExp(`\\b${n}\\b`).test(m.fiche.siRevelation ?? '')).map((n) => `${m.id} : ${n} absent`),
      )
      expect(manques).toEqual([])
    })

    it('les prénoms des personnes visées ne sont jamais repris pour un auteur ou un inconnu', () => {
      // Personnes visées, ou amis à aider, dans au moins une mission sensible.
      const VISES = ['Inès', 'Théo', 'Noah', 'Lucas', 'Yanis', 'Léna', 'Clara', 'Maya', 'Nora']
      // Auteurs des moqueries, du raid, du chantage ou de la manipulation, et inconnus, mission par mission.
      const AUTEURS: Record<string, string[]> = {
        'h-6e-surnom': ['Malo', 'Kylian', 'Lisa'],
        'h-college-faux-compte': ['Kenzo', 'Anaïs'],
        'h-lycee-rumeur': ['Axel'],
        'r-6e-ami-du-jeu': ['Kiro_77', 'Max'],
        'r-college-chantage': ['jade.14', 'k4rma_x', 'zed_lv'],
        'r-lycee-webcam': ['Sam'],
      }
      const problemes = missionsSensibles.flatMap((m) => {
        const auteurs = AUTEURS[m.id] ?? []
        const texte = normaliser(JSON.stringify(m))
        // Qui parle dans un groupe (« Prénom : … »), hors titulaire du compte affiché, est un auteur ou un témoin.
        const orateurs = scenariosDe(m).flatMap((s) =>
          s.ecran.messages.flatMap((x) => (x.de === 'contact' ? [...x.texte.matchAll(/(?:^|· )(\p{Lu}[\p{L}_.\d]*) :/gu)].map((r) => r[1]!).filter((o) => o !== s.ecran.contact) : [])),
        )
        return [
          ...(m.id in AUTEURS ? [] : [`${m.id} : auteurs non déclarés dans ce test`]),
          ...auteurs.filter((a) => !texte.includes(a)).map((a) => `${m.id} : ${a} introuvable`),
          ...[...auteurs, ...orateurs]
            .filter((a) => VISES.some((v) => a.toLowerCase().includes(v.toLowerCase())))
            .map((a) => `${m.id} : ${a} reprend le prénom d’une personne visée`),
        ]
      })
      expect(problemes).toEqual([])
    })

    it('chaque fiche sensible précise que les prénoms sont fictifs', () => {
      expect(missionsSensibles.filter((m) => !m.fiche.deroulement.includes('Les prénoms sont fictifs.')).map((m) => m.id)).toEqual([])
    })

    it('chaque mission sensible cite le 3018 dans un « À retenir »', () => {
      const sans = missionsSensibles
        .filter((m) => !m.etapes.some((e) => (e.type === 'scenario' || e.type === 'lieu') && e.aRetenir.includes('3018')))
        .map((m) => m.id)
      expect(sans).toEqual([])
    })

    it('rencontres : « ce n’est pas ta faute » ; en cas de chantage, « ne paie pas » et « n’envoie rien de plus »', () => {
      const problemes = missionsDuTheme('rencontres').flatMap((m) => {
        const eleve = { ...m, fiche: undefined, debrief: undefined }
        const texte = aplatir(normaliser(JSON.stringify(eleve)))
        const p: string[] = []
        if (!texte.includes('ce n’est pas ta faute')) p.push(`${m.id} : « ce n’est pas ta faute » absent`)
        if (/chantage|paie/.test(texte)) {
          if (!texte.includes('ne paie pas')) p.push(`${m.id} : « ne paie pas » absent`)
          if (!texte.includes('n’envoie rien de plus')) p.push(`${m.id} : « n’envoie rien de plus » absent`)
        }
        return p
      })
      expect(problemes).toEqual([])
    })

    it('aucun vocabulaire explicite dans les messages des faux écrans', () => {
      const trouves = missionsSensibles.flatMap((m) =>
        scenariosDe(m).flatMap((s) =>
          s.ecran.messages
            .flatMap((x) => [x.texte, x.texteSimple ?? ''])
            .flatMap((t) => explicite(t).map((re) => `${m.id}.${s.id} : ${re} dans « ${t} »`)),
        ),
      )
      expect(trouves).toEqual([])
    })

    it('les missions de harcèlement sont des missions phares', () => {
      expect(missionsDuTheme('harcelement').filter((m) => !m.competences.phare).map((m) => m.id)).toEqual([])
    })
  })
})
