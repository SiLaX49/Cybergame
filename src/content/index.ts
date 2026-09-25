import bundle from 'virtual:content'
import { creerAcces } from './acces'

export const { contenu, getThemes, getTheme, getMission, missionsPour, rappelPour, toutesLesMissions } =
  creerAcces(bundle)
