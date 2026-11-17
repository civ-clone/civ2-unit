"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const PendingEffectRegistry_1 = require("@civ-clone/core-pending-effect/PendingEffectRegistry");
const DiplomaticMissions_1 = require("@civ-clone/base-unit-trait-diplomatic-missions/DiplomaticMissions");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const MissionChoice_1 = require("@civ-clone/base-unit-agent/Rules/MissionChoice");
const computerMission_1 = require("../../lib/computerMission");
const core_random_1 = require("@civ-clone/core-random");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
/**
 * A computer player's mission at a city (base-unit-agent's `MissionChoice`), as `spy_city_mission_ai_choice`
 * (`unit_spy.cpp:227-251`) chooses it: `lib/computerMission`, for the AI client to read once each time its Diplomat or
 * Spy is about to enter another player's city. It draws as the original does, once with a vendetta. Anything else (a
 * person's agent, who chooses for itself, a unit with no diplomatic missions, or the unit's own city) gets no answer and
 * draws nothing.
 */
const getRules = ({ clientRegistry = ClientRegistry_1.instance, diplomacy, pendingEffectRegistry = PendingEffectRegistry_1.instance, randomNumberGenerator = core_random_1.instance, }) => [
    new MissionChoice_1.default('civ2-unit:mission-choice/computer', new Effect_1.default((unit, city) => !unit.hasTrait(DiplomaticMissions_1.default) ||
        city.player() === unit.player() ||
        (0, isHuman_1.default)(unit.player(), clientRegistry)
        ? undefined
        : (0, computerMission_1.default)(unit, city, { ...diplomacy, pendingEffectRegistry }, randomNumberGenerator))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=missionChoice.js.map