import { NONE, UnitRow, units } from './data/units';
import { Requirement, table } from '@civ-clone/core-requirement/Requirement';
import { advanceType, unitTypes } from './lib/unitTable';
import Advance from '@civ-clone/core-science/Advance';
import Unit from '@civ-clone/core-unit/Unit';

// What Civilization II's units need and what makes them obsolete, from `@UNITS` columns 12 and 1, as the entries
//  `Rules/City/build` makes its rules from (`civ_can_build_unit`). `registerRules` adds them to the game's
//  `requirements`.

const rowsWith = (column: 0 | 11): [typeof Unit, typeof Advance][] =>
  units.flatMap(
    (row: UnitRow, index: number): [typeof Unit, typeof Advance][] =>
      row[column] === NONE
        ? []
        : [[unitTypes[index], advanceType(row[column]) as typeof Advance]]
  );

/** The advance a city's player needs before it can build each unit: one rule each. */
export const requiresAdvance: Requirement[] = table(
  'civ2-unit:city/build/requires-advance',
  'requires',
  rowsWith(11)
);

/** The advance that stops a city's player building each unit: one rule each. */
export const obsoletedBy: Requirement[] = table(
  'civ2-unit:city/build/obsolete',
  'obsoletedBy',
  rowsWith(0)
);

/** The entries `Rules/City/build`'s deriver makes rules from. */
export const buildRequirements: Requirement[] = [
  ...requiresAdvance,
  ...obsoletedBy,
];

export default buildRequirements;
