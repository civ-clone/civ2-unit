"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Actions_1 = require("../../Actions");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const SingleUse_1 = require("@civ-clone/base-unit-trait-single-use/SingleUse");
/**
 * A `SingleUse` unit (a missile, `@UNITS` flag 12) is spent by its attack, whether it won or not (OpenCiv2
 *  `unit_resolve_attack`). No one destroyed it, so it is no loss.
 */
const getRules = () => [
    new Moved_1.default('civ2-unit:unit/moved/single-use-spent', new Criterion_1.default((unit) => unit.hasTrait(SingleUse_1.default)), new Criterion_1.default((unit, action) => action instanceof Actions_1.Attack || action instanceof Actions_1.SneakAttack), new Criterion_1.default((unit) => !unit.destroyed()), new Effect_1.default((unit) => unit.destroy())),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=singleUse.js.map