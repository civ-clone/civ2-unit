import Moved from '@civ-clone/core-unit/Rules/Moved';
/**
 * A `SingleUse` unit (a missile, `@UNITS` flag 12) is spent by its attack, whether it won or not (OpenCiv2
 *  `unit_resolve_attack`). No one destroyed it, so it is no loss.
 */
export declare const getRules: () => Moved[];
export default getRules;
