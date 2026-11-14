import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import {
  CARRIES_AIR,
  SEA,
  SEES_TWO_SPACES,
  UnitRow,
  units,
} from '../../data/units';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import unitYieldRules, {
  UnitStats,
} from '@civ-clone/base-unit-yield/lib/unitYieldRules';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import Unit from '@civ-clone/core-unit/Unit';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { unitTypes } from '../../lib/unitTable';

/**
 * How many aircraft a carrier holds. Civilization II's Carrier has no hold (`@UNITS` column 10 is 0: aircraft land on
 *  its square), so this is Civ1's number, until stacking aircraft on a carrier's square is a rule of its own.
 */
export const CARRIER_CAPACITY = 8;

/** Each unit type's attack, defence, movement (whole squares) and visibility (2 with flag 0), from its row. */
export const stats: UnitStats[] = units.map(
  (
    [, , move, , attack, defence, , , , , , , flags]: UnitRow,
    index: number
  ): UnitStats => [
    unitTypes[index],
    attack,
    defence,
    move,
    (flags & SEES_TWO_SPACES) !== 0 ? 2 : 1,
  ]
);

/** What each transport holds: its hold, or the carrier's aircraft. */
export const capacity: [typeof Unit, number][] = units.flatMap(
  (
    [, domain, , , , , , , , hold, , , flags]: UnitRow,
    index: number
  ): [typeof Unit, number][] =>
    (flags & CARRIES_AIR) !== 0
      ? [[unitTypes[index], CARRIER_CAPACITY]]
      : domain === SEA && hold > 0
      ? [[unitTypes[index], hold]]
      : []
);

/** A veteran attacks and defends at half as much again (`unit_attack_strength`, `unit_defense_strength`). */
export const getRules = (
  unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  transportRegistry: TransportRegistry = transportRegistryInstance
): (UnitYield | BaseYield)[] =>
  unitYieldRules(
    'civ2-unit',
    { ruleRegistry, transportRegistry, unitImprovementRegistry },
    {
      stats,
      improvements: [[Veteran, 0.5, Attack, Defence]],
      capacity,
    }
  );

export default getRules;
