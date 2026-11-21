import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
/** The tenths of its hit points a unit moving onto an ally's city with Barracks is repaired. */
export declare const BARRACKS_REPAIR_STEPS = 2;
/** The tenths of its hit points a unit moving onto an ally's city without Barracks is repaired. */
export declare const REPAIR_STEPS = 1;
/**
 * A unit moving onto an ally's city (OpenCiv2 `unit_move_dir`, `src/auto/unit_move.cpp:803-830`): it doesn't go in,
 *  but is repaired `steps` tenths of its maximum hit points (`BARRACKS_REPAIR_STEPS` when the city has Barracks, else
 *  `REPAIR_STEPS`), never more than its damage, and its turn ends. The original also clears the unit's "moved" flag,
 *  so it counts as having rested when its player's units next heal (base-unit-healing's `MovedThisTurn` is taken off). No `Moved` rule is processed: the unit
 *  stays where it was.
 */
export declare class AlliedRepair extends Action {
  private _city;
  private _steps;
  private _unitImprovementRegistry;
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    city: City,
    steps?: number,
    unitImprovementRegistry?: UnitImprovementRegistry,
    ruleRegistry?: RuleRegistry
  );
  forUnit(unit: Unit): AlliedRepair;
  city(): City;
  /** The hit points the repair restores: `steps` tenths of the maximum, truncated, at most the damage. */
  amount(): number;
  perform(): void;
}
export default AlliedRepair;
