"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computerMission = void 0;
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const Democracy_1 = require("@civ-clone/base-government-democracy/Democracy");
const espionage_1 = require("./espionage");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const espionage_2 = require("../Rules/Unit/espionage");
const missionRecords_1 = require("./missionRecords");
const standing_1 = require("@civ-clone/civ2-diplomacy/lib/standing");
/** King's level (0 Chieftain to 5 Deity). */
const KING = 3;
/**
 * The mission a computer player's Diplomat or Spy (`unit`) chooses at `city`, as `spy_city_mission_ai_choice`
 *  (`unit_spy.cpp:227-251`) does, for stage W's AI to read. In order, from a theft:
 * 1. holding a vendetta against the city's owner, a Spy poisons the water one time in three (one draw of `random`,
 *    made only with a vendetta);
 * 2. at peace (an alliance included), a theft;
 * 3. above King, or at King once the owner has more than 5 subversions, at war or with a vendetta, against anyone but
 *    a Democracy, a theft becomes an incited revolt;
 * 4. allied, a theft;
 * 5. a Diplomat at a city already robbed sabotages instead, or, under a ceasefire, a peace or an alliance, makes an
 *    embassy.
 *
 * Then, as the original's missions do when they can't be carried out (`spy_city_mission`'s loop): a theft with nothing
 *  to take becomes a sabotage, or an embassy under a treaty (`unit_spy.cpp:432-437`); an incited revolt the player
 *  can't pay twice over becomes a theft (`:851`); an embassy there already is becomes an investigation (`:290`). Those
 *  are the AI's to follow, from which rows are offered.
 */
const computerMission = (unit, city, dependencies, random) => {
    const player = unit.player(), owner = city.player(), level = (0, treatyLevel_1.treatyLevel)(dependencies, player, owner), holdsVendetta = (0, standing_1.vendetta)(dependencies, player, owner), spy = (0, espionage_1.isSpy)(unit);
    let choice = 'steal-technology';
    if (holdsVendetta && Math.floor(random() * 3) === 0 && spy) {
        choice = 'poison-water';
    }
    if (level >= treatyLevel_1.TreatyLevel.Peace) {
        choice = 'steal-technology';
    }
    const difficulty = (0, level_1.levelOf)(dependencies.gameDifficultyRegistry);
    let democracy = false;
    try {
        democracy = dependencies.playerGovernmentRegistry
            .getByPlayer(owner)
            .is(Democracy_1.default);
    }
    catch (e) {
        democracy = false;
    }
    if ((difficulty > KING ||
        (difficulty === KING &&
            (0, missionRecords_1.subversions)(owner, dependencies.pendingEffectRegistry) > 5)) &&
        choice === 'steal-technology' &&
        (holdsVendetta || level === treatyLevel_1.TreatyLevel.War) &&
        !democracy) {
        choice = 'incite-revolt';
    }
    if (level === treatyLevel_1.TreatyLevel.Alliance) {
        choice = 'steal-technology';
    }
    if ((0, espionage_2.robbed)(city, dependencies.interactionRegistry) &&
        !spy &&
        choice === 'steal-technology') {
        choice =
            level >= treatyLevel_1.TreatyLevel.Ceasefire
                ? 'establish-embassy'
                : 'industrial-sabotage';
    }
    return choice;
};
exports.computerMission = computerMission;
exports.default = exports.computerMission;
//# sourceMappingURL=computerMission.js.map