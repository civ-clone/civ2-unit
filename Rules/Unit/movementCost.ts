import {
  BuildAirbase,
  BuildFarmland,
  BuildFortress,
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
  TransformTerrain,
} from '../../Actions';
import {
  TerrainJob,
  multipleOf,
} from '@civ-clone/base-terrain-properties/lib/jobTurns';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
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
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
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

/** Whether two squares are on neighbouring rows, counting the last row and the first as neighbours (rows wrap). */
export const rowsApart = (from: Tile, to: Tile): boolean => {
  const height = from.map().height(),
    dy = Math.abs(from.y() - to.y());

  return dy === 1 || (height > 2 && dy === height - 1);
};

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
 *  Forest, Plant Forest...) is the irrigate or mine order on that terrain, so it takes that order's time. A fortress
 *  takes half the terrain's movement cost (rounded down) and 3, an airbase 4, and a transform the movement cost times
 *  @COSMIC's transform time. Engineers do each in half the turns (`Rules/Unit/workRate`).
 */
export const civ2TerrainJobTurns: TerrainJob<typeof UnitAction>[] = [
  [BuildIrrigation, irrigating],
  // `unit_terrain_work_turns` order 6: farmland takes the irrigation order's turns.
  [BuildFarmland, irrigating],
  [BuildMine, mining],
  [BuildRoad, multipleOf(terrainCost, 2)],
  [BuildRailroad, multipleOf(terrainCost, 4)],
  [CleanPollution, (): number => 4],
  [ClearForest, irrigating],
  [ClearJungle, irrigating],
  [ClearSwamp, irrigating],
  [PlantForest, mining],
  [
    BuildFortress,
    (terrain: Terrain): number | null => {
      const cost = terrainCost(terrain);

      return cost === null ? null : Math.trunc(cost / 2) + 3;
    },
  ],
  [BuildAirbase, (): number => 4],
  [TransformTerrain, multipleOf(terrainCost, cosmic.transformTime)],
];

/**
 * Civilization II's movement costs (`unit_move_dir_step_cost`): base-unit-movement's rules with Civ2's terrain,
 *  routes and jobs, and Civ2's own: a city's square counts as road and railroad, a step along a river costs as a road,
 *  and so does every step of a unit that treats every square as road (Alpine Troops, Partisans, Explorers). A move
 *  takes the cheapest answer.
 */
export const getRules = (
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  transportRegistry: TransportRegistry = transportRegistryInstance,
  terrainFeatureRegistry: TerrainFeatureRegistry = terrainFeatureRegistryInstance,
  cityRegistry: CityRegistry = cityRegistryInstance
): MovementCost[] => {
  const hasRiver = (tile: Tile): boolean =>
      terrainFeatureRegistry
        .getByTerrain(tile.terrain())
        .some((feature: TerrainFeature): boolean => feature instanceof River),
    // A city's square counts as both road and railroad (`unit_move_dir_step_cost` tests the city bit with each).
    routeOrCity =
      (Improvement: typeof TileImprovement) =>
      (tile: Tile): boolean =>
        cityRegistry.getByTile(tile) !== null ||
        tileImprovementRegistry
          .getByTile(tile)
          .some(
            (improvement: TileImprovement): boolean =>
              improvement instanceof Improvement
          ),
    cityRoute = (
      name: string,
      Improvement: typeof TileImprovement,
      cost: number
    ): MovementCost => {
      const has = routeOrCity(Improvement);

      return new MovementCost(
        `civ2-unit:unit/movement-cost/${name}`,
        new Criterion(
          (unit: Unit, action: Action): boolean => action instanceof Move
        ),
        new Criterion((unit: Unit): boolean => unit instanceof Land),
        new Criterion((unit: Unit, action: Action): boolean =>
          has(action.from())
        ),
        new Criterion((unit: Unit, action: Action): boolean =>
          has(action.to())
        ),
        new Effect((): number => cost)
      );
    };

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
    cityRoute('city-road', Road, roadMove),
    cityRoute('city-railroad', Railroad, 0),
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
      // Along the river only: a step to one of the four squares that share an edge with this one, one row up or down
      //  on the staggered grid (`dx == 1` and `|dy| == 1` on Civ2's doubled-x grid), across the wrapping seam too.
      new Criterion((unit: Unit, action: Action): boolean =>
        rowsApart(action.from(), action.to())
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
