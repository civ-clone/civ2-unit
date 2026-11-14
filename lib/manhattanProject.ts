import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  WonderRegistry,
  instance as wonderRegistryInstance,
} from '@civ-clone/core-wonder/WonderRegistry';
import ManhattanProject from '@civ-clone/base-wonder-manhattanproject/ManhattanProject';
import { everBuilt } from '@civ-clone/base-wonder/lib/wonderHistory';

/**
 * Whether anyone has ever built the Manhattan Project, standing or lost with its city since: what `Rules/City/build`'s
 *  `nuclear` rule asks (OpenCiv2 `civ_can_build_unit` reads `wonder_city[WONDER_MANHATTAN] != -1`, and a lost Wonder is
 *  -2, richardpenman/civ2@49f26ec). Read from the game's own registries, so this package needs no Wonder rules of its
 *  own: civ2-wonder builds it.
 */
export const manhattanProjectBuilt =
  (
    wonderRegistry: WonderRegistry = wonderRegistryInstance,
    cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance
  ): (() => boolean) =>
  (): boolean =>
    everBuilt(ManhattanProject, wonderRegistry, cityImprovementRegistry);

export default manhattanProjectBuilt;
