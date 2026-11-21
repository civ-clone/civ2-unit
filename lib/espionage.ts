import * as CityImprovements from '@civ-clone/civ2-city-improvement/CityImprovements';
import { DIPLOMACY, SETTLE, TRADE, UnitRow, units } from '../data/units';
import { NEVER, advances } from '@civ-clone/civ2-science/data/advances';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Advance from '@civ-clone/core-science/Advance';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import { Spy } from '../Units';
import Unit from '@civ-clone/core-unit/Unit';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { unitTypes } from './unitTable';

// The numbers of Civilization II's Diplomat and Spy missions (OpenCiv2 `src/auto/unit_spy.cpp`, at e39fe7b), as pure
//  functions, so each can be tested at its boundaries. Integer arithmetic is done in the original's order: each
//  division rounds toward zero before the next step.

/** Whether `unit` is a Spy (`units[unit].type == UNIT_SPY`); a Diplomat is not. */
export const isSpy = (unit: Unit): boolean => unit instanceof Spy;

/** Whether `unit` is a veteran (`UNITF_VETERAN`). */
export const isVeteran = (
  unit: Unit,
  unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance
): boolean =>
  unitImprovementRegistry
    .getByUnit(unit)
    .some((improvement): boolean => improvement instanceof Veteran);

/** The `@UNITS` row of `unit`'s type, if it is one of Civ2's. */
export const unitRow = (unit: Unit): UnitRow | undefined => {
  const index = unitTypes.indexOf(unit.constructor as typeof Unit);

  return index < 0 ? undefined : units[index];
};

/** Whether `unit`'s role is the Caravan's and Freight's (`ROLE_TRADE`). */
export const isTradeUnit = (unit: Unit): boolean =>
  unitRow(unit)?.[10] === TRADE;

/** Whether `unit`'s role is the Diplomat's and Spy's (`ROLE_DIPLOMACY`). */
export const isDiplomacyUnit = (unit: Unit): boolean =>
  unitRow(unit)?.[10] === DIPLOMACY;

/** With a Courthouse, a city's distance from its owner's capital counts this many times less in its price to incite. */
export const COURTHOUSE_DISTANCE_DIVISOR = 2;

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
export const inciteCost = ({
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
}: InciteCostInputs): number => {
  let dist = distance;

  if (communist && dist > 9) {
    dist = 10;
  }

  if (courthouse) {
    dist = Math.trunc(dist / COURTHOUSE_DISTANCE_DIVISOR);
  }

  let cost = size * Math.trunc((gold + 1000) / (dist + 3));

  if (cost > 0x7fffffff) {
    cost = 30000;
  }

  if (disorder) {
    cost = Math.trunc(cost / 2);
  }

  if (empty) {
    cost = Math.trunc(cost / 2);
  }

  if (founder) {
    cost = Math.trunc(cost / 2);
  }

  if (spy) {
    cost -= Math.trunc(cost / (veteran ? 3 : 6));
  }

  return cost;
};

/** The most the doubled price may be asked under a treaty: it's offered only below this (`incite_cost < 0x3a99`). */
export const DOUBLED_PRICE_BELOW = 15001;

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
export const bribeCost = ({
  unitCost,
  gold,
  distance,
  briberCommunist,
  settler,
}: BribeCostInputs): number => {
  const dist = briberCommunist && distance > 9 ? 10 : distance;

  let cost = unitCost * Math.trunc((gold + 750) / (dist + 2));

  if (cost > 0x7fffffff) {
    cost = 30000;
  }

  if (!settler) {
    cost = Math.trunc(cost / 2);
  }

  return cost;
};

/** Whether `unit`'s role is the Settlers' and Engineers' (`ROLE_SETTLE`). */
export const isSettlerRole = (unit: Unit): boolean =>
  unitRow(unit)?.[10] === SETTLE;

/**
 * The chance in 100 that a defender in the city detects a random theft (`unit_spy.cpp:405-420`): 20 for a Diplomat, 40
 *  for a Spy, 60 for a veteran Spy; 0 for any other unit.
 */
export const detectionChance = (
  defender: Unit,
  unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance
): number => {
  if (!isDiplomacyUnit(defender)) {
    return 0;
  }

  if (!isSpy(defender)) {
    return 20;
  }

  return isVeteran(defender, unitImprovementRegistry) ? 60 : 40;
};

/**
 * Whether a city's `defenders` detect a random theft: each Diplomat or Spy in turn draws `rand % 100` against its
 *  chance, and the first success stops the search (one draw per Diplomat or Spy until then).
 */
export const detected = (
  defenders: Unit[],
  randomNumberGenerator: () => number,
  unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance
): boolean =>
  defenders.some((defender: Unit): boolean => {
    const chance = detectionChance(defender, unitImprovementRegistry);

    return chance > 0 && Math.floor(randomNumberGenerator() * 100) < chance;
  });

/**
 * The 100 advance slots a random theft walks (`unit_spy.cpp:352-366`, `rand % 100` then on and round): `@CIVILIZE`'s
 *  rows in order, with `null` for a row both of whose prerequisites are `no` (never available) and for the unused
 *  slots after the table.
 */
export const theftOrder: (typeof Advance | null)[] = Array.from(
  { length: 100 },
  (value: unknown, index: number): typeof Advance | null => {
    const row = advances[index];

    if (row === undefined || (row[1] === NEVER && row[2] === NEVER)) {
      return null;
    }

    return row[0];
  }
);

/** The 39 improvement slots before the first Wonder (`IMP_FIRST_WONDER`), in `@IMPROVE` order; `null` where there's none here. */
export const improvementOrder: (typeof CityImprovement | null)[] = [
  null,
  CityImprovements.Palace,
  CityImprovements.Barracks,
  CityImprovements.Granary,
  CityImprovements.Temple,
  CityImprovements.Marketplace,
  CityImprovements.Library,
  CityImprovements.Courthouse,
  CityImprovements.CityWalls,
  CityImprovements.Aqueduct,
  CityImprovements.Bank,
  CityImprovements.Cathedral,
  CityImprovements.University,
  CityImprovements.MassTransit,
  CityImprovements.Colosseum,
  CityImprovements.Factory,
  CityImprovements.ManufacturingPlant,
  CityImprovements.SdiDefence,
  CityImprovements.RecyclingCenter,
  CityImprovements.PowerPlant,
  CityImprovements.HydroPlant,
  CityImprovements.NuclearPlant,
  CityImprovements.StockExchange,
  CityImprovements.SewerSystem,
  CityImprovements.Supermarket,
  CityImprovements.Superhighways,
  CityImprovements.ResearchLab,
  CityImprovements.SamMissileBattery,
  CityImprovements.CoastalFortress,
  CityImprovements.SolarPlant,
  CityImprovements.Harbour,
  CityImprovements.OffshorePlatform,
  CityImprovements.Airport,
  CityImprovements.PoliceStation,
  CityImprovements.PortFacility,
  // The spaceship's three parts and Capitalization, which no city holds here.
  null,
  null,
  null,
  null,
];

/**
 * The improvement a random industrial sabotage takes (`unit_spy.cpp:459-468`): one draw of `rand % 39` for a start, then
 *  the first slot, on and round, that the city has, but never the Palace or SDI Defense. `null` with none.
 */
export const randomSabotageTarget = (
  has: (Improvement: typeof CityImprovement) => boolean,
  randomNumberGenerator: () => number
): typeof CityImprovement | null => {
  const slots = improvementOrder.length,
    start = Math.floor(randomNumberGenerator() * slots);

  for (let i = 0; i < slots; i++) {
    const Improvement = improvementOrder[(i + start) % slots];

    if (
      Improvement !== null &&
      Improvement !== CityImprovements.Palace &&
      Improvement !== CityImprovements.SdiDefence &&
      has(Improvement)
    ) {
      return Improvement;
    }
  }

  return null;
};

/**
 * Whether a random sabotage takes the production instead of an improvement (`unit_spy.cpp:563-575`), asked only when
 *  the city's shield box isn't empty: odds 2 for a Diplomat, 3 for a Spy, one more for a veteran; a roll of
 *  `rand % odds` that is 0 takes the production.
 */
export const sabotagesProduction = (
  spy: boolean,
  veteran: boolean,
  randomNumberGenerator: () => number
): boolean => {
  const odds = (spy ? 3 : 2) + (veteran ? 1 : 0);

  return Math.floor(randomNumberGenerator() * odds) === 0;
};

/**
 * Whether the other civilizations find out about a planted nuclear device (`unit_spy.cpp:693-704`): never under
 *  Fundamentalism; otherwise a roll of `rand % odds` that is 0, with odds 2, or 4 for a veteran Spy.
 */
export const deviceDiscovered = (
  fundamentalist: boolean,
  veteran: boolean,
  randomNumberGenerator: () => number
): boolean =>
  !fundamentalist &&
  Math.floor(randomNumberGenerator() * (veteran ? 4 : 2)) === 0;

/** The production a person's Spy may choose to sabotage, named as a target (the dialog's option 0, `unit_spy.cpp:500-506`). */
export const PRODUCTION = 'production';
