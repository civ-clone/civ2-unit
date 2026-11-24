import Sleeping from '@civ-clone/base-unit-action-sleep/Rules/Sleeping';
import Stowed from '@civ-clone/core-unit-transport/Rules/Stowed';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import { Warrior } from '../Units';
import { expect } from 'chai';
import { setUp } from './lib/game';

// A game built with its own registries, as these tests are: a unit put to sleep looks for enemies among that game's
//  units, not core-unit's instance, so it wakes when one comes beside it (civ-clone/web-renderer#1110).
describe('sleep in a game of its own', (): void => {
  const named = (unit: Unit, name: string): UnitAction | undefined =>
    unit
      .actions()
      .find(
        (unitAction: UnitAction): boolean =>
          unitAction.constructor.name === name
      );

  it('should wake a sleeping unit when an enemy comes beside it', async (): Promise<void> => {
    const { at, enemy, game, player } = await setUp(),
      warrior = new Warrior(null, player, at(2, 2), game.rules);

    game.units.register(warrior);

    warrior.action(named(warrior, 'Sleep')!);

    const sleeping = warrior.busy()!;

    expect(sleeping).instanceof(Sleeping);
    expect(sleeping.validate()).false;

    game.units.register(new Warrior(null, enemy, at(3, 2), game.rules));

    expect(sleeping.validate()).true;

    sleeping.process();

    expect(warrior.busy()).null;
    expect(warrior.active()).true;
  });

  it('should wake a unit put to sleep by boarding when an enemy comes beside it', async (): Promise<void> => {
    const { at, enemy, game, player } = await setUp(),
      warrior = new Warrior(null, player, at(2, 2), game.rules);

    game.units.register(warrior);

    const [stowed] = game.rules
      .get(Stowed)
      .filter(
        (rule: Stowed): boolean => rule.id() === 'civ2-unit:unit/stowed/sleep'
      );

    stowed.process(warrior);

    const sleeping = warrior.busy()!;

    expect(sleeping).instanceof(Sleeping);
    expect(sleeping.validate()).false;

    game.units.register(new Warrior(null, enemy, at(3, 2), game.rules));

    expect(sleeping.validate()).true;
  });
});
