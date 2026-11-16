# civ2-unit

Civilization II's units on shared base rules: the 51 unit types (28 shared with Civilization, 23 of their own), each
type's traits and role from its `@UNITS` row, its stats and cost, what it needs and what makes it obsolete, the build
list's pruning, movement (roads, railroads, rivers, alpine moves), defence, combat, healing, fuel, zones of control,
the lifecycle rules and the action table.

## Combat (OpenCiv2 richardpenman/civ2@49f26ec, `src/auto/unit_combat.cpp`)

- **Rounds** (`Rules/Unit/combat`): base-combat-rounds at 8 steps to 1, with each type's `HitPoints` (the row's ×10),
  `Firepower` and `Fuel` (range) yields from `data/units.ts`. Firepower changes (`CombatModifiers`): a ship against a
  land unit fights at 1 a side; a submarine defends at 1; a ship in port attacked by anything but a ship defends at 1
  and the attacker's is doubled; a helicopter attacked by an air-superiority unit defends at 1 (and at half its
  defence, a `Strength` rule).
- **The defender** (`DefenderRank`, `unit_stack_best_defender`): `unit_defense_strength` alone, times hit points left,
  then +1 for Pikemen, ×3 or ×5 for AEGIS against aircraft or missiles, ×2 for a fighter against a fighter, and a ship
  in a city ×2 against aircraft without a SAM Battery or halved; a land unit aboard a ship can't defend. Ties go to the
  later unit, as in the original.
- **Defence:** a land unit on a Fortress ×2, in place of fortified, except against aircraft and units that ignore walls.
- **Attack:** a unit that paradropped this turn ×1.5, after a veteran's.
- **After a battle:** the winner may become a veteran (base-unit-veteran-promotion, at the strengths fought at; never a
  missile; Sun Tzu's War Academy is civ2-wonder's); a defender's stack survives it in a city, on a Fortress or on an
  Airbase; a city that loses a defender shrinks, unless it has City Walls (or its owner the Great Wall), the attacker
  fought from the sea, or it is a human's city on Chieftain. Aircraft with a range other than 1 (bombers, helicopters)
  end their turn after a win (`AttackEndsTurn`).
- **Limits:** whatever reaches a square may attack it (a land unit on land, a submarine only at sea), except that
  outside a city or airbase a stack with a bomber can only be attacked by fighters, unless a carrier is with it; a
  land unit or a helicopter takes an empty city, a ship or other aircraft doesn't.
- **A city that loses a defender** loses one citizen, by this package's rule alone (civ2-city has none of its own).
- **Nuclear attack:** another player's city with SDI Defense within 3 (`map_distance`) of the target stops it
  (`unit:nuclear-stopped` tells the client).

## Healing, fuel and moves

- **Healing** (`Rules/Unit/healing`, base-unit-healing, `civ_heal_units`): a tenth of the unit's hit points a step,
  for units that didn't move: 1 step, 2 on a Fortress; a land unit within 3 of its nearest city on its land mass 1 more,
  2 with Barracks; twice as much in its own city; fully in a city with its domain's facility (Barracks, Airport, Port
  Facility), and an aircraft fully on an Airbase. A helicopter that moved, outside a city or airbase, loses a step a
  turn, never its last hit point. Distances are `lib/distance`'s `map_distance`.
- **Damaged movement:** moves × hit points left, in thirds, rounded up to a whole move, at least 1 on land and 2 at sea;
  aircraft aren't slowed (`unit_max_moves`).
- **Fuel** (`Rules/Unit/fuel`, base-unit-fuel, `unit_move_dir_air_fuel`): counted when an aircraft runs out of moves
  away from its player's city, an airbase or a carrier (a missile also a submarine); it crashes at its range, and the
  client hears `unit:out-of-fuel`. Helicopters (range 0) need none.
- **Triremes** are lost out of sight of land 1 in 2, 1 in 4 with Seafaring, 1 in 8 with Navigation too, never with the
  Lighthouse (`lib/coastBound`), for every player.
- **Work:** Engineers work at twice the rate (`WorkRate`).

## Orders added in M2b

Transform (Engineers, `TransformTerrain`, @TERRAIN's results through civ2-world), Build Fortress and Build Airbase
(Settlers and Engineers, not in a city), Paradrop (Paratroopers, from a city or airbase with no moves used, to land
within @COSMIC's 10), Airlift (a land unit between two cities with Airports, once a city a turn; shot down one time in 6 for each enemy
air-superiority unit within its moves of either city, a veteran counting twice, `Rules/Unit/airlift`), Sabotage Unit (Spies),
and pillage in Civ2's order (farmland, a mine or irrigation, a fortress or airbase, the railroad, the road; Partisans
the railroad and road first). Submarines carry up to 8 missiles, as carriers hold 8 aircraft (decision 16).

## Farmland (M2c)

Build Farmland (base-unit-action-build-farmland) is the irrigation order on an irrigated square: offered only where
there's `Irrigation` already, and civ2-world's `Available` rule adds Refrigeration, water, no city and no farmland yet
(`unit_cmd_terraform` order 6). It takes the irrigation order's turns (`unit_terrain_work_turns`). Irrigation is never
offered on an irrigated square, so a unit is offered one or the other; a client puts both under the irrigation key.

## Built veteran, and upgrades (M2c)

- **Communism:** a Diplomat or Spy (the diplomacy role) built in a city under Communism is a veteran
  (`Rules/Unit/created`, `city_process_production_unit`). Survey Q23 follows the code, which tests the role, so Spies
  are built veteran too. Barracks, Port Facility, Airport and their wonders are civ2-city-improvement's.
- **Upgrades** (`lib/upgrade`): `upgradeOptions(registries)` gives base-unit-upgrade's `upgradeUnits` this table's
  obsoleting advance, prerequisite, hold and role per type, in `@UNITS` order, and defensive units weaker than
  Musketeers upgrading with Gunpowder (`civ_leonardo_upgrade`). Pass the game's `transportRegistry` and rules, which a
  unit that becomes a transport needs. Leonardo's Workshop (civ2-wonder) decides when.

## Treaties and missions (M2d)

From OpenCiv2 `diplo_confirm_attack`, `diplo_force_war` (`diplomacy.cpp:6861-6920`), `tile_zoc_unit_adjacent`,
`unit_move_dir` (`unit_move.cpp:778-830`, `:1086-1106`), the pillage command (`unit.cpp:2985-2998`) and
`spy_city_mission_menu` (`unit_spy.cpp:171-218`):

- **Allies:** a unit is never offered an attack, a capture or a nuclear attack on an ally's square, an ally's units
  exert no zone of control, and an ally's land may be walked onto but not pillaged. A land unit (not a Diplomat, Spy,
  Caravan or Freight) moving onto an ally's city is `allied-repair` (`AlliedRepair`): it stays where it is, is
  repaired a tenth of its hit points (a fifth if the city has Barracks, never more than its damage), its turn ends,
  and it counts as having rested when units next heal.
- **The Senate** (base-government-senate's `senateIntervenes(player, partner, { reason: 'break-treaty' })`, which
  civ2-diplomacy answers; civ2-unit registers no rule). The partner is the owner of the units or city on the target
  square, or of the land there. When it intervenes, the row's `overruled/` form is offered instead (a blocked move
  spends its cost). It is asked:
  - across a ceasefire, a peace or an alliance (mask 0xe): every treaty-breaking row (`sneak-move`, `sneak-attack`,
    `sneak-nuclear-attack`, `sneak-capture-city`, `sneak-pillage`);
  - in a battle (another player's units on the square), by a person attacking a player it has met and isn't at war
    with (mask 0xd, asked of persons only): `attack` and `nuclear-attack`, whose `overruled/` forms wrap an
    `UndeclaredAttack` or `UndeclaredNuclearAttack` (with `enemy()`), so a client can word them apart from breaking a
    treaty;
  - never at war, nor for a capture with no treaty, nor for a nuclear attack on an empty city (no battle).
- **A computer player's units don't capture a city across a treaty** (`sneak-capture-city` is a person's only).
- **Forcing war** (`Rules/Unit/forcedWar`, replacing base-unit-lifecycle's `break-peace-treaty`). Every attack, capture
  and nuclear attack in battle, for each player attacked (a nuclear attack's are the owners of the units there):
  either side's intent to break their treaty is forgotten; under a ceasefire or a peace with a person on either side,
  the attacker is made to declare war (civ2-diplomacy's `madeToDeclareWar`, which counts it against its reputation);
  any peace ends; and once they've met a war is in force (with no declaration when there wasn't one, ending any
  ceasefire left between two computer players), both attitudes are set to 100, even mid-war, and the attacker is
  marked as having attacked without declaring war (civ2-diplomacy's `SNEAK_ATTACK`) unless either side already is. No
  vendetta is left. Pillaging a partner's land makes a person not at war with it declare war (`madeToDeclareWar`); a
  computer player only ends the peace. Moving onto a partner's land (civ-clone's own sneak move, which the original
  doesn't have) ends the peace only.
- **Diplomats and Spies:** Establish Embassy and Investigate City, in that order. The embassy isn't offered to a
  player that has an `Embassy` there or owns a standing United Nations; Marco Polo's doesn't hide it. There is no Meet
  with Leader: the original's mission menu has none (its option 7 is a multiplayer game's chat spying), and talks open
  from the client.

## Not here

- The original's barbarian odds, the treaty-breaking "sneak attack" ×2, and an AI attacker's extra fuel count after a
  win.
- A computer player's units attacking across a treaty: the original's computer units never do (they stop, and the AI
  breaks treaties through its own rolls); here the rows are offered to anyone, and the AI client decides.
- An airlift's risk counts players not at peace, where the original asks for war, and a human isn't asked to confirm a
  risky airlift first.

City Walls triple a land unit's defence against a land attacker that doesn't ignore them; so does its owner's Great
Wall, while it stands and isn't obsolete (civ2-wonder registers when), in every one of the owner's cities. The two are
one test (base-wonder's `cityHasImprovementOrWonder`), so they never stack.

`data/units.ts` holds the numbers of `RULES.TXT` `@UNITS` (numbers only, each row cited); `tests/rulesTxt.test.ts`
checks them against a local copy when `CIV2_PATH` names its folder: `CIV2_PATH=~/Code/civ-clone/civ2 npm test`.
