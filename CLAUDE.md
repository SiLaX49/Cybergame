# Cyber Réflexes : règles du projet

Jeu web gratuit (6e → Terminale) sur les réflexes numériques. Vue 3 + TypeScript strict, contenu en YAML
(`content/missions/`) validé par Zod au build. Tout est expliqué dans le `README.md` ; ce fichier ne garde que les règles.

## Langue et Git
- Tout en français : code (noms), commentaires, contenus, commits, PR.
- Commits conventionnels en français (`feat(contenu): …`, `fix(parcours): …`), une branche par chantier, PR vers `main`.
- Ne jamais committer : `*.docx` à la racine (cahier des charges), `.superpowers/`, `dist-relecture/`. Aucun script temporaire dans le dépôt.

## Avant une PR
`npm run typecheck && npm run lint && npm test && npm run test:e2e`, puis
`npm run build && npx tsx scripts/verifier-publication.ts` (aucun brouillon dans `dist/`).

## Principes à ne pas casser
- Aucune donnée ne quitte l’appareil : pas de serveur, pas d’analytics ; la sauvegarde est une clé `localStorage` (`cyber-reflexes:v1`), tout nouveau champ a une valeur par défaut (pas de migration).
- Accessibilité : contrastes vérifiés (`palette.ts` et `tokens.css` à modifier ensemble), aucune couleur en dur dans les `<style>` des `.vue`, dessins décoratifs en `aria-hidden` et toujours doublés d’un texte, audit axe en clair et en sombre.
- Thèmes sensibles (harcèlement, rencontres) : bloc `relecture` obligatoire, ni octets ni fête ; un contenu `a-relire` n’est jamais publié.
- Contenu lycée : chaque fait ou dispositif vient de `docs/recherche/2026-10-24-dossier-lycee.md` ; les règles de contenu sont testées dans `tests/unit/node/content-real.test.ts`.
- Une erreur se répare : le jeu ne sanctionne pas, les octets récompensent aussi la réparation.
