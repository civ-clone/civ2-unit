"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.recordTargets = exports.forcingWar = exports.BREAK_TREATY_RULE = exports.LIFECYCLE_BREAK_TREATY_RULE = void 0;
const Actions_1 = require("../../Actions");
const nearestCity_1 = require("../../lib/nearestCity");
const alliances_1 = require("@civ-clone/civ2-diplomacy/lib/alliances");
const PlayerRegistry_1 = require("@civ-clone/core-player/PlayerRegistry");
const Ceasefire_1 = require("@civ-clone/base-diplomacy-declaration-ceasefire/Ceasefire");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const flags_1 = require("@civ-clone/civ2-diplomacy/lib/flags");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const relations_1 = require("@civ-clone/civ2-diplomacy/lib/relations");
const Contact_1 = require("@civ-clone/base-diplomacy-interaction-contact/Contact");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const Expiries_1 = require("@civ-clone/core-diplomacy/Expiries");
const Peace_1 = require("@civ-clone/base-diplomacy-declaration-peace/Peace");
const War_1 = require("@civ-clone/base-diplomacy-declaration-war/War");
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
const enemyOf = (action) => typeof action.enemy === 'function'
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
const getRules = ({ cityRegistry = CityRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, playerRegistry = PlayerRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, turn = Turn_1.instance, unitRegistry = UnitRegistry_1.instance, } = {}) => {
    const flags = { interactionRegistry, ruleRegistry, turn }, 
    // The declarations of `DeclarationType` in force between the two.
    active = (DeclarationType, player, other) => interactionRegistry
        .getByPlayers(player, other)
        .filter((interaction) => interaction instanceof DeclarationType &&
        interaction.active()), inContact = (player, other) => interactionRegistry
        .getByPlayers(player, other)
        .some((interaction) => interaction instanceof Contact_1.default), attacked = (unit, action) => {
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
    }, forceWar = (player, enemy) => {
        (0, flags_1.clearBoth)(flags, player, enemy, flags_1.HOSTILE_INTENT);
        const level = (0, treatyLevel_1.treatyLevel)({ interactionRegistry }, player, enemy);
        if ((level === treatyLevel_1.TreatyLevel.Ceasefire || level === treatyLevel_1.TreatyLevel.Peace) &&
            ((0, isHuman_1.default)(player, clientRegistry) || (0, isHuman_1.default)(enemy, clientRegistry))) {
            (0, relations_1.madeToDeclareWar)({ interactionRegistry, ruleRegistry }, player, enemy);
        }
        active(Peace_1.default, player, enemy).forEach((peace) => peace.expire(player));
        if (!inContact(player, enemy)) {
            return;
        }
        if (active(War_1.default, player, enemy).length === 0) {
            interactionRegistry.register(new War_1.default(player, enemy, new Expiries_1.Never(), ruleRegistry));
        }
        active(Ceasefire_1.default, player, enemy).forEach((ceasefire) => ceasefire.expire(player));
        const attitudes = (0, relations_1.attitude)(flags);
        attitudes.set(player, enemy, 100, 'forced-war');
        attitudes.set(enemy, player, 100, 'forced-war');
        if (!(0, flags_1.hasFlag)(flags, enemy, player, flags_1.SNEAK_ATTACK) &&
            !(0, flags_1.hasFlag)(flags, player, enemy, flags_1.SNEAK_ATTACK)) {
            (0, flags_1.setFlag)(flags, player, enemy, flags_1.SNEAK_ATTACK);
            // The first attack of a war not declared: the victim's allies join it (`diplo_allies_join_war`, called when
            //  `diplo_force_war` returns 1, `unit_combat.cpp:1593`).
            (0, alliances_1.alliesJoinWar)({
                clientRegistry,
                interactionRegistry,
                playerRegistry,
                ruleRegistry,
                turn,
            }, enemy, player);
        }
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
            attacked(unit, action).forEach((enemy) => forceWar(player, enemy));
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=forcedWar.js.map