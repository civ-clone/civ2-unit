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
import { River } from '@civ-clone/civ2-world/TerrainFeatures';
import BuildCost from '@civ-clone/core-city-build/Rules/BuildCost';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
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
import { Move } from '../Actions';
import Chivalry from '@civ-clone/base-science-advance-chivalry/Chivalry';
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
  const registry = new RuleRegistry(),
    rivers = new Set<unknown>();

  registry.register(
    ...traits(),
    ...movementCost(
      { getByTile: () => [] } as never,
      { hasUnit: () => false } as never,
      {
        getByTerrain: (terrain: unknown) =>
          rivers.has(terrain) ? [new River(terrain as never)] : [],
      } as never
    )
  );

  const square = (terrain: unknown) => ({ terrain: () => terrain }),
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

  it("costs a terrain's @TERRAIN movement, a third along a river, and a third anywhere for alpine moves", (): void => {
    const hills = new Hills(),
      mountains = new Mountains(),
      riverHills = new Hills();

    rivers.add(riverHills);
    rivers.add(mountains);

    expect(terrainCost(new Grassland())).to.equal(1);
    expect(cost(Warrior, square(new Grassland()), square(hills))).to.equal(2);
    expect(cost(Warrior, square(riverHills), square(mountains))).to.equal(
      1 / 3
    );
    expect(cost(Partisan, square(hills), square(new Mountains()))).to.equal(
      1 / 3
    );
  });
});

describe('strength', (): void => {
  const fortified = new Set<Unit>();

  const registryFor = (walls: boolean, city: boolean, river = false) => {
    const registry = new RuleRegistry();

    registry.register(
      ...strength({
        cityRegistry: { getByTile: () => (city ? {} : null) } as never,
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

  it('builds Fanatics only under Fundamentalism, and nuclear weapons never without the Manhattan Project', (): void => {
    expect(allowed(rulesFor([]), Fanatic)).to.false;
    expect(allowed(rulesFor([], { government: Fundamentalism }), Fanatic)).to
      .true;
    expect(allowed(rulesFor([NuclearFission]), Nuclear)).to.false;
  });
});
