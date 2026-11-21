import {
  BARRACKS_NEAR_CITY_STEPS,
  HEAL_UNITS_RULE,
  NEAR_CITY_DISTANCE,
  NEAR_CITY_STEPS,
  healingFacilities,
} from '../Rules/Unit/healing';
import { BARRACKS_REPAIR_STEPS, REPAIR_STEPS } from '../lib/AlliedRepair';
import {
  COURTHOUSE_DISTANCE_DIVISOR,
  InciteCostInputs,
  inciteCost,
} from '../lib/espionage';
import triremeLossChance, {
  LIGHTHOUSE_DESCRIBED_RULE,
  lighthouseDescription,
} from '../lib/coastBound';
import { describedRule } from '../lib/describedRule';
import { Nuclear, Pikeman, Trireme, Warrior } from '../Units';
import {
  SDI_DEFENCE_DESCRIBED_RULE,
  SDI_DEFENCE_RADIUS,
  sdiDefenceVetoes,
} from '../lib/sdiDefence';
import action, {
  AIRLIFT_ACTION_RULE,
  ALLIED_REPAIR_ACTION_RULE,
} from '../Rules/Unit/action';
import strength, {
  cityWallsMultiplier,
  defenceMultipliers,
} from '../Rules/Unit/strength';
import Air from '@civ-clone/base-unit-type-air/Air';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import Detonates from '@civ-clone/base-unit-trait-detonates/Detonates';
import { EffectDescription } from '@civ-clone/core-rule/Description';
import { Game } from '@civ-clone/core-game/Game';
import { Grassland } from '@civ-clone/civ2-world/Terrains';
import GreatWall from '@civ-clone/base-wonder-great-wall/GreatWall';
import IgnoresFortifications from '@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications';
import Land from '@civ-clone/base-unit-type-land/Land';
import Lighthouse from '@civ-clone/base-wonder-lighthouse/Lighthouse';
import ManhattanProject from '@civ-clone/base-wonder-manhattanproject/ManhattanProject';
import Naval from '@civ-clone/base-unit-type-naval/Naval';
import NuclearFission from '@civ-clone/base-science-advance-nuclearfission/NuclearFission';
import PortFacility from '@civ-clone/base-city-improvement-portfacility/PortFacility';
import Rule from '@civ-clone/core-rule/Rule';
import SdiDefence from '@civ-clone/base-city-improvement-sdidefence/SdiDefence';
import build from '../Rules/City/build';
import defeated from '../Rules/Unit/defeated';
import { expect } from 'chai';
import healing from '../Rules/Unit/healing';
import healingRules from '@civ-clone/base-unit-healing/lib/healingRules';
import movedRules from '@civ-clone/base-unit-lifecycle/lib/movedRules';
import { defenceStrength } from '@civ-clone/base-unit-yield/lib/defenceMultipliers';
import register from '../registerRules';

// What City Walls, the Great Wall, SDI Defense, Barracks, the Port Facility, the Airport, the Manhattan Project, a
//  Courthouse and the Lighthouse say they do, for the Civilopedia (civ-clone/web-renderer#1196, #1291), checked against what their rules do where a rule can be
//  run on its own. Each number is one constant that the rule and its description both read.

const describedBy = (rules: Rule[]): [Rule, EffectDescription][] =>
  rules.flatMap((rule) =>
    rule
      .descriptions()
      .map((description): [Rule, EffectDescription] => [rule, description])
  );

describe('descriptions', (): void => {
  it('City Walls multiply a land defence by what they say, and the Great Wall counts as them', (): void => {
    const described = describedBy(strength());

    expect(described.map(([, description]) => description)).to.eql([
      {
        type: 'defence_multiplier',
        subject: CityWalls,
        value: cityWallsMultiplier,
        against: Land,
        except: IgnoresFortifications,
      },
      {
        type: 'acts_as',
        subject: GreatWall,
        improvement: CityWalls,
        scope: 'player',
      },
    ]);

    const tile = { terrain: () => new Grassland() },
      defender = Object.assign(Object.create(Pikeman.prototype), {
        tile: () => tile,
      }),
      attacker = Object.assign(Object.create(Warrior.prototype), {
        hasTrait: () => false,
      });

    expect(
      defenceMultipliers({
        cityRegistry: {
          getByTile: () => ({ player: () => 'p' }),
        } as never,
        cityImprovementRegistry: {
          getByCity: () => [new CityWalls()],
        } as never,
        terrainFeatureRegistry: { getByTerrain: () => [] } as never,
        unitImprovementRegistry: { getByUnit: () => [] } as never,
      })(defender, attacker)
    ).to.eql([[CityWalls.name, cityWallsMultiplier]]);

    // base-unit-yield's rule, as it was: no id, the same priority.
    const [[rule]] = described,
      base = defenceStrength(() => []);

    expect(rule).to.be.instanceOf(base.constructor);
    expect(rule.id()).to.equal(base.id());
    expect(rule.priority().value()).to.equal(base.priority().value());
  });

  it("City Walls, or the Great Wall, keep a city's people when a defender loses", (): void => {
    const [[rule]] = describedBy(defeated());

    expect(rule.id()).to.equal('civ2-unit:unit/defeated/city-shrinks');
    expect(rule.descriptions()).to.eql([
      {
        type: 'protects_from',
        subject: CityWalls,
        event: 'defeat',
        what: 'size',
      },
      {
        type: 'acts_as',
        subject: GreatWall,
        improvement: CityWalls,
        scope: 'player',
      },
    ]);
  });

  it('Barracks, the Port Facility and the Airport heal their units fully, on the heal rule as it was', (): void => {
    const rules = healing(),
      [[rule]] = describedBy(rules),
      [, base] = healingRules({}, { prefix: 'civ2-unit', stepsPerMaximum: 10 });

    expect(healingFacilities.map(([, Facility]) => Facility)).to.eql([
      Barracks,
      Airport,
      PortFacility,
    ]);
    expect(rule.descriptions()).to.eql([
      { type: 'heals', subject: Barracks, unit: Land },
      { type: 'heals', subject: Airport, unit: Air },
      { type: 'heals', subject: PortFacility, unit: Naval },
      {
        type: 'heals_nearby',
        subject: Barracks,
        value: BARRACKS_NEAR_CITY_STEPS,
        radius: NEAR_CITY_DISTANCE,
        unit: Land,
      },
    ]);
    expect(rule.id()).to.equal(HEAL_UNITS_RULE);
    expect(base.id()).to.equal(HEAL_UNITS_RULE);
    expect(rule).to.be.instanceOf(base.constructor);
    expect(rule.priority().value()).to.equal(base.priority().value());
    expect(rules.map((rule) => rule.id())).to.include(
      'civ2-unit:unit/moved/healing'
    );
  });

  it('the Airport airlifts land units, said by the airlift rule in its place', (): void => {
    const rules = action(),
      described = describedBy(rules).filter(
        ([rule]) => rule.id() === AIRLIFT_ACTION_RULE
      );

    expect(described.map(([, description]) => description)).to.eql([
      { type: 'airlift', subject: Airport, unit: Land },
    ]);
    // Still between paradrop and pillage, as the table orders them.
    const ids = rules.map((rule) => rule.id()),
      at = ids.indexOf(AIRLIFT_ACTION_RULE);

    expect(ids[at - 1]).to.equal('civ2-unit:unit/action/paradrop');
  });

  it('SDI Defense stops a nuclear missile within the radius it says', (): void => {
    const square = (x: number, y: number) => ({
        x: () => x,
        y: () => y,
        map: () => ({ width: () => 40 }),
      }),
      city = (x: number) => ({ player: () => 'q', tile: () => square(x, 10) }),
      missile = Object.assign(Object.create(Nuclear.prototype), {
        player: () => 'p',
        hasTrait: (Trait: Function) => Trait === Detonates,
      }),
      vetoes = (cityX: number): boolean =>
        sdiDefenceVetoes({
          cityRegistry: { entries: () => [city(cityX)] } as never,
          cityImprovementRegistry: {
            getByCity: () => [new SdiDefence()],
          } as never,
          engine: { emit: () => {} } as never,
        })(missile, square(10, 10) as never);

    expect(vetoes(10 + SDI_DEFENCE_RADIUS)).to.equal(true);
    expect(vetoes(10 + SDI_DEFENCE_RADIUS + 1)).to.equal(false);

    const game = new Game();

    register(game);

    const [rule] = game.rules
      .entries()
      .filter((rule) => rule.id() === SDI_DEFENCE_DESCRIBED_RULE);

    expect(rule.descriptions()).to.eql([
      {
        type: 'protects_from',
        subject: SdiDefence,
        event: 'nuclear_attack',
        what: 'area',
        radius: SDI_DEFENCE_RADIUS,
      },
    ]);
  });

  it('the Manhattan Project lets every civilization that knows Nuclear Fission build nuclear weapons', (): void => {
    expect(
      describedBy(build()).map(([rule, description]) => [
        rule.id(),
        description,
      ])
    ).to.eql([
      [
        'civ2-unit:city/build/nuclear/Nuclear',
        {
          type: 'enables',
          subject: ManhattanProject,
          what: Nuclear,
          with: NuclearFission,
          scope: 'world',
        },
      ],
    ]);
  });

  // civ-clone/web-renderer#1291.

  it('the action rules say only what the Airport, Barracks and a Courthouse do', (): void => {
    expect(
      describedBy(action()).map(([rule, description]) => [
        rule.id(),
        description.type,
        description.subject,
      ])
    ).to.eql([
      ['civ2-unit:unit/action/incite-revolt', 'incite_distance', Courthouse],
      [ALLIED_REPAIR_ACTION_RULE, 'repairs_allies', Barracks],
      [AIRLIFT_ACTION_RULE, 'airlift', Airport],
    ]);
  });

  it("a Courthouse makes its city's distance from the capital count for less in the price to incite it", (): void => {
    const [[rule]] = describedBy(action()).filter(
        ([rule]) => rule.id() === 'civ2-unit:unit/action/incite-revolt'
      ),
      base: InciteCostInputs = {
        size: 8,
        gold: 500,
        distance: 16,
        communist: false,
        courthouse: false,
        disorder: false,
        empty: false,
        founder: false,
        spy: false,
        veteran: false,
      };

    expect(rule.descriptions()).to.eql([
      {
        type: 'incite_distance',
        subject: Courthouse,
        value: COURTHOUSE_DISTANCE_DIVISOR,
      },
    ]);
    expect(inciteCost({ ...base, courthouse: true })).to.equal(
      inciteCost({
        ...base,
        distance: base.distance / COURTHOUSE_DISTANCE_DIVISOR,
      })
    );
    expect(inciteCost({ ...base, courthouse: true })).to.be.greaterThan(
      inciteCost(base)
    );
  });

  it("Barracks repair an ally's unit moving onto their city by the tenths they say", (): void => {
    const repaired = (barracks: boolean): number => {
      const [rule] = action({
          cityRegistry: { getByTile: () => ({}) } as never,
          cityImprovementRegistry: {
            getByCity: () => (barracks ? [new Barracks()] : []),
          } as never,
        }).filter((rule) => rule.id() === ALLIED_REPAIR_ACTION_RULE),
        unit = Object.assign(Object.create(Warrior.prototype), {
          hitPoints: () => [1, 10],
          damage: () => 9,
        });

      return (rule.process(unit, {}, {}) as any).amount();
    };

    expect(
      describedBy(action())
        .filter(([rule]) => rule.id() === ALLIED_REPAIR_ACTION_RULE)
        .map(([, description]) => description)
    ).to.eql([
      {
        type: 'repairs_allies',
        subject: Barracks,
        value: BARRACKS_REPAIR_STEPS,
      },
    ]);
    expect(repaired(true)).to.equal(BARRACKS_REPAIR_STEPS);
    expect(repaired(false)).to.equal(REPAIR_STEPS);
  });

  it('Barracks heal land units within the radius they say a step more than without them', (): void => {
    const healed = (barracks: boolean, away: number): number => {
      const square = (x: number) => ({
          x: () => x,
          y: () => 10,
          map: () => ({ width: () => 40 }),
        }),
        city = { tile: () => square(10 + away) },
        unit = Object.assign(Object.create(Warrior.prototype), {
          destroyed: () => false,
          player: () => 'p',
          tile: () => square(10),
          hitPoints: () => [1, 10],
          damage: () => 9,
          setDamage(damage: number) {
            this.healed = 9 - damage;
          },
          healed: 0,
        }),
        [rule] = describedBy(
          healing({
            cityImprovementRegistry: {
              getByCity: () => (barracks ? [new Barracks()] : []),
            } as never,
            cityRegistry: {
              getByTile: () => null,
              getByPlayer: () => [city],
            } as never,
            landMassRegistry: {
              getByTile: () => ({ hasTile: () => true }),
            } as never,
            tileImprovementRegistry: { getByTile: () => [] } as never,
            unitImprovementRegistry: { getByUnit: () => [] } as never,
            unitRegistry: { getByPlayer: () => [unit] } as never,
          })
        )[0];

      rule.process('p');

      return unit.healed;
    };

    // A step resting, plus the bonus within the radius.
    expect(healed(true, NEAR_CITY_DISTANCE)).to.equal(
      1 + BARRACKS_NEAR_CITY_STEPS
    );
    expect(healed(false, NEAR_CITY_DISTANCE)).to.equal(1 + NEAR_CITY_STEPS);
    expect(healed(true, NEAR_CITY_DISTANCE + 1)).to.equal(1);
  });

  it('the Lighthouse keeps Triremes from being lost at sea, on the loss rule as it was', (): void => {
    const game = new Game();

    register(game);

    const [rule] = game.rules
        .entries()
        .filter((rule) => rule.id() === LIGHTHOUSE_DESCRIBED_RULE),
      base = movedRules(
        'civ2-unit',
        {},
        {
          Move: class {} as never,
          Disembark: class {} as never,
          attacks: [],
          noVendetta: [],
          coastBoundLoss: 0,
        }
      ).find((rule) => rule.id() === LIGHTHOUSE_DESCRIBED_RULE)!;

    expect(rule.descriptions()).to.eql([
      {
        type: 'protects_from',
        subject: Lighthouse,
        event: 'lost_at_sea',
        what: 'units',
        unit: Trireme,
      },
    ]);
    expect(rule).to.be.instanceOf(base.constructor);
    expect(rule.priority().value()).to.equal(base.priority().value());

    const chance = (owns: boolean): number =>
      triremeLossChance({
        playerResearchRegistry: {
          getByPlayer: () => ({ completed: () => false }),
        } as never,
        requirementRegistry: { for: () => [] } as never,
        wonderRegistry: {
          getByPlayer: () =>
            owns
              ? [
                  Object.assign(Object.create(Lighthouse.prototype), {
                    city: () => ({ destroyed: () => false }),
                  }),
                ]
              : [],
        } as never,
      })(
        Object.assign(Object.create(Trireme.prototype), { player: () => 'p' })
      );

    expect(chance(false)).to.be.greaterThan(0);
    expect(chance(true)).to.equal(0);
    // Described, it draws the one random number it did, and loses the ship as it did.
    const lost = (described: boolean): [number, number] => {
      let draws = 0,
        processed = 0;

      const [rule] = movedRules(
          'civ2-unit',
          {
            randomNumberGenerator: () => {
              draws++;

              return 0;
            },
            ruleRegistry: { process: () => processed++ } as never,
          },
          {
            Move: class {} as never,
            Disembark: class {} as never,
            attacks: [],
            noVendetta: [],
            coastBoundLoss: 0.5,
            nearLand: () => false,
          }
        )
          .filter((rule) => rule.id() === LIGHTHOUSE_DESCRIBED_RULE)
          .map((rule) =>
            described ? describedRule(rule, lighthouseDescription()) : rule
          ),
        unit = Object.assign(Object.create(Trireme.prototype), {
          hasTrait: () => true,
          moves: () => ({ value: () => 0 }),
          tile: () => ({}),
        });

      if (rule.validate(unit, {})) {
        rule.process(unit, {});
      }

      return [draws, processed];
    };

    expect(lost(true)).to.eql(lost(false));
    expect(lost(true)).to.eql([1, 1]);
  });
});
