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
import Lighthouse from '@civ-clone/base-wonder-lighthouse/Lighthouse';
import Navigation from '@civ-clone/base-science-advance-navigation/Navigation';
import Seafaring from '@civ-clone/base-science-advance-seafaring/Seafaring';
import Unit from '@civ-clone/core-unit/Unit';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import { playerOwnsWonder } from '@civ-clone/base-wonder/lib/hasWonder';

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
