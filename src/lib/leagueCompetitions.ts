import type { League, CompetitionId } from './types';
import { COMPETITIONS } from './competitions';

const ALL_COMPETITIONS = Object.keys(COMPETITIONS) as CompetitionId[];

// Retourne les compétitions effectives d'une ligue, avec fallback "toutes".
export function leagueCompetitionIds(league: League): CompetitionId[] {
  if (!league.competitionIds || league.competitionIds.length === 0) {
    return ALL_COMPETITIONS;
  }
  return league.competitionIds;
}

// Vérifie qu'un match appartient au périmètre d'une ligue.
export function matchInLeague(match: { competition: CompetitionId }, league: League): boolean {
  return leagueCompetitionIds(league).includes(match.competition);
}
