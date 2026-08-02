export const COMPETITIONS = {
  ewc: { id: 'ewc', name: 'EWC 2026', full: 'Esports World Cup 2026' },
  lec: { id: 'lec', name: 'LEC Summer', full: 'LEC Summer 2026' },
  lck: { id: 'lck', name: 'LCK Summer', full: 'LCK Summer 2026' },
} as const;

export type CompetitionId = keyof typeof COMPETITIONS;
