# Cyber Réflexes, étape 3 : thèmes sensibles (cyberharcèlement, rencontres en ligne)

- **Date** : 2026-10-05
- **Statut** : à valider
- **Prérequis** : étapes 1 et 2 et évolution « pourquoi » livrées (`2026-09-24-cyber-reflexes-design.md`, `2026-09-28-pourquoi-leviers-design.md`, `2026-10-01-etape-2-design.md`)

## 1. Objectif

Rendre jouables les deux derniers thèmes, marqués `sensible: true` dans `content/themes.yaml` :

| Thème (id) | Rôles joués | Mini-jeu (existant) |
|---|---|---|
| Cyberharcèlement (`harcelement`) | victime, témoin, auteur | `tri` : « Blague, conflit ou harcèlement ? » |
| Rencontres en ligne (`rencontres`) | victime, témoin (jamais auteur) | `repere` : les signaux d’alerte dans une conversation |

Ces thèmes touchent des élèves qui peuvent vivre la situation au moment où ils jouent. La priorité n’est pas de « repérer le piège » mais de **savoir que ce n’est pas ta faute, que tu peux en parler, et à qui**.

### Critères de succès
- 6 nouvelles missions (2 thèmes × 3 niveaux), chacune avec 3 scénarios et le mini-jeu de son thème.
- **Aucune mission sensible n’est publiée sur le site tant qu’elle n’a pas été relue** par une association spécialisée (section 4). Le contenu peut être écrit, testé et joué en local avant.
- Toutes les règles de contenu existantes passent, plus les règles éditoriales des thèmes sensibles (section 5), vérifiées par des tests quand c’est automatisable.
- Les parcours passent l’audit axe (aucune violation critique ou sérieuse), y compris l’avertissement, le bandeau d’aide et les nouvelles actions de récupération.

## 2. Ce que le moteur fait déjà (rien à changer)
- Écran d’avertissement avant la mission (`SensibleAvertissement.vue`), bouton « Passer ce scénario » sans pénalité, bandeau d’aide permanent (`BandeauAide.vue`, numéros de `themes.yaml`).
- Rôle affiché en tête de scénario (`role: victime | temoin | auteur`).
- `fiche.siRevelation` obligatoire pour un thème sensible (`src/content/validate.ts`).
- Actions de récupération réutilisées : `capture-preuve`, `bloquer-signaler`, `demander-aide`.

## 3. Évolutions du moteur

### 3.1 Leviers adaptés aux relations entre personnes
Les 8 leviers actuels décrivent surtout des arnaques. Ils restent valables ici (`peur`, `groupe`, `confiance`, `gain`, `urgence`), mais il manque les ressorts propres au harcèlement et à la manipulation affective. Ajout de 5 leviers à `LEVIERS` et à `content/leviers.yaml` (libellé à la première personne, parade, question de débrief) :

| id | Libellé (proposition) | Parade (proposition) |
|---|---|---|
| `flatterie` | Il ou elle me faisait me sentir spécial·e | Quelqu’un qui te couvre de compliments très vite cherche parfois quelque chose. Prends ton temps. |
| `secret` | On m’a demandé de garder le secret | Un adulte ou un ami bienveillant ne te demande jamais de cacher une relation à tes proches. |
| `honte` | J’avais honte d’en parler | Ce n’est pas toi qui as honte à avoir. En parler, c’est ce qui fait que ça s’arrête. |
| `humour` | C’était juste pour rire | Une blague qui fait rire tout le monde sauf la personne visée n’est plus une blague. |
| `colere` | J’étais en colère, je voulais répondre | Répondre sous le coup de la colère donne souvent prise. Garde les preuves et fais une pause. |

Le texte de `FinMission.vue` « Aucun piège n’a marché sur toi cette fois » devient neutre pour les thèmes sensibles : « Tu as fait les bons choix cette fois. Ce qui peut faire hésiter : ».

### 3.2 Deux actions de récupération
Ajoutées à `RECOVERY_ACTIONS`, chacune un composant de `src/recovery/`, jouable au clavier, avec le même schéma d’étapes guidées que les actions existantes :

- **`soutenir`** (témoin) : écrire en privé à la personne visée. L’élève choisit parmi 3 ou 4 messages proposés (« Je suis là si tu veux en parler », « Tu veux que j’en parle à un adulte avec toi ? »…), avec un retour sur chacun : un message qui minimise (« Laisse tomber, ils sont bêtes ») est expliqué sans être interdit. Rappel final : ne pas répondre publiquement aux harceleurs à la place de la victime, garder une capture, prévenir un adulte.
- **`retirer-publication`** (auteur) : supprimer le message ou la photo partagée, puis envoyer des excuses (choix parmi des formulations, dont une « excuse qui n’en est pas une » expliquée), puis prévenir les autres de ne pas repartager. Rappel final : c’est possible de réparer, et en parler à un adulte aide aussi.

### 3.3 Publication contrôlée par la relecture (section 4)

## 4. Relecture avant publication

### 4.1 Dans le contenu
Nouveau champ de mission, obligatoire pour un thème sensible (règle dans `validate.ts`) :

```yaml
relecture:
  statut: a-relire        # a-relire | relue
  par: e-Enfance / 3018   # obligatoire si relue
  date: 2026-11-15        # obligatoire si relue
```

### 4.2 Dans le build
- `buildContent` reçoit une option `brouillons: boolean`.
- **Production** (`npm run build`, CI, GitHub Pages) : les missions sensibles dont le statut n’est pas `relue` sont **exclues du bundle**. Le thème reste « Bientôt disponible » sur la carte tant qu’il n’a aucune mission relue.
- **Développement** (`npm run dev`) ou build avec `VITE_BROUILLONS=1` : elles sont incluses, avec un bandeau « Brouillon : contenu pas encore relu, ne pas utiliser en classe » en tête de mission et sur la fiche enseignant.
- Les tests de contenu chargent toujours **tout** le contenu (brouillons compris).

### 4.3 La relecture elle-même
Elle se fait hors code : le contenu est envoyé à une association spécialisée (candidate naturelle : **e-Enfance**, qui opère le 3018 ; possibles en complément : l’association Hugo !, l’Unaf pour les fiches familles). Le format envoyé est la **fiche enseignant imprimable** de chaque mission (déjà générée par `FicheMissionPage`), complétée d’un export lisible de tous les textes des scénarios (script `npm run export:relecture` qui écrit un Markdown par mission dans `dist-relecture/`). Les retours sont intégrés, puis `statut: relue` est posé mission par mission.

## 5. Règles éditoriales

Règles du spec initial (§ 3.6) précisées, et **tests de contenu** associés quand c’est automatisable :

| Règle | Test |
|---|---|
| Chaque mission `harcelement` joue les 3 rôles (un scénario victime, un témoin, un auteur). | oui |
| `rencontres` : rôle `victime` ou `temoin` uniquement, jamais `auteur` ; aucun rôle de prédateur. | oui |
| Chaque scénario sensible avec un choix `risque` a une récupération (et non 2 sur 3 comme ailleurs). | oui |
| Aucune formule culpabilisante dans les conséquences, indices et « À retenir » : liste noire (« ta faute », « tu aurais dû », « tu n’aurais pas dû », « bien fait », « naïf », « naïve », « bête », « idiot »…), avec une seule exception : « ce n’est pas ta faute ». | oui |
| Chaque mission cite le 3018 dans au moins un « À retenir ». | oui |
| Chaque mission `rencontres` dit explicitement « ce n’est pas ta faute » et, si elle traite de chantage, « ne paie pas » et « n’envoie rien de plus ». | oui |
| Faux écrans : aucun vocabulaire sexuel explicite, aucune description d’image intime ; liste noire de mots dans `ecran.messages`. | oui |
| Le joueur n’envoie jamais lui-même une image intime, dans aucun choix. Le chantage passe par un montage, un bluff ou une confidence d’ami. | relecture |
| Le choix `risque` reste une vraie pensée d’ado (règle « pourquoi ») mais n’est jamais présenté comme la cause de ce qui arrive : la responsabilité est toujours du côté de l’auteur. | relecture |
| Le choix `aide` nomme un adulte concret ou le 3018, et sa conséquence dit ce qui se passe ensuite (écoute, retrait du contenu, protection). | relecture |
| Le harcèlement scolaire est un délit (loi du 2 mars 2022) : dit aux lycéens et dans la fiche enseignant, sans en faire une menace pour les plus jeunes. | relecture |
| `fiche.siRevelation` : quoi faire si un élève se confie (écouter sans promettre le secret, ne pas interroger, prévenir CPE, infirmier·e et chef d’établissement, protocole pHARe, information préoccupante si besoin). | relecture |
| Sources de vérification des faits : `nonauharcelement.education.gouv.fr`, e-Enfance / 3018, CNIL, `internet-signalement.gouv.fr`. | relecture |

Les missions `harcelement` ont `competences.phare: true`.

## 6. Contenu : 6 missions, 18 scénarios

Marques et pseudos fictifs, numéros fictifs, 6e ≤ 20 mots par phrase et versions simplifiées, citations des `truc` présentes à l’écran, choix risqué pas systématiquement le plus long.

### 6.1 Cyberharcèlement

| Niveau | Victime | Témoin | Auteur | Mini-jeu `tri` |
|---|---|---|---|---|
| 6e | un surnom moqueur repris par tout le groupe de classe | la photo d’un camarade transformée en sticker qui circule | un commentaire « pour rire » sous la vidéo d’un camarade, d’autres en rajoutent | 6 cartes |
| 5e – 3e | exclu du groupe, puis un faux compte à ton nom | un sondage « le plus moche de la classe » dans le groupe | transférer la capture d’une conversation privée pour se venger | 8 cartes |
| Lycée | rumeur et messages répétés après une rupture | un raid de commentaires sur le compte d’une élève | partager la vidéo humiliante d’une soirée | 8 cartes |

Le `tri` classe des situations en « Blague partagée », « Conflit ponctuel », « Harcèlement » ; les explications reprennent les trois critères (répétition, effet de groupe, personne visée qui ne peut pas se défendre) et rappellent qu’on peut en parler dans tous les cas.

Récupérations : victime → `capture-preuve` puis `demander-aide` ; témoin → `soutenir` ; auteur → `retirer-publication`.

### 6.2 Rencontres en ligne

| Niveau | Scénario 1 (victime) | Scénario 2 (victime) | Scénario 3 (témoin) | Mini-jeu `repere` |
|---|---|---|---|---|
| 6e | un joueur « plus âgé » très sympa dans un jeu offre des gemmes et demande de garder le secret | il propose de passer sur une autre appli et demande une photo « pour voir à quoi tu ressembles » | un ami dit qu’il va retrouver samedi un « ami du jeu » | 6 lignes, 4 signaux |
| 5e – 3e | un compte « du même âge » qui complimente beaucoup, puis isole (« tes parents ne comprendraient pas ») | chantage avec une photo truquée par IA à partir de ta photo de profil : « paie ou je la diffuse » | un ami raconte qu’on le fait chanter et dit qu’il a trop honte pour en parler | 8 lignes, 5 signaux |
| Lycée | mail de chantage « j’ai piraté ta webcam » (arnaque envoyée en masse, bluff) | rencontre sur une appli : la personne refuse toute visio, puis demande des photos et de l’argent | une amie apprend qu’une photo d’elle circule | 8 lignes, 5 signaux |

Le `repere` montre une conversation fictive avec un inconnu ; les signaux à trouver : compliments rapides, cadeaux, demande de secret, changement d’appli, demande de photo, proposition de rencontre, pression ou menace. Le texte de fin rappelle que repérer ces signaux n’oblige à rien d’autre que d’en parler.

Récupérations : chantage → `capture-preuve` puis `bloquer-signaler` ; contact inquiétant → `bloquer-signaler` ; témoin → `soutenir` puis `demander-aide` (3018, qui peut faire retirer un contenu).

## 7. Tests
- **Unitaires** : composants `soutenir` et `retirer-publication` (déroulé complet, retour sur chaque choix, clavier, focus) ; schéma (`relecture` obligatoire et cohérent, nouveaux leviers obligatoires dans `leviers.yaml`) ; `buildContent` avec et sans brouillons ; bandeau « Brouillon » ; texte neutre de `FinMission` en thème sensible.
- **Contenu réel** : couverture (une mission par niveau pour les 2 thèmes) ; règles de la section 5 ; règles existantes inchangées.
- **E2E** : une mission par thème sensible jouée en entier en mode brouillon (avertissement, « Passer ce scénario », bandeau d’aide, chaque nouvelle action de récupération) ; audit axe des mêmes écrans ; un test sur le build de production vérifie qu’une mission `a-relire` n’apparaît pas.

## 8. Découpage proposé
1. Moteur : leviers, `relecture` et build filtré, `FinMission` neutre (tests d’abord).
2. Actions `soutenir` et `retirer-publication`.
3. Missions `harcelement` (3) et leurs tests de contenu.
4. Missions `rencontres` (3) et leurs tests de contenu.
5. Script d’export pour la relecture, envoi à l’association (hors code), puis passage en `relue` mission par mission.

Les étapes 1 à 4 peuvent être fusionnées dans `main` sans rien changer au site publié, grâce au filtre de la section 4.2.

## 9. Hors périmètre
- Mini-jeux nouveaux : `tri` et `repere` suffisent.
- Tchat ou mise en relation réelle avec le 3018 depuis le jeu : seul le numéro et le lien officiel sont affichés.
- Témoignages réels, photos réelles, noms d’élèves réels.
- Protocole d’évaluation et espace enseignant avec classes (« Plus tard »).

## 10. Points à trancher
1. Le scénario de chantage par photo truquée en 5e – 3e : pertinent (cas en hausse) mais à confirmer avec l’association pour cet âge.
2. Libellés exacts des 5 nouveaux leviers, et faut-il plutôt réutiliser `peur` et `confiance` pour limiter leur nombre.
3. Association relectrice à contacter, et qui s’en charge (toi, ou l’ESAIP via un enseignant).
