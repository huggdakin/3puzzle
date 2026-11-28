import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Level } from "../data/levels";
import { BLANK } from "../game/logic";
import { STRINGS, f, type Lang } from "../lib/i18n";
import { cn } from "../utils/cn";
import { CompassIcon, EyeIcon, SparklesIcon } from "./Icons";

const cut = (n = 6) => ({
  clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
});

type PuzzleBoardProps = {
  level: Level;
  tiles: number[];
  numbers: boolean;
  showPreview: boolean;
  solved: boolean;
  disabled?: boolean;
  onTileClick: (position: number) => void;
  lang: Lang;
};

const GAP = 8;
const SIZE = "calc((100% - var(--gap) * 2) / 3)";
const offset = (index: number) => `calc(${index} * (${SIZE} + var(--gap)))`;
const center = (index: number) => `calc(${index} * (${SIZE} + var(--gap)) + ${SIZE} / 2)`;

type Burst = { id: number; position: number };

const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 + 0.3;
  const dist = 34 + (i % 3) * 12;
  return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist, delay: (i % 4) * 20 };
});

export default function PuzzleBoard({
  level,
  tiles,
  numbers,
  showPreview,
  solved,
  disabled,
  onTileClick,
  lang,
}: PuzzleBoardProps) {
  const t = STRINGS[lang];
  const blankIndex = tiles.indexOf(BLANK);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const prevTiles = useRef(tiles);
  const burstId = useRef(0);

  const backgroundPos = useMemo(
    () =>
      Array.from(
        { length: 9 },
        (_, value) => `${(value % 3) * 50}% ${Math.floor(value / 3) * 50}%`
      ),
    []
  );

  // Искры вылетают, когда плитка встаёт на своё место.
  useEffect(() => {
    const before = prevTiles.current;
    prevTiles.current = tiles;
    if (before === tiles || before.length !== 9 || solved) return;
    const fresh: Burst[] = [];
    tiles.forEach((value, position) => {
      if (value !== BLANK && value === position && before[position] !== position) {
        burstId.current += 1;
        fresh.push({ id: burstId.current, position });
      }
    });
    if (fresh.length === 0) return;
    setBursts((current) => [...current, ...fresh]);
    const ids = new Set(fresh.map((item) => item.id));
    const timer = window.setTimeout(
      () => setBursts((current) => current.filter((item) => !ids.has(item.id))),
      800
    );
    return () => window.clearTimeout(timer);
  }, [tiles, solved]);

  const gap = solved ? 0 : GAP;
  const placeable = !disabled && !showPreview;

  return (
    <div className="board-frame">
      <div className="board-tray aspect-square w-full p-[10px]">
        <div
          className="relative h-full w-full"
          style={{ ["--gap" as string]: `${gap}px` } as CSSProperties}
        >
          {/* Слот-подсказка на месте пустой клетки */}
          {!solved && (
            <div
              className="board-slot grid place-items-center text-sonar-300/35"
              style={{
                width: SIZE,
                height: SIZE,
                left: offset(blankIndex % 3),
                top: offset(Math.floor(blankIndex / 3)),
              }}
              aria-hidden="true"
            >
              <CompassIcon size={26} />
            </div>
          )}

          {/* Последняя плитка проявляется при победе */}
          <motion.div
            aria-hidden="true"
            initial={false}
            animate={{ opacity: solved ? 1 : 0 }}
            transition={{ delay: solved ? 0.35 : 0, duration: 0.4 }}
            className="tile is-solved-tile"
            style={{
              width: SIZE,
              height: SIZE,
              left: offset(2),
              top: offset(2),
              backgroundImage: `url(${level.image})`,
              backgroundSize: "300% 300%",
              backgroundPosition: backgroundPos[8],
              border: 0,
              borderRadius: 0,
              boxShadow: "none",
            }}
          />

          {tiles.map((value, position) => {
            if (value === BLANK) return null;
            const home = value === position;
            return (
              <motion.button
                key={value}
                type="button"
                layout
                initial={false}
                transition={{
                  layout: { type: "spring", stiffness: 520, damping: 36, mass: 0.7 },
                }}
                whileTap={placeable ? { scale: 0.94 } : undefined}
                onClick={() => onTileClick(position)}
                disabled={!placeable}
                aria-label={f(t.tileLabel, { n: value + 1 })}
                className={cn(
                  "tile",
                  home && !solved && "is-home",
                  placeable && "is-movable",
                  solved && "!rounded-none !border-0 !shadow-none"
                )}
                style={{
                  width: SIZE,
                  height: SIZE,
                  left: offset(position % 3),
                  top: offset(Math.floor(position / 3)),
                  backgroundImage: `url(${level.image})`,
                  backgroundSize: "300% 300%",
                  backgroundOrigin: "border-box",
                  backgroundPosition: backgroundPos[value],
                }}
              >
                {numbers && !solved && (
                  <span
                    style={cut(5)}
                    className={cn(
                      "tnum pointer-events-none absolute bottom-1.5 left-1.5 z-10 grid h-6 min-w-6 place-items-center border px-1.5 font-display text-[11px] font-black backdrop-blur-xs",
                      home
                        ? "border-ember-300/80 bg-[#04030c]/92 text-ember-200"
                        : "border-white/30 bg-[#04030c]/88 text-white"
                    )}
                  >
                    {value + 1}
                  </span>
                )}
              </motion.button>
            );
          })}

          {/* Искры */}
          {bursts.map((burst) => (
            <span
              key={burst.id}
              className="pointer-events-none absolute z-30"
              style={{
                left: center(burst.position % 3),
                top: center(Math.floor(burst.position / 3)),
              }}
            >
              {SPARKS.map((spark, i) => (
                <span
                  key={i}
                  className="spark"
                  style={
                    {
                      ["--tx" as string]: `${spark.tx}px`,
                      ["--ty" as string]: `${spark.ty}px`,
                      animationDelay: `${spark.delay}ms`,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          ))}
        </div>

        {solved && <div className="board-shine" />}

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.22 }}
              style={cut(12)}
              className="absolute inset-[10px] z-20 overflow-hidden border-2 border-ember-300/85"
            >
              <img src={level.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04030c]/85 via-transparent to-transparent" />
              <span
                style={cut(7)}
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 border border-white/25 bg-[#080718]/90 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ember-200 backdrop-blur-xs"
              >
                <EyeIcon size={14} /> {t.previewLabel}
              </span>
              <span
                style={cut(7)}
                className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-ember-300 to-ember-400 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.06em] text-[#04030c]"
              >
                <SparklesIcon size={14} /> {t.previewMemo}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
