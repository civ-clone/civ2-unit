import {
  BuildIrrigation,
  BuildMine,
  BuildRailroad,
  BuildRoad,
  CleanPollution,
  ClearForest,
  ClearJungle,
  ClearSwamp,
  Fortify,
  Move,
  Pillage,
  PlantForest,
  Sleep,
} from '../../Actions';
import {
  TerrainJob,
  multipleOf,
} from '@civ-clone/base-terrain-properties/lib/jobTurns';
import {
  TerrainFeatureRegistry,
  instance as terrainFeatureRegistryInstance,
} from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  irrigationTurns,
  miningTurns,
  movementCost as terrainMovementCost,
} from '@civ-clone/civ2-world/lib/terrainProperties';
import { Railroad, Road } from '@civ-clone/civ2-world/TileImprovements';
import Action from '@civ-clone/core-unit/Action';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Land from '@civ-clone/base-unit-type-land/Land';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import { River } from '@civ-clone/civ2-world/TerrainFeatures';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainAsRoad from '@civ-clone/base-unit-trait-terrain-as-road/TerrainAsRoad';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import {
  TerrainTable,
  cachedTerrainLookup,
} from '@civ-clone/base-terrain-properties/lib/terrainTable';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import movementCostRules from '@civ-clone/base-unit-movement/lib/movementCostRules';

/** What a land unit's move onto each terrain costs: civ2-world's `@TERRAIN` movement costs, looked up by class. */
export const terrainCost: (terrain: Terrain) => number | null =
  cachedTerrainLookup(terrainMovementCost);

// A job's turns on the terrains where it can be done (civ2-world gives `null` where it can't).
const where = (table: TerrainTable<number | null>): TerrainTable<number> =>
  table.filter((row): row is [typeof Terrain, number] => row[1] !== null);

const irrigating = where(irrigationTurns),
  mining = where(miningTurns);

// A step along a road, a river or (for a unit that treats all as road) anywhere costs one of @COSMIC's road moves.
const roadMove = 1 / cosmic.roadMoveMultiplier;

/**
 * How many turns each terrain job takes in Civilization II (`unit_terrain_work_turns`): irrigating and mining from
 *  `@TERRAIN`, a road twice the terrain's movement cost and a railroad four times it, pollution 4. A conversion (Clear
 *  Forest, Plant Forest...) is the irrigate or mine order on that terrain, so it takes that order's time.
 */
export const civ2TerrainJobTurns: TerrainJob<typeof UnitAction>[] = [
  [BuildIrrigation, irrigating],
  [BuildMine, mining],
  [BuildRoad, multipleOf(terrainCost, 2)],
  [BuildRailroad, multipleOf(terrainCost, 4)],
  [CleanPollution, (): number => 4],
  [ClearForest, irrigating],
  [ClearJungle, irrigating],
  [ClearSwamp, irrigating],
  [PlantForest, mining],
];

/**
 * Civilization II's movement costs (`unit_move_dir_step_cost`): base-unit-movement's rules with Civ2's terrain,
 *  routes and jobs, and two of Civ2's own: along a river, and a unit that treats every square as road (Alpine Troops,
 *  Partisans, Explorers). A move takes the cheapest answer.
 */
export const getRules = (
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  transportRegistry: TransportRegistry = transportRegistryInstance,
  terrainFeatureRegistry: TerrainFeatureRegistry = terrainFeatureRegistryInstance
): MovementCost[] => {
  const hasRiver = (tile: Tile): boolean =>
    terrainFeatureRegistry
      .getByTerrain(tile.terrain())
      .some((feature: TerrainFeature): boolean => feature instanceof River);

  return [
    ...movementCostRules(
      'civ2-unit',
      { tileImprovementRegistry, transportRegistry },
      {
        Move,
        terrainCost,
        routes: [
          ['road', Road, roadMove],
          ['railroad', Railroad, 0],
        ],
        orders: [
          [Fortify, 1],
          [Pillage, 1],
          [Sleep, 0],
        ],
        jobs: civ2TerrainJobTurns,
      }
    ),
    new MovementCost(
      'civ2-unit:unit/movement-cost/river',
      new Criterion(
        (unit: Unit, action: Action): boolean => action instanceof Move
      ),
      new Criterion((unit: Unit): boolean => unit instanceof Land),
      new Criterion((unit: Unit, action: Action): boolean =>
        hasRiver(action.from())
      ),
      new Criterion((unit: Unit, action: Action): boolean =>
        hasRiver(action.to())
      ),
      new Effect((): number => roadMove)
    ),
    new MovementCost(
      'civ2-unit:unit/movement-cost/terrain-as-road',
      new Criterion(
        (unit: Unit, action: Action): boolean => action instanceof Move
      ),
      new Criterion((unit: Unit): boolean => unit instanceof Land),
      new Criterion((unit: Unit): boolean => unit.hasTrait(TerrainAsRoad)),
      new Effect((): number => roadMove)
    ),
  ];
};

export default getRules;
