import { Attack, CaptureCity, NuclearAttack } from '../../Actions';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import Player from '@civ-clone/core-player/Player';
/** The rule base-unit-lifecycle's `movedRules` makes for any action with an enemy, which this package's replaces. */
export declare const LIFECYCLE_BREAK_TREATY_RULE =
  'civ2-unit:unit/moved/break-peace-treaty';
/** The rule that replaces it. */
export declare const BREAK_TREATY_RULE = 'civ2-unit:unit/moved/break-treaty';
/** The actions the original makes war of (`diplo_force_war`): every attack, nuclear attack and capture of a city. */
export declare const forcingWar: (
  | typeof Attack
  | typeof CaptureCity
  | typeof NuclearAttack
)[];
/** Notes the players `action` attacks, for the `Moved` rule below. */
export declare const recordTargets: <T extends Action>(
  action: T,
  players: Player[]
) => T;
export interface ForcedWarDependencies {
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  interactionRegistry?: InteractionRegistry;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
  unitRegistry?: UnitRegistry;
}
/**
 * What an attack does to its target's relations, in place of base-unit-lifecycle's `break-peace-treaty` rule: OpenCiv2
 *  `diplo_force_war` (`diplomacy.cpp:6861-6887`), which the original calls after every attack (`unit_combat.cpp:1536`)
 *  and capture of a city (`city.cpp:5405`), and, as it, for every nuclear attack. For each player attacked:
 * - any intent of either to break their treaty is forgotten (`TREATY_HOSTILE_INTENT`);
 * - under a ceasefire or a peace with a person on either side, the attacker is made to declare war (civ2-diplomacy's
 *   `madeToDeclareWar`, `diplo_declare_war(civ, civ2, -1)`), and civ2-diplomacy's `DeclaredWar` rules count it against
 *   its reputation;
 * - any peace ends. Between two computer players a ceasefire stays in force, as the original clears only the peace
 *   and alliance bits;
 * - once they've met: a war is in force (a `War`, made with no declaration when there isn't one), both attitudes are
 *   set to 100, even mid-war, and the attacker is marked as having attacked without declaring war
 *   (civ2-diplomacy's `SNEAK_ATTACK`) unless either already is.
 *
 * There is no vendetta. Moving onto or pillaging a treaty partner's land (civ-clone's own sneak actions, which the
 *  original doesn't have) ends the peace only, as base-unit-lifecycle's rule did.
 */
export declare const getRules: ({
  cityRegistry,
  clientRegistry,
  interactionRegistry,
  ruleRegistry,
  turn,
  unitRegistry,
}?: ForcedWarDependencies) => Moved[];
export default getRules;
