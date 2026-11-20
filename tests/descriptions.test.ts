import { HEAL_UNITS_RULE, healingFacilities } from '../Rules/Unit/healing';
import { Nuclear, Pikeman, Warrior } from '../Units';
import {
  SDI_DEFENCE_DESCRIBED_RULE,
  SDI_DEFENCE_RADIUS,
  sdiDefenceVetoes,
} from '../lib/sdiDefence';
import action, { AIRLIFT_ACTION_RULE } from '../Rules/Unit/action';
import strength, {
  cityWallsMultiplier,
  defenceMultipliers,
} from '../Rules/Unit/strength';
import Air from '@civ-clone/base-unit-type-air/Air';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import Detonates from '@civ-clone/base-unit-trait-detonates/Detonates';
import { EffectDescription } from '@civ-clone/core-rule/Description';
import { Game } from '@civ-clone/core-game/Game';
import { Grassland } from '@civ-clone/civ2-world/Terrains';
import GreatWall from '@civ-clone/base-wonder-great-wall/GreatWall';
import IgnoresFortifications from '@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications';
import Land from '@civ-clone/base-unit-type-land/Land';
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
import { defenceStrength } from '@civ-clone/base-unit-yield/lib/defenceMultipliers';
import register from '../registerRules';

// What City Walls, the Great Wall, SDI Defense, Barracks, the Port Facility, the Airport and the Manhattan Project say
//  they do, for the Civilopedia (civ-clone/web-renderer#1196), checked against what their rules do where a rule can be
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
      described = describedBy(rules);

    expect(described.map(([, description]) => description)).to.eql([
      { type: 'airlift', subject: Airport, unit: Land },
    ]);
    expect(described[0][0].id()).to.equal(AIRLIFT_ACTION_RULE);
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
});
