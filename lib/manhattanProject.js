"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manhattanProjectBuilt = void 0;
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const WonderRegistry_1 = require("@civ-clone/core-wonder/WonderRegistry");
const ManhattanProject_1 = require("@civ-clone/base-wonder-manhattanproject/ManhattanProject");
const wonderHistory_1 = require("@civ-clone/base-wonder/lib/wonderHistory");
/**
 * Whether anyone has ever built the Manhattan Project, standing or lost with its city since: what `Rules/City/build`'s
 *  `nuclear` rule asks (OpenCiv2 `civ_can_build_unit` reads `wonder_city[WONDER_MANHATTAN] != -1`, and a lost Wonder is
 *  -2, richardpenman/civ2@49f26ec). Read from the game's own registries, so this package needs no Wonder rules of its
 *  own: civ2-wonder builds it.
 */
const manhattanProjectBuilt = (wonderRegistry = WonderRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance) => () => (0, wonderHistory_1.everBuilt)(ManhattanProject_1.default, wonderRegistry, cityImprovementRegistry);
exports.manhattanProjectBuilt = manhattanProjectBuilt;
exports.default = exports.manhattanProjectBuilt;
//# sourceMappingURL=manhattanProject.js.map