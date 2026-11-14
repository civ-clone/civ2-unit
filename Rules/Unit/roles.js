"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.roleTypes = exports.ROLE_RULE_PREFIX = void 0;
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const UnitRoles_1 = require("@civ-clone/base-unit-role/Rules/UnitRoles");
const units_1 = require("../../data/units");
const unitTable_1 = require("../../lib/unitTable");
/** The prefix of every role declaration's id: `civ2-unit:unit/role/<Unit>`. */
exports.ROLE_RULE_PREFIX = 'civ2-unit:unit/role';
/** `@UNITS` column 11's roles, 0 to 7, in OpenCiv2's order (`ROLE_*`). */
exports.roleTypes = [
    Roles_1.AttackRole,
    Roles_1.DefendRole,
    Roles_1.NavalSuperiorityRole,
    Roles_1.AirSuperiorityRole,
    Roles_1.TransportRole,
    Roles_1.SettleRole,
    Roles_1.DiplomacyRole,
    Roles_1.TradeRole,
];
/** Each unit type's role, from its `@UNITS` row. */
const getRules = () => units_1.units.map(([, , , , , , , , , , role], index) => (0, UnitRoles_1.unitRole)(exports.ROLE_RULE_PREFIX, unitTable_1.unitTypes[index], exports.roleTypes[role]));
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=roles.js.map