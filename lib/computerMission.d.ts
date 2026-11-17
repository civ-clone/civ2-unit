import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/civ2-diplomacy/lib/Dependencies';
import Unit from '@civ-clone/core-unit/Unit';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
/** The missions a computer player's agent chooses among, by their action rows' names. */
export type ComputerMission =
  | 'establish-embassy'
  | 'steal-technology'
  | 'industrial-sabotage'
  | 'poison-water'
  | 'incite-revolt';
/**
 * The mission a computer player's Diplomat or Spy (`unit`) chooses at `city`, as `spy_city_mission_ai_choice`
 *  (`unit_spy.cpp:227-251`) does, for stage W's AI to read. In order, from a theft:
 * 1. holding a vendetta against the city's owner, a Spy poisons the water one time in three (one draw of `random`,
 *    made only with a vendetta);
 * 2. at peace (an alliance included), a theft;
 * 3. above King, or at King once the owner has more than 5 subversions, at war or with a vendetta, against anyone but
 *    a Democracy, a theft becomes an incited revolt;
 * 4. allied, a theft;
 * 5. a Diplomat at a city already robbed sabotages instead, or, under a ceasefire, a peace or an alliance, makes an
 *    embassy.
 *
 * Then, as the original's missions do when they can't be carried out (`spy_city_mission`'s loop): a theft with nothing
 *  to take becomes a sabotage, or an embassy under a treaty (`unit_spy.cpp:432-437`); an incited revolt the player
 *  can't pay twice over becomes a theft (`:851`); an embassy there already is becomes an investigation (`:290`). Those
 *  are the AI's to follow, from which rows are offered.
 */
export declare const computerMission: (
  unit: Unit,
  city: City,
  dependencies: Dependencies & {
    pendingEffectRegistry: PendingEffectRegistry;
  },
  random: () => number
) => ComputerMission;
export default computerMission;
