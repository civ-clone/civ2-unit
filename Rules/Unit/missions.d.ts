import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerRegistry } from '@civ-clone/core-player/PlayerRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTreasuryRegistry } from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { NamedRow } from '@civ-clone/base-unit-action-rules/lib/actionRules';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
export interface MissionRowDependencies {
  cityGrowthRegistry: CityGrowthRegistry;
  cityImprovementRegistry: CityImprovementRegistry;
  cityRegistry: CityRegistry;
  clientRegistry: ClientRegistry;
  engine?: Engine;
  interactionRegistry: InteractionRegistry;
  manhattanProjectBuilt: () => boolean;
  pendingEffectRegistry: PendingEffectRegistry;
  playerGovernmentRegistry: PlayerGovernmentRegistry;
  playerRegistry: PlayerRegistry;
  playerResearchRegistry: PlayerResearchRegistry;
  playerTreasuryRegistry: PlayerTreasuryRegistry;
  requirementRegistry: RequirementRegistry;
  ruleRegistry: RuleRegistry;
  turn: Turn;
  unitImprovementRegistry: UnitImprovementRegistry;
  unitRegistry: UnitRegistry;
  wonderRegistry: WonderRegistry;
}
/** The rows the Diplomat's and Spy's city and unit missions, and the Caravan's trade route, are offered by. */
export interface MissionRows {
  /** The city missions, in the order a unit is offered them: theft first, a computer's default. */
  city: NamedRow[];
  /** The missions against a lone unit: bribery, then a person's Spy's sabotage (`sabotage-unit`, which `action` makes). */
  bribe: NamedRow;
  /** A Caravan's or Freight's trade route. */
  tradeRoute: NamedRow;
  /** The price to incite the city on `to`, for `unit` standing on `from`. */
  costToIncite: (unit: Unit, to: Tile, from?: Tile) => number;
  /** The price for `unit` to bribe `target`. */
  costToBribe: (unit: Unit, target: Unit) => number;
}
/**
 * Civilization II's Diplomat and Spy missions (OpenCiv2 `spy_city_mission_menu`, `unit_spy.cpp:151-226`, and the AI's
 *  `spy_city_mission_ai_choice`) and the Caravan's trade route, as rows of civ2-unit's action table. What each mission
 *  does is `Rules/Unit/espionage`.
 *
 * - **Theft**: a Diplomat once per city (`CITYF_TECH_STOLEN`), a Spy also at a city already robbed; a computer only
 *   while there's something to take (a person tries anyway, and pays a move).
 * - **Sabotage**: always offered.
 * - **Poisoning**: a Spy; a person's only at size 2 or more (a computer's empties a size-1 city's food box).
 * - **Planting a nuclear device**: a person's Spy, knowing Rocketry and Nuclear Fission, once the Manhattan Project has
 *   been built anywhere. The computer players never choose it.
 * - **A person under a ceasefire, a peace or an alliance** with the city's owner is offered a theft, a sabotage or a
 *   poisoning only as its `Sneak` form, which a client confirms first (`spy_confirm_treaty_breach`); the treaty itself
 *   breaks only through the incident if the agent is lost.
 * - **Inciting a revolt**: not a Democracy's city, nor with the agent within 2 of the owner's Palace (diagonally); a
 *   computer only without a treaty. Under a treaty a person may instead pay double (`subvert-city`, a `SubvertCity`),
 *   while that is under 15001.
 * - **Bribery**: a lone unit outside a city, not a Democracy's; a computer only knowing the Diplomat's prerequisite,
 *   and never a Caravan or Freight. A person's Spy is also offered `sabotage-unit` (the choice the original gives it
 *   under its default combat rules, `spy_unit_mission`).
 * - **A trade route**: to any foreign city, or to an own city other than home with no distance or continent test; a
 *   unit with no home is homed, for this, in its player's nearest city (`unit.cpp:694-699`).
 *
 * There is no treaty test on any mission, and each may start from a ship: the original's checks for Diplomats and
 *  Caravans come before its treaty checks, whatever square the unit leaves (`unit_move_dir_land_unit_checks`).
 */
export declare const missionRows: ({
  cityGrowthRegistry,
  cityImprovementRegistry,
  cityRegistry,
  clientRegistry,
  interactionRegistry,
  manhattanProjectBuilt,
  pendingEffectRegistry,
  playerGovernmentRegistry,
  playerRegistry,
  playerResearchRegistry,
  playerTreasuryRegistry,
  requirementRegistry,
  ruleRegistry,
  turn,
  unitImprovementRegistry,
  unitRegistry,
  wonderRegistry,
}: MissionRowDependencies) => MissionRows;
export default missionRows;
