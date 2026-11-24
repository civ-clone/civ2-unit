"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.oceanMovementCostDescription = exports.AIR_AND_NAVAL_MOVE_COST = exports.flatJobDescription = exports.terrainJobDescription = exports.workerTurns = exports.terrainJobWorker = exports.movementCostDescription = exports.terrainJobTime = exports.describedFlatJobs = exports.describedTerrainJobs = exports.MOVE_RULE = exports.civ2TerrainJobTurns = exports.rowsApart = exports.terrainCost = void 0;
const Actions_1 = require("../../Actions");
const jobTurns_1 = require("@civ-clone/base-terrain-properties/lib/jobTurns");
const terrainTable_1 = require("@civ-clone/base-terrain-properties/lib/terrainTable");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
const terrainProperties_1 = require("@civ-clone/civ2-world/lib/terrainProperties");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Description_1 = require("@civ-clone/core-rule/Description");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const TerrainFeatures_1 = require("@civ-clone/civ2-world/TerrainFeatures");
const TerrainAsRoad_1 = require("@civ-clone/base-unit-trait-terrain-as-road/TerrainAsRoad");
const Types_1 = require("@civ-clone/core-terrain/Types");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const Units_1 = require("../../Units");
const workRate_1 = require("./workRate");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Naval_1 = require("@civ-clone/base-unit-type-naval/Naval");
const Terrains_1 = require("@civ-clone/civ2-world/Terrains");
const terrainConversions_1 = require("../../lib/terrainConversions");
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
    // `unit_terrain_work_turns` order 6: farmland takes the irrigation order's turns.
    [Actions_1.BuildFarmland, irrigating],
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
/** The base-unit-movement rule that charges a land unit's move onto a square its terrain's cost. */
exports.MOVE_RULE = 'civ2-unit:unit/movement-cost/move';
// The terrains whose column in `table` passes `test`, and every land terrain.
const terrainsWhere = (table, test) => table
    .filter(([, outcome]) => test(outcome))
    .map(([TerrainType]) => TerrainType), inPlace = (outcome) => outcome === 'yes', landTerrains = terrainProperties_1.movementCost
    .map(([TerrainType]) => TerrainType)
    .filter((TerrainType) => !Object.prototype.isPrototypeOf.call(Types_1.Water, TerrainType));
/**
 * The terrain jobs whose turns each terrain's Civilopedia entry gives (civ-clone/web-renderer#620): each job, what it
 *  builds or does (a tile improvement, or the conversion or transform itself), and the terrains it's done on.
 *  Irrigating or mining a terrain that it changes is that change's own job (Clear Forest, Plant Forest…). An airbase
 *  and cleaning pollution take the same turns everywhere, so no terrain says them.
 */
exports.describedTerrainJobs = [
    [Actions_1.BuildIrrigation, TileImprovements_1.Irrigation, terrainsWhere(terrainProperties_1.irrigation, inPlace)],
    [Actions_1.BuildFarmland, TileImprovements_1.Farmland, terrainsWhere(terrainProperties_1.irrigation, inPlace)],
    [Actions_1.BuildMine, TileImprovements_1.Mine, terrainsWhere(terrainProperties_1.mining, inPlace)],
    [Actions_1.BuildRoad, TileImprovements_1.Road, landTerrains],
    [Actions_1.BuildRailroad, TileImprovements_1.Railroad, landTerrains],
    [Actions_1.BuildFortress, TileImprovements_1.Fortress, landTerrains],
    // A conversion names itself (Plant Forest), not the order it's given as: no mine is built on Grassland.
    ...terrainConversions_1.terrainConversions.map(([Conversion, , ...terrains]) => [Conversion, Conversion, terrains]),
    [
        Actions_1.TransformTerrain,
        Actions_1.TransformTerrain,
        terrainsWhere(terrainProperties_1.transform, (outcome) => outcome !== null),
    ],
];
/**
 * The terrain jobs that take the same turns everywhere, which no terrain's entry gives, said on their tile
 *  improvement's own entry (civ-clone/web-renderer#1272, civ-clone/web-renderer#621): building an Airbase, and cleaning
 *  up Pollution, which takes it away.
 */
exports.describedFlatJobs = [
    [Actions_1.BuildAirbase, TileImprovements_1.Airbase, 'build_turns'],
    [Actions_1.CleanPollution, TileImprovements_1.Pollution, 'removal_turns'],
];
// A terrain to look a class up by: the lookups need only its class.
const terrainOf = (TerrainType) => Object.create(TerrainType.prototype);
/**
 * The turns `Job` takes Settlers on `TerrainType` as `civ2TerrainJobTurns` gives them, counting the turn the order is
 *  given on as Civilization II does (base-terrain-properties' `terrainJobTurns`, which the rule applies, is one fewer).
 */
const terrainJobTime = (Job, TerrainType) => {
    const row = exports.civ2TerrainJobTurns.find(([JobType]) => JobType === Job);
    if (row === undefined) {
        return null;
    }
    const [, time] = row;
    return typeof time === 'function'
        ? time(terrainOf(TerrainType))
        : (0, terrainTable_1.terrainValue)(time, terrainOf(TerrainType));
};
exports.terrainJobTime = terrainJobTime;
/** What moving onto each land terrain costs a land unit, for its Civilopedia entry (civ-clone/web-renderer#620). */
const movementCostDescription = () => new Description_1.default(...landTerrains.map((TerrainType) => ({
    type: 'movement_cost',
    subject: TerrainType,
    value: (0, exports.terrainCost)(terrainOf(TerrainType)),
})));
exports.movementCostDescription = movementCostDescription;
/**
 * Whose work each job's turns are given for: Settlers, or Engineers for a transform, which only they do (at their own
 *  rate, `Rules/Unit/workRate`).
 */
const terrainJobWorker = (Job) => Job === Actions_1.TransformTerrain ? [Units_1.Engineer, workRate_1.ENGINEER_WORK_RATE] : [Units_1.Settlers, 1];
exports.terrainJobWorker = terrainJobWorker;
/**
 * The turns a job of `turns` (counting the turn the order is given on) takes a unit working at `rate`, counted the same
 *  way, as a game plays it: the rule charges `turns - 1` (`terrainJobTurns`) and `DelayedAction` divides that by the
 *  rate, rounding up, so Engineers' Desert transform (20) takes 11 turns, not 10.
 */
const workerTurns = (turns, rate) => Math.ceil((turns - 1) / rate) + 1;
exports.workerTurns = workerTurns;
/**
 * The turns `Job` takes on each of its terrains, as the player counts them (with the turn the order is given on), and
 *  whose turns they are, for their Civilopedia entries (civ-clone/web-renderer#620).
 */
const terrainJobDescription = (Job, Improvement, terrains) => {
    const [unit, rate] = (0, exports.terrainJobWorker)(Job);
    return new Description_1.default(...terrains.map((TerrainType) => ({
        type: 'improvement_turns',
        subject: TerrainType,
        improvement: Improvement,
        value: (0, exports.workerTurns)((0, exports.terrainJobTime)(Job, TerrainType), rate),
        unit,
    })));
};
exports.terrainJobDescription = terrainJobDescription;
/**
 * The turns a job that takes the same on every terrain takes, said once on its tile improvement's entry
 *  (`describedFlatJobs`), as the player counts them.
 */
const flatJobDescription = (Job, Improvement, type) => {
    const [unit, rate] = (0, exports.terrainJobWorker)(Job);
    return new Description_1.default({
        type,
        subject: Improvement,
        value: (0, exports.workerTurns)((0, exports.terrainJobTime)(Job, landTerrains[0]), rate),
        unit,
    });
};
exports.flatJobDescription = flatJobDescription;
/** What a ship or an aircraft pays for each move, as base-unit-movement's `air-and-naval` rule charges it. */
exports.AIR_AND_NAVAL_MOVE_COST = 1;
/** The Ocean a ship moves over, for its Civilopedia entry (civ-clone/web-renderer#620). */
const oceanMovementCostDescription = () => new Description_1.default({
    type: 'movement_cost',
    subject: Terrains_1.Ocean,
    value: exports.AIR_AND_NAVAL_MOVE_COST,
});
exports.oceanMovementCostDescription = oceanMovementCostDescription;
/**
 * base-unit-movement's rules, with the ones that say what they do (civ-clone/web-renderer#620) built here instead, in
 *  their place: the move, air-and-naval and described terrain job rules, each the same class, id, priority, criteria
 *  and effect as base-unit-movement's `movementCostRules` builds, with its `Description` among its own items. Built,
 *  not wrapped, so the path finder's every move pays nothing for the description.
 *
 * These 15 rules are copies of base-unit-movement's: a change to those rules there must be copied here. The id check
 *  below catches a rename, but not a new criterion or a changed effect (`tests/descriptions` compares their answers).
 */
const describeMovementCosts = (rules, jobs) => {
    const id = (name) => `civ2-unit:unit/movement-cost/${name}`, 
    // base-unit-movement's rule for a terrain job, saying what it says.
    jobRule = (Job, description) => {
        const jobTurns = (terrain) => (0, jobTurns_1.terrainJobTurns)(jobs, Job, terrain);
        return [
            id(`action/${Job.name}`),
            new MovementCost_1.default(id(`action/${Job.name}`), new Criterion_1.default((unit, action) => action instanceof Job), new Criterion_1.default((unit) => jobTurns(unit.tile().terrain()) !== null), new Effect_1.default((unit) => jobTurns(unit.tile().terrain())), description),
        ];
    }, isMove = new Criterion_1.default((unit, action) => action instanceof Actions_1.Move), described = new Map([
        [
            exports.MOVE_RULE,
            new MovementCost_1.default(exports.MOVE_RULE, isMove, new Criterion_1.default((unit) => unit instanceof Land_1.default), new Criterion_1.default((unit, action) => (0, exports.terrainCost)(action.to().terrain()) !== null), new Effect_1.default((unit, action) => (0, exports.terrainCost)(action.to().terrain())), (0, exports.movementCostDescription)()),
        ],
        [
            id('air-and-naval'),
            new MovementCost_1.default(id('air-and-naval'), isMove, new Criterion_1.default((unit) => unit instanceof Air_1.default || unit instanceof Naval_1.default), new Effect_1.default(() => exports.AIR_AND_NAVAL_MOVE_COST), (0, exports.oceanMovementCostDescription)()),
        ],
        ...exports.describedTerrainJobs.map(([Job, Improvement, terrains]) => jobRule(Job, (0, exports.terrainJobDescription)(Job, Improvement, terrains))),
        ...exports.describedFlatJobs.map(([Job, Improvement, type]) => jobRule(Job, (0, exports.flatJobDescription)(Job, Improvement, type))),
    ]);
    // Every one built here replaces one of base-unit-movement's, or the ids have drifted.
    described.forEach((rule, ruleId) => {
        if (!rules.some((base) => base.id() === ruleId)) {
            throw new TypeError(`civ2-unit: base-unit-movement has no '${ruleId}' rule to describe.`);
        }
    });
    return rules.map((rule) => { var _a; return (_a = described.get(rule.id())) !== null && _a !== void 0 ? _a : rule; });
};
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
            .some((improvement) => improvement instanceof Improvement), cityRoute = (name, Improvement, cost, description) => {
        const has = routeOrCity(Improvement);
        return new MovementCost_1.default(`civ2-unit:unit/movement-cost/${name}`, new Criterion_1.default((unit, action) => action instanceof Actions_1.Move), new Criterion_1.default((unit) => unit instanceof Land_1.default), new Criterion_1.default((unit, action) => has(action.from())), new Criterion_1.default((unit, action) => has(action.to())), new Effect_1.default(() => cost), description);
    };
    return [
        ...describeMovementCosts((0, movementCostRules_1.default)('civ2-unit', { tileImprovementRegistry, transportRegistry }, {
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
        }), exports.civ2TerrainJobTurns),
        // What a road and a railroad give, for the Civilopedia (civ-clone/web-renderer#1272): on these rules, Civ2's own,
        //  which each take in base-unit-movement's road or railroad rule as well as a city's square.
        cityRoute('city-road', TileImprovements_1.Road, roadMove, new Description_1.default({
            type: 'route_squares',
            subject: TileImprovements_1.Road,
            value: cosmic_1.cosmic.roadMoveMultiplier,
        })),
        cityRoute('city-railroad', TileImprovements_1.Railroad, 0, new Description_1.default({ type: 'route_free', subject: TileImprovements_1.Railroad })),
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