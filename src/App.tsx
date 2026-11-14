import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  ArrowRight,
  Home,
  AlertTriangle,
  Wind,
  Medal,
  X,
} from 'lucide-react';
import {
  ROUNDS,
  CardInstance,
  WRONG_PAIR_PENALTY_THRESHOLD,
  PENALTY_MS,
  buildRoundDeck,
  shuffleUnmatchedCardsInPlace,
  pickRandomUnmatchedPairDesign,
  formatDuration,
  formatTotalSeconds,
} from './data/cards';
import { MemoryCard } from './components/MemoryCard';
import { soundEngine } from './utils/sound';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER';

interface ToastNotice {
  id: number;
  kind: 'penalty' | 'shuffle';
  message: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  totalMs: number;
  createdAt: number;
}

const BEST_TIME_STORAGE_KEY = 'flip_memory_3rounds_v2_best_ms';
const LEADERBOARD_STORAGE_KEY = 'flip_memory_3rounds_leaderboard_v1';
const LAST_NAME_STORAGE_KEY = 'flip_memory_last_challenger_name';
const CHALLENGER_NAME_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbfA-Za-z0-9]+$/;
const TITLE_KEYART_URL = '/src/assets/images/memory_tabletop_keyart_1794673681294.jpg';

function loadBestTime(): number | null {
  try {
    const raw = window.localStorage.getItem(BEST_TIME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveBestTime(ms: number) {
  try {
    window.localStorage.setItem(BEST_TIME_STORAGE_KEY, String(Math.round(ms)));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is LeaderboardEntry =>
          item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.totalMs === 'number' &&
          item.totalMs > 0
      )
      .sort((a, b) => a.totalMs - b.totalMs || a.createdAt - b.createdAt)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  try {
    window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries.slice(0, 5)));
  } catch {
    // Ignore storage errors
  }
}

function loadLastChallengerName(): string {
  try {
    const raw = window.localStorage.getItem(LAST_NAME_STORAGE_KEY);
    if (!raw) return '';
    return CHALLENGER_NAME_REGEX.test(raw) ? raw : '';
  } catch {
    return '';
  }
}

function saveLastChallengerName(name: string) {
  try {
    window.localStorage.setItem(LAST_NAME_STORAGE_KEY, name);
  } catch {
    // Ignore storage errors
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [roundIndex, setRoundIndex] = useState<number>(0); // 0 = Round 1 (8), 1 = Round 2 (18), 2 = Round 3 (28)
  const [cards, setCards] = useState<CardInstance[]>(() => buildRoundDeck(ROUNDS[0]));
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [isBoardLocked, setIsBoardLocked] = useState<boolean>(false);

  // Active play time in current round (excludes pause & penalties)
  const [roundActiveMs, setRoundActiveMs] = useState<number>(0);
  const [roundPenaltyMs, setRoundPenaltyMs] = useState<number>(0);
  const [roundPenaltyCount, setRoundPenaltyCount] = useState<number>(0);
  const [totalPenaltyMs, setTotalPenaltyMs] = useState<number>(0);
  const [totalPenaltyCount, setTotalPenaltyCount] = useState<number>(0);

  const [completedRoundTimes, setCompletedRoundTimes] = useState<number[]>([]);
  const [roundFlips, setRoundFlips] = useState<number>(0);
  const [totalFlips, setTotalFlips] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [consecutiveWrongPairs, setConsecutiveWrongPairs] = useState<number>(0);

  const [shuffleCountdownSec, setShuffleCountdownSec] = useState<number | null>(null);
  const [isShufflingPulse, setIsShufflingPulse] = useState<boolean>(false);
  const [shuffleFlipTick, setShuffleFlipTick] = useState<number>(0);
  const [toastNotice, setToastNotice] = useState<ToastNotice | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(() => loadBestTime());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [keyartError, setKeyartError] = useState<boolean>(false);

  const [challengerNameInput, setChallengerNameInput] = useState<string>(() =>
    loadLastChallengerName()
  );
  const [activeChallengerName, setActiveChallengerName] = useState<string>(() =>
    loadLastChallengerName()
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard());
  const [lastRunEntryId, setLastRunEntryId] = useState<string | null>(null);
  const [showTitleLeaderboard, setShowTitleLeaderboard] = useState<boolean>(false);

  // Refs for drift-free timer & safe async shuffle coordination
  const roundAccumulatedMsRef = useRef<number>(0);
  const roundStartPerfRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const toastTimeoutRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const roundCompletedRef = useRef<boolean>(false);
  const toastIdCounterRef = useRef<number>(0);

  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const prevRectsRef = useRef<Map<string, DOMRect> | null>(null);

  const nextShuffleAtMsRef = useRef<number | null>(null);
  const pendingShuffleRef = useRef<boolean>(false);

  const cardsRef = useRef<CardInstance[]>(cards);
  cardsRef.current = cards;

  const flippedUidsRef = useRef<string[]>(flippedUids);
  flippedUidsRef.current = flippedUids;

  const isBoardLockedRef = useRef<boolean>(isBoardLocked);
  isBoardLockedRef.current = isBoardLocked;

  const roundPenaltyMsRef = useRef<number>(roundPenaltyMs);
  roundPenaltyMsRef.current = roundPenaltyMs;

  const currentRoundConfig = ROUNDS[roundIndex];
  const matchedPairs = cards.filter((c) => c.isMatched).length / 2;
  const remainingPairs = currentRoundConfig.pairCount - matchedPairs;

  const currentRoundDisplayMs = roundActiveMs + roundPenaltyMs;
  const previousRoundsTotalMs = completedRoundTimes.reduce((acc, t) => acc + t, 0);
  const totalElapsedMs = previousRoundsTotalMs + currentRoundDisplayMs;

  const clearPendingTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastNotice(null);
  }, []);

  const showToast = useCallback((kind: 'penalty' | 'shuffle', message: string) => {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastIdCounterRef.current += 1;
    setToastNotice({ id: toastIdCounterRef.current, kind, message });
    toastTimeoutRef.current = window.setTimeout(() => {
      toastTimeoutRef.current = null;
      setToastNotice(null);
    }, 2400);
  }, []);

  const clearHint = useCallback(() => {
    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
    setCards((prev) => (prev.some((c) => c.isHinted) ? prev.map((c) => ({ ...c, isHinted: false })) : prev));
  }, []);

  const activatePairHint = useCallback(() => {
    const hintedDesign = pickRandomUnmatchedPairDesign(cardsRef.current);
    if (!hintedDesign) return;

    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current);
    }

    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isHinted: !c.isMatched && c.design.id === hintedDesign.id,
      }))
    );

    showToast('penalty', `連續翻錯 6 張！總秒數 +5 秒 · 已標示「${hintedDesign.name}」位置`);

    hintTimeoutRef.current = window.setTimeout(() => {
      hintTimeoutRef.current = null;
      setCards((prev) => prev.map((c) => ({ ...c, isHinted: false })));
    }, 3600);
  }, [showToast]);

  const scheduleTimeout = useCallback((fn: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      fn();
    }, delayMs);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  // Native React FLIP animation for "大風吹" (Big Wind Blows) card flight
  useLayoutEffect(() => {
    const prevRects = prevRectsRef.current;
    if (!prevRects || prevRects.size === 0) return;
    prevRectsRef.current = null;

    const gridEl = gridContainerRef.current;
    if (!gridEl) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const animatedNodes: HTMLDivElement[] = [];
    const cardEls = gridEl.querySelectorAll<HTMLDivElement>('[data-card-uid]');

    cardEls.forEach((el) => {
      const uid = el.dataset.cardUid;
      if (!uid) return;
      const oldRect = prevRects.get(uid);
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      const tilt = (Math.random() - 0.5) * 12;
      el.style.transition = 'none';
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${tilt}deg)`;
      el.style.zIndex = '10';
      animatedNodes.push(el);
    });

    if (animatedNodes.length === 0) return;

    // Force single layout flush before enabling compositor transform transition
    void document.body.offsetHeight;

    animatedNodes.forEach((el) => {
      el.style.transition = 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
    });

    const cleanupId = window.setTimeout(() => {
      animatedNodes.forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
        el.style.zIndex = '';
      });
    }, 550);

    return () => {
      window.clearTimeout(cleanupId);
      animatedNodes.forEach((el) => {
        el.style.transition = '';
        el.style.transform = '';
        el.style.zIndex = '';
      });
    };
  }, [shuffleFlipTick]);

  const executeUnmatchedShuffle = useCallback(() => {
    const unmatchedCount = cardsRef.current.filter((c) => !c.isMatched).length;
    if (unmatchedCount < 2) return;

    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }

    // Snapshot current card positions before shuffling for FLIP flight
    const rects = new Map<string, DOMRect>();
    const gridEl = gridContainerRef.current;
    if (gridEl) {
      gridEl.querySelectorAll<HTMLDivElement>('[data-card-uid]').forEach((el) => {
        const uid = el.dataset.cardUid;
        if (uid) {
          rects.set(uid, el.getBoundingClientRect());
        }
      });
    }
    prevRectsRef.current = rects;

    setIsBoardLocked(true);
    soundEngine.playWindBlow();
    setCards((prev) => shuffleUnmatchedCardsInPlace(prev));
    setShuffleFlipTick((t) => t + 1);
    setIsShufflingPulse(true);
    showToast('shuffle', '大風吹！未消除卡牌已隨機換位');

    scheduleTimeout(() => {
      setIsShufflingPulse(false);
      setIsBoardLocked(false);
    }, 560);
  }, [scheduleTimeout, showToast]);

  const stopTimerLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (roundStartPerfRef.current !== null) {
      roundAccumulatedMsRef.current += performance.now() - roundStartPerfRef.current;
      roundStartPerfRef.current = null;
    }
    setRoundActiveMs(roundAccumulatedMsRef.current);
  }, []);

  // Precision RAF timer loop + 10-second shuffle scheduler in Round 2 & Round 3
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    roundStartPerfRef.current = performance.now();

    const tick = () => {
      if (roundStartPerfRef.current !== null) {
        const activeElapsed =
          roundAccumulatedMsRef.current + (performance.now() - roundStartPerfRef.current);
        setRoundActiveMs(activeElapsed);

        const intervalMs = currentRoundConfig.shuffleIntervalMs;
        if (intervalMs !== null && nextShuffleAtMsRef.current !== null) {
          if (activeElapsed >= nextShuffleAtMsRef.current) {
            // Advance schedule to next 10s boundary
            while (
              nextShuffleAtMsRef.current !== null &&
              activeElapsed >= nextShuffleAtMsRef.current
            ) {
              nextShuffleAtMsRef.current += intervalMs;
            }

            if (isBoardLockedRef.current || flippedUidsRef.current.length > 0) {
              pendingShuffleRef.current = true;
            } else {
              executeUnmatchedShuffle();
            }
          }

          const remainingMs = Math.max(0, (nextShuffleAtMsRef.current ?? 0) - activeElapsed);
          setShuffleCountdownSec(Math.ceil(remainingMs / 1000));
        } else {
          setShuffleCountdownSec(null);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (roundStartPerfRef.current !== null) {
        roundAccumulatedMsRef.current += performance.now() - roundStartPerfRef.current;
        roundStartPerfRef.current = null;
      }
    };
  }, [currentRoundConfig.shuffleIntervalMs, executeUnmatchedShuffle, gameState]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeouts();
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      if (hintTimeoutRef.current !== null) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [clearPendingTimeouts]);

  const startGameWithChallenger = useCallback(
    (validatedName: string) => {
      clearPendingTimeouts();
      clearToast();
      if (hintTimeoutRef.current !== null) {
        window.clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
      roundAccumulatedMsRef.current = 0;
      roundStartPerfRef.current = null;
      roundPenaltyMsRef.current = 0;
      nextShuffleAtMsRef.current = ROUNDS[0].shuffleIntervalMs;
      pendingShuffleRef.current = false;
      roundCompletedRef.current = false;
      prevRectsRef.current = null;

      saveLastChallengerName(validatedName);
      setActiveChallengerName(validatedName);
      setNameError(null);
      setShowTitleLeaderboard(false);
      setLastRunEntryId(null);

      setRoundIndex(0);
      setCards(buildRoundDeck(ROUNDS[0]));
      setFlippedUids([]);
      setIsBoardLocked(false);
      setRoundActiveMs(0);
      setRoundPenaltyMs(0);
      setRoundPenaltyCount(0);
      setTotalPenaltyMs(0);
      setTotalPenaltyCount(0);
      setCompletedRoundTimes([]);
      setRoundFlips(0);
      setTotalFlips(0);
      setComboStreak(0);
      setConsecutiveWrongPairs(0);
      setShuffleCountdownSec(null);
      setIsShufflingPulse(false);
      setIsNewRecord(false);
      setGameState('PLAYING');
      soundEngine.playFlip();
    },
    [clearPendingTimeouts, clearToast]
  );

  const handleTitleStartSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = challengerNameInput.trim();
      if (!trimmed) {
        setNameError('請先輸入挑戰者姓名再開始遊戲');
        nameInputRef.current?.focus();
        return;
      }
      if (!CHALLENGER_NAME_REGEX.test(trimmed)) {
        setNameError('姓名僅限使用中文字、英文字母或數字');
        nameInputRef.current?.focus();
        return;
      }
      setChallengerNameInput(trimmed);
      startGameWithChallenger(trimmed);
    },
    [challengerNameInput, startGameWithChallenger]
  );

  const restartCurrentChallengerGame = useCallback(() => {
    const fallbackName = activeChallengerName || challengerNameInput.trim() || '挑戰者';
    startGameWithChallenger(fallbackName);
  }, [activeChallengerName, challengerNameInput, startGameWithChallenger]);

  const startNextRound = useCallback(() => {
    const nextIdx = roundIndex + 1;
    if (nextIdx >= ROUNDS.length) return;

    clearPendingTimeouts();
    clearToast();
    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
    const nextConfig = ROUNDS[nextIdx];
    roundAccumulatedMsRef.current = 0;
    roundStartPerfRef.current = null;
    roundPenaltyMsRef.current = 0;
    nextShuffleAtMsRef.current = nextConfig.shuffleIntervalMs;
    pendingShuffleRef.current = false;
    roundCompletedRef.current = false;
    prevRectsRef.current = null;

    setRoundIndex(nextIdx);
    setCards(buildRoundDeck(nextConfig));
    setFlippedUids([]);
    setIsBoardLocked(false);
    setRoundActiveMs(0);
    setRoundPenaltyMs(0);
    setRoundPenaltyCount(0);
    setRoundFlips(0);
    setComboStreak(0);
    setConsecutiveWrongPairs(0);
    setShuffleCountdownSec(nextConfig.shuffleIntervalMs ? nextConfig.shuffleIntervalMs / 1000 : null);
    setIsShufflingPulse(false);
    setGameState('PLAYING');
    soundEngine.playFlip();
  }, [clearPendingTimeouts, clearToast, roundIndex]);

  const handlePause = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    clearPendingTimeouts();
    clearHint();
    stopTimerLoop();
    prevRectsRef.current = null;

    // Resolve any in-flight pair immediately so board never gets stuck on resume
    setCards((prev) =>
      prev.map((c) => {
        if (c.isClearing) {
          return { ...c, isClearing: false, isMatched: true, isFlipped: true, isHinted: false };
        }
        if (c.isFlipped && !c.isMatched) {
          return { ...c, isFlipped: false, isMismatch: false, isHinted: false };
        }
        return { ...c, isHinted: false };
      })
    );
    setFlippedUids([]);
    setIsBoardLocked(false);
    setIsShufflingPulse(false);
    setGameState('PAUSED');
  }, [clearHint, clearPendingTimeouts, gameState, stopTimerLoop]);

  const handleResume = useCallback(() => {
    if (gameState !== 'PAUSED') return;
    if (pendingShuffleRef.current) {
      pendingShuffleRef.current = false;
      executeUnmatchedShuffle();
    }
    setGameState('PLAYING');
  }, [executeUnmatchedShuffle, gameState]);

  const handleReturnToTitle = useCallback(() => {
    clearPendingTimeouts();
    clearToast();
    clearHint();
    stopTimerLoop();
    roundAccumulatedMsRef.current = 0;
    roundPenaltyMsRef.current = 0;
    nextShuffleAtMsRef.current = null;
    pendingShuffleRef.current = false;
    prevRectsRef.current = null;
    setRoundActiveMs(0);
    setRoundPenaltyMs(0);
    setFlippedUids([]);
    setIsBoardLocked(false);
    setIsShufflingPulse(false);
    setGameState('TITLE_MENU');
  }, [clearHint, clearPendingTimeouts, clearToast, stopTimerLoop]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard shortcuts (safe when typing in input)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const targetTag = (document.activeElement?.tagName || '').toUpperCase();
      const isTyping = targetTag === 'INPUT' || targetTag === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (gameState === 'TITLE_MENU' && showTitleLeaderboard) {
          e.preventDefault();
          setShowTitleLeaderboard(false);
        } else if (gameState === 'PLAYING') {
          e.preventDefault();
          handlePause();
        } else if (gameState === 'PAUSED') {
          e.preventDefault();
          handleResume();
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (isTyping) return;
        if (gameState === 'TITLE_MENU' && !showTitleLeaderboard) {
          e.preventDefault();
          handleTitleStartSubmit();
        } else if (gameState === 'ROUND_SUMMARY') {
          e.preventDefault();
          startNextRound();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    handlePause,
    handleResume,
    handleTitleStartSubmit,
    showTitleLeaderboard,
    startNextRound,
  ]);

  const handleCardSelect = useCallback(
    (uid: string) => {
      if (gameState !== 'PLAYING' || isBoardLocked) return;
      if (flippedUids.length >= 2) return;

      const target = cards.find((c) => c.uid === uid);
      if (!target || target.isFlipped || target.isMatched || target.isClearing) return;

      soundEngine.playFlip();

      const nextFlipped = [...flippedUids, uid];
      setCards((prev) =>
        prev.map((c) => (c.uid === uid ? { ...c, isFlipped: true, isMismatch: false } : c))
      );
      setFlippedUids(nextFlipped);

      if (nextFlipped.length < 2) {
        return;
      }

      const [firstUid, secondUid] = nextFlipped;
      const firstCard = cards.find((c) => c.uid === firstUid);
      const secondCard = target;

      if (!firstCard) return;

      setIsBoardLocked(true);
      setRoundFlips((f) => f + 1);
      setTotalFlips((f) => f + 1);

      const isMatch = firstCard.design.id === secondCard.design.id;

      if (isMatch) {
        const nextCombo = comboStreak + 1;
        setComboStreak(nextCombo);
        setConsecutiveWrongPairs(0);

        scheduleTimeout(() => {
          soundEngine.playMatch(nextCombo);
          setCards((prev) =>
            prev.map((c) =>
              c.uid === firstUid || c.uid === secondUid ? { ...c, isClearing: true } : c
            )
          );
        }, 180);

        scheduleTimeout(() => {
          const updated = cardsRef.current.map((c) =>
            c.uid === firstUid || c.uid === secondUid
              ? { ...c, isClearing: false, isMatched: true, isHinted: false }
              : c
          );
          setCards(updated);

          const allMatched = updated.every((c) => c.isMatched);
          let roundFinished = false;

          if (allMatched && !roundCompletedRef.current) {
            roundCompletedRef.current = true;
            roundFinished = true;
            pendingShuffleRef.current = false;

            const finalActiveMs =
              roundAccumulatedMsRef.current +
              (roundStartPerfRef.current !== null
                ? performance.now() - roundStartPerfRef.current
                : 0);
            roundStartPerfRef.current = null;
            roundAccumulatedMsRef.current = finalActiveMs;
            setRoundActiveMs(finalActiveMs);

            const finalRoundTotalMs = finalActiveMs + roundPenaltyMsRef.current;
            const updatedRoundTimes = [...completedRoundTimes, finalRoundTotalMs];
            setCompletedRoundTimes(updatedRoundTimes);

            if (roundIndex < ROUNDS.length - 1) {
              soundEngine.playRoundClear();
              setGameState('ROUND_SUMMARY');
            } else {
              const grandTotal = updatedRoundTimes.reduce((acc, t) => acc + t, 0);
              if (bestTimeMs === null || grandTotal < bestTimeMs) {
                setBestTimeMs(grandTotal);
                saveBestTime(grandTotal);
                setIsNewRecord(true);
              }

              // Update Top 5 Leaderboard sorted by shortest total time
              const newEntry: LeaderboardEntry = {
                id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: activeChallengerName || '挑戰者',
                totalMs: grandTotal,
                createdAt: Date.now(),
              };
              const nextBoard = [...leaderboard, newEntry]
                .sort((a, b) => a.totalMs - b.totalMs || a.createdAt - b.createdAt)
                .slice(0, 5);
              saveLeaderboard(nextBoard);
              setLeaderboard(nextBoard);
              setLastRunEntryId(newEntry.id);

              soundEngine.playVictory();
              setGameState('GAME_OVER');
            }
          }

          setFlippedUids([]);
          setIsBoardLocked(false);

          if (!roundFinished && pendingShuffleRef.current) {
            pendingShuffleRef.current = false;
            executeUnmatchedShuffle();
          }
        }, 500);
      } else {
        setComboStreak(0);
        const nextWrongStreak = consecutiveWrongPairs + 1;
        const triggeredPenaltyHint = nextWrongStreak >= WRONG_PAIR_PENALTY_THRESHOLD;

        if (triggeredPenaltyHint) {
          // Trigger 6-card wrong streak warning, +5s penalty & reveal one pair's positions
          setConsecutiveWrongPairs(0);
          roundPenaltyMsRef.current += PENALTY_MS;
          setRoundPenaltyMs((p) => p + PENALTY_MS);
          setRoundPenaltyCount((c) => c + 1);
          setTotalPenaltyMs((p) => p + PENALTY_MS);
          setTotalPenaltyCount((c) => c + 1);

          scheduleTimeout(() => {
            soundEngine.playPenaltyAlert();
            showToast('penalty', '連續翻錯 6 張！總秒數 +5 秒 · 即將提示一組位置');
            setCards((prev) =>
              prev.map((c) =>
                c.uid === firstUid || c.uid === secondUid ? { ...c, isMismatch: true } : c
              )
            );
          }, 210);
        } else {
          setConsecutiveWrongPairs(nextWrongStreak);
          scheduleTimeout(() => {
            soundEngine.playMismatch();
            setCards((prev) =>
              prev.map((c) =>
                c.uid === firstUid || c.uid === secondUid ? { ...c, isMismatch: true } : c
              )
            );
          }, 210);
        }

        // Keep mismatched cards visible briefly for memorization, then flip back
        scheduleTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uid === firstUid || c.uid === secondUid
                ? { ...c, isFlipped: false, isMismatch: false }
                : c
            )
          );
          setFlippedUids([]);
          setIsBoardLocked(false);

          if (pendingShuffleRef.current) {
            pendingShuffleRef.current = false;
            executeUnmatchedShuffle();
          }

          if (triggeredPenaltyHint) {
            activatePairHint();
          }
        }, 780);
      }
    },
    [
      activatePairHint,
      activeChallengerName,
      bestTimeMs,
      cards,
      comboStreak,
      completedRoundTimes,
      consecutiveWrongPairs,
      executeUnmatchedShuffle,
      flippedUids,
      gameState,
      isBoardLocked,
      leaderboard,
      roundIndex,
      scheduleTimeout,
      showToast,
    ]
  );

  // Total pairs across 8 + 18 + 28 cards = 4 + 9 + 14 = 27 pairs
  const totalPairsAllRounds = ROUNDS.reduce((acc, r) => acc + r.pairCount, 0);
  const accuracyPct =
    totalFlips > 0 ? Math.min(100, Math.round((totalPairsAllRounds / totalFlips) * 100)) : 100;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#17473E_0%,_#0F2E28_70%,_#0A211D_100%)] text-[#FBF7EE] flex flex-col select-none">
      {/* ==================== TITLE SCREEN ==================== */}
      {gameState === 'TITLE_MENU' && (
        <main
          key="screen-title"
          className="relative flex-1 flex flex-col items-center justify-between overflow-hidden px-5 py-6 sm:py-10"
        >
          {!keyartError && (
            <img
              src={TITLE_KEYART_URL}
              alt="綠色絨布桌面與動物、消防車、草莓蛋糕記憶卡牌插畫"
              referrerPolicy="no-referrer"
              onError={() => setKeyartError(true)}
              className="absolute inset-0 w-full h-full object-cover object-bottom opacity-90 lg:opacity-65 pointer-events-none"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#0C2621]/95 via-[#0F2E28]/72 to-[#091D19]/92 pointer-events-none"
          />

          {/* Top Bar Controls on Title */}
          <div className="relative z-10 w-full max-w-2xl flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-amber-200/80 tracking-wide truncate">
              動物 · 交通運輸車輛 · 甜點
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {leaderboard.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTitleLeaderboard(true)}
                  className="min-h-[44px] px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-transform whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
                >
                  <Medal className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>排行榜</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? '開啟音效' : '靜音'}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-[#FBF7EE] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Center Title Lockup */}
          <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center my-auto py-3">
            <svg
              viewBox="0 0 88 52"
              fill="none"
              className="w-16 h-10 sm:w-20 sm:h-12 mb-2.5 drop-shadow-md"
              aria-hidden="true"
            >
              <rect
                x="14"
                y="8"
                width="30"
                height="40"
                rx="5"
                transform="rotate(-10 14 8)"
                fill="#FBF7EE"
                stroke="#C69C45"
                strokeWidth="2"
              />
              <rect
                x="42"
                y="4"
                width="30"
                height="40"
                rx="5"
                transform="rotate(9 42 4)"
                fill="#FFFDF9"
                stroke="#C69C45"
                strokeWidth="2"
              />
              <path
                d="M55 17L58 23.5L64.5 26.5L58 29.5L55 36L52 29.5L45.5 26.5L52 23.5L55 17Z"
                fill="#D97706"
              />
            </svg>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#FFFDF7] text-balance drop-shadow-sm">
              記憶翻牌挑戰
            </h1>

            <p className="mt-2.5 text-xs sm:text-base text-emerald-100/90 max-w-md leading-relaxed">
              三輪計時配對挑戰。連續翻錯 6 張（3 組）將標示一組位置並加時 5 秒；第 2 輪每 20 秒、第 3 輪每 30 秒觸發「大風吹」換位！
            </p>

            {/* Clean unboxed round progression summary */}
            <div className="mt-4 flex items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-semibold text-amber-200/95 tabular-nums">
              <span>第 1 輪 8 張</span>
              <span aria-hidden="true" className="text-emerald-200/40">
                /
              </span>
              <span>第 2 輪 18 張</span>
              <span aria-hidden="true" className="text-emerald-200/40">
                /
              </span>
              <span>第 3 輪 28 張</span>
            </div>

            {bestTimeMs !== null && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-100/90">
                <Trophy className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                <span>目前榜首紀錄：</span>
                <span className="font-timer font-bold text-amber-300">
                  {formatTotalSeconds(bestTimeMs)}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Thumb-Zone Challenger Name Form + Primary CTA */}
          <form
            onSubmit={handleTitleStartSubmit}
            className="relative z-10 w-full max-w-sm flex flex-col items-stretch gap-2.5 pb-1"
          >
            <div>
              <label
                htmlFor="challenger-name-input"
                className="block text-xs font-semibold text-emerald-100/90 mb-1.5"
              >
                挑戰者姓名（中文字、英文字母或數字）
              </label>
              <input
                ref={nameInputRef}
                id="challenger-name-input"
                type="text"
                maxLength={12}
                value={challengerNameInput}
                onChange={(e) => {
                  setChallengerNameInput(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="請輸入挑戰者姓名"
                autoComplete="nickname"
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#0B231E]/90 text-[#FFFDF7] placeholder:text-emerald-100/45 text-base font-semibold border transition-colors focus:outline-none focus:ring-2 ${
                  nameError
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-white/20 focus:border-amber-300 focus:ring-amber-300/60'
                }`}
              />
              {nameError && (
                <p role="alert" className="mt-1.5 text-xs font-semibold text-rose-300">
                  {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-[#231912] font-extrabold text-base sm:text-lg shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center justify-center gap-2 transition-transform whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
            >
              <span>開始遊戲</span>
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </button>

            <p className="text-center text-xs text-emerald-100/70 tracking-wide whitespace-nowrap">
              輸入姓名後點擊開始 · 每次最多翻開 2 張牌
            </p>
          </form>

          {/* Title Screen Leaderboard Preview Modal */}
          {showTitleLeaderboard && (
            <div
              key="modal-title-leaderboard"
              role="dialog"
              aria-modal="true"
              aria-labelledby="title-leaderboard-heading"
              className="fixed inset-0 z-50 bg-[#071814]/88 flex items-center justify-center p-4"
            >
              <div className="animate-modal-enter w-full max-w-sm rounded-3xl bg-[#133830] border border-white/15 p-5 shadow-2xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />
                    <h2
                      id="title-leaderboard-heading"
                      className="text-lg font-extrabold text-[#FFFDF7]"
                    >
                      遊戲排行榜（前五名）
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTitleLeaderboard(false)}
                    aria-label="關閉排行榜"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-100/80 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-3 divide-y divide-white/10">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm tabular-nums"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 text-left font-bold shrink-0 ${
                            idx === 0 ? 'text-amber-300' : 'text-emerald-100/75'
                          }`}
                        >
                          第{idx + 1}名
                        </span>
                        <span className="font-semibold text-[#FFFDF7] truncate">{entry.name}</span>
                      </div>
                      <span className="font-timer font-bold text-amber-300 shrink-0">
                        {formatTotalSeconds(entry.totalMs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ==================== ACTIVE PLAY / PAUSE / SUMMARY ==================== */}
      {gameState !== 'TITLE_MENU' && (
        <div key="screen-play" className="flex-1 min-h-0 flex flex-col">
          {/* Compact Top HUD (< 15% mobile height) */}
          <header className="relative z-20 shrink-0 w-full bg-[#0B231E]/85 border-b border-white/10">
            <div className="max-w-4xl mx-auto h-14 px-3 sm:px-6 flex items-center justify-between gap-2">
              {/* Left: Round, Remaining, Wrong Streak & Shuffle Countdown (Unboxed metadata) */}
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base font-bold text-[#FFFDF7] whitespace-nowrap">
                    {`第 ${currentRoundConfig.round}/3 輪`}
                  </span>
                  <span aria-hidden="true" className="text-emerald-200/35">
                    ·
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-emerald-100/85 whitespace-nowrap tabular-nums">
                    {`剩 ${remainingPairs} 組`}
                  </span>
                </div>

                {/* Live status subline for Big Wind Blows countdown and wrong-streak warning */}
                <div className="flex items-center gap-2 text-[11px] leading-tight mt-0.5 whitespace-nowrap tabular-nums">
                  {shuffleCountdownSec !== null && (
                    <span
                      key="hud-wind-countdown"
                      className={`inline-flex items-center gap-1 font-medium ${
                        shuffleCountdownSec <= 2 ? 'text-amber-300 font-bold' : 'text-amber-200/85'
                      }`}
                    >
                      <Wind className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>{`大風吹 ${String(shuffleCountdownSec).padStart(2, '0')}s`}</span>
                    </span>
                  )}
                  {shuffleCountdownSec !== null && consecutiveWrongPairs > 0 && (
                    <span key="hud-dot" aria-hidden="true" className="text-emerald-200/30">
                      ·
                    </span>
                  )}
                  {consecutiveWrongPairs > 0 && (
                    <span
                      key="hud-wrong-streak"
                      className={`font-semibold ${
                        consecutiveWrongPairs >= 2 ? 'text-rose-300' : 'text-emerald-100/75'
                      }`}
                    >
                      {`連錯 ${consecutiveWrongPairs}/${WRONG_PAIR_PENALTY_THRESHOLD} 組`}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Precision Timer + Audio + Pause */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="px-1.5 sm:px-3 py-1 text-right">
                  <div className="font-timer text-base sm:text-lg font-bold text-amber-300 leading-none">
                    {formatDuration(totalElapsedMs)}
                  </div>
                  <div className="font-timer text-[10px] text-emerald-100/65 leading-tight mt-0.5">
                    {`本輪 ${formatDuration(currentRoundDisplayMs)}${
                      roundPenaltyCount > 0 ? ` (+${roundPenaltyCount * 5}s)` : ''
                    }`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? '開啟音效' : '靜音'}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-100 hover:bg-white/10 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handlePause}
                  aria-label="暫停遊戲"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-100 hover:bg-white/10 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
                >
                  <Pause className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Thin 3-Round Progress Strip */}
            <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-1.5 flex items-center gap-1.5">
              {ROUNDS.map((r, idx) => {
                const isDone = idx < roundIndex || (idx === roundIndex && remainingPairs === 0);
                const isCurrent = idx === roundIndex && remainingPairs > 0;
                const pct = isDone
                  ? 100
                  : isCurrent
                    ? Math.round((matchedPairs / r.pairCount) * 100)
                    : 0;
                return (
                  <div
                    key={r.round}
                    className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full transition-transform duration-200 origin-left ${
                        isDone ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                  </div>
                );
              })}
            </div>
          </header>

          {/* Main Card Playfield (Zero-Scroll Single Viewport Fit) */}
          <main className="relative flex-1 min-h-0 w-full max-w-5xl mx-auto px-2.5 py-2 sm:px-6 sm:py-5 flex items-center justify-center">
            {/* Non-blocking Floating Alert / Big Wind Blows Banner */}
            {toastNotice && (
              <div
                key={toastNotice.id}
                role="status"
                aria-live="polite"
                className={`animate-toast-in pointer-events-none fixed top-16 left-1/2 z-30 px-3.5 py-2 rounded-xl shadow-xl border flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap ${
                  toastNotice.kind === 'penalty'
                    ? 'bg-rose-950/95 border-rose-400/50 text-rose-100'
                    : 'bg-[#123830]/95 border-amber-300/60 text-amber-100'
                }`}
              >
                {toastNotice.kind === 'penalty' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" aria-hidden="true" />
                ) : (
                  <Wind className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                )}
                <span>{toastNotice.message}</span>
              </div>
            )}

            {/* Big Wind Blows Gust Streamlines Overlay */}
            {isShufflingPulse && (
              <div
                key="wind-overlay"
                aria-hidden="true"
                className="animate-wind-sweep pointer-events-none fixed inset-0 z-20 flex items-center justify-center overflow-hidden"
              >
                <svg
                  viewBox="0 0 800 420"
                  fill="none"
                  className="w-full h-full max-w-4xl opacity-80"
                >
                  <path
                    d="M40 110 C 200 75, 360 135, 560 95 C 635 80, 695 95, 715 118 C 730 135, 710 158, 680 150 C 655 144, 658 118, 682 118"
                    stroke="#FDE68A"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeOpacity="0.6"
                  />
                  <path
                    d="M90 215 C 270 185, 450 245, 650 205 C 715 192, 760 210, 770 232"
                    stroke="#A7F3D0"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeOpacity="0.55"
                  />
                  <path
                    d="M60 315 C 230 285, 380 340, 580 300 C 645 287, 685 305, 695 326 C 704 345, 682 362, 658 352"
                    stroke="#FDE68A"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeOpacity="0.5"
                  />
                </svg>
              </div>
            )}

            {/* Round 1: 8 Cards (Mobile 2x4, Desktop 4x2) */}
            {currentRoundConfig.cardCount === 8 && (
              <div
                key="grid-r1"
                ref={gridContainerRef}
                className="grid grid-cols-2 grid-rows-4 sm:grid-cols-4 sm:grid-rows-2 gap-2.5 sm:gap-4 w-full max-w-[330px] sm:max-w-[620px] h-full max-h-[520px] sm:max-h-[400px]"
              >
                {cards.map((card) => (
                  <div
                    key={card.uid}
                    data-card-uid={card.uid}
                    className="w-full h-full min-h-0 min-w-0"
                  >
                    <MemoryCard
                      card={card}
                      size="normal"
                      shufflePulse={isShufflingPulse && !card.isMatched}
                      onSelect={handleCardSelect}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Round 2: 18 Cards (Mobile 3x6, Desktop 6x3) */}
            {currentRoundConfig.cardCount === 18 && (
              <div
                key="grid-r2"
                ref={gridContainerRef}
                className="grid grid-cols-3 grid-rows-6 sm:grid-cols-6 sm:grid-rows-3 gap-1.5 sm:gap-3 w-full max-w-[390px] sm:max-w-[760px] h-full max-h-[590px] sm:max-h-[500px]"
              >
                {cards.map((card) => (
                  <div
                    key={card.uid}
                    data-card-uid={card.uid}
                    className="w-full h-full min-h-0 min-w-0"
                  >
                    <MemoryCard
                      card={card}
                      size="compact"
                      shufflePulse={isShufflingPulse && !card.isMatched}
                      onSelect={handleCardSelect}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Round 3: 28 Cards (Mobile 4x7, Desktop 7x4) */}
            {currentRoundConfig.cardCount === 28 && (
              <div
                key="grid-r3"
                ref={gridContainerRef}
                className="grid grid-cols-4 grid-rows-7 sm:grid-cols-7 sm:grid-rows-4 gap-1.5 sm:gap-2.5 w-full max-w-[410px] sm:max-w-[840px] h-full max-h-[610px] sm:max-h-[540px]"
              >
                {cards.map((card) => (
                  <div
                    key={card.uid}
                    data-card-uid={card.uid}
                    className="w-full h-full min-h-0 min-w-0"
                  >
                    <MemoryCard
                      card={card}
                      size="dense"
                      shufflePulse={isShufflingPulse && !card.isMatched}
                      onSelect={handleCardSelect}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ==================== PAUSE MODAL ==================== */}
      {gameState === 'PAUSED' && (
        <div
          key="modal-pause"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="fixed inset-0 z-40 bg-[#071814]/92 flex items-center justify-center p-4"
        >
          <div className="animate-modal-enter w-full max-w-sm rounded-3xl bg-[#133830] border border-white/15 p-6 shadow-2xl text-center">
            <h2 id="pause-title" className="text-2xl font-extrabold text-[#FFFDF7]">
              遊戲暫停
            </h2>
            <p className="mt-1.5 text-sm text-emerald-100/80 tabular-nums">
              <span>{`${activeChallengerName} · ${currentRoundConfig.title}（${currentRoundConfig.cardCount} 張） · 累計 `}</span>
              <span className="font-timer text-amber-300">{formatDuration(totalElapsedMs)}</span>
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleResume}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-[#231912] font-bold text-base flex items-center justify-center gap-2 transition-transform whitespace-nowrap cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
                <span>繼續遊戲</span>
              </button>

              <button
                type="button"
                onClick={restartCurrentChallengerGame}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-[#FFFDF7] font-semibold text-base flex items-center justify-center gap-2 transition-transform whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>重新開始</span>
              </button>

              <button
                type="button"
                onClick={handleReturnToTitle}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl text-emerald-100/80 hover:text-white hover:bg-white/5 font-medium text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>回到主畫面</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ROUND SUMMARY MODAL ==================== */}
      {gameState === 'ROUND_SUMMARY' && (
        <div
          key="modal-round-summary"
          role="dialog"
          aria-modal="true"
          aria-labelledby="round-clear-title"
          className="fixed inset-0 z-40 bg-[#071814]/85 flex items-center justify-center p-4"
        >
          <div className="animate-modal-enter w-full max-w-sm rounded-3xl bg-[#133830] border border-white/15 p-6 shadow-2xl text-center">
            <span className="text-xs font-bold tracking-wider text-emerald-300">
              {`${activeChallengerName} · 第 ${currentRoundConfig.round} / 3 輪完成`}
            </span>
            <h2 id="round-clear-title" className="mt-1 text-2xl font-extrabold text-[#FFFDF7]">
              全數配對消除！
            </h2>

            <div className="mt-5 py-4 border-y border-white/10 grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-emerald-100/70">本輪用時</div>
                <div className="mt-1 font-timer text-lg font-bold text-amber-300">
                  {formatDuration(currentRoundDisplayMs)}
                </div>
              </div>
              <div>
                <div className="text-xs text-emerald-100/70">翻牌次數</div>
                <div className="mt-1 font-timer text-lg font-bold text-[#FFFDF7]">
                  {roundFlips}
                </div>
              </div>
              <div>
                <div className="text-xs text-emerald-100/70">累計時間</div>
                <div className="mt-1 font-timer text-lg font-bold text-[#FFFDF7]">
                  {formatDuration(totalElapsedMs)}
                </div>
              </div>
            </div>

            {roundPenaltyCount > 0 && (
              <p className="mt-3 text-xs text-rose-200/90 tabular-nums">
                {`本輪含連錯提醒加時：+${roundPenaltyCount * 5} 秒（${roundPenaltyCount} 次）`}
              </p>
            )}

            {roundIndex + 1 < ROUNDS.length && (
              <p className="mt-3 text-sm text-emerald-100/90">
                {`下一輪：${ROUNDS[roundIndex + 1].title}（${ROUNDS[roundIndex + 1].cardCount} 張${
                  ROUNDS[roundIndex + 1].shuffleIntervalMs
                    ? ` · 每 ${ROUNDS[roundIndex + 1].shuffleIntervalMs! / 1000} 秒大風吹`
                    : ''
                }）`}
              </p>
            )}

            <button
              type="button"
              onClick={startNextRound}
              className="mt-5 w-full min-h-[50px] px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-[#231912] font-extrabold text-base flex items-center justify-center gap-2 transition-transform whitespace-nowrap cursor-pointer"
            >
              <span>{`進入第 ${roundIndex + 2} 輪`}</span>
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== GAME OVER / VICTORY + TOP 5 LEADERBOARD ==================== */}
      {gameState === 'GAME_OVER' && (
        <div
          key="modal-game-over"
          role="dialog"
          aria-modal="true"
          aria-labelledby="victory-title"
          className="fixed inset-0 z-40 bg-[#071814]/88 flex items-center justify-center p-3 sm:p-4"
        >
          <div className="animate-modal-enter w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#133830] border border-white/15 p-5 sm:p-6 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center text-amber-300 shrink-0">
                <Trophy className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="text-left">
                <h2 id="victory-title" className="text-xl sm:text-2xl font-extrabold text-[#FFFDF7]">
                  三輪挑戰完成！
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/80">
                  <span>挑戰者 </span>
                  <span className="font-bold text-amber-200">{activeChallengerName}</span>
                  {isNewRecord && <span> · 創下榜首新紀錄！</span>}
                </p>
              </div>
            </div>

            {/* Total Time Hero Metric */}
            <div className="mt-4 py-3 border-y border-white/10">
              <div className="text-xs text-emerald-100/70">三輪總計時間</div>
              <div className="mt-0.5 font-timer text-3xl font-bold text-amber-300">
                {formatTotalSeconds(totalElapsedMs)}
              </div>
              <div className="mt-1 text-xs text-emerald-100/75 tabular-nums">
                {`總翻牌 ${totalFlips} 次 · 準確率 ${accuracyPct}%${
                  totalPenaltyCount > 0
                    ? ` · 懲罰 +${Math.round(totalPenaltyMs / 1000)} 秒（${totalPenaltyCount} 次）`
                    : ''
                }`}
              </div>
            </div>

            {/* Compact Per-round Breakdown */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs tabular-nums">
              {ROUNDS.map((r, idx) => (
                <div key={r.round} className="rounded-xl bg-black/15 py-2 px-1.5">
                  <div className="text-emerald-100/65">{r.title}</div>
                  <div className="font-timer font-bold text-[#FFFDF7] mt-0.5">
                    {formatTotalSeconds(completedRoundTimes[idx] ?? 0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Top 5 Leaderboard */}
            <div className="mt-4 pt-3.5 border-t border-white/10 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#FFFDF7]">
                  <Medal className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                  <span>遊戲排名榜（前五名）</span>
                </div>
                <span className="text-[11px] text-emerald-100/65">秒數越短名次越高</span>
              </div>

              <div className="divide-y divide-white/10 rounded-xl bg-black/15 px-3">
                {leaderboard.map((entry, idx) => {
                  const isCurrentRun = entry.id === lastRunEntryId;
                  return (
                    <div
                      key={entry.id}
                      className={`py-2 flex items-center justify-between gap-2 text-xs sm:text-sm tabular-nums ${
                        isCurrentRun ? 'text-amber-200 font-bold' : 'text-emerald-100/90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-11 shrink-0 font-bold ${
                            idx === 0
                              ? 'text-amber-300'
                              : idx <= 2
                                ? 'text-emerald-200'
                                : 'text-emerald-100/65'
                          }`}
                        >
                          第 {idx + 1} 名
                        </span>
                        <span className="truncate">{entry.name}</span>
                        {isCurrentRun && (
                          <span className="text-[10px] font-bold text-amber-300 shrink-0">
                            （本次）
                          </span>
                        )}
                      </div>
                      <span className="font-timer font-bold text-amber-300 shrink-0">
                        {formatTotalSeconds(entry.totalMs)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={restartCurrentChallengerGame}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-[#231912] font-extrabold text-base flex items-center justify-center gap-2 transition-transform whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>再玩一次</span>
              </button>

              <button
                type="button"
                onClick={handleReturnToTitle}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl text-emerald-100/80 hover:text-white hover:bg-white/5 font-medium text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>更換挑戰者 / 回主畫面</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
