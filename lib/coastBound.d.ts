import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import Description from '@civ-clone/core-rule/Description';
import Unit from '@civ-clone/core-unit/Unit';
/** base-unit-lifecycle's rule that loses a coast-bound ship at sea, which says what the Lighthouse does. */
export declare const LIGHTHOUSE_DESCRIBED_RULE =
  'civ2-unit:unit/moved/trireme-lost-at-sea';
/**
 * What the Lighthouse does, for the Civilopedia (civ-clone/web-renderer#1291): its owner's coast-bound ships, which
 *  are only Triremes in Civ2's `@UNITS`, are never lost at sea (`triremeLossChance`).
 */
export declare const lighthouseDescription: () => Description;
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
