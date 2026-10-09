import { computed, nextTick, ref, watch, type Ref } from 'vue'
import { useTexte } from '@/ui/useTexte'
import type { EcranTelephone } from './types'

export type EtatTelephone = 'verrouille' | 'accueil' | 'appli'

/** Début d’un texte pour une notification : 60 caractères au plus, « … » compris. */
export const apercu = (texte: string, max = 60) => (texte.length <= max ? texte : `${texte.slice(0, max - 1).trimEnd()}…`)

/** État de départ : verrouillé avec `entree` (sauf choix déjà joué ou fil), appli ouverte sinon. */
export const etatDepart = (p: { entree?: boolean; ecran: EcranTelephone; choixJoue?: string | null }): EtatTelephone =>
  p.entree && !p.choixJoue && p.ecran.app !== 'verrouillage' ? 'verrouille' : 'appli'

/**
 * Entrée par notification : verrouillé au départ (sauf choix déjà joué), l’appli s’ouvre depuis la notification ou
 * l’écran d’accueil. Un nouvel écran reverrouille ; un choix joué ouvre l’appli ; « Rejouer » la laisse ouverte.
 */
export function useEntree(props: { entree: boolean; ecran: EcranTelephone; choixJoue: string | null }, zone: Ref<HTMLElement | null>) {
  const t = useTexte()
  const depart = () => etatDepart(props)
  const etat = ref<EtatTelephone>(depart())
  /** Zoom d’ouverture : seulement quand l’élève ouvre l’appli. */
  const zoom = ref(false)
  watch([() => props.ecran, () => props.entree], () => {
    etat.value = depart()
    zoom.value = false
  })
  watch(
    () => props.choixJoue,
    (c) => {
      if (c) etat.value = 'appli'
    },
  )

  const notification = computed(() => {
    const e = props.ecran
    if (e.app === 'verrouillage') return null
    // Premier message du contact : jamais celui de l’élève attribué au contact.
    const m = e.messages.find((x) => x.de === 'contact') ?? e.messages[0]!
    return { appNom: e.appNom, de: e.contact, heure: m.heure, texte: e.notification ?? apercu(t(m.texte, m.texteSimple)) }
  })

  /** Ce que montre l’écran (thème `data-app`) et son nom pour les lecteurs d’écran. */
  const dataApp = computed(() => (etat.value === 'verrouille' ? 'verrouillage' : etat.value === 'accueil' ? 'accueil' : props.ecran.app))
  const nomApp = computed(() => {
    if (dataApp.value === 'verrouillage') return 'écran verrouillé'
    return dataApp.value === 'accueil' ? 'écran d’accueil' : (props.ecran as { appNom: string }).appNom
  })

  /** Change d’état sur un geste de l’élève : le focus va sur la zone de l’écran (le bouton touché disparaît). */
  async function aller(cible: EtatTelephone) {
    etat.value = cible
    zoom.value = cible === 'appli'
    await nextTick()
    zone.value?.focus()
  }

  return { etat, zoom, notification, dataApp, nomApp, aller }
}
