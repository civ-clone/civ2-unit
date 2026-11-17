"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSubversions = exports.subversions = exports.forgetCity = exports.markInvestigated = exports.investigated = exports.SUBVERSIONS = exports.INVESTIGATED = void 0;
const PendingEffectRegistry_1 = require("@civ-clone/core-pending-effect/PendingEffectRegistry");
const PendingEffect_1 = require("@civ-clone/core-pending-effect/PendingEffect");
// What the original keeps in its city and civilization records for Diplomats and Spies, kept as never-discharged
//  pending effects (saved like any other): a city once investigated (`CITYF_INVESTIGATED`) and a civilization's
//  subversions (`civs[].subversion_count`). Neither has a handler: nothing ever comes due.
/** A city a Spy has investigated (`CITYF_INVESTIGATED`): a person's Spy pays a third of a move only the first time. */
exports.INVESTIGATED = 'civ2-unit:city-investigated';
/** A civilization's subversions (`subversion_count`): 2 for each city incited, 1 for each unit bribed. */
exports.SUBVERSIONS = 'civ2-unit:subversions';
const find = (handler, target, pendingEffectRegistry) => {
    var _a;
    return (_a = pendingEffectRegistry
        .getByTarget(target)
        .find((effect) => effect.handler() === handler)) !== null && _a !== void 0 ? _a : null;
};
/** Whether `city` has been investigated. */
const investigated = (city, pendingEffectRegistry = PendingEffectRegistry_1.instance) => find(exports.INVESTIGATED, city, pendingEffectRegistry) !== null;
exports.investigated = investigated;
/** Marks `city` as investigated. */
const markInvestigated = (city, pendingEffectRegistry = PendingEffectRegistry_1.instance) => {
    if (!(0, exports.investigated)(city, pendingEffectRegistry)) {
        pendingEffectRegistry.register(new PendingEffect_1.default(exports.INVESTIGATED, city));
    }
};
exports.markInvestigated = markInvestigated;
/** Forgets `city`'s record, when it's gone. */
const forgetCity = (city, pendingEffectRegistry = PendingEffectRegistry_1.instance) => {
    const effect = find(exports.INVESTIGATED, city, pendingEffectRegistry);
    if (effect !== null) {
        pendingEffectRegistry.unregister(effect);
    }
};
exports.forgetCity = forgetCity;
/** `player`'s subversions. */
const subversions = (player, pendingEffectRegistry = PendingEffectRegistry_1.instance) => { var _a, _b; return Number((_b = (_a = find(exports.SUBVERSIONS, player, pendingEffectRegistry)) === null || _a === void 0 ? void 0 : _a.data().count) !== null && _b !== void 0 ? _b : 0); };
exports.subversions = subversions;
/** Adds `count` to `player`'s subversions. */
const addSubversions = (player, count, pendingEffectRegistry = PendingEffectRegistry_1.instance) => {
    const effect = find(exports.SUBVERSIONS, player, pendingEffectRegistry), total = (0, exports.subversions)(player, pendingEffectRegistry) + count;
    if (effect !== null) {
        pendingEffectRegistry.unregister(effect);
    }
    pendingEffectRegistry.register(new PendingEffect_1.default(exports.SUBVERSIONS, player, { count: String(total) }));
};
exports.addSubversions = addSubversions;
//# sourceMappingURL=missionRecords.js.map