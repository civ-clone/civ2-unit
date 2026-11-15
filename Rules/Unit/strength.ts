import { AIR_SUPERIORITY, LAND, UnitRow, units } from '../../data/units';
import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RequirementRegistry,
  instance as requirementRegistryInstance,
} from '@civ-clone/core-requirement/RequirementRegistry';
import {
  TerrainFeatureRegistry,
  instance as terrainFeatureRegistryInstance,
} from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import {
  WonderRegistry,
  instance as wonderRegistryInstance,
} from '@civ-clone/core-wonder/WonderRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Air from '@civ-clone/base-unit-type-air/Air';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import Criterion from '@civ-clone/core-rule/Criterion';
import DefenceBonusVsAir from '@civ-clone/base-unit-trait-defence-bonus-vs-air/DefenceBonusVsAir';
import DefenceBonusVsMounted from '@civ-clone/base-unit-trait-defence-bonus-vs-mounted/DefenceBonusVsMounted';
import Effect from '@civ-clone/core-rule/Effect';
import { Fortress } from '@civ-clone/civ2-world/TileImprovements';
import GreatWall from '@civ-clone/base-wonder-great-wall/GreatWall';
import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import IgnoresFortifications from '@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications';
import Interceptor from '@civ-clone/base-unit-trait-interceptor/Interceptor';
import Land from '@civ-clone/base-unit-type-land/Land';
import { Partisan } from '../../Units';
import { River } from '@civ-clone/civ2-world/TerrainFeatures';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import Paradropped from '@civ-clone/base-unit-action-paradrop/UnitImprovements/Paradropped';
import Strength from '@civ-clone/core-unit/Rules/Strength';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import { cityHasImprovementOrWonder } from '@civ-clone/base-wonder/lib/hasImprovementOrWonder';
import { cachedTerrainLookup } from '@civ-clone/base-terrain-properties/lib/terrainTable';
import { defence as terrainDefence } from '@civ-clone/civ2-world/lib/terrainProperties';
import { defenceStrength } from '@civ-clone/base-unit-yield/lib/defenceMultipliers';
import { unitTypes } from '../../lib/unitTable';

// A terrain's defence in half steps (2 is ×1), looked up by class.
const terrainHalves: (terrain: Terrain) => number | null = cachedTerrainLookup(
  terrainDefence.map(([TerrainType, multiplier]) => [
    TerrainType,
    multiplier * 2,
  ])
);

// Each unit type's `@UNITS` row, by class.
const rows = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

const rowOf = (unit: Unit): UnitRow | undefined => rows.get(unit.constructor);

export interface Dependencies {
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  requirementRegistry?: RequirementRegistry;
  terrainFeatureRegistry?: TerrainFeatureRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
  wonderRegistry?: WonderRegistry;
}

/**
 * Civilization II's defence bonuses for `defender` against `attacker` (`null`: against any), as named multipliers
 *  (`unit_defense_strength`): the terrain's half steps, plus one for a river; then, outside a city, a land unit on a
 *  Fortress ×2 against an attacker that isn't an aircraft and doesn't ignore walls (instead of being fortified, not as
 *  well), or a fortified land unit ×1.5; or in a
 *  city with City Walls (or its owner's Great Wall) ×3 for a land unit against a land attacker that doesn't ignore them (the walls replace being
 *  fortified); and an interceptor in a city against an aircraft that isn't a missile ×4, or ×2 against another
 *  interceptor. Any other unit in a city, and every unit but a land unit outside one, gets no bonus beyond the terrain.
 */
export const defenceMultipliers =
  ({
    cityImprovementRegistry = cityImprovementRegistryInstance,
    cityRegistry = cityRegistryInstance,
    playerResearchRegistry = playerResearchRegistryInstance,
    requirementRegistry = requirementRegistryInstance,
    terrainFeatureRegistry = terrainFeatureRegistryInstance,
    tileImprovementRegistry = tileImprovementRegistryInstance,
    unitImprovementRegistry = unitImprovementRegistryInstance,
    wonderRegistry = wonderRegistryInstance,
  }: Dependencies = {}) =>
  (defender: Unit, attacker: Unit | null): [string, number][] => {
    const tile = defender.tile(),
      terrain = tile.terrain(),
      halves = terrainHalves(terrain) ?? 2,
      river = terrainFeatureRegistry
        .getByTerrain(terrain)
        .some((feature: TerrainFeature): boolean => feature instanceof River),
      multipliers: [string, number][] = [];

    if (halves !== 2) {
      multipliers.push([terrain.constructor.name, halves / 2]);
    }

    if (river) {
      multipliers.push([River.name, (halves + 1) / halves]);
    }

    const city = cityRegistry.getByTile(tile),
      isLand = defender instanceof Land;

    if (city === null) {
      if (!isLand) {
        return multipliers;
      }

      // A Fortress (an Airbase is another improvement here, and a Fortress replaces it): ×2 unless the attacker is an
      //  aircraft or ignores walls, in place of being fortified.
      if (
        tileImprovementRegistry
          .getByTile(tile)
          .some(
            (improvement: TileImprovement): boolean =>
              improvement instanceof Fortress
          ) &&
        (attacker === null ||
          (!(attacker instanceof Air) &&
            !attacker.hasTrait(IgnoresFortifications)))
      ) {
        multipliers.push([Fortress.name, 2]);

        return multipliers;
      }

      if (
        unitImprovementRegistry
          .getByUnit(defender)
          .some(
            (improvement: UnitImprovement): boolean =>
              improvement instanceof Fortified
          )
      ) {
        multipliers.push([Fortified.name, 1.5]);
      }

      return multipliers;
    }

    if (
      defender instanceof Air &&
      attacker !== null &&
      defender.hasTrait(Interceptor) &&
      attacker instanceof Air &&
      !attacker.hasTrait(SingleUse)
    ) {
      multipliers.push([
        Interceptor.name,
        attacker.hasTrait(Interceptor) ? 2 : 4,
      ]);

      return multipliers;
    }

    if (!isLand) {
      return multipliers;
    }

    if (
      (attacker === null ||
        (attacker instanceof Land &&
          !attacker.hasTrait(IgnoresFortifications))) &&
      // City Walls, or the Great Wall in every one of its owner's cities while it stands and isn't obsolete: one test, so
      //  the two never stack (`unit_defense_strength`).
      cityHasImprovementOrWonder(city, CityWalls, GreatWall, {
        cityImprovementRegistry,
        wonderRegistry,
        playerResearchRegistry,
        requirementRegistry,
      })
    ) {
      multipliers.push([CityWalls.name, 3]);

      return multipliers;
    }

    if (
      unitImprovementRegistry
        .getByUnit(defender)
        .some(
          (improvement: UnitImprovement): boolean =>
            improvement instanceof Fortified
        )
    ) {
      multipliers.push([Fortified.name, 1.5]);
    }

    return multipliers;
  };

// A land attacker with two moves and one hit point (10): "mounted", for the Pikemen's bonus (`unit_resolve_attack`).
//  The moves are its moves now, after damage, as `unit_max_moves` gives them, and the hit points its maximum.
const isMounted = (unit: Unit): boolean => {
  const row = rowOf(unit);

  return (
    row !== undefined &&
    row[1] === LAND &&
    unit.movement().value() === 2 &&
    unit.hitPoints()[1] === 10
  );
};

/**
 * Civilization II's battle modifiers (`unit_resolve_attack`), after the defence bonuses: an air-superiority attacker
 *  halves an aircraft's defence when it has no fuel (a Helicopter); a `DefenceBonusVsMounted` defender against a mounted
 *  attacker, and a `DefenceBonusVsAir` one against an aircraft or missile, multiply their defence; Partisans attack a
 *  unit with no attack at eight times their strength.
 */
export const getRules = (dependencies: Dependencies = {}): Strength[] => [
  defenceStrength(defenceMultipliers(dependencies)),

  new Strength(
    'civ2-unit:unit/strength/air-superiority-vs-no-fuel',
    new Criterion((attacker: Unit, defender: Unit): boolean => {
      const attackerRow = rowOf(attacker),
        defenderRow = rowOf(defender);

      return (
        attackerRow !== undefined &&
        defenderRow !== undefined &&
        attackerRow[10] === AIR_SUPERIORITY &&
        defender instanceof Air &&
        defenderRow[3] === 0
      );
    }),
    new Effect(
      (
        attacker: Unit,
        defender: Unit,
        attack: Attack,
        defence: Defence
      ): void => defence.add(-defence.value() / 2, 'AirSuperiority')
    )
  ),

  new Strength(
    'civ2-unit:unit/strength/defence-vs-mounted',
    new Criterion(
      (attacker: Unit, defender: Unit): boolean =>
        defender.hasTrait(DefenceBonusVsMounted) && isMounted(attacker)
    ),
    new Effect(
      (
        attacker: Unit,
        defender: Unit,
        attack: Attack,
        defence: Defence
      ): void => {
        const [bonus] = defender.traits(DefenceBonusVsMounted);

        defence.add(
          defence.value() * (bonus.multiplier - 1),
          DefenceBonusVsMounted.name
        );
      }
    )
  ),

  new Strength(
    'civ2-unit:unit/strength/defence-vs-air',
    new Criterion(
      (attacker: Unit, defender: Unit): boolean =>
        attacker instanceof Air && defender.hasTrait(DefenceBonusVsAir)
    ),
    new Effect(
      (
        attacker: Unit,
        defender: Unit,
        attack: Attack,
        defence: Defence
      ): void => {
        const [bonus] = defender.traits(DefenceBonusVsAir),
          multiplier = attacker.hasTrait(SingleUse)
            ? bonus.vsSingleUse
            : bonus.multiplier;

        defence.add(defence.value() * (multiplier - 1), DefenceBonusVsAir.name);
      }
    )
  ),

  // A unit that paradropped this turn attacks at half as much again, after its veteran's half (`unit_attack_strength`).
  new Strength(
    'civ2-unit:unit/strength/paradropped',
    new Criterion((attacker: Unit): boolean =>
      (dependencies.unitImprovementRegistry ?? unitImprovementRegistryInstance)
        .getByUnit(attacker)
        .some(
          (improvement: UnitImprovement): boolean =>
            improvement instanceof Paradropped
        )
    ),
    new Effect((attacker: Unit, defender: Unit, attack: Attack): void =>
      attack.add(attack.value() / 2, Paradropped.name)
    )
  ),

  new Strength(
    'civ2-unit:unit/strength/partisans-vs-non-combatant',
    new Criterion(
      (attacker: Unit, defender: Unit): boolean =>
        attacker instanceof Partisan && rowOf(defender)?.[4] === 0
    ),
    new Effect((attacker: Unit, defender: Unit, attack: Attack): void =>
      attack.add(attack.value() * 7, Partisan.name)
    )
  ),
];

export default getRules;
