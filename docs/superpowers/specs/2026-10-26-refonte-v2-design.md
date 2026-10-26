# Refonte V2 : tableau de bord, défis et octets

- **Statut** : réalisée (branche `feat/design-v2`)
- **Origine** : maquette « Cyber Academy » fournie par Noa le 26 octobre 2026 : « je veux tout pareil, l’organisation de la page, le menu, les couleurs, le design ». Puis : « des compteurs peuvent être bien mais il faut qu’il gagne quelque chose, mets en place un système monétique dans le jeu qui permet de récompenser les gens qui réussissent mais aussi ceux qui apprennent de leur erreur, pas de base de données pour l’instant ».

## Ce qui change par rapport au cahier de conception du 24 septembre

La règle « aucun score chiffré affiché, aucun classement » est levée **pour les scores** à la demande de Noa : les octets s’affichent. Le **classement entre joueurs** reste exclu. Il demanderait des comptes, un serveur et des données d’élèves mineurs, et Noa ne veut pas de base de données pour l’instant. À la place de la colonne « Leaderboard » de la maquette, il y a un classement des îles de l’élève (contre soi-même). « Aucune donnée ne quitte l’appareil » reste vrai.

## Décisions

- **Disposition** : la maquette est reprise à l’identique. En-tête : bouclier-cadenas, « CYBER RÉFLEXES », menu Accueil / Parcours / Défis / Profil, pastille dorée de réserve, Réglages. Accueil : l’agent·e à gauche, l’île en cours avec la barre de progression en dégradé et trois tuiles colorées, le bouton « Lancer le défi du jour », puis à droite les objectifs du jour et le classement.
- **Nom** : le jeu garde le nom « Cyber Réflexes », pas « Cyber Academy ».
- **Mascotte** : l’agent·e en uniforme est le personnage choisi par l’élève (teint et coiffure). Hulotte reste dans les missions.
- **Couleurs** : le bleu nuit devient le thème par défaut. Le thème clair est repris dans les mêmes bleus. Les contrastes sont vérifiés par `palette.test.ts` : or et tuiles inclus.
- **Barème des octets** :

  | Situation | Octets |
  |---|---|
  | Mission terminée | 20 |
  | Bon réflexe | 10 |
  | Erreur réparée ou route de réparation | 8 |
  | Bon réflexe avec indice | 7 |
  | Retenté et trouvé | 6 |
  | Message piège déjoué | 10 |
  | Message piège ignoré | 5 |
  | Mini-jeu | 2 par réussite, 10 au plus |
  | Défi du jour | 30 |

  Une erreur réparée rapporte presque autant qu’un bon réflexe : c’est la demande « ceux qui apprennent de leur erreur ».
- **Pas de triche par le rejeu** : seul le meilleur gain par mission est gardé, et rejouer rapporte seulement l’amélioration.
- **Thèmes sensibles** : ils ne rapportent aucun octet et n’affichent aucun écran de gain. C’est la même logique que pour les îles calmes, « sans objet ni fête ».
- **Défi du jour** : un tirage stable selon la date locale, parmi les missions de la tranche, hors rappels et thèmes sensibles. Le bonus se gagne une fois par jour.
- **Objectifs du jour** : terminer une mission, relever le défi, réparer une erreur, gagner 100 octets. Un journal du jour est gardé dans la sauvegarde.
- **Boutique** : des titres et des écussons (affichés sur le profil), sans effet sur le jeu. Rien n’est payant.
- **Sauvegarde** : la version reste à 1. Les nouveaux champs (`octets`, `defis`, `achats`, `titre`, `journal`) ont des valeurs par défaut, donc les anciennes sauvegardes se chargent sans migration.

## Hors périmètre

- Classement entre élèves, comptes, serveur.
- Les écussons ne s’affichent pas encore sur le personnage dans les îles.
