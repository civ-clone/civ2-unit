import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import {
  SneakAttack,
  SneakCaptureCity,
  SneakNuclearAttack,
} from '../../Actions';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import Moved from '@civ-clone/core-unit/Rules/Moved';
/** The rule base-unit-lifecycle's `movedRules` makes for any action with an enemy, which this package's replaces. */
export declare const LIFECYCLE_BREAK_TREATY_RULE =
  'civ2-unit:unit/moved/break-peace-treaty';
/** The rule that replaces it. */
export declare const BREAK_TREATY_RULE = 'civ2-unit:unit/moved/break-treaty';
/** The actions that attack across a treaty, which the original makes war of (`diplo_force_war`). */
export declare const treatyAttacks: (
  | typeof SneakAttack
  | typeof SneakCaptureCity
  | typeof SneakNuclearAttack
)[];
export interface ForcedWarDependencies {
  clientRegistry?: ClientRegistry;
  interactionRegistry?: InteractionRegistry;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
}
/**
 * What an action across a treaty does to it, in place of base-unit-lifecycle's `break-peace-treaty` rule:
 * - an attack, a capture or a nuclear attack on a player under a ceasefire or a peace (OpenCiv2 `diplo_force_war`,
 *   `diplomacy.cpp:6861-6887`): when either player is a person, the attacker is made to declare war
 *   (civ2-diplomacy's `madeToDeclareWar`, `diplo_declare_war(civ, civ2, -1)`), and civ2-diplomacy's `DeclaredWar` rule
 *   counts it against its reputation and sets both attitudes to 100. Between two computer players the treaties end
 *   and the war starts with no declaration (no reputation), and both attitudes are set to 100. There is no vendetta.
 * - moving onto or pillaging a treaty partner's land (civ-clone's own; the original has neither) ends the peace, as
 *   base-unit-lifecycle's rule did, with no war and no vendetta.
 */
export declare const getRules: ({
  clientRegistry,
  interactionRegistry,
  ruleRegistry,
  turn,
}?: ForcedWarDependencies) => Moved[];
export default getRules;
