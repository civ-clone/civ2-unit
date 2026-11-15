import {
  Archer,
  Engineer,
  Frigate,
  Galleon,
  Musketman,
  Pikeman,
  Rifleman,
  Spearman,
  Transport,
  Warrior,
} from '../Units';
import { advanceTypes, unitTypes } from '../lib/unitTable';
import upgradeOptions, { upgradeTable } from '../lib/upgrade';
import Advance from '@civ-clone/core-science/Advance';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';
import Conscription from '@civ-clone/base-science-advance-conscription/Conscription';
import Electricity from '@civ-clone/base-science-advance-electricity/Electricity';
import Feudalism from '@civ-clone/base-science-advance-feudalism/Feudalism';
import Gunpowder from '@civ-clone/base-science-advance-gunpowder/Gunpowder';
import Industrialization from '@civ-clone/base-science-advance-industrialization/Industrialization';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';
import { units } from '../data/units';
import { upgradeTarget } from '@civ-clone/base-unit-upgrade/lib/upgradeTarget';

// What Leonardo's Workshop makes of each unit type, worked by hand from the `@UNITS` table as OpenCiv2
//  `civ_leonardo_upgrade` (`src/auto/civ.cpp`, richardpenman/civ2@49f26ec) reads it: the obsoleting advance (col. 0),
//  a target of the same role (col. 10) whose prerequisite (col. 11) is that advance and whose hold (col. 9) is at least
//  as large, the last row of several.
describe('Leonardo upgrades', (): void => {
  const stub = (Type: typeof Unit, player: Player | null = null): Unit =>
      ({
        sourceClass: () => Type,
        player: () => player,
      } as unknown as Unit),
    knowing = (...known: (typeof Advance)[]) => ({
      ...upgradeTable,
      hasAdvance: (player: Player, AdvanceType: typeof Advance): boolean =>
        known.includes(AdvanceType),
    });

  // With only the type's obsoleting advance known: each row's target, by `@UNITS` row.
  const expected: Record<number, number | null> = {
    0: 1, // Settlers -> Engineers (Explosives, settle role)
    2: 6, // Warriors -> Pikemen (Feudalism)
    3: 6, // Phalanx -> Pikemen
    4: 7, // Archers -> Musketeers (Gunpowder)
    5: 7, // Legion -> Musketeers
    6: 7, // Pikemen -> Musketeers
    7: 11, // Musketeers -> Riflemen (Conscription)
    15: 19, // Horsemen -> Knights (Chivalry)
    16: 17, // Chariot -> Elephants (Polytheism)
    17: 18, // Elephants -> Crusaders (Monotheism)
    18: 20, // Crusaders -> Dragoons (Leadership)
    19: 20, // Knights -> Dragoons
    20: 21, // Dragoons -> Cavalry (Tactics)
    21: 22, // Cavalry -> Armor (Mobile Warfare)
    23: 24, // Catapult -> Cannon (Metallurgy)
    24: 25, // Cannon -> Artillery (Machine Tools)
    25: 26, // Artillery -> Howitzer (Robotics)
    27: 30, // Fighter -> Stealth Fighter (Stealth)
    28: 31, // Bomber -> Stealth Bomber
    32: 33, // Trireme (hold 2) -> Caravel (hold 3, Navigation)
    33: 34, // Caravel -> Galleon (hold 4, Magnetism)
    34: 43, // Galleon -> Transport (hold 8, Industrialization)
    35: null, // Frigate (hold 2): Destroyer holds none
    36: 37, // Ironclad -> Destroyer (Electricity)
    38: 39, // Cruiser -> AEGIS Cruiser (Rocketry)
    46: 47, // Diplomat -> Spy (Espionage)
    48: 49, // Caravan -> Freight (The Corporation)
    50: null, // Explorer: Partisans (Guerrilla Warfare) are another role
  };

  unitTypes.forEach((Type: typeof Unit, index: number): void => {
    const obsoletedBy = units[index][0],
      target = expected[index] ?? null;

    it(`makes row ${index} (${Type.name}) ${
      target === null ? 'nothing' : unitTypes[target].name
    }`, (): void => {
      const known = obsoletedBy === -1 ? [] : [advanceTypes[obsoletedBy]];

      expect(upgradeTarget(stub(Type), knowing(...known))).to.equal(
        target === null ? null : unitTypes[target]
      );
    });
  });

  it('needs the obsoleting advance', (): void => {
    expect(upgradeTarget(stub(Pikeman), knowing(Feudalism))).to.null;
  });

  it('upgrades defensive units weaker than Musketeers with Gunpowder, skipping a step', (): void => {
    const player = new Player(new RuleRegistry()),
      research = new PlayerResearch(
        player,
        new AdvanceRegistry(),
        new RuleRegistry()
      ),
      registry = new PlayerResearchRegistry();

    registry.register(research);

    const civ2 = upgradeOptions({ playerResearchRegistry: registry });

    research.addAdvance(Gunpowder);

    expect(upgradeTarget(stub(Warrior, player), civ2)).to.equal(Musketman);
    expect(upgradeTarget(stub(Spearman, player), civ2)).to.equal(Musketman);
    expect(upgradeTarget(stub(Archer, player), civ2)).to.equal(Musketman);
    // Defence 3 is not below Musketeers' 3, and Conscription isn't known.
    expect(upgradeTarget(stub(Musketman, player), civ2)).to.null;

    research.addAdvance(Conscription);

    expect(upgradeTarget(stub(Musketman, player), civ2)).to.equal(Rifleman);
  });

  it('keeps a Frigate with Electricity and a Galleon goes to Transport with Industrialization', (): void => {
    expect(upgradeTarget(stub(Frigate), knowing(Electricity))).to.null;
    expect(upgradeTarget(stub(Galleon), knowing(Industrialization))).to.equal(
      Transport
    );
  });

  it('gives Engineers nothing', (): void => {
    expect(
      upgradeTarget(stub(Engineer), knowing(...Object.values(advanceTypes)))
    ).to.null;
  });
});
