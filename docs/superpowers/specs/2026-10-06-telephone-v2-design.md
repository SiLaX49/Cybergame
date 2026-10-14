# Cyber Réflexes : téléphone v2 (retour immédiat, habillages, entrée par notification)

- **Date** : 2026-10-06
- **Statut** : validé en conversation section par section ; l'utilisateur a demandé d'enchaîner spec, plan et code sans relecture intermédiaire.
- **Prérequis** : `2026-10-06-telephone-design.md` (v1 livrée sur `feat/telephone` : composant unique, schéma par appli, gestes, atelier).
- **Notes de recherche** : `.superpowers/sdd/telephone-v2-recherche.md` (feedback, accessibilité, habillages).

## 1. Objectif

La v1 rend un faux téléphone propre, mais l'expérience reste « éclatée » : le choix ne provoque aucun retour dans le téléphone, l'explication arrive en pavé comme contenu principal, et les applis ne ressemblent pas aux vraies. La v2 fait du téléphone un vrai téléphone « qui y ressemble » (pas un vrai OS), utilisé par tous les scénarios :

1. **Retour immédiat dans le téléphone** après un choix : ta réponse part, le contact écrit, puis répond ; le téléphone s'entoure d'un halo rouge (piège) ou vert (bon réflexe) avec un verdict en icône et en texte ; les passages qui devaient alerter se surlignent, numérotés.
2. **Explication à côté, courte et secondaire**, avec les mêmes numéros que dans le message.
3. **Habillage de chaque appli fictive** qui évoque l'appli réelle (similaire, pas semblable, jamais de logo ni de nom réel).
4. **Entrée par notification** sur l'écran verrouillé, et un écran d'accueil avec les applis inutiles en blanc.

### Décisions prises
| Question | Décision |
|---|---|
| Indices en gras | Révélés **après** le choix (surlignés et numérotés) ; bouton « Indice » facultatif avant le choix (surligne sans numéros). Surligner avant entraîne à repérer du gras, pas les vrais indices. |
| Questions de réflexion | On garde « Qu’est-ce qui t’a donné envie de le faire ? » (leviers) après un piège ; les cases « Qu’est-ce qui t’a décidé ? » disparaissent, remplacées par le surlignage. |
| Entrée d'un scénario | Notification sur l'écran verrouillé, l'élève la touche, l'appli s'ouvre. |
| Découpage | Une spec, trois lots successifs, chacun jouable : 1. déroulé du choix, 2. contenu, 3. téléphone (verrouillé, accueil, habillages). |
| Vibration matérielle | Non (absente d'iOS et de Firefox, inutile en classe). |
| Cadre légal | Hors sujet : simplement aucun logo ni nom réel. |

### Critères de succès
- Après un choix, la séquence complète se joue dans le téléphone et l'explication n'apparaît qu'à sa fin ; rien ne disparaît tout seul.
- Le verdict n'est jamais porté par la couleur seule (icône + texte), aucun clignotement, secousse coupée en mouvement réduit ou quand le réglage « animations » est désactivé.
- Chaque `passage` d'indice existe mot pour mot à l'écran (test), chaque `appNom` du contenu existe dans le registre des applis (schéma).
- Audit axe sans violation critique ou sérieuse sur un scénario par marque, le verdict affiché et l'écran verrouillé.
- Le moteur garde ses événements sauf la phase « indices », supprimée.

## 2. Lot 1 : le déroulé du choix

### 2.1 Chronologie
| Étape (`EtapeSequence`) | Début | Dans le téléphone |
|---|---|---|
| `envoi` | 0 ms | Les autres réponses s'effacent ; ta réponse part (bulle « Toi » si geste `repondre`, sinon bannière du geste). |
| `ecrit` | 150 ms | « <contact> est en train d’écrire… » (trois points), seulement si le choix a une `reaction`. |
| `reaction` | 900 ms | La réaction du contact en bulle reçue. |
| `verdict` | 1 000 ms (600 ms sans réaction) | Halo rouge ou vert en fondu 200 ms puis fixe ; secousse amortie (piège : translateX ±8, ±5, ±2 px sur 350 ms) ou rebond (bon : scale 1 → 1,03 → 1 sur 250 ms) ; bandeau en bas du téléphone : ✖ « Piège » ou ✔ « Bon réflexe » (le choix `aide` compte comme bon réflexe). Le verdict est annoncé (`role="status"`). |
| `indices` | 1 400 ms | Les passages des indices se surlignent dans le message, numérotés ①②③ (150 ms d'écart). |
| `fin` | 1 800 ms | Le panneau d'explication apparaît à côté. |

- Mouvement réduit (`prefers-reduced-motion`) : mêmes étapes, sans secousse ni rebond (le fondu de couleur reste).
- Réglage « animations » désactivé : toutes les étapes s'affichent d'un coup (séquence instantanée).
- La séquence est pilotée par une fonction pure (`src/phone/sequence.ts`) qui donne les étapes et leurs instants ; un composable l'exécute avec des minuteries, nettoyées au démontage et au « Rejouer ».

### 2.2 Le panneau d'explication (à côté)
- Phase `pourquoi` (après un piège, s'il y a un bloc `pourquoi`) : verdict en une phrase, « Ce qui devait t’alerter » (liste numérotée ①②③ des `libelle` d'indices, mêmes numéros que dans le message), puis la question des leviers (`PourquoiForm`, inchangé).
- Phase `consequence` : verdict, conséquence (`consequence`), « Ce qui a marché sur toi » s'il y a un levier, « Ce qui devait t’alerter » (si pas déjà montré), « À retenir », boutons « Rejouer ce scénario » et « Continuer ».
- Ton : le panneau explique la technique (« Ce message joue sur l’urgence. Beaucoup d’adultes s’y laissent prendre. »), jamais de jugement de la personne. La moquerie éventuelle est dans la bouche de l'arnaqueur, dans le téléphone.
- Le panneau n'apparaît qu'à l'étape `fin` de la séquence ; le focus va alors sur son titre (mécanisme existant).

### 2.3 Bouton « Indice »
- Avant le choix, un bouton « Indice » en haut de l'écran du téléphone surligne les passages, sans numéros. Il ne se joue qu'une fois par scénario et marque le résultat (`indiceUtilise: true`).

### 2.4 Données et moteur
- Choix : nouveau champ facultatif `reaction` (et `reactionSimple`) : le message du contact après ce choix. Sans `reaction`, l'étape `ecrit` et la bulle sont sautées.
- Indice : nouveau champ `passage` (texte exact à surligner dans `ecran`). Lot 1 : facultatif ; lot 2 : obligatoire. Le panneau et le surlignage n'utilisent que les indices `pertinent` ; le lot 2 retire les autres et le champ `pertinent`.
- Moteur : la phase `indices` et l'événement `valider-indices` disparaissent. Un choix non risqué (ou risqué sans bloc `pourquoi`) passe directement en `consequence` avec son résultat. Nouvel événement `indice` (en phase `situation`) qui marque `indiceUtilise`. `ScenarioResultat` perd `indicesChoisis`, `indicesJustes`, `indicesFaux` et gagne `indiceUtilise`.
- Badge « Œil de lynx » : tous les scénarios joués sans piège et sans utiliser l'indice (« Tu as déjoué les pièges sans demander d’indice. »).
- Version papier : « Quel indice t’a décidé ? » devient « Souligne dans le message ce qui devait t’alerter. » ; le corrigé liste les indices et leurs passages.

## 3. Lot 2 : le contenu
- Une `reaction` (et `reactionSimple` en 6e) pour chaque choix `bon` et `risque` des 21 missions classiques et Rappel : courte, dans le ton du contact (l'arnaqueur ricane ou insiste, l'ami rassure), marques fictives seulement.
- Un `passage` pour chaque indice pertinent, présent mot pour mot à l'écran en lecture normale et simplifiée (test) ; une seule occurrence de préférence. Les indices non pertinents et le champ `pertinent` disparaissent ; au moins un indice par scénario.
- Les boutons simulés en texte (« [Tout autoriser] [Refuser] ») deviennent un champ `boutons` (liste de libellés) de l'écran `web`, affichés comme des boutons inertes.
- `appNom` : obligatoirement une clé du registre des applis (lot 3 crée le registre ; le lot 2 aligne les noms : « Notifications » devient « Messages » si besoin).

## 4. Lot 3 : le téléphone

### 4.1 Écran verrouillé et entrée
- Un scénario commence sur l'écran verrouillé : grande heure, fond, une notification qui glisse du haut (`<appNom> · <contact> : <début du premier message>`, ou le champ facultatif `notification` de l'écran). La notification est un bouton (« Ouvrir la notification <appNom> de <contact> ») ; l'appli s'ouvre avec un court zoom (coupé en mouvement réduit). Le focus va sur la zone de l'appli ouverte.
- Le fil des missions Rappel reste l'écran verrouillé à plusieurs notifications (v1).

### 4.2 Écran d'accueil
- Grille de 4 colonnes d'icônes avec libellé, dock de 4 icônes (Messages, Navigateur, Mail, SnapTalk), indicateur de page. Icône = carré arrondi propre au jeu (ni superellipse iOS, ni cercle Android), pas d'effet verre.
- Les applis du scénario en couleur, pastille rouge sur celle qui a la notification ; les autres « en blanc » (contour, désaturées) : les toucher affiche « Pas disponible dans ce scénario ».
- Accès : bouton « Accueil » (barre de geste en bas) une fois l'appli ouverte ; retour à l'appli par son icône.

### 4.3 Registre et habillages
- `src/phone/applis.ts` : clé = `appNom` ; valeur = `{ marque, accent, icone, evoque, type d'en-tête, barre du bas }`. Le schéma refuse un `appNom` hors registre.
- La structure reste par type d'écran (conversation, publication, mail, web) ; une coque de marque (`src/phone/marques/`) ajoute l'en-tête et la barre du bas propres à l'appli, et le style des réponses (pilules de réponses suggérées pour SnapTalk, ChatCord, Messages, GameBox).

| Appli | Évoque | Accent | Marqueurs repris | Différence voulue |
|---|---|---|---|---|
| SnapTalk | Snapchat, Instagram | `#FFC83D` | icônes d'état colorées, 🔥 + jours, anneau de story | icône bulle-obturateur, pas de fantôme |
| ChatCord | Discord | `#7B4DDB` | colonne de serveurs, salons « # », 4 onglets | pastilles carrées |
| StreamTube | YouTube, TikTok | `#E8344E` | pilule j'aime / commentaires, « S’abonner », colonne d'actions | pas de triangle de lecture rouge |
| Revendo | Vinted, Leboncoin | `#2F8F5B` | prix en gras, « Acheter », frais de protection, fiche de l'objet épinglée | « Faire une offre » secondaire |
| GameBox / GameBox Chat | Roblox, Fortnite | `#FF7A1A` | solde en « Gemmes », onglets Chat / Moi | monnaie hexagonale |
| BanqueNova | appli bancaire | `#2D3A8C` | solde, opérations, Virement | pas de mascotte |
| Mon Collège / Mon Lycée | ENT | `#3B82C4` | emploi du temps, notes, cahier de textes | carte vie scolaire |
| Messages | SMS | `#0E9F8E` | bulles, « Lu », numéro inconnu | une seule couleur de bulle |
| Mail | Gmail, Apple Mail | `#4A6FA5` | expéditeur en gras, « Écrire », étoile | pas d'enveloppe |
| Navigateur | Chrome, Safari | `#5A6B7D` | barre d'adresse, icône réglages (jamais de cadenas), onglets | domaine entier |
| Magasin d’applis | App Store, Play Store | `#2A9DF4` | Aujourd'hui / Jeux / Recherche, « Obtenir », étoiles | badge d'âge visible |
| Météo | appli météo | `#4BA3D9` | température, icône du temps | |

Contrastes : texte d'au moins 4.5:1 sur chaque accent (texte foncé sur les accents clairs comme le jaune miel).

## 5. Code
- `src/phone/Telephone.vue` reste le seul point d'entrée ; il gère `verrouille | accueil | appli` (lot 3) et la séquence de retour (lot 1).
- `src/phone/sequence.ts` (pure) + `src/phone/useSequence.ts` (minuteries) ; `src/phone/surlignage.ts` (pure : découpe un texte en morceaux texte / lien / passage numéroté).
- Nouveau panneau `src/mission/ExplicationPanel.vue` (remplace `IndicesForm.vue` et allège `ConsequencePanel.vue`).
- L'atelier (`/atelier-telephone`) sert de vitrine : relance de la séquence, choix de marque, mode verrouillé / accueil / appli.

## 6. Tests
- Unitaires : séquence (ordre, instants, mode instantané, avec ou sans réaction), surlignage (passages trouvés, combinés aux liens, numéros), moteur sans phase indices et événement `indice`, badge « Œil de lynx », panneau, registre (chaque `appNom` du contenu y figure), contenu (`reaction` présente, `passage` mot pour mot, normal et simplifié).
- Bout en bout et axe : un scénario par marque au clavier, verdict piège et bon réflexe audités, écran verrouillé et accueil audités, mouvement réduit.
- Recette Playwright à chaque lot : captures bureau, mobile, texte très grand, halo rouge et vert.

## 7. Hors périmètre
Conversations à plusieurs tours, saisie de texte par l'élève, éléments touchables pour inspecter, son, vibration matérielle, page mission plein écran (tâche 10 en stash, à reprendre après le lot 3).
