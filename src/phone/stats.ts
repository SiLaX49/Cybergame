/** Compteurs d'une publication tels qu'affichés : « 1 200 vues · 87 partages ». */
export function texteStats(s: { vues?: string; jaime?: string; partages?: string }): string {
  return [s.vues && `${s.vues} vues`, s.jaime && `${s.jaime} j’aime`, s.partages && `${s.partages} partages`]
    .filter(Boolean)
    .join(' · ')
}
