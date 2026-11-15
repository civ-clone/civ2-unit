"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.combatYieldRules = exports.combatYields = exports.capacity = exports.stats = exports.CARRIER_CAPACITY = void 0;
const Yields_1 = require("@civ-clone/core-unit/Yields");
const units_1 = require("../../data/units");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const unitYieldRules_1 = require("@civ-clone/base-unit-yield/lib/unitYieldRules");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fuel_1 = require("@civ-clone/base-unit-fuel/lib/Fuel");
const Yield_2 = require("@civ-clone/core-unit/Rules/Yield");
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
/**
 * What each transport holds: its hold, or the carrier's aircraft, or the submarine's missiles. The original's code
 *  holds 20 on a carrier or a submarine and doesn't check it on landing; both hold `CARRIER_CAPACITY` (decision 16,
 *  survey Q9).
 */
exports.capacity = units_1.units.flatMap(([, domain, , , , , , , , hold, , , flags], index) => (flags & units_1.CARRIES_AIR) !== 0 || (domain === units_1.SEA && (flags & units_1.SUBMARINE) !== 0)
    ? [[unitTable_1.unitTypes[index], exports.CARRIER_CAPACITY]]
    : domain === units_1.SEA && hold > 0
        ? [[unitTable_1.unitTypes[index], hold]]
        : []);
// Each unit type's row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
/**
 * The combat and fuel figures of each type's row, as yields: `HitPoints` (the row's hit points times 10, as the game
 *  loads them, `rules_load_units`), `Firepower`, and `Fuel` (the range: 0, needing no fuel, for every unit but aircraft
 *  and missiles, and for the Helicopter).
 */
exports.combatYields = [
    [Yields_1.HitPoints, ([, , , , , , hitPoints]) => hitPoints * 10],
    [Yields_1.Firepower, ([, , , , , , , firepower]) => firepower],
    [Fuel_1.default, ([, , , range]) => range],
];
/** `combatYields` as a unit `Yield` rule and a `BaseYield` rule each, `civ2-unit:unit/yield/<Yield>`. */
const combatYieldRules = () => exports.combatYields.flatMap(([YieldType, value]) => [
    new Yield_2.Yield(`civ2-unit:unit/yield/${YieldType.name}`, new Criterion_1.default((unit, unitYield) => unitYield instanceof YieldType && rows.has(unit.constructor)), new Effect_1.default((unit, unitYield) => unitYield.set(value(rows.get(unit.constructor))))),
    new Yield_1.BaseYield(`civ2-unit:unit/base-yield/${YieldType.name}`, new Criterion_1.default((UnitType, unitYield) => unitYield instanceof YieldType && rows.has(UnitType)), new Effect_1.default((UnitType, unitYield) => unitYield.set(value(rows.get(UnitType))))),
]);
exports.combatYieldRules = combatYieldRules;
/** A veteran attacks and defends at half as much again (`unit_attack_strength`, `unit_defense_strength`). */
const getRules = (unitImprovementRegistry = UnitImprovementRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, transportRegistry = TransportRegistry_1.instance) => [
    ...(0, unitYieldRules_1.default)('civ2-unit', { ruleRegistry, transportRegistry, unitImprovementRegistry }, {
        stats: exports.stats,
        improvements: [[Veteran_1.default, 0.5, Yields_1.Attack, Yields_1.Defence]],
        capacity: exports.capacity,
    }),
    ...(0, exports.combatYieldRules)(),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map