import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import Description from '@civ-clone/core-rule/Description';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
/** The tile improvements a defeated defender's stack survives it on (`unit_resolve_attack_remove_loser`). */
export declare const stackSparedBy: (typeof TileImprovement)[];
/** What `stackSparedBy` does, said on base-unit-lifecycle's rule that spares the stack (civ-clone/web-renderer#1343). */
export declare const sparesStackDescription: () => Description;
/**
 * Where a defeated defender's stack survives it, besides a city (base-unit-lifecycle's `sparesStack`): on one of
 *  `stackSparedBy`.
 */
export declare const sparesStack: (
  tileImprovementRegistry?: TileImprovementRegistry
) => (tile: Tile) => boolean;
export interface DefeatedDependencies {
  cityGrowthRegistry?: CityGrowthRegistry;
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  gameDifficultyRegistry?: GameDifficultyRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  requirementRegistry?: RequirementRegistry;
  wonderRegistry?: WonderRegistry;
}
/**
 * `civ2-unit:unit/defeated/city-shrinks`: a city loses a citizen each time one of its defenders loses a battle
 *  (`unit_resolve_attack_remove_loser`), unless it has City Walls or its owner the Great Wall, the attacker fought from
 *  the sea (the code asks whether the attacker's square is ocean, not the city's), or it is a human player's city on
 *  Chieftain. `Low`, after the defender is destroyed; a city shrunk to nothing is the city rules' to remove.
 */
export declare const getRules: ({
  cityGrowthRegistry,
  cityImprovementRegistry,
  cityRegistry,
  clientRegistry,
  gameDifficultyRegistry,
  playerResearchRegistry,
  requirementRegistry,
  wonderRegistry,
}?: DefeatedDependencies) => Defeated[];
export default getRules;
