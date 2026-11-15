import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Engineer } from '../../Units';
import Unit from '@civ-clone/core-unit/Unit';
import WorkRate from '@civ-clone/core-unit/Rules/WorkRate';

/** Engineers do two turns' terrain work in one (`unit_do_terrain_work`), so their jobs take half the turns. */
export const getRules = (): WorkRate[] => [
  new WorkRate(
    'civ2-unit:unit/work-rate/engineers',
    new Criterion((unit: Unit): boolean => unit instanceof Engineer),
    new Effect((): number => 2)
  ),
];

export default getRules;
