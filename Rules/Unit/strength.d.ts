import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
import { TerrainFeatureRegistry } from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Strength from '@civ-clone/core-unit/Rules/Strength';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Unit from '@civ-clone/core-unit/Unit';
/** Each terrain's defence multiplier where it isn't ×1, for its Civilopedia entry, from the table the rule reads. */
export declare const terrainDefenceDescriptions: () => {
  type: string;
  subject: typeof Terrain;
  value: number;
}[];
/** City Walls' multiplier (and the Great Wall's, as City Walls), read by the rule and by what it says it does. */
export declare const cityWallsMultiplier: number;
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
export declare const defenceMultipliers: ({
  cityImprovementRegistry,
  cityRegistry,
  playerResearchRegistry,
  requirementRegistry,
  terrainFeatureRegistry,
  tileImprovementRegistry,
  unitImprovementRegistry,
  wonderRegistry,
}?: Dependencies) => (
  defender: Unit,
  attacker: Unit | null
) => [string, number][];
/**
 * Civilization II's battle modifiers (`unit_resolve_attack`), after the defence bonuses: an air-superiority attacker
 *  halves an aircraft's defence when it has no fuel (a Helicopter); a `DefenceBonusVsMounted` defender against a mounted
 *  attacker, and a `DefenceBonusVsAir` one against an aircraft or missile, multiply their defence; Partisans attack a
 *  unit with no attack at eight times their strength.
 */
export declare const getRules: (dependencies?: Dependencies) => Strength[];
export default getRules;
