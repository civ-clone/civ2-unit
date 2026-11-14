"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const BuildCost_1 = require("@civ-clone/core-city-build/Rules/BuildCost");
const units_1 = require("../../data/units");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const unitTable_1 = require("../../lib/unitTable");
/** Each unit's cost in shields: `@UNITS` column 9's rows of shields, times @COSMIC's shield box rows (10). */
const getRules = () => units_1.units.flatMap(([, , , , , , , , cost], index) => (0, BuildCost_1.buildCost)(unitTable_1.unitTypes[index], cost * cosmic_1.cosmic.shieldBoxRows, 'civ2-unit:city/build-cost'));
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=buildCost.js.map