# Cyber Réflexes

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
- 3 objectifs maximum ; 3 ou 4 scénarios et 1 mini-jeu (`tri` ou `repere`) par mission.
- Chaque scénario a un choix `aide` (« Je demande de l’aide… »), au moins un indice pertinent et un `aRetenir`.
- Chaque scénario avec un choix `risque` a un bloc `pourquoi` : 3 ou 4 leviers (`content/leviers.yaml`), chacun avec
  `truc` (comment l’arnaqueur a joué sur ce levier ici) et `parade` (le geste à faire la prochaine fois).
- Le texte du choix `risque` est la vraie pensée d’un ado, qui tente vraiment : jamais une évidence.
- `recuperation.siChoix` ne cite que des choix `risque` ou `bon`, jamais le choix `aide`.
- Marques **fictives** uniquement dans les faux écrans (un test le vérifie).
- 6e : `texteSimple`, `consequenceSimple` (choix risqués) et `aRetenirSimple` obligatoires.
- Thème sensible : `fiche.siRevelation` obligatoire, et relecture par une association spécialisée avant publication.
- Ton : tutoiement, jamais culpabilisant, une conséquence réaliste et toujours une action possible.

Exemple de référence : `content/missions/phishing/p-6e-colis.yaml`.

## Déploiement

Le site est publié sur GitHub Pages par `.github/workflows/ci.yml` à chaque push sur `main`, une fois lint,
types, tests unitaires, tests du contenu et tests E2E passés.

Première mise en place :
1. Créer le dépôt sur GitHub et pousser la branche `main`.
2. Dans *Settings → Pages*, choisir *Source : GitHub Actions*.
3. (Optionnel) Dans *Settings → Secrets and variables → Actions → Variables*, ajouter `VITE_CONTACT_URL`
   (par exemple l’URL des issues du dépôt), puis l’exposer au build dans le workflow si besoin.
