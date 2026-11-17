import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Action from '@civ-clone/core-unit/Action';
import City from '@civ-clone/core-city/City';
import IndustrialSabotage from '@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage';
import Player from '@civ-clone/core-player/Player';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// A person's sabotage or poisoning in the city of a civilization it has a ceasefire, a peace or an alliance with. The
//  original warns first (`spy_confirm_treaty_breach`, `unit_spy.cpp:130-146`) and, once confirmed, carries out the
//  mission as ever: the treaty is broken only by the incident that follows if the agent is lost (civ2-diplomacy's
//  `AgentLost` rule). `enemy()` names the partner, as base-unit-action-steal-technology's `SneakStealTechnology` does,
//  so a client knows to warn; civ2-unit's `forcedWar` leaves these missions' treaties alone.

/** Industrial sabotage across a treaty: a person is warned first. */
export class SneakIndustrialSabotage extends IndustrialSabotage {
  private _enemy: Player;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    city: City,
    enemy: Player,
    ruleRegistry: RuleRegistry = ruleRegistryInstance
  ) {
    super(from, to, unit, city, ruleRegistry);

    this._enemy = enemy;

    this.addKey('enemy');
  }

  enemy(): Player {
    return this._enemy;
  }

  // Typed as `Action`: a subclass with a member of its own isn't assignable to it (civ-clone/web-renderer#21).
  forUnit(unit: Unit): Action {
    return new SneakIndustrialSabotage(
      this.from(),
      this.to(),
      unit,
      this._city,
      this._enemy,
      this.ruleRegistry()
    ) as unknown as Action;
  }
}

/** Poisoning a city's water across a treaty: a person is warned first. */
export class SneakPoisonWater extends PoisonWater {
  private _enemy: Player;

  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    city: City,
    enemy: Player,
    ruleRegistry: RuleRegistry = ruleRegistryInstance
  ) {
    super(from, to, unit, city, ruleRegistry);

    this._enemy = enemy;

    this.addKey('enemy');
  }

  enemy(): Player {
    return this._enemy;
  }

  // Typed as `Action`: a subclass with a member of its own isn't assignable to it (civ-clone/web-renderer#21).
  forUnit(unit: Unit): Action {
    return new SneakPoisonWater(
      this.from(),
      this.to(),
      unit,
      this._city,
      this._enemy,
      this.ruleRegistry()
    ) as unknown as Action;
  }
}
