import Advance from '@civ-clone/core-science/Advance';
import Unit from '@civ-clone/core-unit/Unit';
/** The unit types, by `@UNITS` row: `data/units`' rows, in the same order. Generic names where Civ2's differ. */
export declare const unitTypes: (typeof Unit)[];
/**
 * The advances `@UNITS` names, by `@CIVILIZE` index. Only those: civ2-science keeps the whole table, and this package
 *  doesn't depend on it.
 */
export declare const advanceTypes: Record<number, typeof Advance>;
/** The unit type in `@UNITS` row `index`. */
export declare const unitType: (index: number) => typeof Unit;
/** The advance at `@CIVILIZE` index `index`, or `null` for none. */
export declare const advanceType: (index: number) => typeof Advance | null;
