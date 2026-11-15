// Healing, slowing and fuel as civ2-unit registers them (survey-units §2.1 and §4.1; OpenCiv2 richardpenman/civ2@49f26ec,
//  `civ_heal_units`, `unit_max_moves`, `unit_move_dir_air_fuel`).
import { Airbase, Fortress } from '@civ-clone/civ2-world/TileImprovements';
import {
  Battleship,
  Bomber,
  Carrier,
  Fighter,
  Helicopter,
  Musketman as Musketeers,
  Tank as Armor,
} from '../Units';
import { addCity, setUp } from './lib/game';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import Move from '@civ-clone/base-unit-action-move/Move';
import MovedThisTurn from '@civ-clone/base-unit-healing/lib/MovedThisTurn';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Unit from '@civ-clone/core-unit/Unit';
import { distance, mapDistance } from '../lib/distance';
import { expect } from 'chai';

const heal = (
  game: Awaited<ReturnType<typeof setUp>>['game'],
  player: Player
): void => {
  game.rules.process(TurnStart, player);
};

describe('map_distance', (): void => {
  it('is half the sum of the doubled-x and y differences, wrapping east to west (`map_distance`)', (): void => {
    // Same row, 3 squares apart: dx 6, dy 0.
    expect(mapDistance(0, 0, 3, 0, 40)).to.equal(3);
    // Straight down two rows: dx 0, dy 2.
    expect(mapDistance(5, 0, 5, 2, 40)).to.equal(1);
    // One row down from an even row is the odd row's square half a square east: dx 1, dy 1.
    expect(mapDistance(5, 0, 5, 1, 40)).to.equal(1);
    // Across the seam: 1 and 39 on a 40-wide map are 2 squares apart.
    expect(mapDistance(1, 0, 39, 0, 40)).to.equal(2);
  });
});

describe('healing (`civ_heal_units`)', function (): void {
  this.timeout(20000);

  const damaged = (unit: Unit, damage: number): Unit => {
    unit.setDamage(damage);

    return unit;
  };

  it('heals a step (a tenth) resting, 2 on a Fortress, never more than the damage', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      // Musketeers: 20 hit points, a step is 2.
      open = damaged(new Musketeers(null, player, at(1, 1), game.rules), 10),
      fortress = damaged(
        new Musketeers(null, player, at(1, 3), game.rules),
        10
      ),
      nearlyWell = damaged(
        new Musketeers(null, player, at(1, 5), game.rules),
        1
      );

    game.tileImprovements.register(new Fortress(at(1, 3), game.rules));
    heal(game, player);

    expect(
      [open, fortress, nearlyWell].map((unit) => unit.damage())
    ).to.deep.equal([8, 6, 0]);
  });

  it('heals a land unit within 3 of its city a step more, or 2 with Barracks, and twice as much in it', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      city = addCity(game, player, at(2, 2), 'Home'),
      near = damaged(new Musketeers(null, player, at(5, 2), game.rules), 16),
      far = damaged(new Musketeers(null, player, at(2, 10), game.rules), 16),
      inCity = damaged(new Musketeers(null, player, at(2, 2), game.rules), 16);

    expect(distance(at(5, 2), at(2, 2))).to.equal(3);

    heal(game, player);

    // Near: 1 + 1 steps; far: 1; in the city: (1 + 1) × 2.
    expect([near, far, inCity].map((unit) => unit.damage())).to.deep.equal([
      12, 14, 8,
    ]);

    game.cityImprovements.register(new Barracks(city, game.rules));
    heal(game, player);

    // Near: 1 + 2 steps; in a city with Barracks, fully.
    expect([near.damage(), inCity.damage()]).to.deep.equal([6, 0]);
  });

  it("doesn't heal a unit that moved last turn", async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      unit = damaged(new Musketeers(null, player, at(1, 1), game.rules), 10);

    game.unitImprovements.register(new MovedThisTurn(unit));
    heal(game, player);

    expect(unit.damage()).to.equal(10);
  });

  it('heals an aircraft fully in a city with an Airport or on an Airbase, a ship with a Port Facility not without', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      city = addCity(game, player, at(7, 2), 'Port'),
      inCity = damaged(new Bomber(null, player, at(7, 2), game.rules), 10),
      onAirbase = damaged(new Bomber(null, player, at(3, 3), game.rules), 10),
      ship = damaged(new Battleship(null, player, at(7, 2), game.rules), 20);

    game.tileImprovements.register(new Airbase(at(3, 3), game.rules));
    heal(game, player);

    // Bomber 20 hp, Battleship 40: in a city without facilities, 1 step × 2.
    expect(
      [inCity, onAirbase, ship].map((unit) => unit.damage())
    ).to.deep.equal([6, 0, 12]);

    game.cityImprovements.register(new Airport(city, game.rules));
    heal(game, player);

    expect(inCity.damage()).to.equal(0);
  });

  it('wears a helicopter that moved, outside a city or airbase, by a step, but never to nothing', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      helicopter = damaged(
        new Helicopter(null, player, at(1, 1), game.rules),
        17
      ),
      inCity = new Helicopter(null, player, at(3, 3), game.rules);

    addCity(game, player, at(3, 3), 'Base');
    game.unitImprovements.register(
      new MovedThisTurn(helicopter),
      new MovedThisTurn(inCity)
    );
    heal(game, player);

    // 20 hit points: a step of 2, but no further than 19.
    expect([helicopter.damage(), inCity.damage()]).to.deep.equal([19, 0]);
  });
});

describe('damaged movement (`unit_max_moves`)', function (): void {
  this.timeout(20000);

  it('cuts moves to the hit points left, in thirds rounded up, at least 1 on land and 2 at sea; aircraft keep theirs', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      armor = new Armor(null, player, at(1, 1), game.rules),
      battleship = new Battleship(null, player, at(9, 1), game.rules),
      bomber = new Bomber(null, player, at(1, 2), game.rules);

    // Armor 3 moves, 30 hp; at 10 left: 3 × 10/30 = 1.
    armor.setDamage(20);
    // At 1 left: 0.1 move, a third, rounded up to 1.
    expect(armor.movement().value()).to.equal(1);
    armor.setDamage(29);
    expect(armor.movement().value()).to.equal(1);
    // At 22 left: 9 thirds × 22/30 is 6 thirds, truncated: 2 moves.
    armor.setDamage(8);
    expect(armor.movement().value()).to.equal(2);
    // At 25 left: 7 thirds, rounded up to 3 moves.
    armor.setDamage(5);
    expect(armor.movement().value()).to.equal(3);

    // Battleship 4 moves, 40 hp: at 5 left, half a move, but 2 at sea.
    battleship.setDamage(35);
    expect(battleship.movement().value()).to.equal(2);

    bomber.setDamage(19);
    expect(bomber.movement().value()).to.equal(8);
  });
});

describe('fuel (`unit_move_dir_air_fuel`)', function (): void {
  this.timeout(20000);

  const flyTo = (unit: Unit, to: Tile): void => {
    unit.moves().set(1);
    new Move(unit.tile(), to, unit, unit['_ruleRegistry']).perform();
  };

  it('crashes a fighter out of moves away from a base, telling the client', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      fighter = new Fighter(null, player, at(1, 1), game.rules),
      crashed: Unit[] = [];

    game.engine.on('unit:out-of-fuel', (unit: Unit) => crashed.push(unit));
    flyTo(fighter, at(1, 2));

    expect(fighter.destroyed()).to.true;
    expect(crashed.length === 1 && crashed[0] === fighter).to.true;
  });

  it('refuels a fighter landing in its own city, on an airbase, or with a carrier', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      inCity = new Fighter(null, player, at(1, 1), game.rules),
      onAirbase = new Fighter(null, player, at(4, 1), game.rules),
      onCarrier = new Fighter(null, player, at(8, 1), game.rules);

    addCity(game, player, at(1, 2), 'Base');
    game.tileImprovements.register(new Airbase(at(4, 2), game.rules));
    new Carrier(null, player, at(8, 2), game.rules);

    flyTo(inCity, at(1, 2));
    flyTo(onAirbase, at(4, 2));
    flyTo(onCarrier, at(8, 2));

    expect(
      [inCity, onAirbase, onCarrier].map((unit) => unit.destroyed())
    ).to.deep.equal([false, false, false]);
  });

  it('lets a bomber spend one turn out, and a helicopter fly without fuel', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      bomber = new Bomber(null, player, at(1, 1), game.rules),
      helicopter = new Helicopter(null, player, at(3, 1), game.rules);

    flyTo(bomber, at(1, 2));
    expect(bomber.destroyed()).to.false;
    flyTo(bomber, at(1, 3));
    expect(bomber.destroyed()).to.true;

    flyTo(helicopter, at(3, 2));
    flyTo(helicopter, at(3, 3));
    expect(helicopter.destroyed()).to.false;
  });
});
