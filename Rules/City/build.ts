import {
  ATTACK,
  DEFEND,
  NUCLEAR_ATTACK,
  UnitRow,
  units,
} from '../../data/units';
import { Build, IBuildCriterion } from '@civ-clone/core-city-build/Rules/Build';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import { Fanatic, Knight, Musketman } from '../../Units';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import Advance from '@civ-clone/core-science/Advance';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Description from '@civ-clone/core-rule/Description';
import Effect from '@civ-clone/core-rule/Effect';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import ManhattanProject from '@civ-clone/base-wonder-manhattanproject/ManhattanProject';
import Gunpowder from '@civ-clone/base-science-advance-gunpowder/Gunpowder';
import { IConstructor } from '@civ-clone/core-registry/Registry';
import NuclearFission from '@civ-clone/base-science-advance-nuclearfission/NuclearFission';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import { advanceType } from '../../lib/unitTable';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';
import isHuman from '@civ-clone/base-difficulty/lib/isHuman';
import { unitTypes } from '../../lib/unitTable';

const rowOf = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

const row = (UnitType: Function): UnitRow => rowOf.get(UnitType)!;

export interface BuildDependencies {
  clientRegistry?: ClientRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  // Whether anyone has ever built the Manhattan Project (`lib/manhattanProject`, which `registerRules` passes). Never,
  //  unless given.
  manhattanProjectBuilt?: () => boolean;
}

/**
 * What Civilization II's build list leaves out beyond a unit's advances (`civ_can_build_unit`), one rule per unit it
 *  can leave out, `civ2-unit:city/build/<reason>/<Unit>`:
 *  - `outclassed-defender`: a defensive unit weaker in defence than Musketeers, once Gunpowder is known;
 *  - `outclassed-mounted`: a two-move attacker no stronger than Knights in attack and weaker in defence, once the
 *    Knights' advance is known;
 *  - `nuclear`: a nuclear weapon needs Nuclear Fission and the Manhattan Project built by anyone;
 *  - `fundamentalism`: Fanatics only under Fundamentalism;
 *  - `computer-outclassed`: a computer player doesn't build a multi-move land unit when another of its role, whose
 *    advance it knows, is at least as strong in attack and defence and stronger in one.
 *  Barbarian cities are left to their own rules, as for the advances.
 */
export const getRules = ({
  clientRegistry = clientRegistryInstance,
  playerGovernmentRegistry = playerGovernmentRegistryInstance,
  playerResearchRegistry = playerResearchRegistryInstance,
  manhattanProjectBuilt = (): boolean => false,
}: BuildDependencies = {}): Build[] => {
  const knows = (player: Player, AdvanceType: typeof Advance | null): boolean =>
      AdvanceType === null ||
      playerResearchRegistry.getByPlayer(player).completed(AdvanceType),
    rule = (
      reason: string,
      UnitType: typeof Unit,
      allowed: (city: City) => boolean,
      ...descriptions: Description[]
    ): Build =>
      new Build(
        `civ2-unit:city/build/${reason}/${UnitType.name}`,
        UnitType,
        new Criterion(
          (city: City, BuildItem: IConstructor): boolean =>
            BuildItem === UnitType && !isBarbarian(city.player())
        ),
        new Effect(
          (city: City): IBuildCriterion =>
            new Criterion((): boolean => allowed(city))
        ),
        // `Build` hands everything but its items to `Rule`, which takes a `Description`, though core-city-build's
        //  constructor type doesn't list one.
        ...(descriptions as unknown as Criterion[])
      ),
    [, , , , knightsAttack, knightsDefence, , , , , , knightsAdvance] =
      row(Knight),
    musketeersDefence = row(Musketman)[5];

  return unitTypes.flatMap((UnitType: typeof Unit): Build[] => {
    const [, domain, move, , attack, defence, , , , , role] = row(UnitType),
      rules: Build[] = [];

    if (role === DEFEND && defence < musketeersDefence) {
      rules.push(
        rule(
          'outclassed-defender',
          UnitType,
          (city: City): boolean => !knows(city.player(), Gunpowder)
        )
      );
    }

    if (
      role === ATTACK &&
      move === 2 &&
      attack <= knightsAttack &&
      defence < knightsDefence
    ) {
      rules.push(
        rule(
          'outclassed-mounted',
          UnitType,
          (city: City): boolean =>
            !knows(city.player(), advanceType(knightsAdvance))
        )
      );
    }

    if (attack >= NUCLEAR_ATTACK) {
      rules.push(
        rule(
          'nuclear',
          UnitType,
          (city: City): boolean =>
            manhattanProjectBuilt() && knows(city.player(), NuclearFission),
          // What the Manhattan Project does, for the Civilopedia (civ-clone/web-renderer#1196): once anyone has built
          //  it, every civilization that knows Nuclear Fission can build the weapon.
          new Description({
            type: 'enables',
            subject: ManhattanProject,
            what: UnitType,
            with: NuclearFission,
            scope: 'world',
          })
        )
      );
    }

    if (UnitType === Fanatic) {
      rules.push(
        rule('fundamentalism', UnitType, (city: City): boolean => {
          // A player with no government yet has no Fundamentalism.
          try {
            return playerGovernmentRegistry
              .getByPlayer(city.player())
              .is(Fundamentalism);
          } catch (e) {
            return false;
          }
        })
      );
    }

    if (domain === 0 && move > 1) {
      rules.push(
        rule(
          'computer-outclassed',
          UnitType,
          (city: City): boolean =>
            isHuman(city.player(), clientRegistry) ||
            !unitTypes.some((OtherType: typeof Unit): boolean => {
              const [, , , , otherAttack, otherDefence] = row(OtherType),
                [
                  ,
                  otherDomain,
                  otherMove,
                  ,
                  ,
                  ,
                  ,
                  ,
                  ,
                  ,
                  otherRole,
                  prerequisite,
                ] = row(OtherType);

              return (
                OtherType !== UnitType &&
                otherRole === role &&
                otherDomain === domain &&
                otherMove > 1 &&
                knows(city.player(), advanceType(prerequisite)) &&
                attack <= otherAttack &&
                defence <= otherDefence &&
                (attack !== otherAttack || defence !== otherDefence)
              );
            })
        )
      );
    }

    return rules;
  });
};

export default getRules;
