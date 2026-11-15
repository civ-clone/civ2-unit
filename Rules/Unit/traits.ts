import {
  AIR,
  AMPHIBIOUS,
  ATTACKS_AIR,
  CARRIES_AIR,
  COAST_BOUND,
  DEFENCE_BONUS_VS_AIR,
  DEFENCE_BONUS_VS_MOUNTED,
  DESTROYED_AFTER_ATTACKING,
  DETECTS_SUBMARINES,
  DIPLOMACY,
  FUNDAMENTALISM_FREE_SUPPORT,
  IGNORES_CITY_WALLS,
  IGNORES_ZONES_OF_CONTROL,
  LAND,
  NUCLEAR_ATTACK,
  PARADROPS,
  SEA,
  SETTLE,
  SUBMARINE,
  TRADE,
  TREATS_ALL_AS_ROAD,
  UnitRow,
  units,
} from '../../data/units';
import UnitTraits, { unitTraits } from '@civ-clone/core-unit/Rules/UnitTraits';
import Air from '@civ-clone/base-unit-type-air/Air';
import Amphibious from '@civ-clone/base-unit-trait-amphibious/Amphibious';
import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import CoastBound from '@civ-clone/base-unit-trait-coast-bound/CoastBound';
import Covert from '@civ-clone/base-unit-trait-covert/Covert';
import DefenceBonusVsAir from '@civ-clone/base-unit-trait-defence-bonus-vs-air/DefenceBonusVsAir';
import DefenceBonusVsMounted from '@civ-clone/base-unit-trait-defence-bonus-vs-mounted/DefenceBonusVsMounted';
import DetectsSubmerged from '@civ-clone/base-unit-trait-detects-submerged/DetectsSubmerged';
import Detonates from '@civ-clone/base-unit-trait-detonates/Detonates';
import DiplomaticMissions from '@civ-clone/base-unit-trait-diplomatic-missions/DiplomaticMissions';
import Fortifies from '@civ-clone/base-unit-trait-fortifies/Fortifies';
import FoundsCities from '@civ-clone/base-unit-trait-founds-cities/FoundsCities';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import IgnoresFortifications from '@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications';
import IgnoresZoneOfControl from '@civ-clone/base-unit-trait-ignores-zone-of-control/IgnoresZoneOfControl';
import Interceptor from '@civ-clone/base-unit-trait-interceptor/Interceptor';
import Land from '@civ-clone/base-unit-type-land/Land';
import NonCombatant from '@civ-clone/base-unit-trait-non-combatant/NonCombatant';
import AttackEndsTurn from '@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn';
import Paradrop from '@civ-clone/base-unit-trait-paradrop/Paradrop';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import { Spy } from '../../Units';
import Submerged from '@civ-clone/base-unit-trait-submerged/Submerged';
import SupportExemptUnder from '@civ-clone/base-unit-trait-support-exempt-under/SupportExemptUnder';
import TerrainAsRoad from '@civ-clone/base-unit-trait-terrain-as-road/TerrainAsRoad';
import Terraforms from '@civ-clone/base-unit-trait-terraforms/Terraforms';
import TradeMissions from '@civ-clone/base-unit-trait-trade-missions/TradeMissions';
import Unit from '@civ-clone/core-unit/Unit';
import { unitTypes } from '../../lib/unitTable';

/** The prefix of every trait declaration's id: `civ2-unit:unit/trait/<Unit>/<Trait>`. */
export const TRAIT_RULE_PREFIX = 'civ2-unit:unit/trait';

type Trait = Parameters<typeof unitTraits>[2];

/**
 * What a `@UNITS` row gives its unit type beyond its domain, in a fixed order: the flags (column 13), the role (column
 *  11: 5 settles, 6 diplomacy, 7 trade), and the numbers that mean an ability (an attack of 99 detonates; a ship with a
 *  hold carries land units). OpenCiv2 asks the same columns (`civ_can_build_unit`, `unit_resolve_attack`,
 *  `unit_move_dir_step_cost`, `unit_defense_strength`).
 */
export const traitsOf = (row: UnitRow): Trait[] => {
  const [, domain, , range, attack, , , , , hold, role, , flags] = row,
    has = (flag: number): boolean => (flags & flag) !== 0;

  return [
    // Every land unit but Settlers and Engineers, whose fortify key builds a fortress instead. Diplomats, Caravans and
    //  Explorers fortify too, as civ1-unit's do: not checked against OpenCiv2.
    ...(domain === LAND && role !== SETTLE ? [Fortifies] : []),
    ...(role === SETTLE ? [FoundsCities, Terraforms] : []),
    // A land unit with no attack, other than a settler, fights no one, takes no city and pillages nothing:
    //  Diplomats, Spies, Caravans, Freight and Explorers (civ1-unit's `NonCombatant`, read from the attack column; the
    //  Explorer's part is not checked against OpenCiv2).
    ...(domain === LAND && attack === 0 && role !== SETTLE
      ? [NonCombatant]
      : []),
    ...(role === DIPLOMACY ? [DiplomaticMissions] : []),
    ...(role === TRADE ? [TradeMissions] : []),
    ...(has(IGNORES_ZONES_OF_CONTROL) ? [IgnoresZoneOfControl] : []),
    ...(has(AMPHIBIOUS) ? [Amphibious] : []),
    ...(has(SUBMARINE) ? [Submerged] : []),
    ...(has(ATTACKS_AIR) ? [Interceptor] : []),
    ...(has(COAST_BOUND) ? [CoastBound] : []),
    ...(has(IGNORES_CITY_WALLS) ? [IgnoresFortifications] : []),
    ...(has(PARADROPS) ? [Paradrop] : []),
    ...(has(TREATS_ALL_AS_ROAD) ? [TerrainAsRoad] : []),
    // Flag 10's defence bonus is ×1.5 in the code (`unit_resolve_attack`).
    ...(has(DEFENCE_BONUS_VS_MOUNTED) ? [new DefenceBonusVsMounted(1.5)] : []),
    ...(has(FUNDAMENTALISM_FREE_SUPPORT)
      ? [new SupportExemptUnder(Fundamentalism)]
      : []),
    ...(has(DESTROYED_AFTER_ATTACKING) ? [SingleUse] : []),
    // Flag 13's is ×3 against aircraft and ×5 against missiles (`unit_resolve_attack`).
    ...(has(DEFENCE_BONUS_VS_AIR) ? [new DefenceBonusVsAir(3, 5)] : []),
    ...(has(DETECTS_SUBMARINES) ? [DetectsSubmerged] : []),
    ...(attack >= NUCLEAR_ATTACK ? [Detonates] : []),
    // An aircraft with a range other than 1 (Bombers, Helicopters) has its moves used up by a win
    //  (`unit_resolve_attack_after_win`); fighters, at 1, keep theirs, and a missile is gone.
    ...(domain === AIR && range !== 1 ? [AttackEndsTurn] : []),
    ...(has(CARRIES_AIR) ? [new Carries(Air)] : []),
    // A submarine carries missiles (`unit_gather_cargo`; `@UNITS` gives it no hold).
    ...(domain === SEA && has(SUBMARINE) ? [new Carries(SingleUse)] : []),
    ...(domain === SEA && hold > 0 && !has(CARRIES_AIR)
      ? [new Carries(Land)]
      : []),
  ];
};

/**
 * What each Civilization II unit type can do beyond what its domain (`Land`, `Naval`, `Air`) gives it, from its
 *  `@UNITS` row, declared on the leaf class. The Spy's extra missions are its identity, not a column: it is `Covert`.
 */
export const getRules = (): UnitTraits[] => [
  ...units.flatMap((row: UnitRow, index: number): UnitTraits[] => {
    const traits = traitsOf(row);

    return traits.length === 0
      ? []
      : unitTraits(TRAIT_RULE_PREFIX, unitTypes[index], ...traits);
  }),
  ...unitTraits(TRAIT_RULE_PREFIX, Spy as typeof Unit, Covert),
];

export default getRules;
