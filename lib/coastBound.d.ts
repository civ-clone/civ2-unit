import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import Unit from '@civ-clone/core-unit/Unit';
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
export declare const triremeLossChance: ({
  playerResearchRegistry,
  requirementRegistry,
  wonderRegistry,
}?: CoastBoundDependencies) => (unit: Unit) => number;
export default triremeLossChance;
