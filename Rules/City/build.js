"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const units_1 = require("../../data/units");
const Build_1 = require("@civ-clone/core-city-build/Rules/Build");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Units_1 = require("../../Units");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Description_1 = require("@civ-clone/core-rule/Description");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fundamentalism_1 = require("@civ-clone/base-government-fundamentalism/Fundamentalism");
const ManhattanProject_1 = require("@civ-clone/base-wonder-manhattanproject/ManhattanProject");
const Gunpowder_1 = require("@civ-clone/base-science-advance-gunpowder/Gunpowder");
const NuclearFission_1 = require("@civ-clone/base-science-advance-nuclearfission/NuclearFission");
const unitTable_1 = require("../../lib/unitTable");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const isHuman_1 = require("@civ-clone/base-difficulty/lib/isHuman");
const unitTable_2 = require("../../lib/unitTable");
const rowOf = new Map(units_1.units.map((row, index) => [unitTable_2.unitTypes[index], row]));
const row = (UnitType) => rowOf.get(UnitType);
/**
 * What Civilization II's build list leaves out beyond a unit's advances (`civ_can_build_unit`), one rule per unit it
 *  can leave out, `civ2-unit:city/build/<reason>/<Unit>`:
 *  - `outclassed-defender`: a defensive unit weaker in defence than Musketeers, once Gunpowder is known;
 *  - `outclassed-mounted`: a two-move attacker no stronger than Knights in attack and weaker in defence, once the
 *    Knights' advance is known;
 *  - `nuclear`: a nuclear weapon needs Nuclear Fission and the Manhattan Project built by anyone;
 *  - `fundamentalism`: Fanatics only under Fundamentalism;
 *  - `computer-outclassed`: a computer player doesn't build a multi-move land unit when another of its role, whose
 *    advance it knows, is at least as strong in attack and defence and stronger in one.
 *  Barbarian cities are left to their own rules, as for the advances.
 */
const getRules = ({ clientRegistry = ClientRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, manhattanProjectBuilt = () => false, } = {}) => {
    const knows = (player, AdvanceType) => AdvanceType === null ||
        playerResearchRegistry.getByPlayer(player).completed(AdvanceType), rule = (reason, UnitType, allowed, ...descriptions) => new Build_1.Build(`civ2-unit:city/build/${reason}/${UnitType.name}`, UnitType, new Criterion_1.default((city, BuildItem) => BuildItem === UnitType && !(0, isBarbarian_1.default)(city.player())), new Effect_1.default((city) => new Criterion_1.default(() => allowed(city))), 
    // `Build` hands everything but its items to `Rule`, which takes a `Description`, though core-city-build's
    //  constructor type doesn't list one.
    ...descriptions), [, , , , knightsAttack, knightsDefence, , , , , , knightsAdvance] = row(Units_1.Knight), musketeersDefence = row(Units_1.Musketman)[5];
    return unitTable_2.unitTypes.flatMap((UnitType) => {
        const [, domain, move, , attack, defence, , , , , role] = row(UnitType), rules = [];
        if (role === units_1.DEFEND && defence < musketeersDefence) {
            rules.push(rule('outclassed-defender', UnitType, (city) => !knows(city.player(), Gunpowder_1.default)));
        }
        if (role === units_1.ATTACK &&
            move === 2 &&
            attack <= knightsAttack &&
            defence < knightsDefence) {
            rules.push(rule('outclassed-mounted', UnitType, (city) => !knows(city.player(), (0, unitTable_1.advanceType)(knightsAdvance))));
        }
        if (attack >= units_1.NUCLEAR_ATTACK) {
            rules.push(rule('nuclear', UnitType, (city) => manhattanProjectBuilt() && knows(city.player(), NuclearFission_1.default), 
            // What the Manhattan Project does, for the Civilopedia (civ-clone/web-renderer#1196): once anyone has built
            //  it, every civilization that knows Nuclear Fission can build the weapon.
            new Description_1.default({
                type: 'enables',
                subject: ManhattanProject_1.default,
                what: UnitType,
                with: NuclearFission_1.default,
                scope: 'world',
            })));
        }
        if (UnitType === Units_1.Fanatic) {
            rules.push(rule('fundamentalism', UnitType, (city) => {
                // A player with no government yet has no Fundamentalism.
                try {
                    return playerGovernmentRegistry
                        .getByPlayer(city.player())
                        .is(Fundamentalism_1.default);
                }
                catch (e) {
                    return false;
                }
            }));
        }
        if (domain === 0 && move > 1) {
            rules.push(rule('computer-outclassed', UnitType, (city) => (0, isHuman_1.default)(city.player(), clientRegistry) ||
                !unitTable_2.unitTypes.some((OtherType) => {
                    const [, , , , otherAttack, otherDefence] = row(OtherType), [, otherDomain, otherMove, , , , , , , , otherRole, prerequisite,] = row(OtherType);
                    return (OtherType !== UnitType &&
                        otherRole === role &&
                        otherDomain === domain &&
                        otherMove > 1 &&
                        knows(city.player(), (0, unitTable_1.advanceType)(prerequisite)) &&
                        attack <= otherAttack &&
                        defence <= otherDefence &&
                        (attack !== otherAttack || defence !== otherDefence));
                })));
        }
        return rules;
    });
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=build.js.map