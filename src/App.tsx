import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import BackgroundFX from "./components/BackgroundFX";
import CollectionScreen from "./components/CollectionScreen";
import GameScreen from "./components/GameScreen";
import Header, { BottomNav } from "./components/Header";
import {
  AdOverlay,
  EnergyModal,
  HintOfferModal,
  PurchaseModal,
  SettingsModal,
  Toast,
  WinModal,
  type PurchaseCopy,
} from "./components/Overlays";
import ShopScreen from "./components/ShopScreen";
import {
  COIN_PACKS,
  DAILY_TASKS,
  ECON,
  PRODUCT_NO_ADS,
  adLeft,
  dailyBonus,
  energyCap,
  hintPrice,
  msToNextEnergy,
  regenEnergy,
  winReward,
  type AdKind,
} from "./data/economy";
import { LEVELS, isLevelOpen, type Level } from "./data/levels";
import { calcStars, todayKey } from "./game/logic";
import { STRINGS, f } from "./lib/i18n";
import { usePrefs } from "./lib/prefs";
import {
  installAudioUnlockListeners,
  playSound,
  setBackgroundMusic,
  unlockAudio,
} from "./lib/sound";
import { resetPersistentState, usePersistentState } from "./lib/storage";
import { useNow } from "./lib/useNow";
import {
  gameplayStart,
  gameplayStop,
  isYandexPlatform,
  purchaseYandexProduct,
  restoreYandexPurchases,
  showFullscreenAdv,
  showRewardedVideo,
} from "./lib/yandex";
import type {
  BoardSnapshot,
  DailyState,
  SaveState,
  Screen,
  WinResult,
} from "./types";

const SAVE_KEY = "world-mosaic-save-v1";

function freshDaily(): DailyState {
  return {
    date: todayKey(),
    solved: 0,
    moves: 0,
    hints: 0,
    claimed: [],
    ads: { coins: 0, energy: 0, hint: 0 },
  };
}

function makeInitialSave(): SaveState {
  return {
    coins: ECON.startCoins,
    hints: ECON.startHints,
    energy: ECON.startEnergy,
    energyAt: Date.now(),
    adFree: false,
    currentLevel: 1,
    unlocked: [1],
    completed: {},
    boards: {},
    totalSolved: 0,
    streak: 1,
    lastPlayed: "",
    lastBonus: "",
    winsSinceAd: 0,
    lastAdAt: 0,
    numbers: true,
    sound: true,
    daily: freshDaily(),
  };
}

type ActiveAd = {
  kind: "rewarded" | "interstitial";
  onDone: (ok: boolean) => void;
};
type Offer = "hint" | null;
type PendingPurchase =
  | { action: "coins"; pack: (typeof COIN_PACKS)[number] }
  | { action: "noads" };
type ToastTone = "dark" | "success" | "error";

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

export function App() {
  const { theme, setTheme, lang, setLang } = usePrefs();
  const t = STRINGS[lang];
  const [progress, setProgress] = usePersistentState<SaveState>(
    SAVE_KEY,
    makeInitialSave()
  );
  const [screen, setScreen] = useState<Screen>("play");
  const [win, setWin] = useState<WinResult | null>(null);
  const [hintSignal, setHintSignal] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [energyOpen, setEnergyOpen] = useState(false);
  const [activeAd, setActiveAd] = useState<ActiveAd | null>(null);
  const [offer, setOffer] = useState<Offer>(null);
  const [doubling, setDoubling] = useState(false);
  const [isYandex, setIsYandex] = useState(false);
  const [platformChecked, setPlatformChecked] = useState(false);
  const [purchase, setPurchase] = useState<PendingPurchase | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<
    "idle" | "processing" | "success"
  >("idle");
  const [toast, setToast] = useState<{
    message: string;
    tone: ToastTone;
    id: number;
  } | null>(null);

  const toastTimer = useRef<number | null>(null);
  const winTimer = useRef<number | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const langRef = useRef(t);
  langRef.current = t;

  const clearPendingWinTimer = () => {
    if (winTimer.current) {
      window.clearTimeout(winTimer.current);
      winTimer.current = null;
    }
  };

  const premium = Boolean(progress.adFree);
  const cap = energyCap(premium);
  const energyNow = regenEnergy(progress, premium, Date.now());
  const now = useNow(energyNow.energy < cap);
  const energyState = regenEnergy(progress, premium, now);
  const energy = energyState.energy;
  const nextEnergyMs = msToNextEnergy(progress, premium, now);
  const refillPrice = (cap - energy) * ECON.energyPerMissing;

  const safeCompleted =
    progress.completed && typeof progress.completed === "object"
      ? progress.completed
      : {};
  const safeUnlocked = Array.isArray(progress.unlocked)
    ? progress.unlocked
    : [1];
  const safeDaily: DailyState = {
    date: progress.daily?.date ?? todayKey(),
    solved: Number(progress.daily?.solved) || 0,
    moves: Number(progress.daily?.moves) || 0,
    hints: Number(progress.daily?.hints) || 0,
    claimed: Array.isArray(progress.daily?.claimed)
      ? progress.daily.claimed
      : [],
    ads: {
      coins: Number(progress.daily?.ads?.coins) || 0,
      energy: Number(progress.daily?.ads?.energy) || 0,
      hint: Number(progress.daily?.ads?.hint) || 0,
    },
  };

  const level: Level =
    LEVELS.find((item) => item.id === progress.currentLevel) ?? LEVELS[0];
  const totalStars = Object.values(safeCompleted).reduce(
    (sum, item) => sum + (item?.stars ?? 0),
    0
  );
  const openedLevelsCount = LEVELS.filter((item) =>
    isLevelOpen(item, safeCompleted, safeUnlocked, totalStars)
  ).length;

  const showToast = (message: string, tone: ToastTone = "dark") => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, tone, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const sound = () => progressRef.current.sound;

  /* ───── Старт и разблокировка iOS аудио ───── */

  useEffect(() => {
    installAudioUnlockListeners();
    void isYandexPlatform().then((available) => {
      setIsYandex(available);
      setPlatformChecked(true);
      if (!available) return;
      void restoreYandexPurchases().then((purchases) => {
        if (purchases.includes(PRODUCT_NO_ADS.id)) {
          setProgress((current) =>
            current.adFree ? current : { ...current, adFree: true }
          );
        }
      });
    });
    gameplayStart();
  }, [setProgress]);

  useEffect(() => {
    const current = progressRef.current;
    const today = todayKey();
    if (!current.daily || current.daily.date !== today) {
      setProgress((c) =>
        c.daily?.date === today ? c : { ...c, daily: freshDaily() }
      );
    }
    if (current.lastBonus !== today) {
      const amount = dailyBonus(current.streak);
      setProgress((c) =>
        c.lastBonus === today
          ? c
          : { ...c, coins: c.coins + amount, lastBonus: today }
      );
      showToast(f(langRef.current.toastDaily, { n: amount }), "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBackgroundMusic(Boolean(progress.sound) && !activeAd);
  }, [progress.sound, activeAd]);

  useEffect(() => {
    document.title = t.docTitle;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen, lang, t.docTitle]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (winTimer.current) window.clearTimeout(winTimer.current);
    };
  }, []);

  /* ───── Навигация и звук ───── */

  function toggleSound() {
    unlockAudio();
    setProgress((current) => {
      const nextSound = !current.sound;
      if (nextSound) {
        playSound("click", true);
      }
      return { ...current, sound: nextSound };
    });
  }

  function navigate(target: Screen) {
    clearPendingWinTimer();
    playSound("click", sound());
    setScreen(target);
  }

  function playLevel(levelId: number) {
    const target = LEVELS.find((item) => item.id === levelId);
    if (!target) return;
    if (!isLevelOpen(target, safeCompleted, safeUnlocked, totalStars)) {
      showToast(
        f(t.toastNeedStars, {
          a: target.unlockStars,
          b: ECON.unlockLevelPrice,
        }),
        "error"
      );
      return;
    }
    clearPendingWinTimer();
    setProgress((current) => ({ ...current, currentLevel: levelId }));
    setWin(null);
    setGameKey((value) => value + 1);
    setScreen("play");
    playSound("click", sound());
  }

  function unlockLevel(target: Level) {
    if (progress.coins < ECON.unlockLevelPrice) {
      showToast(
        f(t.toastNeedCoins, { n: ECON.unlockLevelPrice - progress.coins }),
        "error"
      );
      setScreen("shop");
      return;
    }
    setProgress((current) => ({
      ...current,
      coins: current.coins - ECON.unlockLevelPrice,
      unlocked: (current.unlocked ?? []).includes(target.id)
        ? current.unlocked
        : [...(current.unlocked ?? []), target.id],
    }));
    playSound("coin", sound());
    showToast(f(t.toastIslandOpen, { n: target.id }), "success");
  }

  /* ───── Реклама ───── */

  async function runAd(kind: "rewarded" | "interstitial"): Promise<boolean> {
    gameplayStop();
    if (platformChecked && isYandex) {
      const sdkResult =
        kind === "rewarded"
          ? await showRewardedVideo()
          : await showFullscreenAdv();
      if (sdkResult !== "unavailable") {
        gameplayStart();
        return Boolean(sdkResult);
      }
    }
    return new Promise((resolve) => {
      setActiveAd({
        kind,
        onDone: (ok) => {
          setActiveAd(null);
          gameplayStart();
          resolve(ok);
        },
      });
    });
  }

  async function rewardedWithLimit(kind: AdKind): Promise<boolean> {
    if (adLeft(progressRef.current.daily ?? freshDaily(), kind) <= 0) {
      showToast(t.toastAdLimit, "error");
      return false;
    }
    const ok = await runAd("rewarded");
    if (!ok) {
      showToast(t.toastAdFail, "error");
      return false;
    }
    setProgress((current) => ({
      ...current,
      daily: {
        ...(current.daily ?? freshDaily()),
        ads: {
          ...(current.daily?.ads ?? { coins: 0, energy: 0, hint: 0 }),
          [kind]: (current.daily?.ads?.[kind] ?? 0) + 1,
        },
      },
    }));
    return true;
  }

  async function watchForCoins() {
    if (!(await rewardedWithLimit("coins"))) return;
    setProgress((current) => ({
      ...current,
      coins: current.coins + ECON.adCoins,
    }));
    playSound("coin", sound());
    showToast(f(t.toastCoinsAdded, { n: ECON.adCoins }), "success");
  }

  async function watchForEnergy() {
    if (energy >= cap) {
      showToast(t.toastEnergyFull);
      return;
    }
    if (!(await rewardedWithLimit("energy"))) return;
    addEnergy(ECON.adEnergy);
    playSound("coin", sound());
    showToast(f(t.toastEnergyAdded, { n: ECON.adEnergy }), "success");
  }

  async function watchForHint() {
    setOffer(null);
    if (!(await rewardedWithLimit("hint"))) return;
    activateHint();
  }

  /* ───── Энергия ───── */

  function addEnergy(amount: number) {
    setProgress((current) => {
      const stamp = Date.now();
      const r = regenEnergy(current, current.adFree, stamp);
      const max = energyCap(current.adFree);
      const next = Math.min(max, r.energy + amount);
      return {
        ...current,
        energy: next,
        energyAt: next >= max ? stamp : r.energyAt,
      };
    });
  }

  function spendEnergy(): boolean {
    const stamp = Date.now();
    const current = progressRef.current;
    const r = regenEnergy(current, current.adFree, stamp);
    if (r.energy < 1) return false;
    setProgress((c) => {
      const s = Date.now();
      const rr = regenEnergy(c, c.adFree, s);
      if (rr.energy < 1) return c;
      const max = energyCap(c.adFree);
      return {
        ...c,
        energy: rr.energy - 1,
        energyAt: rr.energy >= max ? s : rr.energyAt,
      };
    });
    return true;
  }

  function refillEnergy() {
    if (energy >= cap) {
      showToast(t.toastEnergyFull);
      return;
    }
    if (progress.coins < refillPrice) {
      showToast(
        f(t.toastNeedCoins, { n: refillPrice - progress.coins }),
        "error"
      );
      setEnergyOpen(false);
      setScreen("shop");
      return;
    }
    setProgress((current) => ({
      ...current,
      coins: current.coins - refillPrice,
      energy: cap,
      energyAt: Date.now(),
    }));
    playSound("coin", sound());
    showToast(f(t.toastEnergyAdded, { n: cap - energy }), "success");
    setEnergyOpen(false);
  }

  function payCoins(amount: number): boolean {
    if (progressRef.current.coins < amount) {
      showToast(
        f(t.toastNeedCoins, { n: amount - progressRef.current.coins }),
        "error"
      );
      return false;
    }
    setProgress((current) => ({ ...current, coins: current.coins - amount }));
    return true;
  }

  /* ───── Игровой процесс ───── */

  function handleSolved(result: {
    levelId: number;
    moves: number;
    seconds: number;
  }) {
    const target = LEVELS.find((item) => item.id === result.levelId);
    if (!target) return;
    const snapshotProgress = progressRef.current;
    const stars = calcStars(result.moves, target.par);
    const previous = snapshotProgress.completed?.[result.levelId];
    const firstTime = !previous;
    const reward = winReward(stars, firstTime, Boolean(snapshotProgress.adFree));

    setProgress((current) => {
      const prev = current.completed?.[result.levelId];
      const nextCompleted = {
        ...(current.completed ?? {}),
        [result.levelId]: {
          stars: Math.max(prev?.stars ?? 0, stars),
          moves: prev ? Math.min(prev.moves, result.moves) : result.moves,
          seconds: prev
            ? Math.min(prev.seconds, result.seconds)
            : result.seconds,
          date: todayKey(),
        },
      };
      const keptStreak =
        current.lastPlayed === todayKey()
          ? current.streak
          : current.lastPlayed ===
              new Date(Date.now() - 86400000).toISOString().slice(0, 10)
            ? current.streak + 1
            : 1;
      const nextId = LEVELS.some((item) => item.id === target.id + 1)
        ? target.id + 1
        : null;
      const curUnlocked = Array.isArray(current.unlocked)
        ? current.unlocked
        : [1];
      const curDaily = current.daily ?? freshDaily();
      return {
        ...current,
        coins: current.coins + reward,
        completed: nextCompleted,
        totalSolved: Object.keys(nextCompleted).length,
        currentLevel: target.id,
        unlocked:
          nextId && !curUnlocked.includes(nextId)
            ? [...curUnlocked, nextId]
            : curUnlocked,
        lastPlayed: todayKey(),
        streak: keptStreak,
        winsSinceAd: (current.winsSinceAd ?? 0) + 1,
        daily: { ...curDaily, solved: (curDaily.solved ?? 0) + 1 },
      };
    });

    gameplayStop();
    clearPendingWinTimer();
    winTimer.current = window.setTimeout(() => {
      winTimer.current = null;
      setWin({
        levelId: target.id,
        moves: result.moves,
        seconds: result.seconds,
        stars,
        coins: reward,
        firstTime,
        doubled: false,
      });
      playSound("coin", sound());
    }, 1200);
  }

  async function doubleReward() {
    if (!win || win.doubled || doubling) return;
    setDoubling(true);
    const ok = await runAd("rewarded");
    setDoubling(false);
    if (!ok) {
      showToast(t.toastAdFail, "error");
      return;
    }
    setProgress((current) => ({
      ...current,
      coins: current.coins + win.coins,
    }));
    setWin((current) => (current ? { ...current, doubled: true } : current));
    playSound("coin", sound());
    showToast(f(t.toastHintVideo, { n: win.coins }), "success");
  }

  async function handleNextLevel() {
    if (!win) return;
    clearPendingWinTimer();
    const next = LEVELS.find((item) => item.id === win.levelId + 1) ?? null;
    const cur = progressRef.current;
    const shouldShowAd =
      !cur.adFree &&
      cur.winsSinceAd >= ECON.interstitialEveryWins &&
      Date.now() - cur.lastAdAt >= ECON.interstitialMinGapMs;
    setWin(null);
    setGameKey((value) => value + 1);
    if (shouldShowAd) {
      await runAd("interstitial");
      setProgress((current) => ({
        ...current,
        winsSinceAd: 0,
        lastAdAt: Date.now(),
      }));
    }
    if (!next) {
      setScreen("collection");
      showToast(t.toastDone, "success");
      return;
    }
    setProgress((current) => ({
      ...current,
      currentLevel: next.id,
      unlocked: (current.unlocked ?? []).includes(next.id)
        ? current.unlocked
        : [...(current.unlocked ?? []), next.id],
    }));
    setScreen("play");
  }

  function replayLevel() {
    clearPendingWinTimer();
    setWin(null);
    setGameKey((value) => value + 1);
  }

  function saveBoard(levelId: number, snapshot: BoardSnapshot | null) {
    setProgress((current) => {
      const existing = current.boards?.[levelId];
      if (!snapshot && !existing) return current;
      if (
        snapshot &&
        existing &&
        existing.moves === snapshot.moves &&
        existing.seconds === snapshot.seconds &&
        existing.started === snapshot.started &&
        existing.previews === snapshot.previews &&
        existing.hint?.done === snapshot.hint?.done &&
        existing.hint?.phase === snapshot.hint?.phase &&
        existing.tiles.join(",") === snapshot.tiles.join(",")
      ) {
        return current;
      }
      const boards = { ...(current.boards ?? {}) };
      if (snapshot) boards[levelId] = snapshot;
      else delete boards[levelId];
      return { ...current, boards };
    });
  }

  function handleMove() {
    setProgress((current) => {
      const curDaily = current.daily ?? freshDaily();
      return {
        ...current,
        daily: { ...curDaily, moves: (curDaily.moves ?? 0) + 1 },
      };
    });
  }

  function activateHint() {
    setProgress((current) => {
      const curDaily = current.daily ?? freshDaily();
      return {
        ...current,
        daily: { ...curDaily, hints: (curDaily.hints ?? 0) + 1 },
      };
    });
    setHintSignal((value) => value + 1);
    showToast(t.toastHintCalc, "success");
    playSound("coin", sound());
  }

  function requestHint() {
    const price = hintPrice(level.id);
    if (progress.hints > 0) {
      setProgress((current) => ({
        ...current,
        hints: Math.max(0, current.hints - 1),
      }));
      activateHint();
      return;
    }
    if (progress.coins >= price) {
      setProgress((current) => ({ ...current, coins: current.coins - price }));
      activateHint();
      return;
    }
    setOffer("hint");
  }

  function claimTask(taskId: string) {
    const task = DAILY_TASKS.find((item) => item.id === taskId);
    if (!task || safeDaily.claimed.includes(task.id)) return;
    const value =
      task.id === "solve"
        ? safeDaily.solved
        : task.id === "moves"
          ? safeDaily.moves
          : safeDaily.hints;
    if (value < task.goal) return;
    setProgress((current) => {
      const curDaily = current.daily ?? freshDaily();
      const curClaimed = Array.isArray(curDaily.claimed)
        ? curDaily.claimed
        : [];
      if (curClaimed.includes(task.id)) return current;
      return {
        ...current,
        coins: current.coins + task.reward,
        daily: {
          ...curDaily,
          claimed: [...curClaimed, task.id],
        },
      };
    });
    playSound("coin", sound());
    showToast(f(t.toastTaskReward, { n: task.reward }), "success");
  }

  /* ───── Магазин ───── */

  function buyHints() {
    if (progress.coins < ECON.hintsPackPrice) {
      showToast(
        f(t.toastNeedCoins, { n: ECON.hintsPackPrice - progress.coins }),
        "error"
      );
      return;
    }
    setProgress((current) => ({
      ...current,
      coins: current.coins - ECON.hintsPackPrice,
      hints: current.hints + ECON.hintsPackSize,
    }));
    playSound("coin", sound());
    showToast(f(t.toastHintsAdded, { n: ECON.hintsPackSize }), "success");
  }

  function unlockAllLevels() {
    if (openedLevelsCount >= LEVELS.length) {
      showToast(t.toastAllOpen);
      return;
    }
    if (progress.coins < ECON.unlockAlbumPrice) {
      showToast(
        f(t.toastNeedCoins, { n: ECON.unlockAlbumPrice - progress.coins }),
        "error"
      );
      return;
    }
    setProgress((current) => ({
      ...current,
      coins: current.coins - ECON.unlockAlbumPrice,
      unlocked: LEVELS.map((item) => item.id),
    }));
    playSound("coin", sound());
    showToast(t.toastAlbumOpen, "success");
  }

  function openCoinPack(pack: (typeof COIN_PACKS)[number]) {
    setPurchaseStatus("idle");
    setPurchase({ action: "coins", pack });
  }

  function openNoAds() {
    setPurchaseStatus("idle");
    setPurchase({ action: "noads" });
  }

  async function confirmPurchase() {
    if (!purchase || purchaseStatus === "processing") return;
    setPurchaseStatus("processing");
    const productId =
      purchase.action === "coins" ? purchase.pack.id : PRODUCT_NO_ADS.id;
    let success = true;
    if (isYandex) {
      const result = await purchaseYandexProduct(
        productId,
        purchase.action === "coins"
      );
      if (result === false) success = false;
    } else {
      await wait(750);
    }
    if (!success) {
      setPurchaseStatus("idle");
      showToast(t.toastPurchaseFail, "error");
      return;
    }
    if (purchase.action === "coins") {
      const amount = purchase.pack.coins;
      setProgress((current) => ({ ...current, coins: current.coins + amount }));
    } else {
      setProgress((current) => {
        const stamp = Date.now();
        const r = regenEnergy(current, current.adFree, stamp);
        return { ...current, adFree: true, energy: r.energy, energyAt: stamp };
      });
    }
    setPurchaseStatus("success");
    playSound("coin", sound());
  }

  function resetProgress() {
    clearPendingWinTimer();
    resetPersistentState(SAVE_KEY);
    setProgress(makeInitialSave());
    setWin(null);
    setSettingsOpen(false);
    setPurchase(null);
    setScreen("play");
    setGameKey((value) => value + 1);
    showToast(t.toastReset);
  }

  /* ───── Рендер ───── */

  const winLevel = win
    ? LEVELS.find((item) => item.id === win.levelId) ?? null
    : null;
  const winHasNext = win
    ? LEVELS.some((item) => item.id === win.levelId + 1)
    : false;

  const purchaseCopy: PurchaseCopy | null = purchase
    ? purchase.action === "coins"
      ? {
          kind: "coins",
          title: {
            pack_small: t.packSmallT,
            pack_medium: t.packMediumT,
            pack_large: t.packLargeT,
          }[purchase.pack.id],
          subtitle:
            purchase.pack.bonus > 0
              ? f(
                  {
                    pack_small: t.packSmallS,
                    pack_medium: t.packMediumS,
                    pack_large: t.packLargeS,
                  }[purchase.pack.id],
                  { n: purchase.pack.bonus }
                )
              : t.packSmallS,
          price: `${purchase.pack.price} ₽`,
          coins: purchase.pack.coins,
        }
      : {
          kind: "noads",
          title: t.premiumTitle,
          subtitle: t.premiumSub,
          price: `${PRODUCT_NO_ADS.price} ₽`,
        }
    : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <BackgroundFX />

      <Header
        screen={screen}
        coins={progress.coins}
        energy={energy}
        energyMax={cap}
        nextEnergyMs={nextEnergyMs}
        sound={progress.sound}
        onNavigate={navigate}
        onToggleSound={toggleSound}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenEnergy={() => setEnergyOpen(true)}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
      />

      <main className="relative z-10 mx-auto w-full max-w-[1180px] px-2.5 pb-[112px] pt-4 sm:px-5 md:pb-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "play" && (
              <GameScreen
                key={`${level.id}-${gameKey}`}
                level={level}
                coins={progress.coins}
                hints={progress.hints}
                hintCost={hintPrice(level.id)}
                energy={energy}
                numbers={progress.numbers}
                sound={progress.sound}
                hintSignal={hintSignal}
                daily={safeDaily}
                completed={safeCompleted}
                unlocked={safeUnlocked}
                totalStars={totalStars}
                streak={progress.streak}
                lang={lang}
                snapshot={progress.boards?.[level.id]}
                onSnapshot={saveBoard}
                onSolved={handleSolved}
                onMove={handleMove}
                onUseHint={requestHint}
                onSpendEnergy={spendEnergy}
                onNeedEnergy={() => setEnergyOpen(true)}
                onPayCoins={payCoins}
                onOpenCollection={() => navigate("collection")}
                onOpenShop={() => navigate("shop")}
                onToggleNumbers={() =>
                  setProgress((current) => ({
                    ...current,
                    numbers: !current.numbers,
                  }))
                }
                onClaimTask={claimTask}
                onWatchForCoins={() => void watchForCoins()}
                onSelectLevel={playLevel}
                onNotify={showToast}
              />
            )}
            {screen === "collection" && (
              <CollectionScreen
                currentLevel={progress.currentLevel}
                completed={safeCompleted}
                unlocked={safeUnlocked}
                coins={progress.coins}
                totalStars={totalStars}
                lang={lang}
                onPlay={playLevel}
                onUnlock={unlockLevel}
              />
            )}
            {screen === "shop" && (
              <ShopScreen
                lang={lang}
                coins={progress.coins}
                hints={progress.hints}
                energy={energy}
                energyMax={cap}
                refillPrice={refillPrice}
                premium={premium}
                daily={safeDaily}
                allOpen={openedLevelsCount >= LEVELS.length}
                onWatchCoins={() => void watchForCoins()}
                onWatchEnergy={() => void watchForEnergy()}
                onRefillEnergy={refillEnergy}
                onOpenCoinPack={openCoinPack}
                onOpenNoAds={openNoAds}
                onBuyHints={buyHints}
                onUnlockAll={unlockAllLevels}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav screen={screen} onNavigate={navigate} lang={lang} />

      <AnimatePresence>
        {toast && (
          <Toast key={toast.id} message={toast.message} tone={toast.tone} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {win && winLevel && (
          <WinModal
            win={win}
            level={winLevel}
            hasNext={winHasNext}
            doubling={doubling}
            adsLeft={adLeft(safeDaily, "coins") > 0}
            lang={lang}
            onDouble={() => void doubleReward()}
            onNext={() => void handleNextLevel()}
            onReplay={replayLevel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {offer === "hint" && (
          <HintOfferModal
            lang={lang}
            price={hintPrice(level.id)}
            adsLeft={adLeft(safeDaily, "hint")}
            onWatch={() => void watchForHint()}
            onShop={() => {
              setOffer(null);
              navigate("shop");
            }}
            onClose={() => setOffer(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {energyOpen && (
          <EnergyModal
            lang={lang}
            energy={energy}
            max={cap}
            nextMs={nextEnergyMs}
            coins={progress.coins}
            refillPrice={refillPrice}
            adsLeft={adLeft(safeDaily, "energy")}
            onWatch={() => {
              setEnergyOpen(false);
              void watchForEnergy();
            }}
            onRefill={refillEnergy}
            onShop={() => {
              setEnergyOpen(false);
              navigate("shop");
            }}
            onClose={() => setEnergyOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {purchase && purchaseCopy && (
          <PurchaseModal
            copy={purchaseCopy}
            status={purchaseStatus}
            lang={lang}
            onConfirm={() => void confirmPurchase()}
            onClose={() => setPurchase(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            lang={lang}
            theme={theme}
            sound={progress.sound}
            setTheme={setTheme}
            setLang={setLang}
            onToggleSound={toggleSound}
            onReset={resetProgress}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAd && (
          <AdOverlay
            kind={activeAd.kind}
            level={level}
            lang={lang}
            onDone={activeAd.onDone}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
