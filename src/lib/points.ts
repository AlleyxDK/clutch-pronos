import type { Match, Prono } from './types'

export function winnerPts(cote: number): number {
  return Math.min(100, Math.max(20, Math.round(20 * cote)));
}

// Bonus rareté : 250 / % qui ont choisi, plancher 5, plafond 80.
// Un pick que TOUT le monde a fait rapporte 5, un pick unique rapporte 80.
export function rarityBonus(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  const percent = (count / total) * 100;
  return Math.min(80, Math.max(5, Math.round(250 / percent)));
}

export interface PointsBreakdown {
  winner: number;
  scoreBonus: number;
  mvpBonus: number;
  total: number;
}

export function calculatePoints(match: Match, prono: Prono): PointsBreakdown {
  const empty = { winner: 0, scoreBonus: 0, mvpBonus: 0, total: 0 };
  if (!match.result) return empty;

  const result = match.result;
  const agg = result.aggregates;

  // Le côté (a ou b) est le premier caractère de la clé de score.
  const userSide = prono.score.charAt(0);
  const actualSide = result.score.charAt(0);
  const wonSide = userSide === actualSide;

  const winningCote = actualSide === 'a' ? match.team_a.cote : match.team_b.cote;
  const winner = wonSide ? winnerPts(winningCote) : 0;

  const scoreBonus = (prono.score === result.score)
    ? rarityBonus(agg.scoreCounts[prono.score] ?? 0, agg.totalPronos)
    : 0;

  // Ne compte le bonus MVP que si les deux valeurs sont non-vides ET égales.
  // Un match sans mvps possibles a prono.mvp === '' et result.mvp === '',
  // ce qui donnerait un faux match sans cette garde.
  const mvpBonus = (prono.mvp && result.mvp && prono.mvp === result.mvp)
    ? rarityBonus(agg.mvpCounts[prono.mvp] ?? 0, agg.totalPronos)
    : 0;

  return { winner, scoreBonus, mvpBonus, total: winner + scoreBonus + mvpBonus };
}
