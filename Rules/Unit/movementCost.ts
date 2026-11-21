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
  terrainJobTurns,
} from '@civ-clone/base-terrain-properties/lib/jobTurns';
import {
  TerrainTable,
  cachedTerrainLookup,
  terrainValue,
} from '@civ-clone/base-terrain-properties/lib/terrainTable';
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
  Farmland,
  Fortress,
  Irrigation,
  Mine,
  Railroad,
  Road,
} from '@civ-clone/civ2-world/TileImprovements';
import {
  Outcome,
  irrigation as irrigationOutcome,
  irrigationTurns,
  mining as miningOutcome,
  miningTurns,
  movementCost as terrainMovementCost,
  transform,
} from '@civ-clone/civ2-world/lib/terrainProperties';
import Action from '@civ-clone/core-unit/Action';
import Criterion from '@civ-clone/core-rule/Criterion';
import Description from '@civ-clone/core-rule/Description';
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
import { Water } from '@civ-clone/core-terrain/Types';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import { Engineer, Settlers } from '../../Units';
import { ENGINEER_WORK_RATE } from './workRate';
import Air from '@civ-clone/base-unit-type-air/Air';
import Naval from '@civ-clone/base-unit-type-naval/Naval';
import { Ocean } from '@civ-clone/civ2-world/Terrains';
import { terrainConversions } from '../../lib/terrainConversions';
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

/** The base-unit-movement rule that charges a land unit's move onto a square its terrain's cost. */
export const MOVE_RULE = 'civ2-unit:unit/movement-cost/move';

// The terrains whose column in `table` passes `test`, and every land terrain.
const terrainsWhere = (
    table: TerrainTable<Outcome>,
    test: (outcome: Outcome) => boolean
  ): (typeof Terrain)[] =>
    table
      .filter(([, outcome]) => test(outcome))
      .map(([TerrainType]) => TerrainType),
  inPlace = (outcome: Outcome): boolean => outcome === 'yes',
  landTerrains: (typeof Terrain)[] = terrainMovementCost
    .map(([TerrainType]) => TerrainType)
    .filter(
      (TerrainType: typeof Terrain): boolean =>
        !Object.prototype.isPrototypeOf.call(Water, TerrainType)
    );

/**
 * The terrain jobs whose turns each terrain's Civilopedia entry gives (civ-clone/web-renderer#620): each job, what it
 *  builds or does (a tile improvement, or the conversion or transform itself), and the terrains it's done on.
 *  Irrigating or mining a terrain that it changes is that change's own job (Clear Forest, Plant Forest…). An airbase
 *  and cleaning pollution take the same turns everywhere, so no terrain says them.
 */
export const describedTerrainJobs: [
  typeof UnitAction,
  Function,
  (typeof Terrain)[]
][] = [
  [BuildIrrigation, Irrigation, terrainsWhere(irrigationOutcome, inPlace)],
  [BuildFarmland, Farmland, terrainsWhere(irrigationOutcome, inPlace)],
  [BuildMine, Mine, terrainsWhere(miningOutcome, inPlace)],
  [BuildRoad, Road, landTerrains],
  [BuildRailroad, Railroad, landTerrains],
  [BuildFortress, Fortress, landTerrains],
  // A conversion names itself (Plant Forest), not the order it's given as: no mine is built on Grassland.
  ...terrainConversions.map(
    ([Conversion, , ...terrains]): [
      typeof UnitAction,
      Function,
      (typeof Terrain)[]
    ] => [Conversion, Conversion, terrains]
  ),
  [
    TransformTerrain,
    TransformTerrain,
    terrainsWhere(transform, (outcome: Outcome): boolean => outcome !== null),
  ],
];

// A terrain to look a class up by: the lookups need only its class.
const terrainOf = (TerrainType: typeof Terrain): Terrain =>
  Object.create(TerrainType.prototype);

/**
 * The turns `Job` takes Settlers on `TerrainType` as `civ2TerrainJobTurns` gives them, counting the turn the order is
 *  given on as Civilization II does (base-terrain-properties' `terrainJobTurns`, which the rule applies, is one fewer).
 */
export const terrainJobTime = (
  Job: typeof UnitAction,
  TerrainType: typeof Terrain
): number | null => {
  const row = civ2TerrainJobTurns.find(([JobType]) => JobType === Job);

  if (row === undefined) {
    return null;
  }

  const [, time] = row;

  return typeof time === 'function'
    ? time(terrainOf(TerrainType))
    : terrainValue(time, terrainOf(TerrainType));
};

/** What moving onto each land terrain costs a land unit, for its Civilopedia entry (civ-clone/web-renderer#620). */
export const movementCostDescription = (): Description =>
  new Description(
    ...landTerrains.map((TerrainType: typeof Terrain) => ({
      type: 'movement_cost',
      subject: TerrainType,
      value: terrainCost(terrainOf(TerrainType)),
    }))
  );

/**
 * Whose work each job's turns are given for: Settlers, or Engineers for a transform, which only they do (at their own
 *  rate, `Rules/Unit/workRate`).
 */
export const terrainJobWorker = (
  Job: typeof UnitAction
): [unit: Function, rate: number] =>
  Job === TransformTerrain ? [Engineer, ENGINEER_WORK_RATE] : [Settlers, 1];

/**
 * The turns a job of `turns` (counting the turn the order is given on) takes a unit working at `rate`, counted the same
 *  way, as a game plays it: the rule charges `turns - 1` (`terrainJobTurns`) and `DelayedAction` divides that by the
 *  rate, rounding up, so Engineers' Desert transform (20) takes 11 turns, not 10.
 */
export const workerTurns = (turns: number, rate: number): number =>
  Math.ceil((turns - 1) / rate) + 1;

/**
 * The turns `Job` takes on each of its terrains, as the player counts them (with the turn the order is given on), and
 *  whose turns they are, for their Civilopedia entries (civ-clone/web-renderer#620).
 */
export const terrainJobDescription = (
  Job: typeof UnitAction,
  Improvement: Function,
  terrains: (typeof Terrain)[]
): Description => {
  const [unit, rate] = terrainJobWorker(Job);

  return new Description(
    ...terrains.map((TerrainType: typeof Terrain) => ({
      type: 'improvement_turns',
      subject: TerrainType,
      improvement: Improvement,
      value: workerTurns(terrainJobTime(Job, TerrainType) as number, rate),
      unit,
    }))
  );
};

/** What a ship or an aircraft pays for each move, as base-unit-movement's `air-and-naval` rule charges it. */
export const AIR_AND_NAVAL_MOVE_COST = 1;

/** The Ocean a ship moves over, for its Civilopedia entry (civ-clone/web-renderer#620). */
export const oceanMovementCostDescription = (): Description =>
  new Description({
    type: 'movement_cost',
    subject: Ocean,
    value: AIR_AND_NAVAL_MOVE_COST,
  });

/**
 * base-unit-movement's rules, with the ones that say what they do (civ-clone/web-renderer#620) built here instead, in
 *  their place: the move, air-and-naval and described terrain job rules, each the same class, id, priority, criteria
 *  and effect as base-unit-movement's `movementCostRules` builds, with its `Description` among its own items. Built,
 *  not wrapped, so the path finder's every move pays nothing for the description.
 *
 * These 13 rules are copies of base-unit-movement's: a change to those rules there must be copied here. The id check
 *  below catches a rename, but not a new criterion or a changed effect (`tests/descriptions` compares their answers).
 */
const describeMovementCosts = (
  rules: MovementCost[],
  jobs: TerrainJob<typeof UnitAction>[]
): MovementCost[] => {
  const id = (name: string): string => `civ2-unit:unit/movement-cost/${name}`,
    isMove = new Criterion(
      (unit: Unit, action: Action): boolean => action instanceof Move
    ),
    described = new Map<string, MovementCost>([
      [
        MOVE_RULE,
        new MovementCost(
          MOVE_RULE,
          isMove,
          new Criterion((unit: Unit): boolean => unit instanceof Land),
          new Criterion(
            (unit: Unit, action: Action): boolean =>
              terrainCost(action.to().terrain()) !== null
          ),
          new Effect(
            (unit: Unit, action: Action): number =>
              terrainCost(action.to().terrain()) as number
          ),
          movementCostDescription()
        ),
      ],
      [
        id('air-and-naval'),
        new MovementCost(
          id('air-and-naval'),
          isMove,
          new Criterion(
            (unit: Unit): boolean =>
              unit instanceof Air || unit instanceof Naval
          ),
          new Effect((): number => AIR_AND_NAVAL_MOVE_COST),
          oceanMovementCostDescription()
        ),
      ],
      ...describedTerrainJobs.map(
        ([Job, Improvement, terrains]): [string, MovementCost] => {
          const jobTurns = (terrain: Terrain): number | null =>
            terrainJobTurns(jobs, Job, terrain);

          return [
            id(`action/${Job.name}`),
            new MovementCost(
              id(`action/${Job.name}`),
              new Criterion(
                (unit: Unit, action: Action): boolean => action instanceof Job
              ),
              new Criterion(
                (unit: Unit): boolean =>
                  jobTurns(unit.tile().terrain()) !== null
              ),
              new Effect(
                (unit: Unit): number =>
                  jobTurns(unit.tile().terrain()) as number
              ),
              terrainJobDescription(Job, Improvement, terrains)
            ),
          ];
        }
      ),
    ]);

  // Every one built here replaces one of base-unit-movement's, or the ids have drifted.
  described.forEach((rule: MovementCost, ruleId: string): void => {
    if (!rules.some((base: MovementCost): boolean => base.id() === ruleId)) {
      throw new TypeError(
        `civ2-unit: base-unit-movement has no '${ruleId}' rule to describe.`
      );
    }
  });

  return rules.map(
    (rule: MovementCost): MovementCost =>
      described.get(rule.id() as string) ?? rule
  );
};

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
    ...describeMovementCosts(
      movementCostRules(
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
      civ2TerrainJobTurns
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
