import { BLANK } from "./logic";

/**
 * Решатель пятнашки 3×3.
 *
 * Состояние — массив из 9 чисел: значение = номер плитки (0..7), 8 = пустая клетка.
 * Цель — SOLVED (плитки по порядку, пустая клетка справа снизу).
 *
 * Используется A* с манхэттенской эвристикой: для 3×3 он находит гарантированно
 * кратчайший путь за считанные миллисекунды. Возвращаются позиции, на которые
 * игроку нужно нажимать по порядку.
 */

export type SolverResult = {
  moves: number[];
  tileByMove: number[];
  length: number;
};

type Node = {
  state: number[];
  key: string;
  g: number;
  h: number;
  f: number;
};

class MinHeap {
  private items: Node[] = [];

  get size() {
    return this.items.length;
  }

  push(node: Node) {
    this.items.push(node);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.items[parent].f <= this.items[index].f) break;
      [this.items[parent], this.items[index]] = [this.items[index], this.items[parent]];
      index = parent;
    }
  }

  pop(): Node | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (!top || !last) return top;
    if (this.items.length > 0) {
      this.items[0] = last;
      let index = 0;
      for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < this.items.length && this.items[left].f < this.items[smallest].f) smallest = left;
        if (right < this.items.length && this.items[right].f < this.items[smallest].f) smallest = right;
        if (smallest === index) break;
        [this.items[smallest], this.items[index]] = [this.items[index], this.items[smallest]];
        index = smallest;
      }
    }
    return top;
  }
}

const keyOf = (state: number[]) => state.join("");

const neighboursCache = new Map<string, { key: string; state: number[]; action: number }[]>();

function neighbours(state: number[]): { key: string; state: number[]; action: number }[] {
  const key = keyOf(state);
  const cached = neighboursCache.get(key);
  if (cached) return cached;

  const blank = state.indexOf(BLANK);
  const row = Math.floor(blank / 3);
  const col = blank % 3;
  const positions: number[] = [];
  if (row > 0) positions.push(blank - 3);
  if (row < 2) positions.push(blank + 3);
  if (col > 0) positions.push(blank - 1);
  if (col < 2) positions.push(blank + 1);

  const result = positions.map((position) => {
    const next = [...state];
    next[blank] = next[position];
    next[position] = BLANK;
    return { key: keyOf(next), state: next, action: position };
  });

  if (neighboursCache.size > 60_000) neighboursCache.clear();
  neighboursCache.set(key, result);
  return result;
}

function manhattan(state: number[]): number {
  let distance = 0;
  for (let position = 0; position < state.length; position += 1) {
    const value = state[position];
    if (value === BLANK) continue;
    const goalRow = Math.floor(value / 3);
    const goalCol = value % 3;
    const row = Math.floor(position / 3);
    const col = position % 3;
    distance += Math.abs(row - goalRow) + Math.abs(col - goalCol);
  }
  return distance;
}

const solutionCache = new Map<string, SolverResult>();
const MAX_EXPANSIONS = 400_000;

/**
 * Возвращает кратчайший путь от текущего состояния до собранной картинки.
 * `moves` — позиции плиток для нажатия; `tileByMove` — какие именно плитки
 * (по значению) сдвигаются на каждом шаге. Для собранного поля — пустой путь.
 */
export function solveOptimal(start: number[]): SolverResult {
  if (start.every((value, index) => value === index)) {
    return { moves: [], tileByMove: [], length: 0 };
  }

  const startKey = keyOf(start);
  const cached = solutionCache.get(startKey);
  if (cached) return cached;

  const heap = new MinHeap();
  const best = new Map<string, number>();
  const parent = new Map<string, { from: string; action: number }>();
  const states = new Map<string, number[]>();

  const startH = manhattan(start);
  heap.push({ state: start, key: startKey, g: 0, h: startH, f: startH });
  best.set(startKey, 0);
  states.set(startKey, start);

  let goalKey: string | null = null;
  let expansions = 0;

  while (heap.size > 0) {
    const current = heap.pop();
    if (!current) break;
    if (current.h === 0) {
      goalKey = current.key;
      break;
    }
    const recorded = best.get(current.key);
    if (recorded !== undefined && current.g > recorded) continue;
    expansions += 1;
    if (expansions > MAX_EXPANSIONS) break;

    for (const next of neighbours(current.state)) {
      const g = current.g + 1;
      const known = best.get(next.key);
      if (known !== undefined && known <= g) continue;
      best.set(next.key, g);
      states.set(next.key, next.state);
      parent.set(next.key, { from: current.key, action: next.action });
      const h = manhattan(next.state);
      heap.push({ state: next.state, key: next.key, g, h, f: g + h });
    }
  }

  const moves: number[] = [];
  if (goalKey) {
    let cursor = goalKey;
    while (cursor !== startKey) {
      const step = parent.get(cursor);
      if (!step) break;
      moves.push(step.action);
      cursor = step.from;
    }
    moves.reverse();
  }

  const tileByMove: number[] = [];
  let simulated = [...start];
  for (const position of moves) {
    const value = simulated[position];
    if (value === BLANK) break;
    tileByMove.push(value);
    simulated = simulated.map((tile, index) => {
      if (index === position) return BLANK;
      if (tile === BLANK) return value;
      return tile;
    });
  }

  const result: SolverResult = { moves, tileByMove, length: moves.length };
  if (solutionCache.size > 400) solutionCache.clear();
  solutionCache.set(startKey, result);
  return result;
}

/** Первые `count` ходов с номерами плиток — для подсветки на доске. */
export function previewMoves(start: number[], count = 3) {
  const solution = solveOptimal(start);
  const steps: { position: number; tile: number; order: number }[] = [];
  let simulated = [...start];
  for (let index = 0; index < Math.min(count, solution.moves.length); index += 1) {
    const position = solution.moves[index];
    const tile = simulated[position];
    if (tile === BLANK) break;
    steps.push({ position, tile, order: index + 1 });
    simulated = simulated.map((value, slot) => {
      if (slot === position) return BLANK;
      if (value === BLANK) return tile;
      return value;
    });
  }
  return { steps, total: solution.length, length: solution.length };
}
