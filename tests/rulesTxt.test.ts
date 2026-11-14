// Checks `data/units` against the player's own RULES.TXT, which is never committed. Skipped unless `CIV2_PATH` names
//  the folder it's in: `CIV2_PATH=~/Code/civ-clone/civ2 npm test`. Only numbers are compared; nothing from the file is
//  printed but a row number.
import {
  AdvanceRecord,
  UnitRecord,
  readCivilize,
  readUnits,
  toSlug,
} from '@civ-clone/civ2-asset-extractor/rules';
import { NONE, units } from '../data/units';
import { advanceTypes, unitTypes } from '../lib/unitTable';
import { existsSync, readFileSync } from 'fs';
import { expect } from 'chai';
import { join } from 'path';

const path = process.env.CIV2_PATH
  ? join(process.env.CIV2_PATH, 'RULES.TXT')
  : null;

// The rows whose class has a generic or singular name rather than the file's (plan §7 Q4: the shared classes keep their
//  generic names; new classes are singular, and trademarks are generic), by index.
const renamed = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 22, 30, 31, 33,
  39, 44, 45,
];

// The advance classes whose name isn't the file's either (a dropped leading word), by @CIVILIZE index.
const renamedAdvances = [19];

(path && existsSync(path) ? describe : describe.skip)(
  'RULES.TXT @UNITS',
  (): void => {
    const rules = path ? readFileSync(path, 'latin1') : '',
      records: UnitRecord[] = path ? readUnits(rules) : [],
      advances: AdvanceRecord[] = path ? readCivilize(rules) : [],
      // An advance reference is its abbreviation, the first word of its @CIVILIZE row's comment (`rules_parse_advance_abbrev`).
      advanceIndex = (token: string): number => {
        if (token === 'nil') {
          return NONE;
        }

        const index = advances.findIndex(
          ({ comment }) => (comment ?? '').split(/\s+/)[0] === token
        );

        expect(index >= 0, 'an advance reference resolves').to.true;

        return index;
      };

    it('has 51 available rows, then only unavailable ones', (): void => {
      expect(records.length).to.equal(62);
      records.forEach((record, index) =>
        expect(record.prerequisite !== 'no', `row ${index}`).to.equal(
          index < 51
        )
      );
    });

    it('matches every column of rows 0 to 50', (): void => {
      records.slice(0, 51).forEach((record, index) => {
        const matches =
          JSON.stringify([
            advanceIndex(record.obsoleteBy),
            record.domain,
            record.move,
            record.range,
            record.attack,
            record.defence,
            record.hitPoints,
            record.firepower,
            record.cost,
            record.hold,
            record.role,
            advanceIndex(record.prerequisite),
            record.flags,
          ]) === JSON.stringify(units[index]);

        expect(matches, `row ${index}`).to.true;
      });
    });

    it('names each row by its class, but for the generic names', (): void => {
      unitTypes.forEach((UnitType, index) =>
        expect(
          toSlug(records[index].name).replace(/-/g, '') ===
            UnitType.name.toLowerCase(),
          `row ${index}`
        ).to.equal(!renamed.includes(index))
      );
    });

    it('names each advance a unit needs or loses to by its class', (): void => {
      Object.entries(advanceTypes).forEach(([index, AdvanceType]) =>
        expect(
          toSlug(advances[Number(index)].name).replace(/-/g, '') ===
            AdvanceType.name.toLowerCase(),
          `advance ${index}`
        ).to.equal(!renamedAdvances.includes(Number(index)))
      );
    });
  }
);
