# Cyber Réflexes : parcours lycée à trois routes (dont une route de réparation)

- **Date** : 2026-10-24
- **Statut** : validée (Noa, 2026-10-24)
- **Prérequis** : parcours à deux routes (collège) livrés (PR #10).
- **Source** : `docs/recherche/2026-10-24-dossier-lycee.md` (dossier de recherche, sources officielles datées, points non vérifiés signalés). Toute affirmation factuelle du contenu lycée doit s’y appuyer.
- **Choix de Noa** : ne pas recopier le modèle du collège ; partir des données. Ajouter, pour le lycée, une **route de réparation** : à la bifurcation, un choix risqué mène vers une route où l’élève vit la conséquence et répare, puis termine la mission.

## 1. Objectif

Donner aux lycéens (seconde à terminale, voies générale, technologique et professionnelle) un parcours par île non sensible, fondé sur des situations propres à leur âge (stage, PFMP, petit boulot, première carte, orientation, revente, travail avec une IA), qui entraîne trois choses mises en avant par le dossier :
1. **Réparer** après une erreur, dans le bon ordre, sans humilier (principes F2.4 et F2.5 du dossier).
2. **Demander une aide précise** : la bonne personne pour l’incident, pas « un adulte » en général (F2.6).
3. **Choisir le recours qui correspond à l’incident** (F2.7, section C0).

### Critères de succès
- 6 parcours `tranches: ['lycee']`, un par île non sensible (`phishing`, `comptes`, `vie-privee`, `jeux-achats`, `desinformation`, `appareils`), chacun avec **une bifurcation à trois routes** (`bon`, `aide`, réparation) de 5 lieux chacune, et un mini-jeu `tri` « le bon recours » commun aux trois routes.
- Les parcours 6e et 5e – 3e et toutes les missions classiques sont inchangés ; leurs tests restent verts.
- Une route de réparation se joue entièrement au clavier, en Solo, Binôme et Classe entière, et passe l’audit axe en clair et en sombre.
- Fiche enseignant, plan B papier et export de relecture couvrent les 3 routes.
- Les parcours lycée `vie-privee` et `appareils` sont des brouillons (absents du site publié) jusqu’à la relecture de Noa ; les 4 autres sont publiés.
- Aucune affirmation de contenu ne contredit le dossier ; aucun chiffre sur « les lycéens » (le dossier n’en établit aucun).

## 2. Modèle : la route de réparation

### 2.1 Forme
```
1 → 2 ─┬─(bon)─────── 3a → 4a ─┐
       ├─(aide)────── 3b → 4b ─┼→ [tri] → 5
       └─(risque*)─── 3c → 4c ─┘
```
`risque*` : le choix risqué de la bifurcation qui porte un `suite`. Les autres choix risqués (de la bifurcation et de tous les autres lieux) gardent la règle actuelle : rester sur place et réessayer.

Le mini-jeu `tri` est placé après la jonction, avant le dernier lieu (position laissée au rédacteur : avant la bifurcation est aussi accepté, tant qu’il est commun aux trois routes).

### 2.2 Format YAML
Une seule nouveauté : `suite` est **autorisé sur un choix `risque` d’une bifurcation**, et sur un seul choix risqué par lieu.
```yaml
  - type: lieu
    id: convention
    choix:
      - { id: envoie, qualite: risque, suite: plus-de-nouvelles, route: j’envoie les documents, … }
      - { id: verifie, qualite: bon, suite: site-officiel, route: je vérifie l’entreprise, … }
      - { id: prof, qualite: aide, suite: bureau-pp, route: je demande au professeur principal, … }
```

### 2.3 Règles du schéma (`verifierRoutes`, le build échoue sinon)
- `suite` sur un choix `risque` n’est accepté que si le lieu est une bifurcation (ses choix `bon` et `aide` mènent à deux lieux différents) et qu’un seul choix risqué du lieu porte `suite`. Sinon, message actuel (« un choix risqué fait rester sur place : pas de suite »).
- Une bifurcation a 2 routes (`bon`, `aide`) ou 3 routes (`bon`, `aide`, réparation) ; les trois cibles sont distinctes ; le choix risqué qui mène à la réparation porte, comme les deux autres, une étiquette `route` courte.
- Toutes les règles actuelles restent : même longueur pour toutes les routes, 4 à 6 lieux par route, toutes les routes finissent sur la dernière étape, pas de boucle, tout est atteignable, au plus un mini-jeu (commun).
- Ordre des routes (pour `routesDe`, les numéros et le plan B) : `bon` (a), `aide` (b), réparation (c).

## 3. Moteur
- `successeurs` inclut la cible du choix risqué à `suite`. `routesDe`, `aVenir`, `numerosLieux` (3a / 3b / 3c), `schemaRoutes` (« … : 3a – 4a ou 3b – 4b ou 3c – 4c, puis … ») et `choixDeBifurcation` (ajout d’un champ facultatif `reparation` / `texteReparation`) gèrent la troisième route.
- **Choix risqué à `suite`** : il passe par les phases habituelles d’un choix risqué (`pourquoi` si le lieu en a, puis la conséquence), il compte comme essai risqué (badges, leviers cédés) comme aujourd’hui. Différence : **« Continuer » mène à la route de réparation** au lieu de ramener à la situation. « Réessayer » reste proposé ; comme pour tout essai risqué, ce choix est alors grisé pour le reste de la partie (la route de réparation ne se retrouve qu’en rejouant la mission ; la fiche enseignant le signale).
- *(Décision de conception)* Le choix risqué à `suite` **n’a pas de récupération** sur la bifurcation : la réparation, c’est la route elle-même. Règle de schéma : `recuperation.siChoix` ne peut pas lister un choix à `suite`.
- « Passer ce lieu » sur la bifurcation : route `bon`, inchangé. « Rejouer » la mission : inchangé.
- La route de réparation termine la mission et gagne l’objet de l’île comme les autres. Le badge « Explorateur·rice » reste défini comme aujourd’hui (route entière jouée sans lieu passé).

## 4. Interface
- **Réaction au choix risqué à `suite`** (`ReactionPanel`) : à la place de « Tu restes sur ta plateforme… », la phrase « **Tu avances quand même.** Dans la vraie vie, une erreur se répare : la suite te montre comment. » ; boutons « Réessayer » et « Continuer » (bouton principal). Verdict et couleurs du risque inchangés (on ne maquille pas l’erreur).
- **`CheminIle`** : inchangé (« selon ton choix » avant la bifurcation, puis la route prise).
- **Fin de mission** : « Tu as pris la route « *étiquette* ». » puis, s’il existe d’autres routes : « Il existe d’autres routes. » / bouton « Rejouer pour découvrir les autres routes » (au singulier avec deux routes, comme aujourd’hui). Sur la route de réparation, ajouter une phrase neutre : « Tu as fait une erreur et tu l’as réparée : c’est aussi un réflexe. » Aucune phrase ne classe les routes.
- **Modes** : le vote (Classe entière) ou la discussion (Binôme) peuvent mener à la route de réparation, comme tout choix.
- **Fiche enseignant** : schéma des 3 routes ; ce que chaque route travaille ; piste de débrief « Comparez les trois routes : qu’est-ce qu’on peut encore faire après une erreur ? Qui aide pour quoi ? ».
- **Plan B papier** : numéros 3a / 3b / 3c ; à la bifurcation « Si tu choisis X, va au lieu 3a ; Y, 3b ; Z, 3c ».
- **Export de relecture** : les 9 lieux et le tri, chaque lieu marqué de sa route.

## 5. Contenu : 6 parcours lycée

### 5.1 Nouveaux décors
`entreprise` (lieu de stage ou de PFMP : bureau ou atelier, établi, ordinateur, badge), `banque` (agence bancaire : guichet, distributeur, panneau), `festival` (scène, tentes, guirlandes, stand). Dessins SVG décoratifs comme les décors existants (`DecorScene`), emoji dans `DECORS_EMOJI`. Le décor `classe` n’est pas utilisé dans les parcours lycée (portable interdit au lycée depuis la rentrée 2026 : pas de scène de téléphone en cours).

### 5.2 Histoires (inspirées des « douze situations » du dossier ; noms et marques fictifs)

| Île | Histoire | Bifurcation : `bon` / `aide` / réparation |
|---|---|---|
| Hameçons (`phishing`) | **Le stage de seconde** : réponse positive d’une entreprise fictive, « recruteur » qui presse et réclame documents d’identité et coordonnées bancaires « pour la convention », QR code d’inscription | je vérifie l’entreprise par son site ou son numéro officiel / je demande au professeur principal (qui gère les conventions) / j’envoie les documents → garder les preuves, stopper l’échange, prévenir le lycée, 17Cyber, plainte selon le préjudice |
| Clés (`comptes`) | **Le projet de groupe** : le compte d’un camarade, piraté, réclame « le code que tu viens de recevoir » la veille d’un rendu ; mot de passe réutilisé | je vérifie auprès du camarade par un autre canal / je demande au référent numérique du lycée / je donne le code → sécuriser la messagerie, changer les mots de passe réutilisés, vérifier les moyens de récupération et les sessions, double authentification, prévenir les contacts |
| Secrets (`vie-privee`) | **La PFMP** (ou le petit boulot) : CV en lien public, photo d’équipe, localisation partagée pendant une sortie | je règle moi-même qui voit quoi / je demande au tuteur ou au CPE / je publie la photo d’équipe sans demander → retirer ma publication, demander le retrait des copies, prévenir les personnes, régler l’audience (sans promettre que tout disparaît) |
| Pièces d’or (`jeux-achats`) | **La calculatrice vendue avant le bac** : faux acheteur, lien « pour recevoir le paiement », puis appel d’un faux conseiller très bien informé | je vérifie dans l’appli de la plateforme et de ma banque / je demande à mes parents / je saisis ma carte sur le lien → banque et opposition avec un parent, relevé des opérations, Perceval si les conditions sont réunies (représentant légal), preuves ; ne jamais garantir un remboursement |
| Rumeurs (`desinformation`) | **L’audio du proviseur** (ou l’exposé trop parfait) : message vocal qui « annonce » un changement au lycée, vidéo hors contexte, référence d’IA introuvable | je vérifie l’origine et cherche une confirmation indépendante / je demande au professeur documentaliste / je relaie dans le groupe → arrêter de relayer, retrouver l’origine, corriger auprès du même groupe sans republier le contenu |
| Antennes (`appareils`) | **Le job de festival** (ou l’ordinateur de PFMP) : Wi-Fi public, extension ou outil « pour aller plus vite », appli de billetterie qui demande tout | je règle et vérifie moi-même (source officielle, permissions, données mobiles) / je demande au tuteur ou au service informatique / j’installe l’outil → ne plus saisir de secrets sur l’appareil, sécuriser les comptes depuis un appareil sain, faire examiner l’appareil (désinstaller ne suffit pas) |

Chaque **route de réparation** montre la conséquence sans dramatiser, puis fait choisir les gestes de réparation dans le bon ordre. Ses lieux ont, comme les autres, un choix `bon`, un choix `aide` et un choix `risque` : ici, le choix risqué est souvent une **idée reçue** de la dernière section du dossier (ex. « je signale sur PHAROS pour récupérer mon argent », « je désinstalle l’appli, c’est réglé », « je change juste ce mot de passe-là »).

Chaque **mini-jeu `tri` « le bon recours »** classe 6 situations de l’île vers 3 catégories adaptées (ex. argent : « Ma banque d’abord », « 33700 », « SignalConso » ; désinformation : « Je corrige moi-même », « Je demande au documentaliste », « Je signale à la plateforme »). *(Décision de conception)* Les catégories peuvent être des dispositifs, des personnes ou des gestes (« Ma banque d’abord », « Je corrige auprès du même groupe », « Je demande au documentaliste ») ; mais tout **dispositif nommé** (33700, 17Cyber, Perceval, SignalConso, PHAROS, THESEE, plainte) vient de la section C0 du dossier et est utilisé dans son périmètre exact. Pas de formulaire de plateforme présenté comme un recours précis (non vérifié). PHAROS n’est jamais utilisé pour injures ou diffamation (périmètre divergent).

### 5.3 Règles éditoriales (testées quand c’est automatisable)
- Chaque île non sensible a un parcours `lycee` ; chacun a exactement une bifurcation et **trois routes** ; 5 lieux par route ; un mini-jeu `tri` commun ; `duree: 25`.
- **Aide précise** : le texte du choix `aide` de chaque lieu commence par « Je demande de l’aide » et ne contient pas « un adulte » (il nomme quelqu’un : professeur principal, CPE, documentaliste, tuteur, référent numérique, parent, banque…).
- Au moins un lieu avec récupération sur chaque route (la route de réparation en a au moins deux).
- Aucun texte de route ne compare les routes (mêmes contrôles que le collège) ; aucune formule culpabilisante sur la route de réparation (réutiliser la règle des thèmes sensibles).
- Le choix `bon` de la bifurcation ne commence pas par « Je demande » ; étiquettes `route` courtes ; titre « L’île … : … ».
- Pas de décor `classe` ; un décor différent par lieu sur chaque route.
- **Exactitude** (relecture, non automatisable) : aucun chiffre sur les lycéens ; recours limités à C0 avec leur périmètre ; pas de numéro d’opposition universel ; ne jamais garantir un remboursement ni une disparition totale d’un contenu ; ne pas citer la loi de juillet 2023 comme l’état actuel ; pas de « méthode officielle CLEMI » ; mules, paris, paiement fractionné et loot boxes non traités (non vérifiés dans le dossier). Marques fictives ; voies pro et générale toutes deux représentées sur l’ensemble des 6 parcours.
- Pièges subtils, pas de tic de forme : contrôles existants (longueurs équilibrées, etc.). Version simplifiée facultative.

### 5.4 Relecture
Rédaction par sous-agents, relecture « pédagogie et exactitude » dédiée **confrontée au dossier**, puis relecture de Noa.

**Choix de Noa (option A)** : les parcours `vie-privee` et `appareils` lycée enseignent, sur leur route de réparation, des procédures que le dossier ne valide pas (C3 « procédure pédagogique à valider », C6 « proposition »). Ils sont donc écrits avec ces procédures mais restent **brouillons** (`relecture: { statut: a-relire }`) jusqu’à la relecture de Noa. Les quatre autres parcours lycée sont publiés directement.

Conséquence technique : le mécanisme de brouillon, aujourd’hui réservé aux thèmes sensibles, s’applique à **toute mission qui porte un bloc `relecture` au statut `a-relire`** :
- le bloc `relecture` devient facultatif (et non plus interdit ou ignoré) hors thème sensible ; il reste obligatoire pour un thème sensible ;
- exclusion du build de production, bandeau « Brouillon » en local et avec `VITE_BROUILLONS=1`, contrôle `scripts/verifier-publication.ts` (la liste attendue = toutes les missions `a-relire`, sensibles ou non) ;
- `npm run export:relecture` exporte aussi ces missions sans `--toutes` ;
- sur l’archipel publié, une île dont le seul parcours lycée est un brouillon affiche l’état actuel d’une île sans parcours dans la tranche (« Parcours bientôt ») ;
- README : la section « Statut de relecture » décrit la règle générale.

## 6. Tests
- **Routes** : `suite` sur un risque hors bifurcation refusé ; deux risques à `suite` refusés ; trois routes de longueurs différentes refusées ; numéros 3c ; `schemaRoutes` à trois routes ; `aVenir` avant et après la bifurcation ; `choixDeBifurcation` avec réparation.
- **Moteur** : choix risqué à `suite` → pourquoi → conséquence → (récupération) → « Continuer » mène à 3c ; « Réessayer » ramène à la situation ; essai compté ; Classe entière ; passer la bifurcation → route `bon` ; route de réparation jouée jusqu’au bout, mission terminée.
- **Interface** : phrase « Tu avances quand même » et deux boutons ; fin de mission (« autres routes », phrase de réparation) ; fiche, plan B (3c), export.
- **Contenu** : section 5.3 ; couverture « les 6 îles ont un parcours lycée ».
- **E2E** : un parcours lycée par chacune des trois routes ; audit axe à la bifurcation, sur la réaction au risque à `suite` et en fin de mission, en clair et en sombre ; parcours 6e et collège toujours verts.

## 7. Hors périmètre
- Route de réparation pour les 6e et 5e – 3e (possible plus tard : le moteur la permet).
- Plusieurs bifurcations par parcours, plus de trois routes.
- Thèmes sensibles ; nouveaux badges ; mesure d’efficacité (F4 du dossier).
- Vérifications juridiques complémentaires listées comme manquantes par le dossier.
