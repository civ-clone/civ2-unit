import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Engineer } from '../../Units';
import Unit from '@civ-clone/core-unit/Unit';
import WorkRate from '@civ-clone/core-unit/Rules/WorkRate';

/** How many turns' terrain work Engineers do in one. */
export const ENGINEER_WORK_RATE = 2;

/** Engineers do two turns' terrain work in one (`unit_do_terrain_work`), so their jobs take half the turns. */
export const getRules = (): WorkRate[] => [
  new WorkRate(
    'civ2-unit:unit/work-rate/engineers',
    new Criterion((unit: Unit): boolean => unit instanceof Engineer),
    new Effect((): number => ENGINEER_WORK_RATE)
  ),
];

export default getRules;
