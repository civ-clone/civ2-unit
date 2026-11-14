import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { instance as availableUnitImprovementRegistryInstance } from '@civ-clone/core-unit-improvement/AvailableUnitImprovementRegistry';

availableUnitImprovementRegistryInstance.register(Fortified, Veteran);
