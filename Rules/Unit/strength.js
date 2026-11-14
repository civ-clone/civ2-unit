"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.defenceMultipliers = void 0;
const units_1 = require("../../data/units");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const TerrainFeatureRegistry_1 = require("@civ-clone/core-terrain-feature/TerrainFeatureRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const CityWalls_1 = require("@civ-clone/base-city-improvement-citywalls/CityWalls");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const DefenceBonusVsAir_1 = require("@civ-clone/base-unit-trait-defence-bonus-vs-air/DefenceBonusVsAir");
const DefenceBonusVsMounted_1 = require("@civ-clone/base-unit-trait-defence-bonus-vs-mounted/DefenceBonusVsMounted");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fortified_1 = require("@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified");
const IgnoresFortifications_1 = require("@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications");
const Interceptor_1 = require("@civ-clone/base-unit-trait-interceptor/Interceptor");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const Units_1 = require("../../Units");
const TerrainFeatures_1 = require("@civ-clone/civ2-world/TerrainFeatures");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const Strength_1 = require("@civ-clone/core-unit/Rules/Strength");
const terrainTable_1 = require("@civ-clone/base-terrain-properties/lib/terrainTable");
const terrainProperties_1 = require("@civ-clone/civ2-world/lib/terrainProperties");
const defenceMultipliers_1 = require("@civ-clone/base-unit-yield/lib/defenceMultipliers");
const unitTable_1 = require("../../lib/unitTable");
// A terrain's defence in half steps (2 is ×1), looked up by class.
const terrainHalves = (0, terrainTable_1.cachedTerrainLookup)(terrainProperties_1.defence.map(([TerrainType, multiplier]) => [
    TerrainType,
    multiplier * 2,
]));
// Each unit type's `@UNITS` row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
const rowOf = (unit) => rows.get(unit.constructor);
/**
 * Civilization II's defence bonuses for `defender` against `attacker` (`null`: against any), as named multipliers
 *  (`unit_defense_strength`): the terrain's half steps, plus one for a river; then a fortified land unit ×1.5, or in a
 *  city with City Walls ×3 for a land unit against a land attacker that doesn't ignore them (the walls replace being
 *  fortified); and an interceptor in a city against an aircraft that isn't a missile ×4, or ×2 against another
 *  interceptor. Any other unit in a city, and every unit but a land unit outside one, gets no bonus beyond the terrain.
 */
const defenceMultipliers = ({ cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, terrainFeatureRegistry = TerrainFeatureRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, } = {}) => (defender, attacker) => {
    var _a;
    const tile = defender.tile(), terrain = tile.terrain(), halves = (_a = terrainHalves(terrain)) !== null && _a !== void 0 ? _a : 2, river = terrainFeatureRegistry
        .getByTerrain(terrain)
        .some((feature) => feature instanceof TerrainFeatures_1.River), multipliers = [];
    if (halves !== 2) {
        multipliers.push([terrain.constructor.name, halves / 2]);
    }
    if (river) {
        multipliers.push([TerrainFeatures_1.River.name, (halves + 1) / halves]);
    }
    const city = cityRegistry.getByTile(tile), isLand = defender instanceof Land_1.default;
    if (city === null) {
        if (isLand &&
            unitImprovementRegistry
                .getByUnit(defender)
                .some((improvement) => improvement instanceof Fortified_1.default)) {
            multipliers.push([Fortified_1.default.name, 1.5]);
        }
        return multipliers;
    }
    if (defender instanceof Air_1.default &&
        attacker !== null &&
        defender.hasTrait(Interceptor_1.default) &&
        attacker instanceof Air_1.default &&
        !attacker.hasTrait(SingleUse_1.default)) {
        multipliers.push([
            Interceptor_1.default.name,
            attacker.hasTrait(Interceptor_1.default) ? 2 : 4,
        ]);
        return multipliers;
    }
    if (!isLand) {
        return multipliers;
    }
    if ((attacker === null ||
        (attacker instanceof Land_1.default &&
            !attacker.hasTrait(IgnoresFortifications_1.default))) &&
        cityImprovementRegistry
            .getByCity(city)
            .some((improvement) => improvement instanceof CityWalls_1.default)) {
        multipliers.push([CityWalls_1.default.name, 3]);
        return multipliers;
    }
    if (unitImprovementRegistry
        .getByUnit(defender)
        .some((improvement) => improvement instanceof Fortified_1.default)) {
        multipliers.push([Fortified_1.default.name, 1.5]);
    }
    return multipliers;
};
exports.defenceMultipliers = defenceMultipliers;
// A land attacker with two moves and one hit point (10): "mounted", for the Pikemen's bonus (`unit_resolve_attack`).
const isMounted = (unit) => {
    const row = rowOf(unit);
    return row !== undefined && row[1] === units_1.LAND && row[2] === 2 && row[6] === 1;
};
/**
 * Civilization II's battle modifiers (`unit_resolve_attack`), after the defence bonuses: an air-superiority attacker
 *  halves an aircraft's defence when it has no fuel (a Helicopter); a `DefenceBonusVsMounted` defender against a mounted
 *  attacker, and a `DefenceBonusVsAir` one against an aircraft or missile, multiply their defence; Partisans attack a
 *  unit with no attack at eight times their strength.
 */
const getRules = (dependencies = {}) => [
    (0, defenceMultipliers_1.defenceStrength)((0, exports.defenceMultipliers)(dependencies)),
    new Strength_1.default('civ2-unit:unit/strength/air-superiority-vs-no-fuel', new Criterion_1.default((attacker, defender) => {
        const attackerRow = rowOf(attacker), defenderRow = rowOf(defender);
        return (attackerRow !== undefined &&
            defenderRow !== undefined &&
            attackerRow[10] === units_1.AIR_SUPERIORITY &&
            defender instanceof Air_1.default &&
            defenderRow[3] === 0);
    }), new Effect_1.default((attacker, defender, attack, defence) => defence.add(-defence.value() / 2, 'AirSuperiority'))),
    new Strength_1.default('civ2-unit:unit/strength/defence-vs-mounted', new Criterion_1.default((attacker, defender) => defender.hasTrait(DefenceBonusVsMounted_1.default) && isMounted(attacker)), new Effect_1.default((attacker, defender, attack, defence) => {
        const [bonus] = defender.traits(DefenceBonusVsMounted_1.default);
        defence.add(defence.value() * (bonus.multiplier - 1), DefenceBonusVsMounted_1.default.name);
    })),
    new Strength_1.default('civ2-unit:unit/strength/defence-vs-air', new Criterion_1.default((attacker, defender) => attacker instanceof Air_1.default && defender.hasTrait(DefenceBonusVsAir_1.default)), new Effect_1.default((attacker, defender, attack, defence) => {
        const [bonus] = defender.traits(DefenceBonusVsAir_1.default), multiplier = attacker.hasTrait(SingleUse_1.default)
            ? bonus.vsSingleUse
            : bonus.multiplier;
        defence.add(defence.value() * (multiplier - 1), DefenceBonusVsAir_1.default.name);
    })),
    new Strength_1.default('civ2-unit:unit/strength/partisans-vs-non-combatant', new Criterion_1.default((attacker, defender) => { var _a; return attacker instanceof Units_1.Partisan && ((_a = rowOf(defender)) === null || _a === void 0 ? void 0 : _a[4]) === 0; }), new Effect_1.default((attacker, defender, attack) => attack.add(attack.value() * 7, Units_1.Partisan.name))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=strength.js.map