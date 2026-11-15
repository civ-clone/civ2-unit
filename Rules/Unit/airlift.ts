import { AIR_SUPERIORITY, UnitRow, units } from '../../data/units';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import { Airlift } from '../../Actions';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Low from '@civ-clone/core-rule/Priorities/Low';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import { Peace } from '@civ-clone/library-diplomacy/Declarations';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import distance from '../../lib/distance';
import { instance as rngInstance } from '@civ-clone/core-random';
import { unitTypes } from '../../lib/unitTable';

// Each unit type's `@UNITS` row, by class.
const rows = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

export interface AirliftDependencies {
  cityRegistry?: CityRegistry;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  randomNumberGenerator?: () => number;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
}

/**
 * The enemy fighters an airlift between `from` and `to` risks (`unit_cmd_airlift`): each air-superiority unit of a
 *  player not at peace with `player` that is within its moves (whole moves, by `map_distance`) of either city counts
 *  1, a veteran 2. With the player whose unit counted last, which the original names as the one that shot it down.
 */
export const airliftThreat = (
  player: Player,
  from: Tile,
  to: Tile,
  {
    interactionRegistry = interactionRegistryInstance,
    unitImprovementRegistry = unitImprovementRegistryInstance,
    unitRegistry = unitRegistryInstance,
  }: AirliftDependencies = {}
): [number, Player | null] =>
  unitRegistry
    .entries()
    .filter(
      (unit: Unit): boolean =>
        unit.player() !== player &&
        !unit.destroyed() &&
        rows.get(unit.constructor)?.[10] === AIR_SUPERIORITY &&
        !interactionRegistry
          .getByPlayers(player, unit.player())
          .some(
            (interaction): boolean =>
              interaction instanceof Peace && interaction.active()
          ) &&
        [from, to].some(
          (city: Tile): boolean =>
            distance(city, unit.tile()) <= Math.trunc(unit.movement().value())
        )
    )
    .reduce<[number, Player | null]>(
      (
        [count]: [number, Player | null],
        unit: Unit
      ): [number, Player | null] => [
        count +
          (unitImprovementRegistry
            .getByUnit(unit)
            .some(
              (improvement: UnitImprovement): boolean =>
                improvement instanceof Veteran
            )
            ? 2
            : 1),
        unit.player(),
      ],
      [0, null]
    );

/**
 * `civ2-unit:unit/moved/airlift-shot-down` (`Low`, after the move's other rules): an airlifted unit is shot down, one
 *  roll in 6 for each count of `airliftThreat` (`unit_airlift_perform`), destroyed by the player whose fighter counted
 *  last; the client hears `unit:airlift-shot-down`. The original asks a human to confirm a risky airlift first; here it
 *  always flies.
 */
export const getRules = ({
  engine = engineInstance,
  randomNumberGenerator = rngInstance,
  ...dependencies
}: AirliftDependencies = {}): Moved[] => [
  new Moved(
    'civ2-unit:unit/moved/airlift-shot-down',
    new Low(),
    new Criterion(
      (unit: Unit, action: Action): boolean =>
        action instanceof Airlift && !unit.destroyed()
    ),
    new Effect((unit: Unit, action: Action): void => {
      const [count, by] = airliftThreat(
        unit.player(),
        action.from(),
        action.to(),
        dependencies
      );

      for (let i = 0; i < count; i++) {
        if (Math.floor(randomNumberGenerator() * 6) === 0) {
          engine.emit('unit:airlift-shot-down', unit, by);

          unit.destroy(by);

          return;
        }
      }
    })
  ),
];

export default getRules;
