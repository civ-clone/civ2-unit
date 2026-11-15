// Civilization II's combat as civ2-unit registers it (survey-units §2.1; OpenCiv2 richardpenman/civ2@49f26ec,
//  `src/auto/unit_combat.cpp`), on a game with civ2-world's and civ2-unit's rules.
import { Setting, addCity, setUp } from './lib/game';
import { Airbase, Fortress } from '@civ-clone/civ2-world/TileImprovements';
import {
  Battleship,
  Bomber,
  Carrier,
  Fighter,
  Helicopter,
  Howitzer,
  Knight,
  MissileCruiser,
  Musketman as Musketeers,
  Paratrooper,
  Pikeman as Pikemen,
  Spearman as Phalanx,
  Submarine,
  Tank as Armor,
  Transport,
} from '../Units';
import AttackEndsTurn from '@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn';
import Tile from '@civ-clone/core-world/Tile';
import { Firepower, HitPoints } from '@civ-clone/core-unit/Yields';
import { Hills } from '@civ-clone/civ2-world/Terrains';
import { applyCombatModifiers } from '@civ-clone/base-combat-rounds/lib/CombatModifiers';
import Attack from '@civ-clone/base-unit-action-attack/Attack';
import { Promoted } from '@civ-clone/base-unit-veteran-promotion/lib/Rules';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import civ2CityDestroyed from '@civ-clone/civ2-city/Rules/City/destroyed';
import civ2CityShrink from '@civ-clone/civ2-city/Rules/City/shrink';
import { Chieftain } from '@civ-clone/civ2-difficulty/Difficulties';
import Client from '@civ-clone/core-client/Client';
import CruiseMissile from '@civ-clone/base-unit-cruisemissile/CruiseMissile';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import Fuel from '@civ-clone/base-unit-fuel/lib/Fuel';
import Paradropped from '@civ-clone/base-unit-action-paradrop/UnitImprovements/Paradropped';
import SamMissileBattery from '@civ-clone/base-city-improvement-sammissilebattery/SamMissileBattery';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { defenceMultipliers } from '../Rules/Unit/strength';
import { defenderScore } from '../Rules/Unit/combat';
import { expect } from 'chai';
import strength from '@civ-clone/core-unit/strength';

const names = (units: Unit[]): string[] =>
  units.map((unit: Unit): string => unit.constructor.name);

const actionNames = (unit: Unit, to: ReturnType<Setting['at']>): string[] =>
  unit.actions(to).map((action: UnitAction): string => action.constructor.name);

describe('combat: yields', function (): void {
  this.timeout(20000);

  it('gives each unit its hit points ×10, firepower and range (`rules_load_units`)', async (): Promise<void> => {
    const { game, player, at } = await setUp(),
      armor = new Armor(null, player, at(1, 1), game.rules),
      battleship = new Battleship(null, player, at(9, 1), game.rules),
      bomber = new Bomber(null, player, at(1, 2), game.rules),
      fighter = new Fighter(null, player, at(1, 3), game.rules),
      helicopter = new Helicopter(null, player, at(1, 4), game.rules),
      yieldOf = (unit: Unit, YieldType: typeof HitPoints): number => {
        const [value] = unit.yield(new YieldType());

        return value.value();
      };

    // RULES.TXT @UNITS: Armor 3 hp 1 fp, Battleship 4 hp 2 fp, Bomber range 2, Fighter 1, Helicopter 0.
    expect(armor.hitPoints()).to.deep.equal([30, 30]);
    expect(yieldOf(armor, Firepower)).to.equal(1);
    expect(battleship.hitPoints()).to.deep.equal([40, 40]);
    expect(yieldOf(battleship, Firepower)).to.equal(2);
    expect(
      [bomber, fighter, helicopter, armor].map((unit) => yieldOf(unit, Fuel))
    ).to.deep.equal([2, 1, 0, 0]);
  });
});

describe('combat: CombatModifiers (`unit_resolve_attack`)', function (): void {
  this.timeout(20000);

  let rules: Setting['game']['rules'];

  const setUpRules = async (): Promise<Setting> => {
    const setting = await setUp();

    rules = setting.game.rules;

    return setting;
  };

  const terms = (attacker: Unit, defender: Unit) =>
    applyCombatModifiers(rules, attacker, defender, {
      attack: 1,
      defence: 1,
      attackerFirepower: attacker.firepower().value(),
      defenderFirepower: defender.firepower().value(),
    });

  it('fights shore bombardment at firepower 1 a side', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUpRules(),
      battleship = new Battleship(null, player, at(8, 1), game.rules),
      musketeers = new Musketeers(null, enemy, at(7, 1), game.rules);

    expect(terms(battleship, musketeers)).to.include({
      attackerFirepower: 1,
      defenderFirepower: 1,
    });
  });

  it('has a submarine defend at firepower 1', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUpRules(),
      battleship = new Battleship(null, player, at(8, 1), game.rules),
      submarine = new Submarine(null, enemy, at(9, 1), game.rules);

    expect(terms(battleship, submarine)).to.include({
      attackerFirepower: 2,
      defenderFirepower: 1,
    });
  });

  it('catches a ship in port: its firepower 1, the attacker’s doubled', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUpRules(),
      bomber = new Bomber(null, player, at(6, 1), game.rules),
      battleship = new Battleship(null, enemy, at(7, 1), game.rules);

    addCity(game, enemy, at(7, 1), 'Port');

    expect(terms(bomber, battleship)).to.include({
      attackerFirepower: 4,
      defenderFirepower: 1,
    });
  });

  it('has a helicopter defend at firepower 1 against air superiority', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUpRules(),
      fighter = new Fighter(null, player, at(1, 1), game.rules),
      helicopter = new Helicopter(null, enemy, at(2, 1), game.rules);

    expect(terms(fighter, helicopter)).to.include({
      attackerFirepower: 2,
      defenderFirepower: 1,
    });
    // And at half its defence, from the `Strength` rule (10 attack, 3 defence: `unit_resolve_attack`).
    const [, defence] = strength(fighter, helicopter, game.rules);

    expect(defence.value()).to.equal(1.5);
  });
});

describe('combat: the defender (`unit_stack_best_defender`)', function (): void {
  this.timeout(20000);

  const choose = (setting: Setting, attacker: Unit, to: Tile): Unit => {
    const score = defenderScore({
      cityImprovementRegistry: setting.game.cityImprovements,
      cityRegistry: setting.game.cities,
      playerResearchRegistry: setting.game.playerResearch,
      requirementRegistry: setting.game.requirements,
      terrainFeatureRegistry: setting.game.terrainFeatures,
      tileImprovementRegistry: setting.game.tileImprovements,
      unitImprovementRegistry: setting.game.unitImprovements,
      unitRegistry: setting.game.units,
      wonderRegistry: setting.game.wonders,
    });

    return setting.game.units
      .getByTile(to)
      .reduce(
        (best: Unit, candidate: Unit): Unit =>
          score(attacker, candidate) > score(attacker, best) ? candidate : best
      );
  };

  it('scales defence by hit points left', async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      armor = new Armor(null, player, at(1, 1), game.rules),
      healthy = new Musketeers(null, enemy, at(2, 1), game.rules),
      damaged = new Musketeers(null, enemy, at(2, 1), game.rules);

    damaged.setDamage(10);

    expect(choose(setting, armor, at(2, 1)) === healthy).to.true;
  });

  it('gives a tie to the later unit, and Pikemen their +1', async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      armor = new Armor(null, player, at(1, 1), game.rules),
      first = new Phalanx(null, enemy, at(2, 1), game.rules),
      second = new Phalanx(null, enemy, at(2, 1), game.rules);

    expect(choose(setting, armor, at(2, 1)) === second).to.true;

    const pikemen = new Pikemen(null, enemy, at(3, 1), game.rules);

    new Phalanx(null, enemy, at(3, 1), game.rules);

    expect(choose(setting, armor, at(3, 1)) === pikemen).to.true;
    expect(first === second).to.false;
  });

  it('ranks AEGIS ×3 against an aircraft, ahead of a stronger Battleship', async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      bomber = new Bomber(null, player, at(8, 1), game.rules),
      aegis = new MissileCruiser(null, enemy, at(9, 1), game.rules);

    new Battleship(null, enemy, at(9, 1), game.rules);

    // 8 × 8 × 3 = 192 against 12 × 8 = 96.
    expect(choose(setting, bomber, at(9, 1)) === aegis).to.true;
  });

  it("doesn't let a land unit aboard a ship defend it", async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      battleship = new Battleship(null, player, at(8, 1), game.rules),
      transport = new Transport(null, enemy, at(9, 1), game.rules);

    new Armor(null, enemy, at(9, 1), game.rules);

    expect(choose(setting, battleship, at(9, 1)) === transport).to.true;
  });

  it('doubles a ship in a city against aircraft without a SAM Battery, and halves it with one', async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      bomber = new Bomber(null, player, at(6, 1), game.rules),
      // Battleship 12 against Musketeers 3 (×8): 192 against 24 with no SAM; 48 against 24 with one.
      battleship = new Battleship(null, enemy, at(7, 1), game.rules),
      musketeers = new Musketeers(null, enemy, at(7, 1), game.rules),
      city = addCity(game, enemy, at(7, 1), 'Port');

    expect(choose(setting, bomber, at(7, 1)) === battleship).to.true;

    game.cityImprovements.register(new SamMissileBattery(city, game.rules));

    expect(
      defenderScore({
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        unitRegistry: game.units,
        tileImprovementRegistry: game.tileImprovements,
        unitImprovementRegistry: game.unitImprovements,
      })(bomber, battleship)
    ).to.be.within(48, 49);
    expect(musketeers === battleship).to.false;
  });
});

describe('combat: defence and attack bonuses', function (): void {
  this.timeout(20000);

  it('gives a land unit on a Fortress ×2 instead of fortified, but not against aircraft or Howitzers, nor ships', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      multipliers = defenceMultipliers({
        cityRegistry: game.cities,
        tileImprovementRegistry: game.tileImprovements,
        unitImprovementRegistry: game.unitImprovements,
        terrainFeatureRegistry: game.terrainFeatures,
      }),
      musketeers = new Musketeers(null, enemy, at(2, 1), game.rules),
      armor = new Armor(null, player, at(1, 1), game.rules),
      bomber = new Bomber(null, player, at(1, 2), game.rules),
      howitzer = new Howitzer(null, player, at(1, 3), game.rules);

    game.unitImprovements.register(new Fortified(musketeers));
    game.tileImprovements.register(new Fortress(at(2, 1), game.rules));

    expect(multipliers(musketeers, armor)).to.deep.equal([['Fortress', 2]]);
    expect(multipliers(musketeers, bomber)).to.deep.equal([['Fortified', 1.5]]);
    expect(multipliers(musketeers, howitzer)).to.deep.equal([
      ['Fortified', 1.5],
    ]);

    const battleship = new Battleship(null, enemy, at(9, 2), game.rules);

    game.tileImprovements.register(new Fortress(at(9, 2), game.rules));

    expect(multipliers(battleship, armor)).to.deep.equal([]);
  });

  it('gives a paradropped unit half as much attack again, after a veteran’s half: ×2.25', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      paratrooper = new Paratrooper(null, player, at(1, 1), game.rules),
      phalanx = new Phalanx(null, enemy, at(2, 1), game.rules);

    game.unitImprovements.register(
      new Veteran(paratrooper),
      new Paradropped(paratrooper)
    );

    const [attack] = strength(paratrooper, phalanx, game.rules);

    // Paratroopers attack 6.
    expect(attack.value()).to.equal(6 * 2.25);
  });
});

describe('combat: limits (`unit_move_dir_attack_unit`, `unit_move_dir_enemy_city`)', function (): void {
  this.timeout(20000);

  it('lets only an interceptor attack a bomber outside a city or airbase, unless a carrier is with it', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      battleship = new Battleship(null, player, at(8, 1), game.rules),
      fighter = new Fighter(null, player, at(8, 2), game.rules);

    [battleship, fighter].forEach((unit) => unit.moves().set(1));

    new Bomber(null, enemy, at(9, 1), game.rules);
    new Bomber(null, enemy, at(9, 2), game.rules);

    expect(actionNames(battleship, at(9, 1))).to.not.include('Attack');
    expect(actionNames(fighter, at(9, 2))).to.include('Attack');

    new Carrier(null, enemy, at(9, 1), game.rules);

    expect(actionNames(battleship, at(9, 1))).to.include('Attack');

    // On an airbase anything that reaches it may attack.
    const armor = new Armor(null, player, at(5, 5), game.rules);

    armor.moves().set(1);
    new Bomber(null, enemy, at(6, 5), game.rules);
    new Musketeers(null, enemy, at(6, 5), game.rules);
    expect(actionNames(armor, at(6, 5))).to.not.include('Attack');
    game.tileImprovements.register(new Airbase(at(6, 5), game.rules));
    expect(actionNames(armor, at(6, 5))).to.include('Attack');
  });

  it('lets a helicopter take an empty city, but not a bomber or a ship', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      helicopter = new Helicopter(null, player, at(6, 1), game.rules),
      bomber = new Bomber(null, player, at(6, 2), game.rules),
      battleship = new Battleship(null, player, at(8, 2), game.rules);

    [helicopter, bomber, battleship].forEach((unit) => unit.moves().set(1));
    addCity(game, enemy, at(7, 1), 'Target');
    addCity(game, enemy, at(7, 2), 'Other');

    expect(actionNames(helicopter, at(7, 1))).to.include('CaptureCity');
    expect(actionNames(bomber, at(7, 2))).to.not.include('CaptureCity');
    expect(actionNames(battleship, at(7, 2))).to.not.include('CaptureCity');
  });

  it('ends a bomber’s and a helicopter’s turn after an attack, not a fighter’s', async (): Promise<void> => {
    const { game, player, at } = await setUp();

    expect(
      [Bomber, Helicopter, Fighter].map((UnitType) =>
        new UnitType(null, player, at(1, 1), game.rules).hasTrait(
          AttackEndsTurn
        )
      )
    ).to.deep.equal([true, true, false]);
  });
});

describe('combat: losing a defender', function (): void {
  this.timeout(20000);

  const fight = (
    setting: Setting,
    attacker: Unit,
    to: Tile,
    wins: boolean
  ): void => {
    const attack = new Attack(
      attacker.tile(),
      to,
      attacker,
      setting.game.rules,
      setting.game.units,
      // The attacker wins every round, or loses every one.
      wins ? (): number => 0.999 : (): number => 0
    );

    attacker.moves().set(1);
    attack.perform();
  };

  it('kills the stack in the open, but not on a Fortress or an Airbase', async (): Promise<void> => {
    const setting = await setUp((): typeof Hills => Hills),
      { game, player, enemy, at } = setting;

    game.tileImprovements.register(new Fortress(at(3, 1), game.rules));
    game.tileImprovements.register(new Airbase(at(3, 3), game.rules));

    [
      [at(3, 1), 1],
      [at(3, 2), 0],
      [at(3, 3), 1],
    ].forEach(([tile, survivors]) => {
      const attacker = new Armor(null, player, at(2, 2), game.rules);

      new Phalanx(null, enemy, tile as Tile, game.rules);
      new Phalanx(null, enemy, tile as Tile, game.rules);

      fight(setting, attacker, tile as Tile, true);

      expect(game.units.getByTile(tile as Tile).length).to.equal(survivors);
    });
  });

  it('shrinks a city that loses a defender, unless it has walls or the attack came from the sea', async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      city = addCity(game, enemy, at(7, 1), 'Coast'),
      growth = game.cityGrowth.getByCity(city);

    growth.grow();
    growth.grow();
    expect(growth.size()).to.equal(3);

    new Phalanx(null, enemy, at(7, 1), game.rules);
    fight(
      setting,
      new Armor(null, player, at(6, 1), game.rules),
      at(7, 1),
      true
    );
    expect(growth.size()).to.equal(2);

    new Phalanx(null, enemy, at(7, 1), game.rules);
    fight(
      setting,
      new Battleship(null, player, at(8, 1), game.rules),
      at(7, 1),
      true
    );
    expect(growth.size()).to.equal(2);

    game.cityImprovements.register(new CityWalls(city, game.rules));
    new Phalanx(null, enemy, at(7, 1), game.rules);
    fight(
      setting,
      new Armor(null, player, at(6, 1), game.rules),
      at(7, 1),
      true
    );
    expect(growth.size()).to.equal(2);
    expect(names(game.units.getByTile(at(7, 1)))).to.deep.equal([]);
  });

  it('destroys a city of size 1 that loses its defender, with the units in it', async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      city = addCity(game, enemy, at(3, 3), 'Small');

    // civ2-city's own shrink and destroyed rules (civ2-unit doesn't load civ2-city): a city shrunk to nothing is
    //  destroyed, and the units it supports with it.
    game.rules.register(
      ...civ2CityShrink(game.workedTiles, game.specialists, game.engine),
      ...civ2CityDestroyed(
        game.tileImprovements,
        game.engine,
        game.units,
        game.workedTiles,
        game.specialists,
        game.rules
      )
    );

    // The city's own unit, and a later one (which defends, ties going to the later unit) from elsewhere. `city_delete`
    //  deletes the units a city supports; a unit from another city in it would survive, as here the defender doesn't.
    const other = new Phalanx(city, enemy, at(3, 3), game.rules);

    new Phalanx(null, enemy, at(3, 3), game.rules);

    fight(
      setting,
      new Armor(null, player, at(2, 3), game.rules),
      at(3, 3),
      true
    );

    expect(city.destroyed()).to.true;
    expect(other.destroyed()).to.true;
    expect(game.units.getByTile(at(3, 3))).to.be.empty;
    expect(game.cityGrowth.getByCity(city).size()).to.equal(0);
  });

  it("doesn't shrink a human player's city on Chieftain", async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting,
      city = addCity(game, enemy, at(3, 3), 'Human'),
      growth = game.cityGrowth.getByCity(city);

    game.clients.register(new Client(enemy));
    game.difficulty.set(Chieftain);
    growth.grow();

    new Phalanx(null, enemy, at(3, 3), game.rules);
    fight(
      setting,
      new Armor(null, player, at(2, 3), game.rules),
      at(3, 3),
      true
    );

    expect(growth.size()).to.equal(2);
  });

  it('promotes some winners, and never a missile', async (): Promise<void> => {
    const setting = await setUp(),
      { game, player, enemy, at } = setting;
    let promoted = 0;

    for (let i = 0; i < 40; i++) {
      const armor = new Armor(null, player, at(2, 3), game.rules);

      new Phalanx(null, enemy, at(3, 3), game.rules);
      fight(setting, armor, at(3, 3), true);

      if (
        game.unitImprovements
          .getByUnit(armor)
          .some((improvement) => improvement instanceof Veteran)
      ) {
        promoted++;
      }

      armor.destroy();
    }

    // Armor 80 beating Phalanx 16: (16 + 1) / 96, about 7 in 40.
    expect(promoted).to.be.within(1, 20);

    // A missile is gone after its attack, so count what is promoted as it happens.
    const missiles: Unit[] = [];

    game.rules.register(
      new Promoted(
        new Effect((unit: Unit): void => {
          if (unit instanceof CruiseMissile) {
            missiles.push(unit);
          }
        })
      )
    );

    for (let i = 0; i < 40; i++) {
      const missile = new CruiseMissile(null, player, at(2, 3), game.rules);

      new Phalanx(null, enemy, at(3, 3), game.rules);
      fight(setting, missile, at(3, 3), true);
    }

    expect(missiles).to.be.empty;
  });
});

describe('combat: Pikemen against mounted units (`unit_resolve_attack`)', function (): void {
  this.timeout(20000);

  it('counts an attacker as mounted by its moves now, after damage', async (): Promise<void> => {
    const { game, player, enemy, at } = await setUp(),
      knights = new Knight(null, player, at(1, 1), game.rules),
      pikemen = new Pikemen(null, enemy, at(2, 1), game.rules),
      defence = (): number => strength(knights, pikemen, game.rules)[1].value();

    // Pikemen 2 on Grassland, ×1.5 against 2-move Knights.
    expect(defence()).to.equal(3);

    // At half their hit points, Knights have 1 move: no longer mounted.
    knights.setDamage(5);
    expect(knights.movement().value()).to.equal(1);
    expect(defence()).to.equal(2);
  });
});
