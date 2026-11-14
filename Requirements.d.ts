import { Requirement } from '@civ-clone/core-requirement/Requirement';
/** The advance a city's player needs before it can build each unit: one rule each. */
export declare const requiresAdvance: Requirement[];
/** The advance that stops a city's player building each unit: one rule each. */
export declare const obsoletedBy: Requirement[];
/** The entries `Rules/City/build`'s deriver makes rules from. */
export declare const buildRequirements: Requirement[];
export default buildRequirements;
