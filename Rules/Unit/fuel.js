"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.isSubmarine = exports.carriesAircraft = void 0;
const units_1 = require("../../data/units");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const refuel_1 = require("@civ-clone/base-unit-fuel/lib/refuel");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
const fuelRules_1 = require("@civ-clone/base-unit-fuel/lib/fuelRules");
const unitTable_1 = require("../../lib/unitTable");
// Each unit type's `@UNITS` row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
/** Whether `unit` is a carrier of aircraft (`@UNITS` flag 7). */
const carriesAircraft = (unit) => { var _a, _b; return (((_b = (_a = rows.get(unit.constructor)) === null || _a === void 0 ? void 0 : _a[12]) !== null && _b !== void 0 ? _b : 0) & units_1.CARRIES_AIR) !== 0; };
exports.carriesAircraft = carriesAircraft;
/** Whether `unit` is a submarine (`@UNITS` flag 3), which missiles refuel with. */
const isSubmarine = (unit) => { var _a, _b; return (((_b = (_a = rows.get(unit.constructor)) === null || _a === void 0 ? void 0 : _a[12]) !== null && _b !== void 0 ? _b : 0) & units_1.SUBMARINE) !== 0; };
exports.isSubmarine = isSubmarine;
/**
 * Civilization II's fuel (`unit_move_dir_air_fuel`): a unit's range is its `Fuel` yield (the `@UNITS` range column, 0
 *  for the Helicopter, which needs none), counted each time it runs out of moves away from a refuelling point
 *  (base-unit-fuel's `'out-of-moves'`), and it crashes when the count reaches its range. It refuels in one of its
 *  player's cities, on an Airbase, and on a square with one of its player's carriers (a missile also with a submarine)
 *  or aboard one. A crash emits
 *  `unit:out-of-fuel` (base-unit-fuel's emit rule) before the unit is destroyed.
 */
const getRules = ({ cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, ruleRegistry = RuleRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, } = {}) => [
    ...(0, fuelRules_1.default)({ engine, ruleRegistry, unitImprovementRegistry, unitRegistry }, { prefix: 'civ2-unit', countOn: 'out-of-moves' }),
    (0, refuel_1.refuelInOwnCity)(cityRegistry, undefined, 'civ2-unit:unit/refuel/city'),
    (0, refuel_1.refuelOnTileImprovement)(TileImprovements_1.Airbase, tileImprovementRegistry, undefined, 'civ2-unit:unit/refuel/airbase'),
    (0, refuel_1.refuelInStackWith)((base, unit) => (0, exports.carriesAircraft)(base) || ((0, exports.isSubmarine)(base) && unit.hasTrait(SingleUse_1.default)), unitRegistry, undefined, 'civ2-unit:unit/refuel/carrier'),
    (0, refuel_1.refuelAboard)(transportRegistry, undefined, 'civ2-unit:unit/refuel/aboard'),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=fuel.js.map