import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
/**
 * Whether anyone has ever built the Manhattan Project, standing or lost with its city since: what `Rules/City/build`'s
 *  `nuclear` rule asks (OpenCiv2 `civ_can_build_unit` reads `wonder_city[WONDER_MANHATTAN] != -1`, and a lost Wonder is
 *  -2, richardpenman/civ2@49f26ec). Read from the game's own registries, so this package needs no Wonder rules of its
 *  own: civ2-wonder builds it.
 */
export declare const manhattanProjectBuilt: (
  wonderRegistry?: WonderRegistry,
  cityImprovementRegistry?: CityImprovementRegistry
) => () => boolean;
export default manhattanProjectBuilt;
