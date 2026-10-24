# Cyber Réflexes : parcours collège à deux routes

- **Date** : 2026-10-18
- **Statut** : à valider
- **Prérequis** : parcours « îles » 6e, parcours « on n’avance que sur une bonne réponse », carte de l’archipel, refonte visuelle livrés
- **Origine** : projet 2 de la partie B (les îles se remplissent pour les autres niveaux). Choix de Noa : **5e – 3e d’abord** (le lycée fera une PR suivante) ; **3 nouveaux décors** ; parcours collège avec **pièges plus subtils**, **vie de groupe et réseaux**, **sans version simplifiée obligatoire** ; **vrais embranchements** sous la forme **« deux bonnes routes »** : la réponse `bon` et la réponse `aide` mènent à des lieux différents, qui se rejoignent à la fin.

## 1. Objectif

Donner aux 5e – 3e un parcours par île (6 îles non sensibles), plus mûr que ceux des 6e, et où le choix compte : selon que l’élève règle la situation lui-même ou demande de l’aide, il ne vit pas la même suite. Les deux routes sont bonnes ; le jeu ne laisse jamais entendre que l’une vaut mieux que l’autre.

### Critères de succès
- 6 parcours `tranches: ['5e-3e']`, un par île non sensible (`phishing`, `comptes`, `vie-privee`, `jeux-achats`, `desinformation`, `appareils`), chacun avec une bifurcation et deux routes de 5 lieux.
- Les parcours 6e sont inchangés (linéaires).
- Sur l’archipel en 5e – 3e : sacoche, objets et « Parcours » apparaissent d’eux-mêmes (aucun changement de la carte).
- Un parcours à deux routes se joue entièrement au clavier, dans les modes Solo, Binôme et Classe entière, et passe l’audit axe en clair et en sombre.
- Fiche enseignant, plan B papier et export de relecture couvrent les 7 lieux et les deux routes.
- Toutes les règles de contenu existantes restent vertes ; les nouvelles règles de la section 5 sont testées.

## 2. Modèle : les routes

### 2.1 Forme
```
1 → 2 ─┬─(bon)── 3a → 4a ─┐
       └─(aide)─ 3b → 4b ─┴→ 5
```
- Une **bifurcation** est un lieu dont le choix `bon` et le choix `aide` mènent à des lieux différents. Un choix `risque` fait toujours **rester sur place et réessayer** (règle actuelle des parcours).
- Toutes les routes d’un parcours ont **la même longueur** (4 à 6 lieux) et finissent sur **le même dernier lieu**. La scène de l’île, les pas du personnage et le compteur « Lieu *n* sur *m* » restent donc valables.
- Un parcours peut contenir au plus un mini-jeu, comme aujourd’hui ; il est alors une étape commune aux deux routes (avant la bifurcation ou après la jonction).

### 2.2 Format YAML
Les lieux restent écrits dans l’ordre du fichier. Deux champs optionnels :
- `suite: <id>` sur un **choix non risqué** : étape suivante si ce choix est fait ;
- `suite: <id>` sur un **lieu** (ou un mini-jeu) : étape suivante pour toutes ses bonnes réponses qui n’ont pas leur propre `suite`.
- Sans `suite`, l’étape suivante est celle qui suit dans le fichier. La dernière étape du fichier est l’arrivée.

Exemple (extrait) :
```yaml
etapes:
  - { type: lieu, id: dm, … }
  - type: lieu
    id: tournoi
    choix:
      - { id: qr, qualite: risque, … }
      - { id: verifie, qualite: bon, suite: compte-officiel, … }
      - { id: adulte, qualite: aide, suite: cpe, … }
  - { type: lieu, id: compte-officiel, … }
  - { type: lieu, id: signalement, suite: vestiaire, … }   # fin de la route « bon »
  - { type: lieu, id: cpe, … }
  - { type: lieu, id: parents, … }                          # suit cpe, enchaîne sur vestiaire
  - { type: lieu, id: vestiaire, … }                        # arrivée commune
```

### 2.3 Règles du schéma (le build échoue sinon)
- Chaque `suite` désigne une étape existante du même parcours, jamais l’étape elle-même.
- `suite` est interdit sur un choix `risque`, et en dehors d’un parcours.
- Aucune boucle ; toutes les routes depuis la première étape atteignent la dernière étape du fichier ; toute étape est atteignable.
- Toutes les routes ont la même longueur, entre 4 et 6 lieux (mini-jeu compris s’il y en a un).
- Une bifurcation sépare exactement le choix `bon` et le choix `aide` (pas deux choix `bon` vers deux routes).

## 3. Moteur
- L’état de mission garde l’étape courante **par identifiant** et l’historique des étapes jouées (`chemin: string[]`), en plus de l’index de progression (rang dans la route, 0 à *m* − 1). Fonction pure `etapeSuivante(mission, etapeId, choixId)`.
- « Continuer » après un bon choix va à `suite` (choix, sinon lieu, sinon étape suivante du fichier). « Passer ce lieu » suit la route du lieu (le `suite` du lieu, sinon l’étape suivante du fichier) ; si le lieu passé est une bifurcation, on suit la route du choix `bon`.
- « Rejouer » une mission repart de la première étape avec un historique vide.
- Résultats, badges, débrief et progression enregistrée ne portent que sur les étapes jouées. « Explorateur·rice » : toute la route jouée sans lieu passé.
- Routes connues d’avance : `routesDe(mission)` (liste des chemins, utilisée par la fiche, le plan B, l’export, les tests).

## 4. Interface
- **`CheminIle`** : lieux visités, lieu courant, puis les lieux à venir. Avant une bifurcation, les lieux qui dépendent du choix s’affichent « Lieu *n* — selon ton choix », sans nom ; après, seule la route prise est montrée avec ses noms. État donné en texte (visité, ici, à venir).
- **Scène de l’île** et compteur : inchangés (longueur commune).
- **Fin de mission** : une ligne « Tu as pris la route *libellé* » (libellé = texte court du choix de bifurcation fait) et un lien « Rejouer pour découvrir l’autre route ». Les deux routes valent la même chose (mission terminée, objet de l’île gagné).
- **Modes** : le vote (Classe entière) ou la discussion (Binôme) décident de la route, comme tout choix.
- **Fiche enseignant** : schéma des routes en texte (« Lieux 1 – 2, puis selon le choix : 3a – 4a ou 3b – 4b, puis 5 »), ce que chaque route travaille, piste de débrief « Comparez les deux routes : les deux sont bonnes, qu’est-ce qui change ? ».
- **Plan B papier** : façon « livre dont tu es le héros » : chaque lieu a un numéro (1, 2, 3a, 4a, 3b, 4b, 5) ; à la bifurcation, « Si tu choisis X, va au lieu 3a ; si tu choisis Y, va au lieu 3b » ; corrigé des 7 lieux.
- **Export de relecture** : les 7 lieux, chacun marqué de sa route.

## 5. Contenu : 6 parcours 5e – 3e

### 5.1 Nouveaux décors
`gymnase` (club de sport, gymnase), `musee` (sortie scolaire : car, musée), `fete` (fête d’anniversaire). Dessin SVG décoratif comme les décors existants (`DecorScene`), emoji de plateforme dans `DECORS_EMOJI`.

### 5.2 Histoires (situations nouvelles, différentes des missions classiques collège)

| Île | Histoire | Bifurcation (`bon` / `aide`) |
|---|---|---|
| Hameçons (`phishing`) | **Le concours de l’influenceur** : DM « tu as gagné », fausse page de marque, QR code au tournoi | je vérifie moi-même sur le compte officiel / je demande à un adulte |
| Clés (`comptes`) | **Le compte partagé du club** : mot de passe d’équipe dans le groupe, « envoie-moi le code que tu viens de recevoir » | je sécurise moi-même l’accès / je préviens l’entraîneur·e |
| Secrets (`vie-privee`) | **La fête d’anniversaire** : photos, story géolocalisée, un ami qui identifie sans demander | j’en parle moi-même à l’ami / je demande à un adulte |
| Pièces d’or (`jeux-achats`) | **Le skin à moitié prix** : échange sur un serveur de jeu, faux « intermédiaire », cartes cadeaux, carte bancaire des parents | je signale et bloque moi-même / je préviens mes parents |
| Rumeurs (`desinformation`) | **« La sortie est annulée ! »** : message vocal viral dans le groupe de classe, capture retouchée | je vérifie les sources moi-même / je demande au professeur |
| Antennes (`appareils`) | **Le car de la sortie** : Wi-Fi ouvert, image reçue par partage sans fil, borne de recharge, appli « sortie » qui demande tout | je règle moi-même mon téléphone / je demande à l’adulte accompagnateur |

Chaque route montre l’effet de la réponse choisie (ce qu’on règle soi-même, ce qu’un adulte rend possible) et transmet les mêmes réflexes essentiels ; le dernier lieu commun conclut l’histoire.

### 5.3 Règles éditoriales (tests de contenu quand c’est automatisable)
- Chaque île non sensible a un parcours `5e-3e` ; chacun a exactement une bifurcation ; routes de 5 lieux ; au moins 2 lieux avec récupération sur l’ensemble du parcours, dont au moins un sur chaque route.
- Pièges subtils : les choix risqués s’appuient sur un levier crédible (pression du groupe, urgence, flatterie, autorité, gain) ; aucun « tic de forme » (longueur des choix équilibrée, pas de négation systématique dans les bons choix, pas de motif « raison : action »), mêmes contrôles que pour les parcours 6e.
- Aucune des deux routes n’est présentée comme meilleure : pas de « tu aurais dû », pas de comparaison dans les textes de route.
- Marques fictives ; vocabulaire adapté aux 12-15 ans ; version simplifiée facultative (pas de règle `…Simple` obligatoire hors 6e).
- Faits vérifiés (sources habituelles : CNIL, cybermalveillance.gouv.fr, e-Enfance / 3018 pour l’aide humaine).

### 5.4 Relecture
Rédaction par sous-agents, relecture « pédagogie et exactitude » dédiée, puis relecture de Noa. Thèmes non sensibles : publiés directement, comme les parcours 6e.

## 6. Tests
- **Moteur** : `etapeSuivante` (choix avec `suite`, lieu avec `suite`, étape suivante du fichier), route `bon` et route `aide` jouées jusqu’au bout, passer une bifurcation, rejouer, mode Classe entière, badges sur une route.
- **Schéma** : `suite` inconnue, sur un choix risqué, hors parcours, boucle, étape inatteignable, routes de longueurs différentes, route qui n’atteint pas la dernière étape, bifurcation qui ne sépare pas `bon` et `aide`.
- **Contenu** : section 5.3.
- **Interface** : `CheminIle` (« selon ton choix » avant la bifurcation, route prise après), ligne de fin de mission et lien rejouer, fiche (schéma des routes), plan B (numéros 3a / 3b et renvois), export.
- **E2E** : jouer un parcours collège par la route `bon` puis par la route `aide` ; audit axe à la bifurcation et en fin de mission, en clair et en sombre ; les parcours 6e existants restent verts.

## 7. Hors périmètre
- Parcours lycée (PR suivante, même modèle).
- Détours sur erreur, embranchements multiples dans un même parcours, plus de deux routes.
- Parcours des thèmes sensibles.
- Nouveau badge lié aux routes.
