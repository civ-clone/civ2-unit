import { TerrainJob } from '@civ-clone/base-terrain-properties/lib/jobTurns';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
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
