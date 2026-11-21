"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.AIRLIFT_ACTION_RULE = exports.ALLIED_REPAIR_ACTION_RULE = exports.treatyPartnerOf = exports.withoutDomainTest = exports.pillageable = exports.partisanPillageOrder = exports.pillageOrder = exports.territoryImprovements = void 0;
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
const Description_1 = require("@civ-clone/core-rule/Description");
const IgnoresZoneOfControl_1 = require("@civ-clone/base-unit-trait-ignores-zone-of-control/IgnoresZoneOfControl");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const NavalTransport_1 = require("@civ-clone/base-unit-type-naval-transport/NavalTransport");
const Or_1 = require("@civ-clone/core-rule/Criteria/Or");
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const Barracks_1 = require("@civ-clone/base-city-improvement-barracks/Barracks");
const RequirementRegistry_1 = require("@civ-clone/core-requirement/RequirementRegistry");
const WonderRegistry_1 = require("@civ-clone/core-wonder/WonderRegistry");
const senate_1 = require("@civ-clone/base-government-senate/lib/senate");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Contact_1 = require("@civ-clone/base-diplomacy-interaction-contact/Contact");
const Detonates_1 = require("@civ-clone/base-unit-trait-detonates/Detonates");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const treatyLevel_2 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const forcedWar_1 = require("./forcedWar");
const nearestCity_1 = require("../../lib/nearestCity");
const TerrainFeatures_1 = require("@civ-clone/civ2-world/TerrainFeatures");
const RoutePlanner_1 = require("@civ-clone/base-unit-action-rules/lib/RoutePlanner");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const Types_1 = require("@civ-clone/core-terrain/Types");
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
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerRegistry_1 = require("@civ-clone/core-player/PlayerRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const escape_1 = require("@civ-clone/base-unit-agent/lib/escape");
const core_random_1 = require("@civ-clone/core-random");
const manhattanProject_1 = require("../../lib/manhattanProject");
const espionage_1 = require("../../lib/espionage");
const missions_1 = require("./missions");
const AlliedRepair_1 = require("../../lib/AlliedRepair");
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
/**
 * Whose land a square is among a unit's treaty partners (base-unit-lifecycle's `treatyPartner`, on
 *  `territoryImprovements`), but never an ally's: moving onto or pillaging an ally's land breaks no treaty.
 */
const treatyPartnerOf = (dependencies) => {
    const partner = (0, treatyPartner_1.default)(exports.territoryImprovements, dependencies);
    return (unit, tile) => {
        const player = partner(unit, tile);
        return player === null ||
            (0, treatyLevel_1.hasTreatyLevel)(dependencies, unit.player(), player, treatyLevel_1.TreatyLevel.Alliance)
            ? null
            : player;
    };
};
exports.treatyPartnerOf = treatyPartnerOf;
// Each unit type's `@UNITS` row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
const rowOf = (unit) => rows.get(unit.constructor);
/**
 * Civilization II's unit actions, as base-unit-action-rules' `actionRules('civ2-unit', table)` with civ1-unit's
 *  criteria and Civ2's terrain, in the order a unit is offered them (the AI takes the first). A row that breaks a
 *  treaty (a ceasefire, a peace or an alliance) is gated by the player's Senate (`SenateIntervenes`, which
 *  civ2-diplomacy answers): when it intervenes, the row's `overruled/` form is offered instead (`diplo_confirm_attack`).
 *  An ally is never attacked, its units exert no zone of control, and a unit moving onto its city is repaired there
 *  (`allied-repair`). The Diplomat's and Spy's missions and the Caravan's trade route come first (`Rules/Unit/missions`;
 *  Civ2's mission menu, `spy_city_mission_menu`, has no meeting: its option 7, `unit_spy.cpp:211-218`, is a
 *  multiplayer game's chat spying, and talks open from the client). Help with a wonder is civ2-wonder's.
 */
/** The rule that repairs a land unit moving onto an ally's city, more with Barracks. */
exports.ALLIED_REPAIR_ACTION_RULE = (0, actionRules_1.actionId)('civ2-unit', 'allied-repair');
/** The rule that airlifts a land unit between two cities with an Airport. */
exports.AIRLIFT_ACTION_RULE = (0, actionRules_1.actionId)('civ2-unit', 'airlift');
const getRules = ({ cityGrowthRegistry = CityGrowthRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, cityNameRegistry = CityNameRegistry_1.instance, cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, interactionRegistry = InteractionRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, pendingEffectRegistry = PendingEffectRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerRegistry = PlayerRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, randomNumberGenerator = core_random_1.instance, requirementRegistry = RequirementRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, strategyRegistry = StrategyRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, turn = Turn_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, wonderRegistry = WonderRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, manhattanProjectBuilt = (0, manhattanProject_1.default)(wonderRegistry, cityImprovementRegistry), } = {}) => {
    // Allies (`TREATY_ALLIANCE`): one can't attack the other (`diplo_confirm_attack`), its units exert no zone of control
    //  on the other's (`tile_zoc_unit_adjacent`), and its land is no treaty partner's to trespass on.
    const allied = (player, other) => player !== other &&
        (0, treatyLevel_1.hasTreatyLevel)({ interactionRegistry }, player, other, treatyLevel_1.TreatyLevel.Alliance), noAllyOnTile = new Criterion_1.default((unit, to) => {
        const city = cityRegistry.getByTile(to);
        return ((city === null || !allied(unit.player(), city.player())) &&
            unitRegistry
                .getByTile(to)
                .every((tileUnit) => !allied(unit.player(), tileUnit.player())));
    }), 
    // A row that breaks a treaty: a player whose Senate intervenes (`SenateIntervenes`) is offered its `overruled/`
    //  form instead, which performs an `Overruled` spending `cost` (`diplo_confirm_attack`).
    breaksTreaty = (row, cost, blocked = row.effect) => ({
        ...row,
        breaksTreaty: { blocked, cost },
    }), 
    // What a blocked attack costs: a move, spent before the Senate is asked (`unit_combat.cpp:1521-1523`).
    attackCost = () => 1, 
    // The owner of the city nearest a pillaged square (the pillage command's `city_find_nearest`), or, for any other
    //  square, the treaty partner whose land it is.
    pillagedOrPartner = (unit, to) => {
        var _a, _b;
        return to === unit.tile()
            ? (_b = (_a = (0, nearestCity_1.default)(cityRegistry, to)) === null || _a === void 0 ? void 0 : _a.player()) !== null && _b !== void 0 ? _b : null
            : partnerOf(unit, to);
    }, 
    // The other players with units on `to`.
    ownersOn = (unit, to) => Array.from(new Set(unitRegistry
        .getByTile(to)
        .map((tileUnit) => tileUnit.player())
        .filter((player) => player !== unit.player())));
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
        : criterion), { nuclearTargets, nuclearAttackCriteria, noNuclearTargetAtPeace, anyNuclearTargetAtPeace, } = (0, nuclear_1.default)({ cityRegistry, unitRegistry }, atPeace), partnerOf = (0, exports.treatyPartnerOf)({
        interactionRegistry,
        tileImprovementRegistry,
        workedTileRegistry,
    }), 
    // Not an ally's worked land: pillaging there is refused (`unit_pillage` asks `diplo_confirm_attack`, which refuses
    //  an ally), where moving onto it is free.
    notAlliesLand = ((partner = (0, treatyPartner_1.default)(exports.territoryImprovements, {
        interactionRegistry,
        tileImprovementRegistry,
        workedTileRegistry,
    })) => new Criterion_1.default((unit, to) => {
        const player = partner(unit, to);
        return player === null || !allied(unit.player(), player);
    }))(), { movePartner, onPartnersLand, offPartnersLand, pillagingPartnersLand, notPillagingPartnersLand, } = (0, partners_1.default)({ unitRegistry }, partnerOf), pillageCriteria = (0, pillage_1.pillageCriteria)({ tileImprovementRegistry }, exports.pillageable), 
    // Building a fortress or an airbase: never in a city (`unit_terrain_work_finish` builds neither there).
    noCity = new Criterion_1.default((unit, to, from = unit.tile()) => !(0, domain_1.tileHasCity)(from, cityRegistry)), cityHasAirport = (city) => cityImprovementRegistry
        .getByCity(city)
        .some((improvement) => improvement instanceof Airport_1.default), 
    // Civ2's zones of control (`unit_move_dir_land_unit_checks`, `tile_in_enemy_zoc`, `tile_zoc_unit_adjacent`): a
    //  land unit that doesn't ignore them may not step from a square next to another player's unit to another such
    //  square. Any unit on land exerts one, whatever it is and whether or not its player is at peace, but an ally's
    //  (`tile_zoc_unit_adjacent` skips `TREATY_ALLIANCE`). A city's square, anyone's, is in no zone; nor is a move onto a square
    //  that holds units, or off a ship.
    moveCriteria = (0, move_1.default)({ cityRegistry, unitRegistry }, (0, zoneOfControl_1.default)(unitRegistry, {
        exemptMovers: [
            (unit) => !(0, traits_1.isA)(unit, Land_1.default),
            (unit) => unit.hasTrait(IgnoresZoneOfControl_1.default),
        ],
        exerts: (tileUnit, unit) => tileUnit.player() !== unit.player() &&
            tileUnit.tile().isLand() &&
            !allied(unit.player(), tileUnit.player()),
        exemptMoves: [
            (unit, to) => unitRegistry.getByTile(to).length > 0,
            (unit, to, from = unit.tile()) => !from.isLand() ||
                (0, domain_1.tileHasCity)(from, cityRegistry) ||
                (0, domain_1.tileHasCity)(to, cityRegistry),
        ],
    })), 
    // The Diplomat's and Spy's missions, and the Caravan's trade route.
    missions = (0, missions_1.default)({
        cityGrowthRegistry,
        cityImprovementRegistry,
        cityRegistry,
        clientRegistry,
        interactionRegistry,
        manhattanProjectBuilt,
        pendingEffectRegistry,
        playerGovernmentRegistry,
        playerRegistry,
        playerResearchRegistry,
        playerTreasuryRegistry,
        requirementRegistry,
        ruleRegistry,
        turn,
        unitImprovementRegistry,
        unitRegistry,
        wonderRegistry,
    }), 
    // The owner of the city on `to`.
    cityOwner = (to) => { var _a, _b; return (_b = (_a = cityRegistry.getByTile(to)) === null || _a === void 0 ? void 0 : _a.player()) !== null && _b !== void 0 ? _b : null; }, { fortifyCriteria, sleepCriteria, activateCriteria, disbandCriteria, noOrdersCriteria, foundCityCriteria, joinCityCriteria, setHomeCityCriteria, exploreCriteria, automateCriteria, } = (0, orders_1.default)({ cityRegistry, ruleRegistry, unitImprovementRegistry }), { embarkCriteria, disembarkCriteria, unloadCriteria } = (0, transport_1.default)({
        transportRegistry,
        unitRegistry,
    }), hasRiver = (tile) => terrainFeatureRegistry
        .getByTerrain(tile.terrain())
        .some((feature) => feature instanceof TerrainFeatures_1.River), distant = new Criterion_1.default((unit, to, from) => to !== from && !to.isNeighbourOf(from));
    return (0, actionRules_1.default)('civ2-unit', [
        // The Diplomat's and Spy's missions on a city first (`Rules/Unit/missions`): a computer player takes the first
        //  action it's offered, and the original's computers steal by default (`spy_city_mission_ai_choice`).
        ...missions.city,
        // Against another player's lone unit outside a city (`spy_unit_mission`): a bribe, which any Diplomat or Spy is
        //  offered, then, for a person's Spy, sabotage: the unit loses half its hit points. A veteran Spy escapes at twice
        //  the odds, and an escaped one becomes a veteran (`spy_try_escape`).
        missions.bribe,
        {
            name: 'sabotage-unit',
            criteria: [
                ...(0, criteria_3.default)({ cityRegistry, unitRegistry }, (unit) => unit.hasTrait(Covert_1.default)),
                new Criterion_1.default((unit) => (0, isHuman_1.default)(unit.player(), clientRegistry)),
            ],
            effect: (unit, to, from = unit.tile()) => new Actions_1.SabotageUnit(from, to, unit, ruleRegistry, unitRegistry, cityRegistry, randomNumberGenerator, {
                escapeOdds: (spy, mode) => (0, escape_1.escapeOdds)(mode, (0, espionage_1.isVeteran)(spy, unitImprovementRegistry)),
                escaped: (spy) => {
                    if (!(0, espionage_1.isVeteran)(spy, unitImprovementRegistry)) {
                        unitImprovementRegistry.register(new Veteran_1.default(spy));
                    }
                    // Off any ship it was aboard (base-unit-agent's `escape` unloads it from its default transport
                    //  registry, which a game of its own doesn't use; SabotageUnit doesn't pass the game's on).
                    if (transportRegistry.hasUnit(spy)) {
                        transportRegistry.getByUnit(spy).transport().unload(spy);
                        spy.setBusy();
                    }
                },
            }),
        },
        // A Caravan's or Freight's trade route, before `move`, so a computer's sets it up on arrival, as the original's
        //  does (`unit_caravan_enter_city`); `move` is still offered into its own cities, so a person can keep moving.
        //  What the route is worth is civ2-city's `TradeRouteEstablished` rule.
        missions.tradeRoute,
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
        // A land unit onto an ally's city: it doesn't go in, but is repaired a tenth of its hit points (a fifth if the city
        //  has Barracks), at most its damage, and its turn ends (`unit_move_dir_land_unit_checks`,
        //  `unit_move.cpp:803-830`). Not a Diplomat, a Spy, a Caravan or Freight, whose own moves into a city come first
        //  (`unit_move.cpp:778-800`), nor a ship or an aircraft, which don't reach it.
        {
            name: 'allied-repair',
            criteria: [
                Action_1.isNeighbouringTile,
                Action_1.hasMovesLeft,
                new Criterion_1.default((unit) => {
                    const row = rowOf(unit);
                    return (row !== undefined &&
                        row[1] === units_1.LAND &&
                        row[10] !== units_1.DIPLOMACY &&
                        row[10] !== units_1.TRADE);
                }),
                new Criterion_1.default((unit, to) => {
                    const owner = cityOwner(to);
                    return owner !== null && allied(unit.player(), owner);
                }),
                // What Barracks do for an ally's units, for the Civilopedia (civ-clone/web-renderer#1291), among the criteria
                //  as the airlift row's is.
                new Description_1.default({
                    type: 'repairs_allies',
                    subject: Barracks_1.default,
                    value: AlliedRepair_1.BARRACKS_REPAIR_STEPS,
                }),
            ],
            effect: (unit, to, from = unit.tile()) => new Actions_1.AlliedRepair(from, to, unit, cityRegistry.getByTile(to), cityImprovementRegistry
                .getByCity(cityRegistry.getByTile(to))
                .some((improvement) => improvement instanceof Barracks_1.default)
                ? AlliedRepair_1.BARRACKS_REPAIR_STEPS
                : AlliedRepair_1.REPAIR_STEPS, unitImprovementRegistry, ruleRegistry),
        },
        {
            name: 'move',
            criteria: [...moveCriteria, offPartnersLand],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Move(from, to, unit, ruleRegistry),
        },
        // Onto a treaty partner's land: it breaks the treaty, unless the player's Senate overrules it, which spends the
        //  move's cost as civ1-unit's does.
        breaksTreaty({
            name: 'sneak-move',
            criteria: [onPartnersLand, ...moveCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.SneakMove(from, to, unit, movePartner(unit, to, from), ruleRegistry),
        }, (unit, to, from) => new Actions_1.Move(from, to, unit, ruleRegistry).movementCost()),
        {
            name: 'abort-move',
            criteria: [onPartnersLand, ...moveCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.AbortMove(from, to, unit, movePartner(unit, to, from), ruleRegistry),
        },
        // Civ1's resolver: base-unit-action-attack's `Attack`, with Civ2's strengths (`strength`).
        breaksTreaty({
            name: 'attack',
            criteria: [...attackCriteria, allPeaceExpired],
            effect: (unit, to, from = unit.tile()) => (0, forcedWar_1.recordTargets)(new Actions_1.Attack(from, to, unit, ruleRegistry, unitRegistry), ownersOn(unit, to)),
        }, 
        // A person attacking a player it has met and isn't at war with: the Senate may stop it (`diplo_confirm_attack`,
        //  `unit_combat.cpp:1525`), which is offered as a blocked `UndeclaredAttack`, so a client can tell it from
        //  breaking a treaty.
        attackCost, (unit, to, from) => new Actions_1.UndeclaredAttack(from, to, unit, ownersOn(unit, to)[0], ruleRegistry, unitRegistry)),
        // Across a treaty: never against an ally (`diplo_confirm_attack`), and the player's Senate may overrule it.
        breaksTreaty({
            name: 'sneak-attack',
            criteria: [...attackCriteria, allAtPeace, noAllyOnTile],
            effect: (unit, to, from = unit.tile()) => {
                // The treaty partner the attack breaks with: a ceasefire counts, as a peace does (`atPeace`).
                const [enemy] = unitRegistry
                    .getByTile(to)
                    .map((tileUnit) => tileUnit.player())
                    .filter((player) => atPeace(unit.player(), player));
                return (0, forcedWar_1.recordTargets)(new Actions_1.SneakAttack(from, to, unit, enemy, ruleRegistry, unitRegistry), ownersOn(unit, to));
            },
        }, attackCost),
        breaksTreaty({
            name: 'nuclear-attack',
            criteria: [...nuclearAttackCriteria, noNuclearTargetAtPeace],
            effect: (unit, to, from = unit.tile()) => 
            // Only the owners of the units there are attacked: one on an empty city is no battle, and starts no war
            //  (`unit_move.cpp:1086` goes straight to `unit_nuclear_attack`).
            (0, forcedWar_1.recordTargets)(new Actions_1.NuclearAttack(from, to, unit, ruleRegistry), ownersOn(unit, to)),
        }, attackCost, (unit, to, from) => new Actions_1.UndeclaredNuclearAttack(from, to, unit, ownersOn(unit, to)[0], ruleRegistry)),
        breaksTreaty({
            name: 'sneak-nuclear-attack',
            criteria: [
                ...nuclearAttackCriteria,
                anyNuclearTargetAtPeace,
                new Criterion_1.default((unit, to) => nuclearTargets(unit, to).every((player) => !allied(unit.player(), player))),
            ],
            effect: (unit, to, from = unit.tile()) => {
                const [enemy] = nuclearTargets(unit, to).filter((player) => atPeace(unit.player(), player));
                return (0, forcedWar_1.recordTargets)(new Actions_1.SneakNuclearAttack(from, to, unit, enemy, ruleRegistry), ownersOn(unit, to));
            },
        }, attackCost),
        // With no treaty, the Senate isn't asked: entering a city asks only across a ceasefire, a peace or an alliance
        //  (`diplo_confirm_attack`'s mask 0xe, `unit_move.cpp:1099-1106`).
        {
            name: 'capture-city',
            criteria: [...captureCityCriteria, ownerPeaceExpired],
            effect: (unit, to, from = unit.tile()) => new Actions_1.CaptureCity(from, to, unit, cityRegistry.getByTile(to), ruleRegistry),
        },
        // Across a treaty, a person only: a computer player's unit stops short (`unit_move.cpp:1099-1103`).
        breaksTreaty({
            name: 'sneak-capture-city',
            criteria: [
                ...captureCityCriteria,
                peaceWithOwner,
                noAllyOnTile,
                new Criterion_1.default((unit) => (0, isHuman_1.default)(unit.player(), clientRegistry)),
            ],
            effect: (unit, to, from = unit.tile()) => {
                const city = cityRegistry.getByTile(to);
                return new Actions_1.SneakCaptureCity(from, to, unit, city, city.player(), ruleRegistry);
            },
        }),
        // Paratroopers from a city or an airbase, with no moves used, onto land within @COSMIC's range by `map_distance`
        //  with no other player's unit on it, and not into the city of a player with a treaty (`unit_cmd_paradrop`,
        //  `unit_paradrop`). The original lets a person drop there, asking it to confirm and its Senate
        //  (`unit.cpp:2305-2316`), and has a computer player give up; here no one may (a deviation).
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
            criteria: [
                ...(0, criteria_1.default)({ cityRegistry, pendingEffectRegistry, turn }, {
                    canAirlift: (unit) => { var _a; return ((_a = rowOf(unit)) === null || _a === void 0 ? void 0 : _a[1]) === units_1.LAND; },
                    canAirliftFrom: cityHasAirport,
                }),
                // What an Airport does, for the Civilopedia (civ-clone/web-renderer#1196). base-unit-action-rules hands a
                //  row's criteria to the rule as they are, and a rule takes a `Description` among them, though the row's
                //  type lists only criteria.
                new Description_1.default({
                    type: 'airlift',
                    subject: Airport_1.default,
                    unit: Land_1.default,
                }),
            ],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Airlift(from, to, unit, ruleRegistry, cityRegistry, pendingEffectRegistry, turn),
        },
        // A person's Senate is asked when the nearest city's owner has a treaty with it (`unit.cpp:2985-2998`, mask 0xe).
        breaksTreaty({
            name: 'pillage',
            criteria: [
                ...pillageCriteria,
                notPillagingPartnersLand,
                notAlliesLand,
            ],
            effect: (unit, to, from = unit.tile()) => new Actions_1.Pillage(from, to, unit, ruleRegistry, tileImprovementRegistry, turn),
        }, undefined, (unit, to, from) => new Actions_1.SneakPillage(from, to, unit, (0, nearestCity_1.default)(cityRegistry, to).player(), ruleRegistry, tileImprovementRegistry, turn)),
        breaksTreaty({
            name: 'sneak-pillage',
            criteria: [...pillageCriteria, pillagingPartnersLand],
            effect: (unit, to, from = unit.tile()) => new Actions_1.SneakPillage(from, to, unit, partnerOf(unit, to), ruleRegistry, tileImprovementRegistry, turn),
        }),
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
            // The irrigation order on an irrigated square (`unit_cmd_terraform` order 6): civ2-world's `Available` rule
            //  holds the rest (Refrigeration, water, no city, not farmland already). Irrigation is offered only where
            //  there is none, so a unit is never offered both; a client puts this under the irrigation key.
            [
                TileImprovements_1.Farmland,
                Actions_1.BuildFarmland,
                (0, worker_1.requiresImprovement)({ tileImprovementRegistry }, TileImprovements_1.Irrigation),
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
    ], {
        ruleRegistry,
        // The treaty partner is the owner of the city or units on the target square, or else the player whose worked
        //  land it is. Civ2's Senate (civ2-diplomacy's `SenateIntervenes` rule) reads who it is.
        //  Only a person's is asked. Across a ceasefire, a peace or an alliance it is always asked (mask 0xe: a capture, a
        //  pillage, a move); a pillage asks about the owner of the nearest city. In a battle it is also asked when
        //  attacking a player the person has met and isn't at war with (`diplo_confirm_attack`'s mask 0xd,
        //  `unit_combat.cpp:1524-1525`); at war, never.
        hasSenate: (player, other, unit, to) => {
            // Only a person's Senate is asked: the original asks at each of these only for a person
            //  (`unit_combat.cpp:1524`, `unit_move.cpp:1100`, `unit.cpp:1895`, `unit.cpp:2305`).
            if (!(0, isHuman_1.default)(player, clientRegistry)) {
                return false;
            }
            const partner = other !== null && other !== void 0 ? other : pillagedOrPartner(unit, to);
            if (partner === null || partner === player) {
                return false;
            }
            const level = (0, treatyLevel_2.treatyLevel)({ interactionRegistry }, player, partner), 
            // A battle: another player's units on the square. A nuclear attack on an empty city is none, and isn't
            //  asked about (`unit_move.cpp:1086` → `unit_nuclear_attack`).
            battle = ownersOn(unit, to).length > 0;
            if (unit.hasTrait(Detonates_1.default) && !battle) {
                return false;
            }
            if (level < treatyLevel_1.TreatyLevel.Ceasefire &&
                (!battle ||
                    level === treatyLevel_1.TreatyLevel.War ||
                    !interactionRegistry
                        .getByPlayers(player, partner)
                        .some((interaction) => interaction instanceof Contact_1.default))) {
                return false;
            }
            return (0, senate_1.default)(player, partner, { reason: 'break-treaty' }, ruleRegistry);
        },
        cityRegistry,
        unitRegistry,
    });
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=action.js.map