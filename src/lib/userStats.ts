import type { Match, Prono, CompetitionId, StatEntry, UserStats } from './types';
import { calculatePoints } from './points';

const EMPTY: StatEntry = {
  total: 0, correctWinners: 0, exactScores: 0, mvpBonuses: 0, pronoCount: 0
};

export function computeUserStats(
  matches: Match[],
  pronos: Record<string, Prono>
): UserStats {
  const byComp: Record<CompetitionId, StatEntry> = {
    lec: { ...EMPTY },
    lck: { ...EMPTY },
    ewc: { ...EMPTY },
  };
  const overall: StatEntry = { ...EMPTY };

  for (const match of matches) {
    const p = pronos[match.id];
    if (!p) continue;

    const comp = match.competition;
    const compBucket = byComp[comp];

    overall.pronoCount++;
    if (compBucket) compBucket.pronoCount++;

    if (!match.result) continue;
    const pts = calculatePoints(match, p);

    overall.total += pts.total;
    if (pts.winner > 0) overall.correctWinners++;
    if (pts.scoreBonus > 0) overall.exactScores++;
    if (pts.mvpBonus > 0) overall.mvpBonuses++;

    if (compBucket) {
      compBucket.total += pts.total;
      if (pts.winner > 0) compBucket.correctWinners++;
      if (pts.scoreBonus > 0) compBucket.exactScores++;
      if (pts.mvpBonus > 0) compBucket.mvpBonuses++;
    }
  }

  return {
    overall,
    byCompetition: byComp,
    lastComputedAt: Date.now(),
  };
}

/*
 * Ajout hors spec: comparaison champ par champ plutôt que JSON.stringify.
 * Firestore ne restitue pas les maps dans l'ordre d'insertion, donc deux objets
 * identiques produisent des chaînes JSON différentes. La comparaison textuelle
 * serait toujours « différente » et déclencherait une écriture à chaque rendu.
 */
function entryEquals(a: StatEntry | undefined, b: StatEntry | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return (
    a.total === b.total &&
    a.correctWinners === b.correctWinners &&
    a.exactScores === b.exactScores &&
    a.mvpBonuses === b.mvpBonuses &&
    a.pronoCount === b.pronoCount
  );
}

const COMP_IDS: CompetitionId[] = ['lec', 'lck', 'ewc'];

// lastComputedAt est volontairement ignoré : il change à chaque calcul.
export function userStatsEquals(
  a: UserStats | undefined,
  b: UserStats | undefined
): boolean {
  if (a === undefined || b === undefined) return a === b;
  if (!entryEquals(a.overall, b.overall)) return false;

  for (const id of COMP_IDS) {
    if (!entryEquals(a.byCompetition[id], b.byCompetition[id])) return false;
  }

  return true;
}

// Le StatEntry à classer selon le filtre courant.
export function statsForFilter(
  stats: UserStats | undefined,
  filter: 'all' | CompetitionId
): StatEntry | undefined {
  if (!stats) return undefined;
  return filter === 'all' ? stats.overall : stats.byCompetition[filter];
}
