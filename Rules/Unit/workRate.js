"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Units_1 = require("../../Units");
const WorkRate_1 = require("@civ-clone/core-unit/Rules/WorkRate");
/** Engineers do two turns' terrain work in one (`unit_do_terrain_work`), so their jobs take half the turns. */
const getRules = () => [
    new WorkRate_1.default('civ2-unit:unit/work-rate/engineers', new Criterion_1.default((unit) => unit instanceof Units_1.Engineer), new Effect_1.default(() => 2)),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=workRate.js.map