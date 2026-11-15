"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.withoutDomainTest = exports.pillageable = exports.partisanPillageOrder = exports.pillageOrder = exports.territoryImprovements = void 0;
const Actions_1 = require("../../Actions");
const units_1 = require("../../data/units");
const Action_1 = require("@civ-clone/core-unit/Rules/Action");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityNameRegistry_1 = require("@civ-clone/core-civilization/CityNameRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const Terrains_1 = require("@civ-clone/civ2-world/Terrains");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const PendingEffectRegistry_1 = require("@civ-clone/core-pending-effect/PendingEffectRegistry");
const PathFinderRegistry_1 = require("@civ-clone/core-world-path/PathFinderRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const StrategyRegistry_1 = require("@civ-clone/core-strategy/StrategyRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const actionRules_1 = require("@civ-clone/base-unit-action-rules/lib/actionRules");
const attack_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/attack");
const worker_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/worker");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const IgnoresZoneOfControl_1 = require("@civ-clone/base-unit-trait-ignores-zone-of-control/IgnoresZoneOfControl");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const NavalTransport_1 = require("@civ-clone/base-unit-type-naval-transport/NavalTransport");
const Or_1 = require("@civ-clone/core-rule/Criteria/Or");
const Declarations_1 = require("@civ-clone/library-diplomacy/Declarations");
const TerrainFeatures_1 = require("@civ-clone/civ2-world/TerrainFeatures");
const RoutePlanner_1 = require("@civ-clone/base-unit-action-rules/lib/RoutePlanner");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const Types_1 = require("@civ-clone/core-terrain/Types");
const diplomat_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/diplomat");
const move_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/move");
const traits_1 = require("@civ-clone/core-unit/traits");
const joinableCity_1 = require("@civ-clone/base-unit-action-join-city/joinableCity");
const landing_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/landing");
const nuclear_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/nuclear");
const orders_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/orders");
const partners_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/partners");
const peace_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/peace");
const pillage_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/pillage");
const domain_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/domain");
const transport_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/transport");
const treatyPartner_1 = require("@civ-clone/base-unit-lifecycle/lib/treatyPartner");
const routeOrders_1 = require("../../lib/routeOrders");
const zoneOfControl_1 = require("@civ-clone/base-zone-of-control/lib/zoneOfControl");
const Submerged_1 = require("@civ-clone/base-unit-trait-submerged/Submerged");
const Interceptor_1 = require("@civ-clone/base-unit-trait-interceptor/Interceptor");
const Paradrop_1 = require("@civ-clone/base-unit-trait-paradrop/Paradrop");
const Covert_1 = require("@civ-clone/base-unit-trait-covert/Covert");
const criteria_1 = require("@civ-clone/base-unit-action-airlift/lib/criteria");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const distance_1 = require("../../lib/distance");
const domain_2 = require("@civ-clone/base-unit-action-rules/lib/criteria/domain");
const criteria_2 = require("@civ-clone/base-unit-action-paradrop/lib/criteria");
const criteria_3 = require("@civ-clone/base-unit-action-sabotage-unit/lib/criteria");
const criteria_4 = require("@civ-clone/base-unit-action-transform-terrain/lib/criteria");
const unitTable_1 = require("../../lib/unitTable");
const Units_1 = require("../../Units");
/** The tile improvements that make a worked square a treaty partner's land. */
exports.territoryImprovements = [
    TileImprovements_1.Irrigation,
    TileImprovements_1.Mine,
    TileImprovements_1.Railroad,
    TileImprovements_1.Road,
];
/**
 * What a pillage takes, in the order the original takes it when no target is chosen (`unit_pillage`): farmland (leaving
 *  the irrigation), a mine or irrigation, a fortress or an airbase, the railroad, then the road.
 */
exports.pillageOrder = [
    TileImprovements_1.Farmland,
    TileImprovements_1.Mine,
    TileImprovements_1.Irrigation,
    TileImprovements_1.Fortress,
    TileImprovements_1.Airbase,
    TileImprovements_1.Railroad,
    TileImprovements_1.Road,
];
/** Partisans take the railroad, then the road, before anything else (`unit_pillage`). */
exports.partisanPillageOrder = [
    TileImprovements_1.Railroad,
    TileImprovements_1.Road,
    ...exports.pillageOrder.filter((Improvement) => Improvement !== TileImprovements_1.Railroad && Improvement !== TileImprovements_1.Road),
];
/** Whether `improvement` can be pillaged. */
const pillageable = (improvement) => exports.pillageOrder.some((Improvement) => improvement instanceof Improvement);
exports.pillageable = pillageable;
/** `criteria` less its last, which must be base-unit-action-rules' by-domain `Or`. */
const withoutDomainTest = (criteria) => {
    const last = criteria[criteria.length - 1];
    if (!(last instanceof Or_1.default)) {
        throw new TypeError("base-unit-action-rules' attack criteria no longer end with their by-domain test.");
    }
    return criteria.slice(0, -1);
};
exports.withoutDomainTest = withoutDomainTest;
// Each unit type's `@UNITS` row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
const rowOf = (unit) => rows.get(unit.constructor);
/**
 * Civilization II's unit actions, as base-unit-action-rules' `actionRules('civ2-unit', table)` with civ1-unit's
 *  criteria and Civ2's terrain, in the order a unit is offered them (the AI takes the first). There is no Senate, so no
 *  row is gated and no `overruled/` form is made: a treaty-breaking row is offered as it is. Of the Diplomat's and Spy's
 *  missions, only an embassy and an investigation are offered (Civ2's mission menu, `spy_city_mission_menu`, has no
 *  meeting outside network games); theft, sabotage, revolt and bribery, and the
 *  Caravan's and Freight's trade routes and help with a wonder, are M2a deviations.
 */
const getRules = ({ cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, cityNameRegistry = CityNameRegistry_1.instance, cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, interactionRegistry = InteractionRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, pendingEffectRegistry = PendingEffectRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, strategyRegistry = StrategyRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, turn = Turn_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, } = {}) => {
    const { landsInCity, landingTransport, canLandAircraft } = (0, landing_1.default)({
        cityRegistry,
        unitRegistry,
    }), 
    // The routes `goto` finds, kept for `road-to` and `railroad-to`, which come after it.
    routePlanner = new RoutePlanner_1.default({
        engine,
        pathFinderRegistry,
        ruleRegistry,
        strategyNoteRegistry,
    }), { atPeace, allPeaceExpired, allAtPeace, ownerPeaceExpired, peaceWithOwner, } = (0, peace_1.default)({ cityRegistry, interactionRegistry, unitRegistry }), 
    // Outside a city or an airbase, a stack with a bomber (an aircraft with a range above 1) can only be attacked by an
    //  interceptor, unless it has a carrier (`unit_move_dir_attack_unit`).
    bomberCover = new Criterion_1.default((unit, to) => {
        if (unit.hasTrait(Interceptor_1.default) ||
            (0, domain_1.tileHasCity)(to, cityRegistry) ||
            tileImprovementRegistry
                .getByTile(to)
                .some((improvement) => improvement instanceof TileImprovements_1.Airbase)) {
            return true;
        }
        const stack = unitRegistry.getByTile(to).map(rowOf);
        return (!stack.some((row) => (row === null || row === void 0 ? void 0 : row[1]) === units_1.AIR && row[3] > 1) ||
            stack.some((row) => { var _a; return (((_a = row === null || row === void 0 ? void 0 : row[12]) !== null && _a !== void 0 ? _a : 0) & units_1.CARRIES_AIR) !== 0; }));
    }), 
    // base-unit-action-rules' attack criteria up to its last, Civ1's by-domain test (a land unit only against a city
    //  or a land unit, an aircraft against an air-only stack only if it's an interceptor), which Civ2 doesn't have
    //  (`unit_move_dir_attack_unit`): what reaches a square may attack it, a land unit on land, a submarine only at
    //  sea, and any aircraft, but for `bomberCover`.
    attackCriteria = [
        ...(0, exports.withoutDomainTest)((0, attack_1.attackCriteria)({ cityRegistry, unitRegistry })),
        new Criterion_1.default((unit, to) => {
            const row = rowOf(unit);
            if (row === undefined || row[1] === units_1.AIR) {
                return true;
            }
            if (row[1] === units_1.LAND) {
                return to.isLand();
            }
            return !unit.hasTrait(Submerged_1.default) || to.isWater();
        }),
        bomberCover,
    ], 
    // A land unit or a Helicopter (an aircraft with no range) takes an empty city; ships and other aircraft can't
    //  (`unit_move_dir_enemy_city`).
    captureCityCriteria = (0, attack_1.captureCityCriteria)({
        cityRegistry,
        unitRegistry,
    }).map((criterion) => criterion === domain_2.isLandUnit
        ? new Or_1.default(domain_2.isLandUnit, new Criterion_1.default((unit) => {
            const row = rowOf(unit);
            return row !== undefined && row[1] === units_1.AIR && row[3] === 0;
        }))
        : criterion), { nuclearTargets, nuclearAttackCriteria, noNuclearTargetAtPeace, anyNuclearTargetAtPeace, } = (0, nuclear_1.default)({ cityRegistry, unitRegistry }, atPeace), partnerOf = (0, treatyPartner_1.default)(exports.territoryImprovements, {
        interactionRegistry,
        tileImprovementRegistry,
        workedTileRegistry,
    }), { movePartner, onPartnersLand, offPartnersLand, pillagingPartnersLand, notPillagingPartnersLand, } = (0, partners_1.default)({ unitRegistry }, partnerOf), pillageCriteria = (0, pillage_1.pillageCriteria)({ tileImprovementRegistry }, exports.pillageable), 
    // Building a fortress or an airbase: never in a city (`unit_terrain_work_finish` builds neither there).
    noCity = new Criterion_1.default((unit, to, from = unit.tile()) => !(0, domain_1.tileHasCity)(from, cityRegistry)), cityHasAirport = (city) => cityImprovementRegistry
        .getByCity(city)
        .some((improvement) => improvement instanceof Airport_1.default), 
    // Civ2's zones of control (`unit_move_dir_land_unit_checks`, `tile_in_enemy_zoc`, `tile_zoc_unit_adjacent`): a
    //  land unit that doesn't ignore them may not step from a square next to another player's unit to another such
    //  square. Any unit on land exerts one, whatever it is and whether or not its player is at peace (only an alliance,
    //  which M2a doesn't have, would stop it). A city's square, anyone's, is in no zone; nor is a move onto a square
    //  that holds units, or off a ship.
    moveCriteria = (0, move_1.default)({ cityRegistry, unitRegistry }, (0, zoneOfControl_1.default)(unitRegistry, {
        exemptMovers: [
            (unit) => !(0, traits_1.isA)(unit, Land_1.default),
            (unit) => unit.hasTrait(IgnoresZoneOfControl_1.default),
        ],
        exerts: (tileUnit, unit) => tileUnit.player() !== unit.player() && tileUnit.tile().isLand(),
        exemptMoves: [
            (unit, to) => unitRegistry.getByTile(to).length > 0,
            (unit, to, from = unit.tile()) => !from.isLand() ||
                (0, domain_1.tileHasCity)(from, cityRegistry) ||
                (0, domain_1.tileHasCity)(to, cityRegistry),
        ],
    })), 
    // A Diplomat's or Spy's missions to a rival's city, next to it with moves left and not from a ship. Theft and
    //  sabotage wait (M2a deviations); an embassy is once per civilization.
    { diplomatCriteria } = (0, diplomat_1.diplomat)({ cityRegistry }), hasNoEmbassy = (0, diplomat_1.hasNoEmbassy)({ cityRegistry, interactionRegistry }), { fortifyCriteria, sleepCriteria, activateCriteria, disbandCriteria, noOrdersCriteria, foundCityCriteria, joinCityCriteria, setHomeCityCriteria, exploreCriteria, automateCriteria, } = (0, orders_1.default)({ cityRegistry, ruleRegistry, unitImprovementRegistry }), { embarkCriteria, disembarkCriteria, unloadCriteria } = (0, transport_1.default)({
        transportRegistry,
        unitRegistry,
    }), hasRiver = (tile) => terrainFeatureRegistry
        .getByTerrain(tile.terrain())
        .some((feature) => feature instanceof TerrainFeatures_1.River), distant = new Criterion_1.default((unit, to, from) => to !== from && !to.isNeighbourOf(from));
    return (0, actionRules_1.default)('civ2-unit', [
        // The Diplomat's missions first, as civ1-unit's: a computer player takes the first action it's offered.
        {
            name: 'establish-embassy',
            criteria: [...diplomatCriteria, hasNoEmbassy],
            effect: (unit, to, from = unit.tile()) => new Actions_1.EstablishEmbassy(from, to, unit, cityRegistry.getByTile(to), ruleRegistry),
        },
        {
            name: 'investigate-city',
            criteria: [...diplomatCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.InvestigateCity(from, to, unit, cityRegistry.getByTile(to), ruleRegistry),
        },
        // A Spy's mission against another player's lone unit outside a city (`spy_unit_mission`): it loses half its hit
        //  points. A veteran Spy escapes at twice the odds, and an escaped one becomes a veteran (`spy_try_escape`).
        {
            name: 'sabotage-unit',
            criteria: [
                ...(0, criteria_3.default)({ cityRegistry, unitRegistry }, (unit) => unit.hasTrait(Covert_1.default)),
                allPeaceExpired,
            ],
            effect: (unit, to, from = unit.tile()) => new Actions_1.SabotageUnit(from, to, unit, ruleRegistry, unitRegistry, cityRegistry, undefined, {
                escapeOdds: (spy) => unitImprovementRegistry
                    .getByUnit(spy)
                    .some((improvement) => improvement instanceof Veteran_1.default)
                    ? 4
                    : 2,
                escaped: (spy) => {
                    if (!unitImprovementRegistry
                        .getByUnit(spy)
                        .some((improvement) => improvement instanceof Veteran_1.default)) {
                        unitImprovementRegistry.register(new Veteran_1.default(spy));
                    }
                },
            }),
        },
        // Before `move`, so it's the first action for a square an aircraft can land on.
        {
            name: 'land-aircraft',
            criteria: [
                Action_1.isNeighbouringTile,
                Action_1.hasMovesLeft,
                new Criterion_1.default((unit, to) => canLandAircraft(unit, to)),
                new Criterion_1.default((unit, to) => unitRegistry
                    .getByTile(to)
                    .every((tileUnit) => tileUnit.player() === unit.player())),
            ],
            effect: (unit, to, from = unit.tile()) => new Actions_1.LandAircraft(from, to, unit, landsInCity(unit, to) ? null : landingTransport(unit, to), ruleRegistry),
        },
        {
            name: 'move',
            criteria: [...moveCriteria, offPartnersLand],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Move(from, to, unit, ruleRegistry),
        },
        // Onto a treaty partner's land: it breaks the treaty. With no Senate in M2a, nothing overrules it.
        {
            name: 'sneak-move',
            criteria: [onPartnersLand, ...moveCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.SneakMove(from, to, unit, movePartner(unit, to, from), ruleRegistry),
        },
        {
            name: 'abort-move',
            criteria: [onPartnersLand, ...moveCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.AbortMove(from, to, unit, movePartner(unit, to, from), ruleRegistry),
        },
        // Civ1's resolver: base-unit-action-attack's `Attack`, with Civ2's strengths (`strength`).
        {
            name: 'attack',
            criteria: [...attackCriteria, allPeaceExpired],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Attack(from, to, unit, ruleRegistry, unitRegistry),
        },
        {
            name: 'sneak-attack',
            criteria: [...attackCriteria, allAtPeace],
            effect: (unit, to, from = unit.tile()) => {
                const [enemy] = unitRegistry
                    .getByTile(to)
                    .map((tileUnit) => tileUnit.player())
                    .filter((player) => interactionRegistry
                    .getByPlayers(unit.player(), player)
                    .some((interaction) => interaction instanceof Declarations_1.Peace && interaction.active()));
                return new Actions_1.SneakAttack(from, to, unit, enemy, ruleRegistry, unitRegistry);
            },
        },
        {
            name: 'nuclear-attack',
            criteria: [...nuclearAttackCriteria, noNuclearTargetAtPeace],
            effect: (unit, to, from = unit.tile()) => new Actions_1.NuclearAttack(from, to, unit, ruleRegistry),
        },
        {
            name: 'sneak-nuclear-attack',
            criteria: [...nuclearAttackCriteria, anyNuclearTargetAtPeace],
            effect: (unit, to, from = unit.tile()) => {
                const [enemy] = nuclearTargets(unit, to).filter((player) => atPeace(unit.player(), player));
                return new Actions_1.SneakNuclearAttack(from, to, unit, enemy, ruleRegistry);
            },
        },
        {
            name: 'capture-city',
            criteria: [...captureCityCriteria, ownerPeaceExpired],
            effect: (unit, to, from = unit.tile()) => new Actions_1.CaptureCity(from, to, unit, cityRegistry.getByTile(to), ruleRegistry),
        },
        {
            name: 'sneak-capture-city',
            criteria: [...captureCityCriteria, peaceWithOwner],
            effect: (unit, to, from = unit.tile()) => {
                const city = cityRegistry.getByTile(to);
                return new Actions_1.SneakCaptureCity(from, to, unit, city, city.player(), ruleRegistry);
            },
        },
        // Paratroopers from a city or an airbase, with no moves used, onto land within @COSMIC's range by `map_distance`
        //  with no other player's unit on it, and not into the city of a player at peace (`unit_cmd_paradrop`,
        //  `unit_paradrop`; the original asks a human to confirm that, and has a computer player give up).
        {
            name: 'paradrop',
            criteria: [
                ...(0, criteria_2.default)({ unitImprovementRegistry, unitRegistry }, {
                    canParadrop: (unit) => unit.hasTrait(Paradrop_1.default),
                    canDropFrom: (unit, from) => (0, domain_1.tileHasCity)(from, cityRegistry) ||
                        tileImprovementRegistry
                            .getByTile(from)
                            .some((improvement) => improvement instanceof TileImprovements_1.Airbase),
                    range: cosmic_1.cosmic.paradropRange,
                    distance: distance_1.default,
                    hasFullMoves: criteria_2.hasFullMoves,
                }),
                new Criterion_1.default((unit, to, from = unit.tile()) => {
                    const city = cityRegistry.getByTile(to);
                    return (city === null ||
                        city.player() === unit.player() ||
                        !peaceWithOwner.validate(unit, to, from));
                }),
            ],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Paradrop(from, to, unit, ruleRegistry, cityRegistry, unitImprovementRegistry),
        },
        // A land unit between two of its player's cities with an Airport, each airlifting once a turn
        //  (`unit_cmd_airlift`, `unit_airlift_perform`).
        {
            name: 'airlift',
            criteria: (0, criteria_1.default)({ cityRegistry, pendingEffectRegistry, turn }, {
                canAirlift: (unit) => { var _a; return ((_a = rowOf(unit)) === null || _a === void 0 ? void 0 : _a[1]) === units_1.LAND; },
                canAirliftFrom: cityHasAirport,
            }),
            effect: (unit, to, from = unit.tile()) => new Actions_1.Airlift(from, to, unit, ruleRegistry, cityRegistry, pendingEffectRegistry, turn),
        },
        {
            name: 'pillage',
            criteria: [...pillageCriteria, notPillagingPartnersLand],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Pillage(from, to, unit, ruleRegistry, tileImprovementRegistry, turn),
        },
        {
            name: 'sneak-pillage',
            criteria: [...pillageCriteria, pillagingPartnersLand],
            effect: (unit, to, from = unit.tile()) => new Actions_1.SneakPillage(from, to, unit, partnerOf(unit, to), ruleRegistry, tileImprovementRegistry, turn),
        },
        {
            name: 'fortify',
            criteria: [...fortifyCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Fortify(from, to, unit, ruleRegistry, turn, unitImprovementRegistry),
        },
        {
            name: 'sleep',
            criteria: [...sleepCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Sleep(from, to, unit, ruleRegistry, turn),
        },
        {
            name: 'activate',
            criteria: [...activateCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Activate(from, to, unit, ruleRegistry),
        },
        {
            name: 'disband',
            criteria: [...disbandCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Disband(from, to, unit, ruleRegistry),
        },
        {
            name: 'no-orders',
            criteria: [...noOrdersCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.NoOrders(from, to, unit, ruleRegistry),
        },
        {
            name: 'found-city',
            criteria: [...foundCityCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.FoundCity(from, to, unit, cityNameRegistry, ruleRegistry, workedTileRegistry),
        },
        {
            name: 'join-city',
            criteria: [...joinCityCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.JoinCity(from, to, unit, (0, joinableCity_1.joinableCity)(unit, from, cityRegistry, ruleRegistry), ruleRegistry, cityGrowthRegistry),
        },
        // The improvements a unit builds, each with the action that builds it and what else it needs. Which terrain may
        //  have which is civ2-world's (`@TERRAIN`).
        ...[
            [
                TileImprovements_1.Irrigation,
                Actions_1.BuildIrrigation,
                // Water nearby: a river on the square or beside it, the sea beside it, or irrigated land beside it that
                //  isn't a city. civ1-unit's test with civ2-world's River feature; Civ2's own adjacency is not checked.
                new Or_1.default(new Criterion_1.default((unit, to, from = unit.tile()) => hasRiver(from)), new Criterion_1.default((unit, to, from = unit.tile()) => from
                    .getAdjacent()
                    .some((tile) => hasRiver(tile) ||
                    tile.terrain() instanceof Types_1.Water ||
                    (tileImprovementRegistry
                        .getByTile(tile)
                        .some((improvement) => improvement instanceof TileImprovements_1.Irrigation) &&
                        !(0, domain_1.tileHasCity)(tile, cityRegistry))))),
            ],
            [TileImprovements_1.Mine, Actions_1.BuildMine],
            [TileImprovements_1.Road, Actions_1.BuildRoad],
            [
                TileImprovements_1.Railroad,
                Actions_1.BuildRailroad,
                (0, worker_1.requiresImprovement)({ tileImprovementRegistry }, TileImprovements_1.Road),
            ],
            [TileImprovements_1.Fortress, Actions_1.BuildFortress, noCity],
            [TileImprovements_1.Airbase, Actions_1.BuildAirbase, noCity],
        ].map(([Improvement, ActionType, ...extra]) => ({
            improvement: Improvement,
            extra,
            effect: (unit, to, from = unit.tile()) => new ActionType(from, to, unit, ruleRegistry, turn),
        })),
        // The terrain each conversion changes: `@TERRAIN`'s irrigate and mine results that change the terrain
        //  (`tests/conversions` checks them against civ2-world's table).
        ...[
            [Actions_1.ClearJungle, Terrains_1.Jungle],
            [Actions_1.ClearForest, Terrains_1.Forest],
            [Actions_1.PlantForest, Terrains_1.Plains, Terrains_1.Grassland, Terrains_1.Jungle, Terrains_1.Swamp],
            [Actions_1.ClearSwamp, Terrains_1.Swamp],
        ].map(([ActionType, ...terrains]) => ({
            conversion: ActionType,
            terrains,
            effect: (unit, to, from = unit.tile()) => new ActionType(from, to, unit, ruleRegistry, terrainFeatureRegistry, turn),
        })),
        // Engineers transform their square's terrain, to what civ2-world's `TerrainConversion` rules say.
        {
            name: 'transform-terrain',
            criteria: (0, criteria_4.default)({ ruleRegistry }, (unit) => unit instanceof Units_1.Engineer),
            effect: (unit, to, from = unit.tile()) => new Actions_1.TransformTerrain(from, to, unit, ruleRegistry, turn),
        },
        {
            name: 'clean-pollution',
            criteria: (0, worker_1.cleanPollution)({ tileImprovementRegistry }, TileImprovements_1.Pollution),
            effect: (unit, to, from = unit.tile()) => new Actions_1.CleanPollution(from, to, unit, ruleRegistry, tileImprovementRegistry, turn),
        },
        {
            name: 'embark',
            criteria: [...embarkCriteria],
            effect: (unit, to, from = unit.tile()) => {
                const [carrier] = unitRegistry
                    .getByTile(to)
                    .filter((tileUnit) => tileUnit instanceof NavalTransport_1.default &&
                    tileUnit.hasCapacity() &&
                    tileUnit.canStow(unit));
                return new Actions_1.Embark(from, to, unit, carrier, ruleRegistry);
            },
        },
        {
            name: 'disembark',
            criteria: [...disembarkCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Disembark(from, to, unit, transportRegistry.getByUnit(unit).transport(), ruleRegistry),
        },
        {
            name: 'unload',
            criteria: [...unloadCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Unload(from, to, unit, ruleRegistry),
        },
        // Before `road-to` and `railroad-to`, which reuse the route it finds.
        {
            name: 'goto',
            criteria: [Action_1.hasMovesLeft, distant, routePlanner.goTo()],
            effect: routePlanner.goToEffect(Actions_1.GoTo),
        },
        ...[
            [Actions_1.RoadTo, 'road-to'],
            [Actions_1.RailroadTo, 'railroad-to'],
        ].map(([RouteAction, name]) => ({
            name,
            criteria: [
                Action_1.hasMovesLeft,
                distant,
                new Criterion_1.default((unit) => (0, routeOrders_1.default)(unit, playerResearchRegistry).includes(RouteAction)),
                routePlanner.route(),
            ],
            effect: routePlanner.routeEffect(RouteAction),
        })),
        {
            name: 'set-home-city',
            criteria: [...setHomeCityCriteria],
            effect: (unit, to, from) => new Actions_1.SetHomeCity(from, to, unit, ruleRegistry, cityRegistry),
        },
        {
            name: 'explore',
            criteria: [...exploreCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Explore(from, to, unit, ruleRegistry, strategyRegistry, strategyNoteRegistry, { pathFinderRegistry, unitRegistry }),
        },
        {
            name: 'automate',
            criteria: [...automateCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Automate(from, to, unit, ruleRegistry, strategyRegistry, strategyNoteRegistry, { pathFinderRegistry, unitRegistry }),
        },
    ], { ruleRegistry });
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=action.js.map