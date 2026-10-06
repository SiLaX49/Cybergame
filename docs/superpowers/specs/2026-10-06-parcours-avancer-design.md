# Cyber Réflexes : parcours, n’avancer que sur une bonne réponse (complément)

- **Date** : 2026-10-06
- **Statut** : à valider
- **Prérequis** : parcours « îles » livrés sur `main` (PR #4, `2026-10-05-parcours-iles-design.md`)
- **Origine** : la demande initiale était « des personnages qui avancent, et qui n’avancent que si tu donnes une bonne réponse ». La version livrée fait avancer l’élève même après un choix risqué, sans personnage ni île dessinée. Ce complément ajoute ce qui manque, en réutilisant le code déjà écrit et relu sur la branche `feat/parcours` (moteur de réessai, choix du personnage, scène de l’île).

## 1. Ce qui change pour l’élève

### 1.1 On n’avance que sur une bonne réponse
Dans un lieu de parcours (et seulement là) :
- choix `bon` ou `aide` : réaction, « À retenir », puis **Continuer** : on passe au lieu suivant (comme aujourd’hui) ;
- choix `risque` : « pourquoi », réaction avec « Ce qui a marché sur toi », puis le geste de récupération s’il est prévu, et **on reste sur place** : le seul bouton est **Réessayer** ;
- au nouvel essai, le choix déjà essayé est **barré et désactivé**, avec la mention « déjà essayé » (texte, pas seulement visuel) ;
- pas de fin de partie : l’élève finit toujours par trouver un choix qui fait avancer (il reste au moins `bon` et `aide`).
- « Rejouer ce lieu » après un bon choix et « Passer ce lieu » (thèmes sensibles) restent inchangés.

Les missions classiques (faux téléphone) ne changent pas.

### 1.2 Le personnage
- Au tout premier parcours, l’élève choisit son personnage parmi 4 (dessins SVG, chacun décrit par un texte court, sans genre imposé). Le choix est mémorisé sur l’appareil et modifiable dans les réglages.

### 1.3 L’île et le personnage qui saute
- En haut d’un parcours : l’île du thème (couleurs, motif de fond, objet d’arrivée), une plateforme par étape du parcours (4 à 6, mini-jeu compris) plus l’arrivée, le petit dessin du lieu sur chaque plateforme, et le personnage sur la plateforme de l’étape en cours.
- Bonne réponse → le personnage saute sur la plateforme suivante (animation CSS, supprimée si le réglage « animations » est désactivé ou `prefers-reduced-motion`). Choix risqué → il reste sur place.
- Texte visible : « Étape 2 sur 5 : la cour » ; à la fin : « Arrivée ! Tu as gagné … ». Le dessin est décoratif.
- Les îles reprennent les noms des parcours livrés : île aux hameçons (🛡️ le bouclier), île aux pièces d’or (🏆 le trophée), île des clés (🔐 le coffre-fort), île aux secrets (🕶️ la cape d’invisibilité), île aux rumeurs (🔍 la loupe), île aux antennes (📡 l’antenne sûre).
- La liste « chemin de l’île » (`CheminIle`) reste en dessous : elle donne l’état de chaque lieu en texte.

## 2. Technique

### 2.1 Moteur (`src/engine/mission-runner.ts`)
- `LieuResultat` gagne `essais: string[]` (choix risqués déjà essayés).
- Sur un lieu : `choisir` refuse un choix déjà essayé (`RunError`).
- `continuer` en phase `consequence` : après `bon`/`aide`, comportement actuel (récupération éventuelle, puis lieu suivant) ; après `risque`, refusé s’il n’y a pas de récupération à faire, sinon passe à la récupération.
- `recuperation-faite` après un choix risqué sur un lieu : retour en phase `situation` du même lieu (au lieu du lieu suivant).
- Nouvel événement réutilisé : `rejouer` en phase `consequence` après un choix risqué = **Réessayer** : retour en `situation`, le choix ajouté à `essais`, le levier conservé.
- Le résultat garde le dernier choix ; `qualite` finale = celle du choix qui a fait avancer. Badges : « Réflexe vérif » exige aucun essai risqué sur les lieux ; « Explorateur·rice » inchangé.

### 2.2 Interface
- `ReactionPanel.vue` : après un choix risqué, un seul bouton « Réessayer » (ou « Continuer » vers la récupération s’il y en a une, puis retour au lieu) ; après bon/aide, inchangé.
- `ChoixList.vue` : prop `essayes` (choix barrés, désactivés, « (déjà essayé) »).
- Repris de `feat/parcours` : `src/parcours/personnages.ts`, `PersonnageG.vue`, `ChoixPersonnage.vue` (prop `name`), champ `personnage` du stockage (sans changer de version), `choisirPersonnage`, réglage dans `ReglagesPanel` ; `src/parcours/iles.ts` (noms alignés sur le contenu livré) et `ParcoursScene.vue`, adaptée à 4-6 étapes et aux 13 décors de `DECORS` (emoji par décor), une étape mini-jeu ayant sa propre plateforme.
- `MissionPage.vue` : choix du personnage au premier parcours, scène au-dessus de `CheminIle`, position = étape courante (arrivée à la fin).

### 2.3 Contenu
Aucun nouveau parcours. Relecture des 6 parcours livrés pour la nouvelle mécanique : une réaction à un choix risqué ne doit plus dire « tu continues » ou laisser croire qu’on passe au lieu suivant ; vérifier que le choix risqué n’est pas repérable à sa forme (longueur, tournure) maintenant qu’il bloque.

## 3. Tests
- Moteur : avancer sur bon/aide, rester sur risque, Réessayer, choix déjà essayé refusé, récupération puis retour au lieu, double clic, badges.
- Composants : `ChoixList` barré, `ReactionPanel` (Réessayer seul après un piège), scène (n étapes, position, arrivée), choix du personnage, réglages.
- Intégration : un parcours joué avec une erreur, la récupération, un nouvel essai, puis l’arrivée.
- E2E : même scénario dans le navigateur, parcours au clavier, audit axe du choix du personnage et de la scène.

## 4. Hors périmètre
- La branche `feat/parcours` n’est pas fusionnée : elle sert de source au code repris, puis elle est supprimée. Ses 6 parcours ne sont pas repris (ceux de `main` restent).
- Carte des îles à l’accueil (partie B), parcours 5e-3e et lycée.
