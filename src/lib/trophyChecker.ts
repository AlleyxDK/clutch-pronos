import type { Match, Prono } from './types';
import { calculatePoints } from './points';

/*
 * Fonction pure : à partir de l'état courant du joueur, retourne les ids des
 * trophées qui devraient être débloqués. Elle ne connaît rien de Firestore —
 * c'est useTrophies qui compare avec l'existant et écrit les nouveaux.
 */
export function checkTrophies(
  matches: Match[],
  pronos: Record<string, Prono>,
): string[] {
  const unlocked: string[] = [];

  const resultedWithProno = matches
    .filter((m) => m.result && pronos[m.id])
    .map((m) => ({ match: m, prono: pronos[m.id], pts: calculatePoints(m, pronos[m.id]) }));

  // Précision
  const exactCount = resultedWithProno.filter((x) => x.pts.scoreBonus > 0).length;
  if (exactCount >= 1) unlocked.push('first-exact');
  if (exactCount >= 10) unlocked.push('ten-exacts');
  if (exactCount >= 50) unlocked.push('fifty-exacts');

  // MVPs
  const mvpCorrectCount = resultedWithProno.filter((x) => x.pts.mvpBonus > 0).length;
  if (mvpCorrectCount >= 1) unlocked.push('first-mvp');
  if (mvpCorrectCount >= 10) unlocked.push('ten-mvps');

  // Un prono sans MVP (match PandaScore sans roster) ne compte pas au
  // dénominateur : sinon un joueur qui ne pronostique que des Bo3 sans MVP
  // verrait son ratio plafonner artificiellement.
  const mvpPossible = resultedWithProno.filter((x) => x.prono.mvp).length;
  if (mvpPossible >= 20 && mvpCorrectCount / mvpPossible >= 0.8) unlocked.push('mvp-prophet');

  // Séries de bon vainqueur, dans l'ordre chronologique des matches.
  // Copie avant tri : .sort() mute, et resultedWithProno est réutilisé plus bas.
  const sorted = [...resultedWithProno].sort((a, b) => a.match.start_time - b.match.start_time);
  let currentRun = 0;
  let maxRun = 0;
  for (const x of sorted) {
    if (x.pts.winner > 0) {
      currentRun++;
      if (currentRun > maxRun) maxRun = currentRun;
    } else {
      currentRun = 0;
    }
  }
  if (maxRun >= 5) unlocked.push('winner-5');
  if (maxRun >= 10) unlocked.push('winner-10');

  // Loyauté
  const totalPronos = Object.keys(pronos).length;
  if (totalPronos >= 30) unlocked.push('loyal-30');

  // 'ambassador' : demande de tracer qui a rejoint via quel code de ligue.
  // Rien ne le stocke aujourd'hui. TODO E3.

  // Circuits
  const pronosByComp: Record<string, number> = { lec: 0, lck: 0, ewc: 0 };
  for (const matchId of Object.keys(pronos)) {
    const m = matches.find((mm) => mm.id === matchId);
    if (m) pronosByComp[m.competition] = (pronosByComp[m.competition] ?? 0) + 1;
  }

  // Puriste = seuil atteint et 100% des pronos dans ce seul circuit.
  if (pronosByComp.lec >= 30 && totalPronos === pronosByComp.lec) unlocked.push('purist-lec');
  if (pronosByComp.lck >= 30 && totalPronos === pronosByComp.lck) unlocked.push('purist-lck');
  if (pronosByComp.ewc >= 15 && totalPronos === pronosByComp.ewc) unlocked.push('purist-ewc');

  // Contre le vent : bon camp sur un score choisi par moins de 20% des joueurs.
  let underdogCount = 0;
  for (const x of resultedWithProno) {
    if (x.pts.winner === 0) continue;
    const agg = x.match.result?.aggregates;
    if (!agg) continue;
    const scoreCount = agg.scoreCounts[x.prono.score] ?? 0;
    const pct = agg.totalPronos > 0 ? (scoreCount / agg.totalPronos) * 100 : 100;
    if (pct < 20) underdogCount++;
  }
  if (underdogCount >= 10) unlocked.push('underdog-10');

  return unlocked;
}
