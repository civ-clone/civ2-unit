"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceType = exports.unitType = exports.advanceTypes = exports.unitTypes = void 0;
const Units_1 = require("../Units");
const AdvancedFlight_1 = require("@civ-clone/base-science-advance-advancedflight/AdvancedFlight");
const AmphibiousWarfare_1 = require("@civ-clone/base-science-advance-amphibiouswarfare/AmphibiousWarfare");
const Automobile_1 = require("@civ-clone/base-science-advance-automobile/Automobile");
const BronzeWorking_1 = require("@civ-clone/base-science-advance-bronzeworking/BronzeWorking");
const Chivalry_1 = require("@civ-clone/base-science-advance-chivalry/Chivalry");
const CombinedArms_1 = require("@civ-clone/base-science-advance-combinedarms/CombinedArms");
const Combustion_1 = require("@civ-clone/base-science-advance-combustion/Combustion");
const Conscription_1 = require("@civ-clone/base-science-advance-conscription/Conscription");
const Corporation_1 = require("@civ-clone/base-science-advance-corporation/Corporation");
const Electricity_1 = require("@civ-clone/base-science-advance-electricity/Electricity");
const Espionage_1 = require("@civ-clone/base-science-advance-espionage/Espionage");
const Explosives_1 = require("@civ-clone/base-science-advance-explosives/Explosives");
const Feudalism_1 = require("@civ-clone/base-science-advance-feudalism/Feudalism");
const Flight_1 = require("@civ-clone/base-science-advance-flight/Flight");
const Fundamentalism_1 = require("@civ-clone/base-science-advance-fundamentalism/Fundamentalism");
const GuerrillaWarfare_1 = require("@civ-clone/base-science-advance-guerrillawarfare/GuerrillaWarfare");
const Gunpowder_1 = require("@civ-clone/base-science-advance-gunpowder/Gunpowder");
const HorsebackRiding_1 = require("@civ-clone/base-science-advance-horsebackriding/HorsebackRiding");
const Industrialization_1 = require("@civ-clone/base-science-advance-industrialization/Industrialization");
const IronWorking_1 = require("@civ-clone/base-science-advance-ironworking/IronWorking");
const LaborUnion_1 = require("@civ-clone/base-science-advance-laborunion/LaborUnion");
const Leadership_1 = require("@civ-clone/base-science-advance-leadership/Leadership");
const MachineTools_1 = require("@civ-clone/base-science-advance-machinetools/MachineTools");
const Magnetism_1 = require("@civ-clone/base-science-advance-magnetism/Magnetism");
const MapMaking_1 = require("@civ-clone/base-science-advance-mapmaking/MapMaking");
const Mathematics_1 = require("@civ-clone/base-science-advance-mathematics/Mathematics");
const Metallurgy_1 = require("@civ-clone/base-science-advance-metallurgy/Metallurgy");
const MobileWarfare_1 = require("@civ-clone/base-science-advance-mobilewarfare/MobileWarfare");
const Monotheism_1 = require("@civ-clone/base-science-advance-monotheism/Monotheism");
const Navigation_1 = require("@civ-clone/base-science-advance-navigation/Navigation");
const NuclearFission_1 = require("@civ-clone/base-science-advance-nuclearfission/NuclearFission");
const Polytheism_1 = require("@civ-clone/base-science-advance-polytheism/Polytheism");
const Robotics_1 = require("@civ-clone/base-science-advance-robotics/Robotics");
const Rocketry_1 = require("@civ-clone/base-science-advance-rocketry/Rocketry");
const Seafaring_1 = require("@civ-clone/base-science-advance-seafaring/Seafaring");
const Stealth_1 = require("@civ-clone/base-science-advance-stealth/Stealth");
const SteamEngine_1 = require("@civ-clone/base-science-advance-steamengine/SteamEngine");
const Steel_1 = require("@civ-clone/base-science-advance-steel/Steel");
const Tactics_1 = require("@civ-clone/base-science-advance-tactics/Tactics");
const TheWheel_1 = require("@civ-clone/base-science-advance-thewheel/TheWheel");
const Trade_1 = require("@civ-clone/base-science-advance-trade/Trade");
const WarriorCode_1 = require("@civ-clone/base-science-advance-warriorcode/WarriorCode");
const Writing_1 = require("@civ-clone/base-science-advance-writing/Writing");
/** The unit types, by `@UNITS` row: `data/units`' rows, in the same order. Generic names where Civ2's differ. */
exports.unitTypes = [
    Units_1.Settlers,
    Units_1.Engineer,
    Units_1.Warrior,
    Units_1.Spearman,
    Units_1.Archer,
    Units_1.Swordman,
    Units_1.Pikeman,
    Units_1.Musketman,
    Units_1.Fanatic,
    Units_1.Partisan,
    Units_1.AlpineTrooper,
    Units_1.Rifleman,
    Units_1.Marine,
    Units_1.Paratrooper,
    Units_1.MechanizedInfantry,
    Units_1.Horseman,
    Units_1.Chariot,
    Units_1.Elephant,
    Units_1.Crusader,
    Units_1.Knight,
    Units_1.Dragoon,
    Units_1.Cavalry,
    Units_1.Tank,
    Units_1.Catapult,
    Units_1.Cannon,
    Units_1.Artillery,
    Units_1.Howitzer,
    Units_1.Fighter,
    Units_1.Bomber,
    Units_1.Helicopter,
    Units_1.StealthFighter,
    Units_1.StealthBomber,
    Units_1.Trireme,
    Units_1.Sail,
    Units_1.Galleon,
    Units_1.Frigate,
    Units_1.Ironclad,
    Units_1.Destroyer,
    Units_1.Cruiser,
    Units_1.MissileCruiser,
    Units_1.Battleship,
    Units_1.Submarine,
    Units_1.Carrier,
    Units_1.Transport,
    Units_1.CruiseMissile,
    Units_1.Nuclear,
    Units_1.Diplomat,
    Units_1.Spy,
    Units_1.Caravan,
    Units_1.Freight,
    Units_1.Explorer,
];
/**
 * The advances `@UNITS` names, by `@CIVILIZE` index. Only those: civ2-science keeps the whole table, and this package
 *  doesn't depend on it.
 */
exports.advanceTypes = {
    0: AdvancedFlight_1.default,
    2: AmphibiousWarfare_1.default,
    5: Automobile_1.default,
    8: BronzeWorking_1.default,
    11: Chivalry_1.default,
    13: CombinedArms_1.default,
    14: Combustion_1.default,
    17: Conscription_1.default,
    19: Corporation_1.default,
    23: Electricity_1.default,
    27: Espionage_1.default,
    28: Explosives_1.default,
    29: Feudalism_1.default,
    30: Flight_1.default,
    31: Fundamentalism_1.default,
    34: GuerrillaWarfare_1.default,
    35: Gunpowder_1.default,
    36: HorsebackRiding_1.default,
    37: Industrialization_1.default,
    39: IronWorking_1.default,
    40: LaborUnion_1.default,
    42: Leadership_1.default,
    44: MachineTools_1.default,
    45: Magnetism_1.default,
    46: MapMaking_1.default,
    49: Mathematics_1.default,
    51: Metallurgy_1.default,
    53: MobileWarfare_1.default,
    55: Monotheism_1.default,
    57: Navigation_1.default,
    58: NuclearFission_1.default,
    64: Polytheism_1.default,
    72: Robotics_1.default,
    73: Rocketry_1.default,
    75: Seafaring_1.default,
    77: Stealth_1.default,
    78: SteamEngine_1.default,
    79: Steel_1.default,
    81: Tactics_1.default,
    84: Trade_1.default,
    86: WarriorCode_1.default,
    87: TheWheel_1.default,
    88: Writing_1.default,
};
/** The unit type in `@UNITS` row `index`. */
const unitType = (index) => exports.unitTypes[index];
exports.unitType = unitType;
/** The advance at `@CIVILIZE` index `index`, or `null` for none. */
const advanceType = (index) => {
    if (index < 0) {
        return null;
    }
    const AdvanceType = exports.advanceTypes[index];
    if (AdvanceType === undefined) {
        throw new TypeError(`No advance class for @CIVILIZE index ${index}.`);
    }
    return AdvanceType;
};
exports.advanceType = advanceType;
//# sourceMappingURL=unitTable.js.map