import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import MovedThisTurn from '@civ-clone/base-unit-healing/lib/MovedThisTurn';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';

/**
 * A unit moving onto an ally's city (OpenCiv2 `unit_move_dir`, `src/auto/unit_move.cpp:803-830`): it doesn't go in,
 *  but is repaired `steps` tenths of its maximum hit points (2 when the city has Barracks, else 1), never more than its
 *  damage, and its turn ends. The original also clears the unit's "moved" flag, so it counts as having rested when its
 *  player's units next heal (base-unit-healing's `MovedThisTurn` is taken off). No `Moved` rule is processed: the unit
 *  stays where it was.
 */
export class AlliedRepair extends Action {
  private _city: City;
  private _steps: number;
  private _unitImprovementRegistry: UnitImprovementRegistry;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    city: City,
    steps: number = 1,
    unitImprovementRegistry: UnitImprovementRegistry = unitImprovementRegistryInstance,
    ruleRegistry: RuleRegistry = ruleRegistryInstance
  ) {
    super(from, to, unit, ruleRegistry);

    this._city = city;
    this._steps = steps;
    this._unitImprovementRegistry = unitImprovementRegistry;

    this.addKey('city');
  }

  // `Action.forUnit` rebuilds an action from `(from, to, unit, ruleRegistry)`, which would put the `RuleRegistry` where
  //  the city goes.
  forUnit(unit: Unit): AlliedRepair {
    return new AlliedRepair(
      this.from(),
      this.to(),
      unit,
      this._city,
      this._steps,
      this._unitImprovementRegistry,
      this.ruleRegistry()
    );
  }

  city(): City {
    return this._city;
  }

  /** The hit points the repair restores: `steps` tenths of the maximum, truncated, at most the damage. */
  amount(): number {
    const unit = this.unit(),
      [, maximum] = unit.hitPoints();

    return Math.max(
      0,
      Math.min(Math.floor(maximum / 10) * this._steps, unit.damage())
    );
  }

  perform(): void {
    const unit = this.unit(),
      amount = this.amount();

    if (amount > 0) {
      unit.setDamage(unit.damage() - amount);
    }

    unit.moves().set(0);

    const marks = this._unitImprovementRegistry
      .getByUnit(unit)
      .filter(
        (improvement: UnitImprovement): boolean =>
          improvement instanceof MovedThisTurn
      );

    if (marks.length > 0) {
      this._unitImprovementRegistry.unregister(...marks);
    }
  }
}

export default AlliedRepair;
