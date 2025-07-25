import { Card } from '@/types/card';

/**
 * Generates a unique card ID for a specific player
 * @param baseId - The original card ID from card data
 * @param player - The player identifier ('player' or 'opponent')
 * @param copyIndex - Optional index for multiple copies (1, 2, 3, etc.)
 * @returns Unique card ID in format: baseId_playerPrefix_copyIndex?
 */
export const generateUniqueCardId = (
  baseId: string, 
  player: 'player' | 'opponent', 
  copyIndex?: number
): string => {
  const playerPrefix = player === 'player' ? 'p' : 'ai';
  const indexSuffix = copyIndex ? `_${copyIndex}` : '';
  return `${baseId}_${playerPrefix}${indexSuffix}`;
};

/**
 * Creates a card copy with unique ID for a specific player
 * @param baseCard - The original card data
 * @param player - The player identifier
 * @param copyIndex - Optional copy index for multiple copies
 * @returns Card with unique ID
 */
export const createUniqueCard = <T extends Card>(
  baseCard: T, 
  player: 'player' | 'opponent', 
  copyIndex?: number
): T => {
  return {
    ...baseCard,
    id: generateUniqueCardId(baseCard.id, player, copyIndex)
  };
};

/**
 * Creates multiple copies of a card with unique IDs
 * @param baseCard - The original card data
 * @param player - The player identifier
 * @param count - Number of copies to create
 * @returns Array of cards with unique IDs
 */
export const createMultipleUniqueCards = <T extends Card>(
  baseCard: T, 
  player: 'player' | 'opponent', 
  count: number
): T[] => {
  return Array.from({ length: count }, (_, index) => 
    createUniqueCard(baseCard, player, index + 1)
  );
};

/**
 * Validates that all cards in a collection have unique IDs
 * @param cards - Array of cards to validate
 * @returns Object with validation result and duplicate IDs if any
 */
export const validateUniqueCardIds = (cards: Card[]): {
  isValid: boolean;
  duplicateIds: string[];
} => {
  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (const card of cards) {
    if (seenIds.has(card.id)) {
      duplicateIds.push(card.id);
    } else {
      seenIds.add(card.id);
    }
  }

  return {
    isValid: duplicateIds.length === 0,
    duplicateIds
  };
};