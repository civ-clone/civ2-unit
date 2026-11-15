import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Created from '@civ-clone/core-unit/Rules/Created';
export interface CreatedRegistries {
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  ruleRegistry?: RuleRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
}
export declare const getRules: ({
  playerGovernmentRegistry,
  ruleRegistry,
  unitImprovementRegistry,
}?: CreatedRegistries) => Created[];
export default getRules;
