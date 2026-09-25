/** Problèmes d'un mot de passe (liste vide = solide). Règles volontairement simples et pédagogiques. */
export function evaluerMotDePasse(mdp: string): string[] {
  const problemes: string[] = []
  if (mdp.length < 12) problemes.push('Au moins 12 caractères : une phrase de 3 ou 4 mots, c’est long et facile à retenir.')
  if (/123|azerty|qwerty|motdepasse|password|0000/i.test(mdp)) problemes.push('Évite les suites connues comme « 123 » ou « azerty ».')
  if (mdp.length > 0 && new Set(mdp).size <= 3) problemes.push('Utilise des caractères variés.')
  return problemes
}
