import { Attack, CaptureCity, NuclearAttack } from '../../Actions';
import { PlayerRegistry } from '@civ-clone/core-player/PlayerRegistry';
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
  playerRegistry?: PlayerRegistry;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
  unitRegistry?: UnitRegistry;
}
/**
 * What an attack does to its target's relations, in place of base-unit-lifecycle's `break-peace-treaty` rule: OpenCiv2
 *  `diplo_force_war` (`diplomacy.cpp:6861-6887`), which the original calls after every attack (`unit_combat.cpp:1536`)
 *  and capture of a city (`city.cpp:5405`), and for a nuclear attack in battle, on the owners of the units there (one
 *  on an empty city is no battle: `unit_move.cpp:1086` goes straight to `unit_nuclear_attack`). For each player
 *  attacked:
 * - any intent of either to break their treaty is forgotten (`TREATY_HOSTILE_INTENT`);
 * - under a ceasefire or a peace with a person on either side, the attacker is made to declare war (civ2-diplomacy's
 *   `madeToDeclareWar`, `diplo_declare_war(civ, civ2, -1)`), and civ2-diplomacy's `DeclaredWar` rules count it against
 *   its reputation;
 * - any peace ends;
 * - once they've met: a war is in force (a `War`, made with no declaration when there isn't one), any ceasefire left
 *   between two computer players ends with it, both attitudes are set to 100, even mid-war, and the attacker is
 *   marked as having attacked without declaring war (civ2-diplomacy's `SNEAK_ATTACK`) unless either already is; when
 *   it is, the victim's allies join the war (civ2-diplomacy's `alliesJoinWar`, `unit_combat.cpp:1593`). (The
 *   original keeps the ceasefire bit there, but its war bit rules; here the treaty level would read the ceasefire.)
 *
 * There is no vendetta. A person pillaging is made to declare war on the owner of the nearest city, anyone's at any
 *  distance, unless it's the person's own or they're at war (the pillage command's `city_find_nearest` and
 *  `diplo_declare_war(civ, civ2, -1)`, `unit.cpp:2985-2998`, through `madeToDeclareWar`, which counts against its
 *  reputation), treaty or not; a computer player's pillage changes no treaty. Moving onto a partner's land
 *  (civ-clone's own sneak move, which the original doesn't have) ends the peace only, as base-unit-lifecycle's rule
 *  did.
 */
export declare const getRules: ({
  cityRegistry,
  clientRegistry,
  interactionRegistry,
  playerRegistry,
  ruleRegistry,
  turn,
  unitRegistry,
}?: ForcedWarDependencies) => Moved[];
export default getRules;
