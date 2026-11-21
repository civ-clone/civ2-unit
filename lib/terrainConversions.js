"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terrainConversions = void 0;
const Actions_1 = require("../Actions");
const Terrains_1 = require("@civ-clone/civ2-world/Terrains");
const TileImprovements_1 = require("@civ-clone/civ2-world/TileImprovements");
/**
 * The terrain each conversion changes, and the order it is given as: `@TERRAIN`'s irrigate and mine results that change
 *  the terrain (`tests/conversions` checks them against civ2-world's table). Each action leaves its own `result`.
 */
exports.terrainConversions = [
    [Actions_1.ClearJungle, TileImprovements_1.Irrigation, Terrains_1.Jungle],
    [Actions_1.ClearForest, TileImprovements_1.Irrigation, Terrains_1.Forest],
    [Actions_1.PlantForest, TileImprovements_1.Mine, Terrains_1.Plains, Terrains_1.Grassland, Terrains_1.Jungle, Terrains_1.Swamp],
    [Actions_1.ClearSwamp, TileImprovements_1.Irrigation, Terrains_1.Swamp],
];
exports.default = exports.terrainConversions;
//# sourceMappingURL=terrainConversions.js.map