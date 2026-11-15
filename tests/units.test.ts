import {
  AirSuperiorityRole,
  AttackRole,
  DefendRole,
  DiplomacyRole,
  NavalSuperiorityRole,
  SettleRole,
  TradeRole,
  TransportRole,
} from '@civ-clone/base-unit-role/Roles';
import {
  Bomber,
  Carrier,
  Diplomat,
  Engineer,
  Fighter,
  Explorer,
  Fanatic,
  Frigate,
  Galleon,
  Helicopter,
  Marine,
  MissileCruiser,
  Nuclear,
  Partisan,
  Pikeman,
  Settlers,
  Spy,
  Submarine,
  Trireme,
  Warrior,
} from '../Units';
import { units } from '../data/units';
import Air from '@civ-clone/base-unit-type-air/Air';
import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import DefenceBonusVsAir from '@civ-clone/base-unit-trait-defence-bonus-vs-air/DefenceBonusVsAir';
import DefenceBonusVsMounted from '@civ-clone/base-unit-trait-defence-bonus-vs-mounted/DefenceBonusVsMounted';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import Land from '@civ-clone/base-unit-type-land/Land';
import Naval from '@civ-clone/base-unit-type-naval/Naval';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SupportExemptUnder from '@civ-clone/base-unit-trait-support-exempt-under/SupportExemptUnder';
import Unit from '@civ-clone/core-unit/Unit';
import UnitTraits from '@civ-clone/core-unit/Rules/UnitTraits';
import { capacity } from '../Rules/Unit/yield';
import { expect } from 'chai';
import roles from '../Rules/Unit/roles';
import { roleOf } from '@civ-clone/base-unit-role/roleOf';
import traits from '../Rules/Unit/traits';
import { traitsOf } from '@civ-clone/core-unit/traits';
import { unitTypes } from '../lib/unitTable';

const ruleRegistry = new RuleRegistry();

ruleRegistry.register(...traits(), ...roles());

// The names of the traits a unit type has, in declaration order.
const traitNames = (UnitType: typeof Unit): string[] =>
  ruleRegistry
    .get(UnitTraits)
    .filter((rule) => rule.validate(UnitType))
    .flatMap((rule) => rule.process(UnitType))
    .map((trait) => trait.constructor.name);

describe('the unit table', (): void => {
  it('has 51 types, each its own class, with the domain its row gives it', (): void => {
    expect(unitTypes).length(51);
    expect(new Set(unitTypes).size).to.equal(51);

    unitTypes.forEach((UnitType: typeof Unit, index: number): void => {
      const [, domain] = units[index],
        Domain = [Land, Air, Naval][domain];

      expect(
        Object.prototype.isPrototypeOf.call(Domain, UnitType),
        `row ${index}`
      ).to.true;
    });
  });

  it('makes a NavalTransport of exactly the ships that hold units', (): void => {
    const holders = capacity.map(([UnitType]) => UnitType);

    unitTypes.forEach((UnitType: typeof Unit, index: number): void =>
      expect(
        Object.prototype.isPrototypeOf.call(NavalTransport, UnitType),
        `row ${index}`
      ).to.equal(holders.includes(UnitType))
    );
    expect(
      capacity.map(([UnitType, holds]) => [UnitType.name, holds])
    ).to.deep.equal([
      ['Trireme', 2],
      ['Sail', 3],
      ['Galleon', 4],
      ['Frigate', 2],
      ['Submarine', 8],
      ['Carrier', 8],
      ['Transport', 8],
    ]);
  });
});

describe('traits', (): void => {
  // The units whose flags, roles or numbers set them apart, spelled out rather than derived again from `data/units`.
  (
    [
      [Settlers, ['FoundsCities', 'Terraforms']],
      [Engineer, ['FoundsCities', 'Terraforms']],
      [Warrior, ['Fortifies']],
      [Pikeman, ['Fortifies', 'DefenceBonusVsMounted']],
      [Fanatic, ['Fortifies', 'SupportExemptUnder']],
      [Partisan, ['Fortifies', 'IgnoresZoneOfControl', 'TerrainAsRoad']],
      [Marine, ['Fortifies', 'Amphibious']],
      [Helicopter, ['DetectsSubmerged', 'AttackEndsTurn']],
      [Bomber, ['AttackEndsTurn']],
      [Fighter, ['Interceptor']],
      [Trireme, ['CoastBound', 'Carries']],
      [Galleon, ['Carries']],
      [MissileCruiser, ['DefenceBonusVsAir', 'DetectsSubmerged']],
      [Submarine, ['Submerged', 'Carries']],
      [Carrier, ['Carries']],
      [Nuclear, ['SingleUse', 'Detonates']],
      [
        Diplomat,
        [
          'Fortifies',
          'NonCombatant',
          'DiplomaticMissions',
          'IgnoresZoneOfControl',
        ],
      ],
      [
        Spy,
        [
          'Fortifies',
          'NonCombatant',
          'DiplomaticMissions',
          'IgnoresZoneOfControl',
          'Covert',
        ],
      ],
      [
        Explorer,
        ['Fortifies', 'NonCombatant', 'IgnoresZoneOfControl', 'TerrainAsRoad'],
      ],
    ] as [typeof Unit, string[]][]
  ).forEach(([UnitType, expected]): void =>
    it(`gives ${UnitType.name} ${expected.join(', ')}`, (): void => {
      expect(traitNames(UnitType)).to.deep.equal(expected);
    })
  );

  it("carries the parameters Civ2's code uses", (): void => {
    const [mounted] = traitsOf(Pikeman, DefenceBonusVsMounted, ruleRegistry),
      [air] = traitsOf(MissileCruiser, DefenceBonusVsAir, ruleRegistry),
      [exempt] = traitsOf(Fanatic, SupportExemptUnder, ruleRegistry),
      carries = (UnitType: typeof Unit, What: typeof Unit): boolean =>
        traitsOf(UnitType, Carries, ruleRegistry).some((trait) =>
          trait.carries(What, ruleRegistry)
        );

    expect(mounted.multiplier).to.equal(1.5);
    expect([air.multiplier, air.vsSingleUse]).to.deep.equal([3, 5]);
    expect(
      (exempt as unknown as { governments: unknown[] }).governments
    ).to.deep.equal([Fundamentalism]);
    expect(carries(Carrier, Air)).to.true;
    expect(carries(Carrier, Land)).to.false;
    expect(carries(Galleon, Land)).to.true;
  });
});

describe('roles', (): void => {
  it("gives each unit type its row's role", (): void => {
    const counts = new Map<unknown, number>();

    unitTypes.forEach((UnitType: typeof Unit): void => {
      const role = roleOf(UnitType, ruleRegistry);

      counts.set(role, (counts.get(role) ?? 0) + 1);
    });

    expect(
      [
        AttackRole,
        DefendRole,
        NavalSuperiorityRole,
        AirSuperiorityRole,
        TransportRole,
        SettleRole,
        DiplomacyRole,
        TradeRole,
      ].map((Role) => counts.get(Role) ?? 0)
    ).to.deep.equal([19, 12, 8, 2, 4, 2, 2, 2]);
    expect(roleOf(Marine, ruleRegistry)).to.equal(AttackRole);
    expect(roleOf(Frigate, ruleRegistry)).to.equal(NavalSuperiorityRole);
  });
});
