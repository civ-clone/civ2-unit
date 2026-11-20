import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import Description from '@civ-clone/core-rule/Description';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
/** How far, by `map_distance`, a city with SDI Defense stops a nuclear attack (`unit_nuclear_attack`). */
export declare const SDI_DEFENCE_RADIUS: number;
/** The detonation rule that says what SDI Defense does (civ-clone/web-renderer#1196). */
export declare const SDI_DEFENCE_DESCRIBED_RULE =
  'civ2-unit:unit/detonated/destroy-units';
/** What SDI Defense does, for the Civilopedia (civ-clone/web-renderer#1196). */
export declare const sdiDefenceDescription: () => Description;
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
export declare const sdiDefenceVetoes: ({
  cityImprovementRegistry,
  cityRegistry,
  engine,
}?: SdiDefenceDependencies) => (unit: Unit, tile: Tile) => boolean;
export default sdiDefenceVetoes;
