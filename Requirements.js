"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRequirements = exports.obsoletedBy = exports.requiresAdvance = void 0;
const units_1 = require("./data/units");
const Requirement_1 = require("@civ-clone/core-requirement/Requirement");
const unitTable_1 = require("./lib/unitTable");
// What Civilization II's units need and what makes them obsolete, from `@UNITS` columns 12 and 1, as the entries
//  `Rules/City/build` makes its rules from (`civ_can_build_unit`). `registerRules` adds them to the game's
//  `requirements`.
const rowsWith = (column) => units_1.units.flatMap((row, index) => row[column] === units_1.NONE
    ? []
    : [[unitTable_1.unitTypes[index], (0, unitTable_1.advanceType)(row[column])]]);
/** The advance a city's player needs before it can build each unit: one rule each. */
exports.requiresAdvance = (0, Requirement_1.table)('civ2-unit:city/build/requires-advance', 'requires', rowsWith(11));
/** The advance that stops a city's player building each unit: one rule each. */
exports.obsoletedBy = (0, Requirement_1.table)('civ2-unit:city/build/obsolete', 'obsoletedBy', rowsWith(0));
/** The entries `Rules/City/build`'s deriver makes rules from. */
exports.buildRequirements = [
    ...exports.requiresAdvance,
    ...exports.obsoletedBy,
];
exports.default = exports.buildRequirements;
//# sourceMappingURL=Requirements.js.map