import type { Match } from './types'

export function isMatchLocked(match: Match): boolean {
  return match.start_time <= Date.now();
}

export function isMatchResulted(match: Match): boolean {
  return match.result !== undefined && match.result !== null;
}

// Les matchs importés de PandaScore arrivent sans liste de joueurs
// sélectionnables. Dans ce cas le MVP n'est tout simplement pas proposé.
export function matchHasMvps(match: Match): boolean {
  return Array.isArray(match.mvps) && match.mvps.length > 0;
}

export function heroWindowMs(match: Match): number {
  // Estimation généreuse de la durée d'un match : 75 minutes par game
  // (broadcast + pauses + game réel). Bo5 → 6h15 de fenêtre, Bo3 → 3h45.
  return match.bo * 75 * 60 * 1000;
}

// Ajout hors spec: distingue « en cours de jeu » de « terminé ». Les deux sont
// verrouillés et sans résultat ; seule la fenêtre de durée les sépare. Sans ça,
// un match du mois dernier resterait affiché comme « verrouillé ».
export function isMatchFinished(match: Match): boolean {
  if (isMatchResulted(match)) return false;
  return match.start_time + heroWindowMs(match) <= Date.now();
}
