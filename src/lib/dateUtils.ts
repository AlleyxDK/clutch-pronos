// Retourne le début de journée pour un timestamp donné (00:00:00 local France).
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Retourne les 7 prochains jours à partir d'aujourd'hui (inclus).
export function next7Days(): number[] {
  const today = startOfDay(Date.now());
  // Ajout hors spec: on repasse par startOfDay à chaque itération plutôt que
  // d'ajouter 24h en brut. Les deux changements d'heure annuels décalent une
  // journée de ±1h, et l'arithmétique brute ferait tomber le jour concerné à
  // 23:00 la veille — le tab n'aurait alors jamais le bon compteur.
  return Array.from({ length: 7 }, (_, i) => startOfDay(today + i * 24 * 3600 * 1000 + 3600 * 1000));
}

// Format court : "Aujourd'hui", "Demain", "Ven 15", "Sam 16".
export function formatDayLabel(dayStart: number): string {
  const today = startOfDay(Date.now());
  const tomorrow = startOfDay(today + 25 * 3600 * 1000);
  if (dayStart === today) return "Aujourd'hui";
  if (dayStart === tomorrow) return 'Demain';
  const d = new Date(dayStart);
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

// Format ISO pour input type=date.
export function toDateInputValue(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDateInputValue(value: string): number {
  const [y, m, day] = value.split('-').map(Number);
  return new Date(y, m - 1, day, 0, 0, 0, 0).getTime();
}
