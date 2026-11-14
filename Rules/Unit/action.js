"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.territoryImprovements = void 0;
const Actions_1 = require("../../Actions");
const Action_1 = require("@civ-clone/core-unit/Rules/Action");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityNameRegistry_1 = require("@civ-clone/core-civilization/CityNameRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const Terrains_1 = require("@civ-clone/civ2-world/Terrains");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
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
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const IgnoresZoneOfControl_1 = require("@civ-clone/base-unit-trait-ignores-zone-of-control/IgnoresZoneOfControl");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const NavalTransport_1 = require("@civ-clone/base-unit-type-naval-transport/NavalTransport");
const Or_1 = require("@civ-clone/core-rule/Criteria/Or");
const Declarations_1 = require("@civ-clone/library-diplomacy/Declarations");
const TerrainFeatures_1 = require("@civ-clone/civ2-world/TerrainFeatures");
const RoutePlanner_1 = require("@civ-clone/base-unit-action-rules/lib/RoutePlanner");
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
/** The tile improvements that make a worked square a treaty partner's land, and that pillage takes. */
exports.territoryImprovements = [
    TileImprovements_1.Irrigation,
    TileImprovements_1.Mine,
    TileImprovements_1.Railroad,
    TileImprovements_1.Road,
];
/**
 * Civilization II's unit actions, as base-unit-action-rules' `actionRules('civ2-unit', table)` with civ1-unit's
 *  criteria and Civ2's terrain, in the order a unit is offered them (the AI takes the first). There is no Senate, so no
 *  row is gated and no `overruled/` form is made: a treaty-breaking row is offered as it is. Of the Diplomat's and Spy's
 *  missions, only an embassy, an investigation and a meeting are offered; theft, sabotage, revolt and bribery, and the
 *  Caravan's and Freight's trade routes and help with a wonder, are M2a deviations.
 */
const getRules = ({ cityGrowthRegistry = CityGrowthRegistry_1.instance, cityNameRegistry = CityNameRegistry_1.instance, cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, interactionRegistry = InteractionRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, strategyRegistry = StrategyRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, turn = Turn_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, } = {}) => {
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
    }), { atPeace, allPeaceExpired, allAtPeace, ownerPeaceExpired, peaceWithOwner, } = (0, peace_1.default)({ cityRegistry, interactionRegistry, unitRegistry }), attackCriteria = (0, attack_1.attackCriteria)({ cityRegistry, unitRegistry }), captureCityCriteria = (0, attack_1.captureCityCriteria)({
        cityRegistry,
        unitRegistry,
    }), { nuclearTargets, nuclearAttackCriteria, noNuclearTargetAtPeace, anyNuclearTargetAtPeace, } = (0, nuclear_1.default)({ cityRegistry, unitRegistry }, atPeace), partnerOf = (0, treatyPartner_1.default)(exports.territoryImprovements, {
        interactionRegistry,
        tileImprovementRegistry,
        workedTileRegistry,
    }), { movePartner, onPartnersLand, offPartnersLand, pillagingPartnersLand, notPillagingPartnersLand, } = (0, partners_1.default)({ unitRegistry }, partnerOf), pillageCriteria = (0, pillage_1.pillageCriteria)({ tileImprovementRegistry }, (improvement) => exports.territoryImprovements.some((Improvement) => improvement instanceof Improvement)), 
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
        // The Diplomat stays, with no moves left.
        {
            name: 'meet-with-leader',
            criteria: [...diplomatCriteria],
            effect: (unit, to, from = unit.tile()) => new Actions_1.MeetWithLeader(from, to, unit, cityRegistry.getByTile(to).player(), ruleRegistry),
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