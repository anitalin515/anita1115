export type CardCategory = 'animal' | 'vehicle' | 'dessert';

export type CardDesignId =
  | 'shiba'
  | 'cat'
  | 'panda'
  | 'penguin'
  | 'rabbit'
  | 'firetruck'
  | 'bus'
  | 'train'
  | 'taxi'
  | 'truck'
  | 'cake'
  | 'donut'
  | 'macaron'
  | 'pudding'
  | 'croissant';

export interface CardDesign {
  id: CardDesignId;
  name: string;
  category: CardCategory;
  categoryLabel: string;
  accentColor: string;
  surfaceTint: string;
}

export interface CardInstance {
  uid: string;
  design: CardDesign;
  isFlipped: boolean;
  isMatched: boolean;
  isClearing: boolean;
  isMismatch: boolean;
  isHinted: boolean;
}

export interface RoundConfig {
  round: 1 | 2 | 3;
  cardCount: 8 | 18 | 28;
  pairCount: 4 | 9 | 14;
  title: string;
  shuffleIntervalMs: number | null;
}

export const ROUNDS: RoundConfig[] = [
  { round: 1, cardCount: 8, pairCount: 4, title: '第一輪', shuffleIntervalMs: null },
  { round: 2, cardCount: 18, pairCount: 9, title: '第二輪', shuffleIntervalMs: 20000 },
  { round: 3, cardCount: 28, pairCount: 14, title: '第三輪', shuffleIntervalMs: 30000 },
];

export const WRONG_PAIR_PENALTY_THRESHOLD = 3; // 3 consecutive wrong pairs = 6 wrong cards
export const PENALTY_MS = 5000; // +5 seconds per warning

export const CARD_DESIGNS: CardDesign[] = [
  // 動物 (Animals - 5)
  {
    id: 'shiba',
    name: '柴犬',
    category: 'animal',
    categoryLabel: '動物',
    accentColor: '#D97706',
    surfaceTint: '#FEF3C7',
  },
  {
    id: 'cat',
    name: '三花貓',
    category: 'animal',
    categoryLabel: '動物',
    accentColor: '#EA580C',
    surfaceTint: '#FFEDD5',
  },
  {
    id: 'panda',
    name: '熊貓',
    category: 'animal',
    categoryLabel: '動物',
    accentColor: '#059669',
    surfaceTint: '#D1FAE5',
  },
  {
    id: 'penguin',
    name: '企鵝',
    category: 'animal',
    categoryLabel: '動物',
    accentColor: '#0284C7',
    surfaceTint: '#E0F2FE',
  },
  {
    id: 'rabbit',
    name: '兔寶寶',
    category: 'animal',
    categoryLabel: '動物',
    accentColor: '#DB2777',
    surfaceTint: '#FCE7F3',
  },

  // 交通運輸車輛 (Vehicles - 5)
  {
    id: 'firetruck',
    name: '消防車',
    category: 'vehicle',
    categoryLabel: '車輛',
    accentColor: '#DC2626',
    surfaceTint: '#FEE2E2',
  },
  {
    id: 'bus',
    name: '雙層巴士',
    category: 'vehicle',
    categoryLabel: '車輛',
    accentColor: '#2563EB',
    surfaceTint: '#DBEAFE',
  },
  {
    id: 'train',
    name: '高速列車',
    category: 'vehicle',
    categoryLabel: '車輛',
    accentColor: '#0D9488',
    surfaceTint: '#CCFBF1',
  },
  {
    id: 'taxi',
    name: '計程車',
    category: 'vehicle',
    categoryLabel: '車輛',
    accentColor: '#CA8A04',
    surfaceTint: '#FEF9C3',
  },
  {
    id: 'truck',
    name: '宅配貨車',
    category: 'vehicle',
    categoryLabel: '車輛',
    accentColor: '#16A34A',
    surfaceTint: '#DCFCE7',
  },

  // 甜點 (Desserts - 5)
  {
    id: 'cake',
    name: '草莓蛋糕',
    category: 'dessert',
    categoryLabel: '甜點',
    accentColor: '#E11D48',
    surfaceTint: '#FFE4E6',
  },
  {
    id: 'donut',
    name: '甜甜圈',
    category: 'dessert',
    categoryLabel: '甜點',
    accentColor: '#DB2777',
    surfaceTint: '#FCE7F3',
  },
  {
    id: 'macaron',
    name: '馬卡龍',
    category: 'dessert',
    categoryLabel: '甜點',
    accentColor: '#7C3AED',
    surfaceTint: '#EDE9FE',
  },
  {
    id: 'pudding',
    name: '焦糖布丁',
    category: 'dessert',
    categoryLabel: '甜點',
    accentColor: '#B45309',
    surfaceTint: '#FEF3C7',
  },
  {
    id: 'croissant',
    name: '金黃可頌',
    category: 'dessert',
    categoryLabel: '甜點',
    accentColor: '#D97706',
    surfaceTint: '#FFEDD5',
  },
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let uidCounter = 0;

function nextCardUid(round: number, designId: CardDesignId, suffix: 'a' | 'b'): string {
  uidCounter += 1;
  return `r${round}-${designId}-${suffix}-${uidCounter}`;
}

/**
 * Builds a balanced, freshly shuffled deck ensuring all 3 categories
 * (動物, 交通運輸車輛, 甜點) appear in every round.
 */
export function buildRoundDeck(roundConfig: RoundConfig): CardInstance[] {
  const animals = shuffleArray(CARD_DESIGNS.filter((d) => d.category === 'animal'));
  const vehicles = shuffleArray(CARD_DESIGNS.filter((d) => d.category === 'vehicle'));
  const desserts = shuffleArray(CARD_DESIGNS.filter((d) => d.category === 'dessert'));

  let chosenDesigns: CardDesign[] = [];

  if (roundConfig.pairCount === 4) {
    // Round 1 (8 cards = 4 pairs): 1 of each + 1 extra random category
    const extraPool = shuffleArray([animals[1], vehicles[1], desserts[1]]);
    chosenDesigns = [animals[0], vehicles[0], desserts[0], extraPool[0]];
  } else if (roundConfig.pairCount === 9) {
    // Round 2 (18 cards = 9 pairs): 3 Animals + 3 Vehicles + 3 Desserts
    chosenDesigns = [
      animals[0],
      animals[1],
      animals[2],
      vehicles[0],
      vehicles[1],
      vehicles[2],
      desserts[0],
      desserts[1],
      desserts[2],
    ];
  } else {
    // Round 3 (28 cards = 14 pairs): 14 out of 15 designs (always at least 4 per category)
    const fifthPool = shuffleArray([animals[4], vehicles[4], desserts[4]]);
    chosenDesigns = [
      animals[0],
      animals[1],
      animals[2],
      animals[3],
      vehicles[0],
      vehicles[1],
      vehicles[2],
      vehicles[3],
      desserts[0],
      desserts[1],
      desserts[2],
      desserts[3],
      fifthPool[0],
      fifthPool[1],
    ];
  }

  const paired: CardInstance[] = [];
  chosenDesigns.forEach((design) => {
    paired.push(
      {
        uid: nextCardUid(roundConfig.round, design.id, 'a'),
        design,
        isFlipped: false,
        isMatched: false,
        isClearing: false,
        isMismatch: false,
        isHinted: false,
      },
      {
        uid: nextCardUid(roundConfig.round, design.id, 'b'),
        design,
        isFlipped: false,
        isMatched: false,
        isClearing: false,
        isMismatch: false,
        isHinted: false,
      }
    );
  });

  return shuffleArray(paired);
}

/**
 * Shuffles ONLY unmatched cards among their existing grid slots,
 * keeping already-matched empty slots anchored in place.
 */
export function shuffleUnmatchedCardsInPlace(cards: CardInstance[]): CardInstance[] {
  const unmatchedIndices: number[] = [];
  const unmatchedCards: CardInstance[] = [];

  cards.forEach((card, index) => {
    if (!card.isMatched) {
      unmatchedIndices.push(index);
      unmatchedCards.push(card);
    }
  });

  if (unmatchedCards.length < 2) {
    return cards;
  }

  let shuffled = shuffleArray(unmatchedCards);
  // Guarantee at least one card changes slot when >= 2 unmatched cards remain
  const unchanged = shuffled.every((c, idx) => c.uid === unmatchedCards[idx].uid);
  if (unchanged) {
    shuffled = [...shuffled.slice(1), shuffled[0]];
  }

  const next = [...cards];
  unmatchedIndices.forEach((slotIndex, i) => {
    next[slotIndex] = {
      ...shuffled[i],
      isFlipped: false,
      isMismatch: false,
      isHinted: false,
    };
  });

  return next;
}

export function pickRandomUnmatchedPairDesign(cards: CardInstance[]): CardDesign | null {
  const unmatchedByDesign = new Map<CardDesignId, CardDesign>();
  cards.forEach((card) => {
    if (!card.isMatched && !card.isClearing) {
      unmatchedByDesign.set(card.design.id, card.design);
    }
  });
  const pool = Array.from(unmatchedByDesign.values());
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function formatDuration(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalTenths = Math.floor(clamped / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

export function formatTotalSeconds(ms: number): string {
  const clamped = Math.max(0, ms);
  return `${(clamped / 1000).toFixed(1)} 秒`;
}
