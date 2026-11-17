import { Cell, offered, scenarios, setUp } from './lib/matrix';
import { Engineer, Settlers, Warrior } from '../Units';
import { readFileSync, writeFileSync } from 'fs';
import Action from '@civ-clone/core-unit/Rules/Action';
import Criterion from '@civ-clone/core-rule/Criterion';
import { Game } from '@civ-clone/core-game/Game';
import Unit from '@civ-clone/core-unit/Unit';
import UnitTraits from '@civ-clone/core-unit/Rules/UnitTraits';
import { createRng } from '@civ-clone/core-random/Rng';
import { expect } from 'chai';
import { join } from 'path';
import register from '../registerRules';
import { unitTypes } from '../lib/unitTable';

// Pins which unit actions civ2-unit registers, in what order, and which of them each of the 51 unit types is offered in
//  each of civ1-unit's scenarios (less those under a Senate), and five of its own (hills, jungle, swamp, a road with Railroad known, and a distant square with Railroad known). The AI takes the first action it's offered and the UI
//  lists them in order, so the order is behaviour.

const actionRuleIds = [
  'steal-technology',
  'sneak-steal-technology',
  'establish-embassy',
  'investigate-city',
  'industrial-sabotage',
  'sneak-industrial-sabotage',
  'poison-water',
  'sneak-poison-water',
  'plant-nuclear-device',
  'incite-revolt',
  'subvert-city',
  'bribe-unit',
  'sabotage-unit',
  'establish-trade-route',
  'land-aircraft',
  'allied-repair',
  'move',
  'sneak-move',
  'overruled/sneak-move',
  'abort-move',
  'attack',
  'overruled/attack',
  'sneak-attack',
  'overruled/sneak-attack',
  'nuclear-attack',
  'overruled/nuclear-attack',
  'sneak-nuclear-attack',
  'overruled/sneak-nuclear-attack',
  'capture-city',
  'sneak-capture-city',
  'overruled/sneak-capture-city',
  'paradrop',
  'airlift',
  'pillage',
  'overruled/pillage',
  'sneak-pillage',
  'overruled/sneak-pillage',
  'fortify',
  'sleep',
  'activate',
  'disband',
  'no-orders',
  'found-city',
  'join-city',
  'improvement/Irrigation',
  'improvement/Farmland',
  'improvement/Mine',
  'improvement/Road',
  'improvement/Railroad',
  'improvement/Fortress',
  'improvement/Airbase',
  'terrain/ClearJungle',
  'terrain/ClearForest',
  'terrain/PlantForest',
  'terrain/ClearSwamp',
  'transform-terrain',
  'clean-pollution',
  'embark',
  'disembark',
  'unload',
  'goto',
  'road-to',
  'railroad-to',
  'set-home-city',
  'explore',
  'automate',
].map((name: string): string => `civ2-unit:unit/action/${name}`);

const fixturePath = join(
  process.cwd(),
  'tests',
  'fixtures',
  'actionMatrix.json'
);

describe('unit actions', function (): void {
  this.timeout(300000);

  it('registers the 65 action rules in their order, each attack and treaty-breaking one followed by its overruled form', (): void => {
    const game = new Game({ rng: createRng(1008) });

    register(game);

    expect(
      game.rules
        .get(Action)
        .map((rule) => rule.id())
        .filter((id) => id!.includes(':unit/action/'))
    ).to.deep.equal(actionRuleIds);
  });

  it('asks all 51 unit types in 23 scenarios', (): void => {
    expect(unitTypes).length(51);
    expect(scenarios).length(23);
  });

  // The offered-actions matrix: the action classes `unit.actions(to, from)` returns, in order, for each unit type and
  //  scenario. If a change is meant, regenerate the fixture and review its diff:
  //
  //    UPDATE_ACTION_MATRIX=1 npx ts-mocha tests/actionMatrix.test.ts
  it('offers each unit type the same actions as the fixture', async (): Promise<void> => {
    const matrix: Record<string, Record<string, string[]>> = {};

    for (const UnitType of unitTypes) {
      matrix[UnitType.name] = {};

      for (const scenario of scenarios) {
        matrix[UnitType.name][scenario.name] = offered(
          await setUp(scenario, UnitType)
        );
      }
    }

    if (process.env.UPDATE_ACTION_MATRIX) {
      writeFileSync(fixturePath, JSON.stringify(matrix, null, 2) + '\n');
    }

    expect(matrix).to.deep.equal(JSON.parse(readFileSync(fixturePath, 'utf8')));
  });

  // The fixture can't vouch for itself: these fail if it were regenerated from a game without civ2-unit's traits.
  it('is not built from a game that has lost its traits', async (): Promise<void> => {
    const cell = (name: string, UnitType: typeof Unit) =>
      setUp(scenarios.find((scenario) => scenario.name === name)!, UnitType);

    const { game, ...settlers } = await cell('own grassland square', Settlers);

    expect(game.rules.get(UnitTraits).length).to.be.above(70);
    expect(offered(settlers)).to.include('FoundCity');
    expect(offered(await cell('own grassland square', Engineer))).to.include(
      'FoundCity'
    );
    expect(offered(await cell('own grassland square', Warrior))).to.include(
      'Fortify'
    );
    expect(offered(await cell('empty land neighbour', Warrior))).to.include(
      'Move'
    );
    expect(offered(await cell('foreign unit', Warrior))).to.include('Attack');
    expect(offered(await cell('foreign city', Warrior))).to.include(
      'CaptureCity'
    );
    expect(offered(await cell('distant square', Settlers))).to.include.members([
      'GoTo',
      'RoadTo',
    ]);
    expect(
      offered(await cell('distant square, Railroad known', Settlers))
    ).to.include.members(['GoTo', 'RoadTo', 'RailroadTo']);
    expect(offered(await cell('own hills square', Settlers))).to.include(
      'BuildMine'
    );
    expect(offered(await cell('own jungle square', Settlers))).to.include(
      'ClearJungle'
    );
    expect(offered(await cell('own swamp square', Settlers))).to.include(
      'ClearSwamp'
    );
    expect(
      offered(await cell('own road square, Railroad known', Settlers))
    ).to.include('BuildRailroad');
  });

  // A deterministic stand-in for the hot path's cost: the plain criteria the action rules validate across every cell
  //  but the distant square (whose count depends on the path search).
  it('validates the same number of criteria', async (): Promise<void> => {
    const cells: Cell[] = [];

    for (const UnitType of unitTypes) {
      for (const scenario of scenarios) {
        if (!scenario.name.startsWith('distant square')) {
          cells.push(await setUp(scenario, UnitType));
        }
      }
    }

    const validate = Criterion.prototype.validate;
    let count = 0;

    Criterion.prototype.validate = function (
      this: Criterion,
      ...args: unknown[]
    ): boolean {
      count++;

      return validate.apply(this, args);
    };

    try {
      cells.forEach((cell) => offered(cell));
    } finally {
      Criterion.prototype.validate = validate;
    }

    expect(cells).length(51 * 21);
    expect(count).to.equal(361861);
  });
});
