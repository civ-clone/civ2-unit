"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.tooLargeToJoin = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CanJoinCity_1 = require("@civ-clone/base-unit-action-join-city/Rules/CanJoinCity");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const sizeLimit_1 = require("@civ-clone/base-unit-action-join-city/lib/sizeLimit");
/**
 * Settlers join a city only below @COSMIC's Aqueduct size (8), whatever the city has built: OpenCiv2
 *  `src/auto/unit.cpp` `unit_cmd_build_city` (richardpenman/civ2@49f26ec) compares the size with @COSMIC's Aqueduct size
 *  alone, and an Aqueduct or Sewer System doesn't lift it. (A computer player's settler joins below 10, `ai.cpp`'s
 *  orders: not modelled.)
 */
exports.tooLargeToJoin = (0, sizeLimit_1.tooLargeToJoin)(cosmic_1.cosmic.aqueductSize);
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance) => [
    new CanJoinCity_1.default('civ2-unit:unit/can-join-city/size-limit', new Effect_1.default((unit, city) => !(0, exports.tooLargeToJoin)(city, cityGrowthRegistry))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=canJoinCity.js.map