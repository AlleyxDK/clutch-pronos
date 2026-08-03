/*
 * Appelée avec team.name. Elle prenait team.id auparavant, pour obtenir FNC
 * plutôt que FNA sur les équipes codées en dur — mais les ids PandaScore ont
 * la forme `panda-134078`, ce qui produisait « PAN » pour toutes leurs équipes.
 * Le nom est la seule entrée exploitable pour les deux origines de données.
 */
export function teamSigil(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase()
}
