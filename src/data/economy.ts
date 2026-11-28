/**
 * ЭКОНОМИКА ТАЙЛОПИИ
 * ------------------------------------------------------------------
 * Идея: игра бесплатная и щедрая в начале, но через 10–15 минут игры
 * игроку становится выгодно либо подождать, либо посмотреть рекламу,
 * либо купить монеты / Премиум.
 *
 * Валюты:
 *  • Монеты   — мягкая валюта (подсказки, открытие островов, заправка энергии).
 *  • Энергия  — «топливо» для новой партии. Одна новая партия = 1 энергия.
 *               Регенерация: 1 единица за 15 минут.
 *  • Подсказки — расходник (в инвентаре) либо покупаются за монеты.
 *
 * Источники:
 *  • Победа (снижено на 40%): первый раз 8 + 5×звёзды (13–23 монеты), повтор — 2 монеты.
 *  • Ежедневный вход: 20 + 5×серия (до 50).
 *  • Ежедневные задания: 25 / 15 / 20 монет.
 *  • Реклама за награду (с суточными лимитами): +40 монет, +3 энергии, бесплатная подсказка.
 *  • «×2 за рекламу» на экране победы.
 *
 * Стоки (куда уходят монеты):
 *  • Подсказка (после первых 2 бесплатных — в 2 раза дороже): (40 + 2×номер острова, округлено до 5) × 2 (80 … 280).
 *  • Заправка энергии: 20 монет за каждую недостающую единицу.
 *  • Повторный «Образец» в одной партии: 5 монет.
 *  • Открытие острова вне очереди: 150 монет. Весь архипелаг: 1500 монет.
 *  • Набор из 5 подсказок: 400 монет.
 *
 * Премиум («без рекламы»): нет принудительной рекламы, ёмкость энергии 8
 * вместо 5 и +50% монет за победу.
 */

export const ECON = {
  startCoins: 120,
  startHints: 2,
  startEnergy: 5,

  energyMax: 5,
  energyMaxPremium: 8,
  energyRegenMs: 15 * 60 * 1000,
  energyPerMissing: 20,

  winFirstBase: 8,
  winPerStar: 5,
  winRepeat: 2,
  premiumWinMultiplier: 1.5,

  dailyBonusBase: 20,
  dailyBonusPerStreak: 5,
  dailyBonusMaxStreak: 6,

  adCoins: 40,
  adEnergy: 3,
  adLimits: { coins: 5, energy: 4, hint: 4 },

  previewCost: 5,
  hintsPackSize: 5,
  hintsPackPrice: 400,
  unlockLevelPrice: 150,
  unlockAlbumPrice: 1500,

  interstitialEveryWins: 3,
  interstitialMinGapMs: 2 * 60 * 1000,
} as const;

export type AdKind = keyof typeof ECON.adLimits;

export function hintPrice(levelId: number): number {
  return Math.round((40 + levelId * 2) / 5) * 10;
}

export function winReward(stars: number, firstTime: boolean, premium: boolean): number {
  const base = firstTime ? ECON.winFirstBase + ECON.winPerStar * stars : ECON.winRepeat;
  return premium ? Math.floor(base * ECON.premiumWinMultiplier) : base;
}

export function dailyBonus(streak: number): number {
  return ECON.dailyBonusBase + ECON.dailyBonusPerStreak * Math.min(Math.max(streak - 1, 0), ECON.dailyBonusMaxStreak);
}

export function energyCap(premium: boolean): number {
  return premium ? ECON.energyMaxPremium : ECON.energyMax;
}

export type EnergyState = { energy: number; energyAt: number };

/** Применяет регенерацию к сохранённому значению энергии на момент `now`. */
export function regenEnergy(state: EnergyState, premium: boolean, now: number): EnergyState {
  const cap = energyCap(premium);
  if (state.energy >= cap) return { energy: state.energy, energyAt: now };
  const gained = Math.max(0, Math.floor((now - state.energyAt) / ECON.energyRegenMs));
  if (gained === 0) return state;
  const energy = Math.min(cap, state.energy + gained);
  return { energy, energyAt: energy >= cap ? now : state.energyAt + gained * ECON.energyRegenMs };
}

export function msToNextEnergy(state: EnergyState, premium: boolean, now: number): number {
  const cur = regenEnergy(state, premium, now);
  if (cur.energy >= energyCap(premium)) return 0;
  return Math.max(0, cur.energyAt + ECON.energyRegenMs - now);
}

export const COIN_PACKS = [
  { id: "pack_small", price: 99, coins: 300, popular: false, bonus: 0 },
  { id: "pack_medium", price: 249, coins: 900, popular: true, bonus: 150 },
  { id: "pack_large", price: 499, coins: 2000, popular: false, bonus: 500 },
] as const;

export const PRODUCT_NO_ADS = { id: "no_ads", price: 299 } as const;

export const DAILY_TASKS = [
  { id: "solve", goal: 3, reward: 25 },
  { id: "moves", goal: 60, reward: 15 },
  { id: "hint", goal: 1, reward: 20 },
] as const;

export type DailyTaskId = (typeof DAILY_TASKS)[number]["id"];

export function adLeft(daily: { ads?: Partial<Record<AdKind, number>> }, kind: AdKind): number {
  return Math.max(0, ECON.adLimits[kind] - (daily.ads?.[kind] ?? 0));
}
