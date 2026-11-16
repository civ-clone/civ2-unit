import City from '@civ-clone/core-city/City';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Tile from '@civ-clone/core-world/Tile';
/**
 * The city nearest `tile`, anyone's, at any distance, by `map_distance` (OpenCiv2 `city_find_nearest(x, y, -1, ...)`):
 *  the first of the nearest, in the registry's order, as the original takes the first in its own. `null` with no
 *  cities.
 */
export declare const nearestCity: (
  cityRegistry: CityRegistry,
  tile: Tile
) => City | null;
export default nearestCity;
