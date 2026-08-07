import type { Match, Prono } from './types';
import { startOfDay } from './dateUtils';

// Retourne { current, longest } où current est le streak en cours (jours
// consécutifs de match ou l'utilisateur a pronostiqué) et longest est le
// plus long streak historique.
export function computeStreak(
  matches: Match[],
  pronos: Record<string, Prono>
): { current: number; longest: number } {
  const now = Date.now();

  // Match days = jours où au moins un match a déjà kickoff (pour ne pas
  // pénaliser un utilisateur qui n'a pas encore pronostiqué le match du soir).
  const matchDaySet = new Set<number>();
  for (const m of matches) {
    if (m.start_time <= now) {
      matchDaySet.add(startOfDay(m.start_time));
    }
  }
  const matchDays = [...matchDaySet].sort((a, b) => b - a); // desc

  // Prono days = jours où l'utilisateur a pronostiqué au moins un match.
  const matchesById = new Map(matches.map(m => [m.id, m]));
  const pronoDaySet = new Set<number>();
  for (const p of Object.values(pronos)) {
    const m = matchesById.get(p.matchId);
    if (m) pronoDaySet.add(startOfDay(m.start_time));
  }

  // Current streak : consecutive depuis le plus récent match day.
  let current = 0;
  for (const day of matchDays) {
    if (pronoDaySet.has(day)) {
      current++;
    } else {
      break;
    }
  }

  // Longest streak : parcours tous les match days, compte les runs.
  const matchDaysAsc = [...matchDays].reverse();
  let longest = 0;
  let run = 0;
  for (const day of matchDaysAsc) {
    if (pronoDaySet.has(day)) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  return { current, longest };
}

export type StreakLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'fire';

// Niveau visuel du streak, utilisé pour le cadre autour de l'avatar.
export function streakLevel(streak: number): StreakLevel {
  if (streak >= 30) return 'fire';
  if (streak >= 14) return 'gold';
  if (streak >= 7) return 'silver';
  if (streak >= 3) return 'bronze';
  return 'none';
}
