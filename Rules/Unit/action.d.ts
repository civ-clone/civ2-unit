import { Action } from '@civ-clone/core-unit/Rules/Action';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityNameRegistry } from '@civ-clone/core-civilization/CityNameRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
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
import Criterion from '@civ-clone/core-rule/Criterion';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
/** The tile improvements that make a worked square a treaty partner's land. */
export declare const territoryImprovements: (typeof TileImprovement)[];
/**
 * What a pillage takes, in the order the original takes it when no target is chosen (`unit_pillage`): farmland (leaving
 *  the irrigation), a mine or irrigation, a fortress or an airbase, the railroad, then the road.
 */
export declare const pillageOrder: (typeof TileImprovement)[];
/** Partisans take the railroad, then the road, before anything else (`unit_pillage`). */
export declare const partisanPillageOrder: (typeof TileImprovement)[];
/** Whether `improvement` can be pillaged. */
export declare const pillageable: (improvement: TileImprovement) => boolean;
/** `criteria` less its last, which must be base-unit-action-rules' by-domain `Or`. */
export declare const withoutDomainTest: (criteria: Criterion[]) => Criterion[];
export interface ActionDependencies {
  cityGrowthRegistry?: CityGrowthRegistry;
  cityImprovementRegistry?: CityImprovementRegistry;
  cityNameRegistry?: CityNameRegistry;
  cityRegistry?: CityRegistry;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  pathFinderRegistry?: PathFinderRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
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
 *  missions, only an embassy and an investigation are offered (Civ2's mission menu, `spy_city_mission_menu`, has no
 *  meeting outside network games); theft, sabotage, revolt and bribery, and the
 *  Caravan's and Freight's trade routes and help with a wonder, are M2a deviations.
 */
export declare const getRules: ({
  cityGrowthRegistry,
  cityImprovementRegistry,
  cityNameRegistry,
  cityRegistry,
  engine,
  interactionRegistry,
  pathFinderRegistry,
  pendingEffectRegistry,
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
