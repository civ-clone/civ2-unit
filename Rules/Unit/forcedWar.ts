import {
  Attack,
  CaptureCity,
  NuclearAttack,
  SneakPillage,
} from '../../Actions';
import Ceasefire from '@civ-clone/base-diplomacy-declaration-ceasefire/Ceasefire';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  HOSTILE_INTENT,
  SNEAK_ATTACK,
  clearBoth,
  hasFlag,
  setFlag,
} from '@civ-clone/civ2-diplomacy/lib/flags';
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
import {
  attitude,
  madeToDeclareWar,
} from '@civ-clone/civ2-diplomacy/lib/relations';
import Action from '@civ-clone/core-unit/Action';
import Contact from '@civ-clone/base-diplomacy-interaction-contact/Contact';
import Criterion from '@civ-clone/core-rule/Criterion';
import Declaration from '@civ-clone/core-diplomacy/Declaration';
import Effect from '@civ-clone/core-rule/Effect';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import { Never } from '@civ-clone/core-diplomacy/Expiries';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import War from '@civ-clone/base-diplomacy-declaration-war/War';
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
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
  unitRegistry?: UnitRegistry;
}

const enemyOf = (action: Action): Player | null =>
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
 *   marked as having attacked without declaring war (civ2-diplomacy's `SNEAK_ATTACK`) unless either already is. (The
 *   original keeps the ceasefire bit there, but its war bit rules; here the treaty level would read the ceasefire.)
 *
 * There is no vendetta. Pillaging a treaty partner's land: a person not at war with it is made to declare war (the
 *  pillage command's `diplo_declare_war(civ, civ2, -1)`, `unit.cpp:2993-2998`, through `madeToDeclareWar`, which
 *  counts against its reputation); a computer player ends the peace only. Moving onto a partner's land (civ-clone's
 *  own sneak move, which the original doesn't have) ends the peace only, as base-unit-lifecycle's rule did.
 */
export const getRules = ({
  cityRegistry = cityRegistryInstance,
  clientRegistry = clientRegistryInstance,
  interactionRegistry = interactionRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  turn = turnInstance,
  unitRegistry = unitRegistryInstance,
}: ForcedWarDependencies = {}): Moved[] => {
  const flags = { interactionRegistry, ruleRegistry, turn },
    // The declarations of `DeclarationType` in force between the two.
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
    inContact = (player: Player, other: Player): boolean =>
      interactionRegistry
        .getByPlayers(player, other)
        .some((interaction) => interaction instanceof Contact),
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
    forceWar = (player: Player, enemy: Player): void => {
      clearBoth(flags, player, enemy, HOSTILE_INTENT);

      const level = treatyLevel({ interactionRegistry }, player, enemy);

      if (
        (level === TreatyLevel.Ceasefire || level === TreatyLevel.Peace) &&
        (isHuman(player, clientRegistry) || isHuman(enemy, clientRegistry))
      ) {
        madeToDeclareWar({ interactionRegistry, ruleRegistry }, player, enemy);
      }

      active(Peace, player, enemy).forEach((peace) => peace.expire(player));

      if (!inContact(player, enemy)) {
        return;
      }

      if (active(War, player, enemy).length === 0) {
        interactionRegistry.register(
          new War(player, enemy, new Never(), ruleRegistry)
        );
      }

      active(Ceasefire, player, enemy).forEach((ceasefire) =>
        ceasefire.expire(player)
      );

      const attitudes = attitude(flags);

      attitudes.set(player, enemy, 100, 'forced-war');
      attitudes.set(enemy, player, 100, 'forced-war');

      if (
        !hasFlag(flags, enemy, player, SNEAK_ATTACK) &&
        !hasFlag(flags, player, enemy, SNEAK_ATTACK)
      ) {
        setFlag(flags, player, enemy, SNEAK_ATTACK);
      }
    };

  return [
    new Moved(
      BREAK_TREATY_RULE,
      new Criterion(
        (unit: Unit, action: Action): boolean =>
          forcingWar.some(
            (ActionType): boolean => action instanceof ActionType
          ) || enemyOf(action) !== null
      ),
      new Effect((unit: Unit, action: Action): void => {
        const player = unit.player();

        if (
          !forcingWar.some(
            (ActionType): boolean => action instanceof ActionType
          )
        ) {
          const enemy = enemyOf(action)!;

          if (enemy === player) {
            return;
          }

          if (
            action instanceof SneakPillage &&
            isHuman(player, clientRegistry) &&
            treatyLevel({ interactionRegistry }, player, enemy) !==
              TreatyLevel.War
          ) {
            madeToDeclareWar(
              { interactionRegistry, ruleRegistry },
              player,
              enemy
            );

            return;
          }

          active(Peace, player, enemy).forEach((peace) => peace.expire(player));

          return;
        }

        attacked(unit, action).forEach((enemy: Player): void =>
          forceWar(player, enemy)
        );
      })
    ),
  ];
};

export default getRules;
