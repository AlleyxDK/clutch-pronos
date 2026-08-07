import type { CompetitionId } from './competitions'

/*
 * Ajout hors spec: ré-export. CompetitionId est déclaré dans competitions.ts,
 * mais la spec (et désormais plusieurs modules) l'importe depuis types.ts.
 * On en fait la surface d'import unique plutôt que de disperser les origines.
 */
export type { CompetitionId }

export interface Team {
  id: string;
  name: string;
  region: string;
  cote: number;
  form: string; // ex "WWWLW"
  image_url?: string | null; // optionnel : les matches hardcodés n'en ont pas
}

export interface Match {
  id: string;
  competition: CompetitionId;
  tournament: string;
  stage: string;
  bo: number;
  team_a: Team;
  team_b: Team;
  start_time: number; // timestamp ms
  mvps: string[]; // les 10 joueurs sélectionnables pour le MVP
  result?: MatchResult;
}

export interface MatchAggregates {
  scoreCounts: Record<string, number>;   // clé = clé de score (ex 'a-3-1'), valeur = nb de pronos
  mvpCounts: Record<string, number>;     // clé = nom MVP tel quel, valeur = nb de pronos
  totalPronos: number;
}

export interface MatchResult {
  score: string;             // même format que Prono.score, ex 'a-3-1'
  mvp: string;               // même format que Prono.mvp
  submittedAt: number;       // ms epoch
  aggregates: MatchAggregates;
}

export interface Profile {
  pseudo: string;
  createdAt: number; // ms epoch
  // Optionnels : les profils créés avant l'arrivée des streaks ne les ont pas.
  currentStreak?: number;
  longestStreak?: number;
}

export interface Prono {
  matchId: string;
  score: string; // ex 'a-3-0', 'b-3-2'
  mvp: string; // ex 'Faker (Mid)'
  submittedAt: number;
}

export interface League {
  id: string;
  name: string;
  code: string;         // 6 caractères, ex 'K7QM4X'
  creatorId: string;    // UID du créateur
  memberIds: string[];  // liste des UID membres
  createdAt: number;    // ms epoch
  competitionIds?: CompetitionId[]; // absent = toutes les compétitions (rétrocompat)
}
