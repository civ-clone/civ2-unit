import { Game } from '@civ-clone/core-game';
import Unit from '@civ-clone/core-unit/Unit';
/** A unit stepping one move short of a square's cost gets there with this chance per move it has (as Civ1's). */
export declare const shortfallFactor = 0.5;
/** A new city's first defender, if its player asks for one: the defensive units, strongest defence first. */
export declare const defenders: (typeof Unit)[];
export declare const register: (game: Game) => void;
export default register;
