import { UnitRow } from '../../data/units';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitStats } from '@civ-clone/base-unit-yield/lib/unitYieldRules';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import YieldValue from '@civ-clone/core-yield/Yield';
import Unit from '@civ-clone/core-unit/Unit';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
/**
 * How many aircraft a carrier holds. Civilization II's Carrier has no hold (`@UNITS` column 10 is 0: aircraft land on
 *  its square), so this is Civ1's number, until stacking aircraft on a carrier's square is a rule of its own.
 */
export declare const CARRIER_CAPACITY = 8;
/** Each unit type's attack, defence, movement (whole squares) and visibility (2 with flag 0), from its row. */
export declare const stats: UnitStats[];
/**
 * What each transport holds: its hold, or the carrier's aircraft, or the submarine's missiles. The original's code
 *  holds 20 on a carrier or a submarine and doesn't check it on landing; both hold `CARRIER_CAPACITY` (decision 16,
 *  survey Q9).
 */
export declare const capacity: [typeof Unit, number][];
/**
 * The combat and fuel figures of each type's row, as yields: `HitPoints` (the row's hit points times 10, as the game
 *  loads them, `rules_load_units`), `Firepower`, and `Fuel` (the range: 0, needing no fuel, for every unit but aircraft
 *  and missiles, and for the Helicopter).
 */
export declare const combatYields: [
  typeof YieldValue,
  (row: UnitRow) => number
][];
/** `combatYields` as a unit `Yield` rule and a `BaseYield` rule each, `civ2-unit:unit/yield/<Yield>`. */
export declare const combatYieldRules: () => (UnitYield | BaseYield)[];
/** A veteran attacks and defends at half as much again (`unit_attack_strength`, `unit_defense_strength`). */
export declare const getRules: (
  unitImprovementRegistry?: UnitImprovementRegistry,
  ruleRegistry?: RuleRegistry,
  transportRegistry?: TransportRegistry
) => (UnitYield | BaseYield)[];
export default getRules;
