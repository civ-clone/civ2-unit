import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { UpgradeTable } from '@civ-clone/base-unit-upgrade/lib/upgradeTarget';
import Unit from '@civ-clone/core-unit/Unit';
import { UpgradeUnitsOptions } from '@civ-clone/base-unit-upgrade/lib/upgradeUnits';
/** `UNIT_MUSKETEERS`: defensive units with a lower defence than this row's skip ahead once Gunpowder is known. */
export declare const MUSKETEERS = 7;
/** Advance 0x23, Gunpowder, which `civ_leonardo_upgrade` gives those weaker defensive units as their upgrade advance. */
export declare const GUNPOWDER = 35;
/** The unit table as base-unit-upgrade reads it. A type outside the table (none in a civ2 game) never upgrades. */
export declare const upgradeTable: UpgradeTable;
/** A type's defence, from the table (not the unit's yield, which veterans and terrain change). */
export declare const tableDefence: (Type: typeof Unit) => number;
export interface UpgradeRegistries {
  playerResearchRegistry?: PlayerResearchRegistry;
  ruleRegistry?: RuleRegistry;
  transportRegistry?: TransportRegistry;
  unitRegistry?: UnitRegistry;
}
/**
 * The options for base-unit-upgrade's `upgradeUnits`, for Civilization II: the table above, the player's own
 *  advances, and defensive units weaker than Musketeers upgrading with Gunpowder. Pass the game's registries: the
 *  transport registry and the game's rules go to a unit that becomes a transport (`changeType`), as a load injects
 *  them into the units it makes.
 */
export declare const upgradeOptions: ({
  playerResearchRegistry,
  ruleRegistry,
  transportRegistry,
  unitRegistry,
}?: UpgradeRegistries) => UpgradeUnitsOptions;
export default upgradeOptions;
