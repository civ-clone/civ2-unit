import { BuildCost } from '@civ-clone/core-city-build/Rules/BuildCost';
/** Each unit's cost in shields: `@UNITS` column 9's rows of shields, times @COSMIC's shield box rows (10). */
export declare const getRules: () => BuildCost[];
export default getRules;
