import AIClient from '@civ-clone/core-ai-client/AIClient';
import Client from '@civ-clone/core-client/Client';
import Writing from '@civ-clone/base-science-advance-writing/Writing';
// Civilization II's new orders and the rules around them, as civ2-unit registers them (survey-units §4.1, §5.1 and §7;
//  OpenCiv2 richardpenman/civ2@49f26ec).
import airliftShotDown, { airliftThreat } from '../Rules/Unit/airlift';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import { Peace } from '@civ-clone/library-diplomacy/Declarations';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import {
  Airlift,
  BuildAirbase,
  BuildFarmland,
  BuildFortress,
  BuildIrrigation,
  Pillage,
  TransformTerrain,
} from '../Actions';
import {
  CruiseMissile,
  Diplomat,
  Engineer,
  Fighter,
  Musketman as Musketeers,
  Nuclear,
  Paratrooper,
  Partisan,
  Settlers,
  Spy,
  Submarine,
  Trireme,
} from '../Units';
import {
  Farmland,
  Fortress,
  Irrigation,
  Railroad,
  Road,
} from '@civ-clone/civ2-world/TileImprovements';
import { Grassland, Hills, Mountains } from '@civ-clone/civ2-world/Terrains';
import { addCity, addPlayer, setUp } from './lib/game';
import { Construction, Refrigeration } from '@civ-clone/civ2-world/Advances';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Detonated from '@civ-clone/base-unit-action-nuclear-attack/Rules/Detonated';
import Lighthouse from '@civ-clone/base-wonder-lighthouse/Lighthouse';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import Navigation from '@civ-clone/base-science-advance-navigation/Navigation';
import PillageTarget from '@civ-clone/base-unit-action-pillage/Rules/PillageTarget';
import SdiDefence from '@civ-clone/base-city-improvement-sdidefence/SdiDefence';
import Seafaring from '@civ-clone/base-science-advance-seafaring/Seafaring';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import WorkRate from '@civ-clone/core-unit/Rules/WorkRate';
import { expect } from 'chai';
import triremeLossChance from '../lib/coastBound';

const actionNames = (unit: Unit, to: Tile): string[] =>
  unit.actions(to).map((action: UnitAction): string => action.constructor.name);

describe('terrain work', function (): void {
  this.timeout(20000);

  it('takes a fortress half the movement cost and 3, an airbase 4, a transform the cost × 20 turns (`unit_terrain_work_turns`)', async (): Promise<void> => {
    const { game, player, at } = await setUp((x: number): typeof Terrain =>
        x === 0 ? Grassland : x === 1 ? Hills : Mountains
      ),
      turns = (Action: typeof BuildFortress, tile: Tile): number => {
        const unit = new Engineer(null, player, tile, game.rules);

        return Math.max(
          ...game.rules.process(
            MovementCost,
            unit,
            new Action(tile, tile, unit, game.rules)
          )
        );
      };

    // The figures count the turn the order is given on, so the rules answer one fewer.
    expect(
      [at(0, 0), at(1, 0), at(2, 0)].map((tile) => turns(BuildFortress, tile))
    ).to.deep.equal([2, 3, 3]);
    expect(turns(BuildAirbase, at(0, 0))).to.equal(3);
    expect(
      [at(0, 0), at(2, 0)].map((tile) => turns(TransformTerrain, tile))
    ).to.deep.equal([19, 59]);
  });

  it('has Engineers work at twice the rate of Settlers', async (): Promise<void> => {
    const { game, player, at } = await setUp();

    expect(
      game.rules.process(
        WorkRate,
        new Engineer(null, player, at(1, 1), game.rules)
      )
    ).to.deep.equal([2]);
    expect(
      game.rules.process(
        WorkRate,
        new Settlers(null, player, at(1, 1), game.rules)
      )
    ).to.deep.equal([]);
  });

  it('offers Engineers, not Settlers, a transform, and a fortress outside a city with Construction', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      engineer = new Engineer(null, player, at(1, 1), game.rules),
      settlers = new Settlers(null, player, at(1, 1), game.rules);

    [engineer, settlers].forEach((unit) => unit.moves().set(1));

    expect(actionNames(engineer, at(1, 1))).to.include('TransformTerrain');
    expect(actionNames(settlers, at(1, 1))).to.not.include('TransformTerrain');
    expect(actionNames(settlers, at(1, 1))).to.not.include('BuildFortress');

    game.playerResearch.getByPlayer(player).addAdvance(Construction);

    expect(actionNames(settlers, at(1, 1))).to.include('BuildFortress');

    addCity(game, player, at(1, 1), 'Home');

    expect(actionNames(settlers, at(1, 1))).to.not.include('BuildFortress');
  });
});

describe('farmland (`unit_cmd_terraform` order 6)', function (): void {
  this.timeout(20000);

  it('offers Engineers on an irrigated square with Refrigeration farmland, not irrigation, for the same turns, and builds it', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      // Beside the ocean (column 8), so it has water.
      tile = at(7, 1),
      engineer = new Engineer(null, player, tile, game.rules),
      has = (Improvement: typeof TileImprovement): boolean =>
        game.tileImprovements
          .getByTile(tile)
          .some((improvement) => improvement instanceof Improvement),
      turns = (action: UnitAction): number =>
        Math.max(...game.rules.process(MovementCost, engineer, action));

    engineer.moves().set(1);

    expect(actionNames(engineer, tile)).to.include('BuildIrrigation');
    expect(actionNames(engineer, tile)).to.not.include('BuildFarmland');

    const irrigationTurns = turns(
      new BuildIrrigation(tile, tile, engineer, game.rules)
    );

    game.tileImprovements.register(new Irrigation(tile, game.rules));

    // Irrigated, without Refrigeration: neither.
    expect(actionNames(engineer, tile)).to.not.include('BuildIrrigation');
    expect(actionNames(engineer, tile)).to.not.include('BuildFarmland');

    game.playerResearch.getByPlayer(player).addAdvance(Refrigeration);

    expect(actionNames(engineer, tile)).to.include('BuildFarmland');
    expect(actionNames(engineer, tile)).to.not.include('BuildIrrigation');

    const action = engineer
      .actions(tile)
      .find((offer) => offer instanceof BuildFarmland) as BuildFarmland;

    // Built with the game's own improvements, where finishing looks for the Irrigation (civ-clone/web-renderer#248).
    expect(action.tileImprovementRegistry()).to.equal(game.tileImprovements);

    // `unit_terrain_work_turns` order 6: the irrigation order's turns.
    expect(turns(action)).to.equal(irrigationTurns);

    BuildFarmland.complete(action, action.tileImprovementRegistry());

    expect(has(Farmland)).to.true;
    expect(has(Irrigation)).to.true;
    expect(actionNames(engineer, tile)).to.not.include('BuildFarmland');
  });
});

describe('pillage (`unit_pillage`)', function (): void {
  this.timeout(20000);

  it('takes irrigation before a fortress, before the railroad and road; Partisans the railroad first', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      tile = at(1, 1),
      improvements = [Road, Railroad, Fortress, Irrigation].map(
        (Improvement: typeof TileImprovement) => {
          const improvement = new Improvement(tile, game.rules);

          game.tileImprovements.register(improvement);

          return improvement;
        }
      ),
      target = (unit: Unit): string =>
        game.rules
          .process(PillageTarget, unit, tile, improvements)
          .find((answer) => answer !== undefined)!.constructor.name;

    expect(target(new Musketeers(null, player, tile, game.rules))).to.equal(
      'Irrigation'
    );
    expect(target(new Partisan(null, player, tile, game.rules))).to.equal(
      'Railroad'
    );
    expect(Pillage).to.not.undefined;
  });
});

describe('paradrop, airlift and sabotage', function (): void {
  this.timeout(20000);

  it('drops Paratroopers from a city onto land within 10 by `map_distance`', async (): Promise<void> => {
    const { game, player, at } = await setUp((): typeof Terrain => Grassland),
      paratrooper = new Paratrooper(null, player, at(0, 0), game.rules);

    paratrooper.moves().set(paratrooper.movement().value());

    expect(actionNames(paratrooper, at(5, 10))).to.not.include('Paradrop');

    addCity(game, player, at(0, 0), 'Base');

    // (5, 10) is 10 away; (6, 11) is 11, across the seam.
    expect(actionNames(paratrooper, at(5, 10))).to.include('Paradrop');
    expect(actionNames(paratrooper, at(6, 11))).to.not.include('Paradrop');
  });

  it('airlifts a land unit between two cities with an Airport', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      from = addCity(game, player, at(1, 1), 'From'),
      to = addCity(game, player, at(5, 5), 'To'),
      musketeers = new Musketeers(null, player, at(1, 1), game.rules);

    musketeers.moves().set(1);
    game.cityImprovements.register(new Airport(from, game.rules));

    expect(actionNames(musketeers, at(5, 5))).to.not.include('Airlift');

    game.cityImprovements.register(new Airport(to, game.rules));

    expect(actionNames(musketeers, at(5, 5))).to.include('Airlift');
  });

  it("offers a person's Spy, not a Diplomat or a computer's Spy, sabotage of another player's lone unit, and each a bribe (`spy_unit_mission`)", async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      computer = addPlayer(game),
      spy = new Spy(null, player, at(1, 1), game.rules),
      diplomat = new Diplomat(null, player, at(1, 1), game.rules),
      computerSpy = new Spy(null, computer, at(1, 2), game.rules);

    game.clients.register(new (class extends Client {})(player) as never);
    game.clients.register(new (class extends AIClient {})(computer) as never);

    [spy, diplomat, computerSpy].forEach((unit) => unit.moves().set(1));
    new Musketeers(null, enemy, at(2, 1), game.rules);

    // A computer bribes only knowing the Diplomat's prerequisite (`unit_spy.cpp:1090`).
    expect(actionNames(computerSpy, at(2, 1))).to.not.include('BribeUnit');
    game.playerResearch.getByPlayer(computer).addAdvance(Writing);

    expect(actionNames(spy, at(2, 1))).to.include.members([
      'BribeUnit',
      'SabotageUnit',
    ]);
    expect(actionNames(diplomat, at(2, 1))).to.include('BribeUnit');
    expect(actionNames(diplomat, at(2, 1))).to.not.include('SabotageUnit');
    expect(actionNames(computerSpy, at(2, 1))).to.include('BribeUnit');
    expect(actionNames(computerSpy, at(2, 1))).to.not.include('SabotageUnit');
  });
});

describe('ships and missiles', function (): void {
  this.timeout(20000);

  it('loses a Trireme out of sight of land 1 in 2, 1 in 4 with Seafaring, 1 in 8 with Navigation too, never with the Lighthouse', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      trireme = new Trireme(null, player, at(10, 10), game.rules),
      chance = triremeLossChance({
        playerResearchRegistry: game.playerResearch,
        requirementRegistry: game.requirements,
        wonderRegistry: game.wonders,
      }),
      research = game.playerResearch.getByPlayer(player),
      odds: number[] = [chance(trireme)];

    research.addAdvance(Seafaring);
    odds.push(chance(trireme));
    research.addAdvance(Navigation);
    odds.push(chance(trireme));

    expect(odds).to.deep.equal([1 / 2, 1 / 4, 1 / 8]);

    const city = addCity(game, player, at(1, 1), 'Port');

    game.wonders.register(new Lighthouse(city, game.rules));

    expect(chance(trireme)).to.equal(0);
  });

  it("lets a missile, not a fighter, land on its player's submarine", async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      missile = new CruiseMissile(null, player, at(8, 1), game.rules),
      fighter = new Fighter(null, player, at(8, 2), game.rules);

    [missile, fighter].forEach((unit) => unit.moves().set(1));
    new Submarine(null, player, at(9, 1), game.rules);
    new Submarine(null, player, at(9, 2), game.rules);

    expect(actionNames(missile, at(9, 1))).to.include('LandAircraft');
    expect(actionNames(fighter, at(9, 2))).to.not.include('LandAircraft');
  });

  it("stops a nuclear attack within 3 of another player's city with SDI Defense, telling the client (`unit_nuclear_attack`)", async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      city = addCity(game, enemy, at(1, 1), 'Shielded'),
      stopped: Unit[] = [],
      detonate = (target: Tile): number => {
        const nuclear = new Nuclear(null, player, at(1, 9), game.rules),
          defender = new Musketeers(null, enemy, target, game.rules);

        game.rules.process(Detonated, nuclear, target);

        return [defender].filter((unit) => !unit.destroyed()).length;
      };

    game.engine.on('unit:nuclear-stopped', (unit: Unit) => stopped.push(unit));
    game.cityImprovements.register(new SdiDefence(city, game.rules));

    // (4, 1) is 3 away; (5, 1) is 4.
    expect([detonate(at(4, 1)), detonate(at(5, 1))]).to.deep.equal([1, 0]);
    expect(stopped.length).to.equal(1);
  });
});

describe('unit improvements a save names', (): void => {
  it('registers the fuel, healing and paradrop marks as available unit improvements', async (): Promise<void> => {
    await import('../registerUnitImprovements');

    const {
      instance,
    } = require('@civ-clone/core-unit-improvement/AvailableUnitImprovementRegistry');

    expect(
      instance
        .entries()
        .map((Improvement: Function): string => Improvement.name)
    ).to.include.members([
      'Fortified',
      'Veteran',
      'Aloft',
      'MovedThisTurn',
      'Paradropped',
    ]);
  });
});

describe('airlift interception (`unit_cmd_airlift`, `unit_airlift_perform`)', function (): void {
  this.timeout(20000);

  it('counts each enemy air-superiority unit within its moves of either city, a veteran twice, none at peace', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      dependencies = {
        interactionRegistry: game.interactions,
        unitImprovementRegistry: game.unitImprovements,
        unitRegistry: game.units,
      };

    // Fighters have 10 moves: (1, 1) to (5, 5) is 4 away.
    new Fighter(null, enemy, at(5, 5), game.rules);
    expect(
      airliftThreat(player, at(1, 1), at(1, 11), dependencies)[0]
    ).to.equal(1);

    game.unitImprovements.register(
      new Veteran(new Fighter(null, enemy, at(6, 6), game.rules))
    );
    expect(
      airliftThreat(player, at(1, 1), at(1, 11), dependencies)[0]
    ).to.equal(3);

    game.interactions.register(new Peace(player, enemy, game.rules));
    expect(
      airliftThreat(player, at(1, 1), at(1, 11), dependencies)[0]
    ).to.equal(0);
  });

  it('shoots the unit down on a roll of 1 in 6 for each count', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      shotDown = (roll: number): boolean => {
        const ruleRegistry = new RuleRegistry(),
          musketeers = new Musketeers(null, player, at(1, 1), game.rules);

        ruleRegistry.register(
          ...airliftShotDown({
            engine: game.engine,
            interactionRegistry: game.interactions,
            randomNumberGenerator: (): number => roll,
            unitImprovementRegistry: game.unitImprovements,
            unitRegistry: game.units,
          })
        );
        ruleRegistry.process(
          Moved,
          musketeers,
          new Airlift(at(1, 1), at(4, 4), musketeers, game.rules)
        );

        return musketeers.destroyed();
      };

    new Fighter(null, enemy, at(5, 5), game.rules);

    expect([shotDown(0), shotDown(0.2), shotDown(0.9)]).to.deep.equal([
      true,
      false,
      false,
    ]);
  });
});
