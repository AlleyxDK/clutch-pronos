/*
 * Ajout hors spec: fonction extraite ici plutôt que dupliquée. Nav en avait
 * déjà une copie locale, et le reveal en demande deux de plus ; trois versions
 * du même calcul finiraient par diverger et afficher « MD » ici, « MA » là
 * pour le même joueur.
 */
export function pseudoInitials(pseudo: string): string {
  const parts = pseudo.trim().split(/\s+/)

  if (parts.length > 1 && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return pseudo.trim().slice(0, 2).toUpperCase()
}
