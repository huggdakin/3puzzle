import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Screen } from "../types";
import { cn } from "../utils/cn";
import { STRINGS, f, formatNumber, type Lang } from "../lib/i18n";
import { formatCountdown } from "../lib/useNow";
import type { Theme } from "../lib/prefs";
import { LangToggle, ThemeToggle } from "./Toggles";
import {
  BagIcon,
  BoltIcon,
  CoinIcon,
  CompassIcon,
  LogoMark,
  PlayIcon,
  SettingsIcon,
  VolumeIcon,
} from "./Icons";

const NAV = [
  { id: "play", key: "play", icon: PlayIcon },
  { id: "collection", key: "collection", icon: CompassIcon },
  { id: "shop", key: "shop", icon: BagIcon },
] as const;

const cut = (n = 8) => ({
  clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
});

type HeaderProps = {
  screen: Screen;
  coins: number;
  energy: number;
  energyMax: number;
  nextEnergyMs: number;
  sound: boolean;
  onNavigate: (screen: Screen) => void;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenEnergy: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
};

/** Показывает «+N» над счётчиком, когда баланс растёт. */
function useDelta(value: number) {
  const prev = useRef(value);
  const [delta, setDelta] = useState<{ id: number; amount: number } | null>(null);
  useEffect(() => {
    if (value > prev.current) {
      setDelta({ id: Date.now(), amount: value - prev.current });
      const timer = window.setTimeout(() => setDelta(null), 1300);
      prev.current = value;
      return () => window.clearTimeout(timer);
    }
    prev.current = value;
  }, [value]);
  return delta;
}

export default function Header({
  screen,
  coins,
  energy,
  energyMax,
  nextEnergyMs,
  sound,
  onNavigate,
  onToggleSound,
  onOpenSettings,
  onOpenEnergy,
  theme,
  setTheme,
  lang,
  setLang,
}: HeaderProps) {
  const t = STRINGS[lang];
  const delta = useDelta(coins);
  const low = energy === 0;

  return (
    <header className="sticky top-0 z-40 px-2.5 pt-2.5 sm:px-5 sm:pt-3">
      <div className="panel mx-auto flex min-h-[62px] max-w-[1180px] items-center justify-between gap-2 px-3 py-2 sm:min-h-[66px] sm:gap-3 sm:px-4 sm:py-2.5">
        {/* Логотип и бренд в стиле LUMEN */}
        <motion.button
          type="button"
          onClick={() => onNavigate("play")}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex min-w-0 shrink-0 items-center gap-2.5 py-0.5 pr-1 text-left focus-visible:outline-none"
          aria-label={t.homeLabel}
        >
          <LogoMark size={38} />
          <span className="hidden min-w-0 text-left leading-none min-[400px]:block">
            <span className="title-grad block truncate font-display text-[15px] font-black uppercase leading-tight tracking-[-0.02em] sm:text-[17px]">
              {t.brand}
            </span>
            <span className="mt-1 flex items-center gap-1.5 truncate font-display text-[8.5px] font-bold uppercase tracking-[0.22em] text-sonar-300">
              <span className="h-1.5 w-1.5 shrink-0 animate-breathe rounded-full bg-sonar-400" />
              <span className="truncate">{t.tagline}</span>
            </span>
          </span>
        </motion.button>

        {/* Центральная навигация (ПК и планшеты) */}
        <nav
          aria-label="Основная навигация"
          style={cut(10)}
          className="hidden shrink-0 items-center gap-1 border border-line bg-ink/[0.06] p-1.5 md:flex"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? "page" : undefined}
                style={cut(7)}
                className={cn(
                  "relative flex h-9 items-center justify-center gap-2 px-3.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] leading-none transition-colors lg:px-4",
                  active ? "text-[#04030c]" : "text-soft hover:text-ink"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="desk-nav-pill"
                    style={cut(7)}
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 shadow-[0_0_24px_-4px_rgba(255,176,58,0.85)]"
                    transition={{ type: "spring", stiffness: 460, damping: 36 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                  <Icon size={15} />
                  <span>{t[item.key]}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Правая группа статусов и управления */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Индикатор энергии */}
          <motion.button
            type="button"
            onClick={onOpenEnergy}
            whileTap={{ scale: 0.94 }}
            aria-label={f(t.energyLabel, { a: energy, b: energyMax })}
            style={cut(8)}
            className={cn(
              "relative flex h-9 items-center gap-1.5 border pl-1.5 pr-2.5 font-display font-bold transition-all sm:h-10 sm:pl-1.5 sm:pr-3",
              low
                ? "border-candy/60 bg-candy/15 text-hot-300"
                : "border-line bg-solid/90 text-ink hover:border-sonar-400/50"
            )}
          >
            <span
              style={cut(5)}
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center bg-gradient-to-b from-sonar-300 to-sonar-500 text-[#04030c] shadow-[0_0_12px_rgba(35,224,182,0.5)]",
                low && "animate-beat"
              )}
            >
              <BoltIcon size={14} />
            </span>
            <span className="flex flex-col items-start justify-center leading-none">
              <span className="tnum text-[11px] font-black sm:text-[12px]">
                {energy}
                <span className="text-muted">/{energyMax}</span>
              </span>
              {energy < energyMax && (
                <span className="tnum mt-0.5 text-[8.5px] font-bold text-sonar-300">
                  {formatCountdown(nextEnergyMs)}
                </span>
              )}
            </span>
          </motion.button>

          {/* Баланс монет */}
          <motion.button
            type="button"
            onClick={() => onNavigate("shop")}
            whileTap={{ scale: 0.94 }}
            aria-label={f(t.coinsLabel, { n: coins })}
            style={cut(8)}
            className="relative flex h-9 items-center gap-1.5 border border-ember-200/50 bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 pl-1.5 pr-1.5 font-display text-[#04030c] shadow-[0_6px_24px_-8px_rgba(255,176,58,0.85)] sm:h-10 sm:pl-2 sm:pr-2"
          >
            <CoinIcon size={20} className="shrink-0" />
            <motion.span
              key={coins}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 16 }}
              className="tnum min-w-[1.5ch] text-[12px] font-black sm:text-[13px]"
            >
              {formatNumber(coins, lang)}
            </motion.span>
            <span
              style={cut(4)}
              className="grid h-5 w-5 shrink-0 place-items-center bg-[#04030c] text-[12px] font-black leading-none text-ember-300 sm:h-6 sm:w-6 sm:text-[13px]"
            >
              +
            </span>
            <AnimatePresence>
              {delta && (
                <span key={delta.id} className="coin-float">
                  +{delta.amount}
                </span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Кнопка звука */}
          <button
            type="button"
            onClick={onToggleSound}
            style={cut(8)}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center border transition-all hover:-translate-y-0.5 sm:h-10 sm:w-10",
              sound
                ? "border-line bg-solid/90 text-ink hover:border-ember-300/50"
                : "border-candy/45 bg-candy/15 text-hot-300"
            )}
            aria-label={sound ? t.muteLabel : t.unmuteLabel}
            title={sound ? t.muteLabel : t.unmuteLabel}
          >
            <VolumeIcon size={17} muted={!sound} />
          </button>

          {/* Переключатели темы и языка на широких экранах */}
          <div className="hidden items-center gap-1.5 xl:flex">
            <ThemeToggle theme={theme} onChange={setTheme} lang={lang} />
            <LangToggle lang={lang} onChange={setLang} />
          </div>

          {/* Кнопка настроек */}
          <button
            type="button"
            onClick={onOpenSettings}
            style={cut(8)}
            className="grid h-9 w-9 shrink-0 place-items-center border border-line bg-solid/90 text-ink transition-all hover:-translate-y-0.5 hover:border-ember-300/50 sm:h-10 sm:w-10"
            aria-label={t.openSettings}
            title={t.openSettings}
          >
            <SettingsIcon size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({
  screen,
  onNavigate,
  lang,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  lang: Lang;
}) {
  const t = STRINGS[lang];
  return (
    <nav
      aria-label="Мобильная навигация"
      className="panel fixed inset-x-3 bottom-3 z-40 p-1.5 md:hidden"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
    >
      <div
        style={cut(10)}
        className="grid grid-cols-3 gap-1.5 bg-ink/[0.06] p-1"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              style={cut(7)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 font-display text-[10px] font-bold uppercase tracking-[0.06em] leading-tight transition-colors",
                active ? "text-[#04030c]" : "text-soft hover:text-ink"
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  style={cut(7)}
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 shadow-[0_0_20px_-4px_rgba(255,176,58,0.85)]"
                  transition={{ type: "spring", stiffness: 460, damping: 36 }}
                />
              )}
              <motion.span
                className="relative z-10"
                animate={
                  active ? { y: [0, -2, 0], scale: [1, 1.1, 1] } : { y: 0 }
                }
                transition={{ duration: 0.3 }}
              >
                <Icon size={18} />
              </motion.span>
              <span className="relative z-10 max-w-full truncate">
                {t[item.key]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
