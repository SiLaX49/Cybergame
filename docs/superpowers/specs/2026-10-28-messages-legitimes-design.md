# Situations fiables (messages légitimes) : conception, première version

Source : `docs/recherche/2026-10-28-messages-legitimes.md`. Validé par Noa le 28 octobre 2026 (échange en conversation).

## Pourquoi

Toutes les situations principales sont des arnaques : répondre « c’est une arnaque » suffit à réussir. Le jeu entraîne alors un biais de réponse (« tout est suspect ») au lieu du discernement. On ajoute des situations où le message est vrai et sans danger.

## Objectifs

- Une situation **fiable** est un scénario marqué `fiable: true` : le message est authentique, il n’y a rien à déjouer.
- Première version : **une situation fiable par mission classique 6e et 5e – 3e, hors thèmes sensibles** (12 missions, environ 25 % des scénarios de ces missions). Placée au milieu des autres scénarios (2e ou 3e position), jamais annoncée.
- On attend la séance pilote avant de monter vers 40 %, d’en ajouter au lycée, dans les parcours ou dans les thèmes sensibles.

## Règles de jeu (tirées de la recherche)

- **Vérifier n’est jamais une faute.** Sur un message fiable, « vérifier par un autre moyen » ou « demander à un adulte » rapporte autant qu’agir directement (qualités `bon` et `aide`).
- **L’erreur, c’est d’en faire trop ou de passer à côté** : bloquer un proche, accuser, signaler sans vérifier, ignorer une information importante (qualité `risque`). Ton doux, jamais « tu étais parano ».
- **Une situation fiable ne demande jamais d’argent, de code ni de mot de passe.**
- Après un choix `risque`, pas de questions « pourquoi tu t’es fait avoir » (les leviers d’arnaque n’ont pas de sens) ni de geste de récupération : on passe à la conséquence ; « Rejouer ce scénario » permet de réparer (octets « Retenté et trouvé »).

## Ce qui change

- **Schéma** : `fiable` (booléen, faux par défaut). Un scénario fiable n’a ni `pourquoi` ni `recuperation` ; un choix `risque` y est permis sans `pourquoi`.
- **Textes de l’interface** quand `fiable` :
  - bloc d’indices : « Ce qui montrait que c’était fiable » au lieu de « Ce qui devait t’alerter » ;
  - verdict d’un choix `risque` : « Ce message était vrai. Regarde ce qui se passe. » au lieu de « C’était risqué » ;
  - bandeau du téléphone : « Message vrai » (neutre, sans secousse ni halo rouge) au lieu de « Piège » ;
  - Plan B : « Souligne dans le message ce qui montre qu’il est fiable. » et, au corrigé, « Indices de confiance ».
  - Fiche enseignant : nombre de situations fiables dans « En bref ».
- **Octets, badges** : inchangés (le moteur traite déjà un `risque` sans `pourquoi`).
- **Tests de contenu** : le bloc `pourquoi` reste obligatoire sauf pour les situations fiables ; chaque mission ciblée a exactement une situation fiable, jamais en premier ; aucune situation fiable dans un thème sensible.

## Hors périmètre (après la séance pilote)

Ratio 40 %, lycée, parcours (lieux), thèmes sensibles, mesures de faux positifs (impossible sans données qui quittent l’appareil : la séance pilote sert de mesure), titre commun « Comment décider ? ».

## Choix laissés au rédacteur

Le contenu des 12 situations (app, contact, texte), en s’appuyant sur les exemples du dossier : ENT, parent, club, transport, appli bancaire, mise à jour officielle, vraie info vérifiée, etc. Applis fictives du registre uniquement, aucune marque réelle.
