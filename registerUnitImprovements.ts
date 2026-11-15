import Aloft from '@civ-clone/base-unit-fuel/lib/Aloft';
import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import MovedThisTurn from '@civ-clone/base-unit-healing/lib/MovedThisTurn';
import Paradropped from '@civ-clone/base-unit-action-paradrop/UnitImprovements/Paradropped';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { instance as availableUnitImprovementRegistryInstance } from '@civ-clone/core-unit-improvement/AvailableUnitImprovementRegistry';

// `Aloft` (turns out of fuel), `MovedThisTurn` (no healing) and `Paradropped` are marks a save must be able to name.
availableUnitImprovementRegistryInstance.register(
  Fortified,
  Veteran,
  Aloft,
  MovedThisTurn,
  Paradropped
);
