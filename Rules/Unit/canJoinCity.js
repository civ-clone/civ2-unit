"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.tooLargeToJoin = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CanJoinCity_1 = require("@civ-clone/base-unit-action-join-city/Rules/CanJoinCity");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const sizeLimit_1 = require("@civ-clone/base-unit-action-join-city/lib/sizeLimit");
/**
 * Settlers join a city only below @COSMIC's Aqueduct size (8), as no city in M2a has an Aqueduct or Sewer. Not checked
 *  against OpenCiv2's join order: an M2a deviation until civ2-city-improvement (D2).
 */
exports.tooLargeToJoin = (0, sizeLimit_1.tooLargeToJoin)(cosmic_1.cosmic.aqueductSize);
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance) => [
    new CanJoinCity_1.default('civ2-unit:unit/can-join-city/size-limit', new Effect_1.default((unit, city) => !(0, exports.tooLargeToJoin)(city, cityGrowthRegistry))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=canJoinCity.js.map