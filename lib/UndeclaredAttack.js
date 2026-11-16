"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndeclaredNuclearAttack = exports.UndeclaredAttack = void 0;
const SneakAttack_1 = require("@civ-clone/library-unit/Actions/SneakAttack");
const SneakNuclearAttack_1 = require("@civ-clone/base-unit-action-nuclear-attack/SneakNuclearAttack");
/**
 * An attack on a player the attacker has met and isn't at war with, but has no treaty with: what a person's Senate
 *  may stop (`diplo_confirm_attack`'s mask 0xd, `unit_combat.cpp:1524-1525`). civ2-unit offers it only as the action an
 *  `Overruled` wraps (`overruled/attack`), so a client can word it apart from breaking a treaty (a `SneakAttack`):
 *  `enemy()` is the player attacked.
 */
class UndeclaredAttack extends SneakAttack_1.default {
}
exports.UndeclaredAttack = UndeclaredAttack;
/** A nuclear attack on such a player's units (`overruled/nuclear-attack`), as `UndeclaredAttack`. */
class UndeclaredNuclearAttack extends SneakNuclearAttack_1.default {
}
exports.UndeclaredNuclearAttack = UndeclaredNuclearAttack;
exports.default = UndeclaredAttack;
//# sourceMappingURL=UndeclaredAttack.js.map