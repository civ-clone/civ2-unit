"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.defenders = exports.shortStep = void 0;
const units_1 = require("./data/units");
const core_game_1 = require("@civ-clone/core-game");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
const Requirements_1 = require("./Requirements");
const buildRules_1 = require("@civ-clone/base-unit-build/lib/buildRules");
const ActiveUnit_1 = require("@civ-clone/base-player-action-active-unit/ActiveUnit");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Attack_1 = require("@civ-clone/base-unit-action-attack/Attack");
const Disembark_1 = require("@civ-clone/base-unit-action-disembark/Disembark");
const Fortified_1 = require("@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified");
const InactiveUnit_1 = require("@civ-clone/base-player-action-inactive-unit/InactiveUnit");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const Move_1 = require("@civ-clone/base-unit-action-move/Move");
const RuleSets_1 = require("./RuleSets");
const RuleSet_1 = require("@civ-clone/core-rule/RuleSet");
const Actions_1 = require("./Actions");
const Detonates_1 = require("@civ-clone/base-unit-trait-detonates/Detonates");
const InciteRevolt_1 = require("@civ-clone/base-unit-action-incite-revolt/InciteRevolt");
const SubvertCity_1 = require("@civ-clone/base-unit-action-incite-revolt/SubvertCity");
const dependenciesOf_1 = require("@civ-clone/civ2-diplomacy/lib/dependenciesOf");
const espionage_1 = require("./Rules/Unit/espionage");
const missionChoice_1 = require("./Rules/Unit/missionChoice");
const incited_1 = require("@civ-clone/civ2-city/Rules/City/incited");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const action_1 = require("./Rules/Unit/action");
const forcedWar_1 = require("./Rules/Unit/forcedWar");
const defeated_1 = require("./Rules/Unit/defeated");
const Units_1 = require("./Units");
const airliftRules_1 = require("@civ-clone/base-unit-action-airlift/lib/airliftRules");
const combat_1 = require("./Rules/Unit/combat");
const fuel_1 = require("./Rules/Unit/fuel");
const healing_1 = require("./Rules/Unit/healing");
const paradropRules_1 = require("@civ-clone/base-unit-action-paradrop/lib/paradropRules");
const pillageTarget_1 = require("@civ-clone/base-unit-action-pillage/lib/pillageTarget");
const promotion_1 = require("./Rules/Unit/promotion");
const workRate_1 = require("./Rules/Unit/workRate");
const build_1 = require("./Rules/City/build");
const buildCost_1 = require("./Rules/City/buildCost");
const canJoinCity_1 = require("./Rules/Unit/canJoinCity");
const created_1 = require("./Rules/Unit/created");
const cityUnitRules_1 = require("@civ-clone/base-unit-build/lib/cityUnitRules");
const diplomatRules_1 = require("@civ-clone/base-unit-lifecycle/lib/diplomatRules");
const detonatedRules_1 = require("@civ-clone/base-unit-lifecycle/lib/detonatedRules");
const movedRules_1 = require("@civ-clone/base-unit-lifecycle/lib/movedRules");
const SdiDefence_1 = require("@civ-clone/base-city-improvement-sdidefence/SdiDefence");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const hasImprovementOrWonder_1 = require("@civ-clone/base-wonder/lib/hasImprovementOrWonder");
const distance_1 = require("./lib/distance");
const coastBound_1 = require("./lib/coastBound");
const homeCity_1 = require("@civ-clone/base-unit-build/lib/homeCity");
const manhattanProject_1 = require("./lib/manhattanProject");
const lifecycleRules_1 = require("@civ-clone/base-unit-lifecycle/lib/lifecycleRules");
const movementCost_1 = require("./Rules/Unit/movementCost");
const roles_1 = require("./Rules/Unit/roles");
const singleUse_1 = require("./Rules/Unit/singleUse");
const strength_1 = require("./Rules/Unit/strength");
const traits_1 = require("./Rules/Unit/traits");
const yield_1 = require("./Rules/Unit/yield");
const unitTable_1 = require("./lib/unitTable");
/**
 * A land unit short of the moves a step costs (`unit_move_dir`): one that hasn't moved this turn always gets there; one
 *  that has gets there with a chance of its remaining moves over the cost. Only land units roll; any other gets there. Route planning can count on the first, so a
 *  step is worth no more than a turn.
 */
exports.shortStep = {
    succeeds: (unit, remaining, movement, cost, randomNumberGenerator) => !(unit instanceof Land_1.default) ||
        remaining >= movement ||
        remaining > cost * randomNumberGenerator(),
    expectedCost: (movement) => movement,
};
/** A new city's first defender, if its player asks for one: the defensive units, strongest defence first. */
exports.defenders = units_1.units
    .map((row, index) => [
    row,
    unitTable_1.unitTypes[index],
])
    .filter(([[, , , , , , , , , , role]]) => role === units_1.DEFEND)
    .sort(([a], [b]) => b[5] - a[5])
    .map(([, UnitType]) => UnitType);
const register = (game) => {
    // What each unit type can do and what it's for, first, so that no rule below is asked about a unit before then.
    game.rules.register(...(0, traits_1.default)(), ...(0, roles_1.default)());
    const lifecycle = (0, lifecycleRules_1.default)('civ2-unit', {
        cityRegistry: game.cities,
        engine: game.engine,
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        transportRegistry: game.transports,
        unitImprovementRegistry: game.unitImprovements,
        unitLossRegistry: game.unitLosses,
        unitRegistry: game.units,
    }, {
        ActiveUnit: ActiveUnit_1.default,
        InactiveUnit: InactiveUnit_1.default,
        removedOnActivate: [Fortified_1.default],
        // Missiles go aboard a submarine as a `SingleUse` unit.
        stowable: [Land_1.default, Air_1.default, SingleUse_1.default],
        partnerOf: (0, action_1.treatyPartnerOf)({
            interactionRegistry: game.interactions,
            tileImprovementRegistry: game.tileImprovements,
            workedTileRegistry: game.workedTiles,
        }),
        shortStep: exports.shortStep,
        sparesStack: (0, defeated_1.sparesStack)(game.tileImprovements),
    });
    game.rules.register(...(0, action_1.default)({
        cityGrowthRegistry: game.cityGrowth,
        clientRegistry: game.clients,
        cityImprovementRegistry: game.cityImprovements,
        cityNameRegistry: game.cityNames,
        cityRegistry: game.cities,
        engine: game.engine,
        interactionRegistry: game.interactions,
        pathFinderRegistry: game.pathFinders,
        pendingEffectRegistry: game.pendingEffects,
        playerGovernmentRegistry: game.playerGovernments,
        playerRegistry: game.players,
        playerResearchRegistry: game.playerResearch,
        playerTreasuryRegistry: game.playerTreasuries,
        randomNumberGenerator: game.rng,
        requirementRegistry: game.requirements,
        ruleRegistry: game.rules,
        strategyNoteRegistry: game.strategyNotes,
        strategyRegistry: game.strategies,
        terrainFeatureRegistry: game.terrainFeatures,
        tileImprovementRegistry: game.tileImprovements,
        transportRegistry: game.transports,
        turn: game.turn,
        unitImprovementRegistry: game.unitImprovements,
        unitRegistry: game.units,
        wonderRegistry: game.wonders,
        workedTileRegistry: game.workedTiles,
    }), ...lifecycle.activate, (0, buildRules_1.navalNeedsCoastRule)('civ2-unit'), ...(0, build_1.default)({
        clientRegistry: game.clients,
        playerGovernmentRegistry: game.playerGovernments,
        playerResearchRegistry: game.playerResearch,
        manhattanProjectBuilt: (0, manhattanProject_1.default)(game.wonders, game.cityImprovements),
    }));
    // Which units a city may build, from the entries in `Requirements`, through the game's `requirements`.
    game.requirements.add((0, buildRules_1.deriveBuildRules)(game.playerResearch), ...Requirements_1.default);
    // Units going obsolete, as a set a game can switch off.
    game.ruleSets.register(new RuleSet_1.default(RuleSets_1.OBSOLESCENCE, ...Requirements_1.obsoletedBy.map((entry) => entry.id)));
    const cityUnits = (0, cityUnitRules_1.default)('civ2-unit', {
        buildPreferencesRegistry: game.buildPreferences,
        cityBuildRegistry: game.cityBuilds,
        cityGrowthRegistry: game.cityGrowth,
        cityRegistry: game.cities,
        engine: game.engine,
        unitImprovementRegistry: game.unitImprovements,
        unitRegistry: game.units,
    }, {
        defenders: exports.defenders,
        homeCity: (0, homeCity_1.default)((from, to) => from.distanceFrom(to), game.cities),
        lostWithCity: [Veteran_1.default],
        // Units in or beside a city incited to revolt go with it (`city_incite_transfer`, `city.cpp:2252-2275`).
        defectingCauses: [InciteRevolt_1.default, SubvertCity_1.default],
    });
    const missions = (0, diplomatRules_1.default)('civ2-unit', {
        engine: game.engine,
        interactionRegistry: game.interactions,
        ruleRegistry: game.rules,
        turn: game.turn,
    });
    game.rules.register(...(0, buildCost_1.default)(), ...cityUnits.buildingComplete, ...cityUnits.created, 
    // The units in or beside a city incited to revolt go with it.
    ...cityUnits.captured, ...(0, created_1.default)({
        playerGovernmentRegistry: game.playerGovernments,
        ruleRegistry: game.rules,
        unitImprovementRegistry: game.unitImprovements,
    }), ...(0, canJoinCity_1.default)(game.cityGrowth), ...lifecycle.canStow, ...lifecycle.created, 
    // Promotion reads both units' strengths before the loser is destroyed (it is `High`, and comes first).
    ...(0, promotion_1.default)({
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        unitImprovementRegistry: game.unitImprovements,
    }), ...lifecycle.defeated, ...(0, defeated_1.default)({
        cityGrowthRegistry: game.cityGrowth,
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        clientRegistry: game.clients,
        gameDifficultyRegistry: game.difficulty,
        playerResearchRegistry: game.playerResearch,
        requirementRegistry: game.requirements,
        wonderRegistry: game.wonders,
    }), ...lifecycle.destroyed, ...(0, detonatedRules_1.default)('civ2-unit', {
        cityGrowthRegistry: game.cityGrowth,
        cityRegistry: game.cities,
        engine: game.engine,
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        tileImprovementRegistry: game.tileImprovements,
        unitRegistry: game.units,
    }, {
        // SDI Defense stops the missile outright (`vetoes`), rather than sparing a city's units.
        sparesUnits: () => false,
        Pollution: TileImprovements_1.Pollution,
        falloutChance: 2 / 3,
        // Another player's city with SDI Defense within 3 of the target, by `map_distance`, stops a nuclear attack
        //  and the missile is lost (`unit_nuclear_attack`). The client hears `unit:nuclear-stopped` as well as the
        //  detonation it is told of either way.
        vetoes: (() => {
            const protectedBy = (0, detonatedRules_1.protectedByCityWithin)(game.cities, 3, (city, unit) => city.player() !== unit.player() &&
                (0, hasImprovementOrWonder_1.cityHasImprovement)(city, SdiDefence_1.default, game.cityImprovements), distance_1.default);
            // Only a missile: a Spy's planted device isn't stopped (`unit_nuclear_attack(civ, x, y, 0)`, `unit_spy.cpp:687`).
            return (unit, tile) => {
                const stopped = unit.hasTrait(Detonates_1.default) && protectedBy(unit, tile);
                if (stopped) {
                    game.engine.emit('unit:nuclear-stopped', unit, tile);
                }
                return stopped;
            };
        })(),
    }), ...lifecycle.expectedMovementCost, ...lifecycle.impassable, ...lifecycle.halted, ...lifecycle.lostAtSea, 
    // base-unit-lifecycle's moved rules but its `break-peace-treaty`, which `forcedWar` replaces.
    ...(0, movedRules_1.default)('civ2-unit', {
        cityRegistry: game.cities,
        engine: game.engine,
        interactionRegistry: game.interactions,
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        transportRegistry: game.transports,
        unitRegistry: game.units,
    }, {
        Move: Move_1.default,
        Disembark: Disembark_1.default,
        attacks: [Attack_1.default, Actions_1.SneakAttack],
        noVendetta: [Actions_1.SneakMove, Actions_1.SneakPillage],
        coastBoundLoss: (0, coastBound_1.default)({
            playerResearchRegistry: game.playerResearch,
            requirementRegistry: game.requirements,
            wonderRegistry: game.wonders,
        }),
        // Out of sight of land: none of the 9 squares, its own included, is land (`unit_move_dir_trireme_loss`).
        nearLand: movedRules_1.adjacentToLand,
    }).filter((rule) => rule.id() !== forcedWar_1.LIFECYCLE_BREAK_TREATY_RULE), ...(0, forcedWar_1.default)({
        cityRegistry: game.cities,
        diplomacy: (0, dependenciesOf_1.default)(game),
        clientRegistry: game.clients,
        interactionRegistry: game.interactions,
        playerRegistry: game.players,
        ruleRegistry: game.rules,
        turn: game.turn,
        unitRegistry: game.units,
    }), ...(0, singleUse_1.default)(), ...(0, movementCost_1.default)(game.tileImprovements, game.transports, game.terrainFeatures, game.cities), ...lifecycle.playerAction, ...lifecycle.stowed, ...missions.embassyEstablished, ...missions.cityInvestigated, 
    // What the Diplomat's and Spy's missions do, and whether the agent survives them.
    ...(0, espionage_1.default)({
        cityBuildRegistry: game.cityBuilds,
        cityGrowthRegistry: game.cityGrowth,
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        clientRegistry: game.clients,
        diplomacy: (0, dependenciesOf_1.default)(game),
        engine: game.engine,
        interactionRegistry: game.interactions,
        pendingEffectRegistry: game.pendingEffects,
        playerGovernmentRegistry: game.playerGovernments,
        playerResearchRegistry: game.playerResearch,
        playerTreasuryRegistry: game.playerTreasuries,
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        transportRegistry: game.transports,
        turn: game.turn,
        unitImprovementRegistry: game.unitImprovements,
        unitRegistry: game.units,
        inciterBecomesFounder: (city, inciter) => (0, incited_1.inciterBecomesFounder)(city, inciter, {
            pendingEffectRegistry: game.pendingEffects,
            turn: game.turn,
        }),
    }), 
    // A computer player's mission at a city, for the AI client to read.
    ...(0, missionChoice_1.default)({
        clientRegistry: game.clients,
        diplomacy: (0, dependenciesOf_1.default)(game),
        pendingEffectRegistry: game.pendingEffects,
        randomNumberGenerator: game.rng,
    }), ...lifecycle.transferred, ...(0, strength_1.default)({
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        playerResearchRegistry: game.playerResearch,
        requirementRegistry: game.requirements,
        terrainFeatureRegistry: game.terrainFeatures,
        tileImprovementRegistry: game.tileImprovements,
        unitImprovementRegistry: game.unitImprovements,
        wonderRegistry: game.wonders,
    }), 
    // Battles in rounds, their firepower changes and the choice of defender.
    ...(0, combat_1.default)({
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        playerResearchRegistry: game.playerResearch,
        requirementRegistry: game.requirements,
        ruleRegistry: game.rules,
        terrainFeatureRegistry: game.terrainFeatures,
        tileImprovementRegistry: game.tileImprovements,
        unitImprovementRegistry: game.unitImprovements,
        unitRegistry: game.units,
        wonderRegistry: game.wonders,
    }), 
    // Healing (`High`, before the turn's moves are given out) and damaged movement.
    ...(0, healing_1.default)({
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        landMassRegistry: game.landMasses,
        tileImprovementRegistry: game.tileImprovements,
        unitImprovementRegistry: game.unitImprovements,
        unitRegistry: game.units,
    }), ...(0, fuel_1.default)({
        cityRegistry: game.cities,
        engine: game.engine,
        ruleRegistry: game.rules,
        tileImprovementRegistry: game.tileImprovements,
        transportRegistry: game.transports,
        unitImprovementRegistry: game.unitImprovements,
        unitRegistry: game.units,
    }), ...(0, workRate_1.default)(), ...(0, paradropRules_1.default)('civ2-unit', {
        unitImprovementRegistry: game.unitImprovements,
    }), ...(0, airliftRules_1.default)('civ2-unit', {
        pendingEffectRegistry: game.pendingEffects,
    }), (0, pillageTarget_1.default)('civ2-unit', action_1.pillageable, (unit) => unit instanceof Units_1.Partisan ? action_1.partisanPillageOrder : action_1.pillageOrder), ...(0, yield_1.default)(game.unitImprovements, game.rules, game.transports), ...lifecycle.unsupported, ...lifecycle.validateMove);
};
exports.register = register;
// The plugin loader imports each package for this side effect.
(0, exports.register)(core_game_1.defaultGame);
exports.default = exports.register;
//# sourceMappingURL=registerRules.js.map