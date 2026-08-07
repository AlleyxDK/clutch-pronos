import type { FrameKind } from './types';

export interface TrophyDefinition {
  id: string;
  name: string;        // "Premier score exact"
  description: string; // "Devine ton premier score exact."
  icon: string;        // emoji court, ex '🎯'
  category: 'precision' | 'mvp' | 'streak' | 'loyalty' | 'circuit' | 'underdog' | 'season';
  unlocks: {
    frames?: FrameKind[]; // cadres cosmétiques
    avatars?: string[];   // ids d'avatars spéciaux
    titles?: string[];    // titres textuels
  };
}

/*
 * Les trophées « season » (Champion LEC Summer, etc.) demandent une logique de
 * fin de saison et une comparaison globale entre joueurs. Le type existe dans
 * TrophyDefinition mais aucun trophée de cette catégorie n'est encore défini.
 */
export const TROPHIES: TrophyDefinition[] = [
  // Précision
  { id: 'first-exact', name: 'Premier score exact', description: 'Trouve ton premier score exact.', icon: '🎯', category: 'precision', unlocks: { frames: ['trophy-precision'], titles: ['Précis'] } },
  { id: 'ten-exacts', name: '10 scores exacts', description: '10 pronos avec le score parfait.', icon: '🎯', category: 'precision', unlocks: { avatars: ['sniper'], titles: ['Le Sniper'] } },
  { id: 'fifty-exacts', name: '50 scores exacts', description: 'Un demi-siècle de scores exacts.', icon: '🎯', category: 'precision', unlocks: { titles: ['Prophète des Scores'] } },

  // MVPs
  { id: 'first-mvp', name: 'Premier MVP correct', description: 'Ton premier MVP officiel deviné.', icon: '👑', category: 'mvp', unlocks: { frames: ['trophy-mvp'] } },
  { id: 'ten-mvps', name: '10 MVPs corrects', description: 'Tu lis dans les mains des joueurs.', icon: '👑', category: 'mvp', unlocks: { avatars: ['crown'], titles: ['Devin'] } },
  { id: 'mvp-prophet', name: 'MVP Prophète', description: '80% de MVP corrects sur au moins 20 pronos.', icon: '🔮', category: 'mvp', unlocks: { avatars: ['prophet'], titles: ['Le Prophète des MVP'] } },

  // Séries
  { id: 'winner-5', name: "5 bons vainqueurs d'affilée", description: 'Cinq matches à la suite avec le bon camp.', icon: '⚡', category: 'streak', unlocks: { frames: ['trophy-streak'] } },
  { id: 'winner-10', name: "10 bons vainqueurs d'affilée", description: 'Machine à trouver le vainqueur.', icon: '⚡', category: 'streak', unlocks: { avatars: ['bolt'], titles: ['La Foudre'] } },

  // Loyauté
  { id: 'loyal-30', name: 'Fidèle', description: 'Réalise 30 pronos.', icon: '🎖️', category: 'loyalty', unlocks: { frames: ['trophy-loyalty'] } },
  { id: 'ambassador', name: 'Ambassadeur', description: '5 amis rejoignent une de tes ligues.', icon: '🤝', category: 'loyalty', unlocks: { avatars: ['ambassador'], titles: ['Ambassadeur Clutch'] } },

  // Circuits
  { id: 'purist-lec', name: 'Puriste LEC', description: '30+ pronos, 100% en LEC.', icon: '🇪🇺', category: 'circuit', unlocks: { frames: ['trophy-lec'], titles: ['Puriste LEC'] } },
  { id: 'purist-lck', name: 'Puriste LCK', description: '30+ pronos, 100% en LCK.', icon: '🇰🇷', category: 'circuit', unlocks: { frames: ['trophy-lck'], titles: ['Puriste LCK'] } },
  { id: 'purist-ewc', name: 'Puriste EWC', description: 'Tous tes pronos EWC (au moins 15).', icon: '🌍', category: 'circuit', unlocks: { frames: ['trophy-ewc'], titles: ["Chasseur d'EWC"] } },

  // Rareté
  { id: 'underdog-10', name: 'Contre le vent', description: "10 pronos rares (<20% de choix) qui se sont avérés.", icon: '🌪️', category: 'underdog', unlocks: { frames: ['trophy-underdog'], avatars: ['maverick'], titles: ["L'Outsider"] } },
];

const TROPHY_BY_ID = new Map(TROPHIES.map((t) => [t.id, t]));

export function trophyById(id: string): TrophyDefinition | undefined {
  return TROPHY_BY_ID.get(id);
}

/*
 * Agrège tout ce que débloquent une liste d'ids de trophées possédés.
 * Utilisé par les trois pickers (avatar, cadre, titre).
 */
export function unlockedCosmetics(trophyIds: string[]): {
  frames: FrameKind[];
  avatars: string[];
  titles: string[];
} {
  const frames = new Set<FrameKind>();
  const avatars = new Set<string>();
  const titles = new Set<string>();

  for (const id of trophyIds) {
    const def = TROPHY_BY_ID.get(id);
    if (!def) continue;
    for (const f of def.unlocks.frames ?? []) frames.add(f);
    for (const a of def.unlocks.avatars ?? []) avatars.add(a);
    for (const t of def.unlocks.titles ?? []) titles.add(t);
  }

  return { frames: [...frames], avatars: [...avatars], titles: [...titles] };
}
