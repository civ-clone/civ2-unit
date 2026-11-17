import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Dependencies from '@civ-clone/civ2-diplomacy/lib/Dependencies';
import MissionChoice from '@civ-clone/base-unit-agent/Rules/MissionChoice';
export interface MissionChoiceDependencies {
  clientRegistry?: ClientRegistry;
  diplomacy: Dependencies;
  pendingEffectRegistry?: PendingEffectRegistry;
  randomNumberGenerator?: () => number;
}
/**
 * A computer player's mission at a city (base-unit-agent's `MissionChoice`), as `spy_city_mission_ai_choice`
 * (`unit_spy.cpp:227-251`) chooses it: `lib/computerMission`, for the AI client to read once each time its Diplomat or
 * Spy is about to enter another player's city. It draws as the original does, once with a vendetta. Anything else (a
 * person's agent, who chooses for itself, a unit with no diplomatic missions, or the unit's own city) gets no answer and
 * draws nothing.
 */
export declare const getRules: ({
  clientRegistry,
  diplomacy,
  pendingEffectRegistry,
  randomNumberGenerator,
}: MissionChoiceDependencies) => MissionChoice[];
export default getRules;
