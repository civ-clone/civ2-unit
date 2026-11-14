import { Attack, SneakAttack } from '../../Actions';
import Action from '@civ-clone/core-unit/Action';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import Unit from '@civ-clone/core-unit/Unit';

/**
 * A `SingleUse` unit (a missile, `@UNITS` flag 12) is spent by its attack, whether it won or not (OpenCiv2
 *  `unit_resolve_attack`). No one destroyed it, so it is no loss.
 */
export const getRules = (): Moved[] => [
  new Moved(
    'civ2-unit:unit/moved/single-use-spent',
    new Criterion((unit: Unit): boolean => unit.hasTrait(SingleUse)),
    new Criterion(
      (unit: Unit, action: Action): boolean =>
        action instanceof Attack || action instanceof SneakAttack
    ),
    new Criterion((unit: Unit): boolean => !unit.destroyed()),
    new Effect((unit: Unit): void => unit.destroy())
  ),
];

export default getRules;
