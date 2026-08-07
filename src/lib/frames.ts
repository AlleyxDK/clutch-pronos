import { streakLevel } from './streak';
import type { Profile, FrameKind } from './types';

// Retourne le cadre à afficher : selectedFrame si défini, sinon dérivé du streak.
export function effectiveFrame(profile: Profile | null | undefined): FrameKind {
  if (!profile) return 'none';
  if (profile.selectedFrame) return profile.selectedFrame;
  return streakLevel(profile.currentStreak ?? 0);
}

export interface FrameDescriptor {
  kind: FrameKind;
  label: string;
}

// Les quatre cadres de streak, dans l'ordre de déblocage.
export const STREAK_FRAMES: { kind: FrameKind; label: string; minStreak: number }[] = [
  { kind: 'bronze', label: 'Bronze', minStreak: 3 },
  { kind: 'silver', label: 'Argent', minStreak: 7 },
  { kind: 'gold', label: 'Or', minStreak: 14 },
  { kind: 'fire', label: 'Feu', minStreak: 30 },
];

export const FRAME_LABELS: Record<FrameKind, string> = {
  none: 'Aucun',
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  fire: 'Feu',
  'trophy-precision': 'Précision',
  'trophy-mvp': 'MVP',
  'trophy-streak': 'Série',
  'trophy-loyalty': 'Fidélité',
  'trophy-lec': 'LEC',
  'trophy-lck': 'LCK',
  'trophy-ewc': 'EWC',
  'trophy-underdog': 'Outsider',
  'trophy-season': 'Saison',
};
