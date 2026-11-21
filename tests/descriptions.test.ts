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
import { Fighter, Nuclear, Pikeman, Trireme, Warrior } from '../Units';
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
import movementCostRules from '@civ-clone/base-unit-movement/lib/movementCostRules';
import movementCost, {
  MOVE_RULE,
  terrainCost,
  civ2TerrainJobTurns,
  describedTerrainJobs,
} from '../Rules/Unit/movementCost';
import {
  defence as terrainDefence,
  irrigation as irrigationOutcome,
  mining as miningOutcome,
} from '@civ-clone/civ2-world/lib/terrainProperties';
import { Irrigation, Mine } from '@civ-clone/civ2-world/TileImprovements';
import { Engineer, Settlers } from '../Units';
import { BuildIrrigation, Move, TransformTerrain } from '../Actions';
import {
  Desert,
  Hills,
  Mountains,
  Ocean as OceanTerrain,
} from '@civ-clone/civ2-world/Terrains';
import UnitAction from '@civ-clone/core-unit/Action';
import { instance as pendingEffectRegistryInstance } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import { setUp } from './lib/game';
import workRate, { ENGINEER_WORK_RATE } from '../Rules/Unit/workRate';
import { Ocean } from '@civ-clone/civ2-world/Terrains';
import Terrain from '@civ-clone/core-terrain/Terrain';
import { terrainJobTurns } from '@civ-clone/base-terrain-properties/lib/jobTurns';
import { terrainTypes } from '@civ-clone/civ2-world/lib/terrainTable';
import { terrainValue } from '@civ-clone/base-terrain-properties/lib/terrainTable';

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
    const described = describedBy(strength()).filter(
      ([, description]) => description.type !== 'defence_bonus'
    );

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

  it('the action rules say only what the Airport, Barracks and a Courthouse do, and what terrain conversions make', (): void => {
    expect(
      describedBy(action())
        .filter(([, description]) => description.type !== 'converts_to')
        .map(([rule, description]) => [
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

  // What moving onto, defending on and working each terrain costs, and what irrigating or mining it makes, for each
  //  terrain's Civilopedia entry (civ-clone/web-renderer#620), checked against the rules that apply them.
  describe('terrain', (): void => {
    const terrainOf = (TerrainType: typeof Terrain): Terrain =>
        Object.create(TerrainType.prototype),
      onTerrain = (TerrainType: typeof Terrain) => {
        const terrain = terrainOf(TerrainType),
          tile = { terrain: () => terrain };

        return { terrain, tile };
      },
      ofType = (rules: Rule<any, any>[], type: string) =>
        describedBy(rules).filter(
          ([, description]) => description.type === type
        );

    it("says what moving onto every land terrain costs, on the move rule, and Ocean on the ships' rule, as they charge it", (): void => {
      const described = ofType(movementCost(), 'movement_cost'),
        landTerrains = terrainTypes.filter(
          (TerrainType) => TerrainType !== Ocean
        );

      expect(described.map(([, { subject }]) => subject)).to.eql([
        ...landTerrains,
        Ocean,
      ]);

      described.forEach(([rule, line]) => {
        const { tile } = onTerrain(line.subject as typeof Terrain),
          ship = line.subject === Ocean,
          unit = Object.create((ship ? Trireme : Warrior).prototype),
          move = Object.assign(Object.create(Move.prototype), {
            to: () => tile,
          });

        expect(rule.id()).to.equal(
          ship ? 'civ2-unit:unit/movement-cost/air-and-naval' : MOVE_RULE
        );
        expect(Object.keys(line)).to.eql(['type', 'subject', 'value']);
        expect(rule.validate(unit, move)).to.true;
        expect(
          rule.process(unit, move),
          (line.subject as Function).name
        ).to.equal(line.value);
      });
    });

    it("builds the rules it describes as base-unit-movement's, in their place, so they answer as base-unit-movement's do", (): void => {
      const registries = [
          { getByTile: () => [] },
          { hasUnit: () => false },
          { getByTerrain: () => [] },
          { getByTile: () => null },
        ] as never[],
        rules = (movementCost as (...args: never[]) => Rule[])(...registries),
        base = movementCostRules(
          'civ2-unit',
          {
            tileImprovementRegistry: registries[0],
            transportRegistry: registries[1],
          },
          {
            Move,
            terrainCost,
            routes: [],
            orders: [],
            jobs: civ2TerrainJobTurns,
          }
        ),
        baseById = new Map(base.map((rule) => [rule.id(), rule])),
        rebuilt = rules.filter((rule) => rule.descriptions().length > 0);

      // The move, air-and-naval and one rule per described job.
      expect(rebuilt.length).to.equal(2 + describedTerrainJobs.length);

      const actions = [Move, ...describedTerrainJobs.map(([Job]) => Job)],
        units = [Warrior, Trireme, Fighter, Settlers, Engineer];

      rebuilt.forEach((rule) => {
        const original = baseById.get(rule.id())!;

        expect(original, rule.id()!).to.not.undefined;
        expect(rule).to.be.instanceOf(original.constructor);
        expect(rule.priority().value()).to.equal(original.priority().value());

        terrainTypes.forEach((TerrainType) => {
          const { tile } = onTerrain(TerrainType);

          units.forEach((UnitType) =>
            actions.forEach((ActionType) => {
              const unit = Object.assign(Object.create(UnitType.prototype), {
                  tile: () => tile,
                }),
                action = Object.assign(Object.create(ActionType.prototype), {
                  to: () => tile,
                }),
                label = `${rule.id()} ${UnitType.name} ${ActionType.name} ${
                  TerrainType.name
                }`,
                valid = original.validate(unit, action);

              expect(rule.validate(unit, action), label).to.equal(valid);

              if (valid) {
                expect(rule.process(unit, action), label).to.equal(
                  original.process(unit, action)
                );
              }
            })
          );
        });
      });

      // Every rule keeps its place.
      expect(
        rules.map((rule) => rule.id()).filter((id) => baseById.has(id))
      ).to.eql(
        base
          .map((rule) => rule.id())
          .filter((id) => rules.some((rule) => rule.id() === id))
      );
    });

    it('says the defence of every terrain that gives one, on the defence rule, as it gives it', (): void => {
      const described = ofType(strength(), 'defence_bonus').map(
        ([, line]) => line
      );

      expect(described.map(({ subject }) => subject)).to.eql(
        terrainTypes.filter(
          (TerrainType) =>
            terrainValue(terrainDefence, terrainOf(TerrainType)) !== 1
        )
      );

      terrainTypes.forEach((TerrainType) => {
        const { tile } = onTerrain(TerrainType),
          line = described.find(({ subject }) => subject === TerrainType),
          defender = Object.assign(Object.create(Pikeman.prototype), {
            tile: () => tile,
          });

        expect(
          defenceMultipliers({
            cityRegistry: { getByTile: () => null } as never,
            terrainFeatureRegistry: { getByTerrain: () => [] } as never,
            tileImprovementRegistry: { getByTile: () => [] } as never,
            unitImprovementRegistry: { getByUnit: () => [] } as never,
          })(defender, null),
          TerrainType.name
        ).to.eql(line === undefined ? [] : [[TerrainType.name, line.value]]);
      });
    });

    it("says the turns of Settlers' work each job takes on each terrain, on the job's rule, as it charges them", (): void => {
      const rules = movementCost();

      describedTerrainJobs.forEach(([Job, Improvement, terrains]) => {
        const rule = rules.find(
            (rule) =>
              rule.id() === `civ2-unit:unit/movement-cost/action/${Job.name}`
          )!,
          lines = rule.descriptions();

        expect(
          lines.map(({ subject }) => subject),
          Job.name
        ).to.eql(terrains);

        lines.forEach((line) => {
          const { terrain, tile } = onTerrain(line.subject as typeof Terrain),
            unit = { tile: () => tile },
            job = Object.create(Job.prototype);

          expect(Object.keys(line)).to.eql([
            'type',
            'subject',
            'improvement',
            'value',
            'unit',
          ]);
          expect(line.type).to.equal('improvement_turns');
          expect(line.improvement).to.equal(Improvement);
          expect(line.value).to.be.a('number');

          // Settlers' work, but a transform, which is Engineers' at their work rate.
          const rate = Job === TransformTerrain ? ENGINEER_WORK_RATE : 1,
            charged = terrainJobTurns(civ2TerrainJobTurns, Job, terrain)!;

          expect(line.unit).to.equal(
            Job === TransformTerrain ? Engineer : Settlers
          );
          // The rule, like `terrainJobTurns`, doesn't count the turn the order is given on, and `DelayedAction` divides
          //  what it charges by the worker's rate, rounding up; the description counts the order's turn.
          expect(
            Math.ceil(charged / rate) + 1,
            `${Job.name} ${terrain.constructor.name}`
          ).to.equal(line.value);
          expect(rule.validate(unit, job)).to.true;
          expect(rule.process(unit, job)).to.equal(charged);
        });
      });

      // Engineers' rate is the work rate rule's.
      const [rateRule] = workRate();

      expect(rateRule.process(Object.create(Engineer.prototype))).to.equal(
        ENGINEER_WORK_RATE
      );

      // Road, railroad and fortress turns for every land terrain.
      expect(
        describedTerrainJobs
          .filter(([, , terrains]) => terrains.includes(Ocean))
          .map(([Job]) => Job.name)
      ).to.eql([]);
    });

    it('says what irrigating or mining a terrain makes of it, on the conversion rules, as @TERRAIN says', (): void => {
      const described = ofType(action(), 'converts_to');

      expect(described.length).to.equal(7);

      described.forEach(([rule, line]) => {
        const terrain = terrainOf(line.subject as typeof Terrain),
          table =
            line.improvement === Irrigation ? irrigationOutcome : miningOutcome;

        expect([Irrigation, Mine]).to.include(line.improvement);
        expect(rule.id()).to.match(/^civ2-unit:unit\/action\/terrain\//);
        expect(terrainValue(table, terrain), rule.id()!).to.equal(line.terrain);
      });

      // Every terrain irrigating or mining changes says so.
      expect(
        terrainTypes.flatMap((TerrainType) =>
          ([irrigationOutcome, miningOutcome] as const)
            .map((table) => terrainValue(table, terrainOf(TerrainType)))
            .filter((outcome) => typeof outcome === 'function')
            .map(() => TerrainType)
        )
      ).to.eql(
        terrainTypes.flatMap((TerrainType) =>
          described
            .filter(([, { subject }]) => subject === TerrainType)
            .map(() => TerrainType)
        )
      );
    });

    it('says the turns a job really takes in a game, counting the turn the order is given on', async function (): Promise<void> {
      this.timeout(20000);

      // Engineers on Desert, Hills and Mountains (1, 2 and 3 moves), and Settlers on Desert beside the sea.
      const { game, player, at } = await setUp((x: number) =>
          x >= 8 ? OceanTerrain : x === 1 ? Hills : x === 2 ? Mountains : Desert
        ),
        described = (Job: typeof UnitAction, TerrainType: typeof Terrain) =>
          movementCost()
            .find(
              (rule) =>
                rule.id() === `civ2-unit:unit/movement-cost/action/${Job.name}`
            )!
            .descriptions()
            .find(({ subject }) => subject === TerrainType)!.value,
        // Gives the order as a player would, then plays turns as each turn's start does for the player's units
        //  (base-player's `resetUnits`: full moves, then a busy unit's work goes on), until the unit is free again.
        counted = (
          UnitType: typeof Engineer | typeof Settlers,
          Job: typeof UnitAction,
          x: number,
          y: number,
          done: (unit: Engineer | Settlers) => boolean
        ): number => {
          const tile = at(x, y),
            unit = new UnitType(null, player, tile, game.rules);

          game.units.register(unit);
          unit.moves().set(unit.movement());

          const order = unit
            .actions(tile)
            .find((action) => action instanceof Job);

          expect(order, Job.name).to.not.undefined;

          order!.perform();

          let turns = 1;

          while (unit.busy() !== null) {
            expect(done(unit), `${Job.name} finished early`).to.false;
            expect(turns, `${Job.name} never finishes`).to.below(100);

            game.turn.increment();
            turns++;

            unit.moves().set(unit.movement());

            const busy = unit.busy()!;

            if (busy.validate()) {
              busy.process();
            }
          }

          expect(done(unit), `${Job.name} done`).to.true;

          return turns;
        };

      (
        [
          [0, 1, Desert, () => at(0, 1).terrain()],
          [1, 1, Hills, () => at(1, 1).terrain()],
          [2, 1, Mountains, () => at(2, 1).terrain()],
        ] as [number, number, typeof Terrain, () => Terrain][]
      ).forEach(([x, y, TerrainType, terrain]) => {
        const turns = counted(
          Engineer,
          TransformTerrain,
          x,
          y,
          () => !(terrain() instanceof TerrainType)
        );

        expect(turns, TerrainType.name).to.equal(
          described(TransformTerrain, TerrainType)
        );
      });

      // Irrigation's completion builds on the default registries (base-unit-action-build-irrigation), not the game's, so
      //  the unit being free again, with its pending effect discharged, is what says it's done.
      const irrigated = counted(
        Settlers,
        BuildIrrigation,
        7,
        3,
        (unit) =>
          unit.busy() === null &&
          [game.pendingEffects, pendingEffectRegistryInstance].every(
            (registry) => registry.getByTarget(unit).length === 0
          )
      );

      expect(irrigated).to.equal(5);
      expect(irrigated).to.equal(described(BuildIrrigation, Desert));
    });
  });
});
