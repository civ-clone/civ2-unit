import { Forest, Grassland, Ocean } from '@civ-clone/civ2-world/Terrains';
import { Irrigation, Pollution } from '@civ-clone/civ2-world/TileImprovements';
import { Sail, Warrior } from '../../Units';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import AvailableCityBuildItemsRegistry from '@civ-clone/core-city-build/AvailableCityBuildItemsRegistry';
import BasePathFinder from '@civ-clone/simple-world-path/BasePathFinder';
import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import FillGenerator from '@civ-clone/simple-world-generator/tests/lib/FillGenerator';
import { Game } from '@civ-clone/core-game/Game';
import Land from '@civ-clone/base-unit-type-land/Land';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import { Peace } from '@civ-clone/library-diplomacy/Declarations';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import Stowed from '@civ-clone/base-unit-action-embark/Busy/Stowed';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import World from '@civ-clone/core-world/World';
import { createRng } from '@civ-clone/core-random/Rng';
import { isA, traitsOf } from '@civ-clone/core-unit/traits';
import register from '../../registerRules';
import { register as registerWorld } from '@civ-clone/civ2-world/registerRules';

// The scenarios of civ1-unit's offered-actions matrix (`tests/actionOrder.test.ts`), less the four under a Senate, which
//  Civ2 has none of in M2a: the same map, squares and set-ups, so the two matrices compare cell by cell.

const size = 15,
  home: [number, number] = [1, 1],
  origin: [number, number] = [7, 7],
  land: [number, number] = [6, 7],
  sea: [number, number] = [8, 7],
  openSea: [number, number] = [9, 7],
  distant: [number, number] = [3, 7];

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

export type Setting = {
  game: Game;
  player: Player;
  world: World;
  from: Tile;
};

export type Scenario = {
  name: string;
  atSea?: boolean;
  originTerrain?: typeof Terrain;
  target: (setting: Setting) => Tile;
  prepare?: (setting: Setting) => void;
};

export type Cell = {
  unit: Unit;
  to: Tile;
  from: Tile;
};

export const addPlayer = (game: Game): Player => {
    const player = new Player(game.rules);

    game.playerResearch.register(
      new PlayerResearch(player, new AdvanceRegistry(), game.rules)
    );

    return player;
  },
  addCity = (game: Game, player: Player, tile: Tile, name: string): City => {
    const city = new City(player, tile, name, game.rules);

    game.cities.register(city);
    game.cityGrowth.register(new CityGrowth(city, game.rules));
    game.cityBuilds.register(
      new CityBuild(city, new AvailableCityBuildItemsRegistry(), game.rules)
    );

    return city;
  };

const at = (world: World, [x, y]: [number, number]): Tile => world.get(x, y),
  foreignUnit =
    (peace = false) =>
    ({ game, player, world }: Setting): void => {
      const enemy = addPlayer(game);

      new Warrior(null, enemy, at(world, land), game.rules);

      if (peace) {
        game.interactions.register(new Peace(player, enemy, game.rules));
      }
    },
  foreignCity =
    (peace = false) =>
    ({ game, player, world }: Setting): void => {
      const enemy = addPlayer(game);

      addCity(game, enemy, at(world, land), 'Foreign');

      if (peace) {
        game.interactions.register(new Peace(player, enemy, game.rules));
      }
    },
  partnersLand =
    (square: (setting: Setting) => Tile) =>
    (setting: Setting): void => {
      const { game, player, world } = setting,
        partner = addPlayer(game),
        city = addCity(game, partner, world.get(5, 7), 'Partner');

      game.workedTiles.register(new WorkedTile(square(setting), city));
      game.tileImprovements.register(
        new Irrigation(square(setting), game.rules)
      );
      game.interactions.register(new Peace(player, partner, game.rules));
    };

export const scenarios: Scenario[] = [
  { name: 'empty land neighbour', target: ({ world }) => at(world, land) },
  {
    name: 'foreign unit',
    target: ({ world }) => at(world, land),
    prepare: foreignUnit(),
  },
  {
    name: 'foreign city',
    target: ({ world }) => at(world, land),
    prepare: foreignCity(),
  },
  {
    name: 'foreign unit, at peace',
    target: ({ world }) => at(world, land),
    prepare: foreignUnit(true),
  },
  {
    name: 'foreign city, at peace',
    target: ({ world }) => at(world, land),
    prepare: foreignCity(true),
  },
  {
    name: 'own city',
    target: ({ world }) => at(world, land),
    prepare: ({ game, player, world }) => {
      addCity(game, player, at(world, land), 'Own');
    },
  },
  { name: 'water', target: ({ world }) => at(world, sea) },
  {
    name: "treaty partner's worked land",
    target: ({ world }) => at(world, land),
    prepare: partnersLand(({ world }) => at(world, land)),
  },
  {
    name: "own square on a treaty partner's worked land",
    target: ({ from }) => from,
    prepare: partnersLand(({ from }) => from),
  },
  {
    name: 'own transport with space',
    target: ({ world }) => at(world, sea),
    prepare: ({ game, player, world }) => {
      const transport = new Sail(
        null,
        player,
        at(world, sea),
        game.rules,
        game.transports
      );

      transport.moves().set(transport.movement().value());
    },
  },
  {
    name: 'own polluted, irrigated square',
    target: ({ from }) => from,
    prepare: ({ game, from }) => {
      game.tileImprovements.register(new Irrigation(from, game.rules));
      game.tileImprovements.register(new Pollution(from, game.rules));
    },
  },
  {
    name: 'own forest square',
    originTerrain: Forest,
    target: ({ from }) => from,
  },
  { name: 'own grassland square', target: ({ from }) => from },
  { name: 'distant square', target: ({ world }) => at(world, distant) },
  {
    name: 'own square in own city',
    target: ({ from }) => from,
    prepare: ({ game, player, from }) => {
      addCity(game, player, from, 'Own');
    },
  },
  {
    name: 'at sea: coastal land neighbour',
    atSea: true,
    target: ({ world }) => at(world, origin),
  },
  {
    name: 'at sea: water neighbour',
    atSea: true,
    target: ({ world }) => at(world, openSea),
  },
  {
    name: 'at sea: own square',
    atSea: true,
    target: ({ from }) => from,
    prepare: ({ game, player, from }) => {
      const [transport] = game.units
        .getByTile(from)
        .filter((unit) => unit instanceof NavalTransport) as NavalTransport[];

      if (
        !transport ||
        !traitsOf(transport, Carries, game.rules).some((carries) =>
          carries.carries(Warrior, game.rules)
        )
      ) {
        return;
      }

      const warrior = new Warrior(null, player, from, game.rules);

      if (!transport.stow(warrior)) {
        throw new Error(`${transport.constructor.name} takes a Warrior`);
      }

      warrior.setBusy(new Stowed());
      warrior.setActive(false);
    },
  },
];

// A fresh game for each unit and scenario, with civ2-unit's and civ2-world's rules, so no unit sees another's stack.
export const setUp = async (
  scenario: Scenario,
  UnitType: typeof Unit
): Promise<Cell & { game: Game }> => {
  const game = new Game({ rng: createRng(1008) });

  registerWorld(game);
  register(game);

  game.pathFinders.register(
    class extends BasePathFinder {
      constructor(unit: Unit, start: Tile, end: Tile) {
        super(unit, start, end, game.rules, game.cities, game.units);
      }
    }
  );

  const world = new World(
    new MapGenerator((x, y): typeof Terrain =>
      x >= sea[0]
        ? Ocean
        : x === origin[0] && y === origin[1] && scenario.originTerrain
        ? scenario.originTerrain
        : Grassland
    ),
    game.rules
  );

  await world.build();

  const player = addPlayer(game),
    city = addCity(game, player, at(world, home), 'Home'),
    from = at(world, scenario.atSea ? sea : origin),
    setting: Setting = { game, player, world, from },
    ship =
      scenario.atSea && isA(UnitType, Land)
        ? new Sail(city, player, from, game.rules, game.transports)
        : null;

  const unit = new (UnitType as unknown as new (...args: unknown[]) => Unit)(
    city,
    player,
    from,
    game.rules,
    game.transports
  );

  unit.moves().set(unit.movement().value());

  if (ship !== null) {
    if (!ship.stow(unit)) {
      throw new Error(`${UnitType.name} boards a Sail`);
    }

    unit.setBusy(new Stowed());
    unit.setActive(false);
  }

  scenario.prepare?.(setting);

  return { game, unit, to: scenario.target(setting), from };
};

export const offered = ({ unit, to, from }: Cell): string[] =>
  unit
    .actions(to, from)
    .map((unitAction: UnitAction): string => unitAction.constructor.name);
