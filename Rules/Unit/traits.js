"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.traitsOf = exports.TRAIT_RULE_PREFIX = void 0;
const units_1 = require("../../data/units");
const UnitTraits_1 = require("@civ-clone/core-unit/Rules/UnitTraits");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Amphibious_1 = require("@civ-clone/base-unit-trait-amphibious/Amphibious");
const Carries_1 = require("@civ-clone/base-unit-trait-carries/Carries");
const CoastBound_1 = require("@civ-clone/base-unit-trait-coast-bound/CoastBound");
const Covert_1 = require("@civ-clone/base-unit-trait-covert/Covert");
const DefenceBonusVsAir_1 = require("@civ-clone/base-unit-trait-defence-bonus-vs-air/DefenceBonusVsAir");
const DefenceBonusVsMounted_1 = require("@civ-clone/base-unit-trait-defence-bonus-vs-mounted/DefenceBonusVsMounted");
const DetectsSubmerged_1 = require("@civ-clone/base-unit-trait-detects-submerged/DetectsSubmerged");
const Detonates_1 = require("@civ-clone/base-unit-trait-detonates/Detonates");
const DiplomaticMissions_1 = require("@civ-clone/base-unit-trait-diplomatic-missions/DiplomaticMissions");
const Fortifies_1 = require("@civ-clone/base-unit-trait-fortifies/Fortifies");
const FoundsCities_1 = require("@civ-clone/base-unit-trait-founds-cities/FoundsCities");
const Fundamentalism_1 = require("@civ-clone/base-government-fundamentalism/Fundamentalism");
const IgnoresFortifications_1 = require("@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications");
const IgnoresZoneOfControl_1 = require("@civ-clone/base-unit-trait-ignores-zone-of-control/IgnoresZoneOfControl");
const Interceptor_1 = require("@civ-clone/base-unit-trait-interceptor/Interceptor");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const NonCombatant_1 = require("@civ-clone/base-unit-trait-non-combatant/NonCombatant");
const Paradrop_1 = require("@civ-clone/base-unit-trait-paradrop/Paradrop");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
const Units_1 = require("../../Units");
const Submerged_1 = require("@civ-clone/base-unit-trait-submerged/Submerged");
const SupportExemptUnder_1 = require("@civ-clone/base-unit-trait-support-exempt-under/SupportExemptUnder");
const TerrainAsRoad_1 = require("@civ-clone/base-unit-trait-terrain-as-road/TerrainAsRoad");
const Terraforms_1 = require("@civ-clone/base-unit-trait-terraforms/Terraforms");
const TradeMissions_1 = require("@civ-clone/base-unit-trait-trade-missions/TradeMissions");
const unitTable_1 = require("../../lib/unitTable");
/** The prefix of every trait declaration's id: `civ2-unit:unit/trait/<Unit>/<Trait>`. */
exports.TRAIT_RULE_PREFIX = 'civ2-unit:unit/trait';
/**
 * What a `@UNITS` row gives its unit type beyond its domain, in a fixed order: the flags (column 13), the role (column
 *  11: 5 settles, 6 diplomacy, 7 trade), and the numbers that mean an ability (an attack of 99 detonates; a ship with a
 *  hold carries land units). OpenCiv2 asks the same columns (`civ_can_build_unit`, `unit_resolve_attack`,
 *  `unit_move_dir_step_cost`, `unit_defense_strength`).
 */
const traitsOf = (row) => {
    const [, domain, , , attack, , , , , hold, role, , flags] = row, has = (flag) => (flags & flag) !== 0;
    return [
        // Every land unit but Settlers and Engineers, whose fortify key builds a fortress instead. Diplomats, Caravans and
        //  Explorers fortify too, as civ1-unit's do: not checked against OpenCiv2.
        ...(domain === units_1.LAND && role !== units_1.SETTLE ? [Fortifies_1.default] : []),
        ...(role === units_1.SETTLE ? [FoundsCities_1.default, Terraforms_1.default] : []),
        // A land unit with no attack, other than a settler, fights no one, takes no city and pillages nothing:
        //  Diplomats, Spies, Caravans, Freight and Explorers (civ1-unit's `NonCombatant`, read from the attack column; the
        //  Explorer's part is not checked against OpenCiv2).
        ...(domain === units_1.LAND && attack === 0 && role !== units_1.SETTLE
            ? [NonCombatant_1.default]
            : []),
        ...(role === units_1.DIPLOMACY ? [DiplomaticMissions_1.default] : []),
        ...(role === units_1.TRADE ? [TradeMissions_1.default] : []),
        ...(has(units_1.IGNORES_ZONES_OF_CONTROL) ? [IgnoresZoneOfControl_1.default] : []),
        ...(has(units_1.AMPHIBIOUS) ? [Amphibious_1.default] : []),
        ...(has(units_1.SUBMARINE) ? [Submerged_1.default] : []),
        ...(has(units_1.ATTACKS_AIR) ? [Interceptor_1.default] : []),
        ...(has(units_1.COAST_BOUND) ? [CoastBound_1.default] : []),
        ...(has(units_1.IGNORES_CITY_WALLS) ? [IgnoresFortifications_1.default] : []),
        ...(has(units_1.PARADROPS) ? [Paradrop_1.default] : []),
        ...(has(units_1.TREATS_ALL_AS_ROAD) ? [TerrainAsRoad_1.default] : []),
        // Flag 10's defence bonus is ×1.5 in the code (`unit_resolve_attack`).
        ...(has(units_1.DEFENCE_BONUS_VS_MOUNTED) ? [new DefenceBonusVsMounted_1.default(1.5)] : []),
        ...(has(units_1.FUNDAMENTALISM_FREE_SUPPORT)
            ? [new SupportExemptUnder_1.default(Fundamentalism_1.default)]
            : []),
        ...(has(units_1.DESTROYED_AFTER_ATTACKING) ? [SingleUse_1.default] : []),
        // Flag 13's is ×3 against aircraft and ×5 against missiles (`unit_resolve_attack`).
        ...(has(units_1.DEFENCE_BONUS_VS_AIR) ? [new DefenceBonusVsAir_1.default(3, 5)] : []),
        ...(has(units_1.DETECTS_SUBMARINES) ? [DetectsSubmerged_1.default] : []),
        ...(attack >= units_1.NUCLEAR_ATTACK ? [Detonates_1.default] : []),
        ...(has(units_1.CARRIES_AIR) ? [new Carries_1.default(Air_1.default)] : []),
        ...(domain === units_1.SEA && hold > 0 && !has(units_1.CARRIES_AIR)
            ? [new Carries_1.default(Land_1.default)]
            : []),
    ];
};
exports.traitsOf = traitsOf;
/**
 * What each Civilization II unit type can do beyond what its domain (`Land`, `Naval`, `Air`) gives it, from its
 *  `@UNITS` row, declared on the leaf class. The Spy's extra missions are its identity, not a column: it is `Covert`.
 */
const getRules = () => [
    ...units_1.units.flatMap((row, index) => {
        const traits = (0, exports.traitsOf)(row);
        return traits.length === 0
            ? []
            : (0, UnitTraits_1.unitTraits)(exports.TRAIT_RULE_PREFIX, unitTable_1.unitTypes[index], ...traits);
    }),
    ...(0, UnitTraits_1.unitTraits)(exports.TRAIT_RULE_PREFIX, Units_1.Spy, Covert_1.default),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=traits.js.map