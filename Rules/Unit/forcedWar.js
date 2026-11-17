"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.recordTargets = exports.forcingWar = exports.BREAK_TREATY_RULE = exports.LIFECYCLE_BREAK_TREATY_RULE = void 0;
const Actions_1 = require("../../Actions");
const nearestCity_1 = require("../../lib/nearestCity");
const InciteRevolt_1 = require("@civ-clone/base-unit-action-incite-revolt/InciteRevolt");
const IndustrialSabotage_1 = require("@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage");
const PoisonWater_1 = require("@civ-clone/base-unit-action-poison-water/PoisonWater");
const StealTechnology_1 = require("@civ-clone/base-unit-action-steal-technology/StealTechnology");
const alliances_1 = require("@civ-clone/civ2-diplomacy/lib/alliances");
const espionage_1 = require("@civ-clone/civ2-diplomacy/lib/espionage");
const PlayerRegistry_1 = require("@civ-clone/core-player/PlayerRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const relations_1 = require("@civ-clone/civ2-diplomacy/lib/relations");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const Peace_1 = require("@civ-clone/base-diplomacy-declaration-peace/Peace");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
/** The rule base-unit-lifecycle's `movedRules` makes for any action with an enemy, which this package's replaces. */
exports.LIFECYCLE_BREAK_TREATY_RULE = 'civ2-unit:unit/moved/break-peace-treaty';
/** The rule that replaces it. */
exports.BREAK_TREATY_RULE = 'civ2-unit:unit/moved/break-treaty';
/** The actions the original makes war of (`diplo_force_war`): every attack, nuclear attack and capture of a city. */
exports.forcingWar = [Actions_1.Attack, Actions_1.NuclearAttack, Actions_1.CaptureCity];
// Who an attack or a nuclear attack was made on, noted when the action is made (the defenders may be gone by the time
//  the action's `Moved` rules run). A capture is the city's owner's, which it still is then.
const targets = new WeakMap();
/** Notes the players `action` attacks, for the `Moved` rule below. */
const recordTargets = (action, players) => {
    targets.set(action, players);
    return action;
};
exports.recordTargets = recordTargets;
// The Diplomat's and Spy's missions with an enemy (the forms a person is warned about under a treaty) break nothing
//  themselves: the treaty breaks only through the incident if the agent is lost (civ2-diplomacy's `AgentLost` rule), or
//  through an incited city's capture.
const missions = [
    StealTechnology_1.default,
    IndustrialSabotage_1.default,
    PoisonWater_1.default,
    InciteRevolt_1.default,
];
const enemyOf = (action) => !missions.some((Mission) => action instanceof Mission) &&
    typeof action.enemy === 'function'
    ? action.enemy()
    : null;
/**
 * What an attack does to its target's relations, in place of base-unit-lifecycle's `break-peace-treaty` rule: OpenCiv2
 *  `diplo_force_war` (`diplomacy.cpp:6861-6887`), which the original calls after every attack (`unit_combat.cpp:1536`)
 *  and capture of a city (`city.cpp:5405`), and for a nuclear attack in battle, on the owners of the units there (one
 *  on an empty city is no battle: `unit_move.cpp:1086` goes straight to `unit_nuclear_attack`). For each player
 *  attacked:
 * - any intent of either to break their treaty is forgotten (`TREATY_HOSTILE_INTENT`);
 * - under a ceasefire or a peace with a person on either side, the attacker is made to declare war (civ2-diplomacy's
 *   `madeToDeclareWar`, `diplo_declare_war(civ, civ2, -1)`), and civ2-diplomacy's `DeclaredWar` rules count it against
 *   its reputation;
 * - any peace ends;
 * - once they've met: a war is in force (a `War`, made with no declaration when there isn't one), any ceasefire left
 *   between two computer players ends with it, both attitudes are set to 100, even mid-war, and the attacker is
 *   marked as having attacked without declaring war (civ2-diplomacy's `SNEAK_ATTACK`) unless either already is; when
 *   it is, the victim's allies join the war (civ2-diplomacy's `alliesJoinWar`, `unit_combat.cpp:1593`). (The
 *   original keeps the ceasefire bit there, but its war bit rules; here the treaty level would read the ceasefire.)
 *
 * There is no vendetta. A person pillaging is made to declare war on the owner of the nearest city, anyone's at any
 *  distance, unless it's the person's own or they're at war (the pillage command's `city_find_nearest` and
 *  `diplo_declare_war(civ, civ2, -1)`, `unit.cpp:2985-2998`, through `madeToDeclareWar`, which counts against its
 *  reputation), treaty or not; a computer player's pillage changes no treaty. Moving onto a partner's land
 *  (civ-clone's own sneak move, which the original doesn't have) ends the peace only, as base-unit-lifecycle's rule
 *  did.
 */
const getRules = ({ cityRegistry = CityRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, playerRegistry = PlayerRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, turn = Turn_1.instance, unitRegistry = UnitRegistry_1.instance, diplomacy, } = {}) => {
    const // The declarations of `DeclarationType` in force between the two.
    active = (DeclarationType, player, other) => interactionRegistry
        .getByPlayers(player, other)
        .filter((interaction) => interaction instanceof DeclarationType &&
        interaction.active()), attacked = (unit, action) => {
        var _a, _b, _c;
        const players = (_a = targets.get(action)) !== null && _a !== void 0 ? _a : (action instanceof Actions_1.CaptureCity
            ? [(_c = (_b = cityRegistry.getByTile(action.to())) === null || _b === void 0 ? void 0 : _b.player()) !== null && _c !== void 0 ? _c : null]
            : action instanceof Actions_1.NuclearAttack
                ? unitRegistry
                    .getByTile(action.to())
                    .map((tileUnit) => tileUnit.player())
                : enemyOf(action) !== null
                    ? [enemyOf(action)]
                    : unitRegistry
                        .getByTile(action.to())
                        .map((tileUnit) => tileUnit.player()));
        return Array.from(new Set(players)).filter((player) => player !== null && player !== unit.player());
    }, 
    // civ2-diplomacy's dependencies, for its `forceWar` (`diplo_force_war`).
    diplomacyDependencies = diplomacy !== null && diplomacy !== void 0 ? diplomacy : {
        cityRegistry,
        clientRegistry,
        interactionRegistry,
        playerRegistry,
        ruleRegistry,
        turn,
        unitRegistry,
    }, 
    // `diplo_force_war`, then, after a battle (not a capture: `city.cpp:5405`), the victim's allies join a war not
    //  declared (`unit_combat.cpp:1593`).
    forceWar = (player, enemy, battle) => {
        if (!(0, espionage_1.forceWar)(diplomacyDependencies, player, enemy) || !battle) {
            return;
        }
        (0, alliances_1.alliesJoinWar)({
            clientRegistry,
            interactionRegistry,
            playerRegistry,
            ruleRegistry,
            turn,
        }, enemy, player);
    };
    return [
        new Moved_1.default(exports.BREAK_TREATY_RULE, new Criterion_1.default((unit, action) => exports.forcingWar.some((ActionType) => action instanceof ActionType) ||
            action instanceof Actions_1.Pillage ||
            enemyOf(action) !== null), new Effect_1.default((unit, action) => {
            var _a, _b;
            const player = unit.player();
            if (!exports.forcingWar.some((ActionType) => action instanceof ActionType)) {
                if (action instanceof Actions_1.Pillage) {
                    const owner = (_b = (_a = (0, nearestCity_1.default)(cityRegistry, action.to())) === null || _a === void 0 ? void 0 : _a.player()) !== null && _b !== void 0 ? _b : null;
                    if (owner !== null &&
                        owner !== player &&
                        (0, isHuman_1.default)(player, clientRegistry) &&
                        (0, treatyLevel_1.treatyLevel)({ interactionRegistry }, player, owner) !==
                            treatyLevel_1.TreatyLevel.War) {
                        (0, relations_1.madeToDeclareWar)({ interactionRegistry, ruleRegistry }, player, owner);
                    }
                    return;
                }
                const enemy = enemyOf(action);
                if (enemy === player) {
                    return;
                }
                active(Peace_1.default, player, enemy).forEach((peace) => peace.expire(player));
                return;
            }
            attacked(unit, action).forEach((enemy) => forceWar(player, enemy, !(action instanceof Actions_1.CaptureCity)));
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=forcedWar.js.map