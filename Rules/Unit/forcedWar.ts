import { Attack, CaptureCity, NuclearAttack, Pillage } from '../../Actions';
import nearestCity from '../../lib/nearestCity';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import IndustrialSabotage from '@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import StealTechnology from '@civ-clone/base-unit-action-steal-technology/StealTechnology';
import { alliesJoinWar } from '@civ-clone/civ2-diplomacy/lib/alliances';
import Dependencies from '@civ-clone/civ2-diplomacy/lib/Dependencies';
import { forceWar as forceWarOn } from '@civ-clone/civ2-diplomacy/lib/espionage';
import {
  PlayerRegistry,
  instance as playerRegistryInstance,
} from '@civ-clone/core-player/PlayerRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import { madeToDeclareWar } from '@civ-clone/civ2-diplomacy/lib/relations';
import Action from '@civ-clone/core-unit/Action';
import Criterion from '@civ-clone/core-rule/Criterion';
import Declaration from '@civ-clone/core-diplomacy/Declaration';
import Effect from '@civ-clone/core-rule/Effect';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';

/** The rule base-unit-lifecycle's `movedRules` makes for any action with an enemy, which this package's replaces. */
export const LIFECYCLE_BREAK_TREATY_RULE =
  'civ2-unit:unit/moved/break-peace-treaty';

/** The rule that replaces it. */
export const BREAK_TREATY_RULE = 'civ2-unit:unit/moved/break-treaty';

/** The actions the original makes war of (`diplo_force_war`): every attack, nuclear attack and capture of a city. */
export const forcingWar = [Attack, NuclearAttack, CaptureCity];

// Who an attack or a nuclear attack was made on, noted when the action is made (the defenders may be gone by the time
//  the action's `Moved` rules run). A capture is the city's owner's, which it still is then.
const targets = new WeakMap<Action, Player[]>();

/** Notes the players `action` attacks, for the `Moved` rule below. */
export const recordTargets = <T extends Action>(
  action: T,
  players: Player[]
): T => {
  targets.set(action, players);

  return action;
};

export interface ForcedWarDependencies {
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  interactionRegistry?: InteractionRegistry;
  playerRegistry?: PlayerRegistry;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
  unitRegistry?: UnitRegistry;
  // civ2-diplomacy's dependencies (`dependenciesOf(game)`); without them, built from the registries above.
  diplomacy?: Dependencies;
}

// The Diplomat's and Spy's missions with an enemy (the forms a person is warned about under a treaty) break nothing
//  themselves: the treaty breaks only through the incident if the agent is lost (civ2-diplomacy's `AgentLost` rule), or
//  through an incited city's capture.
const missions = [
  StealTechnology,
  IndustrialSabotage,
  PoisonWater,
  InciteRevolt,
];

const enemyOf = (action: Action): Player | null =>
  !missions.some((Mission): boolean => action instanceof Mission) &&
  typeof (action as unknown as { enemy?: unknown }).enemy === 'function'
    ? (action as unknown as { enemy(): Player }).enemy()
    : null;

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
export const getRules = ({
  cityRegistry = cityRegistryInstance,
  clientRegistry = clientRegistryInstance,
  interactionRegistry = interactionRegistryInstance,
  playerRegistry = playerRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  turn = turnInstance,
  unitRegistry = unitRegistryInstance,
  diplomacy,
}: ForcedWarDependencies = {}): Moved[] => {
  const // The declarations of `DeclarationType` in force between the two.
    active = (
      DeclarationType: new (...args: any[]) => Declaration,
      player: Player,
      other: Player
    ): Declaration[] =>
      interactionRegistry
        .getByPlayers(player, other)
        .filter(
          (interaction): interaction is Declaration =>
            interaction instanceof DeclarationType &&
            (interaction as Declaration).active()
        ),
    attacked = (unit: Unit, action: Action): Player[] => {
      const players =
        targets.get(action) ??
        (action instanceof CaptureCity
          ? [cityRegistry.getByTile(action.to())?.player() ?? null]
          : action instanceof NuclearAttack
          ? unitRegistry
              .getByTile(action.to())
              .map((tileUnit: Unit): Player => tileUnit.player())
          : enemyOf(action) !== null
          ? [enemyOf(action)]
          : unitRegistry
              .getByTile(action.to())
              .map((tileUnit: Unit): Player => tileUnit.player()));

      return Array.from(new Set(players)).filter(
        (player: Player | null): player is Player =>
          player !== null && player !== unit.player()
      );
    },
    // civ2-diplomacy's dependencies, for its `forceWar` (`diplo_force_war`).
    diplomacyDependencies =
      diplomacy ??
      ({
        cityRegistry,
        clientRegistry,
        interactionRegistry,
        playerRegistry,
        ruleRegistry,
        turn,
        unitRegistry,
      } as unknown as Dependencies),
    // `diplo_force_war`, then, after a battle (not a capture: `city.cpp:5405`), the victim's allies join a war not
    //  declared (`unit_combat.cpp:1593`).
    forceWar = (player: Player, enemy: Player, battle: boolean): void => {
      if (!forceWarOn(diplomacyDependencies, player, enemy) || !battle) {
        return;
      }

      alliesJoinWar(
        {
          clientRegistry,
          interactionRegistry,
          playerRegistry,
          ruleRegistry,
          turn,
        },
        enemy,
        player
      );
    };

  return [
    new Moved(
      BREAK_TREATY_RULE,
      new Criterion(
        (unit: Unit, action: Action): boolean =>
          forcingWar.some(
            (ActionType): boolean => action instanceof ActionType
          ) ||
          action instanceof Pillage ||
          enemyOf(action) !== null
      ),
      new Effect((unit: Unit, action: Action): void => {
        const player = unit.player();

        if (
          !forcingWar.some(
            (ActionType): boolean => action instanceof ActionType
          )
        ) {
          if (action instanceof Pillage) {
            const owner =
              nearestCity(cityRegistry, action.to())?.player() ?? null;

            if (
              owner !== null &&
              owner !== player &&
              isHuman(player, clientRegistry) &&
              treatyLevel({ interactionRegistry }, player, owner) !==
                TreatyLevel.War
            ) {
              madeToDeclareWar(
                { interactionRegistry, ruleRegistry },
                player,
                owner
              );
            }

            return;
          }

          const enemy = enemyOf(action)!;

          if (enemy === player) {
            return;
          }

          active(Peace, player, enemy).forEach((peace) => peace.expire(player));

          return;
        }

        attacked(unit, action).forEach((enemy: Player): void =>
          forceWar(player, enemy, !(action instanceof CaptureCity))
        );
      })
    ),
  ];
};

export default getRules;
