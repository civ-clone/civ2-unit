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
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import { TreatyPartnerDependencies } from '@civ-clone/base-unit-lifecycle/lib/treatyPartner';
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
/**
 * Whose land a square is among a unit's treaty partners (base-unit-lifecycle's `treatyPartner`, on
 *  `territoryImprovements`), but never an ally's: moving onto or pillaging an ally's land breaks no treaty.
 */
export declare const treatyPartnerOf: (
  dependencies: TreatyPartnerDependencies & {
    interactionRegistry: InteractionRegistry;
  }
) => (unit: Unit, tile: Tile) => Player | null;
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
  requirementRegistry?: RequirementRegistry;
  ruleRegistry?: RuleRegistry;
  strategyNoteRegistry?: StrategyNoteRegistry;
  strategyRegistry?: StrategyRegistry;
  terrainFeatureRegistry?: TerrainFeatureRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  transportRegistry?: TransportRegistry;
  turn?: Turn;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
  wonderRegistry?: WonderRegistry;
  workedTileRegistry?: WorkedTileRegistry;
}
/**
 * Civilization II's unit actions, as base-unit-action-rules' `actionRules('civ2-unit', table)` with civ1-unit's
 *  criteria and Civ2's terrain, in the order a unit is offered them (the AI takes the first). A row that breaks a
 *  treaty (a ceasefire, a peace or an alliance) is gated by the player's Senate (`SenateIntervenes`, which
 *  civ2-diplomacy answers): when it intervenes, the row's `overruled/` form is offered instead (`diplo_confirm_attack`).
 *  An ally is never attacked, its units exert no zone of control, and a unit moving onto its city is repaired there
 *  (`allied-repair`). Of the Diplomat's and Spy's missions, an embassy, an investigation and a meeting with the leader
 *  are offered; theft, sabotage, revolt and bribery are part 2 of M2d. Help with a wonder is civ2-wonder's.
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
  requirementRegistry,
  ruleRegistry,
  strategyNoteRegistry,
  strategyRegistry,
  terrainFeatureRegistry,
  tileImprovementRegistry,
  transportRegistry,
  turn,
  unitImprovementRegistry,
  unitRegistry,
  wonderRegistry,
  workedTileRegistry,
}?: ActionDependencies) => Action[];
export default getRules;
