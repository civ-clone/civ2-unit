"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.ENGINEER_WORK_RATE = void 0;
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Units_1 = require("../../Units");
const WorkRate_1 = require("@civ-clone/core-unit/Rules/WorkRate");
/** How many turns' terrain work Engineers do in one. */
exports.ENGINEER_WORK_RATE = 2;
/** Engineers do two turns' terrain work in one (`unit_do_terrain_work`), so their jobs take half the turns. */
const getRules = () => [
    new WorkRate_1.default('civ2-unit:unit/work-rate/engineers', new Criterion_1.default((unit) => unit instanceof Units_1.Engineer), new Effect_1.default(() => exports.ENGINEER_WORK_RATE)),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=workRate.js.map