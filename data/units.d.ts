export declare const NONE = -1;
export type UnitRow = [
  obsoleteBy: number,
  domain: number,
  move: number,
  range: number,
  attack: number,
  defence: number,
  hitPoints: number,
  firepower: number,
  cost: number,
  hold: number,
  role: number,
  prerequisite: number,
  flags: number
];
/** Rows 0 to 50, by unit index. */
export declare const units: UnitRow[];
export declare const SEES_TWO_SPACES: number,
  IGNORES_ZONES_OF_CONTROL: number,
  AMPHIBIOUS: number,
  SUBMARINE: number,
  ATTACKS_AIR: number,
  COAST_BOUND: number,
  IGNORES_CITY_WALLS: number,
  CARRIES_AIR: number,
  PARADROPS: number,
  TREATS_ALL_AS_ROAD: number,
  DEFENCE_BONUS_VS_MOUNTED: number,
  FUNDAMENTALISM_FREE_SUPPORT: number,
  DESTROYED_AFTER_ATTACKING: number,
  DEFENCE_BONUS_VS_AIR: number,
  DETECTS_SUBMARINES: number;
export declare const LAND = 0,
  AIR = 1,
  SEA = 2;
export declare const ATTACK = 0,
  DEFEND = 1,
  NAVAL_SUPERIORITY = 2,
  AIR_SUPERIORITY = 3,
  SEA_TRANSPORT = 4,
  SETTLE = 5,
  DIPLOMACY = 6,
  TRADE = 7;
export declare const NUCLEAR_ATTACK = 99;
