# Cyber Réflexes : messages légitimes

> Dossier de recherche (Perplexity), date de référence : 28 octobre 2026. Repris de la réponse Perplexity, légèrement condensé (liens en double retirés) ; sert de source à la conception des situations légitimes (message sans danger). Les liens et chiffres cités n’ont pas été revérifiés un par un : utilisable pour la conception, à vérifier avant toute citation publique (fiche enseignant, communication).

Ajouter des messages légitimes est méthodologiquement indispensable. Avec 100% d’arnaques, le jeu mesure surtout la stratégie « toujours répondre arnaque », donc un biais de réponse, et non la capacité à discriminer le vrai du faux, exactement la distinction faite par la théorie de la détection du signal. [lorrie.cranor](https://lorrie.cranor.org/pubs/johnny_paper.pdf)

Il n’existe pas de ratio consensuel du type 30/70 ou 50/50. Pour une première version, je recommande **40% de situations légitimes et 60% de situations dangereuses**, avec une évaluation séparée à 50/50 et, plus tard, un mode réaliste où les menaces sont rares. Le ratio 40/60 est une **recommandation de conception**, pas un résultat scientifique établi.

**Niveaux de preuve employés ci-dessous :**

- **Consensus** : convergence de plusieurs études, revues ou recommandations institutionnelles.
- **Étude unique** : résultat intéressant mais insuffisant pour fixer seul une règle.
- **Avis de conception** : proposition déduite des données, faute de comparaison expérimentale directe.

## 1. Biais de réponse unique

### Ce que mesure réellement le jeu

La théorie de la détection du signal sépare deux dimensions : la **sensibilité**, notée d′, c’est-à-dire la capacité à distinguer deux catégories, et le **critère de réponse**, c’est-à-dire la tendance générale à répondre « dangereux » ou « légitime ». Un entraînement composé uniquement d’arnaques peut déplacer le critère vers « tout est suspect » sans améliorer la sensibilité. [academia](https://www.academia.edu/97699662/Education_and_Training_Against_Threat_of_Phishing_Emails)

| Message réel | Réponse « dangereux » | Réponse « légitime » |
|---|---|---|
| Malveillant | Détection correcte | Faux négatif |
| Légitime | Faux positif | Rejet correct |

Sans messages légitimes, il est impossible de mesurer les faux positifs ou de savoir si l’élève analyse réellement les indices. Un score élevé peut simplement signifier qu’il a deviné la règle cachée du jeu.

### Effets observés

Dans l’étude de Kumaraguru et al., des tutoriels anti-hameçonnage classiques ont fait passer les faux négatifs de **38% à 12%**, mais les faux positifs de **3% à 41%**. Les participants étaient devenus beaucoup plus méfiants, sans avoir autant amélioré leur discrimination entre sites authentiques et frauduleux (Kumaraguru et al., 2009/2010, [Teaching Johnny Not to Fall for Phish](https://lorrie.cranor.org/pubs/johnny_paper.pdf)).

Une autre expérience a exposé 297 participants à des séries contenant **25%, 50% ou 75% de phishing**. Une fréquence élevée augmentait les détections, mais également les fausses alertes lors d’un test ultérieur où seulement 20% des messages étaient malveillants (Singh, Aggarwal, Rajivan et Gonzalez, 2019, [DOI](https://doi.org/10.1177/1071181319631355)).

À l’inverse, PhishGuru a utilisé sept simulations malveillantes et trois messages légitimes sur 28 jours. L’entraînement a diminué les interactions dangereuses sans réduire significativement les réponses aux messages légitimes, ce qui montre qu’un entraînement correctement conçu peut améliorer la détection sans produire automatiquement de méfiance généralisée (Kumaraguru et al., 2009, [School of Phish](https://cs.pomona.edu/classes/cs190/archive/2024-25-fall/readings/section2/8-Kumaraguru2009-SchoolOfPhish.pdf)).

### Suspicion calibrée

L’objectif n’est donc pas « être méfiant », mais **déclencher une vérification proportionnée lorsque le contexte, la demande ou le canal ne correspondent pas**. Les recherches récentes décrivent ce passage d’une lecture automatique à une analyse de légitimité comme un *cognitive shift* : l’utilisateur commence par comprendre le message, puis suspend son action lorsqu’un élément justifie un examen supplémentaire. [dl.acm](https://dl.acm.org/doi/full/10.1145/3575797)

Les travaux de Canham montrent aussi que connaître les indices ne garantit pas un comportement sûr. Dans une petite étude exploratoire, les « repeat clickers » connaissaient les signes du phishing, mais rapportaient davantage de confiance dans leur capacité, ainsi que des habitudes de consultation plus rigides et automatiques que les utilisateurs systématiquement prudents (Canham, 2023, [Repeat Clicking](https://link.springer.com/chapter/10.1007/978-3-031-48057-7_20)). **Niveau de preuve : étude exploratoire de six entretiens, à ne pas généraliser seule.**

La revue de Jampen et al., portant sur 104 publications, conclut que les entraînements sont généralement utiles, surtout lorsqu’ils proposent pratique, retour immédiat, répétition et variété, mais que leurs effets dépendent fortement du contenu, du public et de la fréquence (Jampen et al., 2020, [article](https://doi.org/10.1186/s13673-020-00237-7)).

### Lassitude

La lassitude n’a pas été démontrée spécifiquement pour un jeu ne contenant que des arnaques, mais elle est cohérente avec les travaux plus généraux sur la *security fatigue*. Dans les entretiens du NIST, plus de la moitié des 40 participants évoquaient spontanément fatigue, résignation, évitement des décisions ou perte de contrôle face aux demandes de sécurité répétées (Stanton et al., 2016, [NIST](https://csrc.nist.gov/pubs/journal/2016/09/security-fatigue/final)).

Le NIST recommande donc de limiter les décisions de sécurité inutiles, de rendre la bonne action simple et de maintenir des règles cohérentes. **Consensus raisonnable :** varier les résultats et enseigner un raisonnement réduit le risque que l’élève clique mécaniquement sur « arnaque ».

## 2. Bonne proportion

### Ce que disent les études

Aucune revue scientifique ne fixe une proportion optimale universelle. Jampen et al. recommandent des exemples réalistes, variés et répétés, mais pas un ratio précis de messages authentiques et malveillants.

| Étude | Composition | Résultat | Limite |
|---|---:|---|---|
| Singh et al., 2019 | 25%, 50% ou 75% de phishing | Plus le phishing était fréquent, plus les détections **et les fausses alertes** augmentaient | Ne désigne pas un ratio optimal |
| Kumaraguru et al., 2009 | 70% simulés malveillants, 30% légitimes | Amélioration conservée 28 jours, sans baisse significative des réponses aux messages légitimes | Le ratio n’était pas manipulé expérimentalement |
| Anti-Phishing Phil | Mélange de sites légitimes et frauduleux | Amélioration de l’exactitude, de la vitesse et de la rétention pendant au moins une semaine | Travail centré sur les URL et les sites |

Les résultats de Singh et al. indiquent qu’un entraînement à 75% malveillant peut apprendre un critère trop méfiant, tandis qu’une fréquence plus faible réduit les fausses alertes mais peut également diminuer les détections. **Étude unique :** ce résultat est le meilleur élément quantitatif disponible, mais ne suffit pas pour proclamer 50/50 supérieur à 30/70.

### Ratio recommandé

**Avis de conception :**

- **Parcours principal : 40% légitimes, 60% dangereux.** Cela conserve une forte densité pédagogique tout en rendant la stratégie « tout est une arnaque » clairement non rentable.
- **Minimum local : trois messages légitimes dans toute fenêtre de dix situations.** Éviter quinze arnaques suivies de cinq messages authentiques, car l’élève pourrait apprendre la séquence.
- **Évaluation de discernement : 50/50**, sans avertir l’élève de la répartition.
- **Mode réaliste après apprentissage : 10 à 20% de menaces.** Singh et al. utilisaient 20% au post-test.
- **Ordre aléatoire contraint :** pas d’alternance régulière, mais jamais plus de trois ou quatre situations de même classe à la suite.

Il faut surtout publier quatre métriques séparées : **taux de détection, taux de faux positifs, taux de faux négatifs et exactitude sur les messages légitimes**. Un score global seul masquerait un élève qui répond systématiquement « danger ».

## 3. Erreur sur un vrai message

### Distinguer trois dimensions

1. **La sécurité :** a-t-il exposé un secret, envoyé de l’argent ou installé quelque chose ?
2. **Le discernement :** a-t-il correctement évalué la situation ?
3. **La proportionnalité :** sa réaction était-elle adaptée au niveau de risque ?

| Réaction à un message légitime | Évaluation conseillée |
|---|---|
| Vérifier par l’application, le site saisi manuellement ou un contact connu, puis agir | Excellente réaction |
| Agir directement dans un canal déjà authentifié et pour une demande sans enjeu sensible | Réaction correcte |
| Ignorer un changement de salle, une annulation ou une échéance importante | Erreur d’utilité, pénalité légère |
| Bloquer un proche, signaler un professeur ou accuser l’expéditeur sans vérifier | Faux positif, pénalité moyenne |
| Communiquer un mot de passe, un code OTP ou valider une opération bancaire | Erreur de sécurité, même si le message vient d’un interlocuteur réel |

Une banque ou un conseiller bancaire légitime ne demande pas de communiquer un mot de passe, un identifiant, un code d’authentification ou de valider une opération destinée à « annuler une fraude » (Banque de France, 2025, [communiqué](https://www.banque-france.fr/fr/communiques-de-presse/fraude-aux-moyens-de-paiement-ensemble-soyons-vigilants)). Une situation présentée comme légitime ne doit donc jamais apprendre qu’il est normal de transmettre ces données.

### Vérification inutile

Une vérification indépendante ne devrait **jamais être pénalisée comme une mauvaise réponse**. Les recommandations institutionnelles conseillent précisément de contacter l’organisme via un numéro, une application ou un site déjà connu, et non via les coordonnées présentes dans le message ([Banque de France](https://www.banque-france.fr/fr/ensemble-dialoguons/ensemble-dialoguons-arnaques-et-fraudes-aux-paiements)).

Le meilleur compromis consiste à donner :

- Le maximum de points de sécurité pour « vérifier par un autre moyen ».
- Éventuellement un petit bonus d’efficacité pour l’action directe lorsqu’elle se déroule dans une application déjà authentifiée et ne comporte aucun enjeu sensible.
- Aucun message culpabilisant du type « tu as été trop méfiant ».
- Une explication sur la proportionnalité : « vérifier était sûr ; dans ce cas, tu pouvais aussi agir directement car la notification se trouvait déjà dans l’ENT authentifié ».

## 4. Indices de confiance

Aucun indice isolé ne prouve qu’un message est authentique. Les indices doivent être combinés, avec une priorité donnée au contexte et aux éléments vérifiables.

| Force | Indice | Exemple |
|---|---|---|
| Forte | Contexte attendu | L’élève vient de réserver un TER et reçoit une notification de retard correspondant au trajet |
| Forte | Message visible dans un espace déjà authentifié | Information ouverte directement dans Pronote, l’ENT ou l’application bancaire |
| Forte | Vérification indépendante possible | L’information apparaît également dans l’emploi du temps ou l’application officielle |
| Moyenne | Canal habituel et conversation existante | SMS dans le fil utilisé depuis plusieurs mois avec un parent |
| Moyenne | Adresse et domaine exacts | Domaine officiel, sans ajout ni variante typographique |
| Moyenne | Demande cohérente avec le rôle de l’expéditeur | Un club annonce une annulation, mais ne demande ni carte bancaire ni code |
| Faible | Bon français, logo, prénom, mise en page professionnelle | Facilement reproductible par un attaquant |
| Très faible | Cadenas ou HTTPS | Indique une connexion chiffrée, pas l’honnêteté du site |

Les études qualitatives montrent que le **contexte attendu** est souvent l’un des principaux éléments utilisés pour trier les messages suspects ([arXiv 2402.11862](https://ar5iv.labs.arxiv.org/html/2402.11862)). Les incohérences vérifiables sont plus solides que des indices stylistiques ([arXiv 2405.12494](https://arxiv.org/html/2405.12494v1)).

### Pièges inverses

Un message légitime peut sembler suspect parce qu’un établissement utilise un prestataire externe, un domaine d’envoi différent, un lien de suivi ou une formulation urgente. Il ne faut donc pas transformer « domaine inattendu » en verdict automatique, mais en déclencheur de vérification.

Inversement, une arnaque peut reprendre un logo parfait, un français correct, le vrai nom du professeur ou du club, une conversation piratée et un domaine très ressemblant.

Les scénarios doivent donc enseigner deux règles :

- **Un indice faible déclenche une question, pas un verdict.**
- **Une demande sensible crée un nouvel événement de vérification**, même si la conversation et l’expéditeur paraissent familiers.

## 5. Adolescents

Les données propres aux 11 à 18 ans restent plus limitées que celles portant sur des étudiants ou des salariés. Les résultats liés à l’âge sont contradictoires selon le type de message, le contexte et la méthode expérimentale (Jampen et al., 2020).

Dans l’évaluation d’Anti-Phishing Phil, les participants de 13 à 17 ans ont obtenu en moyenne **3,9 réponses correctes**, contre **4,6** pour les groupes de 18 à 34 ans et de 35 à 64 ans. Le jeu améliorait néanmoins l’identification et la rapidité, avec une rétention observée pendant au moins une semaine.

Phishing Academy, conçu pour des enfants et adolescents de 10 à 13 ans, a produit une augmentation significative du taux de détection après un apprentissage approfondi de la structure des URL (Köller et al., 2021, [Phishing Academy](https://link.springer.com/chapter/10.1007/978-3-030-92182-8_5)).

Chez les jeunes adultes, Sheng et al. et PhishGuru placent les 18 à 25 ans parmi les groupes les plus vulnérables ([Sheng et al., 2010](https://dl.acm.org/doi/10.1145/1753326.1753383)). Une étude sur le smishing a au contraire observé un taux de succès plus faible chez les 18 à 24 ans ([arXiv 2212.13312](https://arxiv.org/pdf/2212.13312.pdf)). **Conclusion : pas de consensus simple « plus jeune égale plus vulnérable ».**

**Consensus raisonnable :**

- Pour les 11 à 13 ans, privilégier des indices observables, des demandes concrètes et une explication immédiate.
- Pour les 14 à 18 ans, introduire progressivement les faux comptes crédibles, les conversations piratées, les achats, les codes de validation et les situations ambiguës.
- Mesurer la confiance séparément de la réussite.
- Ne pas supposer qu’une forte familiarité avec les applications implique une bonne compréhension des domaines, des autorisations ou de l’ingénierie sociale.

Le CRCN et Pix légitiment l’évaluation des compétences concernées, mais ne fournissent pas de proportion validée de messages vrais et faux.

## 6. Jeux existants

| Outil | Mélange vrai/faux | Méthode | Évaluation disponible |
|---|---|---|---|
| **Anti-Phishing Phil** | Oui, URL et sites | Points, vies, feedback immédiat, explication des URL | Exactitude et vitesse améliorées, rétention au moins une semaine ([CUPS](https://cups.cs.cmu.edu/antiphishing_phil/)) |
| **PhishGuru** | Oui, sept simulations et trois légitimes | Messages dans une vraie boîte mail, explication après l’erreur | 515 participants ; effet conservé 28 jours ; pas d’augmentation significative des faux positifs |
| **Jigsaw Phishing Quiz** | Oui | Classement de mails puis explication | Aucune évaluation indépendante identifiée ([outil](https://phishingquiz.withgoogle.com/)) |
| **Google Interland** | Comportements sûrs et risqués | Univers ludique, choix immédiats | Pas d’évaluation publique isolant le discernement ([Interland](https://beinternetawesome.withgoogle.com/en_us/interland)) |
| **Bad News** | Non (production de désinformation) | Inoculation active | Baisse de la crédibilité accordée aux contenus manipulateurs ([Roozenbeek et van der Linden, 2019](https://doi.org/10.1057/s41599-019-0279-9)) |
| **Harmony Square** | Même logique | Manipulation d’un réseau fictif | Meilleur discernement, moins d’intention de partage ([2020](https://doi.org/10.37016/mr-2020-47)) |
| **Pix** | Contenus authentiques, trompeurs ou incomplets | Problèmes contextualisés | Pas de ratio public ni d’évaluation causale du mélange |

## 7. Recommandations de conception

### Structure des situations (avis de conception)

1. Commencer avec **40% de situations légitimes et 60% de situations dangereuses**.
2. Ne jamais annoncer la proportion aux élèves.
3. Répartir les messages légitimes dans tous les thèmes, pas dans un chapitre séparé.
4. Inclure des messages légitimes imparfaits et des arnaques très propres.
5. Varier les actions correctes : agir, vérifier, refuser, signaler, demander de l’aide.
6. Calculer séparément discernement, sécurité et proportionnalité.
7. Réaliser un A/B test entre 30%, 40% et 50% de messages légitimes avant de figer le ratio.

### Retour pédagogique

**Après une vérification prudente :**

> Bonne prudence : ce message était authentique. Tu l’as vérifié par un canal indépendant, c’est un excellent réflexe. Ici, le contexte attendu, l’envoi dans l’ENT et l’absence de demande sensible permettaient aussi d’agir directement.

**Après un faux positif disproportionné :**

> Ta prudence est utile, mais bloquer ou accuser l’expéditeur allait trop loin. Avant de conclure à une arnaque, vérifie l’information dans l’ENT ou contacte la personne par le canal habituel.

**Après avoir ignoré un message important :**

> Ce message était authentique. L’ignorer ne mettait pas ton compte en danger, mais tu risquais de manquer une information importante. Tu pouvais vérifier directement dans l’application officielle.

Éviter les formulations « Tu as eu tort », « Tu as été parano » ou « Il fallait faire confiance ».

### Titre du bloc

- **Comment décider ?**, recommandation principale.
- **Les indices à observer**.
- **Pourquoi cette réaction ?**
- **Ce que tu pouvais vérifier**.
- **Les bons réflexes ici**.

« Ce qui devait t’alerter » doit être réservé aux situations effectivement dangereuses.

### Cinq situations légitimes

| Situation | Message et contexte | Trois réactions | Retour attendu |
|---|---|---|---|
| **ENT / Pronote** | Notification dans l’appli déjà authentifiée : « Le cours de technologie de 14 h aura lieu en B204. Information publiée par Mme Martin. » | A. Aller en B204 ; B. Vérifier dans l’emploi du temps ; C. Signaler le compte de l’enseignante et le bloquer | A correcte, B excellente mais plus lente, C faux positif disproportionné |
| **Parent** | SMS dans le fil habituel : « Je finis plus tôt. Je t’attends à 17 h 30 devant l’entrée habituelle. » Aucun lien, argent ou code | A. Répondre « OK » ; B. Appeler le parent avec le numéro enregistré ; C. Bloquer le numéro | A correcte si le contexte est attendu, B prudente, C erreur |
| **Club de sport** | Appli du club : « Entraînement annulé ce soir en raison de l’alerte météo. » | A. Prendre en compte l’annulation ; B. Vérifier sur le calendrier du club ; C. Accuser l’entraîneur de piratage dans le groupe | A ou B correctes, C faux positif et réaction sociale inadaptée |
| **Transport** | Appli de transport après l’achat d’un billet : « Votre TER 857214 est retardé de 20 minutes. » | A. Consulter le trajet dans l’appli ; B. Ignorer toute notification par principe ; C. Chercher le numéro du train dans un navigateur | A meilleure réponse, C acceptable, B erreur d’utilité |
| **Banque pour lycéen** | Appli bancaire : « Votre relevé mensuel est disponible dans votre espace. » Aucun lien externe ni validation | A. Ouvrir l’appli bancaire manuellement ; B. Appeler le numéro au dos de la carte ; C. Bloquer immédiatement le conseiller | A meilleure réponse, B sûre mais généralement inutile, C faux positif |

Ces situations ne doivent pas être « trop propres » : un message légitime peut être court et pressé, une arnaque parallèle parfaitement écrite.

## Tableau récapitulatif

| Décision | Recommandation | Niveau de preuve |
|---|---|---|
| Présence de messages légitimes | Obligatoire pour mesurer les faux positifs et la discrimination | **Consensus** |
| Ratio principal | 40% légitimes, 60% dangereux | **Avis de conception** |
| Plage acceptable | 30 à 50% de légitimes pendant l’apprentissage | **Avis de conception** |
| Évaluation | 50/50, puis test réaliste avec 10 à 20% de menaces | **Avis de conception** |
| Vérification inutile | Ne pas la pénaliser ; valoriser la sécurité, commenter seulement son coût | **Consensus institutionnel** |
| Faux positif | Pénaliser surtout le blocage, l’accusation ou le signalement sans vérification | **Déduction SDT et avis de conception** |
| Score | Séparer sécurité, discernement et proportionnalité | **Avis de conception** |
| Feedback | Immédiat, explicatif, non culpabilisant | **Consensus** |
| Titre générique | « Comment décider ? » ou « Les indices à observer » | **Avis de conception** |
| Indices enseignés | Contexte, canal authentifié, demande cohérente, domaine exact, vérification indépendante | **Consensus** |
| Indices à relativiser | Logo, style, prénom, urgence, fautes et HTTPS | **Consensus** |
| Progression par âge | Indices visibles en 6e-5e, scénarios ambigus et comptes compromis au lycée | **Avis pédagogique** |
| Métriques à suivre | Détections, faux positifs, faux négatifs, rejets corrects, confiance et temps de réponse | **Consensus méthodologique SDT** |
