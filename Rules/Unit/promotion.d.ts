import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
export interface PromotionDependencies {
  randomNumberGenerator?: () => number;
  ruleRegistry?: RuleRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
}
/**
 * The winner of a battle becomes a veteran with a chance of the loser's strength over both (`unit_resolve_attack_veterans`,
 *  `unit_promote_veteran`), at the strengths the battle was fought at (base-combat-rounds' `roundsStrengths`, after the
 *  `CombatModifiers` rules), 8 steps to 1. A missile (`SingleUse`) never is. Sun Tzu's War Academy makes it certain:
 *  civ2-wonder answers `PromotionChance`. `civ2-unit:unit/defeated/promotion`, `High`, before the loser is destroyed.
 */
export declare const getRules: ({
  randomNumberGenerator,
  ruleRegistry,
  unitImprovementRegistry,
}?: PromotionDependencies) => Defeated[];
export default getRules;
