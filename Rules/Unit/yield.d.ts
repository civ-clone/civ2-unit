import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitStats } from '@civ-clone/base-unit-yield/lib/unitYieldRules';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import Unit from '@civ-clone/core-unit/Unit';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
/**
 * How many aircraft a carrier holds. Civilization II's Carrier has no hold (`@UNITS` column 10 is 0: aircraft land on
 *  its square), so this is Civ1's number, until stacking aircraft on a carrier's square is a rule of its own.
 */
export declare const CARRIER_CAPACITY = 8;
/** Each unit type's attack, defence, movement (whole squares) and visibility (2 with flag 0), from its row. */
export declare const stats: UnitStats[];
/** What each transport holds: its hold, or the carrier's aircraft. */
export declare const capacity: [typeof Unit, number][];
/** A veteran attacks and defends at half as much again (`unit_attack_strength`, `unit_defense_strength`). */
export declare const getRules: (
  unitImprovementRegistry?: UnitImprovementRegistry,
  ruleRegistry?: RuleRegistry,
  transportRegistry?: TransportRegistry
) => (UnitYield | BaseYield)[];
export default getRules;
