import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CHAPTERS,
  DIFFICULTY_DOTS,
  LEVELS,
  isLevelOpen,
  type Level,
} from "../data/levels";
import { ECON } from "../data/economy";
import type { CompletedLevel } from "../types";
import { cn } from "../utils/cn";
import { STRINGS, f, getExplorerRank, type Lang, type TKey } from "../lib/i18n";
import {
  CheckIcon,
  CoinIcon,
  CompassIcon,
  LockIcon,
  PlayIcon,
  SparklesIcon,
  StarIcon,
  Stars,
} from "./Icons";

const cut = (n = 8) => ({
  clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
});

type CollectionScreenProps = {
  currentLevel: number;
  completed: Record<number, CompletedLevel>;
  unlocked: number[];
  coins: number;
  totalStars: number;
  lang: Lang;
  onPlay: (levelId: number) => void;
  onUnlock: (level: Level) => void;
};

type Filter = "all" | "open" | "locked";

const DIFF_KEY: Record<Level["difficulty"], TKey> = {
  easy: "diffEasy",
  medium: "diffMedium",
  hard: "diffHard",
  expert: "diffExpert",
};

export default function CollectionScreen({
  currentLevel,
  completed,
  unlocked,
  coins,
  totalStars,
  lang,
  onPlay,
  onUnlock,
}: CollectionScreenProps) {
  const t = STRINGS[lang];
  const [filter, setFilter] = useState<Filter>("all");
  const [chapterFilter, setChapterFilter] = useState<number>(0);
  const [visible, setVisible] = useState(12);

  const levels = useMemo(
    () =>
      LEVELS.filter((level) => {
        if (chapterFilter !== 0 && level.chapterId !== chapterFilter) return false;
        const open = isLevelOpen(level, completed, unlocked, totalStars);
        if (filter === "open") return open;
        if (filter === "locked") return !open;
        return true;
      }),
    [filter, chapterFilter, completed, unlocked, totalStars]
  );

  const openedCount = LEVELS.filter((level) =>
    isLevelOpen(level, completed, unlocked, totalStars)
  ).length;
  const collected = Object.keys(completed).length;
  const explorerRank = getExplorerRank(collected, lang);

  return (
    <div className="animate-pop">
      {/* Шапка Атласа в стиле LUMEN */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">
                {collected} / {LEVELS.length} · {t.collected.toLowerCase()}
              </p>
              <span
                style={cut(6)}
                className="inline-flex items-center gap-1 border border-sonar-400/35 bg-sonar-400/15 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-sonar-300"
              >
                <CompassIcon size={13} /> {t.rankLabel}: {explorerRank}
              </span>
            </div>
            <h1 className="title-grad font-display mt-1 text-[20px] font-black uppercase leading-tight tracking-[-0.02em] sm:text-[24px]">
              {t.collectionTitle}
            </h1>
            <p className="mt-1 text-[12px] font-semibold text-soft">
              {t.collectionSub}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="panel-flat px-3.5 py-2 text-center">
              <p className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                {t.opened}
              </p>
              <p className="tnum mt-0.5 font-display text-[16px] font-black leading-tight">
                {openedCount}
                <span className="text-[11px] text-muted"> / {LEVELS.length}</span>
              </p>
            </div>
            <div className="panel-flat px-3.5 py-2 text-center">
              <p className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                {t.stars}
              </p>
              <p className="tnum mt-0.5 flex items-center justify-center gap-1 font-display text-[16px] font-black leading-tight text-ember-200">
                <StarIcon size={15} filled className="text-ember-300" /> {totalStars}
              </p>
            </div>
          </div>
        </div>
        <div className="bar mt-3.5">
          <span style={{ width: `${(collected / LEVELS.length) * 100}%` }} />
        </div>
      </div>

      {/* Панель фильтров: статус + главы экспедиции */}
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Вкладки статуса */}
        <div className="panel flex items-center gap-1 p-1.5 sm:w-max">
          {(
            [
              { id: "all", label: t.filterAll },
              { id: "open", label: t.filterOpen },
              { id: "locked", label: t.filterLocked },
            ] as const
          ).map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFilter(item.id);
                  setVisible(12);
                }}
                style={cut(7)}
                className={cn(
                  "flex-1 px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.06em] transition-all sm:flex-none",
                  active
                    ? "bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 text-[#04030c] shadow-[0_0_20px_-4px_rgba(255,176,58,0.85)]"
                    : "text-soft hover:text-ink"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Фильтр по 5 главам маршрута */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => {
              setChapterFilter(0);
              setVisible(12);
            }}
            style={cut(7)}
            className={cn(
              "shrink-0 border px-3.5 py-2 font-display text-[10.5px] font-bold uppercase tracking-[0.06em] transition-all",
              chapterFilter === 0
                ? "border-ember-300/60 bg-gradient-to-r from-ember-300 to-ember-500 text-[#04030c] shadow-[0_0_16px_-4px_rgba(255,176,58,0.8)]"
                : "border-white/20 bg-[#080718]/80 text-white/90 backdrop-blur-xs hover:border-white/40 hover:bg-[#161238]"
            )}
          >
            {t.allChapters}
          </button>
          {CHAPTERS.map((ch) => {
            const active = chapterFilter === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setChapterFilter(ch.id);
                  setVisible(12);
                }}
                style={cut(7)}
                className={cn(
                  "shrink-0 border px-3.5 py-2 font-display text-[10.5px] font-bold uppercase tracking-[0.06em] transition-all",
                  active
                    ? "border-ember-300/60 bg-gradient-to-r from-ember-300 to-ember-500 text-[#04030c] shadow-[0_0_16px_-4px_rgba(255,176,58,0.8)]"
                    : "border-white/20 bg-[#080718]/80 text-white/90 backdrop-blur-xs hover:border-white/40 hover:bg-[#161238]"
                )}
              >
                {lang === "ru" ? ch.titleRu : ch.titleEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Сетка карточек локаций */}
      {levels.length === 0 ? (
        <div className="panel mt-4 flex flex-col items-center gap-2 p-10 text-center">
          <SparklesIcon size={30} className="text-ember-300" />
          <p className="font-display text-[14px] font-black uppercase tracking-[0.04em]">
            {t.emptyTitle}
          </p>
          <p className="text-[12px] font-semibold text-muted">{t.emptySub}</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {levels.slice(0, visible).map((level, index) => {
            const open = isLevelOpen(level, completed, unlocked, totalStars);
            const record = completed[level.id];
            const current = level.id === currentLevel;
            const title = lang === "ru" ? level.titleRu : level.titleEn;
            const region = lang === "ru" ? level.regionRu : level.regionEn;

            return (
              <motion.article
                key={level.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: Math.min(index, 8) * 0.035,
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
                whileHover={{ y: -3 }}
                className={cn(
                  "panel flex flex-col overflow-hidden p-2",
                  current && "!border-ember-300"
                )}
              >
                <div
                  style={cut(10)}
                  className="relative aspect-[4/3] overflow-hidden border border-white/15"
                >
                  <img
                    src={level.thumb}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-500",
                      open
                        ? "hover:scale-105"
                        : "scale-105 blur-[2.5px] saturate-50"
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04030c]/85 via-transparent to-transparent" />
                  <span
                    style={{ ...cut(5), background: level.accent }}
                    className="tnum absolute left-2 top-2 px-2 py-0.5 font-display text-[10px] font-black text-white shadow-xs"
                  >
                    #{String(level.id).padStart(2, "0")}
                  </span>
                  {current && (
                    <span
                      style={cut(5)}
                      className="absolute right-2 top-2 bg-gradient-to-r from-ember-300 to-ember-400 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-[0.06em] text-[#04030c]"
                    >
                      {t.current}
                    </span>
                  )}
                  {!open && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span
                        style={cut(8)}
                        className="grid h-11 w-11 place-items-center border border-white/25 bg-[#04030c]/85 text-white backdrop-blur-xs"
                      >
                        <LockIcon size={20} />
                      </span>
                    </span>
                  )}
                  {record && (
                    <span
                      style={cut(5)}
                      className="absolute bottom-2 left-2 bg-[#04030c]/85 px-2 py-0.5 backdrop-blur-xs"
                    >
                      <Stars value={record.stars} size={13} />
                    </span>
                  )}
                  {record && (
                    <span
                      style={cut(5)}
                      className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center bg-sonar-400 text-[#04030c]"
                    >
                      <CheckIcon size={14} />
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-2 pt-2.5">
                  <div>
                    <p className="truncate font-display text-[9px] font-bold uppercase tracking-[0.14em] text-sonar-300">
                      {region}
                    </p>
                    <p className="mt-0.5 flex items-center justify-between gap-1 font-display text-[12.5px] font-black uppercase tracking-[-0.01em]">
                      <span className="truncate">{title}</span>
                      <span className="inline-flex shrink-0 gap-[3px]">
                        {[1, 2, 3, 4].map((n) => (
                          <span
                            key={n}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              n <= DIFFICULTY_DOTS[level.difficulty]
                                ? "bg-ember-300"
                                : "bg-ink/20"
                            )}
                          />
                        ))}
                      </span>
                    </p>
                    <p className="tnum mt-0.5 truncate text-[10.5px] font-semibold text-soft">
                      {record
                        ? `${t.record}: ${f(t.recordMoves, { n: record.moves })}`
                        : t[DIFF_KEY[level.difficulty]]}
                    </p>
                  </div>

                  {open ? (
                    <button
                      type="button"
                      onClick={() => onPlay(level.id)}
                      className="btn btn-grape btn-sm mt-2.5 w-full"
                    >
                      <PlayIcon size={13} />{" "}
                      {current ? t.continueBtn : t.playBtn}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUnlock(level)}
                      className={cn(
                        "btn btn-sm mt-2.5 w-full",
                        coins >= ECON.unlockLevelPrice ? "btn-sun" : "btn-glass"
                      )}
                    >
                      <CoinIcon size={14} />{" "}
                      {f(t.unlockFor, { n: ECON.unlockLevelPrice })}
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {visible < levels.length && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((value) => value + 12)}
            className="btn btn-sun px-8"
          >
            {t.showMore}
          </button>
        </div>
      )}
    </div>
  );
}
