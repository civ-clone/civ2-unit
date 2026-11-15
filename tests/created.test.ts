import { Diplomat, Spy, Warrior } from '../Units';
import { addCity, setUp } from './lib/game';
import Communism from '@civ-clone/base-government-communism/Communism';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import Government from '@civ-clone/core-government/Government';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import Unit from '@civ-clone/core-unit/Unit';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { expect } from 'chai';

// OpenCiv2 `city_process_production_unit` (`src/auto/city_production.cpp`, richardpenman/civ2@49f26ec): a
//  `ROLE_DIPLOMACY` unit a city builds under `GOV_COMMUNISM` is a veteran (survey Q23 follows the code).
describe('veteran units of the diplomacy role under Communism', (): void => {
  const built = async (
    GovernmentType: typeof Government,
    UnitType: typeof Unit,
    inCity: boolean = true
  ): Promise<boolean> => {
    const { game, player, at } = await setUp(),
      government = new PlayerGovernment(player, undefined, game.rules),
      city = addCity(game, player, at(2, 2), 'Home');

    government.set(new GovernmentType());
    game.playerGovernments.register(government);

    const unit = new UnitType(
      inCity ? city : null,
      player as Player,
      at(2, 2),
      game.rules
    );

    return game.unitImprovements
      .getByUnit(unit)
      .some((improvement) => improvement instanceof Veteran);
  };

  it('makes a Diplomat built under Communism a veteran', async (): Promise<void> => {
    expect(await built(Communism, Diplomat)).to.true;
  });

  it('makes a Spy built under Communism a veteran (the same role)', async (): Promise<void> => {
    expect(await built(Communism, Spy)).to.true;
  });

  it('leaves a Diplomat built under Fundamentalism as it is', async (): Promise<void> => {
    expect(await built(Fundamentalism, Diplomat)).to.false;
  });

  it('leaves a unit of another role built under Communism as it is', async (): Promise<void> => {
    expect(await built(Communism, Warrior)).to.false;
  });

  it('leaves a Diplomat no city built as it is', async (): Promise<void> => {
    expect(await built(Communism, Diplomat, false)).to.false;
  });
});
