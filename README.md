# civ2-unit

Civilization II's units on shared base rules: the 51 unit types (28 shared with Civilization, 23 of their own), each
type's traits and role from its `@UNITS` row, its stats and cost, what it needs and what makes it obsolete, the build
list's pruning, movement (roads, railroads, rivers, alpine moves), defence, Civ1's battle resolver with Civ2's strengths,
zones of control, the lifecycle rules and the action table.

City Walls triple a land unit's defence against a land attacker that doesn't ignore them; so does its owner's Great
Wall, while it stands and isn't obsolete (civ2-wonder registers when), in every one of the owner's cities. The two are
one test (base-wonder's `cityHasImprovementOrWonder`), so they never stack.

`data/units.ts` holds the numbers of `RULES.TXT` `@UNITS` (numbers only, each row cited); `tests/rulesTxt.test.ts`
checks them against a local copy when `CIV2_PATH` names its folder: `CIV2_PATH=~/Code/civ-clone/civ2 npm test`.
