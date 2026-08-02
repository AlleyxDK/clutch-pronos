export function formatMatchTime(startTime: number): string {
  const delta = startTime - Date.now();
  const absMs = Math.abs(delta);
  const days = Math.floor(absMs / (24 * 3600 * 1000));
  const hours = Math.floor((absMs % (24 * 3600 * 1000)) / (3600 * 1000));
  const mins = Math.floor((absMs % (3600 * 1000)) / (60 * 1000));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  const duration = parts.join(' ');

  return delta >= 0 ? `Dans ${duration}` : `Il y a ${duration}`;
}
