/*
 * Ajout hors spec: extrait ici parce que Nav et MatchCard en ont tous deux
 * besoin. Rappel : ce drapeau est purement client, Firestore ne le voit pas —
 * il masque un bouton, il ne protège rien.
 */
export function isAdmin(): boolean {
  return new URLSearchParams(window.location.search).get('admin') === 'true'
}
