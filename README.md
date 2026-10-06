# Cyber Réflexes

**Jouer : [silax49.github.io/Cybergame](https://silax49.github.io/Cybergame/)**

Jeu web gratuit de sensibilisation aux risques numériques, de la 6e à la Terminale. Sans compte ni installation,
jouable hors ligne. Aucune donnée ne quitte l’appareil.

## Commandes

| Commande | Rôle |
|---|---|
| `npm install` | Installer les dépendances (Node 22) |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests unitaires et tests du contenu |
| `npm run test:e2e` | Tests de bout en bout et d’accessibilité (Playwright) |
| `npm run lint` / `npm run typecheck` | Qualité du code |
| `npm run build` | Site statique dans `dist/` |

Variable optionnelle `VITE_CONTACT_URL` : lien « Signaler une erreur » de l’espace enseignants.

## Écrire une mission

Une mission est un fichier YAML dans `content/missions/<thème>/<id>.yaml`. Le schéma complet est dans
`src/content/schema.ts`. Le build **refuse** un fichier invalide et indique le fichier, le champ et la règle en cause.
Après avoir ajouté un fichier, relancer `npm run dev`.

Règles principales :
- 3 objectifs maximum ; 3 ou 4 scénarios et 1 mini-jeu par mission classique (parcours : voir plus bas).
- Mini-jeux disponibles : `tri`, `repere`, `motdepasse` (objectif `solide` ou `tres-solide`, mots `interdits`),
  `confidentialite` (3 à 8 réglages, au moins un à changer), `verification` (publication, 2 à 5 pistes d’enquête,
  verdict `fiable` / `douteux` / `faux`), `permissions` (1 à 3 applis, 2 à 5 permissions chacune). Le schéma de chacun est
  dans `src/content/schema.ts`.
- Faux écran (`ecran.app`) : `sms`, `chat`, `social` (`certifie`, `abonnes`, `bio`, `media`, `stats`, `commentaires`),
  `mail` (`adresse`, `sujet`, `pieceJointe`), `web` (`url`, sans `url` pour l’écran d’une appli). Chaque message peut avoir
  une `heure` (HH:MM) et un `apercu` de lien ; les liens sont repérés automatiquement dans le texte.
- Chaque choix `bon` ou `risque` a un `geste` (ce que le téléphone montre quand on le choisit : `ouvrir-lien`, `bloquer`…) ;
  le geste `repondre` exige une `reponse`, le message envoyé. La liste est dans `src/content/schema.ts` (`GESTES`).
- Chaque scénario a un choix `aide` (« Je demande de l’aide… »), au moins un indice pertinent et un `aRetenir`.
- Chaque scénario avec un choix `risque` a un bloc `pourquoi` : 3 ou 4 leviers (`content/leviers.yaml`), chacun avec
  `truc` (comment l’arnaqueur a joué sur ce levier ici) et `parade` (le geste à faire la prochaine fois).
- Le texte du choix `risque` est la vraie pensée d’un ado, qui tente vraiment : jamais une évidence.
- Actions de récupération (`recuperation.action`) : notamment `prevenir-contacts` et `corriger-partage`
  (« Préviens que c’était faux », pour une fausse info partagée) ; la liste complète est dans `src/content/schema.ts`.
- `recuperation.siChoix` ne cite que des choix `risque` ou `bon`, jamais le choix `aide`.
- Marques **fictives** uniquement dans les faux écrans (un test le vérifie).
- 6e : `texteSimple`, `consequenceSimple` (choix risqués) et `aRetenirSimple` obligatoires.
- Thème sensible : `fiche.siRevelation` obligatoire, et relecture par une association spécialisée avant publication.
- Ton : tutoiement, jamais culpabilisant, une conséquence réaliste et toujours une action possible.

Exemple de référence : `content/missions/phishing/p-6e-colis.yaml`.

### Parcours de l’île (6e)

Une mission `format: parcours` est une traversée d’île : 4 à 6 étapes `type: lieu` (et au plus un mini-jeu), sans faux
écran ni étape « indices ». Chaque lieu a un nom (`lieu`), un décor dessiné (`decor`, liste `DECORS` dans
`src/content/schema.ts`), un récit à la 2e personne (`guide`, et `guideSimple` en 6e), une question et des choix avec
leur `reaction` (`reactionSimple` pour les choix risqués en 6e). Les règles des scénarios s’appliquent : choix `aide`
(qui commence par « Je demande de l’aide »), bloc `pourquoi`, `aRetenir`, récupération sur au moins 2 lieux. Les
citations « … » d’un `truc` doivent figurer dans le récit. Un décor différent par lieu.

Exemple de référence : `content/missions/comptes/c-6e-parcours.yaml`.

Règle de progression : l’élève n’avance d’une plateforme que sur un choix `bon` ou `aide`. Après un piège, il voit
le pourquoi, la réaction et le geste de récupération éventuel, puis il reste sur le même lieu et réessaie, le choix
risqué déjà essayé étant barré. Au premier parcours, l’élève choisit son personnage (conservé ensuite, modifiable dans
les réglages) ; la mission s’affiche sur une île propre à son thème, où le personnage saute de plateforme en
plateforme jusqu’à l’objet à gagner. Un parcours dont le thème n’a pas d’île garde la progression classique, sans
personnage ni scène.

Règles d’écriture propres à cette progression :
- la `reaction` d’un choix risqué ne suggère jamais de passer à la suite (« tu continues ta route… ») : l’élève reste
  sur place et va réessayer ; elle peut en revanche évoquer le nouvel essai ;
- le choix piège ne doit pas se reconnaître à sa forme (longueur, ton, ponctuation, justification) : les bons choix
  sont justifiés, les choix risqués le sont parfois aussi ;
- « Réflexe vérif » exige qu’aucun piège n’ait été essayé dans aucun lieu, même un lieu ensuite passé ;
- le retour en arrière est présenté à l’élève comme un jeu : « Dans la vraie vie, on ne revient pas en arrière ; ici,
  tu peux rejouer ce moment. », puis « Retour au même moment : essaie un autre choix. ».

## Déploiement

Le site est publié sur GitHub Pages par `.github/workflows/ci.yml` à chaque push sur `main`, une fois lint,
types, tests unitaires, tests du contenu et tests E2E passés.

Première mise en place :
1. Créer le dépôt sur GitHub et pousser la branche `main`.
2. Dans *Settings → Pages*, choisir *Source : GitHub Actions*.
3. (Optionnel) Dans *Settings → Secrets and variables → Actions → Variables*, ajouter `VITE_CONTACT_URL`
   (par exemple l’URL des issues du dépôt), puis l’exposer au build dans le workflow si besoin.
