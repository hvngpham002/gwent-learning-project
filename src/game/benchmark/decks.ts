import {
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialMonstersStarterDeckPreset,
  officialNilfgaardStarterDeckPreset,
  officialNorthernRealmsStarterDeckPreset,
  officialScoiataelStarterDeckPreset,
  officialSkelligeStarterDeckPreset,
} from '@/data/catalog';
import type { CatalogDeckPreset } from '@/game/catalog';

import type { BenchmarkDeckCategory, BenchmarkDeckDescriptor } from './types';

export const benchmarkDeckCategories = [
  'smoke',
  'starter',
  'mechanics',
  'competitive',
] as const satisfies readonly BenchmarkDeckCategory[];

const descriptorFor = (
  deckPreset: CatalogDeckPreset,
  category: BenchmarkDeckCategory,
  notes?: string
): BenchmarkDeckDescriptor => ({
  deckPresetId: deckPreset.presetId,
  label: deckPreset.name,
  faction: deckPreset.faction,
  category,
  deckPreset,
  notes,
});

export const benchmarkSmokeDeckDescriptors = [
  descriptorFor(
    currentNorthernRealmsDeckPreset,
    'smoke',
    'Current catalog baseline for tiny benchmark smoke checks.'
  ),
  descriptorFor(
    currentNilfgaardDeckPreset,
    'smoke',
    'Current catalog baseline for tiny benchmark smoke checks.'
  ),
] as const satisfies readonly BenchmarkDeckDescriptor[];

export const benchmarkStarterDeckDescriptors = [
  descriptorFor(
    officialNorthernRealmsStarterDeckPreset,
    'starter',
    'Stable official starter deck for broad faction coverage.'
  ),
  descriptorFor(
    officialNilfgaardStarterDeckPreset,
    'starter',
    'Stable official starter deck for broad faction coverage.'
  ),
  descriptorFor(
    officialMonstersStarterDeckPreset,
    'starter',
    'Stable official starter deck for broad faction coverage.'
  ),
  descriptorFor(
    officialScoiataelStarterDeckPreset,
    'starter',
    'Stable official starter deck for broad faction coverage.'
  ),
  descriptorFor(
    officialSkelligeStarterDeckPreset,
    'starter',
    'Stable official starter deck for broad faction coverage.'
  ),
] as const satisfies readonly BenchmarkDeckDescriptor[];

export const benchmarkDeckDescriptors = [
  ...benchmarkSmokeDeckDescriptors,
  ...benchmarkStarterDeckDescriptors,
] as const satisfies readonly BenchmarkDeckDescriptor[];

export const getBenchmarkDeckDescriptorsByCategory = (category: BenchmarkDeckCategory) =>
  benchmarkDeckDescriptors.filter((descriptor) => descriptor.category === category);

export const getBenchmarkDeckDescriptor = (deckPresetId: string) =>
  benchmarkDeckDescriptors.find((descriptor) => descriptor.deckPresetId === deckPresetId) ?? null;
