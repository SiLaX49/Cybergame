import { watchEffect, type WatchStopHandle } from 'vue'
import type { ProgressStore } from '@/store/useProgress'

/** Reporte réglages et mode sur <html> (data-*), lus par tokens.css et base.css. */
export function appliquerReglages(store: ProgressStore, racine: HTMLElement = document.documentElement): WatchStopHandle {
  return watchEffect(() => {
    const r = store.etat.reglages
    racine.dataset.taille = r.taille
    racine.dataset.interligne = r.interligne
    racine.dataset.animations = r.animations ? 'on' : 'off'
    racine.dataset.theme = r.theme
    racine.dataset.mode = store.etat.mode ?? 'solo'
  })
}
