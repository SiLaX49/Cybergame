# Cyber Réflexes : refonte visuelle (ludique, accessible, clair et sombre)

- **Date** : 2026-10-07
- **Statut** : à valider
- **Origine** : demande de Noa — « que ça ne fasse pas trop basique et IA », « vraiment axé sur l’accessibilité », « un beau visuel », en s’inspirant de marques connues. Choix faits avec le compagnon visuel : direction **A, ludique et colorée** (façon Duolingo / Kahoot), typographie **Fredoka (titres, boutons) + Atkinson Hyperlegible (texte)**, **mode sombre** automatique avec réglage, **Hulotte** mascotte de tout le site.

## 1. Objectif

Donner au site une identité visuelle forte et joueuse, sans perdre en accessibilité, en remplaçant le style actuel (minimal, générique) par un **système de design maison** : des jetons (couleurs, ombres, arrondis, espacements) en clair et en sombre, quelques briques réutilisables, puis chaque écran repassé.

### Critères de succès
- Tous les écrans utilisent les jetons et les briques ; plus aucune couleur codée en dur dans les composants (hors dessins SVG et version imprimée).
- Contraste ≥ 4,5:1 pour tout texte et ≥ 3:1 pour les composants d’interface et le repère de focus, **en clair et en sombre**, vérifié par un test automatique sur les jetons.
- Audit axe sans violation critique ou sérieuse sur les écrans audités, **dans les deux modes**.
- Les réglages existants (taille du texte, interligne, lecture simplifiée, animations, mode classe) fonctionnent toujours ; le réglage « animations » et `prefers-reduced-motion` coupent toutes les nouvelles animations.
- Aucun changement de contenu ni du fonctionnement du jeu ; les tests existants restent verts (seuls les sélecteurs purement visuels peuvent être adaptés, jamais une assertion de comportement).
- Le site reste léger et fonctionne hors ligne (polices intégrées, aucune ressource externe).

## 2. Identité

### 2.1 Couleurs (jetons `src/styles/tokens.css`)
Mode clair (défaut) :

| Jeton | Valeur | Usage |
|---|---|---|
| `--fond` | `#fff8ec` (crème) | fond de page |
| `--surface` | `#ffffff` | cartes, tuiles, panneaux |
| `--surface-2` | `#f6f1ff` | zones secondaires, encadrés |
| `--texte` | `#1f1a3a` | texte principal |
| `--texte-doux` | `#544d6e` | texte secondaire (≥ 4,5:1 sur `--fond` et `--surface`) |
| `--bord` | `#e8e1f5` | bordures et « épaisseur » des tuiles |
| `--primaire` | `#5b3df5` | boutons principaux, liens |
| `--primaire-ombre` | `#3b23b8` | épaisseur des boutons principaux |
| `--primaire-texte` | `#ffffff` | texte sur `--primaire` |
| `--bon` / `--risque` / `--aide` | verts, rouges, ambres foncés | verdicts (toujours doublés d’un texte et d’une icône) |
| `--focus` | `#ff9f1c` + liseré sombre | repère de focus (double anneau, visible sur toutes les couleurs) |

Mode sombre (`[data-theme='sombre']` ou automatique si `prefers-color-scheme: dark`) : `--fond #151226`, `--surface #221d3b`, `--texte #f4f1ff`, `--texte-doux #c9c2e8`, `--bord #3a3360`, `--primaire #9d8bff` avec `--primaire-texte #151226`, verdicts éclaircis. Les valeurs exactes de chaque jeton sont fixées par le plan et **validées par le test de contraste** (§ 5).

Une couleur par thème, utilisée pour la **pastille d’icône** et la **barre de progression** seulement (jamais comme seule information, jamais comme couleur de texte de paragraphe) :

| Thème | Accent clair | Teinte de pastille (clair) |
|---|---|---|
| `phishing` | `#0f9d8a` | `#d8f3ef` |
| `comptes` | `#5b3df5` | `#ece6ff` |
| `vie-privee` | `#d6336c` | `#ffe3ef` |
| `jeux-achats` | `#e8590c` | `#ffe6d6` |
| `desinformation` | `#b08900` | `#fff3c4` |
| `appareils` | `#1c7ed6` | `#dbeafe` |
| `harcelement` | `#c2410c` | `#ffedd5` |
| `rencontres` | `#2f9e44` | `#dcfce7` |

(Équivalents sombres : accent éclairci, pastille assombrie.) Les thèmes sensibles gardent des couleurs **douces**, jamais d’alerte rouge vif.

### 2.2 Typographie
- **Fredoka** (600, 700) : titres `h1`–`h3`, boutons, logo, chiffres de score. Intégrée via `@fontsource/fredoka` (nouvelle dépendance).
- **Atkinson Hyperlegible** (400, 700) : tout le texte courant, les choix, les faux écrans. Inchangée.
- Les réglages de taille et d’interligne s’appliquent aux deux polices.

### 2.3 Formes, épaisseur, mouvement
- Arrondis généreux : 14 px (boutons), 18–20 px (tuiles, cartes), 999 px (badges, barres).
- **Épaisseur** façon Duolingo : bordure 2 px + ombre portée verticale pleine (`0 4px 0`) de la couleur `--bord` ou `--primaire-ombre`. Au survol, le bouton monte de 1 px ; à l’appui (`:active`), il s’enfonce (translateY 4 px, ombre réduite à 0). Transition ≤ 120 ms, supprimée si animations désactivées.
- Bouton désactivé : pas d’ombre, texte `--texte-doux`, motif hachuré léger, **pas d’opacité réduite** (lisibilité) ; le choix « déjà essayé » garde sa mention en texte.
- Zones cliquables ≥ 44 × 44 px partout.

### 2.4 Hulotte, mascotte
- Composant `src/ui/Hulotte.vue` (SVG, `aria-hidden`), avec 5 expressions : `accueil` (ailes ouvertes), `reflechit` (aile au menton), `bravo` (yeux plissés, étoiles), `encourage` (aile levée), `douce` (pour les thèmes sensibles : regard bienveillant, pas de fête).
- Taille par prop, couleurs prises dans les jetons (s’adapte au mode sombre).
- Utilisée : accueil (accueil), carte des thèmes (reflechit, en tête), fin de mission (bravo ; `douce` en thème sensible), avertissement des thèmes sensibles (douce), page introuvable (reflechit), guide des parcours (remplace l’emoji 🦉 actuel dans la bulle), écran « choisis ton personnage » (accueil).
- Chaque apparition est accompagnée d’un texte réel ; Hulotte n’est jamais la seule porteuse d’information.

## 3. Briques (classes et composants partagés)

Dans `src/styles/` : `tokens.css` (jetons clair et sombre, couleurs de thèmes), `base.css` (reset, typographie, focus, mise en page), `composants.css` (briques), `print.css` (inchangé dans l’esprit : impression sobre, noir sur blanc).

| Brique | Forme | Remplace |
|---|---|---|
| `.btn`, `.btn-primaire`, `.btn-secondaire`, `.btn-discret`, `.btn-danger` | boutons épais (2.3) | `.btn` actuel |
| `.carte` | surface arrondie, bordure, ombre douce | `.carte` actuel |
| `.tuile` | carte cliquable épaisse (survol, appui) | tuiles de la carte des thèmes |
| `.badge` | pastille texte arrondie (niveau, « Parcours », « Brouillon »…) | mentions textuelles éparses |
| `.pastille-theme` + `--accent` | carré arrondi teinté avec l’icône Lucide du thème | icônes nues |
| `.progression` | barre arrondie avec libellé texte | `<progress>` brut |
| `.encadre` + variantes `bon`, `risque`, `aide`, `info`, `doux` | encadrés « À retenir », « Ce qui a marché sur toi »… | couleurs codées en dur (`#eef0ff`, `#fff8e6`…) |
| `.choix-btn` | gros bouton de choix pleine largeur, épais | style actuel des choix |
| `.option` / radios / cases | grandes cibles, état coché visible sans couleur seule | idem |

Chaque brique : focus visible, états `:hover`, `:active`, `:disabled`, `[aria-pressed=true]` distincts autrement que par la couleur.

## 4. Écrans

- **En-tête** : logo (Hulotte miniature + « Cyber **Réflexes** »), liens, bouton Réglages en `.btn-secondaire`.
- **Accueil** : héro avec Hulotte (accueil), phrase d’accroche, choix du niveau et du mode en grandes cartes-radios illustrées, bouton « C’est parti ! ».
- **Carte des thèmes** : grille de `.tuile` avec pastille du thème, titre, nombre de missions, badges (« Parcours », « Bientôt disponible »), barre de progression par thème ; carte du rappel mise en avant.
- **Mission** : en-tête avec titre, badge du thème et progression ; faux téléphone redessiné (coque plus moderne, arrondis, mode sombre) ; choix en `.choix-btn` ; conséquence et fin en `.encadre` ; badges de fin en médailles colorées ; Hulotte en fin de mission.
- **Mini-jeux** (tri, repère, mot de passe, confidentialité, vérification, permissions) : mêmes briques ; jauge du mot de passe en barre arrondie avec libellé.
- **Parcours** : couleurs de l’île inchangées (déjà illustrées), panneaux autour harmonisés, bulle de Hulotte avec le composant.
- **Thèmes sensibles** : avertissement avec Hulotte `douce`, bandeau d’aide en `.encadre doux`, aucune animation festive en fin de mission.
- **Espace enseignant, fiche, plan B** : mêmes jetons à l’écran ; **l’impression reste sobre** (noir sur blanc, pas d’ombres, pas de fond).
- **Réglages** : ajout du choix **Thème : Automatique / Clair / Sombre** (groupe de radios), en plus des réglages existants.
- **Pages secondaires** (confidentialité, test technique, introuvable, mise à jour PWA) : mêmes briques.

## 5. Technique

- `src/styles/tokens.css` : jetons en `:root` (clair), `:root[data-theme='sombre']`, et `@media (prefers-color-scheme: dark) { :root[data-theme='auto'] { … } }`.
- `src/store/progress.ts` : réglage `theme: 'auto' | 'clair' | 'sombre'` (défaut `auto`), sans changer la version du stockage ; `appliquerReglages` pose `data-theme` sur `<html>`.
- `src/ui/Hulotte.vue` ; `src/ui/PastilleTheme.vue` (icône + accent du thème) ; couleurs des thèmes dans `src/styles/tokens.css` via `[data-accent='phishing']`… ou un petit module `src/ui/couleursThemes.ts` lu par le test de contraste.
- Les couleurs codées en dur des composants (`#eef0ff`, `#fff8e6`, `#ffd36b`…) sont remplacées par des jetons, sauf dans les dessins SVG (îles, décors, personnages) et `print.css`.
- `index.html` : `<meta name="theme-color">` clair et sombre ; manifeste PWA aux nouvelles couleurs.
- Nouvelle dépendance : `@fontsource/fredoka`.

## 6. Tests

- **Contraste (unitaire, nouveau)** : un module `src/styles/palette.ts` exporte les valeurs des jetons (clair et sombre) utilisées par `tokens.css` (génération ou vérification de cohérence) ; le test calcule le ratio WCAG de chaque couple texte/fond déclaré (texte, texte-doux, primaire-texte sur primaire, verdicts, accents sur pastilles, focus sur fond et surface) et échoue sous 4,5:1 (texte) ou 3:1 (interface, focus).
- **Cohérence** : un test vérifie qu’aucun composant `.vue` ne contient de couleur hexadécimale en dur dans son `<style>`, hors liste blanche (dessins SVG, `print.css`).
- **Réglages** : thème appliqué sur `<html>`, persistance, migration sans champ `theme`.
- **Hulotte** : chaque expression se rend, `aria-hidden`, couleurs issues des jetons.
- **E2E / axe** : les audits existants sont relancés en mode clair **et** en mode sombre (`page.emulateMedia({ colorScheme: 'dark' })` et réglage forcé) ; test « animations désactivées » : aucune transition sur `.btn`.
- Tous les tests existants restent verts.

## 7. Hors périmètre
- Contenu, règles de jeu, moteur, parcours (logique), stockage hormis le réglage `theme`.
- Nouvelles illustrations d’îles ou de décors (on garde celles qui existent).
- Carte des îles à l’accueil (partie B des parcours).
- Sons et musique.
