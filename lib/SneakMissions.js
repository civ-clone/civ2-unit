"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SneakPoisonWater = exports.SneakIndustrialSabotage = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const IndustrialSabotage_1 = require("@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage");
const PoisonWater_1 = require("@civ-clone/base-unit-action-poison-water/PoisonWater");
// A person's sabotage or poisoning in the city of a civilization it has a ceasefire, a peace or an alliance with. The
//  original warns first (`spy_confirm_treaty_breach`, `unit_spy.cpp:130-146`) and, once confirmed, carries out the
//  mission as ever: the treaty is broken only by the incident that follows if the agent is lost (civ2-diplomacy's
//  `AgentLost` rule). `enemy()` names the partner, as base-unit-action-steal-technology's `SneakStealTechnology` does,
//  so a client knows to warn; civ2-unit's `forcedWar` leaves these missions' treaties alone.
/** Industrial sabotage across a treaty: a person is warned first. */
class SneakIndustrialSabotage extends IndustrialSabotage_1.default {
    constructor(from, to, unit, city, enemy, ruleRegistry = RuleRegistry_1.instance) {
        super(from, to, unit, city, ruleRegistry);
        this._enemy = enemy;
        this.addKey('enemy');
    }
    enemy() {
        return this._enemy;
    }
    // Typed as `Action`: a subclass with a member of its own isn't assignable to it (civ-clone/web-renderer#21).
    forUnit(unit) {
        return new SneakIndustrialSabotage(this.from(), this.to(), unit, this._city, this._enemy, this.ruleRegistry());
    }
}
exports.SneakIndustrialSabotage = SneakIndustrialSabotage;
/** Poisoning a city's water across a treaty: a person is warned first. */
class SneakPoisonWater extends PoisonWater_1.default {
    constructor(from, to, unit, city, enemy, ruleRegistry = RuleRegistry_1.instance) {
        super(from, to, unit, city, ruleRegistry);
        this._enemy = enemy;
        this.addKey('enemy');
    }
    enemy() {
        return this._enemy;
    }
    // Typed as `Action`: a subclass with a member of its own isn't assignable to it (civ-clone/web-renderer#21).
    forUnit(unit) {
        return new SneakPoisonWater(this.from(), this.to(), unit, this._city, this._enemy, this.ruleRegistry());
    }
}
exports.SneakPoisonWater = SneakPoisonWater;
//# sourceMappingURL=SneakMissions.js.map