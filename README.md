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
- **Limits:** outside a city or airbase, a stack with a bomber can only be attacked by fighters, unless a carrier is
  with it; a land unit or a helicopter takes an empty city, a ship or other aircraft doesn't.
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
within @COSMIC's 10), Airlift (a land unit between two cities with Airports, once a city a turn), Sabotage Unit (Spies),
and pillage in Civ2's order (farmland, a mine or irrigation, a fortress or airbase, the railroad, the road; Partisans
the railroad and road first). Submarines carry up to 8 missiles, as carriers hold 8 aircraft (decision 16).

## Not here

- The original's barbarian odds, the treaty-breaking "sneak attack" ×2, the airlift's risk with enemy fighters near,
  an allied city's immediate heal, and an AI attacker's extra fuel count after a win.
- A land unit can attack aircraft in the open only as base-unit-action-rules' criteria allow (Civ1's), not as the
  original does.

City Walls triple a land unit's defence against a land attacker that doesn't ignore them; so does its owner's Great
Wall, while it stands and isn't obsolete (civ2-wonder registers when), in every one of the owner's cities. The two are
one test (base-wonder's `cityHasImprovementOrWonder`), so they never stack.

`data/units.ts` holds the numbers of `RULES.TXT` `@UNITS` (numbers only, each row cited); `tests/rulesTxt.test.ts`
checks them against a local copy when `CIV2_PATH` names its folder: `CIV2_PATH=~/Code/civ-clone/civ2 npm test`.
