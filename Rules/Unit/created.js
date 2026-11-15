"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const Communism_1 = require("@civ-clone/base-government-communism/Communism");
const Created_1 = require("@civ-clone/core-unit/Rules/Created");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
// Under Communism a unit of the diplomacy role built in a city is a veteran: OpenCiv2 `city_process_production_unit`
//  (`src/auto/city_production.cpp`, richardpenman/civ2@49f26ec) sets the flag for `ROLE_DIPLOMACY` when the builder's
//  government is `GOV_COMMUNISM`, ahead of (and instead of) the Barracks test, and the computer's own diplomat path in
//  the same function does it too. That role is the Diplomat's and the Spy's, so both are built veteran (survey Q23
//  follows the code). Barracks and the like are civ2-city-improvement's, which leaves this role out.
const getRules = ({ playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, } = {}) => [
    new Created_1.default('civ2-unit:unit/created/veteran/communism', new Criterion_1.default((unit) => unit.city() !== null), new Criterion_1.default((unit) => (0, roleOf_1.hasRole)(unit, Roles_1.DiplomacyRole, ruleRegistry)), new Criterion_1.default((unit) => {
        try {
            return playerGovernmentRegistry
                .getByPlayer(unit.player())
                .is(Communism_1.default);
        }
        catch (e) {
            return false;
        }
    }), new Effect_1.default((unit) => unitImprovementRegistry.register(new Veteran_1.default(unit)))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=created.js.map