import {
  Attack,
  Defence,
  Firepower,
  HitPoints,
} from '@civ-clone/core-unit/Yields';
import {
  CARRIES_AIR,
  SEA,
  SUBMARINE,
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
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Fuel from '@civ-clone/base-unit-fuel/lib/Fuel';
import YieldValue from '@civ-clone/core-yield/Yield';
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

/**
 * What each transport holds: its hold, or the carrier's aircraft, or the submarine's missiles. The original's code
 *  holds 20 on a carrier or a submarine and doesn't check it on landing; both hold `CARRIER_CAPACITY` (decision 16,
 *  survey Q9).
 */
export const capacity: [typeof Unit, number][] = units.flatMap(
  (
    [, domain, , , , , , , , hold, , , flags]: UnitRow,
    index: number
  ): [typeof Unit, number][] =>
    (flags & CARRIES_AIR) !== 0 || (domain === SEA && (flags & SUBMARINE) !== 0)
      ? [[unitTypes[index], CARRIER_CAPACITY]]
      : domain === SEA && hold > 0
      ? [[unitTypes[index], hold]]
      : []
);

// Each unit type's row, by class.
const rows = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

/**
 * The combat and fuel figures of each type's row, as yields: `HitPoints` (the row's hit points times 10, as the game
 *  loads them, `rules_load_units`), `Firepower`, and `Fuel` (the range: 0, needing no fuel, for every unit but aircraft
 *  and missiles, and for the Helicopter).
 */
export const combatYields: [typeof YieldValue, (row: UnitRow) => number][] = [
  [HitPoints, ([, , , , , , hitPoints]: UnitRow): number => hitPoints * 10],
  [Firepower, ([, , , , , , , firepower]: UnitRow): number => firepower],
  [Fuel, ([, , , range]: UnitRow): number => range],
];

/** `combatYields` as a unit `Yield` rule and a `BaseYield` rule each, `civ2-unit:unit/yield/<Yield>`. */
export const combatYieldRules = (): (UnitYield | BaseYield)[] =>
  combatYields.flatMap(
    ([YieldType, value]: [typeof YieldValue, (row: UnitRow) => number]): (
      | UnitYield
      | BaseYield
    )[] => [
      new UnitYield(
        `civ2-unit:unit/yield/${YieldType.name}`,
        new Criterion(
          (unit: Unit, unitYield: YieldValue): boolean =>
            unitYield instanceof YieldType && rows.has(unit.constructor)
        ),
        new Effect((unit: Unit, unitYield: YieldValue): void =>
          unitYield.set(value(rows.get(unit.constructor)!))
        )
      ),
      new BaseYield(
        `civ2-unit:unit/base-yield/${YieldType.name}`,
        new Criterion(
          (UnitType: typeof Unit, unitYield: YieldValue): boolean =>
            unitYield instanceof YieldType && rows.has(UnitType)
        ),
        new Effect((UnitType: typeof Unit, unitYield: YieldValue): void =>
          unitYield.set(value(rows.get(UnitType)!))
        )
      ),
    ]
  );

/** A veteran attacks and defends at half as much again (`unit_attack_strength`, `unit_defense_strength`). */
export const getRules = (
  unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  transportRegistry: TransportRegistry = transportRegistryInstance
): (UnitYield | BaseYield)[] => [
  ...unitYieldRules(
    'civ2-unit',
    { ruleRegistry, transportRegistry, unitImprovementRegistry },
    {
      stats,
      improvements: [[Veteran, 0.5, Attack, Defence]],
      capacity,
    }
  ),
  ...combatYieldRules(),
];

export default getRules;
