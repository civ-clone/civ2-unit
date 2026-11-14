import {
  AlpineTrooper,
  Archer,
  Artillery,
  Battleship,
  Bomber,
  Cannon,
  Caravan,
  Carrier,
  Catapult,
  Cavalry,
  Chariot,
  CruiseMissile,
  Cruiser,
  Crusader,
  Destroyer,
  Diplomat,
  Dragoon,
  Elephant,
  Engineer,
  Explorer,
  Fanatic,
  Fighter,
  Freight,
  Frigate,
  Galleon,
  Helicopter,
  Horseman,
  Howitzer,
  Ironclad,
  Knight,
  Marine,
  MechanizedInfantry,
  MissileCruiser,
  Musketman,
  Nuclear,
  Paratrooper,
  Partisan,
  Pikeman,
  Rifleman,
  Sail,
  Settlers,
  Spearman,
  Spy,
  StealthBomber,
  StealthFighter,
  Submarine,
  Swordman,
  Tank,
  Transport,
  Trireme,
  Warrior,
} from '../Units';
import Advance from '@civ-clone/core-science/Advance';
import AdvancedFlight from '@civ-clone/base-science-advance-advancedflight/AdvancedFlight';
import AmphibiousWarfare from '@civ-clone/base-science-advance-amphibiouswarfare/AmphibiousWarfare';
import Automobile from '@civ-clone/base-science-advance-automobile/Automobile';
import BronzeWorking from '@civ-clone/base-science-advance-bronzeworking/BronzeWorking';
import Chivalry from '@civ-clone/base-science-advance-chivalry/Chivalry';
import CombinedArms from '@civ-clone/base-science-advance-combinedarms/CombinedArms';
import Combustion from '@civ-clone/base-science-advance-combustion/Combustion';
import Conscription from '@civ-clone/base-science-advance-conscription/Conscription';
import Corporation from '@civ-clone/base-science-advance-corporation/Corporation';
import Electricity from '@civ-clone/base-science-advance-electricity/Electricity';
import Espionage from '@civ-clone/base-science-advance-espionage/Espionage';
import Explosives from '@civ-clone/base-science-advance-explosives/Explosives';
import Feudalism from '@civ-clone/base-science-advance-feudalism/Feudalism';
import Flight from '@civ-clone/base-science-advance-flight/Flight';
import Fundamentalism from '@civ-clone/base-science-advance-fundamentalism/Fundamentalism';
import GuerrillaWarfare from '@civ-clone/base-science-advance-guerrillawarfare/GuerrillaWarfare';
import Gunpowder from '@civ-clone/base-science-advance-gunpowder/Gunpowder';
import HorsebackRiding from '@civ-clone/base-science-advance-horsebackriding/HorsebackRiding';
import Industrialization from '@civ-clone/base-science-advance-industrialization/Industrialization';
import IronWorking from '@civ-clone/base-science-advance-ironworking/IronWorking';
import LaborUnion from '@civ-clone/base-science-advance-laborunion/LaborUnion';
import Leadership from '@civ-clone/base-science-advance-leadership/Leadership';
import MachineTools from '@civ-clone/base-science-advance-machinetools/MachineTools';
import Magnetism from '@civ-clone/base-science-advance-magnetism/Magnetism';
import MapMaking from '@civ-clone/base-science-advance-mapmaking/MapMaking';
import Mathematics from '@civ-clone/base-science-advance-mathematics/Mathematics';
import Metallurgy from '@civ-clone/base-science-advance-metallurgy/Metallurgy';
import MobileWarfare from '@civ-clone/base-science-advance-mobilewarfare/MobileWarfare';
import Monotheism from '@civ-clone/base-science-advance-monotheism/Monotheism';
import Navigation from '@civ-clone/base-science-advance-navigation/Navigation';
import NuclearFission from '@civ-clone/base-science-advance-nuclearfission/NuclearFission';
import Polytheism from '@civ-clone/base-science-advance-polytheism/Polytheism';
import Robotics from '@civ-clone/base-science-advance-robotics/Robotics';
import Rocketry from '@civ-clone/base-science-advance-rocketry/Rocketry';
import Seafaring from '@civ-clone/base-science-advance-seafaring/Seafaring';
import Stealth from '@civ-clone/base-science-advance-stealth/Stealth';
import SteamEngine from '@civ-clone/base-science-advance-steamengine/SteamEngine';
import Steel from '@civ-clone/base-science-advance-steel/Steel';
import Tactics from '@civ-clone/base-science-advance-tactics/Tactics';
import TheWheel from '@civ-clone/base-science-advance-thewheel/TheWheel';
import Trade from '@civ-clone/base-science-advance-trade/Trade';
import WarriorCode from '@civ-clone/base-science-advance-warriorcode/WarriorCode';
import Writing from '@civ-clone/base-science-advance-writing/Writing';
import Unit from '@civ-clone/core-unit/Unit';

/** The unit types, by `@UNITS` row: `data/units`' rows, in the same order. Generic names where Civ2's differ. */
export const unitTypes: (typeof Unit)[] = [
  Settlers,
  Engineer,
  Warrior,
  Spearman,
  Archer,
  Swordman,
  Pikeman,
  Musketman,
  Fanatic,
  Partisan,
  AlpineTrooper,
  Rifleman,
  Marine,
  Paratrooper,
  MechanizedInfantry,
  Horseman,
  Chariot,
  Elephant,
  Crusader,
  Knight,
  Dragoon,
  Cavalry,
  Tank,
  Catapult,
  Cannon,
  Artillery,
  Howitzer,
  Fighter,
  Bomber,
  Helicopter,
  StealthFighter,
  StealthBomber,
  Trireme,
  Sail,
  Galleon,
  Frigate,
  Ironclad,
  Destroyer,
  Cruiser,
  MissileCruiser,
  Battleship,
  Submarine,
  Carrier,
  Transport,
  CruiseMissile,
  Nuclear,
  Diplomat,
  Spy,
  Caravan,
  Freight,
  Explorer,
];

/**
 * The advances `@UNITS` names, by `@CIVILIZE` index. Only those: civ2-science keeps the whole table, and this package
 *  doesn't depend on it.
 */
export const advanceTypes: Record<number, typeof Advance> = {
  0: AdvancedFlight,
  2: AmphibiousWarfare,
  5: Automobile,
  8: BronzeWorking,
  11: Chivalry,
  13: CombinedArms,
  14: Combustion,
  17: Conscription,
  19: Corporation,
  23: Electricity,
  27: Espionage,
  28: Explosives,
  29: Feudalism,
  30: Flight,
  31: Fundamentalism,
  34: GuerrillaWarfare,
  35: Gunpowder,
  36: HorsebackRiding,
  37: Industrialization,
  39: IronWorking,
  40: LaborUnion,
  42: Leadership,
  44: MachineTools,
  45: Magnetism,
  46: MapMaking,
  49: Mathematics,
  51: Metallurgy,
  53: MobileWarfare,
  55: Monotheism,
  57: Navigation,
  58: NuclearFission,
  64: Polytheism,
  72: Robotics,
  73: Rocketry,
  75: Seafaring,
  77: Stealth,
  78: SteamEngine,
  79: Steel,
  81: Tactics,
  84: Trade,
  86: WarriorCode,
  87: TheWheel,
  88: Writing,
};

/** The unit type in `@UNITS` row `index`. */
export const unitType = (index: number): typeof Unit => unitTypes[index];

/** The advance at `@CIVILIZE` index `index`, or `null` for none. */
export const advanceType = (index: number): typeof Advance | null => {
  if (index < 0) {
    return null;
  }

  const AdvanceType = advanceTypes[index];

  if (AdvanceType === undefined) {
    throw new TypeError(`No advance class for @CIVILIZE index ${index}.`);
  }

  return AdvanceType;
};
