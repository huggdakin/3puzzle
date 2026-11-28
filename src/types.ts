export type CompletedLevel = {
  stars: number;
  moves: number;
  seconds: number;
  date: string;
};

export type DailyState = {
  date: string;
  solved: number;
  moves: number;
  hints: number;
  claimed: string[];
  ads: { coins: number; energy: number; hint: number };
};

export type BoardHint = {
  total: number;
  auto: number;
  done: number;
  remaining: number;
  phase: "running" | "done";
};

export type BoardSnapshot = {
  tiles: number[];
  moves: number;
  seconds: number;
  started: boolean;
  hint: BoardHint | null;
  previews: number;
};

export type SaveState = {
  coins: number;
  hints: number;
  energy: number;
  energyAt: number;
  adFree: boolean;
  currentLevel: number;
  unlocked: number[];
  completed: Record<number, CompletedLevel>;
  boards: Record<number, BoardSnapshot>;
  totalSolved: number;
  streak: number;
  lastPlayed: string;
  lastBonus: string;
  winsSinceAd: number;
  lastAdAt: number;
  numbers: boolean;
  sound: boolean;
  daily: DailyState;
};

export type Screen = "play" | "collection" | "shop";

export type WinResult = {
  levelId: number;
  moves: number;
  seconds: number;
  stars: number;
  coins: number;
  firstTime: boolean;
  doubled: boolean;
};

export type TaskProgress = {
  solved: number;
  moves: number;
  hints: number;
  claimed: string[];
};
