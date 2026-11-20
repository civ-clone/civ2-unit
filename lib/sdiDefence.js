"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdiDefenceVetoes = exports.sdiDefenceDescription = exports.SDI_DEFENCE_DESCRIBED_RULE = exports.SDI_DEFENCE_RADIUS = void 0;
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const Description_1 = require("@civ-clone/core-rule/Description");
const Detonates_1 = require("@civ-clone/base-unit-trait-detonates/Detonates");
const SdiDefence_1 = require("@civ-clone/base-city-improvement-sdidefence/SdiDefence");
const hasImprovementOrWonder_1 = require("@civ-clone/base-wonder/lib/hasImprovementOrWonder");
const distance_1 = require("./distance");
const detonatedRules_1 = require("@civ-clone/base-unit-lifecycle/lib/detonatedRules");
/** How far, by `map_distance`, a city with SDI Defense stops a nuclear attack (`unit_nuclear_attack`). */
exports.SDI_DEFENCE_RADIUS = 3;
/** The detonation rule that says what SDI Defense does (civ-clone/web-renderer#1196). */
exports.SDI_DEFENCE_DESCRIBED_RULE = 'civ2-unit:unit/detonated/destroy-units';
/** What SDI Defense does, for the Civilopedia (civ-clone/web-renderer#1196). */
const sdiDefenceDescription = () => new Description_1.default({
    type: 'protects_from',
    subject: SdiDefence_1.default,
    event: 'nuclear_attack',
    what: 'area',
    radius: exports.SDI_DEFENCE_RADIUS,
});
exports.sdiDefenceDescription = sdiDefenceDescription;
/**
 * The detonation `vetoes`: another player's city with SDI Defense within `SDI_DEFENCE_RADIUS` of the target, by
 *  `map_distance`, stops a nuclear attack and the missile is lost (`unit_nuclear_attack`). The client hears
 *  `unit:nuclear-stopped` as well as the detonation it is told of either way. Only a missile: a Spy's planted device
 *  isn't stopped (`unit_nuclear_attack(civ, x, y, 0)`, `unit_spy.cpp:687`).
 */
const sdiDefenceVetoes = ({ cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, } = {}) => {
    const protectedBy = (0, detonatedRules_1.protectedByCityWithin)(cityRegistry, exports.SDI_DEFENCE_RADIUS, (city, unit) => city.player() !== unit.player() &&
        (0, hasImprovementOrWonder_1.cityHasImprovement)(city, SdiDefence_1.default, cityImprovementRegistry), distance_1.default);
    return (unit, tile) => {
        const stopped = unit.hasTrait(Detonates_1.default) && protectedBy(unit, tile);
        if (stopped) {
            engine.emit('unit:nuclear-stopped', unit, tile);
        }
        return stopped;
    };
};
exports.sdiDefenceVetoes = sdiDefenceVetoes;
exports.default = exports.sdiDefenceVetoes;
//# sourceMappingURL=sdiDefence.js.map