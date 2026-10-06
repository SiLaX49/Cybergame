# Cyber Réflexes : les parcours « îles » (6e)

- **Date** : 2026-10-05
- **Statut** : livré sur `claude/blissful-shannon-8kh1g9`
- **Prérequis** : étapes 1 et 2 et évolution « pourquoi » livrées

## 1. Objectif

Proposer aux 6e un second format de mission, plus narratif et plus léger que le faux téléphone : **une traversée d’île**. Chaque thème non sensible a son île (l’île des clés pour les comptes, l’île aux hameçons pour le phishing…). L’élève avance de lieu en lieu (la cour, la cantine, le CDI, la gare…). À chaque lieu, un court récit pose une situation de la vie réelle ou numérique, puis l’élève choisit quoi faire.

Différences avec une mission classique :
- pas de faux écran : la situation est **racontée** (champ `guide`) et illustrée par un **décor** dessiné (SVG décoratif) ;
- pas d’étape « indices » : après le choix, on passe directement à la réaction (ou au « pourquoi » si le choix était risqué) ;
- une **carte du chemin** montre les lieux déjà visités, le lieu actuel et ceux à venir.

Ce qui ne change pas : choix `bon` / `risque` / `aide`, bloc `pourquoi` (leviers), « À retenir », gestes de récupération, modes Solo / Binôme / Classe entière, lecture simplifiée, badges, débrief, fiche enseignant et plan B papier, hors ligne.

### Critères de succès
- 6 parcours 6e, un par thème non sensible (phishing, jeux et achats, comptes, vie privée, désinformation, appareils), de 5 lieux chacun.
- Un parcours se joue entièrement au clavier et passe l’audit axe (aucune violation critique ou sérieuse).
- Toutes les règles de contenu existantes s’appliquent aux lieux (marques fictives, 6e ≤ 20 mots par phrase sans version simplifiée, citations des `truc` présentes dans le récit, longueur des choix équilibrée).
- Les missions classiques sont inchangées.

## 2. Format YAML

```yaml
id: c-6e-parcours
theme: comptes
format: parcours          # classique (par défaut) | parcours
tranches: ['6e']
titre: La traversée de l’île des clés
# … resume, duree, objectifs, competences, debrief, fiche : comme une mission classique
etapes:
  - type: lieu
    id: inscription
    lieu: Le CDI           # nom affiché du lieu
    decor: cdi             # décor dessiné (liste fermée, voir DECORS dans schema.ts)
    guide: 'Récit de la situation, à la 2e personne.'
    guideSimple: 'Version courte (obligatoire en 6e).'
    question: Que fais-tu ?
    choix:                  # 2 à 4, dont un choix « aide »
      - { id: ecrit, texte: '…', qualite: risque, reaction: '…', reactionSimple: '…' }
      - { id: pseudo, texte: '…', qualite: bon, reaction: '…' }
      - { id: aide, texte: 'Je demande de l’aide…', qualite: aide, reaction: '…' }
    pourquoi: [ … ]         # obligatoire si un choix est risqué (3 ou 4 leviers)
    aRetenir: '…'
    aRetenirSimple: '…'
    recuperation: { action: changer-mdp, siChoix: [ecrit] }   # optionnel
```

Règles (schéma) : un parcours ne contient que des étapes `lieu` (4 à 6) et au plus un mini-jeu ; une étape `lieu` n’existe que dans un parcours ; un rappel n’est jamais un parcours. Les règles d’un scénario s’appliquent au lieu : un choix `aide`, `pourquoi` si et seulement si un choix est risqué, leviers sans doublon, récupération qui ne suit jamais le choix `aide`.

Règles (tests de contenu) : au moins 2 lieux avec récupération par parcours ; en 6e, `guideSimple`, `aRetenirSimple` et `reactionSimple` (choix risqués) obligatoires ; chaque thème non sensible a un parcours 6e.

## 3. Moteur
- `LieuResultat` (`choixId`, `qualite`, `levier`, `recuperationFaite`, `passe`).
- Phases d’un lieu : `situation` → (`pourquoi` si risqué) → `consequence` → (`recuperation`) → lieu suivant. « Rejouer » et « Passer » comme un scénario.
- Badges : « Réflexe vérif » et « Réparateur·rice » tiennent compte des lieux ; nouveau badge « Explorateur·rice » (toute l’île traversée sans passer de lieu).

## 4. Interface
- `LieuStep.vue` : décor + nom du lieu, récit, puis choix / pourquoi / réaction / récupération. Focus sur l’étape à son arrivée, puis sur le titre à chaque phase.
- `ReactionPanel.vue` : verdict, ton choix, réaction, « ce qui a marché sur toi », « À retenir », Rejouer / Continuer.
- `DecorScene.vue` : un SVG décoratif par décor (`aria-hidden`), le nom du lieu étant donné en texte.
- `CheminIle.vue` : liste ordonnée des lieux (visité, ici, à venir), état donné en texte et pas seulement par la couleur.
- Carte des thèmes : mention « Parcours » à côté du titre. Fiche enseignant : format et leviers travaillés. Plan B : récit, question, choix et corrigé de chaque lieu.

## 5. Hors périmètre
- Parcours pour les 5e – 3e et le lycée.
- Parcours des thèmes sensibles (voir la spec de l’étape 3).
- Carte de l’île interactive (navigation libre entre les lieux) : le chemin reste linéaire.
