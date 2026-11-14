import UnitRoles from '@civ-clone/base-unit-role/Rules/UnitRoles';
import { RoleType } from '@civ-clone/base-unit-role/UnitRole';
/** The prefix of every role declaration's id: `civ2-unit:unit/role/<Unit>`. */
export declare const ROLE_RULE_PREFIX = 'civ2-unit:unit/role';
/** `@UNITS` column 11's roles, 0 to 7, in OpenCiv2's order (`ROLE_*`). */
export declare const roleTypes: RoleType[];
/** Each unit type's role, from its `@UNITS` row. */
export declare const getRules: () => UnitRoles[];
export default getRules;
