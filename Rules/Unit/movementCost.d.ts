import { TerrainJob } from '@civ-clone/base-terrain-properties/lib/jobTurns';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import Terrain from '@civ-clone/core-terrain/Terrain';
import UnitAction from '@civ-clone/core-unit/Action';
/** What a land unit's move onto each terrain costs: civ2-world's `@TERRAIN` movement costs, looked up by class. */
export declare const terrainCost: (terrain: Terrain) => number | null;
/**
 * How many turns each terrain job takes in Civilization II (`unit_terrain_work_turns`): irrigating and mining from
 *  `@TERRAIN`, a road twice the terrain's movement cost and a railroad four times it, pollution 4. A conversion (Clear
 *  Forest, Plant Forest...) is the irrigate or mine order on that terrain, so it takes that order's time.
 */
export declare const civ2TerrainJobTurns: TerrainJob<typeof UnitAction>[];
/**
 * Civilization II's movement costs (`unit_move_dir_step_cost`): base-unit-movement's rules with Civ2's terrain,
 *  routes and jobs, and two of Civ2's own: along a river, and a unit that treats every square as road (Alpine Troops,
 *  Partisans, Explorers). A move takes the cheapest answer.
 */
export declare const getRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  transportRegistry?: TransportRegistry,
  terrainFeatureRegistry?: TerrainFeatureRegistry
) => MovementCost[];
export default getRules;
