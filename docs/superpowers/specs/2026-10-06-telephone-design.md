# Cyber Réflexes : le nouveau faux téléphone

- **Date** : 2026-10-06
- **Statut** : à valider
- **Prérequis** : étapes 1 et 2, évolution « pourquoi » et parcours îles livrés sur `main`
- **Ambition** : qualité d'un produit commercial, le jeu ayant vocation à être repris.

## 1. Objectif

Remplacer le faux téléphone actuel (`src/phone/`, 5 composants statiques, choix affichés à côté) par un **vrai faux téléphone** :
- **un seul point d'entrée** `<Telephone>` pour tout le jeu, avec une pièce par appli et des briques partagées ;
- **un rendu crédible** pour chaque appli (SMS, messagerie de jeu, réseau social, mail, navigateur, écran verrouillé), sans aucune marque réelle ;
- **l'élève répond dans le téléphone** : les choix du scénario s'affichent en bas de l'appli, puis le téléphone « joue » le choix (bulle envoyée ou bannière système) et se fige ; la suite (pourquoi, indices, conséquence, récupération) reste dans le panneau à côté ;
- **le fil de notifications** des missions Rappel devient un écran verrouillé du même téléphone.

### Décisions prises (brainstorming du 2026-10-06)
| Question | Décision |
|---|---|
| Interaction | L'élève répond dans le téléphone (actions en bas de l'appli). Pas d'éléments cliquables pour inspecter (lien, expéditeur) : tout ce qui sert d'indice est visible. |
| Découpage | Un point d'entrée unique, des fichiers courts par appli et par brique. |
| Après le choix | Le téléphone joue le choix puis se fige ; débrief dans le panneau à côté (en dessous sur mobile). |
| Notifications | Intégrées au téléphone (écran verrouillé). |
| Réalisme du contenu | Heures et avatars ; mail avec vraie adresse et pièce jointe ; liens et aperçus ; social avec badge, compteurs et commentaires. |
| Architecture | Approche A : coque unique, une appli par fichier, `ecran` en union discriminée par `app`. |

### Critères de succès
- Le reste du jeu n'importe que `src/phone/Telephone.vue` ; `EcranTelephone`, `PhoneFrame`, `ThreadScreen`, `MailScreen`, `WebScreen` sont supprimés.
- Les 21 missions classiques et Rappel passent le nouveau schéma, migrées vers les champs structurés (section 7), et tous les tests de contenu passent (marques fictives, citations des `truc` présentes à l'écran et en lecture simplifiée).
- Chaque scénario se joue entièrement au clavier dans le téléphone, dans les 3 modes, et l'audit axe ne relève aucune violation critique ou sérieuse (scénarios des 5 applis et fil).
- Le moteur (`src/engine/mission-runner.ts`) et le stockage ne changent pas.
- Aucun fichier de `src/phone/` ne dépasse 150 lignes.

## 2. Architecture

```
src/phone/
  Telephone.vue        seul composant importé par le reste du jeu
  apps/
    ConversationApp.vue (sms et chat, distingués par le thème)
    SocialApp.vue  MailApp.vue  WebApp.vue  VerrouillageApp.vue
  parts/
    BarreEtat.vue        heure, réseau, batterie (décoratif)
    EnteteApp.vue        retour, avatar, nom du contact ou titre, nom de l'appli
    Avatar.vue           initiales et couleur dérivées du nom (décoratif)
    Bulle.vue            message reçu ou envoyé, heure, aperçu de lien
    TexteRiche.vue       texte avec les liens repérés et mis en forme
    ApercuLien.vue       carte titre + domaine sous une bulle
    BanniereSysteme.vue  « Lien ouvert », « Contact bloqué »…
    ActionsApp.vue       zone « Que fais-tu ? » : choix, vote de classe, choix joué
  liens.ts             découpage d'un texte en morceaux texte / lien, découpage d'une URL (fonctions pures)
  stats.ts             texte des compteurs sociaux (« 1 200 vues · 87 partages »), partagé avec le plan B
  gestes.ts            geste → icône lucide + libellé de bannière
  avatar.ts            nom → initiales + teinte (fonction pure)
  theme.css            variables par appli, aplats opaques
```

### 2.1 API publique
```ts
defineProps<{
  ecran: EcranTelephone          // union : sms | chat | social | mail | web | verrouillage
  choix?: ChoixTelephone[]       // absent = pas de zone d'actions (ex. verrouillage)
  mode?: Mode                    // solo | binome | classe (défaut solo)
  choixJoue?: string | null      // null : on attend un choix ; sinon le téléphone joue ce choix et se fige
  graine?: string                // ordre d'affichage stable des choix (ordreAffichage, défaut '')
  // Verrouillage uniquement
  actionsNotif?: Record<string, FilAction>
}>()
defineEmits<{
  choisir: [choixId: string]
  agir: [notificationId: string, action: FilAction]   // verrouillage
}>()
```
- `ScenarioStep` reçoit une nouvelle prop `choixId` (`etat.choixId`, transmis par `MissionPage`) et passe `scenario.ecran`, `scenario.choix`, `mode`, `graine = scenario.id` et `choixJoue = phase === 'situation' ? null : choixId`. Il émet `choisir` vers le moteur comme aujourd'hui. Le panneau à côté n'affiche plus `ChoixList` en phase `situation` : seulement la question en titre et, en mode binôme ou classe, la consigne du mode.
- `FilStep` construit `{ app: 'verrouillage', notifications }`, garde l'état `actions` et le bouton « Valider mes choix » dans le panneau (section 5).
- Les lieux des parcours 6e ne changent pas : ils gardent `ChoixList` (pas de téléphone).
- « Rejouer » (moteur inchangé) remet la phase en `situation` : `choixJoue` repasse à `null` et les actions réapparaissent.

### 2.2 Responsabilités
- `Telephone.vue` : coque (cadre, barre d'état, en-tête, zone défilante focusable), aiguillage vers l'appli par `ecran.app`, `ActionsApp` en bas de l'écran.
- `apps/*` : rendu du contenu propre à l'appli, rien d'autre ; aucune logique de choix.
- `ActionsApp` : ordre des choix, mode classe (sélection `aria-pressed` puis « Valider le choix de la classe »), émission de `choisir`, rendu du choix joué (section 4).
- Les fonctions pures (`liens.ts`, `avatar.ts`, `gestes.ts`) sont testées à part.

## 3. Schéma YAML

`ecranSchema` devient une union discriminée par `app` (`z.discriminatedUnion`). Les champs actuels gardent leur sens ; les nouveaux sont optionnels sauf mention.

### 3.1 Commun
```yaml
appNom: Messages            # nom fictif de l'appli
contact: '+33 6 39 98 12 48'
messages:                   # au moins 1
  - de: contact             # contact | moi
    texte: '…'
    texteSimple: '…'        # inchangé
    heure: '09:12'          # NOUVEAU, optionnel, HH:MM
    apercu:                 # NOUVEAU, optionnel : carte sous la bulle
      titre: 'Colis Express : suivi de votre colis'
      domaine: colis-xp.net
```
- **Liens** : repérés automatiquement dans `texte` et `texteSimple` (domaine avec au moins un point, chemin éventuel, adresses mail exclues), affichés soulignés avec la couleur de lien de l'appli et précédés d'un « lien : » visible des lecteurs d'écran seulement. Ils ne sont pas cliquables.
- **Heure de la barre d'état** : l'heure du dernier message, sinon `14:32`.
- **Avatar** : initiales et teinte dérivées de `contact`, jamais écrites dans le YAML.

### 3.2 Par appli
| `app` | Champs propres | Rendu |
|---|---|---|
| `sms` | aucun | Fil de bulles, numéro ou nom en en-tête. |
| `chat` | aucun | Fil de bulles au style messagerie de jeu (en-tête de salon). |
| `social` | `certifie?: boolean`, `abonnes?: texte` (nombre seul, ex. `'2 400'`, l'interface ajoute « abonnés »), `bio?: texte`, `media?: { description, descriptionSimple? }`, `stats?: { vues?, jaime?, partages? }` (nombres seuls en texte, ex. `'1 200'`, l'interface ajoute « vues », « j’aime », « partages »), `commentaires?: [{ de, texte, texteSimple? }]` (`de` = pseudo, 1 à 5) | Publication : en-tête du compte (avatar, nom, badge certifié ou non, abonnés, bio), texte, cadre média décrit (aucune image réelle), compteurs, puis commentaires. Les `messages` forment le texte de la publication. |
| `mail` | `sujet?`, `adresse?: texte` (forme `x@domaine`), `pieceJointe?: { nom }` | Objet en titre, expéditeur (nom en gras, adresse en dessous, toujours visible), date ou heure, corps, pièce jointe en carte avec icône. |
| `web` | `url?` | Barre d'adresse en haut (le domaine en gras, le reste atténué), titre de page = `contact`, contenu en blocs. **Aucun cadenas** : seule une adresse `http://` affiche « Non sécurisé ». Sans `url`, pas de barre d'adresse : c'est l'écran d'une appli (ex. magasin d'applis). |

### 3.3 Choix
```yaml
choix:
  - id: clique
    texte: 'C’est sûrement mon colis : j’ouvre le lien.'
    qualite: risque
    geste: ouvrir-lien      # NOUVEAU, obligatoire sauf pour qualite: aide (défaut demander-aide)
    consequence: '…'
  - id: repond
    texte: 'Je réponds pour demander qui c’est.'
    qualite: bon
    geste: repondre
    reponse: 'C’est qui ?'  # NOUVEAU, obligatoire si geste: repondre (bulle envoyée)
    reponseSimple: '…'      # optionnel
    consequence: '…'
```
Gestes et bannières (formulations neutres : le téléphone ne dit jamais si le choix était bon, c'est le rôle du débrief) :

| Geste | Bannière jouée |
|---|---|
| `repondre` | bulle « moi » avec `reponse` (pas de bannière) |
| `ouvrir-lien` | Lien ouvert |
| `se-connecter` | Connexion en cours… |
| `telecharger` | Téléchargement lancé |
| `installer` | Installation lancée |
| `payer` | Paiement envoyé |
| `partager` | Publication partagée |
| `verifier` | Tu vérifies par un autre moyen |
| `bloquer` | Contact bloqué |
| `signaler` | Signalement envoyé |
| `ignorer` | Message ignoré |
| `supprimer` | Message supprimé |
| `demander-aide` | Tu poses ton téléphone pour demander de l'aide |

### 3.4 Validation
- Zod : union par `app`, `heure` au format `HH:MM`, `adresse` au format mail, `reponse` obligatoire si et seulement si `geste: repondre`, `geste` obligatoire sauf pour un choix `aide`.
- `tests/unit/node/content-real.test.ts` : `textesDesFauxEcrans` et le test des citations incluent les nouveaux champs (adresse, pièce jointe, aperçus, média, bio, abonnés, commentaires, réponses), en version normale et simplifiée.

## 4. Les choix dans le téléphone

### 4.1 Zone d'actions
- Sous le contenu de l'appli, séparée par un intitulé « Que fais-tu ? » (la question complète reste en titre du panneau).
- Une liste de vrais `<button>` dans l'ordre stable `ordreAffichage(choix, graine)`, chacun avec l'icône de son geste (décorative) et le texte du choix ; attribut `data-choix` conservé pour les tests.
- Style adapté à l'appli (réponses suggérées en SMS et chat, boutons pleine largeur en mail, web et social), cibles d'au moins 44 px de haut.
- Mode classe : un clic sélectionne (`aria-pressed`), puis « Valider le choix de la classe ». Mode binôme : la consigne « Discutez à deux » reste dans le panneau.

### 4.2 Le choix joué
- `choixJoue` renseigné : la zone d'actions disparaît ; le téléphone ajoute, à la fin du fil, la bulle « moi » (`repondre`) ou la `BanniereSysteme` du geste, puis la zone défile jusqu'à elle.
- Le choix joué s'affiche dans une zone `role="status"` placée à la fin de l'écran et présente dès le montage (vide tant qu'on attend) : la bulle ou la bannière est annoncée poliment.
- Le focus suit le mécanisme existant (`focusAuChangement` sur le titre du panneau), jamais déplacé dans le téléphone.
- Apparition en fondu court (150 ms), supprimée si le réglage « animations » est désactivé ou si `prefers-reduced-motion`.

## 5. Écran verrouillé (étape « fil »)
- `VerrouillageApp` : grande heure, date fictive, puis les notifications empilées : icône (initiales de l'appli), nom de l'appli, heure, expéditeur, texte.
- Chaque notification est un bouton `aria-expanded` ; ouverte, elle montre ses 4 actions (« J’ouvre / je clique », « Je vérifie autrement », « Je signale », « J’ignore ») sous forme de boutons `aria-pressed` (pas de boutons radio : les flèches du clavier changeraient l'action et refermeraient la notification). Une seule notification ouverte à la fois ; le focus revient sur la notification après l'action.
- Une action choisie referme la notification et affiche son état en texte (« Ignorée », « Signalée »…), modifiable en la rouvrant.
- `FilStep` affiche la consigne en titre, un compteur « 3 notifications traitées sur 5 » et « Valider mes choix », actif quand tout est traité. Le moteur reçoit le même événement `fil-termine`.
- Schéma du fil : ajout de `heure?` (HH:MM) par notification, rien d'autre.

## 6. Visuel et accessibilité
- **Aplats opaques**, pas d'effet de verre (contraste). Variables par appli dans `theme.css` (couleur d'accent, bulle reçue, bulle envoyée, lien), contrastes texte d'au moins 4.5:1.
- **Coque** : largeur `min(100%, 24rem)`, jusqu'à `28rem` en taille de texte « très grand » ; zone défilante `tabindex="0"`, `role="region"` nommée « Contenu de l'écran : <appli> » (règle axe `scrollable-region-focusable`).
- **Structure** : `figure` nommée pour l'appareil ; liste ordonnée de bulles ; zone `role="status"` pour le choix joué ; chaque bulle précédée de « <contact> : » ou « Toi : » visible des lecteurs d'écran ; ordre du DOM identique à l'ordre visuel.
- **Décoratif** (`aria-hidden`) : barre d'état, avatars, icônes de geste, compteurs graphiques ; leur information utile existe en texte.
- **Lecture simplifiée** : `texteSimple`, `reponseSimple`, `descriptionSimple` via `useTexte`, comme aujourd'hui.
- **Accents et apostrophes** : U+2019 dans tous les libellés.

## 7. Migration du contenu
Les 21 missions classiques et Rappel sont migrées en une passe, sans changer le sens des textes :
- `contact: 'Nom <adresse>'` en mail → `contact: Nom` + `adresse`.
- Descriptions entre crochets dans les textes (« [Vidéo de 5 secondes : …] ») → `media.description` (social) ; compteurs écrits dans le texte (« 1 200 vues · 87 partages ») → `stats` ; « · 2 400 abonnés · bio : … » dans `contact` → `abonnes` et `bio`.
- Un `geste` (et une `reponse` si `repondre`) pour chaque choix non `aide` ; heures plausibles sur les messages.
- Les citations des `truc` doivent rester présentes à l'écran : le test des citations fait foi.
- Les fichiers des parcours (`*-parcours.yaml`) ne sont pas touchés.

## 8. Autres consommateurs
- `PlanBPage.vue` imprime les nouveaux champs : adresse et pièce jointe (mail), média, compteurs et commentaires (social), aperçus de lien ; les choix restent imprimés comme aujourd'hui, sans geste.
- `FinMission.vue` (notification surprise) : inchangé.

## 9. Tests
- **Unitaires, fonctions pures** : `liens.ts` (domaines, chemins, adresses mail exclues, texte sans lien), `avatar.ts` (initiales, teinte stable), `gestes.ts` (chaque geste a icône et libellé).
- **Unitaires, composants** : chaque appli rend ses champs ; `Telephone` émet `choisir`, respecte le mode classe, masque les actions et joue le choix (bulle ou bannière) quand `choixJoue` est renseigné, réaffiche les actions quand il repasse à `null` ; `VerrouillageApp` ouvre, agit, referme et émet `agir`.
- **Schéma** : union par `app`, règles `geste` et `reponse`, formats `heure` et `adresse`.
- **Contenu réel** : tests existants étendus aux nouveaux champs (section 3.4).
- **Bout en bout** : `parcours.spec.ts` et `a11y.spec.ts` adaptés (les sélecteurs `data-choix` restent valides) ; audit axe d'un scénario par appli et du fil.

## 10. Hors périmètre
- Éléments touchables pour inspecter (lien, expéditeur) et action « vérifier » où l'élève désigne le domaine : piste forte pour une spec suivante (la recherche montre que faire désigner le domaine réduit le phishing réussi).
- Tests de régression visuelle par capture d'écran : rendus différents selon l'OS et les polices, à reconsidérer avec une image Playwright fixe.
- Mode sombre, nouveaux types d'appli (appel, galerie), parcours 6e.

## 11. Risques
- **Migration du contenu** (environ 57 écrans et 200 choix) : risque de casser une citation ou une longueur de choix ; couvert par les tests de contenu, relu fichier par fichier.
- **Annonces des régions live** : support variable selon les lecteurs d'écran ; à vérifier avec NVDA et VoiceOver avant publication.
- **Place à l'écran en très grand texte** : le téléphone s'élargit et défile ; à vérifier en mode classe projeté.
