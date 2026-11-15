import CombatModifiers from '@civ-clone/base-combat-rounds/lib/CombatModifiers';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { Dependencies } from './strength';
import CombatResolver from '@civ-clone/core-unit/Rules/CombatResolver';
import DefenderRank from '@civ-clone/core-unit/Rules/DefenderRank';
import Unit from '@civ-clone/core-unit/Unit';
/** Civilization II's strengths are whole numbers at 8 steps to 1 (`unit_attack_strength`, `unit_defense_strength`). */
export declare const STRENGTH_SCALE = 8;
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
export declare const combatModifiers: () => CombatModifiers[];
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
export declare const defenderScore: (
  dependencies?: RankDependencies
) => (attacker: Unit, candidate: Unit) => number;
/** `defenderScore` as the `DefenderRank` rule `civ2-unit:unit/defender-rank`. */
export declare const defenderRank: (
  dependencies?: RankDependencies
) => DefenderRank[];
export interface CombatDependencies extends RankDependencies {
  ruleRegistry?: RuleRegistry;
}
/**
 * Civilization II's battles: fought in rounds at 8 steps to 1 (`unit_resolve_attack_fight`, base-combat-rounds), with
 *  the firepower changes of `combatModifiers` and the defender `defenderRank` chooses.
 */
export declare const getRules: (
  dependencies?: CombatDependencies
) => (CombatResolver | CombatModifiers | DefenderRank)[];
export default getRules;
