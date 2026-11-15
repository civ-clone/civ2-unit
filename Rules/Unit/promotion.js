"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const combat_1 = require("./combat");
const core_random_1 = require("@civ-clone/core-random");
const combatRoundsRules_1 = require("@civ-clone/base-combat-rounds/lib/combatRoundsRules");
const veteranPromotionRules_1 = require("@civ-clone/base-unit-veteran-promotion/lib/veteranPromotionRules");
/**
 * The winner of a battle becomes a veteran with a chance of the loser's strength over both (`unit_resolve_attack_veterans`,
 *  `unit_promote_veteran`), at the strengths the battle was fought at (base-combat-rounds' `roundsStrengths`, after the
 *  `CombatModifiers` rules), 8 steps to 1. A missile (`SingleUse`) never is. Sun Tzu's War Academy makes it certain:
 *  civ2-wonder answers `PromotionChance`. `civ2-unit:unit/defeated/promotion`, `High`, before the loser is destroyed.
 */
const getRules = ({ randomNumberGenerator = core_random_1.instance, ruleRegistry = RuleRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, } = {}) => (0, veteranPromotionRules_1.default)({ randomNumberGenerator, ruleRegistry, unitImprovementRegistry }, {
    id: 'civ2-unit:unit/defeated/promotion',
    strengthScale: combat_1.STRENGTH_SCALE,
    strengths: (0, combatRoundsRules_1.roundsStrengths)(ruleRegistry),
});
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=promotion.js.map