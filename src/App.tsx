import { useState, useCallback, useEffect } from 'react'
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
import type { AvatarKind, FrameKind, League, Prono } from './lib/types'
import { db } from './lib/firebase'
import { isMatchLocked, isMatchResulted, heroWindowMs } from './lib/matchStatus'
import { computeStreak } from './lib/streak'
import { computeUserStats, userStatsEquals } from './lib/userStats'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { usePronos } from './hooks/usePronos'
import { useLeagues } from './hooks/useLeagues'
import { useMatches } from './hooks/useMatches'
import { useTick } from './hooks/useTick'
import { useFriends } from './hooks/useFriends'
import { useRevealedPronos } from './hooks/useRevealedPronos'
import { useTrophies } from './hooks/useTrophies'
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
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import EditProfileModal from './components/EditProfileModal'
import AvatarPickerModal from './components/AvatarPickerModal'
import FramePickerModal from './components/FramePickerModal'
import TitlePickerModal from './components/TitlePickerModal'
import TrophyToast from './components/TrophyToast'
import GlobalLeaderboardView from './components/GlobalLeaderboardView'
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
  const {
    trophies,
    currentToast,
    dismissToast,
  } = useTrophies(user?.uid ?? null, matches, pronos)

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
  // null = modale d'auth fermée ; string = ouverte avec le message contextuel.
  const [authModalContext, setAuthModalContext] = useState<string | null>(null)
  const [viewingProfileUid, setViewingProfileUid] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [picker, setPicker] = useState<'avatar' | 'frame' | 'title' | null>(null)
  const [currentView, setCurrentView] = useState<'home' | 'global'>('home')

  /*
   * Réconciliation des stats. Même principe que le streak : la source de vérité
   * reste le calcul local, mais les agrégats sont dénormalisés dans le profil
   * pour que le classement global n'ait pas à lire les pronos de chacun.
   */
  useEffect(() => {
    if (!user || !profile) return
    if (matches.length === 0) return

    const newStats = computeUserStats(matches, pronos)

    // userStatsEquals compare champ par champ et ignore lastComputedAt.
    if (!userStatsEquals(newStats, profile.stats)) {
      saveProfile({ stats: newStats }).catch((err) =>
        console.error('Stats update failed:', err),
      )
    }
  }, [matches, pronos, user, profile, saveProfile])

  /*
   * Réconciliation du streak. Le streak vit dans Firestore pour être lisible
   * par les autres joueurs, mais la source de vérité reste le calcul local sur
   * matches + pronos. Cet effet réécrit le profil dès que les deux divergent.
   * La garde d'égalité est ce qui empêche la boucle : la mise à jour change
   * `profile`, l'effet retourne, et la seconde passe ne réécrit plus rien.
   */
  useEffect(() => {
    if (!user || !profile) return
    if (matches.length === 0) return

    const { current, longest } = computeStreak(matches, pronos)
    const storedCurrent = profile.currentStreak ?? 0
    const storedLongest = profile.longestStreak ?? 0

    // Le record ne redescend jamais, même si le streak courant est cassé.
    const newLongest = Math.max(storedLongest, current, longest)

    if (current !== storedCurrent || newLongest !== storedLongest) {
      // Non bloquant : un échec d'écriture ne doit pas casser le rendu.
      saveProfile({ currentStreak: current, longestStreak: newLongest }).catch((err) =>
        console.error('Streak update failed:', err),
      )
    }
  }, [matches, pronos, user, profile, saveProfile])

  // Toutes les actions réservées passent par ici : un visiteur déclenche la
  // modale d'inscription au lieu de l'action, plutôt qu'un écran de login global.
  const requireAuth = useCallback(
    (context: string): boolean => {
      if (!user) {
        setAuthModalContext(context)
        return false
      }
      return true
    },
    [user],
  )

  const handleOpenAuth = useCallback((context: string) => setAuthModalContext(context), [])
  const handleCloseAuth = useCallback(() => setAuthModalContext(null), [])

  const handleOpenProfile = useCallback((uid: string) => setViewingProfileUid(uid), [])
  const handleCloseProfile = useCallback(() => setViewingProfileUid(null), [])
  const handleOpenEditProfile = useCallback(() => setEditingProfile(true), [])
  const handleCloseEditProfile = useCallback(() => setEditingProfile(false), [])

  const handleSavePseudo = useCallback(
    async (newPseudo: string) => {
      await saveProfile({ pseudo: newPseudo })
    },
    [saveProfile],
  )

  const handleViewChange = useCallback((view: 'home' | 'global') => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }, [])

  const handleClosePicker = useCallback(() => setPicker(null), [])
  const handleOpenAvatarPicker = useCallback(() => setPicker('avatar'), [])
  const handleOpenFramePicker = useCallback(() => setPicker('frame'), [])
  const handleOpenTitlePicker = useCallback(() => setPicker('title'), [])

  const handleSaveAvatar = useCallback(
    async (avatar: AvatarKind) => {
      await saveProfile({ avatar })
    },
    [saveProfile],
  )

  const handleSaveFrame = useCallback(
    async (frame: FrameKind | null) => {
      await saveProfile({ selectedFrame: frame })
    },
    [saveProfile],
  )

  const handleSaveTitle = useCallback(
    async (title: string | null) => {
      await saveProfile({ selectedTitle: title })
    },
    [saveProfile],
  )

  const handleOpenProno = useCallback(
    (matchId: string) => {
      if (!requireAuth('Connecte-toi pour pronostiquer.')) return
      const match = matches.find((m) => m.id === matchId)
      if (!match || isMatchLocked(match)) return
      setPronoingMatchId(matchId)
    },
    [requireAuth, matches],
  )
  const handleCloseProno = useCallback(() => setPronoingMatchId(null), [])

  const handleOpenCreate = useCallback(() => {
    if (!requireAuth('Connecte-toi pour créer une ligue.')) return
    setCreatingLeague(true)
  }, [requireAuth])
  const handleCloseCreate = useCallback(() => setCreatingLeague(false), [])
  const handleOpenJoin = useCallback(() => {
    if (!requireAuth('Connecte-toi pour rejoindre une ligue.')) return
    setJoiningLeague(true)
  }, [requireAuth])
  const handleCloseJoin = useCallback(() => setJoiningLeague(false), [])
  const handleLeagueCreated = useCallback((league: League) => setCreatedLeague(league), [])
  const handleCloseLeagueCreated = useCallback(() => setCreatedLeague(null), [])

  const handleOpenLeagueDetail = useCallback(
    (league: League) => {
      if (!requireAuth('Connecte-toi pour voir le classement.')) return
      setDetailLeague(league)
    },
    [requireAuth],
  )
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
  if (matchesLoading) return <SplashScreen />
  if (user && profileLoading) return <SplashScreen />
  // Filet de sécurité : cas rare d'un user créé sans profil
  if (user && !profile) {
    return <Onboarding onSubmit={(pseudo) => saveProfile({ pseudo })} />
  }

  // Un visiteur (user === null) tombe dans le rendu principal comme un
  // connecté. Les restrictions vivent au niveau des actions, via requireAuth.
  const isVisitor = user === null
  const trophyIds = trophies.map((t) => t.id)

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
      {user?.isAnonymous && <ConversionBanner onOpenConvert={handleOpenConvert} />}

      <Nav
        pseudo={profile?.pseudo ?? ''}
        matches={matches}
        pronos={pronos}
        onSignOut={handleSignOut}
        isVisitor={isVisitor}
        onOpenAuth={handleOpenAuth}
        profile={profile}
        userId={user?.uid}
        onOpenOwnProfile={user ? () => handleOpenProfile(user.uid) : undefined}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {currentView === 'home' ? (
        <>
          {/* Le hero se masque quand il n'y a ni match à venir ni match en cours. */}
          {heroMatch && (
            <Hero
              match={heroMatch}
              existingProno={pronos[heroMatch.id] ?? null}
              onPronoClick={handleOpenProno}
              revealedPronos={revealedPronos}
              friendProfiles={friendProfiles}
              isVisitor={isVisitor}
              onOpenAuth={handleOpenAuth}
            />
          )}

          {user && (
            <LeaguesSection
              leagues={leagues}
              onCreate={handleOpenCreate}
              onJoin={handleOpenJoin}
              onOpenDetail={handleOpenLeagueDetail}
            />
          )}
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
        </>
      ) : (
        <GlobalLeaderboardView
          currentUserId={user?.uid ?? null}
          onOpenProfile={user ? handleOpenProfile : undefined}
        />
      )}

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

      {detailLeague && user && profile && (
        <LeagueDetailModal
          league={detailLeague}
          matches={matches}
          pronos={pronos}
          revealedPronos={revealedPronos}
          currentUserId={user.uid}
          currentUserPseudo={profile.pseudo}
          currentUserProfile={profile}
          friendProfiles={friendProfiles}
          onOpenProfile={handleOpenProfile}
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

      {authModalContext !== null && (
        <AuthModal
          contextMessage={authModalContext}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onSendReset={handleSendReset}
          onClose={handleCloseAuth}
        />
      )}

      {viewingProfileUid && user && (
        <ProfileModal
          userId={viewingProfileUid}
          currentUserId={user.uid}
          onEdit={handleOpenEditProfile}
          onOpenAvatarPicker={handleOpenAvatarPicker}
          onOpenFramePicker={handleOpenFramePicker}
          onOpenTitlePicker={handleOpenTitlePicker}
          onClose={handleCloseProfile}
        />
      )}

      {editingProfile && profile && (
        <EditProfileModal
          currentPseudo={profile.pseudo}
          onSave={handleSavePseudo}
          onClose={handleCloseEditProfile}
        />
      )}

      {picker === 'avatar' && user && profile && (
        <AvatarPickerModal
          profile={profile}
          userId={user.uid}
          trophyIds={trophyIds}
          onSave={handleSaveAvatar}
          onClose={handleClosePicker}
        />
      )}

      {picker === 'frame' && profile && (
        <FramePickerModal
          profile={profile}
          trophyIds={trophyIds}
          onSave={handleSaveFrame}
          onClose={handleClosePicker}
        />
      )}

      {picker === 'title' && profile && (
        <TitlePickerModal
          profile={profile}
          trophyIds={trophyIds}
          onSave={handleSaveTitle}
          onClose={handleClosePicker}
        />
      )}

      <TrophyToast trophy={currentToast} onDismiss={dismissToast} />
    </>
  )
}

export default App
