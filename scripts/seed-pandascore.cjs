// scripts/seed-pandascore.cjs
// Extension .cjs et non .js : package.json déclare "type": "module", donc un
// fichier .js serait chargé comme module ES et `require` y serait indéfini.
require('dotenv').config({ path: __dirname + '/.env' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldPath, FieldValue } = require('firebase-admin/firestore');

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

  // Exclusion des ligues de développement / académie
  if (n.includes('challengers')) return null;
  if (n.includes('academy')) return null;
  if (n.includes('emergent')) return null;
  if (n.includes('rising')) return null;
  if (n.includes('development')) return null;

  // Ligues pros ciblées
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

// ═════════════════════════════════════════════════════════════
// Elo et forme récente, dérivés de l'historique PandaScore
// ═════════════════════════════════════════════════════════════

const ELO_INITIAL = 1500;
const ELO_K = 32;

function computeEloRatings(pastMatchesChrono) {
  const ratings = new Map();  // teamId (PandaScore, integer) -> Elo score

  for (const m of pastMatchesChrono) {
    const opA = m.opponents[0]?.opponent;
    const opB = m.opponents[1]?.opponent;
    if (!opA || !opB) continue;

    const idA = opA.id;
    const idB = opB.id;

    const eloA = ratings.get(idA) ?? ELO_INITIAL;
    const eloB = ratings.get(idB) ?? ELO_INITIAL;

    const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
    const expectedB = 1 - expectedA;

    const winnerId = m.winner_id;
    const resultA = winnerId === idA ? 1 : 0;
    const resultB = winnerId === idB ? 1 : 0;

    ratings.set(idA, eloA + ELO_K * (resultA - expectedA));
    ratings.set(idB, eloB + ELO_K * (resultB - expectedB));
  }

  return ratings;
}

function eloToCote(eloTeam, eloOpponent) {
  const prob = 1 / (1 + Math.pow(10, (eloOpponent - eloTeam) / 400));
  const cote = 1 / prob;
  // Clamp à des valeurs raisonnables
  return Math.max(1.05, Math.min(10.0, cote));
}

function computeTeamForms(pastMatchesChrono) {
  // Map<teamId, Array<'W'|'L'>> — le plus récent à la fin
  const forms = new Map();

  for (const m of pastMatchesChrono) {
    const idA = m.opponents[0]?.opponent?.id;
    const idB = m.opponents[1]?.opponent?.id;
    if (!idA || !idB) continue;

    const winnerId = m.winner_id;

    if (!forms.has(idA)) forms.set(idA, []);
    if (!forms.has(idB)) forms.set(idB, []);

    forms.get(idA).push(winnerId === idA ? 'W' : 'L');
    forms.get(idB).push(winnerId === idB ? 'W' : 'L');
  }

  // Ne garde que les 5 derniers pour chaque équipe
  const formStrings = new Map();
  for (const [teamId, history] of forms) {
    const last5 = history.slice(-5);
    formStrings.set(teamId, last5.join(''));
  }

  return formStrings;
}

async function transformMatch(m, eloRatings, teamForms) {
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

  // Une équipe sans historique récent reste à l'Elo initial : sa cote sera
  // donc 2.00 face à un adversaire lui aussi inconnu, soit un match nul.
  const eloA = eloRatings.get(opA.id) ?? ELO_INITIAL;
  const eloB = eloRatings.get(opB.id) ?? ELO_INITIAL;
  const coteA = eloToCote(eloA, eloB);
  const coteB = eloToCote(eloB, eloA);
  const formA = teamForms.get(opA.id) ?? '';
  const formB = teamForms.get(opB.id) ?? '';

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
      image_url: opA.image_url || null,
      cote: Number(coteA.toFixed(2)),   // 2 décimales suffisent
      form: formA,
    },
    team_b: {
      id: `panda-${opB.id}`,
      name: opB.name || '?',
      region: opB.location || '?',
      image_url: opB.image_url || null,
      cote: Number(coteB.toFixed(2)),
      form: formB,
    },
    start_time: Timestamp.fromDate(new Date(m.scheduled_at)),
    mvps: [...mvpsA, ...mvpsB],
  };
}

/*
 * Pose automatiquement le résultat des matches déjà en base que PandaScore
 * déclare terminés. Ne touche jamais un match qui a déjà un `result` : une
 * saisie manuelle d'admin fait toujours foi.
 */
async function autoResolvePastMatches(pastMatches) {
  /*
   * Le filtre « 7 derniers jours » vit ici depuis que l'appelant fournit
   * l'historique complet (200 matches) dont l'Elo a besoin. Sans ce filtre,
   * chaque run relirait des matches vieux de plusieurs semaines pour rien.
   */
  const nowMs = Date.now();
  const sevenDaysAgo = nowMs - 7 * 24 * 3600 * 1000;
  const recentPast = pastMatches.filter(m => {
    if (!m.scheduled_at) return false;
    const scheduledMs = new Date(m.scheduled_at).getTime();
    return scheduledMs >= sevenDaysAgo && scheduledMs <= nowMs;
  });
  console.log(`   ${recentPast.length} matches passés dans les 7 derniers jours.`);

  let resolvedCount = 0;
  let skippedExisting = 0;
  let skippedNoResult = 0;
  let skippedNotInBase = 0;
  const batch = db.batch();

  for (const m of recentPast) {
    const docId = `pandascore-${m.id}`;
    const ref = db.collection('matches').doc(docId);
    const snap = await ref.get();

    // Le match doit exister dans notre base (donc dans un circuit qu'on suit).
    if (!snap.exists) {
      skippedNotInBase++;
      continue;
    }

    const existing = snap.data();

    // Ne jamais écraser un résultat déjà saisi (manuel ou automatique).
    if (existing.result) {
      skippedExisting++;
      continue;
    }

    // PandaScore doit avoir un vainqueur et des scores.
    if (!m.winner_id || !Array.isArray(m.results) || m.results.length < 2) {
      skippedNoResult++;
      continue;
    }

    // Mapper le vainqueur PandaScore sur team_a ou team_b.
    // Notre convention : les ids d'équipe sont préfixés 'panda-' + id PandaScore.
    const winnerTeamId = `panda-${m.winner_id}`;
    let winnerSide = null;
    if (existing.team_a?.id === winnerTeamId) winnerSide = 'a';
    else if (existing.team_b?.id === winnerTeamId) winnerSide = 'b';

    if (!winnerSide) {
      console.warn(`   ⚠️ ${docId}: winner_id ${m.winner_id} ne matche aucune équipe stockée.`);
      continue;
    }

    // Extraire les scores. results est un array [{team_id, score}, ...].
    const winnerResult = m.results.find(r => `panda-${r.team_id}` === winnerTeamId);
    const loserResult = m.results.find(r => `panda-${r.team_id}` !== winnerTeamId);
    if (!winnerResult || !loserResult) {
      skippedNoResult++;
      continue;
    }

    const winnerGames = winnerResult.score ?? 0;
    const loserGames = loserResult.score ?? 0;

    // Format de score attendu : 'a-2-1', 'b-3-0', etc.
    const scoreKey = `${winnerSide}-${winnerGames}-${loserGames}`;

    // Agrégats des pronos existants sur ce match, même requête que
    // handleSubmitResult côté client.
    const pronosSnap = await db.collectionGroup('pronos')
      .where('matchId', '==', docId)
      .get();

    const scoreCounts = {};
    const mvpCounts = {};
    let totalPronos = 0;
    for (const pronoDoc of pronosSnap.docs) {
      const p = pronoDoc.data();
      totalPronos++;
      scoreCounts[p.score] = (scoreCounts[p.score] ?? 0) + 1;
      if (p.mvp) mvpCounts[p.mvp] = (mvpCounts[p.mvp] ?? 0) + 1;
    }

    const result = {
      score: scoreKey,
      mvp: '',                       // pas de MVP officiel dans le tier gratuit
      submittedAt: FieldValue.serverTimestamp(),
      autoResolved: true,            // marqueur : ce résultat vient de PandaScore
      aggregates: {
        scoreCounts,
        mvpCounts,
        totalPronos,
      },
    };

    batch.update(ref, { result });
    resolvedCount++;
  }

  if (resolvedCount > 0) {
    await batch.commit();
    console.log(`   ✅ Auto-résolu ${resolvedCount} matches.`);
  }
  if (skippedExisting > 0) console.log(`   ⏭️  ${skippedExisting} déjà résolus.`);
  if (skippedNoResult > 0) console.log(`   ⏭️  ${skippedNoResult} sans résultat côté PandaScore.`);
  if (skippedNotInBase > 0) console.log(`   ⏭️  ${skippedNotInBase} pas dans notre base.`);
}

async function main() {
  console.log('🧹 Nettoyage des matches PandaScore obsolètes...');

  const existingSnap = await db.collection('matches').get();
  const AMATEUR_KEYWORDS = ['challengers', 'academy', 'emergent', 'rising', 'development'];

  let deletedCount = 0;
  const batchDelete = db.batch();
  for (const doc of existingSnap.docs) {
    const id = doc.id;
    if (!id.startsWith('pandascore-')) continue;   // on ne touche que les matches PandaScore

    const data = doc.data();
    if (data.result) continue;                     // protection : jamais toucher un match résulté

    const tournamentLower = (data.tournament || '').toLowerCase();
    const isAmateur = AMATEUR_KEYWORDS.some(kw => tournamentLower.includes(kw));

    if (isAmateur) {
      batchDelete.delete(doc.ref);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    await batchDelete.commit();
    console.log(`   Supprimé ${deletedCount} matches d'académie/développement.`);
  } else {
    console.log('   Rien à supprimer.');
  }

  console.log('📡 Fetch des matches upcoming depuis PandaScore...');
  const res = await fetch(
    `${PANDA_BASE}/lol/matches/upcoming?per_page=100`,
    { headers: AUTH_HEADER }
  );
  if (!res.ok) {
    console.error('❌ PandaScore request failed:', res.status, await res.text());
    process.exit(1);
  }
  const rawMatches = await res.json();

  // ─── DIAG TEMPORAIRE — à retirer une fois le comportement de l'API compris ───
  console.log(`📊 PandaScore a retourné ${rawMatches.length} matches bruts.`);
  // Liste des leagues distinctes reçues, pour voir si on rate des compétitions.
  const leaguesSeen = new Map();
  for (const m of rawMatches) {
    const name = m.league?.name || '(pas de league)';
    leaguesSeen.set(name, (leaguesSeen.get(name) || 0) + 1);
  }
  console.log(`   Leagues distinctes vues :`);
  for (const [name, count] of leaguesSeen) {
    const detected = detectCompetition(name) || '❌';
    console.log(`     [${detected}] ${name} — ${count} match(es)`);
  }

  // Stats de filtrage
  const stats = { noComp: 0, tooFewOpponents: 0, noScheduledAt: 0, kept: 0 };
  // ─── FIN DIAG TEMPORAIRE ───

  /*
   * Placé ici volontairement : plus bas, main() sort en avance si aucun match
   * upcoming n'est retenu, et l'auto-résolution ne tournerait jamais un jour
   * sans match à venir.
   */
  console.log('📡 Fetch de 200 matches passés pour Elo + auto-résolution...');
  const pastPages = await Promise.all([
    fetch(`${PANDA_BASE}/lol/matches/past?per_page=100&page=1&sort=-scheduled_at`, { headers: AUTH_HEADER }),
    fetch(`${PANDA_BASE}/lol/matches/past?per_page=100&page=2&sort=-scheduled_at`, { headers: AUTH_HEADER }),
  ]);
  for (const pastRes of pastPages) {
    if (!pastRes.ok) {
      console.warn(`   ⚠️ Fetch past échoué (${pastRes.status}), on continue avec ce qu'on a.`);
    }
  }

  const pastMatchesRaw = [];
  for (const pastRes of pastPages) {
    if (pastRes.ok) {
      const page = await pastRes.json();
      pastMatchesRaw.push(...page);
    }
  }
  console.log(`   Reçu ${pastMatchesRaw.length} matches passés bruts.`);

  // Filtre : seulement les circuits qu'on suit, et matches avec vainqueur défini
  const pastMatchesRelevant = pastMatchesRaw.filter(m => {
    if (!detectCompetition(m.league?.name)) return false;
    if (!m.winner_id) return false;
    if (!m.opponents || m.opponents.length < 2) return false;
    if (!m.results || m.results.length < 2) return false;
    return true;
  });
  console.log(`   ${pastMatchesRelevant.length} matches passés pertinents (circuits suivis + vainqueur défini).`);

  // Trier chronologiquement (plus ancien d'abord) pour Elo
  const pastMatchesChrono = [...pastMatchesRelevant].sort((a, b) =>
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  const eloRatings = computeEloRatings(pastMatchesChrono);
  const teamForms = computeTeamForms(pastMatchesChrono);
  console.log(`   Elo calculé pour ${eloRatings.size} équipes, forme pour ${teamForms.size}.`);

  await autoResolvePastMatches(pastMatchesRelevant);

  console.log('🔄 Filtrage et transformation...');
  const transformed = [];
  for (const m of rawMatches) {
    try {
      // DIAG TEMPORAIRE : ces vérifs dupliquent celles de transformMatch pour
      // pouvoir compter chaque motif d'exclusion. À retirer avec le reste.
      if (!detectCompetition(m.league?.name)) { stats.noComp++; continue; }
      if (!m.opponents || m.opponents.length < 2) { stats.tooFewOpponents++; continue; }
      if (!m.scheduled_at) { stats.noScheduledAt++; continue; }

      const doc = await transformMatch(m, eloRatings, teamForms);
      if (doc) {
        transformed.push(doc);
        stats.kept++;
      }
    } catch (err) {
      console.warn(`   ⚠️  Ignoré match ${m.id}: ${err.message}`);
    }
  }
  console.log(`   Filtrage : ${stats.kept} gardés, ${stats.noComp} exclus (compétition non reconnue), ${stats.tooFewOpponents} sans 2 équipes, ${stats.noScheduledAt} sans date.`);
  console.log(`   ${transformed.length} matches retenus après filtrage.`);

  if (transformed.length === 0) {
    console.log('Rien à écrire, sortie.');
    return;
  }

  console.log('💾 Écriture dans Firestore...');
  const batch = db.batch();
  let preservedOdds = 0;
  for (const doc of transformed) {
    const ref = db.collection('matches').doc(doc.id);

    /*
     * Un match déjà résolu garde les cotes et la forme qu'il avait au moment
     * du prono. L'Elo évolue à chaque run : sans cette garde, les points déjà
     * attribués aux joueurs changeraient rétroactivement.
     */
    const existingSnap = await ref.get();
    if (existingSnap.exists) {
      const existing = existingSnap.data();
      if (existing.result) {
        doc.team_a.cote = existing.team_a.cote;
        doc.team_a.form = existing.team_a.form;
        doc.team_b.cote = existing.team_b.cote;
        doc.team_b.form = existing.team_b.form;
        preservedOdds++;
      }
    }

    batch.set(ref, doc, { merge: true });
  }
  await batch.commit();

  if (preservedOdds > 0) {
    console.log(`   ${preservedOdds} matches résolus : cotes et formes d'origine préservées.`);
  }

  console.log(`✅ ${transformed.length} matches écrits.`);

  // ═════════════════════════════════════════════════════════════
  // Nettoyage des matches passés que PandaScore ne renvoie plus
  // ═════════════════════════════════════════════════════════════
  console.log('🧹 Nettoyage des orphelins...');
  const seenIds = new Set(transformed.map(d => d.id));
  const now = Date.now();
  const gracePeriod = 24 * 3600 * 1000; // 24h — on garde les matches très récents au cas où
  const allExisting = await db.collection('matches')
    .get();

  let deletedOrphans = 0;
  const batchDeleteOrphans = db.batch();
  for (const doc of allExisting.docs) {
    const id = doc.id;
    if (!id.startsWith('pandascore-')) continue; // ne touche que les PandaScore
    if (seenIds.has(id)) continue;                // toujours renvoyé, garde

    const data = doc.data();
    const startTime = data.start_time?.toMillis?.() || 0;

    // Nouvelle règle : préserver tous les matches passés, même sans result.
    // Ils seront affichés dans "Les derniers résultats" comme historiques.
    // Nettoyage manuel prévu à la fin de chaque saison.
    if (startTime < now) continue;

    if (data.result) continue;                    // résulté = préserver toujours

    // ⚠️ Cette ligne rend le bloc inerte : tout ce qui arrive ici est dans le
    // futur, donc `startTime + 24h > now` est toujours vrai. Aucune suppression
    // n'a donc lieu, par choix — on attend les logs de diag PandaScore avant de
    // décider si on veut vraiment supprimer les matches futurs orphelins.
    // La retirer suffit à réactiver la suppression des annulés/reprogrammés,
    // mais attention : per_page=100 n'est pas paginé, un match légitime
    // au-delà du 100e serait vu comme orphelin à chaque run.
    if (startTime + gracePeriod > now) continue;  // trop récent, on attend un cycle

    batchDeleteOrphans.delete(doc.ref);
    deletedOrphans++;
  }

  if (deletedOrphans > 0) {
    await batchDeleteOrphans.commit();
    console.log(`   Supprimé ${deletedOrphans} matches orphelins (passés, sans résultat, plus renvoyés par PandaScore).`);
  } else {
    console.log('   Aucun orphelin à supprimer.');
  }

  console.log('\nRécap :');
  for (const doc of transformed) {
    console.log(`   ${doc.id.padEnd(20)} ${doc.competition.toUpperCase()} · ${doc.team_a.name} vs ${doc.team_b.name} · ${new Date(doc.start_time.toMillis()).toISOString()}`);
  }
}

main().catch(err => {
  console.error('❌ Erreur inattendue:', err);
  process.exit(1);
});
