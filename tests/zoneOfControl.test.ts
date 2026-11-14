import { Explorer, Fighter, Partisan, Warrior } from '../Units';
import { Scenario, addCity, addPlayer, offered, setUp } from './lib/matrix';
import { Peace } from '@civ-clone/library-diplomacy/Declarations';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';

// Civ2's zones of control (`tile_in_enemy_zoc`, `tile_zoc_unit_adjacent`, `unit_move_dir_land_unit_checks`): the unit
//  stands at (7, 7) and steps west to (6, 7); another player's unit at (7, 6) is beside both squares.
const beside = (
  UnitType: typeof Unit,
  { peace = false, ownCityOn = null as 'from' | 'to' | null } = {}
): Scenario => ({
  name: 'zone of control',
  target: ({ world }) => world.get(6, 7),
  prepare: ({ game, player, world, from }) => {
    const enemy = addPlayer(game);

    new UnitType(null, enemy, world.get(7, 6), game.rules);

    if (peace) {
      game.interactions.register(new Peace(player, enemy, game.rules));
    }

    if (ownCityOn !== null) {
      addCity(
        game,
        player,
        ownCityOn === 'from' ? from : world.get(6, 7),
        'Own'
      );
    }
  },
});

describe('zones of control', function (): void {
  this.timeout(60000);

  const moves = async (
    scenario: Scenario,
    Mover: typeof Unit = Warrior
  ): Promise<boolean> => offered(await setUp(scenario, Mover)).includes('Move');

  it('holds a land unit between two squares beside another player’s unit, at peace or not', async (): Promise<void> => {
    expect(await moves(beside(Warrior))).to.false;
    expect(await moves(beside(Warrior, { peace: true }))).to.false;
  });

  it('is exerted by any unit on land, an aircraft on a square of it too', async (): Promise<void> => {
    expect(await moves(beside(Fighter))).to.false;
  });

  it('lets a unit that ignores zones of control pass', async (): Promise<void> => {
    expect(await moves(beside(Warrior), Partisan)).to.true;
    expect(await moves(beside(Warrior), Explorer)).to.true;
  });

  it('puts no city square in a zone', async (): Promise<void> => {
    expect(await moves(beside(Warrior, { ownCityOn: 'from' }))).to.true;
    expect(await moves(beside(Warrior, { ownCityOn: 'to' }))).to.true;
  });
});
