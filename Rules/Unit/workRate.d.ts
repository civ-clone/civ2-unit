import WorkRate from '@civ-clone/core-unit/Rules/WorkRate';
/** How many turns' terrain work Engineers do in one. */
export declare const ENGINEER_WORK_RATE = 2;
/** Engineers do two turns' terrain work in one (`unit_do_terrain_work`), so their jobs take half the turns. */
export declare const getRules: () => WorkRate[];
export default getRules;
