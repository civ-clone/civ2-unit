import { Build } from '@civ-clone/core-city-build/Rules/Build';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
export interface BuildDependencies {
  clientRegistry?: ClientRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  manhattanProjectBuilt?: () => boolean;
}
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
export declare const getRules: ({
  clientRegistry,
  playerGovernmentRegistry,
  playerResearchRegistry,
  manhattanProjectBuilt,
}?: BuildDependencies) => Build[];
export default getRules;
