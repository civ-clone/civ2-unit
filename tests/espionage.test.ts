import {
  Caravan,
  Diplomat,
  Musketman as Musketeers,
  Nuclear,
  Spy,
  Warrior,
} from '../Units';
import {
  PRODUCTION,
  bribeCost,
  detected,
  detectionChance,
  deviceDiscovered,
  improvementOrder,
  inciteCost,
  randomSabotageTarget,
  sabotagesProduction,
  theftOrder,
} from '../lib/espionage';
import { addCity, addPlayer, setUp } from './lib/game';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import AdvanceStolen from '@civ-clone/base-unit-action-steal-technology/AdvanceStolen';
import Alphabet from '@civ-clone/base-science-advance-alphabet/Alphabet';
import BronzeWorking from '@civ-clone/base-science-advance-bronzeworking/BronzeWorking';
import Ceasefire from '@civ-clone/base-diplomacy-declaration-ceasefire/Ceasefire';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import Client from '@civ-clone/core-client/Client';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import Detonated from '@civ-clone/base-unit-action-nuclear-attack/Rules/Detonated';
import Democracy from '@civ-clone/base-government-democracy/Democracy';
import { Game } from '@civ-clone/core-game/Game';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import { Never } from '@civ-clone/core-diplomacy/Expiries';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerTreasury from '@civ-clone/core-treasury/PlayerTreasury';
import SdiDefence from '@civ-clone/base-city-improvement-sdidefence/SdiDefence';
import Temple from '@civ-clone/base-city-improvement-temple/Temple';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import dependenciesOf from '@civ-clone/civ2-diplomacy/lib/dependenciesOf';
import espionage from '../Rules/Unit/espionage';
import { expect } from 'chai';
import { investigated } from '../lib/missionRecords';
import { Food } from '@civ-clone/civ2-city/Yields';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import { robbed } from '../Rules/Unit/espionage';
import { Ironclad, Trireme } from '../Units';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import Fortified from '@civ-clone/base-unit-action-fortify/Rules/Fortified';
import Sleeping from '@civ-clone/base-unit-action-sleep/Rules/Sleeping';
import computerMission from '../lib/computerMission';
import missionChoiceRules from '../Rules/Unit/missionChoice';
import { missionChoice } from '@civ-clone/base-unit-agent/lib/mission';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { Deity } from '@civ-clone/civ2-difficulty/Difficulties';
import ManhattanProject from '@civ-clone/base-wonder-manhattanproject/ManhattanProject';
import NuclearFission from '@civ-clone/base-science-advance-nuclearfission/NuclearFission';
import Rocketry from '@civ-clone/base-science-advance-rocketry/Rocketry';
import War from '@civ-clone/base-diplomacy-declaration-war/War';
import Writing from '@civ-clone/base-science-advance-writing/Writing';
import Vendetta from '@civ-clone/library-diplomacy/Declarations/Vendetta';

// The Diplomat's and Spy's missions (OpenCiv2 `src/auto/unit_spy.cpp`, e39fe7b): the numbers at their boundaries, and
//  the missions on base-unit-agent's seams.

const person = (game: Game, player: Player): void =>
    game.clients.register(new (class extends Client {})(player) as never),
  computer = (game: Game, player: Player): void =>
    game.clients.register(new (class extends AIClient {})(player) as never),
  treasury = (game: Game, player: Player, gold: number): void => {
    const playerTreasury = new PlayerTreasury(
      player,
      Gold,
      game.cityBuilds,
      game.rules
    );

    playerTreasury.set(gold);
    game.playerTreasuries.register(playerTreasury);
  },
  build = (
    game: Game,
    city: City,
    Improvement: new (city: City, ...args: any[]) => CityImprovement
  ): CityImprovement => {
    const improvement = new Improvement(city, game.rules);

    game.cityImprovements.register(improvement);

    return improvement;
  },
  // A sequence of draws, each `n / d` for a roll of `rand % d` that comes to `n` (the last repeats).
  draws =
    (...values: number[]) =>
    (): number =>
      values.length > 1 ? values.shift()! : values[0],
  // civ2-unit's espionage rules again, drawing from `rng`.
  withRng = (game: Game, rng: () => number): void =>
    espionage({
      cityBuildRegistry: game.cityBuilds,
      cityGrowthRegistry: game.cityGrowth,
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      clientRegistry: game.clients,
      diplomacy: dependenciesOf(game),
      engine: game.engine,
      interactionRegistry: game.interactions,
      pendingEffectRegistry: game.pendingEffects,
      playerGovernmentRegistry: game.playerGovernments,
      playerResearchRegistry: game.playerResearch,
      playerTreasuryRegistry: game.playerTreasuries,
      randomNumberGenerator: rng,
      ruleRegistry: game.rules,
      transportRegistry: game.transports,
      turn: game.turn,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
    }).forEach((rule) => game.rules.replace(rule.id()!, rule)),
  find = (unit: Unit, to: Tile, name: string): UnitAction | undefined =>
    unit
      .actions(to)
      .find((action: UnitAction): boolean => action.constructor.name === name),
  names = (unit: Unit, to: Tile): string[] =>
    unit
      .actions(to)
      .map((action: UnitAction): string => action.constructor.name);

describe('mission numbers', (): void => {
  it('prices an incite as size × ((gold + 1000) / (distance + 3)), dividing first (`unit_spy.cpp:759-786`)', (): void => {
    const base = {
      size: 5,
      gold: 1000,
      distance: 7,
      communist: false,
      courthouse: false,
      disorder: false,
      empty: false,
      founder: false,
      spy: false,
      veteran: false,
    };

    // 2000 / 10 = 200, × 5.
    expect(inciteCost(base)).to.equal(1000);
    // 2001 / 10 = 200 still: the division comes first.
    expect(inciteCost({ ...base, gold: 1001 })).to.equal(1000);
    // Communism caps the distance at 10 only from 10 on: 9 stays.
    expect(inciteCost({ ...base, distance: 9, communist: true })).to.equal(
      5 * Math.trunc(2000 / 12)
    );
    expect(inciteCost({ ...base, distance: 16, communist: true })).to.equal(
      5 * Math.trunc(2000 / 13)
    );
    // A Courthouse halves the distance (7 → 3).
    expect(inciteCost({ ...base, courthouse: true })).to.equal(
      5 * Math.trunc(2000 / 6)
    );
    // Disorder, an empty city and the founder halve it each.
    expect(
      inciteCost({ ...base, disorder: true, empty: true, founder: true })
    ).to.equal(125);
    // A Spy takes a sixth off, a veteran a third, each rounded down first.
    expect(inciteCost({ ...base, spy: true })).to.equal(1000 - 166);
    expect(inciteCost({ ...base, spy: true, veteran: true })).to.equal(
      1000 - 333
    );
  });

  it('prices a bribe as cost × ((gold + 750) / (distance + 2)), halved but for Settlers (`unit_spy.cpp:1104-1114`)', (): void => {
    const base = {
      unitCost: 3,
      gold: 250,
      distance: 8,
      briberCommunist: false,
      settler: false,
    };

    // 1000 / 10 = 100, × 3 = 300, halved.
    expect(bribeCost(base)).to.equal(150);
    expect(bribeCost({ ...base, settler: true })).to.equal(300);
    // 1009 / 10 = 100: the division first.
    expect(bribeCost({ ...base, gold: 259 })).to.equal(150);
    // The briber's Communism caps the distance at 10: 16 → 10.
    expect(
      bribeCost({ ...base, distance: 16, briberCommunist: true })
    ).to.equal(Math.trunc((3 * Math.trunc(1000 / 12)) / 2));
    expect(bribeCost({ ...base, distance: 9, briberCommunist: true })).to.equal(
      Math.trunc((3 * Math.trunc(1000 / 11)) / 2)
    );
  });

  it('detects a random theft at 20, 40 or 60 in 100, the first success ending it (`unit_spy.cpp:405-420`)', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      diplomat = new Diplomat(null, player, at(1, 1), game.rules),
      spy = new Spy(null, player, at(1, 1), game.rules),
      veteran = new Spy(null, player, at(1, 1), game.rules),
      warrior = new Warrior(null, player, at(1, 1), game.rules);

    game.unitImprovements.register(new Veteran(veteran));

    expect(
      [diplomat, spy, veteran, warrior].map((unit) =>
        detectionChance(unit, game.unitImprovements)
      )
    ).to.deep.equal([20, 40, 60, 0]);

    // A roll of 19 detects; 20 doesn't.
    expect(detected([diplomat], draws(0.19), game.unitImprovements)).to.true;
    expect(detected([diplomat], draws(0.2), game.unitImprovements)).to.false;
    expect(detected([spy], draws(0.39), game.unitImprovements)).to.true;
    expect(detected([veteran], draws(0.59), game.unitImprovements)).to.true;
    expect(detected([veteran], draws(0.6), game.unitImprovements)).to.false;

    // One draw per defender until one succeeds.
    let count = 0;

    detected(
      [diplomat, spy, veteran],
      () => (count++ < 1 ? 0.5 : 0.1),
      game.unitImprovements
    );
    expect(count).to.equal(2);
  });

  it('walks 100 advance slots and 39 building slots, as the original does', (): void => {
    expect(theftOrder).length(100);
    expect(theftOrder.slice(90).every((slot) => slot === null)).to.true;
    expect(improvementOrder).length(39);
    expect(improvementOrder[1]).to.equal(Palace);
    expect(improvementOrder[8]).to.equal(CityWalls);
    expect(improvementOrder[17]).to.equal(SdiDefence);
  });

  it('never sabotages the Palace or SDI Defense at random, walking on from a random slot', (): void => {
    const has = (Type: typeof CityImprovement): boolean =>
      [Palace, SdiDefence, Temple].includes(Type as never);

    // From Palace's slot on, the Temple (slot 4) is the first it can take.
    expect(randomSabotageTarget(has, draws(1 / 39))).to.equal(Temple);
    // From after the Temple, round past SDI Defense and the Palace to the Temple again.
    expect(randomSabotageTarget(has, draws(5 / 39))).to.equal(Temple);
    expect(
      randomSabotageTarget(
        (Type): boolean => [Palace, SdiDefence].includes(Type as never),
        draws(0)
      )
    ).to.null;
  });

  it('takes the production at 1 in 2 for a Diplomat, 1 in 3 for a Spy, one more for a veteran (`unit_spy.cpp:563-575`)', (): void => {
    expect(sabotagesProduction(false, false, draws(0.49))).to.true;
    expect(sabotagesProduction(false, false, draws(0.5))).to.false;
    expect(sabotagesProduction(true, false, draws(0.33))).to.true;
    expect(sabotagesProduction(true, false, draws(0.34))).to.false;
    expect(sabotagesProduction(true, true, draws(0.24))).to.true;
    expect(sabotagesProduction(true, true, draws(0.25))).to.false;
  });

  it('discovers a planted device at ½, a veteran ¼, a Fundamentalist never (`unit_spy.cpp:693-704`)', (): void => {
    expect(deviceDiscovered(false, false, draws(0.49))).to.true;
    expect(deviceDiscovered(false, false, draws(0.5))).to.false;
    expect(deviceDiscovered(false, true, draws(0.24))).to.true;
    expect(deviceDiscovered(false, true, draws(0.25))).to.false;
    expect(deviceDiscovered(true, false, draws(0))).to.false;
  });
});

describe('missions', function (): void {
  this.timeout(20000);

  // A city of `enemy`'s at (2, 1), with an agent of `player`'s beside it at (1, 1).
  const mission = async (
    UnitType: typeof Unit = Spy,
    who: 'person' | 'computer' = 'person'
  ) => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      city = addCity(game, enemy, at(2, 1), 'Target'),
      home = addCity(game, player, at(1, 5), 'Home'),
      unit = new UnitType(home, player, at(1, 1), game.rules);

    (who === 'person' ? person : computer)(game, player);
    computer(game, enemy);
    unit.moves().set(3);
    treasury(game, player, 1000);
    treasury(game, enemy, 0);

    return { ...setting, city, home, unit };
  };

  it('uses up a Diplomat after a theft, and lets a Spy escape to its nearest city as a veteran, a move spent (`spy_try_escape`)', async (): Promise<void> => {
    const {
      game,
      enemy,
      city,
      home,
      unit: diplomat,
      at,
    } = await mission(Diplomat, 'computer');

    game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);
    find(diplomat, at(2, 1), 'StealTechnology')!.perform();
    expect(diplomat.destroyed()).to.true;

    // A Spy at the city now robbed: a hard escape, so a caught check first.
    const spy = new Spy(home, diplomat.player(), at(1, 1), game.rules);

    spy.moves().set(3);
    game.playerResearch.getByPlayer(enemy).addAdvance(BronzeWorking);
    // Caught check passes (roll 1 of 3), the walk, the escape's roll (1 of 1 + coin… odds 1 < 2: the coin adds 1).
    withRng(game, draws(0.5, 0.5, 0.2, 0.9));
    find(spy, at(2, 1), 'StealTechnology')!.perform();

    expect(spy.destroyed()).to.false;
    expect(spy.tile()).to.equal(home.tile());
    expect(spy.moves().value()).to.equal(0);
    expect(
      game.unitImprovements
        .getByUnit(spy)
        .some((improvement) => improvement instanceof Veteran)
    ).to.true;
    expect(
      game.interactions
        .entries()
        .filter(
          (interaction) =>
            interaction instanceof AdvanceStolen &&
            (interaction as unknown as AdvanceStolen).city() === city
        )
    ).length(2);
  });

  it('offers a Diplomat a theft once per city, and a Spy again (`CITYF_TECH_STOLEN`)', async (): Promise<void> => {
    const {
      game,
      player,
      enemy,
      city,
      home,
      unit: diplomat,
      at,
    } = await mission(Diplomat, 'computer');

    game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);
    game.playerResearch.getByPlayer(enemy).addAdvance(BronzeWorking);
    expect(names(diplomat, at(2, 1))).to.include('StealTechnology');

    game.interactions.register(
      new AdvanceStolen(player, enemy, city, game.rules, game.turn) as never
    );
    expect(names(diplomat, at(2, 1))).to.not.include('StealTechnology');

    const spy = new Spy(home, player, at(1, 1), game.rules);

    spy.moves().set(3);
    expect(names(spy, at(2, 1))).to.include('StealTechnology');
  });

  it("lets only a person's Spy choose an advance, at a city not yet robbed", async (): Promise<void> => {
    const { game, enemy, unit: spy, at } = await mission(Spy, 'person');

    game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);

    const steal = find(spy, at(2, 1), 'StealTechnology') as unknown as {
      targets(): unknown[];
    };

    expect(steal.targets()).to.deep.equal([Alphabet]);

    const { unit: computerSpy, ...other } = await mission(Spy, 'computer');

    other.game.playerResearch.getByPlayer(other.enemy).addAdvance(Alphabet);
    expect(
      (
        find(computerSpy, other.at(2, 1), 'StealTechnology') as unknown as {
          targets(): unknown[];
        }
      ).targets()
    ).to.deep.equal([]);
  });

  it('detects a random theft: the thief stays with no moves, nothing stolen', async (): Promise<void> => {
    const {
      game,
      enemy,
      unit: diplomat,
      at,
      player,
    } = await mission(Diplomat, 'computer');

    game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);
    new Spy(null, enemy, at(2, 1), game.rules);
    withRng(game, draws(0.3));
    find(diplomat, at(2, 1), 'StealTechnology')!.perform();

    expect(diplomat.destroyed()).to.false;
    expect(diplomat.moves().value()).to.equal(0);
    expect(game.playerResearch.getByPlayer(player).completed(Alphabet)).to
      .false;
  });

  it("makes a chosen sabotage's caught checks: one, one more for a Palace, one more for City Walls (`unit_spy.cpp:510-521`)", async (): Promise<void> => {
    const { game, city, unit: spy, at } = await mission(Spy, 'person'),
      walls = build(game, city, CityWalls);

    build(game, city, Palace);

    let count = 0;

    withRng(game, () => (count++, 0.9));
    (
      find(spy, at(2, 1), 'IndustrialSabotage') as unknown as {
        perform(choice: unknown): void;
      }
    ).perform('CityWalls');

    // The slot walk's draw first (`unit_spy.cpp:459`, whatever is chosen), three caught checks, then the hard escape:
    //  odds 2 halved to 1, and a coin flip (lost: no roll at odds 1).
    expect(count).to.equal(1 + 3 + 1);
    expect(walls.destroyed()).to.true;
    expect(spy.destroyed()).to.true;
  });

  it("offers a person's Spy the buildings but the Palace and SDI Defense, and the production", async (): Promise<void> => {
    const { game, city, unit: spy, at } = await mission(Spy, 'person'),
      temple = build(game, city, Temple);

    build(game, city, Palace);
    build(game, city, SdiDefence);

    expect(
      (
        find(spy, at(2, 1), 'IndustrialSabotage') as unknown as {
          targets(): unknown[];
        }
      ).targets()
    ).to.deep.equal([temple, PRODUCTION]);
  });

  it("changes nothing when two computer players' agents sabotage (`unit_spy.cpp:577`)", async (): Promise<void> => {
    const {
        game,
        city,
        unit: diplomat,
        at,
      } = await mission(Diplomat, 'computer'),
      temple = build(game, city, Temple);

    withRng(game, draws(0));
    find(diplomat, at(2, 1), 'IndustrialSabotage')!.perform();

    expect(temple.destroyed()).to.false;
    expect(diplomat.destroyed()).to.true;
  });

  it("keeps a person's Spy after an embassy for a third of a move, and uses up a computer's", async (): Promise<void> => {
    const { unit: spy, at } = await mission(Spy, 'person');

    find(spy, at(2, 1), 'EstablishEmbassy')!.perform();
    expect(spy.destroyed()).to.false;
    expect(spy.moves().value()).to.be.closeTo(3 - 1 / 3, 1e-9);

    const { unit: computerSpy, ...other } = await mission(Spy, 'computer');

    find(computerSpy, other.at(2, 1), 'EstablishEmbassy')!.perform();
    expect(computerSpy.destroyed()).to.true;
  });

  it("charges a person's Spy a third of a move for a city's first investigation only", async (): Promise<void> => {
    const { game, city, unit: spy, at } = await mission(Spy, 'person');

    find(spy, at(2, 1), 'InvestigateCity')!.perform();
    expect(spy.moves().value()).to.be.closeTo(3 - 1 / 3, 1e-9);
    expect(investigated(city, game.pendingEffects)).to.true;

    find(spy, at(2, 1), 'InvestigateCity')!.perform();
    expect(spy.moves().value()).to.be.closeTo(3 - 1 / 3, 1e-9);
    expect(spy.destroyed()).to.false;
  });

  it('poisons the water: a city above size 1 shrinks, a size-1 city loses its food (`unit_spy.cpp:621-626`)', async (): Promise<void> => {
    const { game, city, unit: spy, at } = await mission(Spy, 'computer'),
      growth = game.cityGrowth.getByCity(city);

    growth.progress().set(7);
    find(spy, at(2, 1), 'PoisonWater')!.perform();
    expect(growth.size()).to.equal(1);
    expect(growth.progress().value()).to.equal(0);

    // A person's Spy isn't offered it at size 1.
    const { unit: personSpy, ...other } = await mission(Spy, 'person');

    expect(names(personSpy, other.at(2, 1))).to.not.include('PoisonWater');
  });

  it('offers no incite in a Democracy, nor within 2 of the Palace, nor to a computer under a treaty', async (): Promise<void> => {
    const {
      game,
      enemy,
      city,
      unit: diplomat,
      at,
      player,
    } = await mission(Diplomat, 'computer');

    expect(names(diplomat, at(2, 1))).to.include('InciteRevolt');

    build(game, city, Palace);
    expect(names(diplomat, at(2, 1))).to.not.include('InciteRevolt');

    game.cityImprovements
      .getByCity(city)
      .forEach((improvement) => game.cityImprovements.unregister(improvement));

    game.interactions.register(
      new Ceasefire(player, enemy, new Never(), game.rules) as never
    );
    expect(names(diplomat, at(2, 1))).to.not.include('InciteRevolt');

    const { unit: other, ...democracy } = await mission(Diplomat, 'computer'),
      government = new PlayerGovernment(
        democracy.enemy,
        undefined,
        democracy.game.rules
      );

    government.set(new Democracy());
    democracy.game.playerGovernments.register(government);
    expect(names(other, democracy.at(2, 1))).to.not.include('InciteRevolt');
  });

  it('offers a person under a treaty the doubled price, and the warned forms of theft and sabotage', async (): Promise<void> => {
    const { game, enemy, unit: spy, at, player } = await mission(Spy, 'person');

    game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);
    game.interactions.register(
      new Peace(player, enemy, new Never(), game.rules) as never
    );

    const offered = names(spy, at(2, 1));

    expect(offered).to.include.members([
      'SneakStealTechnology',
      'SneakIndustrialSabotage',
      'InciteRevolt',
      'SubvertCity',
    ]);
    expect(offered).to.not.include.members([
      'StealTechnology',
      'IndustrialSabotage',
    ]);
  });

  it('incites a city: paid for, captured with the action as the cause, its units defecting, the Spy escaping elsewhere', async (): Promise<void> => {
    const {
      game,
      city,
      home,
      unit: spy,
      at,
      player,
    } = await mission(Spy, 'person');

    const defender = new Warrior(null, city.player(), at(2, 1), game.rules),
      beside = new Warrior(null, city.player(), at(3, 1), game.rules);

    withRng(game, draws(0.9));
    find(spy, at(2, 1), 'InciteRevolt')!.perform();

    expect(city.player()).to.equal(player);
    // Its units, in it and beside it, go with it (`city_incite_transfer`), homed there.
    expect(defender.player()).to.equal(player);
    expect(beside.player()).to.equal(player);
    expect(defender.city()).to.equal(city);
    expect(
      game.playerTreasuries.getByPlayerAndType(player, Gold).value()
    ).to.be.below(1000);
    expect(spy.tile()).to.equal(home.tile());
  });

  it("homes a homeless Caravan's route in its player's nearest city, never to that city itself (`unit.cpp:694-699`)", async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      near = addCity(game, player, at(2, 1), 'Near'),
      caravan = new Caravan(null, player, at(1, 1), game.rules);

    addCity(game, player, at(1, 3), 'Other');
    computer(game, player);
    caravan.moves().set(1);

    // The nearest city is `Near` itself: no route there.
    expect(names(caravan, at(2, 1))).to.not.include('EstablishTradeRoute');
    expect(names(caravan, at(1, 2)).length).to.be.above(0);

    const homed = new Caravan(near, player, at(1, 2), game.rules);

    homed.moves().set(1);
    expect(names(homed, at(1, 3))).to.include('EstablishTradeRoute');
    expect(names(homed, at(1, 3))).to.include('Move');
  });

  it("doesn't let SDI Defense stop a planted device (`unit_nuclear_attack(…, 0)`)", async (): Promise<void> => {
    const { game, enemy, at, player } = await setUp(),
      city = addCity(game, enemy, at(3, 3), 'Target'),
      shield = addCity(game, enemy, at(3, 5), 'Shield'),
      missile = new Nuclear(null, player, at(1, 3), game.rules),
      defender = new Musketeers(null, enemy, at(3, 3), game.rules);

    build(game, shield, SdiDefence);

    const stopped: Unit[] = [];

    game.engine.on('unit:nuclear-stopped', (unit: Unit) => stopped.push(unit));

    // A missile is stopped; a Spy's device goes off.
    game.rules.process(Detonated, missile, city.tile());
    expect(stopped).to.deep.equal([missile]);
    expect(defender.destroyed()).to.false;

    const spy = new Spy(null, player, at(2, 3), game.rules);

    game.rules.process(Detonated, spy, city.tile());
    expect(stopped).to.deep.equal([missile]);
  });
});

describe("a computer player's mission (`spy_city_mission_ai_choice`)", function (): void {
  this.timeout(20000);

  const choose = async (
    UnitType: typeof Unit,
    prepare: (game: Game, player: Player, enemy: Player, city: City) => void,
    random: () => number = draws(0.9)
  ) => {
    const { game, player, enemy, at } = await setUp(),
      city = addCity(game, enemy, at(2, 1), 'Target'),
      unit = new UnitType(null, player, at(1, 1), game.rules);

    prepare(game, player, enemy, city);

    return computerMission(
      unit,
      city,
      { ...dependenciesOf(game), pendingEffectRegistry: game.pendingEffects },
      random
    );
  };

  it('steals by default; a Diplomat at a robbed city sabotages, or under a treaty makes an embassy', async (): Promise<void> => {
    const rob = (game: Game, player: Player, enemy: Player, city: City) =>
      game.interactions.register(
        new AdvanceStolen(player, enemy, city, game.rules, game.turn) as never
      );

    expect(await choose(Diplomat, () => undefined)).to.equal(
      'steal-technology'
    );
    expect(await choose(Diplomat, rob)).to.equal('industrial-sabotage');
    expect(await choose(Spy, rob)).to.equal('steal-technology');
    expect(
      await choose(Diplomat, (game, player, enemy, city) => {
        rob(game, player, enemy, city);
        game.interactions.register(
          new Ceasefire(player, enemy, new Never(), game.rules) as never
        );
      })
    ).to.equal('establish-embassy');
  });

  it('poisons one time in three with a vendetta, a Spy only', async (): Promise<void> => {
    const feud = (game: Game, player: Player, enemy: Player) =>
      game.interactions.register(
        new Vendetta(player, enemy, new Never(), game.rules) as never
      );

    expect(await choose(Spy, feud, draws(0.33))).to.equal('poison-water');
    expect(await choose(Spy, feud, draws(0.34))).to.equal('steal-technology');
    expect(await choose(Diplomat, feud, draws(0))).to.equal('steal-technology');
  });
});

describe('escape odds, prices and a planted device, through the rules', function (): void {
  this.timeout(20000);

  const agent = async (
    UnitType: typeof Unit,
    who: 'person' | 'computer',
    veteran = false
  ) => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      city = addCity(game, enemy, at(2, 1), 'Target'),
      home = addCity(game, player, at(1, 5), 'Home'),
      unit = new UnitType(home, player, at(1, 1), game.rules);

    (who === 'person' ? person : computer)(game, player);
    computer(game, enemy);
    unit.moves().set(3);
    treasury(game, player, 1000);
    treasury(game, enemy, 0);

    if (veteran) {
      game.unitImprovements.register(new Veteran(unit));
    }

    return { ...setting, city, home, unit };
  };

  it('escapes an ordinary mission at odds 2, a veteran at 4 (`spy_try_escape`)', async (): Promise<void> => {
    // A random sabotage of a city with nothing in it: one draw for the slot walk, then the escape's roll.
    const escapes = async (veteran: boolean, roll: number) => {
      const { game, unit, at } = await agent(Spy, 'computer', veteran);

      withRng(game, draws(0, roll));
      find(unit, at(2, 1), 'IndustrialSabotage')!.perform();

      return !unit.destroyed();
    };

    expect(await escapes(false, 0.49)).to.false;
    expect(await escapes(false, 0.5)).to.true;
    expect(await escapes(true, 0.24)).to.false;
    expect(await escapes(true, 0.25)).to.true;
  });

  it('passes a caught check at odds 3, a veteran at 6 (`spy_check_caught`)', async (): Promise<void> => {
    // A person's Spy choosing an advance: the caught check is the first draw.
    const passes = async (veteran: boolean, roll: number) => {
      const { game, enemy, unit, at } = await agent(Spy, 'person', veteran);

      game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);
      // The theft's slot draw comes first (`unit_spy.cpp:352`), then the caught check.
      withRng(game, draws(0.5, roll, 0.9));
      (
        find(unit, at(2, 1), 'StealTechnology') as unknown as {
          perform(choice: unknown): void;
        }
      ).perform('Alphabet');

      return game.playerResearch.getByPlayer(unit.player()).completed(Alphabet);
    };

    expect(await passes(false, 0.33)).to.false;
    expect(await passes(false, 0.34)).to.true;
    expect(await passes(true, 0.16)).to.false;
    expect(await passes(true, 0.17)).to.true;
  });

  it('has a computer incite only with twice the price in hand, and bribe only up to half its gold', async (): Promise<void> => {
    const {
        game,
        city,
        unit: diplomat,
        at,
        player,
      } = await agent(Diplomat, 'computer'),
      incite = find(diplomat, at(2, 1), 'InciteRevolt') as unknown as {
        cost(): number;
        perform(): void;
      },
      gold = game.playerTreasuries.getByPlayerAndType(player, Gold);

    gold.set(incite.cost() * 2 - 1);
    incite.perform();
    expect(city.player()).to.not.equal(player);

    gold.set(incite.cost() * 2);
    (
      find(diplomat, at(2, 1), 'InciteRevolt') as unknown as {
        perform(): void;
      }
    ).perform();
    expect(city.player()).to.equal(player);

    const briber = await agent(Diplomat, 'computer'),
      lone = new Warrior(
        null,
        briber.enemy,
        briber.at(2, 2),
        briber.game.rules
      );

    briber.game.playerResearch.getByPlayer(briber.player).addAdvance(Writing);

    const bribe = find(
        briber.unit,
        briber.at(2, 2),
        'BribeUnit'
      ) as unknown as {
        cost(): number;
        perform(): void;
      },
      briberGold = briber.game.playerTreasuries.getByPlayerAndType(
        briber.player,
        Gold
      );

    briberGold.set(bribe.cost() * 2 - 2);
    bribe.perform();
    expect(lone.player()).to.equal(briber.enemy);

    briberGold.set(bribe.cost() * 2);
    bribe.perform();
    expect(lone.player()).to.equal(briber.player);
  });

  it('plants a nuclear device: three caught checks and one for a Palace, then discovery at ½ (`unit_spy.cpp:680-712`)', async (): Promise<void> => {
    const {
        game,
        city,
        home,
        unit: spy,
        at,
        player,
        enemy,
      } = await agent(Spy, 'person'),
      discovered: unknown[] = [];

    game.engine.on(
      'civ2-diplomacy:nuclear-device-discovered',
      (...args: unknown[]) => discovered.push(args)
    );
    game.players.register(player, enemy);
    [Rocketry, NuclearFission].forEach((Advance) =>
      game.playerResearch.getByPlayer(player).addAdvance(Advance)
    );
    expect(names(spy, at(2, 1))).to.not.include('PlantNuclearDevice');

    game.wonders.register(new ManhattanProject(home, game.rules));
    build(game, city, Palace);
    expect(names(spy, at(2, 1))).to.include('PlantNuclearDevice');

    let caught = 0;

    withRng(game, () => (++caught <= 4 ? 0.5 : 0));
    find(spy, at(2, 1), 'PlantNuclearDevice')!.perform();

    // Four caught checks (3 + the Palace), then the discovery roll.
    expect(caught).to.equal(5);
    expect(discovered).length(1);
    // Each caught check it passed took it to its nearest city, out of the blast (`unit_spy.cpp:47-62`), where it
    //  stays: the original makes no escape after the device.
    expect(spy.destroyed()).to.false;
    expect(spy.tile()).to.equal(home.tile());
    expect(spy.moves().value()).to.equal(0);
  });
});

describe('review fixes', function (): void {
  this.timeout(20000);

  const agent = async (UnitType: typeof Unit, who: 'person' | 'computer') => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      city = addCity(game, enemy, at(2, 1), 'Target'),
      home = addCity(game, player, at(1, 5), 'Home'),
      unit = new UnitType(home, player, at(1, 1), game.rules);

    (who === 'person' ? person : computer)(game, player);
    computer(game, enemy);
    unit.moves().set(3);
    treasury(game, player, 1000);
    treasury(game, enemy, 0);

    return { ...setting, city, home, unit };
  };

  it('sends a Spy that passes a caught check to its nearest city before the mission goes on (`unit_spy.cpp:47-62`)', async (): Promise<void> => {
    const {
      game,
      enemy,
      player,
      city,
      home,
      unit: spy,
      at,
    } = await agent(Spy, 'computer');

    game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);
    game.interactions.register(
      new AdvanceStolen(player, enemy, city, game.rules, game.turn) as never
    );
    new Diplomat(null, enemy, at(2, 1), game.rules);

    // The slot walk, the caught check passed, then the defending Diplomat detects it.
    withRng(game, draws(0.5, 0.5, 0.1));
    find(spy, at(2, 1), 'StealTechnology')!.perform();

    expect(spy.destroyed()).to.false;
    expect(spy.tile()).to.equal(home.tile());
    expect(spy.moves().value()).to.equal(0);
    expect(game.playerResearch.getByPlayer(player).completed(Alphabet)).to
      .false;
  });

  it('offers a person a theft with nothing to take, and charges a move for it (`unit_spy.cpp:461-467`)', async (): Promise<void> => {
    const { game, unit: diplomat, at } = await agent(Diplomat, 'person');

    let count = 0;

    withRng(game, () => (count++, 0.5));
    find(diplomat, at(2, 1), 'StealTechnology')!.perform();

    // Only the slot walk's draw: no detection, no escape.
    expect(count).to.equal(1);
    expect(diplomat.destroyed()).to.false;
    expect(diplomat.moves().value()).to.equal(2);

    const { unit: computerDiplomat, ...other } = await agent(
      Diplomat,
      'computer'
    );

    expect(names(computerDiplomat, other.at(2, 1))).to.not.include(
      'StealTechnology'
    );
  });

  it('rolls for the production whenever the shield box holds any, with or without a building (`unit_spy.cpp:563-575`)', async (): Promise<void> => {
    const { game, city, unit: spy, at } = await agent(Spy, 'computer');

    game.cityBuilds.getByCity(city).progress().set(5);

    let count = 0;

    withRng(game, () => (count++, 0.9));
    find(spy, at(2, 1), 'IndustrialSabotage')!.perform();

    // The slot walk, the production roll, then the escape's roll.
    expect(count).to.equal(3);
  });

  it("forgets a city's investigation when it next works its turn (`city.cpp:4463`)", async (): Promise<void> => {
    const { game, city, unit: spy, at } = await agent(Spy, 'person');

    find(spy, at(2, 1), 'InvestigateCity')!.perform();
    expect(investigated(city, game.pendingEffects)).to.true;

    game.rules.process(ProcessYield, new Food(2), city, []);
    expect(investigated(city, game.pendingEffects)).to.false;

    find(spy, at(2, 1), 'InvestigateCity')!.perform();
    expect(spy.moves().value()).to.be.closeTo(3 - 2 / 3, 1e-9);
  });

  it('clears a robbed city when it changes hands (`city.cpp:5483`)', async (): Promise<void> => {
    const { game, player, enemy, city } = await agent(Diplomat, 'computer');

    game.interactions.register(
      new AdvanceStolen(player, enemy, city, game.rules, game.turn) as never
    );
    expect(robbed(city, game.interactions)).to.true;

    city.capture(player);
    expect(robbed(city, game.interactions)).to.false;
  });

  it('moves the briber onto the square of the unit it bribed (`unit_move.cpp:797-800`)', async (): Promise<void> => {
    const { game, enemy, unit: diplomat, at } = await agent(Diplomat, 'person'),
      lone = new Warrior(null, enemy, at(2, 2), game.rules);

    find(diplomat, at(2, 2), 'BribeUnit')!.perform();

    expect(lone.player()).to.equal(diplomat.player());
    expect(diplomat.tile()).to.equal(at(2, 2));
    expect(diplomat.moves().value()).to.be.below(3);
  });

  it('gives units that defect to an incited city their moves back (`city.cpp:2271-2274`)', async (): Promise<void> => {
    const {
        game,
        enemy,
        city,
        unit: diplomat,
        at,
      } = await agent(Diplomat, 'person'),
      defender = new Warrior(null, enemy, at(2, 1), game.rules);

    defender.moves().set(0);
    find(diplomat, at(2, 1), 'InciteRevolt')!.perform();

    expect(defender.player()).to.equal(diplomat.player());
    expect(defender.city()).to.equal(city);
    expect(defender.moves().value()).to.equal(1);
  });

  it('opens a route, or a mission, from a ship (`unit_move.cpp:778`)', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      home = addCity(game, player, at(1, 5), 'Home'),
      coastal = addCity(game, enemy, at(7, 1), 'Coastal'),
      caravan = new Caravan(home, player, at(8, 1), game.rules),
      diplomat = new Diplomat(home, player, at(8, 2), game.rules);

    computer(game, player);
    caravan.moves().set(1);
    diplomat.moves().set(2);

    expect(coastal.tile().isLand()).to.true;
    expect(names(caravan, at(7, 1))).to.include('EstablishTradeRoute');
    expect(names(diplomat, at(7, 1))).to.include('IndustrialSabotage');
  });
});

describe('second review fixes', function (): void {
  this.timeout(30000);

  // A coastal city of the enemy's at (7, 1), a home city at (1, 5), and a Trireme of the player's at sea at (8, 1).
  const aboard = async (who: 'person' | 'computer', seed?: number) => {
    const setting = await setUp(undefined, seed),
      { game, player, enemy, at } = setting,
      city = addCity(game, enemy, at(7, 1), 'Coastal'),
      home = addCity(game, player, at(1, 5), 'Home'),
      ship = new Trireme(
        home,
        player,
        at(8, 1),
        game.rules
      ) as unknown as Unit & ITransport,
      spy = new Spy(home, player, at(7, 2), game.rules);

    (who === 'person' ? person : computer)(game, player);
    computer(game, enemy);
    treasury(game, player, 1000);
    treasury(game, enemy, 0);
    (
      ship as unknown as { setTransportRegistry(r: unknown): void }
    ).setTransportRegistry(game.transports);
    expect(ship.stow(spy, at(7, 2))).to.true;
    spy.setTile(at(8, 1));
    spy.moves().set(3);

    return { ...setting, city, home, ship, spy };
  };

  it('takes a Spy that passes a caught check off its ship (`unit_spy.cpp:47-62`)', async (): Promise<void> => {
    const { game, player, enemy, city, home, spy, at } = await aboard('person');

    // A city already robbed, with a Diplomat to detect the theft: the caught check is the only escape made.
    game.playerResearch.getByPlayer(enemy).addAdvance(Alphabet);
    game.interactions.register(
      new AdvanceStolen(player, enemy, city, game.rules, game.turn) as never
    );
    new Diplomat(null, enemy, at(7, 1), game.rules);
    // The slot walk, the caught check passed, then the detection.
    withRng(game, draws(0.5, 0.5, 0.1));
    find(spy, at(7, 1), 'StealTechnology')!.perform();

    expect(spy.destroyed()).to.false;
    expect(spy.tile()).to.equal(home.tile());
    expect(game.transports.hasUnit(spy)).to.false;
    expect(spy.busy()).to.null;
  });

  it('takes a Spy that escapes after a mission off its ship', async (): Promise<void> => {
    const { game, home, spy, at } = await aboard('computer');

    withRng(game, draws(0, 0.9));
    find(spy, at(7, 1), 'IndustrialSabotage')!.perform();

    expect(spy.tile()).to.equal(home.tile());
    expect(game.transports.hasUnit(spy)).to.false;
  });

  it('takes a Spy that escapes after sabotaging a unit off its ship', async (): Promise<void> => {
    let escaped = 0;

    for (let seed = 1; seed <= 20; seed++) {
      const { game, enemy, home, spy, at } = await aboard('person', seed);

      new Warrior(null, enemy, at(8, 2), game.rules);
      game.unitImprovements.register(new Veteran(spy));
      find(spy, at(8, 2), 'SabotageUnit')!.perform();

      if (!spy.destroyed()) {
        escaped++;
        expect(spy.tile()).to.equal(home.tile());
        expect(game.transports.hasUnit(spy)).to.false;
      }
    }

    expect(escaped).to.be.above(0);
  });

  it('wakes a sleeping defector, and leaves a fortified one fortified (`city.cpp:2271-2274`)', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      city = addCity(game, enemy, at(2, 1), 'Target'),
      home = addCity(game, player, at(1, 5), 'Home'),
      diplomat = new Diplomat(home, player, at(1, 1), game.rules),
      sleeper = new Warrior(null, enemy, at(2, 1), game.rules),
      guard = new Warrior(null, enemy, at(2, 1), game.rules),
      fortified = new Fortified();

    person(game, player);
    computer(game, enemy);
    treasury(game, player, 1000);
    treasury(game, enemy, 0);
    diplomat.moves().set(2);
    sleeper.setBusy(new Sleeping());
    sleeper.setActive(false);
    guard.setBusy(fortified);
    guard.setActive(false);

    find(diplomat, at(2, 1), 'InciteRevolt')!.perform();

    expect(city.player()).to.equal(player);
    expect(sleeper.player()).to.equal(player);
    expect(sleeper.busy()).to.null;
    expect(sleeper.active()).to.true;
    expect(guard.busy()).to.equal(fortified);
  });

  it('clears every order of a bribed unit, fortified included (`unit_spy.cpp:1046`)', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      home = addCity(game, player, at(1, 5), 'Home'),
      diplomat = new Diplomat(home, player, at(1, 1), game.rules),
      lone = new Warrior(null, enemy, at(2, 2), game.rules);

    person(game, player);
    computer(game, enemy);
    treasury(game, player, 1000);
    treasury(game, enemy, 0);
    diplomat.moves().set(2);
    lone.setBusy(new Fortified());
    lone.setActive(false);

    find(diplomat, at(2, 2), 'BribeUnit')!.perform();

    expect(lone.player()).to.equal(player);
    expect(lone.busy()).to.null;
    expect(lone.active()).to.true;
  });

  it('boards a ship it bribed at sea when it has room, and otherwise stays (`unit_move.cpp:1507-1513`)', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      home = addCity(game, player, at(1, 5), 'Home'),
      diplomat = new Diplomat(home, player, at(7, 1), game.rules),
      ship = new Trireme(null, enemy, at(8, 1), game.rules) as unknown as Unit &
        ITransport;

    person(game, player);
    computer(game, enemy);
    treasury(game, player, 1000);
    treasury(game, enemy, 0);
    (
      ship as unknown as { setTransportRegistry(r: unknown): void }
    ).setTransportRegistry(game.transports);
    diplomat.moves().set(2);

    find(diplomat, at(8, 1), 'BribeUnit')!.perform();

    expect(ship.player()).to.equal(player);
    expect(diplomat.tile()).to.equal(at(8, 1));
    expect(game.transports.hasUnit(diplomat)).to.true;

    // A bribed warship has no hold: the briber stays ashore.
    const other = await setUp(),
      otherHome = addCity(other.game, other.player, other.at(1, 5), 'Home'),
      briber = new Diplomat(
        otherHome,
        other.player,
        other.at(7, 1),
        other.game.rules
      );

    person(other.game, other.player);
    computer(other.game, other.enemy);
    treasury(other.game, other.player, 1000);
    treasury(other.game, other.enemy, 0);
    new Ironclad(null, other.enemy, other.at(8, 1), other.game.rules);
    briber.moves().set(2);

    find(briber, other.at(8, 1), 'BribeUnit')!.perform();

    expect(briber.tile()).to.equal(other.at(7, 1));
  });
});

describe("a computer player's incite (`spy_city_mission_ai_choice`)", function (): void {
  this.timeout(20000);

  it('incites above King at war, never in a Democracy', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      city = addCity(game, enemy, at(2, 1), 'Target'),
      unit = new Diplomat(null, player, at(1, 1), game.rules),
      dependencies = {
        ...dependenciesOf(game),
        pendingEffectRegistry: game.pendingEffects,
      };

    game.difficulty.set(Deity);
    expect(computerMission(unit, city, dependencies, draws(0.9))).to.equal(
      'steal-technology'
    );

    game.interactions.register(
      new War(player, enemy, new Never(), game.rules) as never
    );
    expect(computerMission(unit, city, dependencies, draws(0.9))).to.equal(
      'incite-revolt'
    );

    const government = new PlayerGovernment(enemy, undefined, game.rules);

    government.set(new Democracy());
    game.playerGovernments.register(government);
    expect(computerMission(unit, city, dependencies, draws(0.9))).to.equal(
      'steal-technology'
    );
  });
});

describe("a computer player's mission, for the AI client (base-unit-agent's `MissionChoice`)", function (): void {
  this.timeout(20000);

  it('answers a computer with `computerMission`, drawing once with a vendetta, and a person with nothing', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      city = addCity(game, enemy, at(2, 1), 'Target'),
      spy = new Spy(null, player, at(1, 1), game.rules),
      ruleRegistry = new RuleRegistry();
    let drawn = 0;

    expect(game.rules.getById('civ2-unit:mission-choice/computer')).to.not
      .undefined;

    ruleRegistry.register(
      ...missionChoiceRules({
        clientRegistry: game.clients,
        diplomacy: dependenciesOf(game),
        pendingEffectRegistry: game.pendingEffects,
        randomNumberGenerator: (): number => {
          drawn++;

          return 0;
        },
      })
    );

    computer(game, player);
    expect(missionChoice(spy, city, ruleRegistry)).to.equal('steal-technology');
    expect(drawn).to.equal(0);

    game.interactions.register(
      new Vendetta(player, enemy, new Never(), game.rules) as never
    );
    expect(missionChoice(spy, city, ruleRegistry)).to.equal('poison-water');
    expect(drawn).to.equal(1);

    const human = new Player();

    person(game, human);
    expect(
      missionChoice(
        new Spy(null, human, at(1, 1), game.rules),
        city,
        ruleRegistry
      )
    ).to.undefined;
  });
});
