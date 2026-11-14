import { Game } from '@civ-clone/core-game';
import Unit from '@civ-clone/core-unit/Unit';
/**
 * A land unit short of the moves a step costs (`unit_move_dir`): one that hasn't moved this turn always gets there; one
 *  that has gets there with a chance of its remaining moves over the cost. Only land units roll; any other gets there. Route planning can count on the first, so a
 *  step is worth no more than a turn.
 */
export declare const shortStep: {
  succeeds: (
    unit: Unit,
    remaining: number,
    movement: number,
    cost: number,
    randomNumberGenerator: () => number
  ) => boolean;
  expectedCost: (movement: number) => number;
};
/** A new city's first defender, if its player asks for one: the defensive units, strongest defence first. */
export declare const defenders: (typeof Unit)[];
export declare const register: (game: Game) => void;
export default register;
