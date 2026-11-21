"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missionRows = void 0;
const espionage_1 = require("../../lib/espionage");
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const DiplomaticMissions_1 = require("@civ-clone/base-unit-trait-diplomatic-missions/DiplomaticMissions");
const diplomat_1 = require("@civ-clone/base-unit-action-rules/lib/criteria/diplomat");
const distanceFromPalace_1 = require("@civ-clone/base-unit-agent/lib/distanceFromPalace");
const Action_1 = require("@civ-clone/core-unit/Rules/Action");
const SneakMissions_1 = require("../../lib/SneakMissions");
const chooseProductionState_1 = require("@civ-clone/civ2-city/lib/chooseProductionState");
const Communism_1 = require("@civ-clone/base-government-communism/Communism");
const Courthouse_1 = require("@civ-clone/base-city-improvement-courthouse/Courthouse");
const Covert_1 = require("@civ-clone/base-unit-trait-covert/Covert");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Description_1 = require("@civ-clone/core-rule/Description");
const Democracy_1 = require("@civ-clone/base-government-democracy/Democracy");
const EstablishEmbassy_1 = require("@civ-clone/base-unit-action-establish-embassy/EstablishEmbassy");
const EstablishTradeRoute_1 = require("@civ-clone/base-unit-action-establish-trade-route/EstablishTradeRoute");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const InciteRevolt_1 = require("@civ-clone/base-unit-action-incite-revolt/InciteRevolt");
const IndustrialSabotage_1 = require("@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage");
const InvestigateCity_1 = require("@civ-clone/base-unit-action-investigate-city/InvestigateCity");
const NuclearFission_1 = require("@civ-clone/base-science-advance-nuclearfission/NuclearFission");
const Palace_1 = require("@civ-clone/base-city-improvement-palace/Palace");
const PlantNuclearDevice_1 = require("@civ-clone/base-unit-action-plant-nuclear-device/PlantNuclearDevice");
const PoisonWater_1 = require("@civ-clone/base-unit-action-poison-water/PoisonWater");
const Rocketry_1 = require("@civ-clone/base-science-advance-rocketry/Rocketry");
const SneakStealTechnology_1 = require("@civ-clone/base-unit-action-steal-technology/SneakStealTechnology");
const StealTechnology_1 = require("@civ-clone/base-unit-action-steal-technology/StealTechnology");
const SubvertCity_1 = require("@civ-clone/base-unit-action-incite-revolt/SubvertCity");
const TradeMissions_1 = require("@civ-clone/base-unit-trait-trade-missions/TradeMissions");
const UnitedNations_1 = require("@civ-clone/base-wonder-unitednations/UnitedNations");
const BribeUnit_1 = require("@civ-clone/base-unit-action-bribe-unit/BribeUnit");
const advances_1 = require("@civ-clone/civ2-science/data/advances");
const cityStatus_1 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
const capitalLink_1 = require("@civ-clone/civ2-city/lib/capitalLink");
const founder_1 = require("@civ-clone/civ2-city/lib/founder");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const trade_route_established_1 = require("@civ-clone/civ2-city/Rules/Unit/trade-route-established");
const hasWonder_1 = require("@civ-clone/base-wonder/lib/hasWonder");
const espionage_2 = require("./espionage");
const stealAdvance_1 = require("@civ-clone/base-unit-action-steal-technology/lib/stealAdvance");
const Units_1 = require("../../Units");
/**
 * Civilization II's Diplomat and Spy missions (OpenCiv2 `spy_city_mission_menu`, `unit_spy.cpp:151-226`, and the AI's
 *  `spy_city_mission_ai_choice`) and the Caravan's trade route, as rows of civ2-unit's action table. What each mission
 *  does is `Rules/Unit/espionage`.
 *
 * - **Theft**: a Diplomat once per city (`CITYF_TECH_STOLEN`), a Spy also at a city already robbed; a computer only
 *   while there's something to take (a person tries anyway, and pays a move).
 * - **Sabotage**: always offered.
 * - **Poisoning**: a Spy; a person's only at size 2 or more (a computer's empties a size-1 city's food box).
 * - **Planting a nuclear device**: a person's Spy, knowing Rocketry and Nuclear Fission, once the Manhattan Project has
 *   been built anywhere. The computer players never choose it.
 * - **A person under a ceasefire, a peace or an alliance** with the city's owner is offered a theft, a sabotage or a
 *   poisoning only as its `Sneak` form, which a client confirms first (`spy_confirm_treaty_breach`); the treaty itself
 *   breaks only through the incident if the agent is lost.
 * - **Inciting a revolt**: not a Democracy's city, nor with the agent within 2 of the owner's Palace (diagonally); a
 *   computer only without a treaty. Under a treaty a person may instead pay double (`subvert-city`, a `SubvertCity`),
 *   while that is under 15001.
 * - **Bribery**: a lone unit outside a city, not a Democracy's; a computer only knowing the Diplomat's prerequisite,
 *   and never a Caravan or Freight. A person's Spy is also offered `sabotage-unit` (the choice the original gives it
 *   under its default combat rules, `spy_unit_mission`).
 * - **A trade route**: to any foreign city, or to an own city other than home with no distance or continent test; a
 *   unit with no home is homed, for this, in its player's nearest city (`unit.cpp:694-699`).
 *
 * There is no treaty test on any mission, and each may start from a ship: the original's checks for Diplomats and
 *  Caravans come before its treaty checks, whatever square the unit leaves (`unit_move_dir_land_unit_checks`).
 */
const missionRows = ({ cityGrowthRegistry, cityImprovementRegistry, cityRegistry, clientRegistry, interactionRegistry, manhattanProjectBuilt, pendingEffectRegistry, playerGovernmentRegistry, playerRegistry, playerResearchRegistry, playerTreasuryRegistry, requirementRegistry, ruleRegistry, turn, unitImprovementRegistry, unitRegistry, wonderRegistry, }) => {
    // A mission on a foreign city next to the agent, with moves left: from a ship too, as the original's Diplomat and
    //  Caravan moves are checked whatever the square they leave (`unit_move_dir_land_unit_checks`, `unit_move.cpp:778-800`).
    const diplomatCriteria = [
        Action_1.isNeighbouringTile,
        Action_1.hasMovesLeft,
        new Criterion_1.default((unit, to) => {
            const city = cityRegistry.getByTile(to);
            return (unit.hasTrait(DiplomaticMissions_1.default) &&
                city !== null &&
                city.player() !== unit.player());
        }),
    ], 
    // A lone unit of another player's outside a city, from land or a ship (`spy_unit_mission`).
    bribeUnitCriteria = [
        Action_1.isNeighbouringTile,
        Action_1.hasMovesLeft,
        new Criterion_1.default((unit) => unit.hasTrait(DiplomaticMissions_1.default)),
        new Criterion_1.default((unit, to) => cityRegistry.getByTile(to) === null),
        new Criterion_1.default((unit, to) => {
            const units = unitRegistry.getByTile(to);
            return units.length === 1 && units[0].player() !== unit.player();
        }),
    ], cityOn = (to) => cityRegistry.getByTile(to), human = (player) => (0, isHuman_1.default)(player, clientRegistry), governed = (player, ...types) => {
        try {
            return playerGovernmentRegistry.getByPlayer(player).is(...types);
        }
        catch (e) {
            return false;
        }
    }, knows = (player, AdvanceType) => {
        try {
            return playerResearchRegistry
                .getByPlayer(player)
                .completed(AdvanceType);
        }
        catch (e) {
            return false;
        }
    }, gold = (player) => {
        try {
            return playerTreasuryRegistry.getByPlayerAndType(player, Gold_1.default).value();
        }
        catch (e) {
            return 0;
        }
    }, has = (city, Improvement) => cityImprovementRegistry
        .getByCity(city)
        .some((improvement) => improvement instanceof Improvement && !improvement.destroyed()), 
    // `civ_distance_to_capital(player, tile)`: the diagonal distance from `tile` to `player`'s nearest Palace, 16 with
    //  none (`civ.cpp:6396`).
    distanceToCapital = (player, tile) => (0, distanceFromPalace_1.distanceFromPalace)((0, distanceFromPalace_1.palaceTiles)(player, (improvement) => improvement instanceof Palace_1.default, cityImprovementRegistry), tile, capitalLink_1.diagonalDistance, 16), underTreaty = (unit, to) => (0, treatyLevel_1.treatyLevel)({ interactionRegistry }, unit.player(), cityOn(to).player()) >= treatyLevel_1.TreatyLevel.Ceasefire, personUnderTreaty = new Criterion_1.default((unit, to) => human(unit.player()) && underTreaty(unit, to)), notPersonUnderTreaty = new Criterion_1.default((unit, to) => !human(unit.player()) || !underTreaty(unit, to)), spy = new Criterion_1.default((unit) => unit.hasTrait(Covert_1.default)), person = new Criterion_1.default((unit) => human(unit.player())), 
    // A Diplomat at a city not yet robbed, or a Spy (`unit_spy.cpp:190`). A person is offered it with nothing to take,
    //  and pays a move for trying (`:461-467`); a computer only when there's something.
    canSteal = new Criterion_1.default((unit, to) => ((0, espionage_1.isSpy)(unit) || !(0, espionage_2.robbed)(cityOn(to), interactionRegistry)) &&
        (human(unit.player()) ||
            (0, stealAdvance_1.stealableAdvances)(unit.player(), cityOn(to).player(), playerResearchRegistry).length > 0)), canPoison = new Criterion_1.default((unit, to) => !human(unit.player()) ||
        cityGrowthRegistry.getByCity(cityOn(to)).size() > 1), canPlant = new Criterion_1.default((unit) => knows(unit.player(), Rocketry_1.default) &&
        knows(unit.player(), NuclearFission_1.default) &&
        manhattanProjectBuilt()), 
    // Not a Democracy's, nor with the agent within 2 of its Palace (`unit_spy.cpp:745-757`).
    canIncite = new Criterion_1.default((unit, to, from = unit.tile()) => {
        const owner = cityOn(to).player();
        return (!governed(owner, Democracy_1.default) && distanceToCapital(owner, from) >= 2);
    }), costToIncite = (unit, to, from = unit.tile()) => {
        const city = cityOn(to), owner = city.player();
        return (0, espionage_1.inciteCost)({
            size: cityGrowthRegistry.getByCity(city).size(),
            gold: gold(owner),
            distance: distanceToCapital(owner, from),
            communist: governed(owner, Communism_1.default),
            courthouse: has(city, Courthouse_1.default),
            disorder: (0, cityStatus_1.cityStatus)(chooseProductionState_1.CIVIL_DISORDER, city, pendingEffectRegistry) !== null,
            empty: unitRegistry.getByTile(city.tile()).length === 0,
            founder: (0, founder_1.founderOf)(city, owner, {
                pendingEffectRegistry,
                playerRegistry,
                turn,
            }) === unit.player(),
            spy: (0, espionage_1.isSpy)(unit),
            veteran: (0, espionage_1.isVeteran)(unit, unitImprovementRegistry),
        });
    }, 
    // The Diplomat's prerequisite (`unit_types[UNIT_DIPLOMAT].prerequisite`), which a computer must know to bribe.
    diplomatPrerequisite = (() => {
        const row = (0, espionage_1.unitRow)(Object.create(Units_1.Diplomat.prototype));
        return row === undefined || row[11] < 0 ? null : advances_1.advances[row[11]][0];
    })(), costToBribe = (unit, target) => {
        var _a, _b;
        return (0, espionage_1.bribeCost)({
            unitCost: (_b = (_a = (0, espionage_1.unitRow)(target)) === null || _a === void 0 ? void 0 : _a[8]) !== null && _b !== void 0 ? _b : 0,
            gold: gold(target.player()),
            distance: distanceToCapital(target.player(), target.tile()),
            briberCommunist: governed(unit.player(), Communism_1.default),
            settler: (0, espionage_1.isSettlerRole)(target),
        });
    }, hasNoEmbassy = (0, diplomat_1.hasNoEmbassy)({ cityRegistry, interactionRegistry }), noUnitedNations = new Criterion_1.default((unit) => !(0, hasWonder_1.playerOwnsWonder)(unit.player(), UnitedNations_1.default, wonderRegistry, playerResearchRegistry, requirementRegistry)), 
    // A Caravan's home for a trade route: civ2-city's, so the row and the delivery agree (`unit.cpp:694-699`).
    tradeRouteHome = (unit) => (0, trade_route_established_1.tradeRouteHome)(unit, cityRegistry);
    return {
        costToIncite,
        costToBribe,
        city: [
            {
                name: 'steal-technology',
                criteria: [...diplomatCriteria, canSteal, notPersonUnderTreaty],
                effect: (unit, to, from = unit.tile()) => new StealTechnology_1.default(from, to, unit, cityOn(to), ruleRegistry),
            },
            {
                name: 'sneak-steal-technology',
                criteria: [...diplomatCriteria, canSteal, personUnderTreaty],
                effect: (unit, to, from = unit.tile()) => new SneakStealTechnology_1.default(from, to, unit, cityOn(to), cityOn(to).player(), ruleRegistry),
            },
            // Once per civilization, and not for the owner of the United Nations (`spy_city_mission_menu`,
            //  `unit_spy.cpp:171-172`): only an `Embassy` of the player's own counts, not the one Marco Polo's acts as.
            {
                name: 'establish-embassy',
                criteria: [...diplomatCriteria, hasNoEmbassy, noUnitedNations],
                effect: (unit, to, from = unit.tile()) => new EstablishEmbassy_1.default(from, to, unit, cityOn(to), ruleRegistry),
            },
            {
                name: 'investigate-city',
                criteria: [...diplomatCriteria],
                effect: (unit, to, from = unit.tile()) => new InvestigateCity_1.default(from, to, unit, cityOn(to), ruleRegistry),
            },
            {
                name: 'industrial-sabotage',
                criteria: [...diplomatCriteria, notPersonUnderTreaty],
                effect: (unit, to, from = unit.tile()) => new IndustrialSabotage_1.default(from, to, unit, cityOn(to), ruleRegistry),
            },
            {
                name: 'sneak-industrial-sabotage',
                criteria: [...diplomatCriteria, personUnderTreaty],
                effect: (unit, to, from = unit.tile()) => new SneakMissions_1.SneakIndustrialSabotage(from, to, unit, cityOn(to), cityOn(to).player(), ruleRegistry),
            },
            {
                name: 'poison-water',
                criteria: [...diplomatCriteria, spy, canPoison, notPersonUnderTreaty],
                effect: (unit, to, from = unit.tile()) => new PoisonWater_1.default(from, to, unit, cityOn(to), ruleRegistry),
            },
            {
                name: 'sneak-poison-water',
                criteria: [...diplomatCriteria, spy, canPoison, personUnderTreaty],
                effect: (unit, to, from = unit.tile()) => new SneakMissions_1.SneakPoisonWater(from, to, unit, cityOn(to), cityOn(to).player(), ruleRegistry),
            },
            {
                name: 'plant-nuclear-device',
                criteria: [...diplomatCriteria, spy, person, canPlant],
                effect: (unit, to, from = unit.tile()) => new PlantNuclearDevice_1.default(from, to, unit, cityOn(to), ruleRegistry),
            },
            // Offered whether or not it's affordable, so the price can be shown; the effect refuses if not.
            {
                name: 'incite-revolt',
                criteria: [
                    ...diplomatCriteria,
                    canIncite,
                    new Criterion_1.default((unit, to) => human(unit.player()) || !underTreaty(unit, to)),
                    // What a Courthouse does to the price, for the Civilopedia (civ-clone/web-renderer#1291): base-unit-action-rules
                    //  hands a row's criteria to the rule as they are, and a rule takes a `Description` among them. Said once,
                    //  here, though `subvert-city`'s doubled price reads the same one.
                    new Description_1.default({
                        type: 'incite_distance',
                        subject: Courthouse_1.default,
                        value: espionage_1.COURTHOUSE_DISTANCE_DIVISOR,
                    }),
                ],
                effect: (unit, to, from = unit.tile()) => new InciteRevolt_1.default(from, to, unit, cityOn(to), costToIncite(unit, to, from), ruleRegistry),
            },
            // Under a treaty, a person may pay double: no incident and no war, but a vendetta, and it becomes the founder
            //  (`unit_spy.cpp:803-805`, `:838-845`).
            {
                name: 'subvert-city',
                criteria: [
                    ...diplomatCriteria,
                    canIncite,
                    personUnderTreaty,
                    new Criterion_1.default((unit, to, from = unit.tile()) => costToIncite(unit, to, from) < espionage_1.DOUBLED_PRICE_BELOW),
                ],
                effect: (unit, to, from = unit.tile()) => new SubvertCity_1.default(from, to, unit, cityOn(to), costToIncite(unit, to, from) * 2, ruleRegistry),
            },
        ],
        bribe: {
            name: 'bribe-unit',
            criteria: [
                ...bribeUnitCriteria,
                new Criterion_1.default((unit, to) => {
                    const [target] = unitRegistry.getByTile(to);
                    if (governed(target.player(), Democracy_1.default)) {
                        return false;
                    }
                    return (human(unit.player()) ||
                        ((diplomatPrerequisite === null ||
                            knows(unit.player(), diplomatPrerequisite)) &&
                            !(0, espionage_1.isTradeUnit)(target)));
                }),
            ],
            effect: (unit, to, from = unit.tile()) => {
                const [target] = unitRegistry.getByTile(to);
                return new BribeUnit_1.default(from, to, unit, target, costToBribe(unit, target), ruleRegistry);
            },
        },
        tradeRoute: {
            name: 'establish-trade-route',
            criteria: [
                Action_1.isNeighbouringTile,
                Action_1.hasMovesLeft,
                new Criterion_1.default((unit, to, from = unit.tile()) => {
                    const city = cityRegistry.getByTile(to);
                    if (!unit.hasTrait(TradeMissions_1.default) || city === null) {
                        return false;
                    }
                    const home = tradeRouteHome(unit);
                    if (home === null) {
                        return false;
                    }
                    // Any foreign city, from a ship too (`unit_move.cpp:778`).
                    if (city.player() !== unit.player()) {
                        return true;
                    }
                    return home !== city;
                }),
            ],
            effect: (unit, to, from = unit.tile()) => new EstablishTradeRoute_1.default(from, to, unit, cityOn(to), ruleRegistry),
        },
    };
};
exports.missionRows = missionRows;
exports.default = exports.missionRows;
//# sourceMappingURL=missions.js.map