import Tile from '@civ-clone/core-world/Tile';

/**
 * Civilization II's `map_distance` (OpenCiv2 `src/auto/map.cpp`, richardpenman/civ2@49f26ec) between two squares of a
 *  staggered map, as the game stores them: each row's squares are 2 apart, odd rows shifted by 1, so the horizontal
 *  difference counts half squares and wraps east to west at twice the width. The distance is half the sum of the two
 *  differences, rounded down. Healing's near-city bonus and a paradrop's range measure with it (`civ_heal_units`,
 *  `unit_paradrop`); it isn't civ2-player's `civ2Distance`, which is `map_distance_diag`.
 */
export const mapDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number
): number => {
  let dx = Math.abs(2 * x1 + (y1 & 1) - (2 * x2 + (y2 & 1)));

  if (dx > width) {
    dx = 2 * width - dx;
  }

  return (dx + Math.abs(y1 - y2)) >> 1;
};

/** `mapDistance` between two tiles of the same map. */
export const distance = (from: Tile, to: Tile): number =>
  mapDistance(from.x(), from.y(), to.x(), to.y(), from.map().width());

export default distance;
