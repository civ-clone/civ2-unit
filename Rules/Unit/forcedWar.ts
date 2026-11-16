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
  SneakAttack,
  SneakCaptureCity,
  SneakNuclearAttack,
} from '../../Actions';
import {
  TreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  attitude,
  madeToDeclareWar,
} from '@civ-clone/civ2-diplomacy/lib/relations';
import Action from '@civ-clone/core-unit/Action';
import Ceasefire from '@civ-clone/base-diplomacy-declaration-ceasefire/Ceasefire';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import { Never } from '@civ-clone/core-diplomacy/Expiries';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import War from '@civ-clone/base-diplomacy-declaration-war/War';
import Declaration from '@civ-clone/core-diplomacy/Declaration';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';

/** The rule base-unit-lifecycle's `movedRules` makes for any action with an enemy, which this package's replaces. */
export const LIFECYCLE_BREAK_TREATY_RULE =
  'civ2-unit:unit/moved/break-peace-treaty';

/** The rule that replaces it. */
export const BREAK_TREATY_RULE = 'civ2-unit:unit/moved/break-treaty';

/** The actions that attack across a treaty, which the original makes war of (`diplo_force_war`). */
export const treatyAttacks = [
  SneakAttack,
  SneakCaptureCity,
  SneakNuclearAttack,
];

export interface ForcedWarDependencies {
  clientRegistry?: ClientRegistry;
  interactionRegistry?: InteractionRegistry;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
}

const enemyOf = (action: Action): Player | null =>
  typeof (action as unknown as { enemy?: unknown }).enemy === 'function'
    ? (action as unknown as { enemy(): Player }).enemy()
    : null;

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
export const getRules = ({
  clientRegistry = clientRegistryInstance,
  interactionRegistry = interactionRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  turn = turnInstance,
}: ForcedWarDependencies = {}): Moved[] => {
  // The declarations of `DeclarationType` in force between the two.
  const active = (
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
      );

  return [
    new Moved(
      BREAK_TREATY_RULE,
      new Criterion((unit: Unit, action: Action): boolean => {
        const enemy = enemyOf(action);

        return enemy !== null && enemy !== unit.player();
      }),
      new Effect((unit: Unit, action: Action): void => {
        const player = unit.player(),
          enemy = enemyOf(action)!;

        if (
          !treatyAttacks.some(
            (ActionType): boolean => action instanceof ActionType
          )
        ) {
          active(Peace, player, enemy).forEach((peace) => peace.expire(player));

          return;
        }

        if (
          treatyLevel({ interactionRegistry }, player, enemy) <
          TreatyLevel.Ceasefire
        ) {
          return;
        }

        if (isHuman(player, clientRegistry) || isHuman(enemy, clientRegistry)) {
          madeToDeclareWar(
            { interactionRegistry, ruleRegistry },
            player,
            enemy
          );

          return;
        }

        [Peace, Ceasefire].forEach((DeclarationType) =>
          active(DeclarationType, player, enemy).forEach((declaration) =>
            declaration.expire(player)
          )
        );

        interactionRegistry.register(
          new War(player, enemy, new Never(), ruleRegistry)
        );

        const attitudes = attitude({ interactionRegistry, ruleRegistry, turn });

        [
          [player, enemy],
          [enemy, player],
        ].forEach(([holder, toward]) => {
          if (attitudes.get(holder, toward) !== undefined) {
            attitudes.set(holder, toward, 100, 'forced-war');
          }
        });
      })
    ),
  ];
};

export default getRules;
