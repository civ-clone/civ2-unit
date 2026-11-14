import {
  BuildCost,
  buildCost,
} from '@civ-clone/core-city-build/Rules/BuildCost';
import { UnitRow, units } from '../../data/units';
import Buildable from '@civ-clone/core-city-build/Buildable';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import { unitTypes } from '../../lib/unitTable';

/** Each unit's cost in shields: `@UNITS` column 9's rows of shields, times @COSMIC's shield box rows (10). */
export const getRules = (): BuildCost[] =>
  units.flatMap(([, , , , , , , , cost]: UnitRow, index: number): BuildCost[] =>
    buildCost(
      unitTypes[index] as unknown as typeof Buildable,
      cost * cosmic.shieldBoxRows,
      'civ2-unit:city/build-cost'
    )
  );

export default getRules;
