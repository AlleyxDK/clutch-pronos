// scripts/seed-pandascore.cjs
// Extension .cjs et non .js : package.json déclare "type": "module", donc un
// fichier .js serait chargé comme module ES et `require` y serait indéfini.
require('dotenv').config({ path: __dirname + '/.env' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Charge le service account : env var (CI) ou fichier local (dev).
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (err) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON présent mais mal formé:', err.message);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require('./serviceAccount.json');
  } catch (err) {
    console.error('❌ Ni FIREBASE_SERVICE_ACCOUNT_JSON (env) ni scripts/serviceAccount.json (fichier) disponibles.');
    process.exit(1);
  }
}

const PANDA_TOKEN = process.env.PANDASCORE_TOKEN;
if (!PANDA_TOKEN) {
  console.error('❌ PANDASCORE_TOKEN manquant. Vérifie scripts/.env');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const PANDA_BASE = 'https://api.pandascore.co';
const AUTH_HEADER = { 'Authorization': `Bearer ${PANDA_TOKEN}` };

// Détermine la CompetitionId à partir du nom de league PandaScore.
function detectCompetition(leagueName) {
  const n = (leagueName || '').toLowerCase();
  if (n.includes('lec')) return 'lec';
  if (n.includes('lck')) return 'lck';
  if (n.includes('esports world cup') || n.includes('ewc')) return 'ewc';
  return null;
}

async function fetchTeamRoster(teamId) {
  const res = await fetch(`${PANDA_BASE}/lol/teams/${teamId}`, { headers: AUTH_HEADER });
  if (!res.ok) return [];
  const team = await res.json();
  return (team.players || []).slice(0, 5).map(p => {
    const role = p.role || '';
    const name = p.name || p.first_name || '?';
    return role ? `${name} (${role})` : name;
  });
}

async function transformMatch(m) {
  const competition = detectCompetition(m.league?.name);
  if (!competition) return null;
  if (!m.opponents || m.opponents.length < 2) return null;
  if (!m.scheduled_at) return null;

  const opA = m.opponents[0].opponent;
  const opB = m.opponents[1].opponent;

  const [mvpsA, mvpsB] = await Promise.all([
    fetchTeamRoster(opA.id),
    fetchTeamRoster(opB.id),
  ]);

  return {
    id: `pandascore-${m.id}`,
    competition,
    tournament: m.league?.name || 'Tournoi',
    stage: m.tournament?.name || m.name || '',
    bo: m.number_of_games || 3,
    team_a: {
      id: `panda-${opA.id}`,
      name: opA.name || '?',
      region: opA.location || '?',
      cote: 1.5,       // placeholder — sera géré par un autre système plus tard
      form: '',        // placeholder — pas d'historique dans le fixtures tier
    },
    team_b: {
      id: `panda-${opB.id}`,
      name: opB.name || '?',
      region: opB.location || '?',
      cote: 1.5,
      form: '',
    },
    start_time: Timestamp.fromDate(new Date(m.scheduled_at)),
    mvps: [...mvpsA, ...mvpsB],
  };
}

async function main() {
  console.log('📡 Fetch des matches upcoming depuis PandaScore...');
  const res = await fetch(
    `${PANDA_BASE}/lol/matches/upcoming?per_page=50`,
    { headers: AUTH_HEADER }
  );
  if (!res.ok) {
    console.error('❌ PandaScore request failed:', res.status, await res.text());
    process.exit(1);
  }
  const rawMatches = await res.json();
  console.log(`   Reçu ${rawMatches.length} matches bruts.`);

  console.log('🔄 Filtrage et transformation...');
  const transformed = [];
  for (const m of rawMatches) {
    try {
      const doc = await transformMatch(m);
      if (doc) transformed.push(doc);
    } catch (err) {
      console.warn(`   ⚠️  Ignoré match ${m.id}:`, err.message);
    }
  }
  console.log(`   ${transformed.length} matches retenus après filtrage.`);

  if (transformed.length === 0) {
    console.log('Rien à écrire, sortie.');
    return;
  }

  console.log('💾 Écriture dans Firestore...');
  const batch = db.batch();
  for (const doc of transformed) {
    const ref = db.collection('matches').doc(doc.id);
    batch.set(ref, doc, { merge: true });
  }
  await batch.commit();

  console.log(`✅ ${transformed.length} matches écrits.`);
  console.log('\nRécap :');
  for (const doc of transformed) {
    console.log(`   ${doc.id.padEnd(20)} ${doc.competition.toUpperCase()} · ${doc.team_a.name} vs ${doc.team_b.name} · ${new Date(doc.start_time.toMillis()).toISOString()}`);
  }
}

main().catch(err => {
  console.error('❌ Erreur inattendue:', err);
  process.exit(1);
});
