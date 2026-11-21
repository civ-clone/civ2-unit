import { ClearForest, ClearJungle, ClearSwamp, PlantForest } from '../Actions';
import {
  Forest,
  Grassland,
  Jungle,
  Plains,
  Swamp,
} from '@civ-clone/civ2-world/Terrains';
import { Irrigation, Mine } from '@civ-clone/civ2-world/TileImprovements';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';

export type ConversionAction =
  | typeof ClearJungle
  | typeof ClearForest
  | typeof PlantForest
  | typeof ClearSwamp;

/**
 * The terrain each conversion changes, and the order it is given as: `@TERRAIN`'s irrigate and mine results that change
 *  the terrain (`tests/conversions` checks them against civ2-world's table). Each action leaves its own `result`.
 */
export const terrainConversions: [
  ConversionAction,
  typeof TileImprovement,
  ...(typeof Terrain)[]
][] = [
  [ClearJungle, Irrigation, Jungle],
  [ClearForest, Irrigation, Forest],
  [PlantForest, Mine, Plains, Grassland, Jungle, Swamp],
  [ClearSwamp, Irrigation, Swamp],
];

export default terrainConversions;
