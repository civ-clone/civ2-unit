import City from '@civ-clone/core-city/City';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Tile from '@civ-clone/core-world/Tile';
import distance from './distance';

/**
 * The city nearest `tile`, anyone's, at any distance, by `map_distance` (OpenCiv2 `city_find_nearest(x, y, -1, ...)`):
 *  the first of the nearest, in the registry's order, as the original takes the first in its own. `null` with no
 *  cities.
 */
export const nearestCity = (
  cityRegistry: CityRegistry,
  tile: Tile
): City | null =>
  cityRegistry.entries().reduce(
    (
      [nearest, best]: [City | null, number],
      city: City
    ): [City | null, number] => {
      const measured = distance(tile, city.tile());

      return measured < best ? [city, measured] : [nearest, best];
    },
    [null, Infinity] as [City | null, number]
  )[0];

export default nearestCity;
