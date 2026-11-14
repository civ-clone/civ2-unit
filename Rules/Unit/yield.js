"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.capacity = exports.stats = exports.CARRIER_CAPACITY = void 0;
const Yields_1 = require("@civ-clone/core-unit/Yields");
const units_1 = require("../../data/units");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const unitYieldRules_1 = require("@civ-clone/base-unit-yield/lib/unitYieldRules");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const unitTable_1 = require("../../lib/unitTable");
/**
 * How many aircraft a carrier holds. Civilization II's Carrier has no hold (`@UNITS` column 10 is 0: aircraft land on
 *  its square), so this is Civ1's number, until stacking aircraft on a carrier's square is a rule of its own.
 */
exports.CARRIER_CAPACITY = 8;
/** Each unit type's attack, defence, movement (whole squares) and visibility (2 with flag 0), from its row. */
exports.stats = units_1.units.map(([, , move, , attack, defence, , , , , , , flags], index) => [
    unitTable_1.unitTypes[index],
    attack,
    defence,
    move,
    (flags & units_1.SEES_TWO_SPACES) !== 0 ? 2 : 1,
]);
/** What each transport holds: its hold, or the carrier's aircraft. */
exports.capacity = units_1.units.flatMap(([, domain, , , , , , , , hold, , , flags], index) => (flags & units_1.CARRIES_AIR) !== 0
    ? [[unitTable_1.unitTypes[index], exports.CARRIER_CAPACITY]]
    : domain === units_1.SEA && hold > 0
        ? [[unitTable_1.unitTypes[index], hold]]
        : []);
/** A veteran attacks and defends at half as much again (`unit_attack_strength`, `unit_defense_strength`). */
const getRules = (unitImprovementRegistry = UnitImprovementRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, transportRegistry = TransportRegistry_1.instance) => (0, unitYieldRules_1.default)('civ2-unit', { ruleRegistry, transportRegistry, unitImprovementRegistry }, {
    stats: exports.stats,
    improvements: [[Veteran_1.default, 0.5, Yields_1.Attack, Yields_1.Defence]],
    capacity: exports.capacity,
});
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map