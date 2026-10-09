export const EXPRESSIONS_HULOTTE = ['accueil', 'reflechit', 'bravo', 'encourage', 'douce'] as const
export type ExpressionHulotte = (typeof EXPRESSIONS_HULOTTE)[number]
