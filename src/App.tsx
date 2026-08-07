import { useState, useCallback } from 'react'
import './styles/globals.css'
import {
  collectionGroup,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { League, Prono } from './lib/types'
import { db } from './lib/firebase'
import { isMatchLocked, isMatchResulted, heroWindowMs } from './lib/matchStatus'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { usePronos } from './hooks/usePronos'
import { useLeagues } from './hooks/useLeagues'
import { useMatches } from './hooks/useMatches'
import { useTick } from './hooks/useTick'
import { useFriends } from './hooks/useFriends'
import { useRevealedPronos } from './hooks/useRevealedPronos'
import Nav from './components/Nav'
import Hero from './components/Hero'
import LeaguesSection from './components/LeaguesSection'
import MatchesSection from './components/MatchesSection'
import ResultsSection from './components/ResultsSection'
import PronoModal from './components/PronoModal'
import ResultModal from './components/ResultModal'
import CreateLeagueModal from './components/CreateLeagueModal'
import LeagueCreatedModal from './components/LeagueCreatedModal'
import JoinLeagueModal from './components/JoinLeagueModal'
import LeagueDetailModal from './components/LeagueDetailModal'
import Onboarding from './components/Onboarding'
import AuthScreen from './components/AuthScreen'
import ConversionBanner from './components/ConversionBanner'
import ConvertAccountModal from './components/ConvertAccountModal'
import SplashScreen from './components/SplashScreen'

function App() {
  const {
    user,
    loading: authLoading,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    linkAnonymousToEmail,
  } = useAuth()
  const { profile, loading: profileLoading, saveProfile } = useProfile(user?.uid ?? null)
  const { pronos, submitProno } = usePronos(user?.uid ?? null)
  const { leagues, createLeague, joinLeague } = useLeagues(user?.uid ?? null)
  const { matches, loading: matchesLoading } = useMatches()

  // Re-rendu chaque seconde : c'est ce qui fait basculer les cartes en
  // « verrouillé » au kick-off sans que l'utilisateur ait à interagir.
  const tick = useTick(1000)

  const { friendIds, profiles: friendProfiles } = useFriends(user?.uid ?? null, leagues)
  const revealedPronos = useRevealedPronos(matches, friendIds, tick)

  const [pronoingMatchId, setPronoingMatchId] = useState<string | null>(null)
  const [creatingLeague, setCreatingLeague] = useState(false)
  const [joiningLeague, setJoiningLeague] = useState(false)
  const [createdLeague, setCreatedLeague] = useState<League | null>(null)
  const [resultingMatchId, setResultingMatchId] = useState<string | null>(null)
  const [detailLeague, setDetailLeague] = useState<League | null>(null)
  const [showConvert, setShowConvert] = useState(false)

  const handleOpenProno = useCallback(
    (matchId: string) => {
      const match = matches.find((m) => m.id === matchId)
      if (!match || isMatchLocked(match)) return
      setPronoingMatchId(matchId)
    },
    [matches],
  )
  const handleCloseProno = useCallback(() => setPronoingMatchId(null), [])

  const handleOpenCreate = useCallback(() => setCreatingLeague(true), [])
  const handleCloseCreate = useCallback(() => setCreatingLeague(false), [])
  const handleOpenJoin = useCallback(() => setJoiningLeague(true), [])
  const handleCloseJoin = useCallback(() => setJoiningLeague(false), [])
  const handleLeagueCreated = useCallback((league: League) => setCreatedLeague(league), [])
  const handleCloseLeagueCreated = useCallback(() => setCreatedLeague(null), [])

  const handleOpenLeagueDetail = useCallback((league: League) => {
    setDetailLeague(league)
  }, [])
  const handleCloseLeagueDetail = useCallback(() => {
    setDetailLeague(null)
  }, [])

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      await signIn(email, password)
    },
    [signIn],
  )

  const handleSignUp = useCallback(
    async (email: string, password: string, pseudo: string) => {
      await signUp(email, password, pseudo)
      // Le profil est créé dans signUp lui-même.
    },
    [signUp],
  )

  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [signOut])

  const handleSendReset = useCallback(
    async (email: string) => {
      await sendPasswordReset(email)
    },
    [sendPasswordReset],
  )

  const handleConvert = useCallback(
    async (email: string, password: string) => {
      await linkAnonymousToEmail(email, password)
    },
    [linkAnonymousToEmail],
  )

  const handleOpenConvert = useCallback(() => setShowConvert(true), [])
  const handleCloseConvert = useCallback(() => setShowConvert(false), [])

  const handleOpenResult = useCallback((matchId: string) => setResultingMatchId(matchId), [])
  const handleCloseResult = useCallback(() => setResultingMatchId(null), [])

  const handleSubmitResult = useCallback(
    async (matchId: string, score: string, mvp: string) => {
      const match = matches.find((m) => m.id === matchId)
      if (!match || !isMatchLocked(match) || isMatchResulted(match)) {
        throw new Error('Match invalide pour saisir un résultat')
      }

      try {
        // Tous les pronos de la base pour ce match, tous utilisateurs confondus.
        const pronosQuery = query(
          collectionGroup(db, 'pronos'),
          where('matchId', '==', matchId),
        )
        const pronosSnapshot = await getDocs(pronosQuery)
        const allPronos: Prono[] = pronosSnapshot.docs.map((d) => d.data() as Prono)

        const scoreCounts: Record<string, number> = {}
        const mvpCounts: Record<string, number> = {}
        for (const p of allPronos) {
          scoreCounts[p.score] = (scoreCounts[p.score] ?? 0) + 1
          mvpCounts[p.mvp] = (mvpCounts[p.mvp] ?? 0) + 1
        }

        await updateDoc(doc(db, 'matches', matchId), {
          result: {
            score,
            mvp,
            submittedAt: serverTimestamp(),
            aggregates: { scoreCounts, mvpCounts, totalPronos: allPronos.length },
          },
        })
      } catch (err) {
        console.error("Erreur d'écriture du résultat :", err)
        // Relancé pour que ResultModal continue d'afficher l'erreur à l'écran.
        throw err
      }
    },
    [matches],
  )

  const handleSubmitProno = useCallback(
    async (score: string, mvp: string) => {
      if (!pronoingMatchId) return
      try {
        await submitProno(pronoingMatchId, score, mvp)
      } catch (err) {
        console.error("Erreur d'écriture du prono :", err)
        alert("Le prono n'a pas pu être enregistré. Réessaie.")
      }
    },
    [pronoingMatchId, submitProno],
  )

  if (authLoading) return <SplashScreen />
  if (!user) {
    return (
      <AuthScreen
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onSendReset={handleSendReset}
      />
    )
  }
  if (profileLoading || matchesLoading) return <SplashScreen />
  // Filet de sécurité : cas rare d'un user créé sans profil
  if (!profile) return <Onboarding onSubmit={saveProfile} />

  const now = Date.now()

  // Priorité 1 : le prochain match à venir.
  const upcoming = matches
    .filter((m) => m.start_time > now)
    .sort((a, b) => a.start_time - b.start_time)

  // Priorité 2 : match en cours (verrouillé sans résultat, fenêtre de fraîcheur).
  const inProgress = matches
    .filter((m) => m.start_time <= now && !m.result && m.start_time + heroWindowMs(m) > now)
    .sort((a, b) => b.start_time - a.start_time)

  // Priorité 3 : rien de rien. Le hero disparaît.
  // Un match terminé n'est jamais le hero : il vit dans « Les derniers résultats ».
  const heroMatch = upcoming[0] ?? inProgress[0] ?? null

  const resultingMatch = matches.find((m) => m.id === resultingMatchId) ?? null
  const pronoingMatch = matches.find((m) => m.id === pronoingMatchId) ?? null

  return (
    <>
      {user.isAnonymous && <ConversionBanner onOpenConvert={handleOpenConvert} />}

      <Nav
        pseudo={profile.pseudo}
        matches={matches}
        pronos={pronos}
        onSignOut={handleSignOut}
      />

      {/* Le hero se masque quand il n'y a ni match à venir ni match en cours. */}
      {heroMatch && (
        <Hero
          match={heroMatch}
          existingProno={pronos[heroMatch.id] ?? null}
          onPronoClick={handleOpenProno}
          revealedPronos={revealedPronos}
          friendProfiles={friendProfiles}
        />
      )}

      <LeaguesSection
        leagues={leagues}
        onCreate={handleOpenCreate}
        onJoin={handleOpenJoin}
        onOpenDetail={handleOpenLeagueDetail}
      />
      <MatchesSection
        matches={matches}
        pronos={pronos}
        onPronoClick={handleOpenProno}
        revealedPronos={revealedPronos}
        friendProfiles={friendProfiles}
        onOpenResult={handleOpenResult}
      />
      <ResultsSection
        matches={matches}
        pronos={pronos}
        revealedPronos={revealedPronos}
        friendProfiles={friendProfiles}
        onOpenResult={handleOpenResult}
      />

      {pronoingMatch && (
        <PronoModal
          match={pronoingMatch}
          existingProno={pronos[pronoingMatch.id] ?? null}
          onSubmit={handleSubmitProno}
          onClose={handleCloseProno}
        />
      )}

      {creatingLeague && (
        <CreateLeagueModal
          onCreate={createLeague}
          onClose={handleCloseCreate}
          onCreated={handleLeagueCreated}
        />
      )}

      {joiningLeague && (
        <JoinLeagueModal onJoin={joinLeague} onClose={handleCloseJoin} />
      )}

      {createdLeague && (
        <LeagueCreatedModal league={createdLeague} onClose={handleCloseLeagueCreated} />
      )}

      {detailLeague && profile && (
        <LeagueDetailModal
          league={detailLeague}
          matches={matches}
          pronos={pronos}
          revealedPronos={revealedPronos}
          currentUserId={user.uid}
          currentUserPseudo={profile.pseudo}
          friendProfiles={friendProfiles}
          onClose={handleCloseLeagueDetail}
        />
      )}

      {showConvert && (
        <ConvertAccountModal onSubmit={handleConvert} onClose={handleCloseConvert} />
      )}

      {resultingMatch && (
        <ResultModal
          match={resultingMatch}
          onSubmit={(score, mvp) => handleSubmitResult(resultingMatch.id, score, mvp)}
          onClose={handleCloseResult}
        />
      )}
    </>
  )
}

export default App
