import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/civ2-diplomacy/lib/Dependencies';
import Effect from '@civ-clone/core-rule/Effect';
import MissionChoice from '@civ-clone/base-unit-agent/Rules/MissionChoice';
import Unit from '@civ-clone/core-unit/Unit';
import computerMission from '../../lib/computerMission';
import { instance as randomNumberGeneratorInstance } from '@civ-clone/core-random';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';

export interface MissionChoiceDependencies {
  clientRegistry?: ClientRegistry;
  // civ2-diplomacy's dependencies (`dependenciesOf(game)`).
  diplomacy: Dependencies;
  pendingEffectRegistry?: PendingEffectRegistry;
  randomNumberGenerator?: () => number;
}

/**
 * A computer player's mission at a city (base-unit-agent's `MissionChoice`), as `spy_city_mission_ai_choice`
 * (`unit_spy.cpp:227-251`) chooses it: `lib/computerMission`, for the AI client to read once each time its Diplomat or
 * Spy is about to enter a city. It draws as the original does, once with a vendetta (a Spy's poisoning). A person's
 * agent gets no answer: the person chooses.
 */
export const getRules = ({
  clientRegistry = clientRegistryInstance,
  diplomacy,
  pendingEffectRegistry = pendingEffectRegistryInstance,
  randomNumberGenerator = randomNumberGeneratorInstance,
}: MissionChoiceDependencies): MissionChoice[] => [
  new MissionChoice(
    'civ2-unit:mission-choice/computer',
    new Effect((unit: Unit, city: City): string | undefined =>
      isHuman(unit.player(), clientRegistry)
        ? undefined
        : computerMission(
            unit,
            city,
            { ...diplomacy, pendingEffectRegistry },
            randomNumberGenerator
          )
    )
  ),
];

export default getRules;
