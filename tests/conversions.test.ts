// civ2-unit and civ2-world as the plugin loader loads them, on the singletons: the shared conversions make their new
//  terrain there (`new ClearJungle.result()`), so the Created and Feature rules roll on it as in a game.
import '../index';
import '@civ-clone/civ2-world';
import { ClearForest, ClearJungle, ClearSwamp, PlantForest } from '../Actions';
import {
  Forest,
  Grassland,
  Jungle,
  Plains,
  Swamp,
} from '@civ-clone/civ2-world/Terrains';
import {
  irrigation,
  mining,
} from '@civ-clone/civ2-world/lib/terrainProperties';
import { River, Shield } from '@civ-clone/civ2-world/TerrainFeatures';
import Player from '@civ-clone/core-player/Player';
import { Settlers } from '../Units';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import UnitAction from '@civ-clone/core-unit/Action';
import FillGenerator from '@civ-clone/simple-world-generator/tests/lib/FillGenerator';
import World from '@civ-clone/core-world/World';
import { defaultGame } from '@civ-clone/core-game';
import { expect } from 'chai';
import { instance as rng } from '@civ-clone/core-random';

type Conversion =
  | typeof ClearForest
  | typeof ClearJungle
  | typeof ClearSwamp
  | typeof PlantForest;

const outcome = (
  table: typeof irrigation,
  TerrainType: typeof Terrain
): unknown => table.find(([Type]) => Type === TerrainType)![1];

// Settlers in the middle of a 3 by 3 world of `TerrainType`, and the conversion they're offered there.
const offeredOn = async (
  TerrainType: typeof Terrain,
  Action: Conversion
): Promise<[Tile, UnitAction | undefined]> => {
  const world = await new World(
      new FillGenerator(3, 3, TerrainType),
      defaultGame.rules
    ).build(),
    tile = world.get(1, 1),
    settlers = new Settlers(null, new Player(defaultGame.rules), tile);

  settlers.moves().set(1);

  return [
    tile,
    settlers
      .actions(tile, tile)
      .find((action: UnitAction): boolean => action instanceof Action),
  ];
};

describe('terrain conversions', function (): void {
  this.timeout(60000);

  it("offers each conversion where @TERRAIN's irrigate or mine order changes the terrain, to what the action makes", async (): Promise<void> => {
    (
      [
        [ClearForest, Forest, irrigation],
        [ClearJungle, Jungle, irrigation],
        [ClearSwamp, Swamp, irrigation],
        [PlantForest, Plains, mining],
        [PlantForest, Grassland, mining],
        [PlantForest, Jungle, mining],
        [PlantForest, Swamp, mining],
      ] as [Conversion, typeof Terrain, typeof irrigation][]
    ).forEach(([Action, TerrainType, table]): void => {
      expect(
        outcome(table, TerrainType),
        `${Action.name} on ${TerrainType.name}`
      ).to.equal(Action.result);
    });

    for (const [Action, TerrainType] of [
      [ClearForest, Forest],
      [ClearJungle, Jungle],
      [ClearSwamp, Swamp],
      [PlantForest, Plains],
      [PlantForest, Grassland],
      [PlantForest, Jungle],
      [PlantForest, Swamp],
    ] as [Conversion, typeof Terrain][]) {
      expect((await offeredOn(TerrainType, Action))[1], Action.name).to.exist;
    }

    // Nothing else changes terrain: Grassland's irrigation stays in place.
    expect(outcome(irrigation, Grassland)).to.equal('yes');
    expect((await offeredOn(Grassland, ClearForest))[1]).to.undefined;
  });

  [ClearJungle, ClearSwamp].forEach((Action: Conversion): void =>
    it(`${Action.name}, as offered: a shield half the time, never two, and the river kept`, async (): Promise<void> => {
      const squares = 2000;
      let shields = 0;

      for (let seed = 1; seed <= squares; seed++) {
        const [tile, action] = await offeredOn(
          Action === ClearJungle ? Jungle : Swamp,
          Action
        );

        defaultGame.terrainFeatures.register(new River(tile.terrain()));
        rng.restore(seed, 0);

        Action.complete(action as never);

        const features = defaultGame.terrainFeatures.getByTerrain(
            tile.terrain()
          ),
          count = features.filter(
            (feature) => feature instanceof Shield
          ).length;

        expect(tile.terrain(), `seed ${seed}`).to.be.instanceOf(Grassland);
        expect(count, `seed ${seed}`).to.be.at.most(1);
        expect(
          features.filter((feature) => feature instanceof River).length,
          `seed ${seed}`
        ).to.equal(1);

        shields += count;

        defaultGame.terrainFeatures.unregister(
          ...defaultGame.terrainFeatures.entries()
        );
      }

      // Half, give or take: with the conversion's own roll kept as well, it was about three in four.
      expect(shields / squares).to.be.within(0.46, 0.54);
    })
  );
});
