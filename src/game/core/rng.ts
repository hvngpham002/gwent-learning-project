export interface SeededRng {
  readonly seed: string | number;
  next(): number;
  getState(): number;
}

const normalizeSeed = (seed: string | number): string => String(seed);

const xmur3 = (input: string) => {
  let hash = 1779033703 ^ input.length;

  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
};

export const createSeededRng = (seed: string | number): SeededRng => {
  const seedFactory = xmur3(normalizeSeed(seed));
  let state = seedFactory();

  return {
    seed,
    next() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    getState() {
      return state >>> 0;
    },
  };
};

export const createSeededRngFromState = (seed: string | number, initialState: number): SeededRng => {
  let state = initialState >>> 0;

  return {
    seed,
    next() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    getState() {
      return state >>> 0;
    },
  };
};

export const shuffleWithRng = <T>(items: readonly T[], rng: SeededRng): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng.next() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};
