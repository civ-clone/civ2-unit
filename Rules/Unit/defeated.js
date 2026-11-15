"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.sparesStack = void 0;
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RequirementRegistry_1 = require("@civ-clone/core-requirement/RequirementRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const WonderRegistry_1 = require("@civ-clone/core-wonder/WonderRegistry");
const CityWalls_1 = require("@civ-clone/base-city-improvement-citywalls/CityWalls");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const GreatWall_1 = require("@civ-clone/base-wonder-great-wall/GreatWall");
const Low_1 = require("@civ-clone/core-rule/Priorities/Low");
const hasImprovementOrWonder_1 = require("@civ-clone/base-wonder/lib/hasImprovementOrWonder");
const isHuman_1 = require("@civ-clone/base-difficulty/lib/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
/**
 * Where a defeated defender's stack survives it, besides a city (base-unit-lifecycle's `sparesStack`): a Fortress or
 *  an Airbase (`unit_resolve_attack_remove_loser`).
 */
const sparesStack = (tileImprovementRegistry = TileImprovementRegistry_1.instance) => (tile) => tileImprovementRegistry
    .getByTile(tile)
    .some((improvement) => improvement instanceof TileImprovements_1.Fortress || improvement instanceof TileImprovements_1.Airbase);
exports.sparesStack = sparesStack;
/**
 * `civ2-unit:unit/defeated/city-shrinks`: a city loses a citizen each time one of its defenders loses a battle
 *  (`unit_resolve_attack_remove_loser`), unless it has City Walls or its owner the Great Wall, the attacker fought from
 *  the sea (the code asks whether the attacker's square is ocean, not the city's), or it is a human player's city on
 *  Chieftain. `Low`, after the defender is destroyed; a city shrunk to nothing is the city rules' to remove.
 */
const getRules = ({ cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, requirementRegistry = RequirementRegistry_1.instance, wonderRegistry = WonderRegistry_1.instance, } = {}) => [
    new Defeated_1.default('civ2-unit:unit/defeated/city-shrinks', new Low_1.default(), 
    // The loser defended, and the winner attacked from a land square.
    new Criterion_1.default((unit, by, action) => action !== undefined && action.unit() === by && action.from().isLand()), new Criterion_1.default((unit) => cityRegistry.getByTile(unit.tile()) !== null), new Criterion_1.default((unit) => {
        const city = cityRegistry.getByTile(unit.tile());
        return !(0, hasImprovementOrWonder_1.cityHasImprovementOrWonder)(city, CityWalls_1.default, GreatWall_1.default, {
            cityImprovementRegistry,
            playerResearchRegistry,
            requirementRegistry,
            wonderRegistry,
        });
    }), new Criterion_1.default((unit) => {
        const city = cityRegistry.getByTile(unit.tile());
        return !((0, level_1.levelOf)(gameDifficultyRegistry) === 0 &&
            (0, isHuman_1.default)(city.player(), clientRegistry));
    }), new Effect_1.default((unit, by) => {
        const city = cityRegistry.getByTile(unit.tile());
        if (city === null || city.destroyed()) {
            return;
        }
        cityGrowthRegistry.getByCity(city).shrink(by);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=defeated.js.map