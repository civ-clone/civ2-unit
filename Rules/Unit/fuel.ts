import { CARRIES_AIR, SUBMARINE, UnitRow, units } from '../../data/units';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import { OutOfFuel, Refuel } from '@civ-clone/base-unit-fuel/lib/Rules';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  refuelAboard,
  refuelInOwnCity,
  refuelInStackWith,
  refuelOnTileImprovement,
} from '@civ-clone/base-unit-fuel/lib/refuel';
import { Airbase } from '@civ-clone/civ2-world/TileImprovements';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import Unit from '@civ-clone/core-unit/Unit';
import fuelRules from '@civ-clone/base-unit-fuel/lib/fuelRules';
import { unitTypes } from '../../lib/unitTable';

// Each unit type's `@UNITS` row, by class.
const rows = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

/** Whether `unit` is a carrier of aircraft (`@UNITS` flag 7). */
export const carriesAircraft = (unit: Unit): boolean =>
  ((rows.get(unit.constructor)?.[12] ?? 0) & CARRIES_AIR) !== 0;

/** Whether `unit` is a submarine (`@UNITS` flag 3), which missiles refuel with. */
export const isSubmarine = (unit: Unit): boolean =>
  ((rows.get(unit.constructor)?.[12] ?? 0) & SUBMARINE) !== 0;

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
 *  (base-unit-fuel's `'out-of-moves'`), and it crashes when the count reaches its range. It refuels in one of its
 *  player's cities, on an Airbase, and on a square with one of its player's carriers (a missile also with a submarine)
 *  or aboard one. A crash emits
 *  `unit:out-of-fuel` (base-unit-fuel's emit rule) before the unit is destroyed.
 */
export const getRules = ({
  cityRegistry = cityRegistryInstance,
  engine = engineInstance,
  ruleRegistry = ruleRegistryInstance,
  tileImprovementRegistry = tileImprovementRegistryInstance,
  transportRegistry = transportRegistryInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
  unitRegistry = unitRegistryInstance,
}: FuelDependencies = {}): (Moved | TurnEnd | OutOfFuel | Refuel)[] => [
  ...fuelRules(
    { engine, ruleRegistry, unitImprovementRegistry, unitRegistry },
    { prefix: 'civ2-unit', countOn: 'out-of-moves' }
  ),
  refuelInOwnCity(cityRegistry, undefined, 'civ2-unit:unit/refuel/city'),
  refuelOnTileImprovement(
    Airbase,
    tileImprovementRegistry,
    undefined,
    'civ2-unit:unit/refuel/airbase'
  ),
  refuelInStackWith(
    (base: Unit, unit: Unit): boolean =>
      carriesAircraft(base) || (isSubmarine(base) && unit.hasTrait(SingleUse)),
    unitRegistry,
    undefined,
    'civ2-unit:unit/refuel/carrier'
  ),
  refuelAboard(transportRegistry, undefined, 'civ2-unit:unit/refuel/aboard'),
];

export default getRules;
