import { Airbase, Fortress } from '@civ-clone/civ2-world/TileImprovements';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RequirementRegistry,
  instance as requirementRegistryInstance,
} from '@civ-clone/core-requirement/RequirementRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  WonderRegistry,
  instance as wonderRegistryInstance,
} from '@civ-clone/core-wonder/WonderRegistry';
import Action from '@civ-clone/core-unit/Action';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import Criterion from '@civ-clone/core-rule/Criterion';
import Description from '@civ-clone/core-rule/Description';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import GreatWall from '@civ-clone/base-wonder-great-wall/GreatWall';
import Low from '@civ-clone/core-rule/Priorities/Low';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import { cityHasImprovementOrWonder } from '@civ-clone/base-wonder/lib/hasImprovementOrWonder';
import isHuman from '@civ-clone/base-difficulty/lib/isHuman';
import { levelOf } from '@civ-clone/civ2-difficulty/level';

/**
 * Where a defeated defender's stack survives it, besides a city (base-unit-lifecycle's `sparesStack`): a Fortress or
 *  an Airbase (`unit_resolve_attack_remove_loser`).
 */
export const sparesStack =
  (
    tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance
  ) =>
  (tile: Tile): boolean =>
    tileImprovementRegistry
      .getByTile(tile)
      .some(
        (improvement: TileImprovement): boolean =>
          improvement instanceof Fortress || improvement instanceof Airbase
      );

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
export const getRules = ({
  cityGrowthRegistry = cityGrowthRegistryInstance,
  cityImprovementRegistry = cityImprovementRegistryInstance,
  cityRegistry = cityRegistryInstance,
  clientRegistry = clientRegistryInstance,
  gameDifficultyRegistry = gameDifficultyRegistryInstance,
  playerResearchRegistry = playerResearchRegistryInstance,
  requirementRegistry = requirementRegistryInstance,
  wonderRegistry = wonderRegistryInstance,
}: DefeatedDependencies = {}): Defeated[] => [
  new Defeated(
    'civ2-unit:unit/defeated/city-shrinks',
    new Low(),
    // The loser defended, and the winner attacked from a land square.
    new Criterion(
      (unit: Unit, by: Unit, action?: Action): boolean =>
        action !== undefined && action.unit() === by && action.from().isLand()
    ),
    new Criterion(
      (unit: Unit): boolean => cityRegistry.getByTile(unit.tile()) !== null
    ),
    new Criterion((unit: Unit): boolean => {
      const city = cityRegistry.getByTile(unit.tile())!;

      return !cityHasImprovementOrWonder(city, CityWalls, GreatWall, {
        cityImprovementRegistry,
        playerResearchRegistry,
        requirementRegistry,
        wonderRegistry,
      });
    }),
    new Criterion((unit: Unit): boolean => {
      const city = cityRegistry.getByTile(unit.tile())!;

      return !(
        levelOf(gameDifficultyRegistry) === 0 &&
        isHuman(city.player(), clientRegistry)
      );
    }),
    new Effect((unit: Unit, by: Unit): void => {
      const city = cityRegistry.getByTile(unit.tile());

      if (city === null || city.destroyed()) {
        return;
      }

      cityGrowthRegistry.getByCity(city).shrink(by);
    }),
    new Description(
      {
        type: 'protects_from',
        subject: CityWalls,
        event: 'defeat',
        what: 'size',
      },
      {
        type: 'acts_as',
        subject: GreatWall,
        improvement: CityWalls,
        scope: 'player',
      }
    )
  ),
];

export default getRules;
