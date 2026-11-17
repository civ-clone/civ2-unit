import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTreasuryRegistry } from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import AgentSurvives from '@civ-clone/base-unit-agent/Rules/AgentSurvives';
import City from '@civ-clone/core-city/City';
import CitySabotaged from '@civ-clone/base-unit-action-industrial-sabotage/Rules/CitySabotaged';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import DevicePlanted from '@civ-clone/base-unit-action-plant-nuclear-device/Rules/DevicePlanted';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import IndustrialSabotage from '@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage';
import MissionDetected from '@civ-clone/base-unit-agent/Rules/MissionDetected';
import MissionMode from '@civ-clone/base-unit-agent/Rules/MissionMode';
import MissionTargets from '@civ-clone/base-unit-agent/Rules/MissionTargets';
import Player from '@civ-clone/core-player/Player';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import RevoltIncited from '@civ-clone/base-unit-action-incite-revolt/Rules/RevoltIncited';
import StealTechnology from '@civ-clone/base-unit-action-steal-technology/StealTechnology';
import TechnologyStolen from '@civ-clone/base-unit-action-steal-technology/Rules/TechnologyStolen';
import UnitBribed from '@civ-clone/base-unit-action-bribe-unit/Rules/UnitBribed';
import Captured from '@civ-clone/core-city/Rules/Captured';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import WaterPoisoned from '@civ-clone/base-unit-action-poison-water/Rules/WaterPoisoned';
import Dependencies from '@civ-clone/civ2-diplomacy/lib/Dependencies';
/** The city missions whose agent tries to escape afterwards (`spy_try_escape(unit, mode, victim)`), a Diplomat never. */
export declare const escapingMissions: (
  | typeof InciteRevolt
  | typeof IndustrialSabotage
  | typeof StealTechnology
  | typeof PoisonWater
)[];
export interface EspionageDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  cityGrowthRegistry?: CityGrowthRegistry;
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  diplomacy?: Dependencies;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  playerTreasuryRegistry?: PlayerTreasuryRegistry;
  randomNumberGenerator?: () => number;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
  /** What else paying the doubled price does to the city, just before it changes hands (civ2-city: its founder). */
  inciterBecomesFounder?: (city: City, inciter: Player) => void;
}
/** A third of a move, what a person's Spy pays for an embassy or a first investigation (`moves_used++`, one of @COSMIC's
 *  road movement multiplier's steps). */
export declare const THIRD_OF_A_MOVE: number;
/** Whether anyone has robbed `city` of an advance (`CITYF_TECH_STOLEN`). */
export declare const robbed: (
  city: City,
  interactionRegistry?: InteractionRegistry
) => boolean;
/**
 * Civilization II's Diplomat and Spy missions on base-unit-agent's seams (OpenCiv2 `src/auto/unit_spy.cpp`):
 *
 * - **Contact:** a mission on a city makes contact first (`spy_city_mission`'s `diplo_set_treaty_flags(civ, civ2, 1)`).
 * - **Escape modes** (`MissionMode`): a theft with no target chosen, at a city already robbed, is hard (`:384-393`);
 *   poisoning draws ordinary or hard (`:641-642`).
 * - **Caught checks** (`AgentSurvives` with `CAUGHT_CHECK`, `spy_check_caught`, odds 3 or 6 for a veteran Spy, and a
 *   Diplomat always caught): one for a hard theft; for a chosen sabotage one, a second for a city with a Palace and a
 *   third when the target is City Walls (`:510-521`); three for a nuclear device, a fourth for a Palace (`:680-686`).
 *   Every other mission has none.
 * - **After the mission** (`AgentSurvives` with the resolved mode): a Diplomat is used up; a Spy pays a move, then
 *   escapes with odds 2, doubled for a veteran and halved when hard, to its nearest city, and becomes a veteran
 *   (`spy_try_escape`). An embassy or an investigation uses up a computer's agent and a person's Diplomat; a person's
 *   Spy stays, paying a third of a move for the embassy and for the first investigation of a city
 *   (`:262-320`). A planted device leaves the Spy as it is (the original makes no escape; the blast takes it).
 *   Sabotaging a unit keeps its own escape (base-unit-action-sabotage-unit's options), so no rule here answers for it.
 * - **Targets** (`MissionTargets`): only a person's Spy chooses: an advance at a city not yet robbed, or, when there is
 *   something to sabotage, any building but the Palace, SDI Defense and Wonders, or the production.
 * - **Counter-espionage** (`MissionDetected`): a random theft is detected by each Diplomat or Spy in the city in turn,
 *   at 20, 40 or 60 in 100 (Diplomat, Spy, veteran Spy), the first success stopping it (`:405-420`).
 * - **Effects:** the advance stolen; the building or production sabotaged, but only when either side is a person (the
 *   original's effect sits inside that test, `:577-618`, so two computer players' sabotage only spends the agent); the
 *   water poisoned; whether a planted device is discovered (½, a veteran ¼, never a Fundamentalist's), with
 *   civ2-diplomacy's `nuclearDeviceDiscovered`; a city incited, paid for and captured with the action as the cause;
 *   a unit bribed and rehomed.
 */
export declare const getRules: ({
  cityBuildRegistry,
  cityGrowthRegistry,
  cityImprovementRegistry,
  cityRegistry,
  clientRegistry,
  diplomacy,
  engine,
  interactionRegistry,
  pendingEffectRegistry,
  playerGovernmentRegistry,
  playerResearchRegistry,
  playerTreasuryRegistry,
  randomNumberGenerator,
  ruleRegistry,
  turn,
  unitImprovementRegistry,
  unitRegistry,
  inciterBecomesFounder,
}?: EspionageDependencies) => (
  | MissionMode
  | AgentSurvives
  | MissionTargets
  | MissionDetected
  | TechnologyStolen
  | CitySabotaged
  | DevicePlanted
  | WaterPoisoned
  | RevoltIncited
  | UnitBribed
  | ProcessYield
  | Captured
  | Destroyed
)[];
export default getRules;
