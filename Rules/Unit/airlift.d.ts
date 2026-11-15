import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
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
export declare const airliftThreat: (
  player: Player,
  from: Tile,
  to: Tile,
  {
    interactionRegistry,
    unitImprovementRegistry,
    unitRegistry,
  }?: AirliftDependencies
) => [number, Player | null];
/**
 * `civ2-unit:unit/moved/airlift-shot-down` (`Low`, after the move's other rules): an airlifted unit is shot down, one
 *  roll in 6 for each count of `airliftThreat` (`unit_airlift_perform`), destroyed by the player whose fighter counted
 *  last; the client hears `unit:airlift-shot-down`. The original asks a human to confirm a risky airlift first; here it
 *  always flies.
 */
export declare const getRules: ({
  engine,
  randomNumberGenerator,
  ...dependencies
}?: AirliftDependencies) => Moved[];
export default getRules;
