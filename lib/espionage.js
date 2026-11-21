"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTION = exports.deviceDiscovered = exports.sabotagesProduction = exports.randomSabotageTarget = exports.improvementOrder = exports.theftOrder = exports.detected = exports.detectionChance = exports.isSettlerRole = exports.bribeCost = exports.DOUBLED_PRICE_BELOW = exports.inciteCost = exports.COURTHOUSE_DISTANCE_DIVISOR = exports.isDiplomacyUnit = exports.isTradeUnit = exports.unitRow = exports.isVeteran = exports.isSpy = void 0;
const CityImprovements = require("@civ-clone/civ2-city-improvement/CityImprovements");
const units_1 = require("../data/units");
const advances_1 = require("@civ-clone/civ2-science/data/advances");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const Units_1 = require("../Units");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const unitTable_1 = require("./unitTable");
// The numbers of Civilization II's Diplomat and Spy missions (OpenCiv2 `src/auto/unit_spy.cpp`, at e39fe7b), as pure
//  functions, so each can be tested at its boundaries. Integer arithmetic is done in the original's order: each
//  division rounds toward zero before the next step.
/** Whether `unit` is a Spy (`units[unit].type == UNIT_SPY`); a Diplomat is not. */
const isSpy = (unit) => unit instanceof Units_1.Spy;
exports.isSpy = isSpy;
/** Whether `unit` is a veteran (`UNITF_VETERAN`). */
const isVeteran = (unit, unitImprovementRegistry = UnitImprovementRegistry_1.instance) => unitImprovementRegistry
    .getByUnit(unit)
    .some((improvement) => improvement instanceof Veteran_1.default);
exports.isVeteran = isVeteran;
/** The `@UNITS` row of `unit`'s type, if it is one of Civ2's. */
const unitRow = (unit) => {
    const index = unitTable_1.unitTypes.indexOf(unit.constructor);
    return index < 0 ? undefined : units_1.units[index];
};
exports.unitRow = unitRow;
/** Whether `unit`'s role is the Caravan's and Freight's (`ROLE_TRADE`). */
const isTradeUnit = (unit) => { var _a; return ((_a = (0, exports.unitRow)(unit)) === null || _a === void 0 ? void 0 : _a[10]) === units_1.TRADE; };
exports.isTradeUnit = isTradeUnit;
/** Whether `unit`'s role is the Diplomat's and Spy's (`ROLE_DIPLOMACY`). */
const isDiplomacyUnit = (unit) => { var _a; return ((_a = (0, exports.unitRow)(unit)) === null || _a === void 0 ? void 0 : _a[10]) === units_1.DIPLOMACY; };
exports.isDiplomacyUnit = isDiplomacyUnit;
/** With a Courthouse, a city's distance from its owner's capital counts this many times less in its price to incite. */
exports.COURTHOUSE_DISTANCE_DIVISOR = 2;
/**
 * The price to incite a city, `spy_city_mission_incite_revolt` (`unit_spy.cpp:759-786`), in the original's order:
 * - the distance, at most 10 for a Communist victim, then halved with a Courthouse;
 * - `size × ((gold + 1000) / (distance + 3))`, the division first; 30000 if that overflows a 32-bit integer;
 * - halved in disorder, halved again for an empty city, and again when the inciter founded it;
 * - a Spy takes a sixth off (a veteran a third), each rounded down before it's taken.
 */
const inciteCost = ({ size, gold, distance, communist, courthouse, disorder, empty, founder, spy, veteran, }) => {
    let dist = distance;
    if (communist && dist > 9) {
        dist = 10;
    }
    if (courthouse) {
        dist = Math.trunc(dist / exports.COURTHOUSE_DISTANCE_DIVISOR);
    }
    let cost = size * Math.trunc((gold + 1000) / (dist + 3));
    if (cost > 0x7fffffff) {
        cost = 30000;
    }
    if (disorder) {
        cost = Math.trunc(cost / 2);
    }
    if (empty) {
        cost = Math.trunc(cost / 2);
    }
    if (founder) {
        cost = Math.trunc(cost / 2);
    }
    if (spy) {
        cost -= Math.trunc(cost / (veteran ? 3 : 6));
    }
    return cost;
};
exports.inciteCost = inciteCost;
/** The most the doubled price may be asked under a treaty: it's offered only below this (`incite_cost < 0x3a99`). */
exports.DOUBLED_PRICE_BELOW = 15001;
/**
 * The price to bribe a unit (`unit_bribe`, `unit_spy.cpp:1104-1114`): `cost × ((gold + 750) / (distance + 2))`, the
 *  division first, the distance at most 10 when the briber is Communist; 30000 on overflow; halved unless the unit is
 *  a Settlers-role one.
 */
const bribeCost = ({ unitCost, gold, distance, briberCommunist, settler, }) => {
    const dist = briberCommunist && distance > 9 ? 10 : distance;
    let cost = unitCost * Math.trunc((gold + 750) / (dist + 2));
    if (cost > 0x7fffffff) {
        cost = 30000;
    }
    if (!settler) {
        cost = Math.trunc(cost / 2);
    }
    return cost;
};
exports.bribeCost = bribeCost;
/** Whether `unit`'s role is the Settlers' and Engineers' (`ROLE_SETTLE`). */
const isSettlerRole = (unit) => { var _a; return ((_a = (0, exports.unitRow)(unit)) === null || _a === void 0 ? void 0 : _a[10]) === units_1.SETTLE; };
exports.isSettlerRole = isSettlerRole;
/**
 * The chance in 100 that a defender in the city detects a random theft (`unit_spy.cpp:405-420`): 20 for a Diplomat, 40
 *  for a Spy, 60 for a veteran Spy; 0 for any other unit.
 */
const detectionChance = (defender, unitImprovementRegistry = UnitImprovementRegistry_1.instance) => {
    if (!(0, exports.isDiplomacyUnit)(defender)) {
        return 0;
    }
    if (!(0, exports.isSpy)(defender)) {
        return 20;
    }
    return (0, exports.isVeteran)(defender, unitImprovementRegistry) ? 60 : 40;
};
exports.detectionChance = detectionChance;
/**
 * Whether a city's `defenders` detect a random theft: each Diplomat or Spy in turn draws `rand % 100` against its
 *  chance, and the first success stops the search (one draw per Diplomat or Spy until then).
 */
const detected = (defenders, randomNumberGenerator, unitImprovementRegistry = UnitImprovementRegistry_1.instance) => defenders.some((defender) => {
    const chance = (0, exports.detectionChance)(defender, unitImprovementRegistry);
    return chance > 0 && Math.floor(randomNumberGenerator() * 100) < chance;
});
exports.detected = detected;
/**
 * The 100 advance slots a random theft walks (`unit_spy.cpp:352-366`, `rand % 100` then on and round): `@CIVILIZE`'s
 *  rows in order, with `null` for a row both of whose prerequisites are `no` (never available) and for the unused
 *  slots after the table.
 */
exports.theftOrder = Array.from({ length: 100 }, (value, index) => {
    const row = advances_1.advances[index];
    if (row === undefined || (row[1] === advances_1.NEVER && row[2] === advances_1.NEVER)) {
        return null;
    }
    return row[0];
});
/** The 39 improvement slots before the first Wonder (`IMP_FIRST_WONDER`), in `@IMPROVE` order; `null` where there's none here. */
exports.improvementOrder = [
    null,
    CityImprovements.Palace,
    CityImprovements.Barracks,
    CityImprovements.Granary,
    CityImprovements.Temple,
    CityImprovements.Marketplace,
    CityImprovements.Library,
    CityImprovements.Courthouse,
    CityImprovements.CityWalls,
    CityImprovements.Aqueduct,
    CityImprovements.Bank,
    CityImprovements.Cathedral,
    CityImprovements.University,
    CityImprovements.MassTransit,
    CityImprovements.Colosseum,
    CityImprovements.Factory,
    CityImprovements.ManufacturingPlant,
    CityImprovements.SdiDefence,
    CityImprovements.RecyclingCenter,
    CityImprovements.PowerPlant,
    CityImprovements.HydroPlant,
    CityImprovements.NuclearPlant,
    CityImprovements.StockExchange,
    CityImprovements.SewerSystem,
    CityImprovements.Supermarket,
    CityImprovements.Superhighways,
    CityImprovements.ResearchLab,
    CityImprovements.SamMissileBattery,
    CityImprovements.CoastalFortress,
    CityImprovements.SolarPlant,
    CityImprovements.Harbour,
    CityImprovements.OffshorePlatform,
    CityImprovements.Airport,
    CityImprovements.PoliceStation,
    CityImprovements.PortFacility,
    // The spaceship's three parts and Capitalization, which no city holds here.
    null,
    null,
    null,
    null,
];
/**
 * The improvement a random industrial sabotage takes (`unit_spy.cpp:459-468`): one draw of `rand % 39` for a start, then
 *  the first slot, on and round, that the city has, but never the Palace or SDI Defense. `null` with none.
 */
const randomSabotageTarget = (has, randomNumberGenerator) => {
    const slots = exports.improvementOrder.length, start = Math.floor(randomNumberGenerator() * slots);
    for (let i = 0; i < slots; i++) {
        const Improvement = exports.improvementOrder[(i + start) % slots];
        if (Improvement !== null &&
            Improvement !== CityImprovements.Palace &&
            Improvement !== CityImprovements.SdiDefence &&
            has(Improvement)) {
            return Improvement;
        }
    }
    return null;
};
exports.randomSabotageTarget = randomSabotageTarget;
/**
 * Whether a random sabotage takes the production instead of an improvement (`unit_spy.cpp:563-575`), asked only when
 *  the city's shield box isn't empty: odds 2 for a Diplomat, 3 for a Spy, one more for a veteran; a roll of
 *  `rand % odds` that is 0 takes the production.
 */
const sabotagesProduction = (spy, veteran, randomNumberGenerator) => {
    const odds = (spy ? 3 : 2) + (veteran ? 1 : 0);
    return Math.floor(randomNumberGenerator() * odds) === 0;
};
exports.sabotagesProduction = sabotagesProduction;
/**
 * Whether the other civilizations find out about a planted nuclear device (`unit_spy.cpp:693-704`): never under
 *  Fundamentalism; otherwise a roll of `rand % odds` that is 0, with odds 2, or 4 for a veteran Spy.
 */
const deviceDiscovered = (fundamentalist, veteran, randomNumberGenerator) => !fundamentalist &&
    Math.floor(randomNumberGenerator() * (veteran ? 4 : 2)) === 0;
exports.deviceDiscovered = deviceDiscovered;
/** The production a person's Spy may choose to sabotage, named as a target (the dialog's option 0, `unit_spy.cpp:500-506`). */
exports.PRODUCTION = 'production';
//# sourceMappingURL=espionage.js.map