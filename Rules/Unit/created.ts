import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Communism from '@civ-clone/base-government-communism/Communism';
import Created from '@civ-clone/core-unit/Rules/Created';
import Criterion from '@civ-clone/core-rule/Criterion';
import { DiplomacyRole } from '@civ-clone/base-unit-role/Roles';
import Effect from '@civ-clone/core-rule/Effect';
import Unit from '@civ-clone/core-unit/Unit';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { hasRole } from '@civ-clone/base-unit-role/roleOf';

export interface CreatedRegistries {
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  ruleRegistry?: RuleRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
}

// Under Communism a unit of the diplomacy role built in a city is a veteran: OpenCiv2 `city_process_production_unit`
//  (`src/auto/city_production.cpp`, richardpenman/civ2@49f26ec) sets the flag for `ROLE_DIPLOMACY` when the builder's
//  government is `GOV_COMMUNISM`, ahead of (and instead of) the Barracks test, and the computer's own diplomat path in
//  the same function does it too. That role is the Diplomat's and the Spy's, so both are built veteran (survey Q23
//  follows the code). Barracks and the like are civ2-city-improvement's, which leaves this role out.
export const getRules = ({
  playerGovernmentRegistry = playerGovernmentRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
}: CreatedRegistries = {}): Created[] => [
  new Created(
    'civ2-unit:unit/created/veteran/communism',
    new Criterion((unit: Unit): boolean => unit.city() !== null),
    new Criterion((unit: Unit): boolean =>
      hasRole(unit, DiplomacyRole, ruleRegistry)
    ),
    new Criterion((unit: Unit): boolean => {
      try {
        return playerGovernmentRegistry
          .getByPlayer(unit.player())
          .is(Communism);
      } catch (e) {
        return false;
      }
    }),
    new Effect((unit: Unit): void =>
      unitImprovementRegistry.register(new Veteran(unit))
    )
  ),
];

export default getRules;
