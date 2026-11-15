import WorkRate from '@civ-clone/core-unit/Rules/WorkRate';
/** Engineers do two turns' terrain work in one (`unit_do_terrain_work`), so their jobs take half the turns. */
export declare const getRules: () => WorkRate[];
export default getRules;
