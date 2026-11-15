"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeOptions = exports.tableDefence = exports.upgradeTable = exports.GUNPOWDER = exports.MUSKETEERS = void 0;
const units_1 = require("../data/units");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const upgradeTarget_1 = require("@civ-clone/base-unit-upgrade/lib/upgradeTarget");
const unitTable_1 = require("./unitTable");
const roles_1 = require("../Rules/Unit/roles");
// What Leonardo's Workshop upgrades, from the unit table, as OpenCiv2 `civ_leonardo_upgrade` (`src/auto/civ.cpp`,
//  richardpenman/civ2@49f26ec) reads it: each type's obsoleting advance, prerequisite, hold and role, in `@UNITS` row
//  order (of several targets the last row wins). When to upgrade is civ2-wonder's.
/** `UNIT_MUSKETEERS`: defensive units with a lower defence than this row's skip ahead once Gunpowder is known. */
exports.MUSKETEERS = 7;
/** Advance 0x23, Gunpowder, which `civ_leonardo_upgrade` gives those weaker defensive units as their upgrade advance. */
exports.GUNPOWDER = 35;
const rowOf = (Type) => {
    const index = unitTable_1.unitTypes.indexOf(Type);
    return index === -1 ? null : units_1.units[index];
};
/** The unit table as base-unit-upgrade reads it. A type outside the table (none in a civ2 game) never upgrades. */
exports.upgradeTable = {
    types: unitTable_1.unitTypes,
    prerequisite: (Type) => {
        const row = rowOf(Type);
        return row === null ? null : (0, unitTable_1.advanceType)(row[11]);
    },
    obsoletedBy: (Type) => {
        const row = rowOf(Type);
        return row === null ? null : (0, unitTable_1.advanceType)(row[0]);
    },
    hold: (Type) => { var _a, _b; return (_b = (_a = rowOf(Type)) === null || _a === void 0 ? void 0 : _a[9]) !== null && _b !== void 0 ? _b : 0; },
    role: (Type) => {
        const row = rowOf(Type);
        return row === null ? null : roles_1.roleTypes[row[10]];
    },
};
/** A type's defence, from the table (not the unit's yield, which veterans and terrain change). */
const tableDefence = (Type) => { var _a, _b; return (_b = (_a = rowOf(Type)) === null || _a === void 0 ? void 0 : _a[5]) !== null && _b !== void 0 ? _b : 0; };
exports.tableDefence = tableDefence;
/**
 * The options for base-unit-upgrade's `upgradeUnits`, for Civilization II: the table above, the player's own
 *  advances, and defensive units weaker than Musketeers upgrading with Gunpowder. Pass the game's registries: the
 *  transport registry and the game's rules go to a unit that becomes a transport (`changeType`), as a load injects
 *  them into the units it makes.
 */
const upgradeOptions = ({ playerResearchRegistry = PlayerResearchRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, } = {}) => {
    const hasAdvance = (player, AdvanceType) => playerResearchRegistry.getByPlayer(player).completed(AdvanceType);
    return {
        ...exports.upgradeTable,
        hasAdvance,
        upgradeAdvances: [
            (0, upgradeTarget_1.weakerUnitsOfRole)({
                role: roles_1.roleTypes[units_1.DEFEND],
                defence: exports.tableDefence,
                below: units_1.units[exports.MUSKETEERS][5],
                Advance: (0, unitTable_1.advanceType)(exports.GUNPOWDER),
                hasAdvance,
                roleOf: exports.upgradeTable.role,
            }),
        ],
        ruleRegistry,
        transportRegistry,
        transportRuleRegistry: ruleRegistry,
        unitRegistry,
    };
};
exports.upgradeOptions = upgradeOptions;
exports.default = exports.upgradeOptions;
//# sourceMappingURL=upgrade.js.map