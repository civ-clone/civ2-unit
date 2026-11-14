// Civilization II's unit table: the numbers of `RULES.TXT` `@UNITS` rows 0 to 50 (the 51 units the game makes
//  available; rows 51 to 61 are its unused slots), as OpenCiv2 loads them (`src/auto/civ.cpp` `rules_load_units`,
//  richardpenman/civ2@49f26ec). Numbers only: no text from the file is held here. `tests/rulesTxt.test.ts` checks
//  every number against a local `RULES.TXT` when `CIV2_PATH` is set.
//
// Advances are indices into `@CIVILIZE` (`rules_parse_advance_abbrev`): -1 for `nil` (none).

export const NONE = -1;

export type UnitRow = [
  obsoleteBy: number,
  // 0 land, 1 air, 2 sea.
  domain: number,
  // In whole squares (the game multiplies it by @COSMIC's road movement multiplier).
  move: number,
  // Turns of fuel, for aircraft.
  range: number,
  attack: number,
  defence: number,
  // As written: the game multiplies it by 10.
  hitPoints: number,
  firepower: number,
  // In rows of shields.
  cost: number,
  hold: number,
  // The AI's role, 0 to 7 (base-unit-role's roles, in order).
  role: number,
  prerequisite: number,
  // The 15 flag bits, the least significant first (`UnitFlag` in civ2-asset-extractor's `rules`).
  flags: number
];

/** Rows 0 to 50, by unit index. */
export const units: UnitRow[] = [
  // RULES.TXT @UNITS row 0
  [28, 0, 1, 0, 0, 1, 2, 1, 4, 0, 5, -1, 0b0],
  // RULES.TXT @UNITS row 1
  [-1, 0, 2, 0, 0, 2, 2, 1, 4, 0, 5, 28, 0b0],
  // RULES.TXT @UNITS row 2
  [29, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, -1, 0b0],
  // RULES.TXT @UNITS row 3
  [29, 0, 1, 0, 1, 2, 1, 1, 2, 0, 1, 8, 0b0],
  // RULES.TXT @UNITS row 4
  [35, 0, 1, 0, 3, 2, 1, 1, 3, 0, 1, 86, 0b0],
  // RULES.TXT @UNITS row 5
  [35, 0, 1, 0, 4, 2, 1, 1, 4, 0, 1, 39, 0b0],
  // RULES.TXT @UNITS row 6
  [35, 0, 1, 0, 1, 2, 1, 1, 2, 0, 1, 29, 0b10000000000],
  // RULES.TXT @UNITS row 7
  [17, 0, 1, 0, 3, 3, 2, 1, 3, 0, 1, 35, 0b0],
  // RULES.TXT @UNITS row 8
  [-1, 0, 1, 0, 4, 4, 2, 1, 2, 0, 1, 31, 0b100000000000],
  // RULES.TXT @UNITS row 9
  [-1, 0, 1, 0, 4, 4, 2, 1, 5, 0, 1, 34, 0b1000000010],
  // RULES.TXT @UNITS row 10
  [-1, 0, 1, 0, 5, 5, 2, 1, 5, 0, 1, 81, 0b1000000000],
  // RULES.TXT @UNITS row 11
  [-1, 0, 1, 0, 5, 4, 2, 1, 4, 0, 1, 17, 0b0],
  // RULES.TXT @UNITS row 12
  [-1, 0, 1, 0, 8, 5, 2, 1, 6, 0, 0, 2, 0b100],
  // RULES.TXT @UNITS row 13
  [-1, 0, 1, 0, 6, 4, 2, 1, 6, 0, 1, 13, 0b100000000],
  // RULES.TXT @UNITS row 14
  [-1, 0, 3, 0, 6, 6, 3, 1, 5, 0, 1, 40, 0b0],
  // RULES.TXT @UNITS row 15
  [11, 0, 2, 0, 2, 1, 1, 1, 2, 0, 0, 36, 0b0],
  // RULES.TXT @UNITS row 16
  [64, 0, 2, 0, 3, 1, 1, 1, 3, 0, 0, 87, 0b0],
  // RULES.TXT @UNITS row 17
  [55, 0, 2, 0, 4, 1, 1, 1, 4, 0, 0, 64, 0b0],
  // RULES.TXT @UNITS row 18
  [42, 0, 2, 0, 5, 1, 1, 1, 4, 0, 0, 55, 0b0],
  // RULES.TXT @UNITS row 19
  [42, 0, 2, 0, 4, 2, 1, 1, 4, 0, 0, 11, 0b0],
  // RULES.TXT @UNITS row 20
  [81, 0, 2, 0, 5, 2, 2, 1, 5, 0, 0, 42, 0b0],
  // RULES.TXT @UNITS row 21
  [53, 0, 2, 0, 8, 3, 2, 1, 6, 0, 0, 81, 0b0],
  // RULES.TXT @UNITS row 22
  [-1, 0, 3, 0, 10, 5, 3, 1, 8, 0, 0, 53, 0b0],
  // RULES.TXT @UNITS row 23
  [51, 0, 1, 0, 6, 1, 1, 1, 4, 0, 0, 49, 0b0],
  // RULES.TXT @UNITS row 24
  [44, 0, 1, 0, 8, 1, 2, 1, 4, 0, 0, 51, 0b0],
  // RULES.TXT @UNITS row 25
  [72, 0, 1, 0, 10, 1, 2, 2, 5, 0, 0, 44, 0b0],
  // RULES.TXT @UNITS row 26
  [-1, 0, 2, 0, 12, 2, 3, 2, 7, 0, 0, 72, 0b1000000],
  // RULES.TXT @UNITS row 27
  [77, 1, 10, 1, 4, 3, 2, 2, 6, 0, 3, 30, 0b10001],
  // RULES.TXT @UNITS row 28
  [77, 1, 8, 2, 12, 1, 2, 2, 12, 0, 0, 0, 0b1],
  // RULES.TXT @UNITS row 29
  [-1, 1, 6, 0, 10, 3, 2, 2, 10, 0, 0, 13, 0b100000000000001],
  // RULES.TXT @UNITS row 30
  [-1, 1, 14, 1, 8, 4, 2, 2, 8, 0, 3, 77, 0b10001],
  // RULES.TXT @UNITS row 31
  [-1, 1, 12, 2, 14, 5, 2, 2, 16, 0, 0, 77, 0b1],
  // RULES.TXT @UNITS row 32
  [57, 2, 3, 0, 1, 1, 1, 1, 4, 2, 4, 46, 0b100000],
  // RULES.TXT @UNITS row 33
  [45, 2, 3, 0, 2, 1, 1, 1, 4, 3, 4, 57, 0b0],
  // RULES.TXT @UNITS row 34
  [37, 2, 4, 0, 0, 2, 2, 1, 4, 4, 4, 45, 0b0],
  // RULES.TXT @UNITS row 35
  [23, 2, 4, 0, 4, 2, 2, 1, 5, 2, 2, 45, 0b0],
  // RULES.TXT @UNITS row 36
  [23, 2, 4, 0, 4, 4, 3, 1, 6, 0, 2, 78, 0b0],
  // RULES.TXT @UNITS row 37
  [-1, 2, 6, 0, 4, 4, 3, 1, 6, 0, 2, 23, 0b100000000000001],
  // RULES.TXT @UNITS row 38
  [73, 2, 5, 0, 6, 6, 3, 2, 8, 0, 2, 79, 0b100000000000001],
  // RULES.TXT @UNITS row 39
  [-1, 2, 5, 0, 8, 8, 3, 2, 10, 0, 2, 73, 0b110000000000001],
  // RULES.TXT @UNITS row 40
  [-1, 2, 4, 0, 12, 12, 4, 2, 16, 0, 2, 5, 0b1],
  // RULES.TXT @UNITS row 41
  [-1, 2, 3, 0, 10, 2, 3, 2, 6, 0, 2, 14, 0b1001],
  // RULES.TXT @UNITS row 42
  [-1, 2, 5, 0, 1, 9, 4, 2, 16, 0, 2, 0, 0b10000001],
  // RULES.TXT @UNITS row 43
  [-1, 2, 5, 0, 0, 3, 3, 1, 5, 8, 4, 37, 0b0],
  // RULES.TXT @UNITS row 44
  [-1, 1, 12, 1, 18, 0, 1, 3, 6, 0, 0, 73, 0b1000000000000],
  // RULES.TXT @UNITS row 45
  [-1, 1, 16, 1, 99, 0, 1, 1, 16, 0, 0, 73, 0b1000000000000],
  // RULES.TXT @UNITS row 46
  [27, 0, 2, 0, 0, 0, 1, 1, 3, 0, 6, 88, 0b10],
  // RULES.TXT @UNITS row 47
  [-1, 0, 3, 0, 0, 0, 1, 1, 3, 0, 6, 27, 0b11],
  // RULES.TXT @UNITS row 48
  [19, 0, 1, 0, 0, 1, 1, 1, 5, 0, 7, 84, 0b10],
  // RULES.TXT @UNITS row 49
  [-1, 0, 2, 0, 0, 1, 1, 1, 5, 0, 7, 19, 0b10],
  // RULES.TXT @UNITS row 50
  [34, 0, 1, 0, 0, 1, 1, 1, 3, 0, 0, 75, 0b1000000010],
];

// The flag bits (`@UNITS` column 13; OpenCiv2's `UTYPE_*`).
export const SEES_TWO_SPACES = 1 << 0,
  IGNORES_ZONES_OF_CONTROL = 1 << 1,
  AMPHIBIOUS = 1 << 2,
  SUBMARINE = 1 << 3,
  ATTACKS_AIR = 1 << 4,
  COAST_BOUND = 1 << 5,
  IGNORES_CITY_WALLS = 1 << 6,
  CARRIES_AIR = 1 << 7,
  PARADROPS = 1 << 8,
  TREATS_ALL_AS_ROAD = 1 << 9,
  DEFENCE_BONUS_VS_MOUNTED = 1 << 10,
  FUNDAMENTALISM_FREE_SUPPORT = 1 << 11,
  DESTROYED_AFTER_ATTACKING = 1 << 12,
  DEFENCE_BONUS_VS_AIR = 1 << 13,
  DETECTS_SUBMARINES = 1 << 14;

// The domains and roles (OpenCiv2's `DOMAIN_*` and `ROLE_*`).
export const LAND = 0,
  AIR = 1,
  SEA = 2;

export const ATTACK = 0,
  DEFEND = 1,
  NAVAL_SUPERIORITY = 2,
  AIR_SUPERIORITY = 3,
  SEA_TRANSPORT = 4,
  SETTLE = 5,
  DIPLOMACY = 6,
  TRADE = 7;

// An attack of 99 or more is a nuclear weapon (`civ_can_build_unit`, `unit_resolve_attack`).
export const NUCLEAR_ATTACK = 99;
