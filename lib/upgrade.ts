import { DEFEND, UnitRow, units } from '../data/units';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  UpgradeTable,
  weakerUnitsOfRole,
} from '@civ-clone/base-unit-upgrade/lib/upgradeTarget';
import { advanceType, unitTypes } from './unitTable';
import Advance from '@civ-clone/core-science/Advance';
import Player from '@civ-clone/core-player/Player';
import { RoleType } from '@civ-clone/base-unit-role/UnitRole';
import Unit from '@civ-clone/core-unit/Unit';
import { UpgradeUnitsOptions } from '@civ-clone/base-unit-upgrade/lib/upgradeUnits';
import { roleTypes } from '../Rules/Unit/roles';

// What Leonardo's Workshop upgrades, from the unit table, as OpenCiv2 `civ_leonardo_upgrade` (`src/auto/civ.cpp`,
//  richardpenman/civ2@49f26ec) reads it: each type's obsoleting advance, prerequisite, hold and role, in `@UNITS` row
//  order (of several targets the last row wins). When to upgrade is civ2-wonder's.

/** `UNIT_MUSKETEERS`: defensive units with a lower defence than this row's skip ahead once Gunpowder is known. */
export const MUSKETEERS = 7;

/** Advance 0x23, Gunpowder, which `civ_leonardo_upgrade` gives those weaker defensive units as their upgrade advance. */
export const GUNPOWDER = 35;

const rowOf = (Type: typeof Unit): UnitRow | null => {
  const index = unitTypes.indexOf(Type);

  return index === -1 ? null : units[index];
};

/** The unit table as base-unit-upgrade reads it. A type outside the table (none in a civ2 game) never upgrades. */
export const upgradeTable: UpgradeTable = {
  types: unitTypes,
  prerequisite: (Type: typeof Unit): typeof Advance | null => {
    const row = rowOf(Type);

    return row === null ? null : advanceType(row[11]);
  },
  obsoletedBy: (Type: typeof Unit): typeof Advance | null => {
    const row = rowOf(Type);

    return row === null ? null : advanceType(row[0]);
  },
  hold: (Type: typeof Unit): number => rowOf(Type)?.[9] ?? 0,
  role: (Type: typeof Unit): RoleType | null => {
    const row = rowOf(Type);

    return row === null ? null : roleTypes[row[10]];
  },
};

/** A type's defence, from the table (not the unit's yield, which veterans and terrain change). */
export const tableDefence = (Type: typeof Unit): number =>
  rowOf(Type)?.[5] ?? 0;

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
export const upgradeOptions = ({
  playerResearchRegistry = playerResearchRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  transportRegistry = transportRegistryInstance,
  unitRegistry = unitRegistryInstance,
}: UpgradeRegistries = {}): UpgradeUnitsOptions => {
  const hasAdvance = (player: Player, AdvanceType: typeof Advance): boolean =>
    playerResearchRegistry.getByPlayer(player).completed(AdvanceType);

  return {
    ...upgradeTable,
    hasAdvance,
    upgradeAdvances: [
      weakerUnitsOfRole({
        role: roleTypes[DEFEND],
        defence: tableDefence,
        below: units[MUSKETEERS][5],
        Advance: advanceType(GUNPOWDER) as typeof Advance,
        hasAdvance,
        roleOf: upgradeTable.role,
      }),
    ],
    ruleRegistry,
    transportRegistry,
    transportRuleRegistry: ruleRegistry,
    unitRegistry,
  };
};

export default upgradeOptions;
