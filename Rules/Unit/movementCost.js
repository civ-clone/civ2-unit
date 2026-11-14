"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.civ2TerrainJobTurns = exports.terrainCost = void 0;
const Actions_1 = require("../../Actions");
const jobTurns_1 = require("@civ-clone/base-terrain-properties/lib/jobTurns");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const terrainProperties_1 = require("@civ-clone/civ2-world/lib/terrainProperties");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const TerrainFeatures_1 = require("@civ-clone/civ2-world/TerrainFeatures");
const TerrainAsRoad_1 = require("@civ-clone/base-unit-trait-terrain-as-road/TerrainAsRoad");
const terrainTable_1 = require("@civ-clone/base-terrain-properties/lib/terrainTable");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const movementCostRules_1 = require("@civ-clone/base-unit-movement/lib/movementCostRules");
/** What a land unit's move onto each terrain costs: civ2-world's `@TERRAIN` movement costs, looked up by class. */
exports.terrainCost = (0, terrainTable_1.cachedTerrainLookup)(terrainProperties_1.movementCost);
// A job's turns on the terrains where it can be done (civ2-world gives `null` where it can't).
const where = (table) => table.filter((row) => row[1] !== null);
const irrigating = where(terrainProperties_1.irrigationTurns), mining = where(terrainProperties_1.miningTurns);
// A step along a road, a river or (for a unit that treats all as road) anywhere costs one of @COSMIC's road moves.
const roadMove = 1 / cosmic_1.cosmic.roadMoveMultiplier;
/**
 * How many turns each terrain job takes in Civilization II (`unit_terrain_work_turns`): irrigating and mining from
 *  `@TERRAIN`, a road twice the terrain's movement cost and a railroad four times it, pollution 4. A conversion (Clear
 *  Forest, Plant Forest...) is the irrigate or mine order on that terrain, so it takes that order's time.
 */
exports.civ2TerrainJobTurns = [
    [Actions_1.BuildIrrigation, irrigating],
    [Actions_1.BuildMine, mining],
    [Actions_1.BuildRoad, (0, jobTurns_1.multipleOf)(exports.terrainCost, 2)],
    [Actions_1.BuildRailroad, (0, jobTurns_1.multipleOf)(exports.terrainCost, 4)],
    [Actions_1.CleanPollution, () => 4],
    [Actions_1.ClearForest, irrigating],
    [Actions_1.ClearJungle, irrigating],
    [Actions_1.ClearSwamp, irrigating],
    [Actions_1.PlantForest, mining],
];
/**
 * Civilization II's movement costs (`unit_move_dir_step_cost`): base-unit-movement's rules with Civ2's terrain,
 *  routes and jobs, and two of Civ2's own: along a river, and a unit that treats every square as road (Alpine Troops,
 *  Partisans, Explorers). A move takes the cheapest answer.
 */
const getRules = (tileImprovementRegistry = TileImprovementRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance) => {
    const hasRiver = (tile) => terrainFeatureRegistry
        .getByTerrain(tile.terrain())
        .some((feature) => feature instanceof TerrainFeatures_1.River);
    return [
        ...(0, movementCostRules_1.default)('civ2-unit', { tileImprovementRegistry, transportRegistry }, {
            Move: Actions_1.Move,
            terrainCost: exports.terrainCost,
            routes: [
                ['road', TileImprovements_1.Road, roadMove],
                ['railroad', TileImprovements_1.Railroad, 0],
            ],
            orders: [
                [Actions_1.Fortify, 1],
                [Actions_1.Pillage, 1],
                [Actions_1.Sleep, 0],
            ],
            jobs: exports.civ2TerrainJobTurns,
        }),
        new MovementCost_1.default('civ2-unit:unit/movement-cost/river', new Criterion_1.default((unit, action) => action instanceof Actions_1.Move), new Criterion_1.default((unit) => unit instanceof Land_1.default), new Criterion_1.default((unit, action) => hasRiver(action.from())), new Criterion_1.default((unit, action) => hasRiver(action.to())), new Effect_1.default(() => roadMove)),
        new MovementCost_1.default('civ2-unit:unit/movement-cost/terrain-as-road', new Criterion_1.default((unit, action) => action instanceof Actions_1.Move), new Criterion_1.default((unit) => unit instanceof Land_1.default), new Criterion_1.default((unit) => unit.hasTrait(TerrainAsRoad_1.default)), new Effect_1.default(() => roadMove)),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=movementCost.js.map