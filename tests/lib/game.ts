import { Grassland, Ocean } from '@civ-clone/civ2-world/Terrains';
import { addCity, addPlayer } from './matrix';
import FillGenerator from '@civ-clone/simple-world-generator/tests/lib/FillGenerator';
import { Game } from '@civ-clone/core-game/Game';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import World from '@civ-clone/core-world/World';
import { createRng } from '@civ-clone/core-random/Rng';
import register from '../../registerRules';
import { register as registerWorld } from '@civ-clone/civ2-world/registerRules';

export { addCity, addPlayer };

const size = 12;

class MapGenerator extends FillGenerator {
  #terrain: (x: number, y: number) => typeof Terrain;

  constructor(terrain: (x: number, y: number) => typeof Terrain) {
    super(size, size, Grassland);

    this.#terrain = terrain;
  }

  generate(): Promise<Terrain[]> {
    return Promise.resolve(
      new Array(size * size).fill(0).map((value, index): Terrain => {
        const [x, y] = this.indexToCoords(index);

        return new (this.#terrain(x, y))();
      })
    );
  }
}

export interface Setting {
  game: Game;
  world: World;
  player: Player;
  enemy: Player;
  at: (x: number, y: number) => Tile;
}

/**
 * A game with civ2-world's and civ2-unit's rules, on a 12 by 12 world that is land west of column 8 and ocean from it
 *  (or `terrain`'s), with two players who know nothing.
 */
export const setUp = async (
  terrain: (x: number, y: number) => typeof Terrain = (x: number) =>
    x >= 8 ? Ocean : Grassland,
  seed: number = 1008
): Promise<Setting> => {
  const game = new Game({ rng: createRng(seed) });

  registerWorld(game);
  register(game);

  const world = new World(
    new MapGenerator(terrain),
    game.rules,
    game.landMasses
  );

  await world.build();

  return {
    game,
    world,
    player: addPlayer(game),
    enemy: addPlayer(game),
    at: (x: number, y: number): Tile => world.get(x, y),
  };
};
