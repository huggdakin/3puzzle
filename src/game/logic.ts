export const SOLVED: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export const BLANK = 8;

export function shufflePuzzle(levelShuffle: number): number[] {
  const tiles = [...SOLVED];
  let blank = BLANK;
  let previous = -1;
  const steps = levelShuffle * 2 + 12;

  for (let step = 0; step < steps; step += 1) {
    const row = Math.floor(blank / 3);
    const col = blank % 3;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(blank - 3);
    if (row < 2) neighbors.push(blank + 3);
    if (col > 0) neighbors.push(blank - 1);
    if (col < 2) neighbors.push(blank + 1);

    const options = neighbors.filter((n) => n !== previous);
    const pick = options[Math.floor(Math.random() * options.length)] ?? neighbors[0];
    tiles[blank] = tiles[pick];
    tiles[pick] = BLANK;
    previous = blank;
    blank = pick;
  }

  if (isSolved(tiles)) return shufflePuzzle(levelShuffle + 1);
  return tiles;
}

export function isSolved(tiles: number[]): boolean {
  return tiles.every((value, index) => value === index);
}

export function canMove(tiles: number[], position: number): boolean {
  const blank = tiles.indexOf(BLANK);
  const row = Math.floor(position / 3);
  const col = position % 3;
  const blankRow = Math.floor(blank / 3);
  const blankCol = blank % 3;
  return Math.abs(row - blankRow) + Math.abs(col - blankCol) === 1;
}

export function moveTile(tiles: number[], position: number): number[] {
  if (!canMove(tiles, position)) return tiles;
  const next = [...tiles];
  const blank = next.indexOf(BLANK);
  next[blank] = next[position];
  next[position] = BLANK;
  return next;
}

export function keyboardTarget(tiles: number[], key: string): number | null {
  const blank = tiles.indexOf(BLANK);
  const row = Math.floor(blank / 3);
  const col = blank % 3;
  switch (key) {
    case "ArrowUp":
      return row < 2 ? blank + 3 : null;
    case "ArrowDown":
      return row > 0 ? blank - 3 : null;
    case "ArrowLeft":
      return col < 2 ? blank + 1 : null;
    case "ArrowRight":
      return col > 0 ? blank - 1 : null;
    default:
      return null;
  }
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function calcStars(moves: number, par: number): number {
  if (moves <= par) return 3;
  if (moves <= Math.round(par * 1.55)) return 2;
  return 1;
}

export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
