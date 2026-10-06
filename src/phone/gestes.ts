import {
  Ban, CreditCard, Download, EyeOff, Flag, HandHelping, Link, LogIn, PackagePlus, Reply, SearchCheck, Share2, Trash2,
} from '@lucide/vue'
import type { Component } from 'vue'
import type { Geste, Qualite } from '@/content/schema'

/** Icône et bannière de chaque geste. Formulations neutres : le débrief dit si c'était un bon choix. */
export const GESTES_TELEPHONE: Record<Geste, { icone: Component; banniere: string }> = {
  repondre: { icone: Reply, banniere: 'Message envoyé' },
  'ouvrir-lien': { icone: Link, banniere: 'Lien ouvert' },
  'se-connecter': { icone: LogIn, banniere: 'Connexion en cours…' },
  telecharger: { icone: Download, banniere: 'Téléchargement lancé' },
  installer: { icone: PackagePlus, banniere: 'Installation lancée' },
  payer: { icone: CreditCard, banniere: 'Paiement envoyé' },
  partager: { icone: Share2, banniere: 'Publication partagée' },
  verifier: { icone: SearchCheck, banniere: 'Tu vérifies par un autre moyen' },
  bloquer: { icone: Ban, banniere: 'Contact bloqué' },
  signaler: { icone: Flag, banniere: 'Signalement envoyé' },
  ignorer: { icone: EyeOff, banniere: 'Message ignoré' },
  supprimer: { icone: Trash2, banniere: 'Message supprimé' },
  'demander-aide': { icone: HandHelping, banniere: 'Tu poses ton téléphone pour demander de l’aide' },
}

/** Le schéma impose un geste à chaque choix sauf « aide », qui demande de l'aide par défaut. */
export const gesteDuChoix = (c: { geste?: Geste; qualite: Qualite }): Geste => c.geste ?? 'demander-aide'
