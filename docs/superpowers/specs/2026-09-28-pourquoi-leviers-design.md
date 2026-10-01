# Cyber Réflexes : « Pourquoi as-tu fait ce choix ? » (leviers de manipulation)

- **Date** : 2026-09-28
- **Statut** : à valider
- **Prérequis** : étape 1 livrée (`docs/superpowers/specs/2026-09-24-cyber-reflexes-design.md`)

## 1. Objectif

Rendre le jeu plus concret en **partant du principe qu'un enfant peut vraiment céder** : payer, donner un code, faire ce qu'un adulte averti ne ferait pas. Au lieu de traiter le choix risqué comme une « mauvaise réponse », le jeu demande **pourquoi** l'élève l'a fait, puis lui montre que l'arnaqueur a justement joué sur cette raison, et lui donne une parade concrète.

Deux publics :
- **l'élève** reçoit une réponse personnalisée à sa raison ;
- **l'adulte** dispose, en fin de mission, du récapitulatif des raisons qui ont fonctionné, pour animer le débrief (en mode classe, c'est la raison votée par la classe).

### Critères de succès
- Après tout choix `risque`, l'élève répond à « Qu'est-ce qui t'a donné envie de le faire ? » avant de voir la conséquence.
- La conséquence affiche une réponse **propre à la raison choisie**, en deux parties : le truc de l'arnaqueur, puis la parade.
- La fin de mission liste les leviers qui ont fonctionné, avec leur parade générale.
- Les choix `risque` des 21 scénarios sont réécrits pour être réellement tentants, formulés comme la pensée d'un ado.
- Aucune nouvelle donnée n'est stockée ; aucune requête réseau ; accessibilité maintenue (clavier, focus, lecteur d'écran).

## 2. Les leviers

Une liste commune, définie dans `content/leviers.yaml` :

| id | Libellé côté élève | Levier |
|---|---|---|
| `urgence` | Il fallait faire vite | urgence, délai, menace de perte imminente |
| `peur` | J’avais peur de perdre mon compte ou d’avoir des problèmes | peur, menace |
| `gain` | C’était trop tentant | cadeau, gain, offre exceptionnelle |
| `confiance` | Ça venait de quelqu’un que je connais | confiance (ami, proche, compte connu) |
| `petit-montant` | C’était pas cher, pas grave | petit montant, « ça ne coûte rien » |
| `autorite` | Ça avait l’air officiel | autorité (logo, support, banque, école) |
| `groupe` | Les autres le font aussi | pression du groupe, preuve sociale |
| `reflexe` | Je n’ai pas vraiment réfléchi | automatisme, fatigue, habitude |

Pour chaque levier, le fichier donne : `libelle` (côté élève), `parade` (parade générale en une ligne, affichée en fin de mission) et `questionDebrief` (pour la fiche enseignant). Il définit aussi `autre` : le libellé « Autre chose / je ne sais pas » et sa réponse générique (`truc` + `parade`).

## 3. Expérience

### 3.1 Scénario
1. **Situation et choix** : inchangés, sauf le texte des choix `risque`, réécrit pour tenter vraiment (voir 3.5).
2. **Si le choix est `risque`** → nouvelle phase **« pourquoi »** :
   - titre : « Qu’est-ce qui t’a donné envie de le faire ? » ;
   - phrase d’accroche non culpabilisante : « Beaucoup de gens auraient fait pareil. Choisis ce qui te ressemble le plus. » ;
   - les 3 ou 4 leviers prévus pour ce scénario, dans un ordre mélangé mais stable (même utilitaire que pour les choix), puis « Autre chose / je ne sais pas » toujours en dernier ;
   - **une seule** raison ; en mode **classe**, on vote puis l’adulte valide (« Valider la raison de la classe »), comme pour les choix ; en mode **binôme**, l’invitation à discuter est affichée.
3. **Si le choix est `bon` ou `aide`** → phase **« indices »**, inchangée.
4. **Conséquence** : après un choix `risque`, l’encadré **« Ce qui a marché sur toi »** affiche la réponse du levier choisi (`truc`, puis `parade` précédée de « Ta parade : »), ou la réponse générique si « Autre ». Les vrais indices sont toujours listés (sans la mention « tu l’avais coché »), suivis de « À retenir ».
5. **Récupération** : inchangée.

### 3.2 Fin de mission
Nouveau bloc **« Ce qui t’a fait craquer »** :
- s’il y a eu au moins un levier : la liste des leviers choisis (sans doublon, dans l’ordre d’apparition), chacun avec sa parade générale ;
- sinon : « Aucun piège n’a marché sur toi cette fois. Les leviers à surveiller : » suivi des libellés des leviers présents dans la mission.

### 3.3 Badges
- « Œil de lynx » : calculé uniquement sur les scénarios non passés dont le choix n’était pas `risque` (ceux où l’on a désigné des indices) ; non attribué s’il n’y en a aucun.
- Les autres badges sont inchangés. Aucun badge ne récompense le fait d’avoir cédé.

### 3.4 Enseignant
- **Fiche mission** : une section « Leviers travaillés » liste, par scénario, les leviers et la `questionDebrief` de chacun.
- **Version papier** : sous chaque situation, « Si tu as choisi le piège, pourquoi ? » suivi d’une case par levier du scénario et « ☐ Autre ». Le corrigé ajoute, par levier, le truc et la parade.

### 3.5 Réécriture des choix `risque`
Chaque choix `risque` est reformulé comme la pensée réelle d’un ado de la tranche (sa justification intérieure), jamais comme une évidence : « C’est Maxime, il est dans ma classe : je lui fais confiance et je mets mon mot de passe. » plutôt que « Je clique sur le lien douteux. » Les règles d’écriture de l’étape 1 s’appliquent (tutoiement, non culpabilisant, 6e ≤ 20 mots par phrase, marques fictives).

## 4. Technique

### 4.1 Contenu
- `content/leviers.yaml` : validé par un nouveau schéma Zod `leviersFileSchema` (les 8 ids exactement, plus `autre`).
- Scénario : nouveau bloc
  ```yaml
  pourquoi:
    - levier: urgence
      truc: "Le délai de 24 h est là exprès : quand on se dépêche, on ne vérifie pas."
      parade: "Un vrai service te laisse le temps. Plus on te presse, plus tu ralentis."
    - …
  ```
  3 ou 4 entrées, leviers connus et uniques. **Obligatoire** si le scénario a au moins un choix `risque` (tous les scénarios actuels en ont un).
- `ContentBundle` gagne `leviers` ; `creerAcces` expose `getLeviers()`.
- Tests de contenu réel : bloc `pourquoi` présent et valide pour chaque scénario ; 6e ≤ 20 mots par phrase dans `truc` et `parade` ; marques réelles interdites aussi dans ces champs.

### 4.2 Moteur (`src/engine/mission-runner.ts`)
- `PhaseScenario` gagne `'pourquoi'`.
- `choisir` : phase suivante `pourquoi` si le choix est `risque`, sinon `indices`.
- Nouvel événement `{ type: 'expliquer'; levier: LevierId | 'autre' }`, valide seulement en phase `pourquoi` ; un levier absent du bloc `pourquoi` du scénario (hors `autre`) lève `RunError`.
- `ScenarioResultat` gagne `levier: LevierId | 'autre' | null` (null hors chemin risqué) ; sur le chemin risqué, `indicesChoisis` est vide.
- `rejouer`, `passer`, récupération : inchangés. Événements périmés : `RunError` (ignorés par la page, comme aujourd’hui).
- Nouvelle fonction `leviersDuRun(mission, etat): (LevierId | 'autre')[]` (ordre d’apparition, sans doublon) pour la fin de mission.
- `calculerBadges` : règle « Œil de lynx » mise à jour (3.3).

### 4.3 Interface
- Nouveau composant `src/mission/PourquoiForm.vue` (props `scenario`, `mode`, leviers du contenu ; émet `expliquer`) ; boutons réels, `data-levier` sur chaque bouton pour les tests E2E.
- `ScenarioStep.vue` : titre de phase « Qu’est-ce qui t’a donné envie de le faire ? » et rendu de `PourquoiForm` ; focus sur le titre au changement de phase (mécanisme existant).
- `ConsequencePanel.vue` : encadré « Ce qui a marché sur toi » ; plus de mention « tu l’avais coché » sur le chemin risqué.
- `FinMission.vue` : bloc « Ce qui t’a fait craquer ».
- `FicheMissionPage.vue`, `PlanBPage.vue` : voir 3.4.

### 4.4 Stockage
Inchangé : les leviers ne sont pas conservés d’une session à l’autre.

## 5. Tests
- **Unitaires** : schéma (bloc `pourquoi` obligatoire, leviers inconnus/dupliqués refusés, `leviers.yaml`), moteur (branche `pourquoi`, `expliquer`, levier invalide, `rejouer`, `leviersDuRun`, badge Œil de lynx), composants (`PourquoiForm` solo/classe/binôme, encadré de conséquence, fin de mission avec et sans levier, fiche, version papier), contenu réel.
- **E2E** : le test « un choix risqué mène à un geste de récupération » passe par l’étape « pourquoi » (choix d’un levier, vérification de l’encadré) ; audit axe de l’étape « pourquoi » et de la conséquence associée ; le parcours générique (choix `aide`) est inchangé.

## 6. Hors périmètre
- Mémoriser les leviers d’une mission à l’autre (« ton point faible »), statistiques de classe agrégées (pas de serveur).
- Plusieurs raisons par réponse, réponse en texte libre.
- Nouveaux thèmes (étape 2).
