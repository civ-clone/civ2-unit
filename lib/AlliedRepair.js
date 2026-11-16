"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlliedRepair = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const Action_1 = require("@civ-clone/core-unit/Action");
const MovedThisTurn_1 = require("@civ-clone/base-unit-healing/lib/MovedThisTurn");
/**
 * A unit moving onto an ally's city (OpenCiv2 `unit_move_dir`, `src/auto/unit_move.cpp:803-830`): it doesn't go in,
 *  but is repaired `steps` tenths of its maximum hit points (2 when the city has Barracks, else 1), never more than its
 *  damage, and its turn ends. The original also clears the unit's "moved" flag, so it counts as having rested when its
 *  player's units next heal (base-unit-healing's `MovedThisTurn` is taken off). No `Moved` rule is processed: the unit
 *  stays where it was.
 */
class AlliedRepair extends Action_1.default {
    constructor(from, to, unit, city, steps = 1, unitImprovementRegistry = UnitImprovementRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance) {
        super(from, to, unit, ruleRegistry);
        this._city = city;
        this._steps = steps;
        this._unitImprovementRegistry = unitImprovementRegistry;
        this.addKey('city');
    }
    // `Action.forUnit` rebuilds an action from `(from, to, unit, ruleRegistry)`, which would put the `RuleRegistry` where
    //  the city goes.
    forUnit(unit) {
        return new AlliedRepair(this.from(), this.to(), unit, this._city, this._steps, this._unitImprovementRegistry, this.ruleRegistry());
    }
    city() {
        return this._city;
    }
    /** The hit points the repair restores: `steps` tenths of the maximum, truncated, at most the damage. */
    amount() {
        const unit = this.unit(), [, maximum] = unit.hitPoints();
        return Math.max(0, Math.min(Math.floor(maximum / 10) * this._steps, unit.damage()));
    }
    perform() {
        const unit = this.unit(), amount = this.amount();
        if (amount > 0) {
            unit.setDamage(unit.damage() - amount);
        }
        unit.moves().set(0);
        const marks = this._unitImprovementRegistry
            .getByUnit(unit)
            .filter((improvement) => improvement instanceof MovedThisTurn_1.default);
        if (marks.length > 0) {
            this._unitImprovementRegistry.unregister(...marks);
        }
    }
}
exports.AlliedRepair = AlliedRepair;
exports.default = AlliedRepair;
//# sourceMappingURL=AlliedRepair.js.map