"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AvailableCityBuildItemsRegistry_1 = require("@civ-clone/core-city-build/AvailableCityBuildItemsRegistry");
const unitTable_1 = require("./lib/unitTable");
AvailableCityBuildItemsRegistry_1.instance.register(...unitTable_1.unitTypes);
//# sourceMappingURL=registerAvailableBuildItems.js.map