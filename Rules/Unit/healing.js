"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.HEAL_UNITS_RULE = exports.domainUnitType = exports.domainUnitTypes = exports.healingFacilities = void 0;
const units_1 = require("../../data/units");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const LandMassRegistry_1 = require("@civ-clone/core-world/LandMassRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const Barracks_1 = require("@civ-clone/base-city-improvement-barracks/Barracks");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Description_1 = require("@civ-clone/core-rule/Description");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const Naval_1 = require("@civ-clone/base-unit-type-naval/Naval");
const PortFacility_1 = require("@civ-clone/base-city-improvement-portfacility/PortFacility");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const damagedMovementRules_1 = require("@civ-clone/base-unit-healing/lib/damagedMovementRules");
const describedRule_1 = require("../../lib/describedRule");
const distance_1 = require("../../lib/distance");
const healingRules_1 = require("@civ-clone/base-unit-healing/lib/healingRules");
const unitTable_1 = require("../../lib/unitTable");
// Each unit type's `@UNITS` row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
const domainOf = (unit) => { var _a; return (_a = rows.get(unit.constructor)) === null || _a === void 0 ? void 0 : _a[1]; };
/** The improvement that heals a unit of each domain fully in a city (`civ_heal_units`). */
exports.healingFacilities = [
    [units_1.LAND, Barracks_1.default],
    [units_1.AIR, Airport_1.default],
    [units_1.SEA, PortFacility_1.default],
];
/** The unit type of each domain, as a description names it (civ-clone/web-renderer#1196). */
exports.domainUnitTypes = [
    [units_1.LAND, Land_1.default],
    [units_1.AIR, Air_1.default],
    [units_1.SEA, Naval_1.default],
];
/** The unit type of a domain. */
const domainUnitType = (domain) => exports.domainUnitTypes.find(([unitDomain]) => unitDomain === domain)[1];
exports.domainUnitType = domainUnitType;
/** The rule of base-unit-healing's that heals, which says what each of `healingFacilities` does. */
exports.HEAL_UNITS_RULE = 'civ2-unit:player/turn-start/heal-units';
/**
 * Civilization II's healing (`civ_heal_units`, at the start of each of the player's turns, for the units that didn't
 *  move in their last one) and the slowing of damaged units (`unit_max_moves`):
 * - a step is a tenth of the unit's hit points; 1 step resting, 2 on a Fortress;
 * - a land unit within 3 (`map_distance`) of its player's nearest city on its land mass heals 1 step more, or 2 if
 *   that city has Barracks;
 * - twice as many in one of its player's cities;
 * - fully in a city with its domain's facility (Barracks, Airport, Port Facility), and an aircraft fully on an
 *   Airbase;
 * - a Helicopter (an aircraft with no range) that moved and isn't in a city or on an airbase loses a step, but never
 *   its last hit point;
 * - a damaged land unit or ship has its moves cut in proportion to its hit points, in thirds of a move rounded up to a
 *   whole move, at least 1 on land and 2 at sea; aircraft aren't slowed.
 */
const getRules = ({ cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, } = {}) => {
    const hasImprovement = (tile, Improvement) => tileImprovementRegistry
        .getByTile(tile)
        .some((improvement) => improvement instanceof Improvement), cityHas = (city, Improvement) => cityImprovementRegistry
        .getByCity(city)
        .some((improvement) => improvement instanceof Improvement), facilityFor = (unit) => {
        var _a;
        return (_a = exports.healingFacilities.find(([domain]) => domain === domainOf(unit))) === null || _a === void 0 ? void 0 : _a[1];
    };
    return [
        ...(0, healingRules_1.default)({
            cityRegistry,
            landMassRegistry,
            unitImprovementRegistry,
            unitRegistry,
        }, {
            prefix: 'civ2-unit',
            stepsPerMaximum: 10,
            restSteps: (unit) => hasImprovement(unit.tile(), TileImprovements_1.Fortress) ? 2 : 1,
            nearCity: {
                distance: 3,
                appliesTo: (unit) => domainOf(unit) === units_1.LAND,
                steps: (unit, city) => cityHas(city, Barracks_1.default) ? 2 : 1,
            },
            inCityMultiplier: 2,
            fullHeal: (unit, city) => {
                const Facility = facilityFor(unit);
                return ((city !== null &&
                    Facility !== undefined &&
                    cityHas(city, Facility)) ||
                    (domainOf(unit) === units_1.AIR && hasImprovement(unit.tile(), TileImprovements_1.Airbase)));
            },
            decay: {
                appliesTo: (unit) => {
                    var _a;
                    return domainOf(unit) === units_1.AIR &&
                        ((_a = rows.get(unit.constructor)) === null || _a === void 0 ? void 0 : _a[3]) === 0 &&
                        cityRegistry.getByTile(unit.tile()) === null &&
                        !hasImprovement(unit.tile(), TileImprovements_1.Airbase);
                },
                steps: 1,
            },
            distance: distance_1.default,
        }).map((rule) => rule.id() === exports.HEAL_UNITS_RULE
            ? (0, describedRule_1.describedRule)(rule, new Description_1.default(...exports.healingFacilities.map(([domain, Facility]) => ({
                type: 'heals',
                subject: Facility,
                unit: (0, exports.domainUnitType)(domain),
            }))))
            : rule),
        ...(0, damagedMovementRules_1.default)({
            id: 'civ2-unit:unit/yield/damaged-movement',
            stepsPerMove: cosmic_1.cosmic.roadMoveMultiplier,
            minimum: (unit) => (domainOf(unit) === units_1.SEA ? 2 : 1),
            appliesTo: (unit) => domainOf(unit) !== undefined && domainOf(unit) !== units_1.AIR,
        }),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=healing.js.map