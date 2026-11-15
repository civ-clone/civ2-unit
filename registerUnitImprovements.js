"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Aloft_1 = require("@civ-clone/base-unit-fuel/lib/Aloft");
const Fortified_1 = require("@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified");
const MovedThisTurn_1 = require("@civ-clone/base-unit-healing/lib/MovedThisTurn");
const Paradropped_1 = require("@civ-clone/base-unit-action-paradrop/UnitImprovements/Paradropped");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const AvailableUnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/AvailableUnitImprovementRegistry");
// `Aloft` (turns out of fuel), `MovedThisTurn` (no healing) and `Paradropped` are marks a save must be able to name.
AvailableUnitImprovementRegistry_1.instance.register(Fortified_1.default, Veteran_1.default, Aloft_1.default, MovedThisTurn_1.default, Paradropped_1.default);
//# sourceMappingURL=registerUnitImprovements.js.map