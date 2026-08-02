import type { Match } from './types'

export function isMatchLocked(match: Match): boolean {
  return match.start_time <= Date.now();
}

export function isMatchResulted(match: Match): boolean {
  return match.result !== undefined && match.result !== null;
}

export function heroWindowMs(match: Match): number {
  // Estimation généreuse de la durée d'un match : 75 minutes par game
  // (broadcast + pauses + game réel). Bo5 → 6h15 de fenêtre, Bo3 → 3h45.
  return match.bo * 75 * 60 * 1000;
}
