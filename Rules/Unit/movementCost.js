"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.civ2TerrainJobTurns = exports.rowsApart = exports.terrainCost = void 0;
const Actions_1 = require("../../Actions");
const jobTurns_1 = require("@civ-clone/base-terrain-properties/lib/jobTurns");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
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
/** Whether two squares are on neighbouring rows, counting the last row and the first as neighbours (rows wrap). */
const rowsApart = (from, to) => {
    const height = from.map().height(), dy = Math.abs(from.y() - to.y());
    return dy === 1 || (height > 2 && dy === height - 1);
};
exports.rowsApart = rowsApart;
// A job's turns on the terrains where it can be done (civ2-world gives `null` where it can't).
const where = (table) => table.filter((row) => row[1] !== null);
const irrigating = where(terrainProperties_1.irrigationTurns), mining = where(terrainProperties_1.miningTurns);
// A step along a road, a river or (for a unit that treats all as road) anywhere costs one of @COSMIC's road moves.
const roadMove = 1 / cosmic_1.cosmic.roadMoveMultiplier;
/**
 * How many turns each terrain job takes in Civilization II (`unit_terrain_work_turns`): irrigating and mining from
 *  `@TERRAIN`, a road twice the terrain's movement cost and a railroad four times it, pollution 4. A conversion (Clear
 *  Forest, Plant Forest...) is the irrigate or mine order on that terrain, so it takes that order's time. A fortress
 *  takes half the terrain's movement cost (rounded down) and 3, an airbase 4, and a transform the movement cost times
 *  @COSMIC's transform time. Engineers do each in half the turns (`Rules/Unit/workRate`).
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
    [
        Actions_1.BuildFortress,
        (terrain) => {
            const cost = (0, exports.terrainCost)(terrain);
            return cost === null ? null : Math.trunc(cost / 2) + 3;
        },
    ],
    [Actions_1.BuildAirbase, () => 4],
    [Actions_1.TransformTerrain, (0, jobTurns_1.multipleOf)(exports.terrainCost, cosmic_1.cosmic.transformTime)],
];
/**
 * Civilization II's movement costs (`unit_move_dir_step_cost`): base-unit-movement's rules with Civ2's terrain,
 *  routes and jobs, and Civ2's own: a city's square counts as road and railroad, a step along a river costs as a road,
 *  and so does every step of a unit that treats every square as road (Alpine Troops, Partisans, Explorers). A move
 *  takes the cheapest answer.
 */
const getRules = (tileImprovementRegistry = TileImprovementRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, cityRegistry = CityRegistry_1.instance) => {
    const hasRiver = (tile) => terrainFeatureRegistry
        .getByTerrain(tile.terrain())
        .some((feature) => feature instanceof TerrainFeatures_1.River), 
    // A city's square counts as both road and railroad (`unit_move_dir_step_cost` tests the city bit with each).
    routeOrCity = (Improvement) => (tile) => cityRegistry.getByTile(tile) !== null ||
        tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof Improvement), cityRoute = (name, Improvement, cost) => {
        const has = routeOrCity(Improvement);
        return new MovementCost_1.default(`civ2-unit:unit/movement-cost/${name}`, new Criterion_1.default((unit, action) => action instanceof Actions_1.Move), new Criterion_1.default((unit) => unit instanceof Land_1.default), new Criterion_1.default((unit, action) => has(action.from())), new Criterion_1.default((unit, action) => has(action.to())), new Effect_1.default(() => cost));
    };
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
        cityRoute('city-road', TileImprovements_1.Road, roadMove),
        cityRoute('city-railroad', TileImprovements_1.Railroad, 0),
        new MovementCost_1.default('civ2-unit:unit/movement-cost/river', new Criterion_1.default((unit, action) => action instanceof Actions_1.Move), new Criterion_1.default((unit) => unit instanceof Land_1.default), new Criterion_1.default((unit, action) => hasRiver(action.from())), new Criterion_1.default((unit, action) => hasRiver(action.to())), 
        // Along the river only: a step to one of the four squares that share an edge with this one, one row up or down
        //  on the staggered grid (`dx == 1` and `|dy| == 1` on Civ2's doubled-x grid), across the wrapping seam too.
        new Criterion_1.default((unit, action) => (0, exports.rowsApart)(action.from(), action.to())), new Effect_1.default(() => roadMove)),
        new MovementCost_1.default('civ2-unit:unit/movement-cost/terrain-as-road', new Criterion_1.default((unit, action) => action instanceof Actions_1.Move), new Criterion_1.default((unit) => unit instanceof Land_1.default), new Criterion_1.default((unit) => unit.hasTrait(TerrainAsRoad_1.default)), new Effect_1.default(() => roadMove)),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=movementCost.js.map