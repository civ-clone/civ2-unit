import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CanJoinCity from '@civ-clone/base-unit-action-join-city/Rules/CanJoinCity';
import City from '@civ-clone/core-city/City';
/**
 * Settlers join a city only below @COSMIC's Aqueduct size (8), whatever the city has built: OpenCiv2
 *  `src/auto/unit.cpp` `unit_cmd_build_city` (richardpenman/civ2@49f26ec) compares the size with @COSMIC's Aqueduct size
 *  alone, and an Aqueduct or Sewer System doesn't lift it. (A computer player's settler joins below 10, `ai.cpp`'s
 *  orders: not modelled.)
 */
export declare const tooLargeToJoin: (
  city: City,
  cityGrowthRegistry?: CityGrowthRegistry
) => boolean;
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry
) => CanJoinCity[];
export default getRules;
