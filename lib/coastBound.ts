import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RequirementRegistry,
  instance as requirementRegistryInstance,
} from '@civ-clone/core-requirement/RequirementRegistry';
import {
  WonderRegistry,
  instance as wonderRegistryInstance,
} from '@civ-clone/core-wonder/WonderRegistry';
import Description from '@civ-clone/core-rule/Description';
import Lighthouse from '@civ-clone/base-wonder-lighthouse/Lighthouse';
import Navigation from '@civ-clone/base-science-advance-navigation/Navigation';
import Seafaring from '@civ-clone/base-science-advance-seafaring/Seafaring';
import { Trireme } from '@civ-clone/base-unit-trireme/Trireme';
import Unit from '@civ-clone/core-unit/Unit';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import { playerOwnsWonder } from '@civ-clone/base-wonder/lib/hasWonder';

/** base-unit-lifecycle's rule that loses a coast-bound ship at sea, which says what the Lighthouse does. */
export const LIGHTHOUSE_DESCRIBED_RULE =
  'civ2-unit:unit/moved/trireme-lost-at-sea';

/**
 * What the Lighthouse does, for the Civilopedia (civ-clone/web-renderer#1291): its owner's coast-bound ships, which
 *  are only Triremes in Civ2's `@UNITS`, are never lost at sea (`triremeLossChance`).
 */
export const lighthouseDescription = (): Description =>
  new Description({
    type: 'protects_from',
    subject: Lighthouse,
    event: 'lost_at_sea',
    what: 'units',
    unit: Trireme,
  });

export interface CoastBoundDependencies {
  playerResearchRegistry?: PlayerResearchRegistry;
  requirementRegistry?: RequirementRegistry;
  wonderRegistry?: WonderRegistry;
}

/**
 * The chance a coast-bound ship (the Trireme) ending its move out of sight of land is lost (`unit_move_dir_trireme_loss`):
 *  1 in @COSMIC's 2, the odds doubled with Seafaring (at least 1 in 2) and again with Navigation, and never while its
 *  player has the Lighthouse. The original asks only for the local human's moves; here every player's ships are at
 *  risk (decision 3, survey Q8).
 */
export const triremeLossChance =
  ({
    playerResearchRegistry = playerResearchRegistryInstance,
    requirementRegistry = requirementRegistryInstance,
    wonderRegistry = wonderRegistryInstance,
  }: CoastBoundDependencies = {}) =>
  (unit: Unit): number => {
    const player = unit.player();

    if (
      playerOwnsWonder(
        player,
        Lighthouse,
        wonderRegistry,
        playerResearchRegistry,
        requirementRegistry
      )
    ) {
      return 0;
    }

    const research = playerResearchRegistry.getByPlayer(player);
    let odds = cosmic.triremeLossChance;

    if (research.completed(Seafaring)) {
      odds = Math.max(odds * 2, 2);
    }

    if (research.completed(Navigation)) {
      odds *= 2;
    }

    return odds < 2 ? 1 : 1 / odds;
  };

export default triremeLossChance;
