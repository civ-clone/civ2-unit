import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import City from '@civ-clone/core-city/City';
import Description from '@civ-clone/core-rule/Description';
import Detonates from '@civ-clone/base-unit-trait-detonates/Detonates';
import SdiDefence from '@civ-clone/base-city-improvement-sdidefence/SdiDefence';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { cityHasImprovement } from '@civ-clone/base-wonder/lib/hasImprovementOrWonder';
import distance from './distance';
import { protectedByCityWithin } from '@civ-clone/base-unit-lifecycle/lib/detonatedRules';

/** How far, by `map_distance`, a city with SDI Defense stops a nuclear attack (`unit_nuclear_attack`). */
export const SDI_DEFENCE_RADIUS: number = 3;

/** The detonation rule that says what SDI Defense does (civ-clone/web-renderer#1196). */
export const SDI_DEFENCE_DESCRIBED_RULE =
  'civ2-unit:unit/detonated/destroy-units';

/** What SDI Defense does, for the Civilopedia (civ-clone/web-renderer#1196). */
export const sdiDefenceDescription = (): Description =>
  new Description({
    type: 'protects_from',
    subject: SdiDefence,
    event: 'nuclear_attack',
    what: 'area',
    radius: SDI_DEFENCE_RADIUS,
  });

export interface SdiDefenceDependencies {
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  engine?: Engine;
}

/**
 * The detonation `vetoes`: another player's city with SDI Defense within `SDI_DEFENCE_RADIUS` of the target, by
 *  `map_distance`, stops a nuclear attack and the missile is lost (`unit_nuclear_attack`). The client hears
 *  `unit:nuclear-stopped` as well as the detonation it is told of either way. Only a missile: a Spy's planted device
 *  isn't stopped (`unit_nuclear_attack(civ, x, y, 0)`, `unit_spy.cpp:687`).
 */
export const sdiDefenceVetoes = ({
  cityImprovementRegistry = cityImprovementRegistryInstance,
  cityRegistry = cityRegistryInstance,
  engine = engineInstance,
}: SdiDefenceDependencies = {}): ((unit: Unit, tile: Tile) => boolean) => {
  const protectedBy = protectedByCityWithin(
    cityRegistry,
    SDI_DEFENCE_RADIUS,
    (city: City, unit: Unit): boolean =>
      city.player() !== unit.player() &&
      cityHasImprovement(city, SdiDefence, cityImprovementRegistry),
    distance
  );

  return (unit: Unit, tile: Tile): boolean => {
    const stopped = unit.hasTrait(Detonates) && protectedBy(unit, tile);

    if (stopped) {
      engine.emit('unit:nuclear-stopped', unit, tile);
    }

    return stopped;
  };
};

export default sdiDefenceVetoes;
