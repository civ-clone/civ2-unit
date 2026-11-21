import { TerrainJob } from '@civ-clone/base-terrain-properties/lib/jobTurns';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import Description from '@civ-clone/core-rule/Description';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import UnitAction from '@civ-clone/core-unit/Action';
/** What a land unit's move onto each terrain costs: civ2-world's `@TERRAIN` movement costs, looked up by class. */
export declare const terrainCost: (terrain: Terrain) => number | null;
/** Whether two squares are on neighbouring rows, counting the last row and the first as neighbours (rows wrap). */
export declare const rowsApart: (from: Tile, to: Tile) => boolean;
/**
 * How many turns each terrain job takes in Civilization II (`unit_terrain_work_turns`): irrigating and mining from
 *  `@TERRAIN`, a road twice the terrain's movement cost and a railroad four times it, pollution 4. A conversion (Clear
 *  Forest, Plant Forest...) is the irrigate or mine order on that terrain, so it takes that order's time. A fortress
 *  takes half the terrain's movement cost (rounded down) and 3, an airbase 4, and a transform the movement cost times
 *  @COSMIC's transform time. Engineers do each in half the turns (`Rules/Unit/workRate`).
 */
export declare const civ2TerrainJobTurns: TerrainJob<typeof UnitAction>[];
/** The base-unit-movement rule that charges a land unit's move onto a square its terrain's cost. */
export declare const MOVE_RULE = 'civ2-unit:unit/movement-cost/move';
/**
 * The terrain jobs whose turns each terrain's Civilopedia entry gives (civ-clone/web-renderer#620): each job, what it
 *  builds or does (a tile improvement, or the conversion or transform itself), and the terrains it's done on.
 *  Irrigating or mining a terrain that it changes is that change's own job (Clear Forest, Plant Forest…). An airbase
 *  and cleaning pollution take the same turns everywhere, so no terrain says them.
 */
export declare const describedTerrainJobs: [
  typeof UnitAction,
  Function,
  (typeof Terrain)[]
][];
/**
 * The turns `Job` takes Settlers on `TerrainType` as `civ2TerrainJobTurns` gives them, counting the turn the order is
 *  given on as Civilization II does (base-terrain-properties' `terrainJobTurns`, which the rule applies, is one fewer).
 */
export declare const terrainJobTime: (
  Job: typeof UnitAction,
  TerrainType: typeof Terrain
) => number | null;
/** What moving onto each land terrain costs a land unit, for its Civilopedia entry (civ-clone/web-renderer#620). */
export declare const movementCostDescription: () => Description;
/**
 * Whose work each job's turns are given for: Settlers, or Engineers for a transform, which only they do (at their own
 *  rate, `Rules/Unit/workRate`).
 */
export declare const terrainJobWorker: (
  Job: typeof UnitAction
) => [unit: Function, rate: number];
/**
 * The turns a job of `turns` (counting the turn the order is given on) takes a unit working at `rate`, counted the same
 *  way, as a game plays it: the rule charges `turns - 1` (`terrainJobTurns`) and `DelayedAction` divides that by the
 *  rate, rounding up, so Engineers' Desert transform (20) takes 11 turns, not 10.
 */
export declare const workerTurns: (turns: number, rate: number) => number;
/**
 * The turns `Job` takes on each of its terrains, as the player counts them (with the turn the order is given on), and
 *  whose turns they are, for their Civilopedia entries (civ-clone/web-renderer#620).
 */
export declare const terrainJobDescription: (
  Job: typeof UnitAction,
  Improvement: Function,
  terrains: (typeof Terrain)[]
) => Description;
/** What a ship or an aircraft pays for each move, as base-unit-movement's `air-and-naval` rule charges it. */
export declare const AIR_AND_NAVAL_MOVE_COST = 1;
/** The Ocean a ship moves over, for its Civilopedia entry (civ-clone/web-renderer#620). */
export declare const oceanMovementCostDescription: () => Description;
/**
 * Civilization II's movement costs (`unit_move_dir_step_cost`): base-unit-movement's rules with Civ2's terrain,
 *  routes and jobs, and Civ2's own: a city's square counts as road and railroad, a step along a river costs as a road,
 *  and so does every step of a unit that treats every square as road (Alpine Troops, Partisans, Explorers). A move
 *  takes the cheapest answer.
 */
export declare const getRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  transportRegistry?: TransportRegistry,
  terrainFeatureRegistry?: TerrainFeatureRegistry,
  cityRegistry?: CityRegistry
) => MovementCost[];
export default getRules;
