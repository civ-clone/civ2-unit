import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import IndustrialSabotage from '@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage';
import Player from '@civ-clone/core-player/Player';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
/** Industrial sabotage across a treaty: a person is warned first. */
export declare class SneakIndustrialSabotage extends IndustrialSabotage {
  private _enemy;
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    city: City,
    enemy: Player,
    ruleRegistry?: RuleRegistry
  );
  enemy(): Player;
  forUnit(unit: Unit): Action;
}
/** Poisoning a city's water across a treaty: a person is warned first. */
export declare class SneakPoisonWater extends PoisonWater {
  private _enemy;
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    city: City,
    enemy: Player,
    ruleRegistry?: RuleRegistry
  );
  enemy(): Player;
  forUnit(unit: Unit): Action;
}
