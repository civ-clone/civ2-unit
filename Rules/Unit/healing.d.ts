import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { LandMassRegistry } from '@civ-clone/core-world/LandMassRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
/** The improvement that heals a unit of each domain fully in a city (`civ_heal_units`). */
export declare const healingFacilities: [number, typeof CityImprovement][];
export interface HealingDependencies {
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  landMassRegistry?: LandMassRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
}
/**
 * Civilization II's healing (`civ_heal_units`, at the start of each of the player's turns, for the units that didn't
 *  move in their last one) and the slowing of damaged units (`unit_max_moves`):
 * - a step is a tenth of the unit's hit points; 1 step resting, 2 on a Fortress;
 * - a land unit within 3 (`map_distance`) of its player's nearest city on its land mass heals 1 step more, or 2 if
 *   that city has Barracks;
 * - twice as many in one of its player's cities;
 * - fully in a city with its domain's facility (Barracks, Airport, Port Facility), and an aircraft fully on an
 *   Airbase;
 * - a Helicopter (an aircraft with no range) that moved and isn't in a city or on an airbase loses a step, but never
 *   its last hit point;
 * - a damaged land unit or ship has its moves cut in proportion to its hit points, in thirds of a move rounded up to a
 *   whole move, at least 1 on land and 2 at sea; aircraft aren't slowed.
 */
export declare const getRules: ({
  cityImprovementRegistry,
  cityRegistry,
  landMassRegistry,
  tileImprovementRegistry,
  unitImprovementRegistry,
  unitRegistry,
}?: HealingDependencies) => (Moved | TurnStart | UnitYield)[];
export default getRules;
