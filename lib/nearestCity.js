"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearestCity = void 0;
const distance_1 = require("./distance");
/**
 * The city nearest `tile`, anyone's, at any distance, by `map_distance` (OpenCiv2 `city_find_nearest(x, y, -1, ...)`):
 *  the first of the nearest, in the registry's order, as the original takes the first in its own. `null` with no
 *  cities.
 */
const nearestCity = (cityRegistry, tile) => cityRegistry.entries().reduce(([nearest, best], city) => {
    const measured = (0, distance_1.default)(tile, city.tile());
    return measured < best ? [city, measured] : [nearest, best];
}, [null, Infinity])[0];
exports.nearestCity = nearestCity;
exports.default = exports.nearestCity;
//# sourceMappingURL=nearestCity.js.map