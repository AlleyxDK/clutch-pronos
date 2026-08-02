/*
 * Ajout hors spec: cette fonction est appelée avec team.id, pas team.name.
 * Le §1 impose des sigles dérivés de l'id (fnc -> FNC, g2 -> G2) ; partir du nom
 * donnerait FNA et G2E. Le comportement décrit au §3 est inchangé, seule
 * l'entrée passée par les composants diffère.
 */
export function teamSigil(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase()
}
