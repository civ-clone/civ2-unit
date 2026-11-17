import { UnitRow } from '../data/units';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Advance from '@civ-clone/core-science/Advance';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Unit from '@civ-clone/core-unit/Unit';
/** Whether `unit` is a Spy (`units[unit].type == UNIT_SPY`); a Diplomat is not. */
export declare const isSpy: (unit: Unit) => boolean;
/** Whether `unit` is a veteran (`UNITF_VETERAN`). */
export declare const isVeteran: (
  unit: Unit,
  unitImprovementRegistry?: UnitImprovementRegistry
) => boolean;
/** The `@UNITS` row of `unit`'s type, if it is one of Civ2's. */
export declare const unitRow: (unit: Unit) => UnitRow | undefined;
/** Whether `unit`'s role is the Caravan's and Freight's (`ROLE_TRADE`). */
export declare const isTradeUnit: (unit: Unit) => boolean;
/** Whether `unit`'s role is the Diplomat's and Spy's (`ROLE_DIPLOMACY`). */
export declare const isDiplomacyUnit: (unit: Unit) => boolean;
/** What can tip a city's price to incite (`spy_city_mission_incite_revolt`, `unit_spy.cpp:753-786`). */
export interface InciteCostInputs {
  /** The city's size. */
  size: number;
  /** The victim's gold. */
  gold: number;
  /** `civ_distance_to_capital`: the diagonal distance from the agent to the victim's nearest Palace, 16 with none. */
  distance: number;
  /** The victim is Communist: the distance is at most 10. */
  communist: boolean;
  /** The city has a Courthouse: the distance is halved. */
  courthouse: boolean;
  /** The city is in civil disorder (`CITYF_DISORDER`). */
  disorder: boolean;
  /** No unit stands in the city. */
  empty: boolean;
  /** The inciter is the city's founder (`cities[].founder`). */
  founder: boolean;
  /** The agent is a Spy. */
  spy: boolean;
  /** The agent is a veteran. */
  veteran: boolean;
}
/**
 * The price to incite a city, `spy_city_mission_incite_revolt` (`unit_spy.cpp:759-786`), in the original's order:
 * - the distance, at most 10 for a Communist victim, then halved with a Courthouse;
 * - `size × ((gold + 1000) / (distance + 3))`, the division first; 30000 if that overflows a 32-bit integer;
 * - halved in disorder, halved again for an empty city, and again when the inciter founded it;
 * - a Spy takes a sixth off (a veteran a third), each rounded down before it's taken.
 */
export declare const inciteCost: ({
  size,
  gold,
  distance,
  communist,
  courthouse,
  disorder,
  empty,
  founder,
  spy,
  veteran,
}: InciteCostInputs) => number;
/** The most the doubled price may be asked under a treaty: it's offered only below this (`incite_cost < 0x3a99`). */
export declare const DOUBLED_PRICE_BELOW = 15001;
/** What sets the price to bribe a unit (`unit_bribe`, `unit_spy.cpp:1093-1114`). */
export interface BribeCostInputs {
  /** The unit type's `@UNITS` cost, in rows of shields. */
  unitCost: number;
  /** The unit's owner's gold. */
  gold: number;
  /** `civ_distance_to_capital` from the unit's owner's nearest Palace to the unit, 16 with none. */
  distance: number;
  /** The briber is Communist: the distance is at most 10. */
  briberCommunist: boolean;
  /** The unit's role is the Settlers' (`ROLE_SETTLE`): the price isn't halved. */
  settler: boolean;
}
/**
 * The price to bribe a unit (`unit_bribe`, `unit_spy.cpp:1104-1114`): `cost × ((gold + 750) / (distance + 2))`, the
 *  division first, the distance at most 10 when the briber is Communist; 30000 on overflow; halved unless the unit is
 *  a Settlers-role one.
 */
export declare const bribeCost: ({
  unitCost,
  gold,
  distance,
  briberCommunist,
  settler,
}: BribeCostInputs) => number;
/** Whether `unit`'s role is the Settlers' and Engineers' (`ROLE_SETTLE`). */
export declare const isSettlerRole: (unit: Unit) => boolean;
/**
 * The chance in 100 that a defender in the city detects a random theft (`unit_spy.cpp:405-420`): 20 for a Diplomat, 40
 *  for a Spy, 60 for a veteran Spy; 0 for any other unit.
 */
export declare const detectionChance: (
  defender: Unit,
  unitImprovementRegistry?: UnitImprovementRegistry
) => number;
/**
 * Whether a city's `defenders` detect a random theft: each Diplomat or Spy in turn draws `rand % 100` against its
 *  chance, and the first success stops the search (one draw per Diplomat or Spy until then).
 */
export declare const detected: (
  defenders: Unit[],
  randomNumberGenerator: () => number,
  unitImprovementRegistry?: UnitImprovementRegistry
) => boolean;
/**
 * The 100 advance slots a random theft walks (`unit_spy.cpp:352-366`, `rand % 100` then on and round): `@CIVILIZE`'s
 *  rows in order, with `null` for a row both of whose prerequisites are `no` (never available) and for the unused
 *  slots after the table.
 */
export declare const theftOrder: (typeof Advance | null)[];
/** The 39 improvement slots before the first Wonder (`IMP_FIRST_WONDER`), in `@IMPROVE` order; `null` where there's none here. */
export declare const improvementOrder: (typeof CityImprovement | null)[];
/**
 * The improvement a random industrial sabotage takes (`unit_spy.cpp:459-468`): one draw of `rand % 39` for a start, then
 *  the first slot, on and round, that the city has, but never the Palace or SDI Defense. `null` with none.
 */
export declare const randomSabotageTarget: (
  has: (Improvement: typeof CityImprovement) => boolean,
  randomNumberGenerator: () => number
) => typeof CityImprovement | null;
/**
 * Whether a random sabotage takes the production instead of an improvement (`unit_spy.cpp:563-575`), asked only when
 *  the city's shield box isn't empty: odds 2 for a Diplomat, 3 for a Spy, one more for a veteran; a roll of
 *  `rand % odds` that is 0 takes the production.
 */
export declare const sabotagesProduction: (
  spy: boolean,
  veteran: boolean,
  randomNumberGenerator: () => number
) => boolean;
/**
 * Whether the other civilizations find out about a planted nuclear device (`unit_spy.cpp:693-704`): never under
 *  Fundamentalism; otherwise a roll of `rand % odds` that is 0, with odds 2, or 4 for a veteran Spy.
 */
export declare const deviceDiscovered: (
  fundamentalist: boolean,
  veteran: boolean,
  randomNumberGenerator: () => number
) => boolean;
/** The production a person's Spy may choose to sabotage, named as a target (the dialog's option 0, `unit_spy.cpp:500-506`). */
export declare const PRODUCTION = 'production';
