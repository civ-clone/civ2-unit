"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.defenderRank = exports.defenderScore = exports.combatModifiers = exports.STRENGTH_SCALE = void 0;
const units_1 = require("../../data/units");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const CombatModifiers_1 = require("@civ-clone/base-combat-rounds/lib/CombatModifiers");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const strength_1 = require("./strength");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const DefenceBonusVsAir_1 = require("@civ-clone/base-unit-trait-defence-bonus-vs-air/DefenceBonusVsAir");
const DefenceBonusVsMounted_1 = require("@civ-clone/base-unit-trait-defence-bonus-vs-mounted/DefenceBonusVsMounted");
const DefenderRank_1 = require("@civ-clone/core-unit/Rules/DefenderRank");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Interceptor_1 = require("@civ-clone/base-unit-trait-interceptor/Interceptor");
const SamMissileBattery_1 = require("@civ-clone/base-city-improvement-sammissilebattery/SamMissileBattery");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const combatRoundsRules_1 = require("@civ-clone/base-combat-rounds/lib/combatRoundsRules");
const unitTable_1 = require("../../lib/unitTable");
/** Civilization II's strengths are whole numbers at 8 steps to 1 (`unit_attack_strength`, `unit_defense_strength`). */
exports.STRENGTH_SCALE = 8;
// Each unit type's `@UNITS` row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
const rowOf = (unit) => rows.get(unit.constructor);
const domainOf = (unit) => { var _a; return (_a = rowOf(unit)) === null || _a === void 0 ? void 0 : _a[1]; };
/**
 * The firepower changes of `unit_resolve_attack`, in its order, each a `CombatModifiers` rule
 *  `civ2-unit:unit/combat-modifiers/<name>`:
 * - `air-superiority-vs-no-fuel`: an air-superiority attacker against an aircraft with no range (a Helicopter): the
 *   defender's firepower is 1 (its defence is halved by the `Strength` rule of the same name);
 * - `shore-bombardment`: a ship against a land unit: both firepowers are 1;
 * - `submarine-defender`: a submarine defends at firepower 1;
 * - `ship-in-port`: a ship on land (in a city) attacked by anything but a ship: its firepower is 1, and the attacker's
 *   is doubled.
 */
const combatModifiers = () => [
    new CombatModifiers_1.default('civ2-unit:unit/combat-modifiers/air-superiority-vs-no-fuel', new Criterion_1.default((attacker, defender) => {
        var _a, _b;
        return ((_a = rowOf(attacker)) === null || _a === void 0 ? void 0 : _a[10]) === units_1.AIR_SUPERIORITY &&
            domainOf(defender) === units_1.AIR &&
            ((_b = rowOf(defender)) === null || _b === void 0 ? void 0 : _b[3]) === 0;
    }), new Effect_1.default((attacker, defender, terms) => ({
        ...terms,
        defenderFirepower: 1,
    }))),
    new CombatModifiers_1.default('civ2-unit:unit/combat-modifiers/shore-bombardment', new Criterion_1.default((attacker, defender) => domainOf(attacker) === units_1.SEA && domainOf(defender) === units_1.LAND), new Effect_1.default((attacker, defender, terms) => ({
        ...terms,
        attackerFirepower: 1,
        defenderFirepower: 1,
    }))),
    new CombatModifiers_1.default('civ2-unit:unit/combat-modifiers/submarine-defender', new Criterion_1.default((attacker, defender) => { var _a, _b; return (((_b = (_a = rowOf(defender)) === null || _a === void 0 ? void 0 : _a[12]) !== null && _b !== void 0 ? _b : 0) & units_1.SUBMARINE) !== 0; }), new Effect_1.default((attacker, defender, terms) => ({
        ...terms,
        defenderFirepower: 1,
    }))),
    new CombatModifiers_1.default('civ2-unit:unit/combat-modifiers/ship-in-port', new Criterion_1.default((attacker, defender) => domainOf(defender) === units_1.SEA &&
        defender.tile().isLand() &&
        domainOf(attacker) !== units_1.SEA), new Effect_1.default((attacker, defender, terms) => ({
        ...terms,
        attackerFirepower: terms.attackerFirepower * 2,
        defenderFirepower: 1,
    }))),
];
exports.combatModifiers = combatModifiers;
/**
 * How well `candidate` would defend its square against `attacker`, as `unit_stack_best_defender` scores it:
 * - its defence as `unit_defense_strength` gives it (the type's defence at 8 steps to 1, times the terrain, river and
 *   the one bonus `defenceMultipliers` chooses, then a veteran's half), not the battle's: the Pikemen's ×1.5, AEGIS's
 *   ×3 or ×5 and the city's defences aren't in it;
 * - times its hit points left over its maximum, truncated;
 * - +1 for a unit with the bonus against mounted units (the Pikemen's tie-break);
 * - for a unit with the bonus against aircraft, ×3 against an aircraft, ×5 against a missile;
 * - ×2 for an interceptor against another interceptor;
 * - a ship in a city: ×2 against an aircraft when the city has no SAM Battery, otherwise halved (truncated);
 * - a land unit on the sea (aboard a ship) can't defend: `-Infinity`.
 *
 * The original gives a tie to the later unit on the square; core-unit keeps the earlier one in a tie, so each score
 *  adds the unit's place on the square over a million, which only ever separates equal whole-number scores.
 */
const defenderScore = (dependencies = {}) => (attacker, candidate) => {
    const { cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, } = dependencies, row = rowOf(candidate), tile = candidate.tile();
    if (row === undefined) {
        return candidate.defence().value();
    }
    if (row[1] === units_1.LAND && tile.isWater()) {
        return -Infinity;
    }
    let score = Math.round((0, strength_1.defenceMultipliers)(dependencies)(candidate, attacker).reduce((total, [, multiplier]) => total * multiplier, row[5] * exports.STRENGTH_SCALE));
    if (unitImprovementRegistry
        .getByUnit(candidate)
        .some((improvement) => improvement instanceof Veteran_1.default)) {
        score += score >> 1;
    }
    const [remaining, maximum] = candidate.hitPoints();
    if (maximum > 0) {
        score = Math.trunc((remaining * score) / maximum);
    }
    if (candidate.hasTrait(DefenceBonusVsMounted_1.default)) {
        score++;
    }
    const attackerIsAir = domainOf(attacker) === units_1.AIR;
    if (candidate.hasTrait(DefenceBonusVsAir_1.default) && attackerIsAir) {
        score *= attacker.hasTrait(SingleUse_1.default) ? 5 : 3;
    }
    if (candidate.hasTrait(Interceptor_1.default) &&
        attackerIsAir &&
        attacker.hasTrait(Interceptor_1.default)) {
        score *= 2;
    }
    const city = cityRegistry.getByTile(tile);
    if (row[1] === units_1.SEA && city !== null) {
        score =
            attackerIsAir &&
                !cityImprovementRegistry
                    .getByCity(city)
                    .some((improvement) => improvement instanceof SamMissileBattery_1.default)
                ? score * 2
                : Math.trunc(score / 2);
    }
    return score + unitRegistry.getByTile(tile).indexOf(candidate) / 1e6;
};
exports.defenderScore = defenderScore;
/** `defenderScore` as the `DefenderRank` rule `civ2-unit:unit/defender-rank`. */
const defenderRank = (dependencies = {}) => {
    const score = (0, exports.defenderScore)(dependencies);
    return [
        new DefenderRank_1.default('civ2-unit:unit/defender-rank', new Effect_1.default((attacker, candidate, attack, defence) => score(attacker, candidate))),
    ];
};
exports.defenderRank = defenderRank;
/**
 * Civilization II's battles: fought in rounds at 8 steps to 1 (`unit_resolve_attack_fight`, base-combat-rounds), with
 *  the firepower changes of `combatModifiers` and the defender `defenderRank` chooses.
 */
const getRules = (dependencies = {}) => {
    var _a;
    return [
        ...(0, combatRoundsRules_1.default)({ ruleRegistry: (_a = dependencies.ruleRegistry) !== null && _a !== void 0 ? _a : RuleRegistry_1.instance }, { id: 'civ2-unit:unit/combat-resolver', strengthScale: exports.STRENGTH_SCALE }),
        ...(0, exports.combatModifiers)(),
        ...(0, exports.defenderRank)(dependencies),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=combat.js.map