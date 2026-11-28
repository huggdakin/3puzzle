import { GALLERY } from "../assets/gallery";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type Chapter = {
  id: number;
  titleRu: string;
  titleEn: string;
  subtitleRu: string;
  subtitleEn: string;
  accent: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    titleRu: "I. Северные рубежи",
    titleEn: "I. Northern Frontiers",
    subtitleRu: "Фьорды, скалистые берега и рассветы",
    subtitleEn: "Fjords, rocky shores & dawn light",
    accent: "#8b62ff",
  },
  {
    id: 2,
    titleRu: "II. Океанский бриз",
    titleEn: "II. Ocean Breeze",
    subtitleRu: "Лагуны, архипелаги и мысы",
    subtitleEn: "Lagoons, archipelagos & headlands",
    accent: "#0fb494",
  },
  {
    id: 3,
    titleRu: "III. Древние тропы",
    titleEn: "III. Ancient Trails",
    subtitleRu: "Каньоны, пески и солнечные плато",
    subtitleEn: "Canyons, dunes & sunlit plateaus",
    accent: "#f2820f",
  },
  {
    id: 4,
    titleRu: "IV. Туманные высоты",
    titleEn: "IV. Misty Heights",
    subtitleRu: "Горные перевалы, леса и водопады",
    subtitleEn: "Mountain passes, forests & waterfalls",
    accent: "#6a3cf0",
  },
  {
    id: 5,
    titleRu: "V. На краю света",
    titleEn: "V. Edge of the World",
    subtitleRu: "Ледники, вулканы и полярные огни",
    subtitleEn: "Glaciers, volcanoes & polar lights",
    accent: "#d8125a",
  },
];

const LOCATION_NAMES: [string, string][] = [
  ["Янтарный фьорд", "Amber Fjord"],
  ["Тихая гавань", "Silent Harbor"],
  ["Утренний хребет", "Morning Ridge"],
  ["Скалистый бастион", "Rocky Bastion"],
  ["Северный прибой", "Northern Surf"],
  ["Озеро в облаках", "Cloud Lake"],
  ["Кедровый берег", "Cedar Coast"],
  ["Вершина ветров", "Windswept Peak"],
  ["Гранитный каньон", "Granite Canyon"],
  ["Долина гейзеров", "Geyser Valley"],

  ["Изумрудная лагуна", "Emerald Lagoon"],
  ["Лазурный атолл", "Azure Atoll"],
  ["Коралловый риф", "Coral Reef"],
  ["Маяк на утёсе", "Cliffside Beacon"],
  ["Бухта тысячи скал", "Bay of Pillars"],
  ["Бирюзовый пролив", "Turquoise Strait"],
  ["Тропический муссон", "Tropical Monsoon"],
  ["Солнечный архипелаг", "Sunlit Archipelago"],
  ["Жемчужный отмель", "Pearl Shoal"],
  ["Южный меридиан", "Southern Meridian"],

  ["Красные скалы", "Crimson Cliffs"],
  ["Песчаный караван", "Sand Caravan"],
  ["Каньон миражей", "Mirage Canyon"],
  ["Терракотовый кряж", "Terracotta Ridge"],
  ["Оазис тишины", "Oasis of Calm"],
  ["Каменная арка", "Stone Arch"],
  ["Золотое плато", "Golden Plateau"],
  ["Долина предков", "Valley of Ancients"],
  ["Солнечный зенит", "Solar Zenith"],
  ["Янтарные барханы", "Amber Dunes"],

  ["Альпийский перевал", "Alpine Pass"],
  ["Туманная тайга", "Misty Taiga"],
  ["Хрустальный водопад", "Crystal Waterfall"],
  ["Заоблачный пик", "Cloud-Piercing Peak"],
  ["Изумрудное ущелье", "Emerald Gorge"],
  ["Зеркальное озеро", "Mirror Tarn"],
  ["Сосновый кряж", "Pine Crest"],
  ["Тропа над пропастью", "Cliffside Trail"],
  ["Ледниковая чаша", "Glacial Basin"],
  ["Сумеречный перевал", "Twilight Pass"],

  ["Ледяная корона", "Ice Crown"],
  ["Вулканический берег", "Volcanic Shore"],
  ["Полярная звезда", "Pole Star"],
  ["Чёрный базальт", "Black Basalt"],
  ["Огненный кратер", "Fiery Crater"],
  ["Хребет вечности", "Eternity Range"],
  ["Северное сияние", "Aurora Borealis"],
  ["Штормовой мыс", "Stormy Cape"],
  ["Последний рубеж", "Final Frontier"],
  ["Вершина мира", "Summit of the World"],
];

export type Level = {
  id: number;
  titleRu: string;
  titleEn: string;
  chapterId: number;
  regionRu: string;
  regionEn: string;
  image: string;
  thumb: string;
  credit: string;
  difficulty: Difficulty;
  par: number;
  shuffle: number;
  unlockStars: number;
  accent: string;
};

const ACCENTS = [
  "#f2820f",
  "#8b62ff",
  "#0fb494",
  "#d8125a",
  "#6a3cf0",
  "#23e0b6",
  "#ffb03a",
  "#ff2f74",
  "#0fb494",
  "#8b62ff",
];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];
export const TOTAL_LEVELS = GALLERY.length;

export const LEVELS: Level[] = GALLERY.map((image, index) => {
  const id = index + 1;
  const chapterIndex = Math.min(4, Math.floor(index / 10));
  const chapter = CHAPTERS[chapterIndex];
  const [titleRu, titleEn] = LOCATION_NAMES[index] ?? [`Локация ${id}`, `Location ${id}`];
  return {
    id,
    titleRu,
    titleEn,
    chapterId: chapter.id,
    regionRu: chapter.titleRu,
    regionEn: chapter.titleEn,
    image: image.src,
    thumb: image.src,
    credit: `${image.author} / ${image.source}`,
    difficulty: DIFFICULTIES[Math.min(3, Math.floor(index / 13))],
    par: 40 + Math.round(index * 0.6),
    shuffle: Math.min(150, 14 + Math.round(index * 0.32)),
    unlockStars: index === 0 ? 0 : index * 2,
    accent: ACCENTS[index % ACCENTS.length],
  };
});

export function isLevelOpen(
  level: Level,
  completed: Record<number, unknown>,
  unlocked: number[],
  totalStars: number
): boolean {
  if (level.id === 1) return true;
  if (completed[level.id - 1]) return true;
  if (unlocked.includes(level.id)) return true;
  return totalStars >= level.unlockStars;
}

export const DIFFICULTY_DOTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
};
