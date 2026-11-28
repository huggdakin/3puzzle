import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import type { Level } from "../data/levels";
import { ECON } from "../data/economy";
import type { WinResult } from "../types";
import { STRINGS, f, formatNumber, type Lang } from "../lib/i18n";
import type { Theme } from "../lib/prefs";
import { formatCountdown } from "../lib/useNow";
import { cn } from "../utils/cn";
import { LangToggle, ThemeToggle } from "./Toggles";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  CloseIcon,
  CoinIcon,
  CompassIcon,
  GiftIcon,
  PlayIcon,
  RefreshIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  VideoIcon,
  VolumeIcon,
} from "./Icons";

const cut = (n = 8) => ({
  clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
});

function Modal({
  children,
  onClose,
  z = 50,
}: {
  children: ReactNode;
  onClose?: () => void;
  z?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-end justify-center overflow-y-auto bg-[#04030c]/88 p-3 backdrop-blur-md sm:items-center sm:p-6"
      style={{ zIndex: z }}
    >
      <button
        type="button"
        aria-label="close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <motion.div
        initial={{ y: 40, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative z-10 my-auto w-full max-w-[400px]"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={cut(6)}
      className="grid h-9 w-9 shrink-0 place-items-center border border-line bg-ink/10 text-soft transition-all hover:border-ink/35 hover:text-ink active:scale-90"
    >
      <CloseIcon size={16} />
    </button>
  );
}

/* ─────────────── Реклама (демо) в стиле LUMEN ─────────────── */

export function AdOverlay({
  kind,
  level,
  lang,
  onDone,
}: {
  kind: "rewarded" | "interstitial";
  level: Level;
  lang: Lang;
  onDone: (rewarded: boolean) => void;
}) {
  const t = STRINGS[lang];
  const duration = kind === "rewarded" ? 4 : 3;
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(
      () => setRemaining((value) => value - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const ready = remaining <= 0;
  const progress = ((duration - remaining) / duration) * 100;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#04030c] text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <span
          style={cut(7)}
          className="inline-flex items-center gap-1.5 border border-white/18 bg-white/[0.06] px-3 py-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.1em]"
        >
          <VideoIcon size={14} className="text-ember-300" /> {t.adBadge}
        </span>
        <button
          type="button"
          onClick={() => onDone(false)}
          style={cut(7)}
          className="inline-flex items-center gap-1 border border-white/18 bg-white/[0.06] px-3 py-2 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/85 hover:bg-white/14"
        >
          {kind === "rewarded" ? t.adSkipReward : t.adSkip}{" "}
          <CloseIcon size={13} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 pb-6">
        <div
          style={cut(18)}
          className="animate-pop relative w-full overflow-hidden border border-white/20 bg-[#080718] shadow-2xl"
        >
          <div className="relative h-52 sm:h-64">
            <img src={level.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080718] via-[#080718]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="font-display text-lg font-black uppercase leading-tight tracking-[0.02em] text-ember-200">
                {t.adMockTitle}
              </h3>
              <p className="mt-1.5 max-w-sm text-[12px] font-semibold leading-relaxed text-white/80">
                {t.adMockText}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 p-5 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="font-display text-[11.5px] font-bold uppercase tracking-[0.04em]">
                {kind === "rewarded" ? t.adRewardLine : t.adInterLine}
              </p>
              <p className="tnum mt-1 text-[11px] font-semibold text-sonar-300">
                {ready ? t.adThanks : f(t.adWait, { n: remaining })}
              </p>
            </div>
            <button
              type="button"
              disabled={!ready}
              onClick={() => onDone(true)}
              className={cn(
                "btn h-12 w-full px-6 text-[12.5px] sm:w-auto",
                ready ? "btn-sun btn-shine" : "btn-glass"
              )}
            >
              {ready ? (
                kind === "rewarded" ? (
                  <>
                    {t.adClaim} <GiftIcon size={16} />
                  </>
                ) : (
                  <>
                    {t.adContinue} <PlayIcon size={15} />
                  </>
                )
              ) : (
                f(t.adWaitBtn, { n: remaining })
              )}
            </button>
          </div>
          <div className="h-1.5 w-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-sonar-400 via-ember-300 to-myst-400 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="mt-3 text-center text-[10.5px] font-semibold text-white/45">
          {t.adFoot}
        </p>
      </div>
    </div>
  );
}

/* ─────────────── Конфетти в палитре LUMEN ─────────────── */

const CONFETTI_COLORS = [
  "#ffd166",
  "#ffb03a",
  "#23e0b6",
  "#6ef7d8",
  "#8b62ff",
  "#ff2f74",
];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        left: `${(i * 17 + (i % 5) * 7) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        dx: ((i % 7) - 3) * 28,
        rot: 300 + ((i * 53) % 500),
        delay: (i % 14) * 0.07,
        dur: 2.1 + (i % 6) * 0.22,
        round: i % 3 === 0,
      })),
    []
  );
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-full overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: p.left,
              background: p.color,
              borderRadius: p.round ? "50%" : undefined,
              ["--dx" as string]: `${p.dx}px`,
              ["--rot" as string]: `${p.rot}deg`,
              ["--delay" as string]: `${p.delay}s`,
              ["--dur" as string]: `${p.dur}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ─────────────── Победа ─────────────── */

export function WinModal({
  win,
  level,
  hasNext,
  doubling,
  adsLeft,
  lang,
  onDouble,
  onNext,
  onReplay,
}: {
  win: WinResult;
  level: Level;
  hasNext: boolean;
  doubling: boolean;
  adsLeft: boolean;
  lang: Lang;
  onDouble: () => void;
  onNext: () => void;
  onReplay: () => void;
}) {
  const t = STRINGS[lang];
  const levelTitle = lang === "ru" ? level.titleRu : level.titleEn;

  return (
    <Modal z={55}>
      <div className="panel relative overflow-hidden text-center">
        <Confetti />
        <div className="relative bg-[radial-gradient(circle_at_50%_-10%,rgba(255,176,58,0.32),transparent_62%)] px-5 pb-5 pt-6">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 14,
              delay: 0.1,
            }}
            style={cut(12)}
            className="mx-auto grid h-16 w-16 place-items-center bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 text-[#04030c] shadow-[0_0_28px_rgba(255,176,58,0.65)]"
          >
            <TrophyIcon size={34} />
          </motion.div>
          <h2 className="title-grad font-display mt-3 text-[20px] font-black uppercase leading-tight tracking-[-0.02em]">
            {t.winTitle}
          </h2>
          <p className="mt-1 text-[12px] font-semibold text-soft">
            #{String(level.id).padStart(2, "0")} «{levelTitle}» · {t.winSub}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2.5">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className="star-pop inline-block"
                style={{ animationDelay: `${0.25 + n * 0.2}s` }}
              >
                <StarIcon
                  size={44}
                  filled={n <= win.stars}
                  className={
                    n <= win.stars
                      ? "text-ember-300 drop-shadow-[0_0_14px_rgba(255,176,58,0.85)]"
                      : "text-ink/20"
                  }
                />
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="panel-flat px-3 py-2">
              <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                {t.moves}
              </p>
              <p className="tnum font-display text-lg font-black">{win.moves}</p>
            </div>
            <div className="panel-flat px-3 py-2">
              <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                {t.time}
              </p>
              <p className="tnum font-display text-lg font-black">
                {formatCountdown(win.seconds * 1000)}
              </p>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.75, type: "spring", stiffness: 300, damping: 16 }}
            style={cut(10)}
            className="mt-3 flex items-center justify-between border border-ember-200/50 bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 px-4 py-3 text-[#04030c] shadow-[0_8px_28px_-8px_rgba(255,176,58,0.85)]"
          >
            <span className="text-left">
              <span className="block font-display text-[10px] font-black uppercase tracking-[0.12em] opacity-85">
                {t.rewardLine}
              </span>
              <span className="block text-[10.5px] font-bold opacity-80">
                {win.firstTime ? t.firstTime : t.repeatTime}
              </span>
            </span>
            <span className="tnum flex items-center gap-1.5 font-display text-[21px] font-black">
              <CoinIcon size={26} /> +{win.coins * (win.doubled ? 2 : 1)}
            </span>
          </motion.div>

          <div className="mt-4 grid gap-2.5">
            <button
              type="button"
              onClick={onDouble}
              disabled={win.doubled || doubling || !adsLeft}
              className={cn(
                "btn h-12 w-full text-[12.5px]",
                win.doubled ? "btn-glass" : "btn-mint btn-shine"
              )}
            >
              {win.doubled ? <CheckIcon size={16} /> : <VideoIcon size={17} />}
              {win.doubled ? t.doubled : t.double}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="btn btn-grape h-12 w-full text-[12.5px]"
            >
              {hasNext ? t.nextIsland : t.allSolved} <ArrowRightIcon size={16} />
            </button>
            <button
              type="button"
              onClick={onReplay}
              className="btn btn-glass h-11 w-full text-[11.5px]"
            >
              <RefreshIcon size={15} /> {t.playAgain}
            </button>
          </div>
          <p className="mt-3 text-[10px] font-semibold text-muted">
            {t.photo}: {level.credit}
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────── Нет монет на подсказку ─────────────── */

export function HintOfferModal({
  lang,
  price,
  adsLeft,
  onWatch,
  onShop,
  onClose,
}: {
  lang: Lang;
  price: number;
  adsLeft: number;
  onWatch: () => void;
  onShop: () => void;
  onClose: () => void;
}) {
  const t = STRINGS[lang];
  return (
    <Modal onClose={onClose}>
      <div className="panel p-5 text-center">
        <div className="flex justify-end">
          <CloseButton onClick={onClose} label={t.close} />
        </div>
        <motion.span
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.6 }}
          style={cut(12)}
          className="mx-auto -mt-2 grid h-16 w-16 place-items-center bg-gradient-to-r from-ember-300 to-ember-500 text-[#04030c] shadow-[0_0_24px_rgba(255,176,58,0.6)]"
        >
          <CompassIcon size={32} />
        </motion.span>
        <h3 className="font-display mt-3 text-[17px] font-black uppercase tracking-[0.03em]">
          {t.offerHintTitle}
        </h3>
        <p className="mt-1.5 text-[12.5px] font-semibold text-soft">
          {t.offerHintSub}
        </p>
        <p className="tnum mt-2 inline-flex items-center gap-1 font-display text-[11px] font-bold uppercase text-ember-300">
          <CoinIcon size={14} /> {f(t.hintPriceLine, { n: price })}
        </p>
        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={onWatch}
            disabled={adsLeft <= 0}
            className="btn btn-mint btn-shine h-12 w-full flex-col gap-0 text-[12.5px]"
          >
            <span className="flex items-center gap-2">
              <VideoIcon size={17} /> {t.offerHintBtn}
            </span>
            <span className="text-[9.5px] font-bold opacity-85">
              {adsLeft > 0 ? f(t.adLeft, { n: adsLeft }) : t.adLimitReached}
            </span>
          </button>
          <button
            type="button"
            onClick={onShop}
            className="btn btn-sun h-12 w-full text-[12.5px]"
          >
            <CoinIcon size={18} /> {t.buyCoinsShop}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-glass h-10 w-full text-[11.5px]"
          >
            {t.later}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────── Закончилась энергия ─────────────── */

export function EnergyModal({
  lang,
  energy,
  max,
  nextMs,
  coins,
  refillPrice,
  adsLeft,
  onWatch,
  onRefill,
  onShop,
  onClose,
}: {
  lang: Lang;
  energy: number;
  max: number;
  nextMs: number;
  coins: number;
  refillPrice: number;
  adsLeft: number;
  onWatch: () => void;
  onRefill: () => void;
  onShop: () => void;
  onClose: () => void;
}) {
  const t = STRINGS[lang];
  const empty = energy === 0;
  const canRefill = energy < max;
  return (
    <Modal onClose={onClose}>
      <div className="panel p-5 text-center">
        <div className="flex justify-end">
          <CloseButton onClick={onClose} label={t.close} />
        </div>
        <motion.span
          animate={empty ? { scale: [1, 1.1, 1] } : { rotate: [0, -6, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          style={cut(12)}
          className="mx-auto -mt-2 grid h-16 w-16 place-items-center bg-gradient-to-b from-sonar-300 to-sonar-500 text-[#04030c] shadow-[0_0_24px_rgba(35,224,182,0.6)]"
        >
          <BoltIcon size={34} />
        </motion.span>
        <h3 className="font-display mt-3 text-[17px] font-black uppercase tracking-[0.03em]">
          {empty ? t.energyEmptyTitle : t.energy}
        </h3>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: max }, (_, i) => (
            <span
              key={i}
              style={cut(4)}
              className={cn(
                "grid h-8 w-6 place-items-center border transition-colors",
                i < energy
                  ? "border-sonar-300/60 bg-gradient-to-b from-sonar-300 to-sonar-500 text-[#04030c]"
                  : "border-line bg-ink/10 text-ink/20"
              )}
            >
              <BoltIcon size={13} />
            </span>
          ))}
        </div>
        <p className="mt-3 text-[12px] font-semibold text-soft">
          {t.energyEmptySub}
        </p>
        <p className="tnum mt-2 font-display text-[11.5px] font-bold uppercase text-sonar-300">
          {canRefill ? f(t.nextIn, { t: formatCountdown(nextMs) }) : t.full}
        </p>

        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={onWatch}
            disabled={adsLeft <= 0 || !canRefill}
            className="btn btn-mint btn-shine h-12 w-full flex-col gap-0 text-[12.5px]"
          >
            <span className="flex items-center gap-2">
              <VideoIcon size={17} /> {f(t.energyAd, { n: ECON.adEnergy })}
            </span>
            <span className="text-[9.5px] font-bold opacity-85">
              {adsLeft > 0 ? f(t.adLeft, { n: adsLeft }) : t.adLimitReached}
            </span>
          </button>
          <button
            type="button"
            onClick={onRefill}
            disabled={!canRefill}
            className="btn btn-sun h-12 w-full text-[12.5px]"
          >
            <BoltIcon size={16} /> {t.energyRefill}
            <span
              style={cut(5)}
              className="tnum ml-1 flex items-center gap-1 bg-[#04030c]/90 px-2.5 py-0.5 text-[11.5px] text-ember-200"
            >
              <CoinIcon size={14} /> {refillPrice}
            </span>
          </button>
          {coins < refillPrice && canRefill && (
            <button
              type="button"
              onClick={onShop}
              className="btn btn-grape h-11 w-full text-[11.5px]"
            >
              <CoinIcon size={16} /> {t.buyCoinsShop}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-glass h-10 w-full text-[11.5px]"
          >
            {t.later}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────── Покупка ─────────────── */

export type PurchaseCopy = {
  title: string;
  subtitle: string;
  price: string;
  coins?: number;
  kind: "coins" | "noads";
};

export function PurchaseModal({
  copy,
  status,
  lang,
  onConfirm,
  onClose,
}: {
  copy: PurchaseCopy;
  status: "idle" | "processing" | "success";
  lang: Lang;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = STRINGS[lang];
  const done = status === "success";
  return (
    <Modal onClose={status === "processing" ? undefined : onClose} z={60}>
      <div className="panel p-5 text-center">
        <div className="flex justify-end">
          <CloseButton onClick={onClose} label={t.close} />
        </div>
        <motion.span
          animate={
            done ? { scale: [1, 1.2, 1], rotate: [0, 360] } : { y: [0, -4, 0] }
          }
          transition={
            done ? { duration: 0.7 } : { repeat: Infinity, duration: 2 }
          }
          style={cut(12)}
          className="mx-auto -mt-2 grid h-16 w-16 place-items-center bg-gradient-to-b from-myst-400 to-myst-500 text-white shadow-[0_0_24px_rgba(139,98,255,0.6)]"
        >
          {done ? (
            <CheckIcon size={32} />
          ) : copy.kind === "noads" ? (
            <ShieldIcon size={32} />
          ) : (
            <CoinIcon size={38} />
          )}
        </motion.span>
        <h3 className="font-display mt-3 text-[17px] font-black uppercase tracking-[0.03em]">
          {done ? t.purchaseDone : copy.title}
        </h3>
        <p className="mt-1.5 text-[12.5px] font-semibold text-soft">
          {done
            ? copy.kind === "noads"
              ? t.doneNoAds
              : t.doneCoins
            : copy.subtitle}
        </p>
        {copy.coins && !done && (
          <p
            style={cut(8)}
            className="tnum mt-3 inline-flex items-center gap-1.5 border border-ember-300/40 bg-ember-400/15 px-4 py-1.5 font-display text-[17px] font-black text-ember-200"
          >
            <CoinIcon size={24} /> {formatNumber(copy.coins, lang)}
          </p>
        )}
        {!done && (
          <div
            style={cut(8)}
            className="mt-4 flex items-center justify-between border border-line bg-ink/10 px-4 py-2.5"
          >
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              {t.total}
            </span>
            <span className="tnum font-display text-[16px] font-black text-ember-200">
              {copy.price}
            </span>
          </div>
        )}
        <div className="mt-4 grid gap-2.5">
          {done ? (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-grape h-12 w-full text-[12.5px]"
            >
              {t.great}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={status === "processing"}
              className="btn btn-sun btn-shine h-12 w-full text-[12.5px]"
            >
              {status === "processing"
                ? t.processing
                : `${t.pay} · ${copy.price}`}
            </button>
          )}
        </div>
        {!done && (
          <p className="mt-3 text-[10.5px] font-semibold text-muted">{t.demo}</p>
        )}
      </div>
    </Modal>
  );
}

/* ─────────────── Настройки ─────────────── */

export function SettingsModal({
  lang,
  theme,
  sound,
  setTheme,
  setLang,
  onToggleSound,
  onReset,
  onClose,
}: {
  lang: Lang;
  theme: Theme;
  sound: boolean;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  onToggleSound: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const t = STRINGS[lang];
  const [confirm, setConfirm] = useState(false);
  const row = "panel-flat flex items-center justify-between gap-3 px-4 py-3";
  return (
    <Modal onClose={onClose}>
      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">{t.brand}</p>
            <h2 className="font-display mt-1 text-[18px] font-black uppercase tracking-[0.03em]">
              {t.settings}
            </h2>
          </div>
          <CloseButton onClick={onClose} label={t.close} />
        </div>

        <div className="mt-4 space-y-2.5">
          <div className={row}>
            <div>
              <p className="font-display text-[12px] font-bold uppercase tracking-[0.04em]">
                {t.theme}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted">
                {theme === "dark" ? t.dark : t.light}
              </p>
            </div>
            <ThemeToggle theme={theme} onChange={setTheme} lang={lang} />
          </div>
          <div className={row}>
            <div>
              <p className="font-display text-[12px] font-bold uppercase tracking-[0.04em]">
                {t.language}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted">
                {lang === "ru" ? "Русский" : "English"}
              </p>
            </div>
            <LangToggle lang={lang} onChange={setLang} />
          </div>
          <div className={row}>
            <p className="font-display text-[12px] font-bold uppercase tracking-[0.04em]">
              {t.sound}
            </p>
            <button
              type="button"
              onClick={onToggleSound}
              className={cn(
                "btn btn-sm !w-11 !px-0",
                sound ? "btn-mint" : "btn-glass"
              )}
              aria-label={sound ? t.muteLabel : t.unmuteLabel}
            >
              <VolumeIcon size={18} muted={!sound} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-grape h-12 w-full text-[12.5px]"
          >
            <SparklesIcon size={16} /> {t.saveClose}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm) {
                onReset();
                setConfirm(false);
              } else setConfirm(true);
            }}
            className={cn(
              "btn h-11 w-full text-[11.5px]",
              confirm ? "btn-candy" : "btn-glass"
            )}
          >
            <RefreshIcon size={15} /> {confirm ? t.resetConfirm : t.reset}
          </button>
        </div>
        <p className="mt-3 text-center font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted">
          {t.version}
        </p>
      </div>
    </Modal>
  );
}

/* ─────────────── Тост в стиле LUMEN ─────────────── */

export function Toast({
  message,
  tone = "dark",
}: {
  message: string;
  tone?: "dark" | "success" | "error";
}) {
  return (
    <motion.div
      initial={{ y: -30, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      role="status"
      style={cut(10)}
      className={cn(
        "pointer-events-none fixed left-1/2 top-[76px] z-[80] w-max max-w-[92vw] -translate-x-1/2 border px-4 py-2.5 text-center font-display text-[11.5px] font-bold uppercase tracking-[0.05em] shadow-lg backdrop-blur-md",
        tone === "success" &&
          "border-sonar-200/60 bg-gradient-to-r from-sonar-400 to-sonar-500 text-[#04030c] shadow-[0_10px_30px_-8px_rgba(35,224,182,0.85)]",
        tone === "error" &&
          "border-hot-300/60 bg-gradient-to-r from-hot-400 to-hot-500 text-white shadow-[0_10px_30px_-8px_rgba(255,47,116,0.85)]",
        tone === "dark" &&
          "border-ember-300/45 bg-[#080718]/95 text-ember-200 shadow-[0_10px_30px_-8px_rgba(4,3,12,0.9)]"
      )}
    >
      {message}
    </motion.div>
  );
}
