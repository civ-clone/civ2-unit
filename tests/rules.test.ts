import {
  Attack,
  Defence,
  Movement,
  Visibility,
} from '@civ-clone/core-unit/Yields';
import {
  Bomber,
  Cannon,
  Catapult,
  Chariot,
  Fanatic,
  Fighter,
  Helicopter,
  Horseman,
  Knight,
  MissileCruiser,
  Nuclear,
  Partisan,
  Pikeman,
  Settlers,
  Spearman,
  StealthFighter,
  Warrior,
} from '../Units';
import { Grassland, Hills, Mountains } from '@civ-clone/civ2-world/Terrains';
import { Railroad, Road } from '@civ-clone/civ2-world/TileImprovements';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import register, { shortStep } from '../registerRules';
import { Game } from '@civ-clone/core-game/Game';
import ValidateMove from '@civ-clone/core-unit/Rules/ValidateMove';
import { River } from '@civ-clone/civ2-world/TerrainFeatures';
import BuildCost from '@civ-clone/core-city-build/Rules/BuildCost';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import GreatWall from '@civ-clone/base-wonder-great-wall/GreatWall';
import RequirementRegistry from '@civ-clone/core-requirement/RequirementRegistry';
import CruiseMissile from '@civ-clone/base-unit-cruisemissile/CruiseMissile';
import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import Gunpowder from '@civ-clone/base-science-advance-gunpowder/Gunpowder';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Strength from '@civ-clone/core-unit/Rules/Strength';
import Unit from '@civ-clone/core-unit/Unit';
import UnitTraits from '@civ-clone/core-unit/Rules/UnitTraits';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
import build from '../Rules/City/build';
import buildCost from '../Rules/City/buildCost';
import { defenceMultipliers } from '../Rules/Unit/strength';
import { expect } from 'chai';
import movementCost from '../Rules/Unit/movementCost';
import strength from '../Rules/Unit/strength';
import { terrainCost } from '../Rules/Unit/movementCost';
import traits from '../Rules/Unit/traits';
import unitYield from '../Rules/Unit/yield';
import { Attack as AttackAction, Move } from '../Actions';
import singleUse from '../Rules/Unit/singleUse';
import TheWheel from '@civ-clone/base-science-advance-thewheel/TheWheel';
import Chivalry from '@civ-clone/base-science-advance-chivalry/Chivalry';
import City from '@civ-clone/core-city/City';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import ManhattanProject from '@civ-clone/base-wonder-manhattanproject/ManhattanProject';
import WonderRegistry from '@civ-clone/core-wonder/WonderRegistry';
import manhattanProjectBuilt from '../lib/manhattanProject';
import NuclearFission from '@civ-clone/base-science-advance-nuclearfission/NuclearFission';

const ruleRegistry = new RuleRegistry();

ruleRegistry.register(...traits());

// A stand-in unit of `UnitType` with this registry's traits, on `tile`.
const unit = (UnitType: typeof Unit, tile: unknown = {}): Unit =>
  Object.assign(Object.create(UnitType.prototype), {
    tile: () => tile,
    hasTrait: (Trait: Function) =>
      ruleRegistry
        .get(UnitTraits)
        .some(
          (rule) =>
            rule.validate(UnitType) &&
            rule.process(UnitType).some((trait) => trait instanceof Trait)
        ),
    traits: (Trait: Function) =>
      ruleRegistry
        .get(UnitTraits)
        .filter((rule) => rule.validate(UnitType))
        .flatMap((rule) => rule.process(UnitType))
        .filter((trait) => trait instanceof Trait),
  });

describe('yields', (): void => {
  const registry = new RuleRegistry(),
    veterans = new Set<Unit>();

  registry.register(
    ...unitYield(
      {
        getByUnit: (u: Unit) => (veterans.has(u) ? [new Veteran()] : []),
      } as never,
      registry
    )
  );

  const yieldOf = (u: Unit, YieldType: typeof Attack): number => {
    const value = new YieldType();

    registry.process(UnitYield, u, value);

    return value.value();
  };

  it("sets each unit's @UNITS stats, seeing two squares with flag 0", (): void => {
    expect(
      [Attack, Defence, Movement, Visibility].map((Y) =>
        yieldOf(unit(Pikeman), Y)
      )
    ).to.deep.equal([1, 2, 1, 1]);
    expect(
      [Attack, Defence, Movement, Visibility].map((Y) =>
        yieldOf(unit(Bomber), Y)
      )
    ).to.deep.equal([12, 1, 8, 2]);
  });

  it("adds a veteran's half to attack and defence", (): void => {
    const veteran = unit(Spearman);

    veterans.add(veteran);

    expect([yieldOf(veteran, Attack), yieldOf(veteran, Defence)]).to.deep.equal(
      [1.5, 3]
    );
  });
});

describe('build costs', (): void => {
  it('costs rows of shields times ten', (): void => {
    const registry = new RuleRegistry();

    registry.register(...buildCost());

    const cost = (UnitType: typeof Unit): number[] =>
      registry
        .process(BuildCost, { item: () => UnitType })
        .map((item: { value(): number }) => item.value());

    expect(cost(Warrior)).to.deep.equal([10]);
    expect(cost(Settlers)).to.deep.equal([40]);
    expect(cost(Nuclear)).to.deep.equal([160]);
  });
});

describe('movement', (): void => {
  const rivers = new Set<unknown>(),
    cities = new Set<unknown>(),
    tileImprovements = new TileImprovementRegistry(),
    registry = new RuleRegistry();

  registry.register(
    ...traits(),
    ...movementCost(
      tileImprovements,
      { hasUnit: () => false } as never,
      {
        getByTerrain: (terrain: unknown) =>
          rivers.has(terrain) ? [new River(terrain as never)] : [],
      } as never,
      { getByTile: (tile: unknown) => (cities.has(tile) ? {} : null) } as never
    )
  );

  let row = 0;

  // A square of `terrain` on its own row (or `y`), with any of a road, a railroad, a city and a river.
  const square = (
      terrain: Terrain = new Hills(),
      {
        road = false,
        railroad = false,
        city = false,
        river = false,
        y = (row += 4),
        height = 10000,
      } = {}
    ) => {
      const tile = {
        terrain: () => terrain,
        y: () => y,
        map: () => ({ height: () => height }),
      };

      if (road) {
        tileImprovements.register(new Road(tile as never, new RuleRegistry()));
      }

      if (railroad) {
        tileImprovements.register(
          new Railroad(tile as never, new RuleRegistry())
        );
      }

      if (city) {
        cities.add(tile);
      }

      if (river) {
        rivers.add(terrain);
      }

      return tile;
    },
    cost = (UnitType: typeof Unit, from: unknown, to: unknown): number => {
      const mover = Object.assign(Object.create(UnitType.prototype), {
        hasTrait: (Trait: Function) =>
          registry
            .get(UnitTraits)
            .some(
              (rule) =>
                rule.validate(UnitType) &&
                rule.process(UnitType).some((trait) => trait instanceof Trait)
            ),
      });

      return Math.min(
        ...registry.process(
          MovementCost,
          mover,
          Object.assign(Object.create(Move.prototype), {
            from: () => from,
            to: () => to,
          })
        )
      );
    };

  it("costs a terrain's @TERRAIN movement, a road a third and a railroad nothing", (): void => {
    expect(terrainCost(new Grassland())).to.equal(1);
    expect(cost(Warrior, square(new Grassland()), square())).to.equal(2);
    expect(
      cost(
        Warrior,
        square(new Hills(), { road: true }),
        square(new Hills(), { road: true })
      )
    ).to.equal(1 / 3);
    expect(
      cost(Warrior, square(new Hills(), { road: true }), square())
    ).to.equal(2);
    expect(
      cost(
        Warrior,
        square(new Hills(), { railroad: true }),
        square(new Hills(), { railroad: true })
      )
    ).to.equal(0);
  });

  it('counts a city square as road and railroad', (): void => {
    expect(
      cost(
        Warrior,
        square(new Hills(), { city: true }),
        square(new Hills(), { railroad: true })
      )
    ).to.equal(0);
    expect(
      cost(
        Warrior,
        square(new Hills(), { city: true }),
        square(new Hills(), { city: true })
      )
    ).to.equal(0);
    expect(
      cost(
        Warrior,
        square(new Hills(), { city: true }),
        square(new Hills(), { road: true })
      )
    ).to.equal(1 / 3);
    expect(
      cost(Warrior, square(new Hills(), { city: true }), square())
    ).to.equal(2);
  });

  it('costs a third along a river, to a square one row up or down, and a third anywhere for alpine moves', (): void => {
    const from = square(new Hills(), { river: true, y: 10 });

    expect(
      cost(Warrior, from, square(new Mountains(), { river: true, y: 11 }))
    ).to.equal(1 / 3);
    expect(
      cost(Warrior, from, square(new Mountains(), { river: true, y: 12 }))
    ).to.equal(3);
    expect(cost(Warrior, from, square(new Mountains(), { y: 11 }))).to.equal(3);
    // The same row, east or west: no discount.
    expect(
      cost(Warrior, from, square(new Mountains(), { river: true, y: 10 }))
    ).to.equal(3);
    // Rows wrap: the last row and the first share edges.
    expect(
      cost(
        Warrior,
        square(new Hills(), { river: true, y: 0, height: 80 }),
        square(new Mountains(), { river: true, y: 79, height: 80 })
      )
    ).to.equal(1 / 3);
    expect(
      cost(
        Warrior,
        square(new Hills(), { river: true, y: 0, height: 80 }),
        square(new Mountains(), { river: true, y: 78, height: 80 })
      )
    ).to.equal(3);
    expect(cost(Partisan, square(), square(new Mountains()))).to.equal(1 / 3);
  });
});

describe('a short step', (): void => {
  it("always succeeds for a unit that hasn't moved, and at remaining over cost for one that has", (): void => {
    const warrior = unit(Warrior);

    expect(shortStep.succeeds(warrior, 1, 1, 3, () => 0.99)).to.true;
    expect(shortStep.succeeds(warrior, 1, 2, 2, () => 0.49)).to.true;
    expect(shortStep.succeeds(warrior, 1, 2, 2, () => 0.5)).to.false;
    // Only land units roll.
    expect(shortStep.succeeds(unit(Bomber), 1, 2, 2, () => 0.5)).to.true;
    expect(shortStep.expectedCost(1)).to.equal(1);
  });

  it('is what register(game) wires: a fresh unit short of a step gets there without a draw', (): void => {
    let draws = 0;
    const game = new Game({
        rng: Object.assign(
          (): number => {
            draws++;

            return 0.99;
          },
          { restore() {}, calls: () => draws }
        ) as never,
      }),
      shortStepped = (remaining: number, movement: number): boolean[] => {
        let moves = remaining;
        const warrior = Object.assign(Object.create(Warrior.prototype), {
          moves: () => ({
            value: () => moves,
            set: (value: number) => (moves = value),
            subtract: (value: number) => (moves -= value),
          }),
          movement: () => ({ value: () => movement }),
        });

        return game.rules.process(ValidateMove, warrior, 3);
      };

    register(game);

    expect(shortStepped(1, 1)).to.deep.equal([true]);
    expect(draws).to.equal(0);
    // One that has moved draws once, and at 0.99 a third of the cost isn't enough.
    expect(shortStepped(1, 2)).to.deep.equal([false]);
    expect(draws).to.equal(1);
  });
});

describe('strength', (): void => {
  const fortified = new Set<Unit>();

  const registryFor = (
    walls: boolean,
    city: boolean,
    river = false,
    greatWall = false
  ) => {
    const registry = new RuleRegistry();

    registry.register(
      ...strength({
        cityRegistry: {
          getByTile: () => (city ? { player: () => 'p' } : null),
        } as never,
        wonderRegistry: {
          getByPlayer: () =>
            greatWall
              ? [
                  Object.assign(Object.create(GreatWall.prototype), {
                    city: () => ({ destroyed: () => false }),
                  }),
                ]
              : [],
        } as never,
        requirementRegistry: new RequirementRegistry(),
        playerResearchRegistry: { some: () => false } as never,
        cityImprovementRegistry: {
          getByCity: () => (walls ? [new CityWalls()] : []),
        } as never,
        terrainFeatureRegistry: {
          getByTerrain: (terrain: unknown) =>
            river ? [new River(terrain as never)] : [],
        } as never,
        unitImprovementRegistry: {
          getByUnit: (u: Unit) => (fortified.has(u) ? [new Fortified()] : []),
        } as never,
      })
    );

    return registry;
  };

  const fight = (
    registry: RuleRegistry,
    attacker: Unit,
    defender: Unit,
    defence = 1,
    attack = 1
  ): [number, number] => {
    const attackYield = new Attack(attack),
      defenceYield = new Defence(defence);

    registry.process(Strength, attacker, defender, attackYield, defenceYield);

    return [attackYield.value(), defenceYield.value()];
  };

  const on = (terrain: unknown) => ({ terrain: () => terrain });

  it('multiplies by the terrain, a river, then walls or fortification', (): void => {
    const pikeman = unit(Pikeman, on(new Hills())),
      warrior = unit(Warrior, on(new Hills()));

    fortified.add(pikeman);

    expect(
      defenceMultipliers({
        cityRegistry: { getByTile: () => null } as never,
        terrainFeatureRegistry: {
          getByTerrain: (terrain: unknown) => [new River(terrain as never)],
        } as never,
        unitImprovementRegistry: {
          getByUnit: () => [new Fortified()],
        } as never,
      })(pikeman, warrior)
    ).to.deep.equal([
      ['Hills', 2],
      ['River', 1.25],
      ['Fortified', 1.5],
    ]);
    // Hills ×2 then walls ×3, replacing fortified, against a land attacker.
    expect(fight(registryFor(true, true), warrior, pikeman)).to.deep.equal([
      1, 6,
    ]);
    // Walls don't count against an aircraft; the fortified Pikeman in the city keeps its ×1.5.
    expect(fight(registryFor(true, true), unit(Bomber), pikeman)[1]).to.equal(
      3
    );
  });

  it("counts its owner's Great Wall as City Walls in every city, once", (): void => {
    const pikeman = unit(Pikeman, on(new Grassland())),
      warrior = unit(Warrior, on(new Grassland()));

    expect(fight(registryFor(false, true), warrior, pikeman)[1]).to.equal(1);
    expect(
      fight(registryFor(false, true, false, true), warrior, pikeman)[1]
    ).to.equal(3);
    expect(
      fight(registryFor(true, true, false, true), warrior, pikeman)[1]
    ).to.equal(3);
  });

  it('gives the Pikeman ×1.5 against a mounted attacker only (land, two moves, one hit point)', (): void => {
    const pikeman = unit(Pikeman, on(new Grassland())),
      registry = registryFor(false, false);

    expect(fight(registry, unit(Horseman), pikeman)[1]).to.equal(1.5);
    expect(fight(registry, unit(Chariot), pikeman)[1]).to.equal(1.5);
    expect(fight(registry, unit(Knight), pikeman)[1]).to.equal(1.5);
    // Two moves but two hit points, and one move: no bonus.
    expect(fight(registry, unit(Cannon), pikeman)[1]).to.equal(1);
    expect(fight(registry, unit(Warrior), pikeman)[1]).to.equal(1);
  });

  it('gives a defence bonus against air ×3, and ×5 against a missile', (): void => {
    const cruiser = unit(MissileCruiser, on(new Grassland())),
      registry = registryFor(false, false);

    expect(fight(registry, unit(Bomber), cruiser)[1]).to.equal(3);
    expect(fight(registry, unit(CruiseMissile), cruiser)[1]).to.equal(5);
    expect(fight(registry, unit(Catapult), cruiser)[1]).to.equal(1);
  });

  it('halves a Helicopter against a fighter, and gives Partisans ×8 against a unit with no attack', (): void => {
    const registry = registryFor(false, false);

    expect(
      fight(registry, unit(Fighter), unit(Helicopter, on(new Grassland())))[1]
    ).to.equal(0.5);
    expect(
      fight(
        registry,
        unit(StealthFighter),
        unit(Bomber, on(new Grassland()))
      )[1]
    ).to.equal(1);
    expect(
      fight(registry, unit(Partisan), unit(Settlers, on(new Grassland())))[0]
    ).to.equal(8);
    expect(
      fight(registry, unit(Partisan), unit(Warrior, on(new Grassland())))[0]
    ).to.equal(1);
  });

  it('gives an interceptor in a city ×4 against a bomber, ×2 against a fighter, and nothing against a missile', (): void => {
    const registry = registryFor(false, true),
      fighter = unit(Fighter, on(new Grassland()));

    expect(fight(registry, unit(Bomber), fighter)[1]).to.equal(4);
    expect(fight(registry, unit(StealthFighter), fighter)[1]).to.equal(2);
    expect(fight(registry, unit(CruiseMissile), fighter)[1]).to.equal(1);
  });
});

describe('the build list', (): void => {
  const city = (player: object) => ({ player: () => player }),
    rulesFor = (
      known: Function[],
      { government = null as Function | null, human = true } = {}
    ) =>
      build({
        clientRegistry: {
          getBy: () => (human ? [{}] : []),
        } as never,
        playerGovernmentRegistry: {
          getByPlayer: () => {
            if (government === null) {
              throw new TypeError('no government');
            }

            return { is: (...types: Function[]) => types.includes(government) };
          },
        } as never,
        playerResearchRegistry: {
          getByPlayer: () => ({
            completed: (Advance: Function) => known.includes(Advance),
          }),
        } as never,
      }),
    allowed = (rules: ReturnType<typeof build>, UnitType: typeof Unit) =>
      rules
        .filter((rule) => rule.validate(city({}) as never, UnitType))
        .every((rule) =>
          (
            rule.process(city({}) as never, UnitType) as unknown as {
              validate(): boolean;
            }
          ).validate()
        );

  it('drops weak defenders after Gunpowder and weak mounted units after Chivalry', (): void => {
    expect(allowed(rulesFor([]), Warrior)).to.true;
    expect(allowed(rulesFor([Gunpowder]), Warrior)).to.false;
    expect(allowed(rulesFor([Gunpowder]), Pikeman)).to.false;
    expect(allowed(rulesFor([Chivalry]), Horseman)).to.false;
    expect(allowed(rulesFor([Chivalry]), Chariot)).to.false;
    expect(allowed(rulesFor([Chivalry]), Knight)).to.true;
  });

  it("doesn't let a computer player build a multi-move unit another it can build outclasses", (): void => {
    // A Chariot (3/1, The Wheel) outclasses a Horseman (2/1) of the same role; Chivalry, which obsoletes the Horseman,
    //  is unknown, so only this rule refuses it, and only for a computer player.
    expect(allowed(rulesFor([TheWheel], { human: false }), Horseman)).to.false;
    expect(allowed(rulesFor([TheWheel], { human: true }), Horseman)).to.true;
    expect(allowed(rulesFor([], { human: false }), Horseman)).to.true;
  });

  it('builds Fanatics only under Fundamentalism, and nuclear weapons never without the Manhattan Project', (): void => {
    expect(allowed(rulesFor([]), Fanatic)).to.false;
    expect(allowed(rulesFor([], { government: Fundamentalism }), Fanatic)).to
      .true;
    expect(allowed(rulesFor([NuclearFission]), Nuclear)).to.false;
  });

  it('builds nuclear weapons with Nuclear Fission once anyone has ever built the Manhattan Project', (): void => {
    const wonderRegistry = new WonderRegistry(),
      cityImprovementRegistry = new CityImprovementRegistry(),
      built = manhattanProjectBuilt(wonderRegistry, cityImprovementRegistry),
      rules = (known: Function[]) =>
        build({
          clientRegistry: { getBy: () => [{}] } as never,
          playerResearchRegistry: {
            getByPlayer: () => ({
              completed: (Advance: Function) => known.includes(Advance),
            }),
          } as never,
          manhattanProjectBuilt: built,
        }),
      // A `City` the registries accept; the Wonder's city is destroyed later.
      wonderCity = Object.assign(Object.create(City.prototype), {
        destroyed: () => false,
      }),
      manhattanProject = new ManhattanProject(wonderCity);

    expect(built()).to.false;
    expect(allowed(rules([NuclearFission]), Nuclear)).to.false;

    cityImprovementRegistry.register(manhattanProject);
    wonderRegistry.register(manhattanProject);

    expect(built()).to.true;
    expect(allowed(rules([NuclearFission]), Nuclear)).to.true;
    expect(allowed(rules([]), Nuclear)).to.false;

    // Lost with its city: still built, as the original's -2 isn't -1.
    manhattanProject.destroy();
    wonderRegistry.unregister(manhattanProject);

    expect(built()).to.true;
  });
});

describe('single use', (): void => {
  it('spends a missile when it attacks, and nothing else', (): void => {
    const [rule] = singleUse(),
      destroyed: string[] = [],
      attacker = (UnitType: typeof Unit) =>
        Object.assign(unit(UnitType), {
          destroyed: () => false,
          destroy: () => destroyed.push(UnitType.name),
        }),
      attack = Object.create(AttackAction.prototype),
      move = Object.create(Move.prototype);

    [
      [attacker(CruiseMissile), attack],
      [attacker(CruiseMissile), move],
      [attacker(Warrior), attack],
    ].forEach(([u, action]) => {
      if (rule.validate(u, action)) {
        rule.process(u, action);
      }
    });

    expect(destroyed).to.deep.equal(['CruiseMissile']);
  });
});
