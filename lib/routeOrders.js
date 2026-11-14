"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeOrders = void 0;
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const Actions_1 = require("../Actions");
const Railroad_1 = require("@civ-clone/base-science-advance-railroad/Railroad");
const Terraforms_1 = require("@civ-clone/base-unit-trait-terraforms/Terraforms");
const routeOrders_1 = require("@civ-clone/base-unit-action-build-route/lib/routeOrders");
// The route orders a unit may be given for a distant square: Road to for a unit that `Terraforms`, and Railroad to
//  once its player knows Railroad.
const civ2RouteOrders = (0, routeOrders_1.routeOrders)([
    [Actions_1.RoadTo, null],
    [Actions_1.RailroadTo, Railroad_1.default],
], Terraforms_1.default);
const routeOrders = (unit, playerResearchRegistry = PlayerResearchRegistry_1.instance) => civ2RouteOrders(unit, playerResearchRegistry);
exports.routeOrders = routeOrders;
exports.default = exports.routeOrders;
//# sourceMappingURL=routeOrders.js.map