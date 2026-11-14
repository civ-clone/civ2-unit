import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CanJoinCity from '@civ-clone/base-unit-action-join-city/Rules/CanJoinCity';
import City from '@civ-clone/core-city/City';
/**
 * Settlers join a city only below @COSMIC's Aqueduct size (8), as no city in M2a has an Aqueduct or Sewer. Not checked
 *  against OpenCiv2's join order: an M2a deviation until civ2-city-improvement (D2).
 */
export declare const tooLargeToJoin: (
  city: City,
  cityGrowthRegistry?: CityGrowthRegistry
) => boolean;
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry
) => CanJoinCity[];
export default getRules;
