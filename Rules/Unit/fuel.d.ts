import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { OutOfFuel, Refuel } from '@civ-clone/base-unit-fuel/lib/Rules';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import Unit from '@civ-clone/core-unit/Unit';
/** Whether `unit` is a carrier of aircraft (`@UNITS` flag 7). */
export declare const carriesAircraft: (unit: Unit) => boolean;
/** Whether `unit` is a submarine (`@UNITS` flag 3), which missiles refuel with. */
export declare const isSubmarine: (unit: Unit) => boolean;
export interface FuelDependencies {
  cityRegistry?: CityRegistry;
  engine?: Engine;
  ruleRegistry?: RuleRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  transportRegistry?: TransportRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
}
/**
 * Civilization II's fuel (`unit_move_dir_air_fuel`): a unit's range is its `Fuel` yield (the `@UNITS` range column, 0
 *  for the Helicopter, which needs none), counted each time it runs out of moves away from a refuelling point
 *  (base-unit-fuel's `'out-of-moves'`), and it crashes when the count reaches its range. It refuels in a city (any
 *  player's, `tile_city_owner`), on an Airbase, and on a square with one of its player's carriers (a missile also with a submarine)
 *  or aboard one. A crash emits
 *  `unit:out-of-fuel` (base-unit-fuel's emit rule) before the unit is destroyed.
 */
export declare const getRules: ({
  cityRegistry,
  engine,
  ruleRegistry,
  tileImprovementRegistry,
  transportRegistry,
  unitImprovementRegistry,
  unitRegistry,
}?: FuelDependencies) => (Moved | TurnEnd | OutOfFuel | Refuel)[];
export default getRules;
