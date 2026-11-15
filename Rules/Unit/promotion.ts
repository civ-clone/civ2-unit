import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import { STRENGTH_SCALE } from './combat';
import { instance as rngInstance } from '@civ-clone/core-random';
import { roundsStrengths } from '@civ-clone/base-combat-rounds/lib/combatRoundsRules';
import veteranPromotionRules from '@civ-clone/base-unit-veteran-promotion/lib/veteranPromotionRules';

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
export const getRules = ({
  randomNumberGenerator = rngInstance,
  ruleRegistry = ruleRegistryInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
}: PromotionDependencies = {}): Defeated[] =>
  veteranPromotionRules(
    { randomNumberGenerator, ruleRegistry, unitImprovementRegistry },
    {
      id: 'civ2-unit:unit/defeated/promotion',
      strengthScale: STRENGTH_SCALE,
      strengths: roundsStrengths(ruleRegistry),
    }
  );

export default getRules;
