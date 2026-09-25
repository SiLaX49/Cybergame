import { useProgress } from '@/store/useProgress'

/** Choisit la version simplifiée d'un texte quand la « lecture simplifiée » est active. */
export function useTexte() {
  const store = useProgress()
  return (texte: string, texteSimple?: string): string =>
    store.etat.reglages.lectureSimple && texteSimple ? texteSimple : texte
}
