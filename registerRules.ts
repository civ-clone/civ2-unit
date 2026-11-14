import { DEFEND, UnitRow, units } from './data/units';
import { Game, defaultGame } from '@civ-clone/core-game';
import { Pollution } from '@civ-clone/civ2-world/TileImprovements';
import buildRequirements, { obsoletedBy } from './Requirements';
import {
  navalNeedsCoastRule,
  deriveBuildRules,
} from '@civ-clone/base-unit-build/lib/buildRules';
import ActiveUnit from '@civ-clone/base-player-action-active-unit/ActiveUnit';
import Air from '@civ-clone/base-unit-type-air/Air';
import Attack from '@civ-clone/base-unit-action-attack/Attack';
import Disembark from '@civ-clone/base-unit-action-disembark/Disembark';
import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import InactiveUnit from '@civ-clone/base-player-action-inactive-unit/InactiveUnit';
import Land from '@civ-clone/base-unit-type-land/Land';
import Move from '@civ-clone/base-unit-action-move/Move';
import { OBSOLESCENCE } from './RuleSets';
import { Requirement } from '@civ-clone/core-requirement/Requirement';
import RuleSet from '@civ-clone/core-rule/RuleSet';
import { SneakAttack, SneakMove, SneakPillage } from './Actions';
import Unit from '@civ-clone/core-unit/Unit';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import action, { territoryImprovements } from './Rules/Unit/action';
import build from './Rules/City/build';
import buildCost from './Rules/City/buildCost';
import canJoinCity from './Rules/Unit/canJoinCity';
import cityUnitRules from '@civ-clone/base-unit-build/lib/cityUnitRules';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import diplomatRules from '@civ-clone/base-unit-lifecycle/lib/diplomatRules';
import detonatedRules from '@civ-clone/base-unit-lifecycle/lib/detonatedRules';
import homeCity from '@civ-clone/base-unit-build/lib/homeCity';
import manhattanProjectBuilt from './lib/manhattanProject';
import lifecycleRules from '@civ-clone/base-unit-lifecycle/lib/lifecycleRules';
import movedRules from '@civ-clone/base-unit-lifecycle/lib/movedRules';
import movementCost from './Rules/Unit/movementCost';
import roles from './Rules/Unit/roles';
import singleUse from './Rules/Unit/singleUse';
import strength from './Rules/Unit/strength';
import traits from './Rules/Unit/traits';
import treatyPartner from '@civ-clone/base-unit-lifecycle/lib/treatyPartner';
import unitYield from './Rules/Unit/yield';
import { unitTypes } from './lib/unitTable';

/**
 * A land unit short of the moves a step costs (`unit_move_dir`): one that hasn't moved this turn always gets there; one
 *  that has gets there with a chance of its remaining moves over the cost. Only land units roll; any other gets there. Route planning can count on the first, so a
 *  step is worth no more than a turn.
 */
export const shortStep = {
  succeeds: (
    unit: Unit,
    remaining: number,
    movement: number,
    cost: number,
    randomNumberGenerator: () => number
  ): boolean =>
    !(unit instanceof Land) ||
    remaining >= movement ||
    remaining > cost * randomNumberGenerator(),
  expectedCost: (movement: number): number => movement,
};

/** A new city's first defender, if its player asks for one: the defensive units, strongest defence first. */
export const defenders: (typeof Unit)[] = units
  .map((row: UnitRow, index: number): [UnitRow, typeof Unit] => [
    row,
    unitTypes[index],
  ])
  .filter(([[, , , , , , , , , , role]]) => role === DEFEND)
  .sort(([a], [b]) => b[5] - a[5])
  .map(([, UnitType]) => UnitType);

export const register = (game: Game): void => {
  // What each unit type can do and what it's for, first, so that no rule below is asked about a unit before then.
  game.rules.register(...traits(), ...roles());

  const lifecycle = lifecycleRules(
    'civ2-unit',
    {
      cityRegistry: game.cities,
      engine: game.engine,
      randomNumberGenerator: game.rng,
      ruleRegistry: game.rules,
      transportRegistry: game.transports,
      unitImprovementRegistry: game.unitImprovements,
      unitLossRegistry: game.unitLosses,
      unitRegistry: game.units,
    },
    {
      ActiveUnit,
      InactiveUnit,
      removedOnActivate: [Fortified],
      stowable: [Land, Air],
      partnerOf: treatyPartner(territoryImprovements, {
        interactionRegistry: game.interactions,
        tileImprovementRegistry: game.tileImprovements,
        workedTileRegistry: game.workedTiles,
      }),
      shortStep,
    }
  );

  game.rules.register(
    ...action({
      cityGrowthRegistry: game.cityGrowth,
      cityNameRegistry: game.cityNames,
      cityRegistry: game.cities,
      engine: game.engine,
      interactionRegistry: game.interactions,
      pathFinderRegistry: game.pathFinders,
      playerResearchRegistry: game.playerResearch,
      ruleRegistry: game.rules,
      strategyNoteRegistry: game.strategyNotes,
      strategyRegistry: game.strategies,
      terrainFeatureRegistry: game.terrainFeatures,
      tileImprovementRegistry: game.tileImprovements,
      transportRegistry: game.transports,
      turn: game.turn,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
      workedTileRegistry: game.workedTiles,
    }),
    ...lifecycle.activate,
    navalNeedsCoastRule('civ2-unit'),
    ...build({
      clientRegistry: game.clients,
      playerGovernmentRegistry: game.playerGovernments,
      playerResearchRegistry: game.playerResearch,
      manhattanProjectBuilt: manhattanProjectBuilt(
        game.wonders,
        game.cityImprovements
      ),
    })
  );

  // Which units a city may build, from the entries in `Requirements`, through the game's `requirements`.
  game.requirements.add(
    deriveBuildRules(game.playerResearch),
    ...buildRequirements
  );

  // Units going obsolete, as a set a game can switch off.
  game.ruleSets.register(
    new RuleSet(
      OBSOLESCENCE,
      ...obsoletedBy.map((entry: Requirement): string => entry.id)
    )
  );

  const cityUnits = cityUnitRules(
    'civ2-unit',
    {
      buildPreferencesRegistry: game.buildPreferences,
      cityBuildRegistry: game.cityBuilds,
      cityGrowthRegistry: game.cityGrowth,
      cityRegistry: game.cities,
      engine: game.engine,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
    },
    {
      defenders,
      homeCity: homeCity(
        (from, to): number => from.distanceFrom(to),
        game.cities
      ),
      lostWithCity: [Veteran],
      defectingCauses: [],
    }
  );

  const missions = diplomatRules('civ2-unit', {
    engine: game.engine,
    interactionRegistry: game.interactions,
    ruleRegistry: game.rules,
    turn: game.turn,
  });

  game.rules.register(
    ...buildCost(),
    ...cityUnits.buildingComplete,
    ...cityUnits.created,
    ...canJoinCity(game.cityGrowth),
    ...lifecycle.canStow,
    ...lifecycle.created,
    ...lifecycle.defeated,
    ...lifecycle.destroyed,
    ...detonatedRules(
      'civ2-unit',
      {
        cityGrowthRegistry: game.cityGrowth,
        cityRegistry: game.cities,
        engine: game.engine,
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        tileImprovementRegistry: game.tileImprovements,
        unitRegistry: game.units,
      },
      {
        // No SDI Defense in M2a.
        sparesUnits: (): boolean => false,
        Pollution,
        falloutChance: 2 / 3,
      }
    ),
    ...lifecycle.expectedMovementCost,
    ...lifecycle.impassable,
    ...lifecycle.halted,
    ...lifecycle.lostAtSea,
    ...movedRules(
      'civ2-unit',
      {
        cityRegistry: game.cities,
        engine: game.engine,
        interactionRegistry: game.interactions,
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        transportRegistry: game.transports,
        unitRegistry: game.units,
      },
      {
        Move,
        Disembark,
        attacks: [Attack, SneakAttack],
        noVendetta: [SneakMove, SneakPillage],
        coastBoundLoss: 1 / cosmic.triremeLossChance,
      }
    ),
    ...singleUse(),
    ...movementCost(
      game.tileImprovements,
      game.transports,
      game.terrainFeatures,
      game.cities
    ),
    ...lifecycle.playerAction,
    ...lifecycle.stowed,
    ...missions.embassyEstablished,
    ...missions.cityInvestigated,
    ...lifecycle.transferred,
    ...strength({
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      terrainFeatureRegistry: game.terrainFeatures,
      unitImprovementRegistry: game.unitImprovements,
    }),
    ...unitYield(game.unitImprovements, game.rules, game.transports),
    ...lifecycle.unsupported,
    ...lifecycle.validateMove
  );
};

// The plugin loader imports each package for this side effect.
register(defaultGame);

export default register;
