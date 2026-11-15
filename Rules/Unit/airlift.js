"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.airliftThreat = void 0;
const units_1 = require("../../data/units");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Actions_1 = require("../../Actions");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Low_1 = require("@civ-clone/core-rule/Priorities/Low");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const Declarations_1 = require("@civ-clone/library-diplomacy/Declarations");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const distance_1 = require("../../lib/distance");
const core_random_1 = require("@civ-clone/core-random");
const unitTable_1 = require("../../lib/unitTable");
// Each unit type's `@UNITS` row, by class.
const rows = new Map(units_1.units.map((row, index) => [unitTable_1.unitTypes[index], row]));
/**
 * The enemy fighters an airlift between `from` and `to` risks (`unit_cmd_airlift`): each air-superiority unit of a
 *  player not at peace with `player` that is within its moves (whole moves, by `map_distance`) of either city counts
 *  1, a veteran 2. With the player whose unit counted last, which the original names as the one that shot it down.
 */
const airliftThreat = (player, from, to, { interactionRegistry = InteractionRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, } = {}) => unitRegistry
    .entries()
    .filter((unit) => {
    var _a;
    return unit.player() !== player &&
        !unit.destroyed() &&
        ((_a = rows.get(unit.constructor)) === null || _a === void 0 ? void 0 : _a[10]) === units_1.AIR_SUPERIORITY &&
        !interactionRegistry
            .getByPlayers(player, unit.player())
            .some((interaction) => interaction instanceof Declarations_1.Peace && interaction.active()) &&
        [from, to].some((city) => (0, distance_1.default)(city, unit.tile()) <= Math.trunc(unit.movement().value()));
})
    .reduce(([count], unit) => [
    count +
        (unitImprovementRegistry
            .getByUnit(unit)
            .some((improvement) => improvement instanceof Veteran_1.default)
            ? 2
            : 1),
    unit.player(),
], [0, null]);
exports.airliftThreat = airliftThreat;
/**
 * `civ2-unit:unit/moved/airlift-shot-down` (`Low`, after the move's other rules): an airlifted unit is shot down, one
 *  roll in 6 for each count of `airliftThreat` (`unit_airlift_perform`), destroyed by the player whose fighter counted
 *  last; the client hears `unit:airlift-shot-down`. The original asks a human to confirm a risky airlift first; here it
 *  always flies.
 */
const getRules = ({ engine = Engine_1.instance, randomNumberGenerator = core_random_1.instance, ...dependencies } = {}) => [
    new Moved_1.default('civ2-unit:unit/moved/airlift-shot-down', new Low_1.default(), new Criterion_1.default((unit, action) => action instanceof Actions_1.Airlift && !unit.destroyed()), new Effect_1.default((unit, action) => {
        const [count, by] = (0, exports.airliftThreat)(unit.player(), action.from(), action.to(), dependencies);
        for (let i = 0; i < count; i++) {
            if (Math.floor(randomNumberGenerator() * 6) === 0) {
                engine.emit('unit:airlift-shot-down', unit, by);
                unit.destroy(by);
                return;
            }
        }
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=airlift.js.map