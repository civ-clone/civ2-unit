import SneakAttack from '@civ-clone/library-unit/Actions/SneakAttack';
import SneakNuclearAttack from '@civ-clone/base-unit-action-nuclear-attack/SneakNuclearAttack';

/**
 * An attack on a player the attacker has met and isn't at war with, but has no treaty with: what a person's Senate
 *  may stop (`diplo_confirm_attack`'s mask 0xd, `unit_combat.cpp:1524-1525`). civ2-unit offers it only as the action an
 *  `Overruled` wraps (`overruled/attack`), so a client can word it apart from breaking a treaty (a `SneakAttack`):
 *  `enemy()` is the player attacked.
 */
export class UndeclaredAttack extends SneakAttack {}

/** A nuclear attack on such a player's units (`overruled/nuclear-attack`), as `UndeclaredAttack`. */
export class UndeclaredNuclearAttack extends SneakNuclearAttack {}

export default UndeclaredAttack;
