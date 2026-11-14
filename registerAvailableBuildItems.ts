import { instance as availableCityBuildItemsRegistryInstance } from '@civ-clone/core-city-build/AvailableCityBuildItemsRegistry';
import { unitTypes } from './lib/unitTable';

availableCityBuildItemsRegistryInstance.register(...unitTypes);
