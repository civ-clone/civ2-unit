import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CanJoinCity from '@civ-clone/base-unit-action-join-city/Rules/CanJoinCity';
import City from '@civ-clone/core-city/City';
import Effect from '@civ-clone/core-rule/Effect';
import Unit from '@civ-clone/core-unit/Unit';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import { tooLargeToJoin as sizeLimit } from '@civ-clone/base-unit-action-join-city/lib/sizeLimit';

/**
 * Settlers join a city only below @COSMIC's Aqueduct size (8), whatever the city has built: OpenCiv2
 *  `src/auto/unit.cpp` `unit_cmd_build_city` (richardpenman/civ2@49f26ec) compares the size with @COSMIC's Aqueduct size
 *  alone, and an Aqueduct or Sewer System doesn't lift it. (A computer player's settler joins below 10, `ai.cpp`'s
 *  orders: not modelled.)
 */
export const tooLargeToJoin = sizeLimit(cosmic.aqueductSize);

export const getRules = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): CanJoinCity[] => [
  new CanJoinCity(
    'civ2-unit:unit/can-join-city/size-limit',
    new Effect(
      (unit: Unit, city: City): boolean =>
        !tooLargeToJoin(city, cityGrowthRegistry)
    )
  ),
];

export default getRules;
