"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triremeLossChance = exports.lighthouseDescription = exports.LIGHTHOUSE_DESCRIBED_RULE = void 0;
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RequirementRegistry_1 = require("@civ-clone/core-requirement/RequirementRegistry");
const WonderRegistry_1 = require("@civ-clone/core-wonder/WonderRegistry");
const Description_1 = require("@civ-clone/core-rule/Description");
const Lighthouse_1 = require("@civ-clone/base-wonder-lighthouse/Lighthouse");
const Navigation_1 = require("@civ-clone/base-science-advance-navigation/Navigation");
const Seafaring_1 = require("@civ-clone/base-science-advance-seafaring/Seafaring");
const Trireme_1 = require("@civ-clone/base-unit-trireme/Trireme");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const hasWonder_1 = require("@civ-clone/base-wonder/lib/hasWonder");
/** base-unit-lifecycle's rule that loses a coast-bound ship at sea, which says what the Lighthouse does. */
exports.LIGHTHOUSE_DESCRIBED_RULE = 'civ2-unit:unit/moved/trireme-lost-at-sea';
/**
 * What the Lighthouse does, for the Civilopedia (civ-clone/web-renderer#1291): its owner's coast-bound ships, which
 *  are only Triremes in Civ2's `@UNITS`, are never lost at sea (`triremeLossChance`).
 */
const lighthouseDescription = () => new Description_1.default({
    type: 'protects_from',
    subject: Lighthouse_1.default,
    event: 'lost_at_sea',
    what: 'units',
    unit: Trireme_1.Trireme,
});
exports.lighthouseDescription = lighthouseDescription;
/**
 * The chance a coast-bound ship (the Trireme) ending its move out of sight of land is lost (`unit_move_dir_trireme_loss`):
 *  1 in @COSMIC's 2, the odds doubled with Seafaring (at least 1 in 2) and again with Navigation, and never while its
 *  player has the Lighthouse. The original asks only for the local human's moves; here every player's ships are at
 *  risk (decision 3, survey Q8).
 */
const triremeLossChance = ({ playerResearchRegistry = PlayerResearchRegistry_1.instance, requirementRegistry = RequirementRegistry_1.instance, wonderRegistry = WonderRegistry_1.instance, } = {}) => (unit) => {
    const player = unit.player();
    if ((0, hasWonder_1.playerOwnsWonder)(player, Lighthouse_1.default, wonderRegistry, playerResearchRegistry, requirementRegistry)) {
        return 0;
    }
    const research = playerResearchRegistry.getByPlayer(player);
    let odds = cosmic_1.cosmic.triremeLossChance;
    if (research.completed(Seafaring_1.default)) {
        odds = Math.max(odds * 2, 2);
    }
    if (research.completed(Navigation_1.default)) {
        odds *= 2;
    }
    return odds < 2 ? 1 : 1 / odds;
};
exports.triremeLossChance = triremeLossChance;
exports.default = exports.triremeLossChance;
//# sourceMappingURL=coastBound.js.map