import { Action } from '@civ-clone/core-unit/Rules/Action';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityNameRegistry } from '@civ-clone/core-civilization/CityNameRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { PathFinderRegistry } from '@civ-clone/core-world-path/PathFinderRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { StrategyNoteRegistry } from '@civ-clone/core-strategy/StrategyNoteRegistry';
import { StrategyRegistry } from '@civ-clone/core-strategy/StrategyRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
/** The tile improvements that make a worked square a treaty partner's land, and that pillage takes. */
export declare const territoryImprovements: (typeof TileImprovement)[];
export interface ActionDependencies {
  cityGrowthRegistry?: CityGrowthRegistry;
  cityNameRegistry?: CityNameRegistry;
  cityRegistry?: CityRegistry;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  pathFinderRegistry?: PathFinderRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  ruleRegistry?: RuleRegistry;
  strategyNoteRegistry?: StrategyNoteRegistry;
  strategyRegistry?: StrategyRegistry;
  terrainFeatureRegistry?: TerrainFeatureRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  transportRegistry?: TransportRegistry;
  turn?: Turn;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
  workedTileRegistry?: WorkedTileRegistry;
}
/**
 * Civilization II's unit actions, as base-unit-action-rules' `actionRules('civ2-unit', table)` with civ1-unit's
 *  criteria and Civ2's terrain, in the order a unit is offered them (the AI takes the first). There is no Senate, so no
 *  row is gated and no `overruled/` form is made: a treaty-breaking row is offered as it is. Of the Diplomat's and Spy's
 *  missions, only an embassy, an investigation and a meeting are offered; theft, sabotage, revolt and bribery, and the
 *  Caravan's and Freight's trade routes and help with a wonder, are M2a deviations.
 */
export declare const getRules: ({
  cityGrowthRegistry,
  cityNameRegistry,
  cityRegistry,
  engine,
  interactionRegistry,
  pathFinderRegistry,
  playerResearchRegistry,
  ruleRegistry,
  strategyNoteRegistry,
  strategyRegistry,
  terrainFeatureRegistry,
  tileImprovementRegistry,
  transportRegistry,
  turn,
  unitImprovementRegistry,
  unitRegistry,
  workedTileRegistry,
}?: ActionDependencies) => Action[];
export default getRules;
