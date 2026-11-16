"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.treatyAttacks = exports.BREAK_TREATY_RULE = exports.LIFECYCLE_BREAK_TREATY_RULE = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Actions_1 = require("../../Actions");
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const relations_1 = require("@civ-clone/civ2-diplomacy/lib/relations");
const Ceasefire_1 = require("@civ-clone/base-diplomacy-declaration-ceasefire/Ceasefire");
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
/** The actions that attack across a treaty, which the original makes war of (`diplo_force_war`). */
exports.treatyAttacks = [
    Actions_1.SneakAttack,
    Actions_1.SneakCaptureCity,
    Actions_1.SneakNuclearAttack,
];
const enemyOf = (action) => typeof action.enemy === 'function'
    ? action.enemy()
    : null;
/**
 * What an action across a treaty does to it, in place of base-unit-lifecycle's `break-peace-treaty` rule:
 * - an attack, a capture or a nuclear attack on a player under a ceasefire or a peace (OpenCiv2 `diplo_force_war`,
 *   `diplomacy.cpp:6861-6887`): when either player is a person, the attacker is made to declare war
 *   (civ2-diplomacy's `madeToDeclareWar`, `diplo_declare_war(civ, civ2, -1)`), and civ2-diplomacy's `DeclaredWar` rule
 *   counts it against its reputation and sets both attitudes to 100. Between two computer players the treaties end
 *   and the war starts with no declaration (no reputation), and both attitudes are set to 100. There is no vendetta.
 * - moving onto or pillaging a treaty partner's land (civ-clone's own; the original has neither) ends the peace, as
 *   base-unit-lifecycle's rule did, with no war and no vendetta.
 */
const getRules = ({ clientRegistry = ClientRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, turn = Turn_1.instance, } = {}) => {
    // The declarations of `DeclarationType` in force between the two.
    const active = (DeclarationType, player, other) => interactionRegistry
        .getByPlayers(player, other)
        .filter((interaction) => interaction instanceof DeclarationType &&
        interaction.active());
    return [
        new Moved_1.default(exports.BREAK_TREATY_RULE, new Criterion_1.default((unit, action) => {
            const enemy = enemyOf(action);
            return enemy !== null && enemy !== unit.player();
        }), new Effect_1.default((unit, action) => {
            const player = unit.player(), enemy = enemyOf(action);
            if (!exports.treatyAttacks.some((ActionType) => action instanceof ActionType)) {
                active(Peace_1.default, player, enemy).forEach((peace) => peace.expire(player));
                return;
            }
            if ((0, treatyLevel_1.treatyLevel)({ interactionRegistry }, player, enemy) <
                treatyLevel_1.TreatyLevel.Ceasefire) {
                return;
            }
            if ((0, isHuman_1.default)(player, clientRegistry) || (0, isHuman_1.default)(enemy, clientRegistry)) {
                (0, relations_1.madeToDeclareWar)({ interactionRegistry, ruleRegistry }, player, enemy);
                return;
            }
            [Peace_1.default, Ceasefire_1.default].forEach((DeclarationType) => active(DeclarationType, player, enemy).forEach((declaration) => declaration.expire(player)));
            interactionRegistry.register(new War_1.default(player, enemy, new Expiries_1.Never(), ruleRegistry));
            const attitudes = (0, relations_1.attitude)({ interactionRegistry, ruleRegistry, turn });
            [
                [player, enemy],
                [enemy, player],
            ].forEach(([holder, toward]) => {
                if (attitudes.get(holder, toward) !== undefined) {
                    attitudes.set(holder, toward, 100, 'forced-war');
                }
            });
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=forcedWar.js.map