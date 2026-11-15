import {
  AIR,
  AIR_SUPERIORITY,
  LAND,
  SEA,
  SUBMARINE,
  UnitRow,
  units,
} from '../../data/units';
import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import CombatModifiers, {
  CombatTerms,
} from '@civ-clone/base-combat-rounds/lib/CombatModifiers';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import { Dependencies, defenceMultipliers } from './strength';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import CombatResolver from '@civ-clone/core-unit/Rules/CombatResolver';
import Criterion from '@civ-clone/core-rule/Criterion';
import DefenceBonusVsAir from '@civ-clone/base-unit-trait-defence-bonus-vs-air/DefenceBonusVsAir';
import DefenceBonusVsMounted from '@civ-clone/base-unit-trait-defence-bonus-vs-mounted/DefenceBonusVsMounted';
import DefenderRank from '@civ-clone/core-unit/Rules/DefenderRank';
import Effect from '@civ-clone/core-rule/Effect';
import Interceptor from '@civ-clone/base-unit-trait-interceptor/Interceptor';
import SamMissileBattery from '@civ-clone/base-city-improvement-sammissilebattery/SamMissileBattery';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import combatRoundsRules from '@civ-clone/base-combat-rounds/lib/combatRoundsRules';
import { unitTypes } from '../../lib/unitTable';

/** Civilization II's strengths are whole numbers at 8 steps to 1 (`unit_attack_strength`, `unit_defense_strength`). */
export const STRENGTH_SCALE = 8;

// Each unit type's `@UNITS` row, by class.
const rows = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

const rowOf = (unit: Unit): UnitRow | undefined => rows.get(unit.constructor);

const domainOf = (unit: Unit): number | undefined => rowOf(unit)?.[1];

/**
 * The firepower changes of `unit_resolve_attack`, in its order, each a `CombatModifiers` rule
 *  `civ2-unit:unit/combat-modifiers/<name>`:
 * - `air-superiority-vs-no-fuel`: an air-superiority attacker against an aircraft with no range (a Helicopter): the
 *   defender's firepower is 1 (its defence is halved by the `Strength` rule of the same name);
 * - `shore-bombardment`: a ship against a land unit: both firepowers are 1;
 * - `submarine-defender`: a submarine defends at firepower 1;
 * - `ship-in-port`: a ship on land (in a city) attacked by anything but a ship: its firepower is 1, and the attacker's
 *   is doubled.
 */
export const combatModifiers = (): CombatModifiers[] => [
  new CombatModifiers(
    'civ2-unit:unit/combat-modifiers/air-superiority-vs-no-fuel',
    new Criterion(
      (attacker: Unit, defender: Unit): boolean =>
        rowOf(attacker)?.[10] === AIR_SUPERIORITY &&
        domainOf(defender) === AIR &&
        rowOf(defender)?.[3] === 0
    ),
    new Effect(
      (attacker: Unit, defender: Unit, terms: CombatTerms): CombatTerms => ({
        ...terms,
        defenderFirepower: 1,
      })
    )
  ),
  new CombatModifiers(
    'civ2-unit:unit/combat-modifiers/shore-bombardment',
    new Criterion(
      (attacker: Unit, defender: Unit): boolean =>
        domainOf(attacker) === SEA && domainOf(defender) === LAND
    ),
    new Effect(
      (attacker: Unit, defender: Unit, terms: CombatTerms): CombatTerms => ({
        ...terms,
        attackerFirepower: 1,
        defenderFirepower: 1,
      })
    )
  ),
  new CombatModifiers(
    'civ2-unit:unit/combat-modifiers/submarine-defender',
    new Criterion(
      (attacker: Unit, defender: Unit): boolean =>
        ((rowOf(defender)?.[12] ?? 0) & SUBMARINE) !== 0
    ),
    new Effect(
      (attacker: Unit, defender: Unit, terms: CombatTerms): CombatTerms => ({
        ...terms,
        defenderFirepower: 1,
      })
    )
  ),
  new CombatModifiers(
    'civ2-unit:unit/combat-modifiers/ship-in-port',
    new Criterion(
      (attacker: Unit, defender: Unit): boolean =>
        domainOf(defender) === SEA &&
        defender.tile().isLand() &&
        domainOf(attacker) !== SEA
    ),
    new Effect(
      (attacker: Unit, defender: Unit, terms: CombatTerms): CombatTerms => ({
        ...terms,
        attackerFirepower: terms.attackerFirepower * 2,
        defenderFirepower: 1,
      })
    )
  ),
];

export interface RankDependencies extends Dependencies {
  unitRegistry?: UnitRegistry;
}

/**
 * How well `candidate` would defend its square against `attacker`, as `unit_stack_best_defender` scores it:
 * - its defence as `unit_defense_strength` gives it (the type's defence at 8 steps to 1, times the terrain, river and
 *   the one bonus `defenceMultipliers` chooses, then a veteran's half), not the battle's: the Pikemen's ×1.5, AEGIS's
 *   ×3 or ×5 and the city's defences aren't in it;
 * - times its hit points left over its maximum, truncated;
 * - +1 for a unit with the bonus against mounted units (the Pikemen's tie-break);
 * - for a unit with the bonus against aircraft, ×3 against an aircraft, ×5 against a missile;
 * - ×2 for an interceptor against another interceptor;
 * - a ship in a city: ×2 against an aircraft when the city has no SAM Battery, otherwise halved (truncated);
 * - a land unit on the sea (aboard a ship) can't defend: `-Infinity`.
 *
 * The original gives a tie to the later unit on the square; core-unit keeps the earlier one in a tie, so each score
 *  adds the unit's place on the square over a million, which only ever separates equal whole-number scores.
 */
export const defenderScore =
  (dependencies: RankDependencies = {}) =>
  (attacker: Unit, candidate: Unit): number => {
    const {
        cityImprovementRegistry = cityImprovementRegistryInstance,
        cityRegistry = cityRegistryInstance,
        unitImprovementRegistry = unitImprovementRegistryInstance,
        unitRegistry = unitRegistryInstance,
      } = dependencies,
      row = rowOf(candidate),
      tile = candidate.tile();

    if (row === undefined) {
      return candidate.defence().value();
    }

    if (row[1] === LAND && tile.isWater()) {
      return -Infinity;
    }

    let score = Math.round(
      defenceMultipliers(dependencies)(candidate, attacker).reduce(
        (total: number, [, multiplier]: [string, number]): number =>
          total * multiplier,
        row[5] * STRENGTH_SCALE
      )
    );

    if (
      unitImprovementRegistry
        .getByUnit(candidate)
        .some(
          (improvement: UnitImprovement): boolean =>
            improvement instanceof Veteran
        )
    ) {
      score += score >> 1;
    }

    const [remaining, maximum] = candidate.hitPoints();

    if (maximum > 0) {
      score = Math.trunc((remaining * score) / maximum);
    }

    if (candidate.hasTrait(DefenceBonusVsMounted)) {
      score++;
    }

    const attackerIsAir = domainOf(attacker) === AIR;

    if (candidate.hasTrait(DefenceBonusVsAir) && attackerIsAir) {
      score *= attacker.hasTrait(SingleUse) ? 5 : 3;
    }

    if (
      candidate.hasTrait(Interceptor) &&
      attackerIsAir &&
      attacker.hasTrait(Interceptor)
    ) {
      score *= 2;
    }

    const city = cityRegistry.getByTile(tile);

    if (row[1] === SEA && city !== null) {
      score =
        attackerIsAir &&
        !cityImprovementRegistry
          .getByCity(city)
          .some(
            (improvement: CityImprovement): boolean =>
              improvement instanceof SamMissileBattery
          )
          ? score * 2
          : Math.trunc(score / 2);
    }

    return score + unitRegistry.getByTile(tile).indexOf(candidate) / 1e6;
  };

/** `defenderScore` as the `DefenderRank` rule `civ2-unit:unit/defender-rank`. */
export const defenderRank = (
  dependencies: RankDependencies = {}
): DefenderRank[] => {
  const score = defenderScore(dependencies);

  return [
    new DefenderRank(
      'civ2-unit:unit/defender-rank',
      new Effect(
        (
          attacker: Unit,
          candidate: Unit,
          attack: Attack,
          defence: Defence
        ): number => score(attacker, candidate)
      )
    ),
  ];
};

export interface CombatDependencies extends RankDependencies {
  ruleRegistry?: RuleRegistry;
}

/**
 * Civilization II's battles: fought in rounds at 8 steps to 1 (`unit_resolve_attack_fight`, base-combat-rounds), with
 *  the firepower changes of `combatModifiers` and the defender `defenderRank` chooses.
 */
export const getRules = (
  dependencies: CombatDependencies = {}
): (CombatResolver | CombatModifiers | DefenderRank)[] => [
  ...combatRoundsRules(
    { ruleRegistry: dependencies.ruleRegistry ?? ruleRegistryInstance },
    { id: 'civ2-unit:unit/combat-resolver', strengthScale: STRENGTH_SCALE }
  ),
  ...combatModifiers(),
  ...defenderRank(dependencies),
];

export default getRules;
