import { AIR, LAND, SEA, UnitRow, units } from '../../data/units';
import { Airbase, Fortress } from '@civ-clone/civ2-world/TileImprovements';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  LandMassRegistry,
  instance as landMassRegistryInstance,
} from '@civ-clone/core-world/LandMassRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import Air from '@civ-clone/base-unit-type-air/Air';
import City from '@civ-clone/core-city/City';
import Description from '@civ-clone/core-rule/Description';
import Land from '@civ-clone/base-unit-type-land/Land';
import Naval from '@civ-clone/base-unit-type-naval/Naval';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import PortFacility from '@civ-clone/base-city-improvement-portfacility/PortFacility';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Unit from '@civ-clone/core-unit/Unit';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import damagedMovementRules from '@civ-clone/base-unit-healing/lib/damagedMovementRules';
import { describedRule } from '../../lib/describedRule';
import distance from '../../lib/distance';
import healingRules from '@civ-clone/base-unit-healing/lib/healingRules';
import { unitTypes } from '../../lib/unitTable';

// Each unit type's `@UNITS` row, by class.
const rows = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

const domainOf = (unit: Unit): number | undefined =>
  rows.get(unit.constructor)?.[1];

/** The improvement that heals a unit of each domain fully in a city (`civ_heal_units`). */
export const healingFacilities: [number, typeof CityImprovement][] = [
  [LAND, Barracks],
  [AIR, Airport],
  [SEA, PortFacility],
];

/** The unit type of each domain, as a description names it (civ-clone/web-renderer#1196). */
export const domainUnitTypes: [number, typeof Unit][] = [
  [LAND, Land],
  [AIR, Air],
  [SEA, Naval],
];

/** The unit type of a domain. */
export const domainUnitType = (domain: number): typeof Unit =>
  domainUnitTypes.find(
    ([unitDomain]: [number, typeof Unit]): boolean => unitDomain === domain
  )![1];

/** The rule of base-unit-healing's that heals, which says what each of `healingFacilities` does. */
export const HEAL_UNITS_RULE = 'civ2-unit:player/turn-start/heal-units';

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
export const getRules = ({
  cityImprovementRegistry = cityImprovementRegistryInstance,
  cityRegistry = cityRegistryInstance,
  landMassRegistry = landMassRegistryInstance,
  tileImprovementRegistry = tileImprovementRegistryInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
  unitRegistry = unitRegistryInstance,
}: HealingDependencies = {}): (Moved | TurnStart | UnitYield)[] => {
  const hasImprovement = (
      tile: Tile,
      Improvement: typeof TileImprovement
    ): boolean =>
      tileImprovementRegistry
        .getByTile(tile)
        .some(
          (improvement: TileImprovement): boolean =>
            improvement instanceof Improvement
        ),
    cityHas = (city: City, Improvement: typeof CityImprovement): boolean =>
      cityImprovementRegistry
        .getByCity(city)
        .some(
          (improvement: CityImprovement): boolean =>
            improvement instanceof Improvement
        ),
    facilityFor = (unit: Unit): typeof CityImprovement | undefined =>
      healingFacilities.find(
        ([domain]: [number, typeof CityImprovement]): boolean =>
          domain === domainOf(unit)
      )?.[1];

  return [
    ...(healingRules(
      {
        cityRegistry,
        landMassRegistry,
        unitImprovementRegistry,
        unitRegistry,
      },
      {
        prefix: 'civ2-unit',
        stepsPerMaximum: 10,
        restSteps: (unit: Unit): number =>
          hasImprovement(unit.tile(), Fortress) ? 2 : 1,
        nearCity: {
          distance: 3,
          appliesTo: (unit: Unit): boolean => domainOf(unit) === LAND,
          steps: (unit: Unit, city: City): number =>
            cityHas(city, Barracks) ? 2 : 1,
        },
        inCityMultiplier: 2,
        fullHeal: (unit: Unit, city: City | null): boolean => {
          const Facility = facilityFor(unit);

          return (
            (city !== null &&
              Facility !== undefined &&
              cityHas(city, Facility)) ||
            (domainOf(unit) === AIR && hasImprovement(unit.tile(), Airbase))
          );
        },
        decay: {
          appliesTo: (unit: Unit): boolean =>
            domainOf(unit) === AIR &&
            rows.get(unit.constructor)?.[3] === 0 &&
            cityRegistry.getByTile(unit.tile()) === null &&
            !hasImprovement(unit.tile(), Airbase),
          steps: 1,
        },
        distance,
      }
    ).map((rule: Moved | TurnStart): Moved | TurnStart =>
      rule.id() === HEAL_UNITS_RULE
        ? describedRule(
            rule,
            new Description(
              ...healingFacilities.map(
                ([domain, Facility]: [number, typeof CityImprovement]) => ({
                  type: 'heals',
                  subject: Facility,
                  unit: domainUnitType(domain),
                })
              )
            )
          )
        : rule
    ) as (Moved | TurnStart)[]),
    ...damagedMovementRules({
      id: 'civ2-unit:unit/yield/damaged-movement',
      stepsPerMove: cosmic.roadMoveMultiplier,
      minimum: (unit: Unit): number => (domainOf(unit) === SEA ? 2 : 1),
      appliesTo: (unit: Unit): boolean =>
        domainOf(unit) !== undefined && domainOf(unit) !== AIR,
    }),
  ];
};

export default getRules;
