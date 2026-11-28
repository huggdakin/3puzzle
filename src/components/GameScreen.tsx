import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DIFFICULTY_DOTS, LEVELS, isLevelOpen, type Level } from "../data/levels";
import { DAILY_TASKS, ECON, adLeft } from "../data/economy";
import {
  BLANK,
  formatTime,
  isSolved,
  keyboardTarget,
  moveTile,
  shufflePuzzle,
} from "../game/logic";
import { solveOptimal } from "../game/solver";
import { playSound } from "../lib/sound";
import type { BoardHint, BoardSnapshot, CompletedLevel, DailyState } from "../types";
import { cn } from "../utils/cn";
import {
  STRINGS,
  f,
  formatNumber,
  getExplorerRank,
  type Lang,
  type TKey,
} from "../lib/i18n";
import PuzzleBoard from "./PuzzleBoard";
import {
  ArrowRightIcon,
  BulbIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  CoinIcon,
  CompassIcon,
  EyeIcon,
  FlameIcon,
  GiftIcon,
  HashIcon,
  InfoIcon,
  LockIcon,
  MovesIcon,
  ShuffleIcon,
  Stars,
  TimerIcon,
  TrophyIcon,
  VideoIcon,
} from "./Icons";

const cut = (n = 8) => ({
  clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
});

function isValidSavedTiles(tiles: unknown): tiles is number[] {
  if (!Array.isArray(tiles) || tiles.length !== 9) return false;
  const seen = new Set<number>();
  for (const val of tiles) {
    if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || val > 8) {
      return false;
    }
    seen.add(val);
  }
  return seen.size === 9 && !isSolved(tiles);
}

type Notify = (message: string, tone?: "dark" | "success" | "error") => void;

type GameScreenProps = {
  level: Level;
  coins: number;
  hints: number;
  hintCost: number;
  energy: number;
  numbers: boolean;
  sound: boolean;
  hintSignal: number;
  daily: DailyState;
  completed: Record<number, CompletedLevel>;
  unlocked: number[];
  totalStars: number;
  streak: number;
  lang: Lang;
  snapshot?: BoardSnapshot;
  onSnapshot: (levelId: number, snapshot: BoardSnapshot | null) => void;
  onSolved: (result: { levelId: number; moves: number; seconds: number }) => void;
  onMove: () => void;
  onUseHint: () => void;
  onSpendEnergy: () => boolean;
  onNeedEnergy: () => void;
  onPayCoins: (amount: number) => boolean;
  onOpenCollection: () => void;
  onOpenShop: () => void;
  onToggleNumbers: () => void;
  onClaimTask: (taskId: string) => void;
  onWatchForCoins: () => void;
  onSelectLevel: (levelId: number) => void;
  onNotify: Notify;
};

type Tab = "tasks" | "progress" | "bonus";

const DIFF_KEY: Record<Level["difficulty"], TKey> = {
  easy: "diffEasy",
  medium: "diffMedium",
  hard: "diffHard",
  expert: "diffExpert",
};

function StatChip({
  icon,
  value,
  onClick,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={cut(8)}
      className="flex h-12 min-w-[62px] shrink-0 flex-col items-center justify-center border border-line bg-solid/90 px-2.5 py-1 transition-transform active:scale-95"
    >
      <span className="text-sonar-300">{icon}</span>
      <span className="tnum mt-0.5 font-display text-[12px] font-black leading-none">
        {value}
      </span>
    </button>
  );
}

function DifficultyDots({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            n <= count
              ? "bg-ember-300 shadow-[0_0_6px_rgba(255,176,58,0.8)]"
              : "bg-ink/20"
          )}
        />
      ))}
    </span>
  );
}

export default function GameScreen(props: GameScreenProps) {
  const {
    level,
    coins,
    hints,
    hintCost,
    energy,
    numbers,
    sound,
    hintSignal,
    daily,
    completed,
    unlocked,
    totalStars,
    streak,
    lang,
    snapshot,
    onSnapshot,
    onSolved,
    onMove,
    onUseHint,
    onSpendEnergy,
    onNeedEnergy,
    onPayCoins,
    onOpenCollection,
    onOpenShop,
    onToggleNumbers,
    onClaimTask,
    onWatchForCoins,
    onSelectLevel,
    onNotify,
  } = props;

  const t = STRINGS[lang];
  const restored =
    snapshot && isValidSavedTiles(snapshot.tiles) ? snapshot : null;

  const [tiles, setTiles] = useState<number[]>(() =>
    restored ? [...restored.tiles] : shufflePuzzle(level.shuffle)
  );
  const [moves, setMoves] = useState(restored?.moves ?? 0);
  const [seconds, setSeconds] = useState(restored?.seconds ?? 0);
  const [started, setStarted] = useState(restored?.started ?? false);
  const [won, setWon] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previews, setPreviews] = useState(restored?.previews ?? 0);
  const [boardLevel, setBoardLevel] = useState(level.id);
  const [hintRun, setHintRun] = useState<BoardHint | null>(() => {
    if (!restored?.hint) return null;
    const remaining = solveOptimal(restored.tiles).length;
    if (remaining === 0) return null;
    return { ...restored.hint, phase: "done", remaining };
  });
  const [tab, setTab] = useState<Tab>("tasks");
  const [rules, setRules] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const firstHintSignal = useRef(hintSignal);
  const tilesRef = useRef(tiles);
  const movesRef = useRef(moves);
  const secondsRef = useRef(seconds);
  const startedRef = useRef(started);
  const onSolvedRef = useRef(onSolved);
  const onMoveRef = useRef(onMove);
  const hintAutoTarget = useRef(0);
  const hintAutoDone = useRef(0);
  const autoTimer = useRef<number | null>(null);

  tilesRef.current = tiles;
  movesRef.current = moves;
  secondsRef.current = seconds;
  startedRef.current = started;
  onSolvedRef.current = onSolved;
  onMoveRef.current = onMove;

  useEffect(() => {
    if (boardLevel !== level.id) return;
    if (won) {
      onSnapshot(level.id, null);
      return;
    }
    onSnapshot(level.id, {
      tiles,
      moves,
      seconds,
      started,
      hint: hintRun,
      previews,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, moves, seconds, started, hintRun, won, level.id, boardLevel, previews]);

  useEffect(() => {
    const saved = snapshot && isValidSavedTiles(snapshot.tiles) ? snapshot : null;
    setBoardLevel(level.id);
    setTiles(saved ? [...saved.tiles] : shufflePuzzle(level.shuffle));
    setMoves(saved?.moves ?? 0);
    setSeconds(saved?.seconds ?? 0);
    setStarted(saved?.started ?? false);
    setPreviews(saved?.previews ?? 0);
    setWon(false);
    setShowPreview(false);
    hintAutoTarget.current = 0;
    hintAutoDone.current = 0;
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    if (saved?.hint) {
      const remaining = solveOptimal(saved.tiles).length;
      setHintRun(remaining > 0 ? { ...saved.hint, phase: "done", remaining } : null);
    } else {
      setHintRun(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id, level.shuffle]);

  useEffect(() => {
    if (!started || won) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [started, won]);

  useEffect(() => {
    if (!showPreview) return;
    const timer = window.setTimeout(() => setShowPreview(false), 4200);
    return () => window.clearTimeout(timer);
  }, [showPreview]);

  useEffect(() => {
    if (hintSignal === firstHintSignal.current) return;
    firstHintSignal.current = hintSignal;
    setShowPreview(false);
    const plan = solveOptimal(tilesRef.current);
    if (plan.moves.length === 0) return;
    if (!startedRef.current) {
      onSpendEnergy();
      startedRef.current = true;
      setStarted(true);
    }
    const total = plan.moves.length;
    const auto =
      total <= 2
        ? Math.max(0, total - 1)
        : Math.min(total - 1, Math.max(1, Math.round(total * 0.8)));
    hintAutoTarget.current = auto;
    hintAutoDone.current = 0;
    setHintRun({
      total,
      auto,
      done: 0,
      remaining: total,
      phase: auto > 0 ? "running" : "done",
    });
    window.setTimeout(
      () => boardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      80
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintSignal]);

  useEffect(() => {
    if (hintRun?.phase !== "running") return;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const current = tilesRef.current;
      const plan = solveOptimal(current);
      if (
        plan.moves.length === 0 ||
        hintAutoDone.current >= hintAutoTarget.current ||
        hintAutoDone.current >= hintRun.total - 1
      ) {
        setHintRun((run) =>
          run ? { ...run, phase: "done", remaining: plan.length } : run
        );
        return;
      }
      const position = plan.moves[0];
      const next = moveTile(current, position);
      tilesRef.current = next;
      const nextMoves = movesRef.current + 1;
      movesRef.current = nextMoves;
      startedRef.current = true;
      setStarted(true);
      setTiles(next);
      setMoves(nextMoves);
      onMoveRef.current();
      hintAutoDone.current += 1;
      playSound("move", sound);

      if (isSolved(next)) {
        setHintRun((run) =>
          run
            ? { ...run, phase: "done", remaining: 0, done: hintAutoDone.current }
            : run
        );
        setWon(true);
        playSound("win", sound);
        onSolvedRef.current({
          levelId: level.id,
          moves: nextMoves,
          seconds: secondsRef.current,
        });
        return;
      }
      setHintRun((run) =>
        run
          ? { ...run, done: hintAutoDone.current, remaining: plan.length - 1 }
          : run
      );
      autoTimer.current = window.setTimeout(tick, 150);
    };

    autoTimer.current = window.setTimeout(tick, 220);
    return () => {
      cancelled = true;
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
    };
  }, [hintRun?.phase, hintRun?.total, sound, level.id]);

  function applyMove(position: number) {
    if (won || showPreview) return;
    if (hintRun?.phase === "running") {
      onNotify(t.toastHintBusy);
      return;
    }
    const next = moveTile(tiles, position);
    if (next === tiles) return;
    if (!started) {
      if (!onSpendEnergy()) {
        onNeedEnergy();
        return;
      }
      startedRef.current = true;
      setStarted(true);
    }
    const nextMoves = moves + 1;
    tilesRef.current = next;
    movesRef.current = nextMoves;
    setTiles(next);
    setMoves(nextMoves);
    onMove();
    playSound("move", sound);

    if (isSolved(next)) {
      setWon(true);
      playSound("win", sound);
      onSolved({ levelId: level.id, moves: nextMoves, seconds });
      return;
    }
    if (hintRun) {
      const plan = solveOptimal(next);
      setHintRun((run) => (run ? { ...run, remaining: plan.length } : run));
    }
  }

  // Поддержка стрелок клавиатуры без необходимости предварительно кликать по рамке поля
  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || rules || won || showPreview) return;
      if (!event.key.startsWith("Arrow")) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const target = keyboardTarget(tilesRef.current, event.key);
      if (target !== null) {
        event.preventDefault();
        applyMove(target);
      }
    };
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  });

  function restart() {
    const fresh = shufflePuzzle(level.shuffle);
    tilesRef.current = fresh;
    movesRef.current = 0;
    secondsRef.current = 0;
    startedRef.current = false;
    setTiles(fresh);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    setWon(false);
    setShowPreview(false);
    setPreviews(0);
    setHintRun(null);
    hintAutoTarget.current = 0;
    hintAutoDone.current = 0;
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    playSound("click", sound);
    onNotify(t.toastShuffled);
  }

  function hintAction() {
    if (hintRun) {
      onNotify(t.toastHintUsed);
      return;
    }
    if (!started && energy < 1) {
      onNeedEnergy();
      return;
    }
    onUseHint();
  }

  function togglePreview() {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    if (previews >= 1) {
      if (!onPayCoins(ECON.previewCost)) return;
      onNotify(f(t.toastPreviewCost, { n: ECON.previewCost }));
    }
    setPreviews((value) => value + 1);
    setShowPreview(true);
    playSound("click", sound);
  }

  const onPlace = tiles.reduce(
    (sum, value, index) => sum + (value !== BLANK && value === index ? 1 : 0),
    0
  );
  const solvedCount = Object.keys(completed).length;
  const record = completed[level.id];
  const levelTitle = lang === "ru" ? level.titleRu : level.titleEn;
  const regionTitle = lang === "ru" ? level.regionRu : level.regionEn;
  const explorerRank = getExplorerRank(solvedCount, lang);

  return (
    <div className="mx-auto w-full max-w-[480px] lg:max-w-[920px]">
      <div className="lg:grid lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Левая колонка: шапка локации, прогресс-бар, поле 3×3 и кнопки управления */}
        <div>
          {/* Шапка локации */}
          <div className="panel flex items-center gap-2 p-2.5">
            <button
              type="button"
              onClick={onOpenCollection}
              className="flex min-w-0 flex-1 items-center gap-2.5 p-0.5 text-left transition-opacity hover:opacity-90"
            >
              <img
                src={level.thumb}
                alt=""
                style={cut(7)}
                className="h-12 w-12 shrink-0 border border-ember-300/60 object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-sonar-300">
                  <span className="truncate">
                    #{String(level.id).padStart(2, "0")} · {regionTitle}
                  </span>
                  <DifficultyDots count={DIFFICULTY_DOTS[level.difficulty]} />
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 font-display text-[13.5px] font-black uppercase leading-tight tracking-[-0.01em] text-ink">
                  <span className="truncate">{levelTitle}</span>
                  {record && <Stars value={record.stars} size={13} />}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-soft">
                  {t[DIFF_KEY[level.difficulty]]}
                </span>
              </span>
              <ChevronRightIcon size={16} className="shrink-0 text-muted" />
            </button>

            <StatChip
              icon={<TimerIcon size={15} />}
              value={formatTime(seconds)}
              label={t.time}
              onClick={() => onNotify(f(t.toastTime, { n: formatTime(seconds) }))}
            />
            <StatChip
              icon={<MovesIcon size={15} />}
              value={
                <motion.span
                  key={moves}
                  initial={{ scale: 1.35, color: "#ffd166" }}
                  animate={{ scale: 1, color: "var(--ink)" }}
                  className="inline-block"
                >
                  {moves}
                </motion.span>
              }
              label={t.moves}
              onClick={() => onNotify(f(t.toastMoves, { n: moves }))}
            />
          </div>

          {/* Прогресс сборки текущего снимка */}
          <div className="mt-2.5 flex items-center gap-2.5 px-1">
            <span className="ui-shadow tnum shrink-0 font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-ember-200">
              {f(t.onPlace, { n: onPlace })}
            </span>
            <div className="bar flex-1">
              <span style={{ width: `${((won ? 8 : onPlace) / 8) * 100}%` }} />
            </div>
            <button
              type="button"
              onClick={() => setRules(true)}
              aria-label={t.rulesTitle}
              style={cut(6)}
              className="grid h-8 w-8 shrink-0 place-items-center border border-white/25 bg-[#080718]/80 text-white backdrop-blur-xs transition-all hover:border-ember-300/60 hover:bg-[#161238]"
            >
              <InfoIcon size={16} />
            </button>
          </div>

          {/* Игровое поле 3×3 */}
          <div
            ref={boardRef}
            tabIndex={0}
            onKeyDown={(event) => {
              if (!event.key.startsWith("Arrow")) return;
              event.preventDefault();
              const target = keyboardTarget(tiles, event.key);
              if (target !== null) applyMove(target);
            }}
            className="mt-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ember-300"
            aria-label={t.boardLabel}
          >
            <PuzzleBoard
              level={level}
              tiles={tiles}
              numbers={numbers}
              showPreview={showPreview}
              solved={won}
              disabled={won}
              onTileClick={applyMove}
              lang={lang}
            />
          </div>

          {/* Кнопки управления под полем */}
          <div className="mt-3.5 grid gap-2.5">
            <button
              type="button"
              onClick={hintAction}
              disabled={Boolean(hintRun)}
              className={cn(
                "btn relative h-[52px] w-full text-[13px]",
                hintRun ? "btn-glass" : "btn-sun btn-shine"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center gap-2 px-14 text-center",
                  hintRun ? "whitespace-normal text-[11px] leading-tight" : ""
                )}
              >
                <CompassIcon size={19} className="shrink-0" />
                <span className="text-center">
                  {hintRun ? t.hintUsed : t.hint}
                </span>
              </span>
              {!hintRun && (
                <span
                  style={cut(6)}
                  className="tnum absolute right-2.5 top-1/2 flex h-8 -translate-y-1/2 items-center gap-1 bg-[#04030c]/92 px-2.5 font-display text-[12px] font-black text-ember-200"
                >
                  {hints > 0 ? (
                    <>×{hints}</>
                  ) : (
                    <>
                      <CoinIcon size={15} /> {hintCost}
                    </>
                  )}
                </span>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={togglePreview}
                className={cn(
                  "btn h-12 flex-col gap-0 px-2 text-[11px]",
                  showPreview ? "btn-grape" : "btn-glass"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <EyeIcon size={15} /> {t.preview}
                </span>
                {previews >= 1 && !showPreview && (
                  <span className="tnum flex items-center gap-0.5 text-[9.5px] font-bold text-ember-300">
                    <CoinIcon size={11} /> {ECON.previewCost}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={restart}
                className="btn btn-glass h-12 px-2 text-[11px]"
              >
                <ShuffleIcon size={15} /> {t.shuffle}
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleNumbers();
                  onNotify(numbers ? t.toastNumbersOff : t.toastNumbersOn);
                }}
                className={cn(
                  "btn h-12 px-2 text-[11px]",
                  numbers ? "btn-mint" : "btn-glass"
                )}
              >
                <HashIcon size={15} /> {t.numbers}
              </button>
            </div>
          </div>

          {/* Прогресс автомаршрута подсказки */}
          <AnimatePresence>
            {hintRun && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="panel mt-3 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
                    <CompassIcon size={16} className="text-ember-300" />
                    {hintRun.phase === "running" ? t.hintRunning : t.hintFinish}
                  </span>
                  <span
                    style={cut(6)}
                    className="tnum bg-gradient-to-r from-sonar-400 to-myst-500 px-2.5 py-0.5 font-display text-[10.5px] font-bold uppercase text-white"
                  >
                    {hintRun.remaining} {t.toWin}
                  </span>
                </div>
                <div className="bar mt-2">
                  <span
                    style={{
                      width: `${hintRun.total ? (hintRun.done / hintRun.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="tnum mt-1.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  {t.auto} {hintRun.done}/{hintRun.total}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Правая колонка на ПК (или нижний блок на мобильном): лента маршрута и вкладки экспедиции */}
        <div className="mt-4 lg:mt-0">
          {/* Лента ближайших локаций маршрута */}
          <div className="panel p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-sonar-300">
                {regionTitle}
              </span>
              <span className="chip !py-0.5 !px-2.5 !text-[10.5px] tnum">
                {level.id}
                <span className="text-muted">/{LEVELS.length}</span>
              </span>
            </div>
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-0.5 py-1">
              {LEVELS.slice(Math.max(0, level.id - 5), level.id + 5).map((item) => {
                const open = isLevelOpen(item, completed, unlocked, totalStars);
                const done = completed[item.id];
                const active = item.id === level.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectLevel(item.id)}
                    aria-label={f(t.levelLabel, { n: item.id })}
                    style={cut(7)}
                    className={cn(
                      "relative h-11 w-11 shrink-0 overflow-hidden border-2 transition-transform active:scale-90",
                      active
                        ? "scale-105 border-ember-300 shadow-[0_0_16px_rgba(255,176,58,0.6)]"
                        : "border-white/35",
                      !open && "opacity-55"
                    )}
                  >
                    <img
                      src={item.thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="tnum absolute inset-0 grid place-items-center bg-[#04030c]/55 font-display text-[10.5px] font-black text-white">
                      {!open ? (
                        <LockIcon size={14} />
                      ) : done ? (
                        <CheckIcon size={16} className="text-sonar-300" />
                      ) : (
                        item.id
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Панель вкладок: Задания / Экспедиция / Снабжение */}
          <div className="panel mb-2 mt-3 w-full p-2.5">
            <div
              style={cut(10)}
              className="grid grid-cols-3 gap-1.5 border border-line bg-ink/[0.06] p-1.5"
            >
              {(
                [
                  { id: "tasks", label: t.tasks, icon: <CheckIcon size={14} /> },
                  { id: "progress", label: t.progress, icon: <TrophyIcon size={14} /> },
                  { id: "bonus", label: t.bonus, icon: <GiftIcon size={14} /> },
                ] as const
              ).map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    style={cut(7)}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 px-2 font-display text-[10px] font-bold uppercase tracking-[0.06em] transition-all",
                      active
                        ? "bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 text-[#04030c] shadow-[0_0_20px_-4px_rgba(255,176,58,0.85)]"
                        : "text-soft hover:text-ink"
                    )}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-1.5 pt-3.5">
              {tab === "tasks" && (
                <div className="space-y-2.5">
                  {DAILY_TASKS.map((task) => {
                    const value =
                      task.id === "solve"
                        ? daily.solved
                        : task.id === "moves"
                          ? daily.moves
                          : daily.hints;
                    const done = value >= task.goal;
                    const claimed = daily.claimed.includes(task.id);
                    const title =
                      task.id === "solve"
                        ? f(t.taskSolve, { n: task.goal })
                        : task.id === "moves"
                          ? f(t.taskMoves, { n: task.goal })
                          : t.taskHint;
                    return (
                      <div
                        key={task.id}
                        className="panel-flat flex items-center gap-2.5 p-2.5"
                      >
                        <span
                          style={cut(7)}
                          className="grid h-10 w-10 shrink-0 place-items-center bg-myst-400/20 text-myst-300"
                        >
                          {task.id === "solve" ? (
                            <CompassIcon size={18} />
                          ) : task.id === "moves" ? (
                            <MovesIcon size={18} />
                          ) : (
                            <BulbIcon size={18} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold leading-tight">
                            {title}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="bar !h-2 flex-1">
                              <span
                                style={{
                                  width: `${Math.min(100, (value / task.goal) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="tnum font-display text-[10px] font-bold text-muted">
                              {Math.min(value, task.goal)}/{task.goal}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            claimed
                              ? onNotify(t.toastTaskClaimed)
                              : done
                                ? onClaimTask(task.id)
                                : onNotify(f(t.toastTaskLeft, { n: task.goal - value }))
                          }
                          className={cn(
                            "btn btn-sm !px-3",
                            claimed
                              ? "btn-glass"
                              : done
                                ? "btn-sun glow-ring"
                                : "btn-glass"
                          )}
                        >
                          {claimed ? <CheckIcon size={14} /> : <CoinIcon size={15} />}
                          {claimed ? t.claimed : `+${task.reward}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "progress" && (
                <div className="space-y-2.5">
                  <div className="panel-flat flex items-center justify-between px-3 py-2">
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                      {t.rankLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-display text-[11.5px] font-bold uppercase text-sonar-300">
                      <CompassIcon size={15} /> {explorerRank}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: t.collected, value: solvedCount, of: LEVELS.length },
                      { label: t.stars, value: totalStars, of: LEVELS.length * 3 },
                      { label: t.level, value: level.id, of: LEVELS.length },
                    ].map((cell) => (
                      <div key={cell.label} className="panel-flat px-2 py-2 text-center">
                        <p className="truncate font-display text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                          {cell.label}
                        </p>
                        <p className="tnum mt-0.5 font-display text-[15px] font-black">
                          {cell.value}
                          <span className="text-[10px] text-muted">/{cell.of}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="panel-flat px-3 py-2.5">
                    <div className="flex items-center justify-between font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-soft">
                      <span>{t.albumProgress}</span>
                      <span className="tnum text-ember-200">
                        {Math.round((solvedCount / LEVELS.length) * 100)}%
                      </span>
                    </div>
                    <div className="bar mt-1.5">
                      <span
                        style={{ width: `${(solvedCount / LEVELS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCollection}
                    className="btn btn-grape h-11 w-full text-[11.5px]"
                  >
                    <CompassIcon size={16} /> {t.openCollection}{" "}
                    <ArrowRightIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNotify(
                        f(t.toastStreak, { n: streak, m: record?.moves ?? "—" })
                      )
                    }
                    className="panel-flat flex w-full items-center gap-2 px-3 py-2 text-left"
                  >
                    <FlameIcon size={18} className="text-ember-400" />
                    <span className="flex-1 text-[12px] font-bold text-soft">
                      {f(t.streakLine, { n: streak })}
                    </span>
                  </button>
                </div>
              )}

              {tab === "bonus" && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={onWatchForCoins}
                    className="btn btn-sun btn-shine h-14 w-full justify-start gap-3 px-3 text-left"
                  >
                    <span
                      style={cut(6)}
                      className="grid h-9 w-9 shrink-0 place-items-center bg-[#04030c]/90 text-ember-300"
                    >
                      <VideoIcon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-black leading-tight">
                        {f(t.watchCoins, { n: ECON.adCoins })}
                      </span>
                      <span className="text-[10px] font-bold opacity-80">
                        {f(t.adLeft, { n: adLeft(daily, "coins") })}
                      </span>
                    </span>
                    <ArrowRightIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNotify(
                        f(t.toastStreak, { n: streak, m: record?.moves ?? "—" })
                      )
                    }
                    className="panel-flat flex w-full items-center gap-2 px-3 py-2.5 text-left"
                  >
                    <FlameIcon size={18} className="text-ember-400" />
                    <span className="flex-1 text-[12px] font-bold text-soft">
                      {f(t.streakLine, { n: streak })}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenShop}
                    className="panel-flat flex w-full items-center gap-2 px-3 py-2.5 text-left"
                  >
                    <GiftIcon size={18} className="text-myst-300" />
                    <span className="flex-1 text-[12px] font-bold text-soft">
                      {t.shop} · {formatNumber(coins, lang)}
                    </span>
                    <ChevronRightIcon size={16} className="text-muted" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно правил в стиле LUMEN */}
      <AnimatePresence>
        {rules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRules(false)}
            className="fixed inset-0 z-[65] flex items-center justify-center bg-[#04030c]/88 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="panel w-full max-w-[380px] p-5"
            >
              <div className="flex items-start justify-between">
                <span
                  style={cut(8)}
                  className="grid h-11 w-11 place-items-center bg-gradient-to-r from-ember-300 to-ember-500 text-[#04030c] shadow-[0_0_20px_rgba(255,176,58,0.5)]"
                >
                  <InfoIcon size={22} />
                </span>
                <button
                  type="button"
                  onClick={() => setRules(false)}
                  aria-label={t.close}
                  style={cut(6)}
                  className="grid h-9 w-9 place-items-center border border-line bg-ink/10 text-soft hover:text-ink"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
              <h3 className="font-display mt-3 text-[16px] font-black uppercase tracking-[0.04em]">
                {t.rulesTitle}
              </h3>
              <ul className="mt-3 space-y-2.5 text-[12px] font-semibold leading-relaxed text-soft">
                <li>1. {t.rule1}</li>
                <li>2. {t.rule2}</li>
                <li>3. {t.rule3}</li>
                <li>4. {t.rule4}</li>
              </ul>
              <button
                type="button"
                onClick={() => setRules(false)}
                className="btn btn-sun mt-5 h-12 w-full text-[12.5px]"
              >
                {t.gotIt}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
