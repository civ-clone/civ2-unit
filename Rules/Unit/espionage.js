"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.robbed = exports.THIRD_OF_A_MOVE = exports.escapingMissions = void 0;
const escape_1 = require("@civ-clone/base-unit-agent/lib/escape");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const PendingEffectRegistry_1 = require("@civ-clone/core-pending-effect/PendingEffectRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const espionage_1 = require("../../lib/espionage");
const missionRecords_1 = require("../../lib/missionRecords");
const stealAdvance_1 = require("@civ-clone/base-unit-action-steal-technology/lib/stealAdvance");
const AdvanceStolen_1 = require("@civ-clone/base-unit-action-steal-technology/AdvanceStolen");
const AgentSurvives_1 = require("@civ-clone/base-unit-agent/Rules/AgentSurvives");
const CitySabotaged_1 = require("@civ-clone/base-unit-action-industrial-sabotage/Rules/CitySabotaged");
const CityWalls_1 = require("@civ-clone/base-city-improvement-citywalls/CityWalls");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Destroyed_1 = require("@civ-clone/core-city/Rules/Destroyed");
const DevicePlanted_1 = require("@civ-clone/base-unit-action-plant-nuclear-device/Rules/DevicePlanted");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const EstablishEmbassy_1 = require("@civ-clone/base-unit-action-establish-embassy/EstablishEmbassy");
const Fundamentalism_1 = require("@civ-clone/base-government-fundamentalism/Fundamentalism");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const InciteRevolt_1 = require("@civ-clone/base-unit-action-incite-revolt/InciteRevolt");
const IndustrialSabotage_1 = require("@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage");
const InvestigateCity_1 = require("@civ-clone/base-unit-action-investigate-city/InvestigateCity");
const MissionDetected_1 = require("@civ-clone/base-unit-agent/Rules/MissionDetected");
const MissionMode_1 = require("@civ-clone/base-unit-agent/Rules/MissionMode");
const MissionTargets_1 = require("@civ-clone/base-unit-agent/Rules/MissionTargets");
const Palace_1 = require("@civ-clone/base-city-improvement-palace/Palace");
const PlantNuclearDevice_1 = require("@civ-clone/base-unit-action-plant-nuclear-device/PlantNuclearDevice");
const PoisonWater_1 = require("@civ-clone/base-unit-action-poison-water/PoisonWater");
const RevoltIncited_1 = require("@civ-clone/base-unit-action-incite-revolt/Rules/RevoltIncited");
const StealTechnology_1 = require("@civ-clone/base-unit-action-steal-technology/StealTechnology");
const SubvertCity_1 = require("@civ-clone/base-unit-action-incite-revolt/SubvertCity");
const TechnologyStolen_1 = require("@civ-clone/base-unit-action-steal-technology/Rules/TechnologyStolen");
const UnitBribed_1 = require("@civ-clone/base-unit-action-bribe-unit/Rules/UnitBribed");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Yields_1 = require("@civ-clone/civ2-city/Yields");
const Actions_1 = require("../../Actions");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const ProcessYield_1 = require("@civ-clone/core-city/Rules/ProcessYield");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const WaterPoisoned_1 = require("@civ-clone/base-unit-action-poison-water/Rules/WaterPoisoned");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const escape_2 = require("@civ-clone/base-unit-agent/lib/escape");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const makeContact_1 = require("@civ-clone/base-diplomacy-interaction-contact/makeContact");
const nearestCity_1 = require("../../lib/nearestCity");
const espionage_2 = require("@civ-clone/civ2-diplomacy/lib/espionage");
const pay_1 = require("@civ-clone/base-unit-agent/lib/pay");
const core_random_1 = require("@civ-clone/core-random");
/** The city missions whose agent tries to escape afterwards (`spy_try_escape(unit, mode, victim)`), a Diplomat never. */
exports.escapingMissions = [
    StealTechnology_1.default,
    IndustrialSabotage_1.default,
    PoisonWater_1.default,
    InciteRevolt_1.default,
];
/** A third of a move, what a person's Spy pays for an embassy or a first investigation (`moves_used++`, one of @COSMIC's
 *  road movement multiplier's steps). */
exports.THIRD_OF_A_MOVE = 1 / cosmic_1.cosmic.roadMoveMultiplier;
/** Whether anyone has robbed `city` of an advance (`CITYF_TECH_STOLEN`). */
const robbed = (city, interactionRegistry = InteractionRegistry_1.instance) => interactionRegistry
    .entries()
    .some((interaction) => interaction instanceof AdvanceStolen_1.default &&
    interaction.city() === city);
exports.robbed = robbed;
/**
 * Civilization II's Diplomat and Spy missions on base-unit-agent's seams (OpenCiv2 `src/auto/unit_spy.cpp`):
 *
 * - **Contact:** a mission on a city makes contact first (`spy_city_mission`'s `diplo_set_treaty_flags(civ, civ2, 1)`).
 * - **Escape modes** (`MissionMode`): a theft with no target chosen, at a city already robbed, is hard (`:384-393`);
 *   poisoning draws ordinary or hard (`:641-642`).
 * - **Caught checks** (`AgentSurvives` with `CAUGHT_CHECK`, `spy_check_caught`, odds 3 or 6 for a veteran Spy, and a
 *   Diplomat always caught): one for a hard theft; for a chosen sabotage one, a second for a city with a Palace and a
 *   third when the target is City Walls (`:510-521`); three for a nuclear device, a fourth for a Palace (`:680-686`).
 *   Every other mission has none.
 * - **After the mission** (`AgentSurvives` with the resolved mode): a Diplomat is used up; a Spy pays a move, then
 *   escapes with odds 2, doubled for a veteran and halved when hard, to its nearest city, and becomes a veteran
 *   (`spy_try_escape`). An embassy or an investigation uses up a computer's agent and a person's Diplomat; a person's
 *   Spy stays, paying a third of a move for the embassy and for the first investigation of a city
 *   (`:262-320`). A planted device leaves the Spy as it is (the original makes no escape; the blast takes it).
 *   Sabotaging a unit keeps its own escape (base-unit-action-sabotage-unit's options), so no rule here answers for it.
 * - **Targets** (`MissionTargets`): only a person's Spy chooses: an advance at a city not yet robbed, or, when there is
 *   something to sabotage, any building but the Palace, SDI Defense and Wonders, or the production.
 * - **Counter-espionage** (`MissionDetected`): a random theft is detected by each Diplomat or Spy in the city in turn,
 *   at 20, 40 or 60 in 100 (Diplomat, Spy, veteran Spy), the first success stopping it (`:405-420`).
 * - **Effects:** the advance stolen; the building or production sabotaged, but only when either side is a person (the
 *   original's effect sits inside that test, `:577-618`, so two computer players' sabotage only spends the agent); the
 *   water poisoned; whether a planted device is discovered (½, a veteran ¼, never a Fundamentalist's), with
 *   civ2-diplomacy's `nuclearDeviceDiscovered`; a city incited, paid for and captured with the action as the cause;
 *   a unit bribed and rehomed.
 */
const getRules = ({ cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, diplomacy, engine = Engine_1.instance, interactionRegistry = InteractionRegistry_1.instance, pendingEffectRegistry = PendingEffectRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, randomNumberGenerator = core_random_1.instance, ruleRegistry = RuleRegistry_1.instance, turn = Turn_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, inciterBecomesFounder = () => { }, } = {}) => {
    const veteran = (unit) => (0, espionage_1.isVeteran)(unit, unitImprovementRegistry), human = (player) => (0, isHuman_1.default)(player, clientRegistry), is = (mission, ...types) => types.some((Type) => mission instanceof Type), cityOf = (mission) => mission.city(), has = (city, Improvement) => cityImprovementRegistry
        .getByCity(city)
        .some((improvement) => improvement instanceof Improvement && !improvement.destroyed()), 
    // `spy_check_caught` `count` times: a Spy must escape each (odds 3, 6 for a veteran); a Diplomat never does. An
    //  escape is `spy_try_escape(unit, -1, civ)` in full: the Spy goes to its nearest city with its moves spent, even
    //  before the mission (`unit_spy.cpp:47-62`), but pays no move and isn't promoted for it.
    caughtChecks = (unit, mission, count) => {
        for (let i = 0; i < count; i++) {
            if (!(0, espionage_1.isSpy)(unit) ||
                !(0, escape_2.default)(unit, escape_1.CAUGHT_CHECK, {
                    action: mission,
                    cityRegistry,
                    odds: (agent, mode) => (0, escape_1.escapeOdds)(mode, veteran(agent)),
                    randomNumberGenerator,
                    relocates: true,
                    ruleRegistry,
                })) {
                return false;
            }
        }
        return true;
    }, 
    // The advance a theft takes and the building a random sabotage takes, each walked from a slot drawn as the mission
    //  starts, before any caught check or detection and whatever comes of them (`unit_spy.cpp:352-366`, `:459-468`).
    theft = new WeakMap(), sabotage = new WeakMap(), theftOf = (unit, city, mission) => theft.has(mission)
        ? theft.get(mission)
        : (0, stealAdvance_1.firstStealableAdvance)(unit.player(), city.player(), espionage_1.theftOrder, randomNumberGenerator, { playerResearchRegistry }), 
    // Whether a planted device's Spy was a veteran, read before the blast destroys it.
    plantedByVeteran = new WeakMap(), makeVeteran = (unit) => {
        if (!veteran(unit)) {
            unitImprovementRegistry.register(new Veteran_1.default(unit));
        }
    }, gold = (player) => {
        try {
            return playerTreasuryRegistry.getByPlayerAndType(player, Gold_1.default).value();
        }
        catch (e) {
            return 0;
        }
    }, pay = (player, cost) => {
        try {
            return (0, pay_1.default)(player, cost, Gold_1.default, playerTreasuryRegistry);
        }
        catch (e) {
            return false;
        }
    }, fundamentalist = (player) => {
        try {
            return playerGovernmentRegistry.getByPlayer(player).is(Fundamentalism_1.default);
        }
        catch (e) {
            return false;
        }
    }, 
    // The improvements a person's Spy may choose to sabotage: any in the first 39 slots but the Palace and SDI Defense.
    sabotageable = (city) => cityImprovementRegistry
        .getByCity(city)
        .filter((improvement) => !improvement.destroyed() &&
        espionage_1.improvementOrder.some((Improvement) => Improvement !== null &&
            Improvement !== espionage_1.improvementOrder[1] &&
            Improvement !== espionage_1.improvementOrder[17] &&
            improvement instanceof Improvement));
    return [
        // `spy_city_mission` starts by putting the two in contact (`diplo_set_treaty_flags(civ, civ2, 1)`). It answers no
        //  mode, so the mission's own default stands.
        new MissionMode_1.default('civ2-unit:mission-mode/contact', new Criterion_1.default((unit, mission) => typeof mission.city ===
            'function' && cityOf(mission).player() !== unit.player()), new Effect_1.default((unit, mission) => {
            (0, makeContact_1.default)(interactionRegistry, unit.player(), cityOf(mission).player(), ruleRegistry, turn);
            // No mode: `missionMode` passes over an answer that isn't `ORDINARY` or `HARD`.
            return undefined;
        })),
        // A theft's advance and a sabotage's building, drawn first (no mode answered).
        new MissionMode_1.default('civ2-unit:mission-mode/draw-target', new Criterion_1.default((unit, mission) => is(mission, StealTechnology_1.default, IndustrialSabotage_1.default)), new Effect_1.default((unit, mission) => {
            const city = cityOf(mission);
            if (mission instanceof StealTechnology_1.default) {
                theft.set(mission, (0, stealAdvance_1.firstStealableAdvance)(unit.player(), city.player(), espionage_1.theftOrder, randomNumberGenerator, { playerResearchRegistry }));
            }
            else {
                sabotage.set(mission, (0, espionage_1.randomSabotageTarget)((Type) => has(city, Type), randomNumberGenerator));
            }
            return undefined;
        })),
        // A random theft at a city already robbed: a caught check and the hard escape (`unit_spy.cpp:384-393`).
        new MissionMode_1.default('civ2-unit:mission-mode/robbed-city', new Criterion_1.default((unit, mission) => mission instanceof StealTechnology_1.default &&
            mission.chosenTarget() === undefined &&
            (0, exports.robbed)(mission.city(), interactionRegistry)), new Effect_1.default(() => escape_1.HARD)),
        // Poisoning the water: ordinary or hard on a coin flip (`unit_spy.cpp:641-642`).
        new MissionMode_1.default('civ2-unit:mission-mode/poison-water', new Criterion_1.default((unit, mission) => mission instanceof PoisonWater_1.default), new Effect_1.default(() => Math.floor(randomNumberGenerator() * 2) === 0 ? escape_1.ORDINARY : escape_1.HARD)),
        // The caught checks. Every mission listed answers, rolling or not, so none falls back.
        new AgentSurvives_1.default('civ2-unit:agent-survives/caught-check', new Criterion_1.default((unit, mission, mode) => mode === escape_1.CAUGHT_CHECK &&
            is(mission, StealTechnology_1.default, IndustrialSabotage_1.default, PlantNuclearDevice_1.default)), new Effect_1.default((unit, mission, mode, resolvedMode) => {
            const city = cityOf(mission);
            if (mission instanceof PlantNuclearDevice_1.default) {
                plantedByVeteran.set(mission, veteran(unit));
                return caughtChecks(unit, mission, 3 + (has(city, Palace_1.default) ? 1 : 0));
            }
            if (mission instanceof IndustrialSabotage_1.default) {
                const target = mission.chosenTarget();
                if (target === undefined) {
                    return true;
                }
                return caughtChecks(unit, mission, 1 +
                    (has(city, Palace_1.default) ? 1 : 0) +
                    (target instanceof CityWalls_1.default ? 1 : 0));
            }
            // A theft: one check when it is hard (a chosen advance, or a city already robbed); none for a random one, nor
            //  when there's nothing to take (`unit_spy.cpp:367`).
            return resolvedMode === escape_1.HARD && theftOf(unit, city, mission) !== null
                ? caughtChecks(unit, mission, 1)
                : true;
        })),
        // After a theft, a sabotage, a poisoning or an incited revolt: a Diplomat is used up; a Spy pays a move and tries
        //  to escape (`spy_try_escape`). After an incited revolt, the city it just took isn't where it goes: the original
        //  escapes before the city changes hands (`unit_spy.cpp:835`, then `city_incite_transfer`).
        new AgentSurvives_1.default('civ2-unit:agent-survives/escape', new Criterion_1.default((unit, mission, mode) => mode !== escape_1.CAUGHT_CHECK && is(mission, ...exports.escapingMissions)), new Effect_1.default((unit, mission, mode) => {
            if (!(0, espionage_1.isSpy)(unit)) {
                return false;
            }
            const city = cityOf(mission);
            return (0, escape_2.default)(unit, mode, {
                action: mission,
                cityRegistry: mission instanceof InciteRevolt_1.default
                    ? {
                        getByPlayer: (player) => cityRegistry
                            .getByPlayer(player)
                            .filter((playerCity) => playerCity !== city),
                    }
                    : cityRegistry,
                escaped: (escaped) => makeVeteran(escaped),
                missionCost: 1,
                odds: (agent, oddsMode) => (0, escape_1.escapeOdds)(oddsMode, veteran(agent)),
                randomNumberGenerator,
                ruleRegistry,
            });
        })),
        // An embassy: a person's Spy stays and pays a third of a move; a person's Diplomat and any computer agent are
        //  used up, with no incident (`unit_spy.cpp:262-277`).
        new AgentSurvives_1.default('civ2-unit:agent-survives/embassy', new Criterion_1.default((unit, mission, mode) => mode !== escape_1.CAUGHT_CHECK && mission instanceof EstablishEmbassy_1.default), new Effect_1.default((unit) => {
            if (!(0, espionage_1.isSpy)(unit) || !human(unit.player())) {
                return false;
            }
            unit.moves().set(Math.max(0, unit.moves().value() - exports.THIRD_OF_A_MOVE));
            return true;
        })),
        // An investigation: a person's Spy stays, paying a third of a move the first time the city is investigated; a
        //  person's Diplomat and any computer agent are used up, with no incident (`unit_spy.cpp:300-320`).
        new AgentSurvives_1.default('civ2-unit:agent-survives/investigate', new Criterion_1.default((unit, mission, mode) => mode !== escape_1.CAUGHT_CHECK && mission instanceof InvestigateCity_1.default), new Effect_1.default((unit, mission) => {
            if (!human(unit.player())) {
                return false;
            }
            const city = cityOf(mission), first = !(0, missionRecords_1.investigated)(city, pendingEffectRegistry);
            (0, missionRecords_1.markInvestigated)(city, pendingEffectRegistry);
            if (!(0, espionage_1.isSpy)(unit)) {
                return false;
            }
            if (first) {
                unit.moves().set(Math.max(0, unit.moves().value() - exports.THIRD_OF_A_MOVE));
            }
            return true;
        })),
        // A planted device: the original makes no escape. A Spy the blast spared stays as it is.
        new AgentSurvives_1.default('civ2-unit:agent-survives/nuclear-device', new Criterion_1.default((unit, mission, mode) => mode !== escape_1.CAUGHT_CHECK && mission instanceof PlantNuclearDevice_1.default), new Effect_1.default(() => true)),
        // What a person's Spy may choose to steal: any advance it could take, at a city not yet robbed
        //  (`unit_spy.cpp:369-383`, `civ_steal_advance`).
        new MissionTargets_1.default('civ2-unit:mission-targets/steal', new Criterion_1.default((unit, city, mission) => mission instanceof StealTechnology_1.default &&
            (0, espionage_1.isSpy)(unit) &&
            human(unit.player()) &&
            !(0, exports.robbed)(city, interactionRegistry)), new Effect_1.default((unit, city) => (0, stealAdvance_1.stealableAdvances)(unit.player(), city.player(), playerResearchRegistry))),
        // What a person's Spy may choose to sabotage, when there's a building a random sabotage could take: any building
        //  but the Palace, SDI Defense (which the original lists, then refuses) and Wonders, or the production
        //  (`unit_spy.cpp:470-511`).
        new MissionTargets_1.default('civ2-unit:mission-targets/sabotage', new Criterion_1.default((unit, city, mission) => mission instanceof IndustrialSabotage_1.default &&
            (0, espionage_1.isSpy)(unit) &&
            human(unit.player()) &&
            sabotageable(city).length > 0), new Effect_1.default((unit, city) => [
            ...sabotageable(city),
            espionage_1.PRODUCTION,
        ])),
        // Counter-espionage, on a random theft only (base-unit-action-steal-technology asks only then), when there's
        //  something to take.
        new MissionDetected_1.default('civ2-unit:mission-detected/defenders', new Criterion_1.default((unit, city, mission) => mission instanceof StealTechnology_1.default &&
            theftOf(unit, city, mission) !== null), new Effect_1.default((unit, city) => (0, espionage_1.detected)(unitRegistry
            .getByTile(city.tile())
            .filter((defender) => defender !== unit), randomNumberGenerator, unitImprovementRegistry))),
        // The advance: the one chosen, or the random walk over `@CIVILIZE` (`unit_spy.cpp:352-366`), drawn as the mission
        //  started. With nothing to take, a person's agent loses a move and stays (`:425-431`). The original's preference
        //  for spaceship advances during a space race isn't here: there is no spaceship yet.
        new TechnologyStolen_1.default('civ2-unit:technology-stolen/steal', new Effect_1.default((unit, city, action) => {
            const thief = unit.player(), victim = city.player(), chosen = action === null || action === void 0 ? void 0 : action.chosenTarget(), AdvanceType = chosen !== null && chosen !== void 0 ? chosen : (action === undefined
                ? (0, stealAdvance_1.firstStealableAdvance)(thief, victim, espionage_1.theftOrder, randomNumberGenerator, { playerResearchRegistry })
                : theftOf(unit, city, action));
            if (AdvanceType === null) {
                if (human(thief)) {
                    unit.moves().set(Math.max(0, unit.moves().value() - 1));
                }
                return false;
            }
            (0, stealAdvance_1.default)(thief, victim, city, AdvanceType, {
                engine,
                interactionRegistry,
                playerResearchRegistry,
                ruleRegistry,
                turn,
            });
            return true;
        })),
        // The building or production: the one chosen, or the random building drawn as the mission started
        //  (`randomSabotageTarget`), or the production when there's none; and, with shields in the box, a random sabotage
        //  takes the production when `sabotagesProduction` says so, which is rolled whether or not there was a building
        //  (`unit_spy.cpp:563-575`). Only when either side is a person does it happen (`:577`).
        new CitySabotaged_1.default('civ2-unit:city-sabotaged/sabotage', new Effect_1.default((unit, city, action) => {
            const chosen = action === null || action === void 0 ? void 0 : action.chosenTarget(), cityBuild = cityBuildRegistry.getByCity(city);
            let target;
            if (chosen !== undefined) {
                target = chosen;
            }
            else {
                const Improvement = action !== undefined &&
                    sabotage.has(action)
                    ? sabotage.get(action)
                    : (0, espionage_1.randomSabotageTarget)((Type) => has(city, Type), randomNumberGenerator), production = cityBuild.progress().value() !== 0 &&
                    (0, espionage_1.sabotagesProduction)((0, espionage_1.isSpy)(unit), veteran(unit), randomNumberGenerator);
                target =
                    Improvement === null || production
                        ? espionage_1.PRODUCTION
                        : cityImprovementRegistry
                            .getByCity(city)
                            .find((improvement) => improvement instanceof Improvement &&
                            !improvement.destroyed());
            }
            if (!human(unit.player()) && !human(city.player())) {
                return;
            }
            if (target === espionage_1.PRODUCTION) {
                const building = cityBuild.building();
                cityBuild.progress().set(0);
                engine.emit('city:sabotaged', city, unit.player(), building === null ? null : building.item());
                return;
            }
            target.destroy();
            engine.emit('city:sabotaged', city, unit.player(), target);
        })),
        // Poisoned water: a city above size 1 loses 1; at size 1 (only a computer's Spy is offered it there) its food box
        //  is emptied (`unit_spy.cpp:621-626`).
        new WaterPoisoned_1.default('civ2-unit:water-poisoned/shrink', new Effect_1.default((unit, city, action) => {
            const cityGrowth = cityGrowthRegistry.getByCity(city);
            if (cityGrowth.size() < 2) {
                cityGrowth.progress().set(0);
            }
            else {
                cityGrowth.shrink(action);
            }
            engine.emit('city:water-poisoned', city, unit.player());
        })),
        // A planted device: whether the other civilizations find out (`unit_spy.cpp:693-712`).
        new DevicePlanted_1.default('civ2-unit:device-planted/discovered', new Effect_1.default((unit, city, action) => {
            var _a;
            if (diplomacy === undefined ||
                !(0, espionage_1.deviceDiscovered)(fundamentalist(unit.player()), (_a = plantedByVeteran.get(action)) !== null && _a !== void 0 ? _a : false, randomNumberGenerator)) {
                return;
            }
            (0, espionage_2.nuclearDeviceDiscovered)(diplomacy, unit.player(), engine);
        })),
        // Inciting a revolt, paid for (`unit_spy.cpp:825-846`): a computer player pays only with twice the price in hand
        //  (the original's `double_cost <= gold`); the inciter counts 2 subversions; at the doubled price it becomes the
        //  city's founder (`inciterBecomesFounder`) just before the city changes hands, with the action as the cause, for
        //  the `Captured` rules (civ2-city: the forced war, the incident, defection).
        new RevoltIncited_1.default('civ2-unit:revolt-incited/capture', new Effect_1.default((unit, city, action) => {
            const inciter = unit.player(), victim = city.player(), cost = action.cost();
            if (!human(inciter) && gold(inciter) < cost * 2) {
                return false;
            }
            if (!pay(inciter, cost)) {
                return false;
            }
            (0, missionRecords_1.addSubversions)(inciter, 2, pendingEffectRegistry);
            if (action instanceof SubvertCity_1.default) {
                inciterBecomesFounder(city, inciter);
            }
            city.capture(inciter, action);
            engine.emit('city:incited', city, inciter, victim, cost, action instanceof SubvertCity_1.default);
            return true;
        })),
        // A unit bribed (`unit_bribe`, `unit_spy.cpp:1022-1060`): a computer pays only when the price is at most half its
        //  gold. The unit's home becomes the nearest city, anyone's, if that is the briber's, and none otherwise; its
        //  moves are restored and its orders cleared. The briber counts a subversion, then goes on with its move onto the
        //  square, paying what that costs (`spy_unit_mission` returns 0, `unit_move.cpp:797-800`). No incident.
        new UnitBribed_1.default('civ2-unit:unit-bribed/transfer', new Effect_1.default((unit, target, action) => {
            const briber = unit.player(), previousOwner = target.player(), cost = action.cost();
            if (!human(briber) && Math.trunc(gold(briber) / 2) < cost) {
                return false;
            }
            if (!pay(briber, cost)) {
                return false;
            }
            (0, missionRecords_1.addSubversions)(briber, 1, pendingEffectRegistry);
            const home = (0, nearestCity_1.default)(cityRegistry, target.tile());
            target.transfer(briber, home !== null && home.player() === briber ? home : null);
            target.moves().set(target.movement());
            target.setStatus(null);
            target.setActive();
            engine.emit('unit:bribed', target, briber, previousOwner, cost);
            new Actions_1.Move(action.from(), action.to(), unit, ruleRegistry).perform();
            return true;
        })),
        // A city's investigated mark lasts until it next works its turn (`city_process`, `city.cpp:4463`).
        new ProcessYield_1.default('civ2-unit:city/process-yield/forget-investigated', new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Food), new Effect_1.default((cityYield, city) => (0, missionRecords_1.forgetCity)(city, pendingEffectRegistry))),
        // A city that changes hands, incited or taken, is no longer robbed (`city_capture_aftermath` clears
        //  `CITYF_TECH_STOLEN`, `city.cpp:5483`).
        new Captured_1.default('civ2-unit:city/captured/forget-robbed', new Effect_1.default((city) => interactionRegistry
            .entries()
            .filter((interaction) => interaction instanceof AdvanceStolen_1.default &&
            interaction.city() === city)
            .forEach((interaction) => interactionRegistry.unregister(interaction)))),
        // Units that defect to a city incited to revolt have their moves back, and lose any orders but fortifying
        //  (`city_incite_transfer`, `city.cpp:2271-2274`); after base-unit-build's defection (`High`).
        new Captured_1.default('civ2-unit:city/captured/defected-units', new Priorities_1.Low(), new Criterion_1.default((city, capturingPlayer, originalPlayer, cause) => cause instanceof InciteRevolt_1.default), new Effect_1.default((city, capturingPlayer) => [
            city.tile(),
            ...city
                .tile()
                .getNeighbours()
                .filter((tile) => cityRegistry.getByTile(tile) === null),
        ]
            .flatMap((tile) => unitRegistry.getByTile(tile))
            .filter((unit) => unit.player() === capturingPlayer && unit.city() === city)
            .forEach((unit) => {
            unit.moves().set(unit.movement());
            if (!(unit.status() instanceof Actions_1.Fortify)) {
                unit.setStatus(null);
                unit.setActive();
            }
        }))),
        // The city's investigated record goes with it.
        new Destroyed_1.default('civ2-unit:city/destroyed/forget-investigated', new Effect_1.default((city) => (0, missionRecords_1.forgetCity)(city, pendingEffectRegistry))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=espionage.js.map