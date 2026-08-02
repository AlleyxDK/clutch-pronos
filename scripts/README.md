# ⚠️ Sécurité — À LIRE AVANT TOUT

Le fichier `serviceAccount.json` de ce dossier est une clé d'administration
qui donne accès complet et non filtré à la base Firestore de production,
en contournant TOUTES les règles de sécurité.

Il ne doit **JAMAIS** :
- Être commit sur git (le `.gitignore` racine le protège)
- Être partagé par message, mail, Slack, ou tout autre canal
- Être copié sur un cloud sync (Google Drive, Dropbox, iCloud)
- Être ouvert dans un éditeur intégré à un service cloud (VS Code Live
  Share, GitHub Codespaces, etc.)

Si un doute existe qu'il ait fuité :
1. Firebase Console → Paramètres du projet → Comptes de service
2. Génère une nouvelle clé privée (l'ancienne est automatiquement
   révocable manuellement)
3. Révoque l'ancienne
4. Remplace le fichier local

Cette clé est le prix à payer pour écrire dans `matches/` depuis un
contexte où aucun utilisateur n'est authentifié. Les règles Firestore
n'autorisent l'écriture qu'aux UID listés dans `config/admins` — un
script Node.js n'a pas de `request.auth`, donc ne peut jamais
satisfaire cette règle, d'où la nécessité du service account qui
bypasse la vérification. Une Cloud Function
planifiée n'aura pas ce risque : elle tourne dans l'infra Google avec
des credentials gérés automatiquement, sans clé locale.

---

# Scripts

Scripts utilitaires exécutés localement, hors de l'app React.

## seed-pandascore.cjs

Fetch les matches LoL à venir depuis PandaScore et les écrit dans la
collection Firestore `matches`.

> Extension `.cjs` et non `.js` : le `package.json` du projet déclare
> `"type": "module"`, donc un fichier `.js` serait chargé comme module ES et
> `require` y serait indéfini.

### Prérequis

1. `scripts/serviceAccount.json` : compte de service Firebase Admin.
   Voir README à la racine.
2. `scripts/.env` : basé sur `.env.example`, contient `PANDASCORE_TOKEN`.

Ces deux fichiers sont ignorés par git (voir `.gitignore` à la racine).

### Lancer

Depuis la racine du projet :

    node scripts/seed-pandascore.cjs

Le script est idempotent : re-lancer met à jour les matches existants sans
créer de doublons (utilise `merge: true`).

### Limitations connues

- Cotes des équipes : placeholder 1.5 pour l'instant. À remplacer par une
  vraie source (odds API ou calcul basé sur l'historique) plus tard.
- Formes récentes : vides. PandaScore free tier ne les fournit pas.
- Compétitions supportées : LEC, LCK, EWC. À étendre au fur et à mesure.
- Formats Bo1 et Bo7 : `generateScoreOptions` (côté app) gère le Bo3 et
  le Bo5. Un match importé en Bo1 ou Bo7 arrivera en base sans option de
  score utilisable (rare dans les circuits supportés — playoffs
  occasionnels).

### Vulnérabilité connue et acceptée

`npm audit` signale 6 vulnérabilités "moderate" toutes issues d'une seule
faille dans `uuid@9.0.1` (GHSA-w5hq-g745-h8pq — contrôle de borne manquant
dans les fonctions v3/v5/v6 quand un argument `buf` explicite est fourni).

**Statut : non corrigée, acceptée.**

Raisons :
- DevDependency uniquement : `uuid` est chargé via `firebase-admin` →
  `@google-cloud/storage` → `gaxios/teeny-request`. Ne finit jamais dans
  le bundle utilisateur.
- Vecteur non atteignable : le code de ce projet n'appelle jamais `uuid`
  directement. Seul `gaxios` l'utilise en interne pour générer des IDs de
  requête, sans exposer l'argument `buf`.
- Aucun fix upstream : `firebase-admin` est déjà à jour (14.2.0). Le seul
  chemin "fix" proposé par `npm audit fix --force` est une régression à
  `firebase-admin@10.3.0`, quatre majeures en arrière — trade refusé.
- Un `overrides` forçant `uuid@11.1.1` casserait la contrainte de version
  de `gaxios` et `teeny-request` sans leur validation.

À rouvrir si : `firebase-admin` publie une version qui embarque `uuid@11+`,
ou si un contexte d'usage change (portage vers un environnement où le
script serait exposé à des inputs non contrôlés).
