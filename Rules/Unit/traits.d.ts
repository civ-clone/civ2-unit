import { UnitRow } from '../../data/units';
import UnitTraits, { unitTraits } from '@civ-clone/core-unit/Rules/UnitTraits';
/** The prefix of every trait declaration's id: `civ2-unit:unit/trait/<Unit>/<Trait>`. */
export declare const TRAIT_RULE_PREFIX = 'civ2-unit:unit/trait';
type Trait = Parameters<typeof unitTraits>[2];
/**
 * What a `@UNITS` row gives its unit type beyond its domain, in a fixed order: the flags (column 13), the role (column
 *  11: 5 settles, 6 diplomacy, 7 trade), and the numbers that mean an ability (an attack of 99 detonates; a ship with a
 *  hold carries land units). OpenCiv2 asks the same columns (`civ_can_build_unit`, `unit_resolve_attack`,
 *  `unit_move_dir_step_cost`, `unit_defense_strength`).
 */
export declare const traitsOf: (row: UnitRow) => Trait[];
/**
 * What each Civilization II unit type can do beyond what its domain (`Land`, `Naval`, `Air`) gives it, from its
 *  `@UNITS` row, declared on the leaf class. The Spy's extra missions are its identity, not a column: it is `Covert`.
 */
export declare const getRules: () => UnitTraits[];
export default getRules;
