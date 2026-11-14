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
 * Settlers join a city only below @COSMIC's Aqueduct size (8), as no city in M2a has an Aqueduct or Sewer. Not checked
 *  against OpenCiv2's join order: an M2a deviation until civ2-city-improvement (D2).
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
