const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/invalid-email': 'Email invalide.',
  'auth/weak-password': 'Mot de passe trop faible (au moins 6 caractères).',
  'auth/user-not-found': 'Aucun compte avec cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Problème de connexion réseau.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/requires-recent-login': 'Reconnecte-toi pour continuer.',
  'auth/credential-already-in-use': 'Cet email est déjà lié à un autre compte.',
};

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  return 'Une erreur inattendue est survenue. Réessaie.';
}
