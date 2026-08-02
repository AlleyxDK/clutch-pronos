import type { Match } from './types';

export interface ScoreOption {
  key: string;             // 'a-3-0'
  teamSide: 'a' | 'b';
  teamName: string;
  scoreDisplay: string;    // '3-0'
}

export function generateScoreOptions(match: Match): ScoreOption[] {
  if (match.bo === 5) {
    return [
      { key: 'a-3-0', teamSide: 'a', teamName: match.team_a.name, scoreDisplay: '3-0' },
      { key: 'a-3-1', teamSide: 'a', teamName: match.team_a.name, scoreDisplay: '3-1' },
      { key: 'a-3-2', teamSide: 'a', teamName: match.team_a.name, scoreDisplay: '3-2' },
      { key: 'b-3-2', teamSide: 'b', teamName: match.team_b.name, scoreDisplay: '3-2' },
      { key: 'b-3-1', teamSide: 'b', teamName: match.team_b.name, scoreDisplay: '3-1' },
      { key: 'b-3-0', teamSide: 'b', teamName: match.team_b.name, scoreDisplay: '3-0' },
    ];
  }
  if (match.bo === 3) {
    return [
      { key: 'a-2-0', teamSide: 'a', teamName: match.team_a.name, scoreDisplay: '2-0' },
      { key: 'a-2-1', teamSide: 'a', teamName: match.team_a.name, scoreDisplay: '2-1' },
      { key: 'b-2-1', teamSide: 'b', teamName: match.team_b.name, scoreDisplay: '2-1' },
      { key: 'b-2-0', teamSide: 'b', teamName: match.team_b.name, scoreDisplay: '2-0' },
    ];
  }

  // Bo1, Bo7… : à ajouter quand on en aura besoin. Pour l'instant, on renvoie
  // un tableau vide et on TODO.
  console.warn('generateScoreOptions: Bo' + match.bo + ' non implémenté');
  return [];
}

export function getScoreParts(scoreKey: string): {
  teamAGames: number;
  teamBGames: number;
} {
  // Format attendu : 'a-3-1' ou 'b-3-2', etc.
  const parts = scoreKey.split('-');
  const winnerSide = parts[0];
  const winnerGames = parseInt(parts[1], 10);
  const loserGames = parseInt(parts[2], 10);
  return winnerSide === 'a'
    ? { teamAGames: winnerGames, teamBGames: loserGames }
    : { teamAGames: loserGames, teamBGames: winnerGames };
}

export function scoreLabelFromKey(match: Match, scoreKey: string): string {
  const opt = generateScoreOptions(match).find(o => o.key === scoreKey);
  return opt ? `${opt.teamName} ${opt.scoreDisplay}` : scoreKey;
}
