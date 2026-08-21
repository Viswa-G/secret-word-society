import type { WordEntry } from "@/data/categories";

export type TempStorageData = {
  timestamp: number;
  usedWords: string[];
  imposterCounts: Record<string, number>;
  lastImposters: string[];
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const STORAGE_KEY = "sws_temp_storage";

// In-memory fallback for server runtime (SSR / API routes)
let inMemoryStorage: TempStorageData = {
  timestamp: Date.now(),
  usedWords: [],
  imposterCounts: {},
  lastImposters: [],
};

/**
 * Retrieves temporary storage data.
 * Automatically clears and resets data if older than 2 hours.
 */
export function getTempStorage(): TempStorageData {
  if (typeof window === "undefined") {
    if (Date.now() - inMemoryStorage.timestamp >= TWO_HOURS_MS) {
      inMemoryStorage = {
        timestamp: Date.now(),
        usedWords: [],
        imposterCounts: {},
        lastImposters: [],
      };
    }
    return inMemoryStorage;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: TempStorageData = JSON.parse(raw);
      if (data.timestamp && Date.now() - data.timestamp < TWO_HOURS_MS) {
        return data;
      }
    }
  } catch (e) {
    console.error("Failed to read local storage", e);
  }

  // If expired or missing, clear and initialize
  const fresh: TempStorageData = {
    timestamp: Date.now(),
    usedWords: [],
    imposterCounts: {},
    lastImposters: [],
  };
  saveTempStorage(fresh);
  return fresh;
}

/**
 * Persists temporary storage data to Local Storage (and in-memory).
 * Clears and resets timestamp every 2 hours.
 */
export function saveTempStorage(data: TempStorageData): void {
  if (!data.timestamp || Date.now() - data.timestamp >= TWO_HOURS_MS) {
    data.timestamp = Date.now();
    data.usedWords = [];
    data.imposterCounts = {};
    data.lastImposters = [];
  }

  if (typeof window === "undefined") {
    inMemoryStorage = data;
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to write local storage", e);
  }
}

/**
 * Manually clears local storage data.
 */
export function clearTempStorage(): void {
  const fresh: TempStorageData = {
    timestamp: Date.now(),
    usedWords: [],
    imposterCounts: {},
    lastImposters: [],
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch (e) {
      console.error("Failed to clear local storage", e);
    }
  }
  inMemoryStorage = fresh;
}

/**
 * Picks a random word from the pool, excluding words used in previous games.
 * Marks the chosen word as used.
 * If all pool words are used, resets used words for those categories to prevent running out.
 */
export function selectAndMarkWord(pool: { entry: WordEntry; cat: string }[]): { entry: WordEntry; cat: string } {
  const storage = getTempStorage();
  const usedSet = new Set(storage.usedWords || []);

  let unusedPool = pool.filter((item) => !usedSet.has(item.entry.word));

  // If all words in the pool have already been used once, reset history for these words
  if (unusedPool.length === 0) {
    const poolWords = new Set(pool.map((item) => item.entry.word));
    storage.usedWords = (storage.usedWords || []).filter((w) => !poolWords.has(w));
    unusedPool = pool;
  }

  const chosen = unusedPool[Math.floor(Math.random() * unusedPool.length)];

  if (!storage.usedWords.includes(chosen.entry.word)) {
    storage.usedWords.push(chosen.entry.word);
  }
  saveTempStorage(storage);

  return chosen;
}

/**
 * Selects imposter(s) with random fair probability:
 * 1. Ensures every player gets a chance to be imposter.
 * 2. Imposter can repeat, but not in every match (players who were imposter last match receive lower probability weight).
 * 3. Imposter pairings differ every time.
 */
export function selectImposters(players: string[], imposterCount: number): string[] {
  if (players.length === 0) return [];
  const count = Math.min(imposterCount, players.length - 1);
  if (count <= 0) return [];

  const storage = getTempStorage();
  const imposterCounts = storage.imposterCounts || {};
  const lastImposters = new Set(storage.lastImposters || []);

  const getWeight = (p: string): number => {
    let w = 1.0;
    // Penalty if imposter in the immediately preceding match
    if (lastImposters.has(p)) {
      w *= 0.15;
    }
    // Boost players who have been imposter fewer times
    const times = imposterCounts[p] || 0;
    w /= 1 + times * 1.5;
    return Math.max(w, 0.01);
  };

  const tryPick = (): string[] => {
    const pool = [...players];
    const picked: string[] = [];

    for (let c = 0; c < count; c++) {
      if (pool.length === 0) break;
      const weights = pool.map(getWeight);
      const totalWeight = weights.reduce((acc, v) => acc + v, 0);

      let rand = Math.random() * totalWeight;
      let selectedIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        rand -= weights[i];
        if (rand <= 0) {
          selectedIdx = i;
          break;
        }
      }

      picked.push(pool[selectedIdx]);
      pool.splice(selectedIdx, 1);
    }
    return picked;
  };

  let chosen = tryPick();

  // Try to ensure pairing differs if possible (max 10 attempts)
  if (players.length > count + 1 && lastImposters.size > 0) {
    const lastSortedKey = [...lastImposters].sort().join(",");
    for (let attempt = 0; attempt < 10; attempt++) {
      const currentSortedKey = [...chosen].sort().join(",");
      if (currentSortedKey !== lastSortedKey) {
        break;
      }
      chosen = tryPick();
    }
  }

  // Update storage
  storage.lastImposters = chosen;
  for (const imp of chosen) {
    storage.imposterCounts[imp] = (storage.imposterCounts[imp] || 0) + 1;
  }
  saveTempStorage(storage);

  return chosen;
}
