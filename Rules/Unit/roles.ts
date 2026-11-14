import {
  AirSuperiorityRole,
  AttackRole,
  DefendRole,
  DiplomacyRole,
  NavalSuperiorityRole,
  SettleRole,
  TradeRole,
  TransportRole,
} from '@civ-clone/base-unit-role/Roles';
import UnitRoles, { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';
import { UnitRow, units } from '../../data/units';
import { RoleType } from '@civ-clone/base-unit-role/UnitRole';
import { unitTypes } from '../../lib/unitTable';

/** The prefix of every role declaration's id: `civ2-unit:unit/role/<Unit>`. */
export const ROLE_RULE_PREFIX = 'civ2-unit:unit/role';

/** `@UNITS` column 11's roles, 0 to 7, in OpenCiv2's order (`ROLE_*`). */
export const roleTypes: RoleType[] = [
  AttackRole,
  DefendRole,
  NavalSuperiorityRole,
  AirSuperiorityRole,
  TransportRole,
  SettleRole,
  DiplomacyRole,
  TradeRole,
];

/** Each unit type's role, from its `@UNITS` row. */
export const getRules = (): UnitRoles[] =>
  units.map(
    ([, , , , , , , , , , role]: UnitRow, index: number): UnitRoles =>
      unitRole(ROLE_RULE_PREFIX, unitTypes[index], roleTypes[role])
  );

export default getRules;
