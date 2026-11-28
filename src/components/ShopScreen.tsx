import type { ReactNode } from "react";
import { motion } from "motion/react";
import { COIN_PACKS, ECON, PRODUCT_NO_ADS, adLeft } from "../data/economy";
import type { DailyState } from "../types";
import { STRINGS, f, formatNumber, type Lang } from "../lib/i18n";
import { cn } from "../utils/cn";
import {
  BoltIcon,
  CheckIcon,
  CoinIcon,
  CompassIcon,
  GiftIcon,
  ShieldIcon,
  VideoIcon,
} from "./Icons";

const cut = (n = 8) => ({
  clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
});

type ShopScreenProps = {
  lang: Lang;
  coins: number;
  hints: number;
  energy: number;
  energyMax: number;
  refillPrice: number;
  premium: boolean;
  daily: DailyState;
  allOpen: boolean;
  onWatchCoins: () => void;
  onWatchEnergy: () => void;
  onRefillEnergy: () => void;
  onOpenCoinPack: (pack: (typeof COIN_PACKS)[number]) => void;
  onOpenNoAds: () => void;
  onBuyHints: () => void;
  onUnlockAll: () => void;
};

const PACK_COPY = {
  pack_small: {
    title: "packSmallT",
    sub: "packSmallS",
    grad: "from-sonar-300/20 to-sonar-500/25",
    count: 1,
  },
  pack_medium: {
    title: "packMediumT",
    sub: "packMediumS",
    grad: "from-ember-300/30 to-ember-500/30",
    count: 3,
  },
  pack_large: {
    title: "packLargeT",
    sub: "packLargeS",
    grad: "from-myst-300/25 to-myst-500/30",
    count: 5,
  },
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-3 px-1">
        <span className="h-2 w-2 shrink-0 bg-ember-300 shadow-[0_0_8px_#ffb03a]" />
        <h2 className="ui-shadow font-display text-[12px] font-bold uppercase tracking-[0.2em] text-ember-200">
          {title}
        </h2>
        <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
      </div>
      {children}
    </section>
  );
}

export default function ShopScreen(p: ShopScreenProps) {
  const t = STRINGS[p.lang];
  const coinAds = adLeft(p.daily, "coins");
  const energyAds = adLeft(p.daily, "energy");

  return (
    <div className="animate-pop mx-auto w-full max-w-[780px]">
      {/* Баланс */}
      <div className="panel relative overflow-hidden p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-ember-400/25 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{t.shopSub}</p>
            <h1 className="title-grad font-display mt-1 text-[20px] font-black uppercase leading-tight tracking-[-0.02em] sm:text-[24px]">
              {t.shopTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip !py-1.5 tnum">
              <CompassIcon size={16} className="text-ember-300" /> {p.hints}
            </span>
            <motion.span
              key={p.coins}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              style={cut(8)}
              className="tnum flex items-center gap-1.5 border border-ember-200/50 bg-gradient-to-r from-ember-300 via-ember-400 to-ember-500 py-1.5 pl-2.5 pr-3.5 font-display text-[15px] font-black text-[#04030c] shadow-[0_8px_28px_-8px_rgba(255,176,58,0.85)]"
            >
              <CoinIcon size={23} /> {formatNumber(p.coins, p.lang)}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Бесплатное снабжение */}
      <Section title={t.freeSection}>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={p.onWatchCoins}
            disabled={coinAds <= 0}
            className="btn btn-sun btn-shine h-[74px] justify-start gap-3 px-4 text-left"
          >
            <span
              style={cut(7)}
              className="grid h-11 w-11 shrink-0 place-items-center bg-[#04030c]/90 text-ember-300"
            >
              <VideoIcon size={21} />
            </span>
            <span className="min-w-0 flex-1 whitespace-normal">
              <span className="block text-[13px] font-black leading-tight">
                {f(t.watchCoins, { n: ECON.adCoins })}
              </span>
              <span className="mt-1 block text-[10px] font-bold opacity-80">
                {coinAds > 0 ? f(t.adLeft, { n: coinAds }) : t.adLimitReached}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={p.onWatchEnergy}
            disabled={energyAds <= 0 || p.energy >= p.energyMax}
            className="btn btn-sky btn-shine h-[74px] justify-start gap-3 px-4 text-left"
          >
            <span
              style={cut(7)}
              className="grid h-11 w-11 shrink-0 place-items-center bg-[#04030c]/90 text-sonar-300"
            >
              <BoltIcon size={21} />
            </span>
            <span className="min-w-0 flex-1 whitespace-normal">
              <span className="block text-[13px] font-black leading-tight">
                {f(t.watchEnergy, { n: ECON.adEnergy })}
              </span>
              <span className="mt-1 block text-[10px] font-bold opacity-80">
                {energyAds > 0 ? f(t.adLeft, { n: energyAds }) : t.adLimitReached}
              </span>
            </span>
          </button>
        </div>
      </Section>

      {/* Энергия */}
      <Section title={t.energySection}>
        <div className="panel flex flex-wrap items-center gap-3.5 p-4">
          <span
            style={cut(8)}
            className="grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-b from-sonar-300 to-sonar-500 text-[#04030c] shadow-[0_0_20px_rgba(35,224,182,0.5)]"
          >
            <BoltIcon size={25} />
          </span>
          <div className="min-w-[140px] flex-1">
            <p className="font-display text-[13px] font-black uppercase tracking-[0.04em]">
              {f(t.energyHave, { a: p.energy, b: p.energyMax })}
            </p>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: p.energyMax }, (_, i) => (
                <span
                  key={i}
                  style={cut(3)}
                  className={cn(
                    "h-2.5 flex-1",
                    i < p.energy
                      ? "bg-gradient-to-r from-sonar-300 to-sonar-500 shadow-[0_0_10px_rgba(35,224,182,0.6)]"
                      : "bg-ink/15"
                  )}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={p.onRefillEnergy}
            disabled={p.energy >= p.energyMax}
            className="btn btn-sun btn-sm !min-h-11 px-4 text-[11.5px]"
          >
            {t.energyRefill}
            <span
              style={cut(5)}
              className="tnum flex items-center gap-1 bg-[#04030c]/90 px-2.5 py-0.5 text-ember-200"
            >
              <CoinIcon size={13} /> {p.refillPrice}
            </span>
          </button>
        </div>
      </Section>

      {/* Пакеты монет */}
      <Section title={t.packs}>
        <div className="grid gap-3.5 sm:grid-cols-3">
          {COIN_PACKS.map((pack, i) => {
            const copy = PACK_COPY[pack.id];
            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={cn(
                  "panel relative flex flex-col items-center p-4 text-center",
                  pack.popular && "!border-ember-300"
                )}
              >
                <div
                  style={cut(10)}
                  className={cn(
                    "relative grid h-20 w-full place-items-center border border-line bg-gradient-to-b",
                    copy.grad
                  )}
                >
                  {pack.popular && (
                    <span
                      style={cut(5)}
                      className="absolute right-2 top-2 bg-gradient-to-r from-ember-300 to-ember-500 px-2.5 py-0.5 font-display text-[9px] font-black uppercase tracking-[0.08em] text-[#04030c] shadow-xs"
                    >
                      {t.popular}
                    </span>
                  )}
                  <div className="flex -space-x-2.5">
                    {Array.from({ length: copy.count }, (_, k) => (
                      <motion.span
                        key={k}
                        animate={{ y: [0, -3.5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2 + k * 0.3,
                          delay: k * 0.2,
                        }}
                      >
                        <CoinIcon size={34} />
                      </motion.span>
                    ))}
                  </div>
                </div>
                <p className="tnum font-display mt-3 flex items-center gap-1 text-[19px] font-black text-ember-200">
                  {formatNumber(pack.coins, p.lang)}
                </p>
                <p className="font-display text-[11.5px] font-black uppercase tracking-[0.04em]">
                  {t[copy.title]}
                </p>
                <p className="mt-1 min-h-[32px] text-[11px] font-semibold text-muted">
                  {pack.bonus > 0
                    ? f(t[copy.sub], { n: pack.bonus })
                    : t[copy.sub]}
                </p>
                <button
                  type="button"
                  onClick={() => p.onOpenCoinPack(pack)}
                  className="btn btn-grape mt-2 h-11 w-full text-[12.5px]"
                >
                  {pack.price} ₽
                </button>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Премиум и снаряжение */}
      <Section title={t.premium}>
        <div className="grid gap-3">
          <div className="panel relative flex flex-wrap items-center gap-3.5 overflow-hidden p-4">
            <span
              style={cut(8)}
              className="grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-b from-myst-400 to-myst-500 text-white shadow-[0_0_20px_rgba(139,98,255,0.5)]"
            >
              <ShieldIcon size={25} />
            </span>
            <div className="min-w-[160px] flex-1">
              <p className="font-display text-[13.5px] font-black uppercase tracking-[0.03em]">
                {t.premiumTitle}
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-muted">
                {t.premiumSub}
              </p>
            </div>
            <button
              type="button"
              onClick={p.onOpenNoAds}
              disabled={p.premium}
              className={cn(
                "btn h-11 px-5 text-[12.5px]",
                p.premium ? "btn-glass" : "btn-sun btn-shine"
              )}
            >
              {p.premium ? (
                <>
                  <CheckIcon size={16} /> {t.premiumActive}
                </>
              ) : (
                `${PRODUCT_NO_ADS.price} ₽`
              )}
            </button>
          </div>

          <div className="panel flex flex-wrap items-center gap-3.5 p-4">
            <span
              style={cut(8)}
              className="grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-b from-ember-300 to-ember-500 text-[#04030c] shadow-[0_0_20px_rgba(255,176,58,0.5)]"
            >
              <CompassIcon size={25} />
            </span>
            <div className="min-w-[160px] flex-1">
              <p className="font-display text-[13.5px] font-black uppercase tracking-[0.03em]">
                {t.hintsPack}
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-muted">
                {f(t.hintsPackSub, { n: ECON.hintsPackSize })}
              </p>
            </div>
            <button
              type="button"
              onClick={p.onBuyHints}
              className="btn btn-sun h-11 px-4 text-[12.5px]"
            >
              <CoinIcon size={18} /> {ECON.hintsPackPrice}
            </button>
          </div>

          <div className="panel flex flex-wrap items-center gap-3.5 p-4">
            <span
              style={cut(8)}
              className="grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-b from-sonar-300 to-sonar-500 text-[#04030c] shadow-[0_0_20px_rgba(35,224,182,0.5)]"
            >
              <CompassIcon size={25} />
            </span>
            <div className="min-w-[160px] flex-1">
              <p className="font-display text-[13.5px] font-black uppercase tracking-[0.03em]">
                {t.albumTitle}
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-muted">
                {t.albumSub}
              </p>
            </div>
            <button
              type="button"
              onClick={p.onUnlockAll}
              disabled={p.allOpen}
              className="btn btn-mint h-11 px-4 text-[12.5px]"
            >
              {p.allOpen ? (
                <>
                  <CheckIcon size={16} /> {t.owned}
                </>
              ) : (
                <>
                  <CoinIcon size={18} />{" "}
                  {formatNumber(ECON.unlockAlbumPrice, p.lang)}
                </>
              )}
            </button>
          </div>
        </div>
      </Section>

      {/* Памятка */}
      <div className="panel mt-6 p-4">
        <p className="flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-ember-200">
          <GiftIcon size={17} className="text-ember-300" /> {t.ecoTitle}
        </p>
        <ul className="mt-2.5 space-y-1.5 text-[12px] font-semibold text-soft">
          <li>• {t.eco1}</li>
          <li>• {t.eco2}</li>
          <li>• {t.eco3}</li>
        </ul>
        <p className="mt-3 text-[10.5px] font-semibold text-muted">{t.demo}</p>
      </div>
    </div>
  );
}
