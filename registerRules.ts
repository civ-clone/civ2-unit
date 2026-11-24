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
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import Player from '@civ-clone/core-player/Player';
import SubvertCity from '@civ-clone/base-unit-action-incite-revolt/SubvertCity';
import dependenciesOf from '@civ-clone/civ2-diplomacy/lib/dependenciesOf';
import espionage from './Rules/Unit/espionage';
import missionChoice from './Rules/Unit/missionChoice';
import { inciterBecomesFounder } from '@civ-clone/civ2-city/Rules/City/incited';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import action, {
  partisanPillageOrder,
  pillageOrder,
  pillageable,
  treatyPartnerOf,
} from './Rules/Unit/action';
import forcedWar, { LIFECYCLE_BREAK_TREATY_RULE } from './Rules/Unit/forcedWar';
import Rule from '@civ-clone/core-rule/Rule';
import defeated, { sparesStack } from './Rules/Unit/defeated';
import { Partisan } from './Units';
import airliftShotDown from './Rules/Unit/airlift';
import airliftRules from '@civ-clone/base-unit-action-airlift/lib/airliftRules';
import combat from './Rules/Unit/combat';
import fuel from './Rules/Unit/fuel';
import healing from './Rules/Unit/healing';
import paradropRules from '@civ-clone/base-unit-action-paradrop/lib/paradropRules';
import pillageTarget from '@civ-clone/base-unit-action-pillage/lib/pillageTarget';
import promotion from './Rules/Unit/promotion';
import workRate from './Rules/Unit/workRate';
import build from './Rules/City/build';
import buildCost from './Rules/City/buildCost';
import canJoinCity from './Rules/Unit/canJoinCity';
import created from './Rules/Unit/created';
import cityUnitRules from '@civ-clone/base-unit-build/lib/cityUnitRules';
import diplomatRules from '@civ-clone/base-unit-lifecycle/lib/diplomatRules';
import detonatedRules from '@civ-clone/base-unit-lifecycle/lib/detonatedRules';
import movedRules, {
  adjacentToLand,
} from '@civ-clone/base-unit-lifecycle/lib/movedRules';
import City from '@civ-clone/core-city/City';
import SingleUse from '@civ-clone/base-unit-trait-single-use/SingleUse';
import { describedRule } from './lib/describedRule';
import sdiDefenceVetoes, {
  SDI_DEFENCE_DESCRIBED_RULE,
  sdiDefenceDescription,
} from './lib/sdiDefence';
import triremeLossChance, {
  LIGHTHOUSE_DESCRIBED_RULE,
  lighthouseDescription,
} from './lib/coastBound';
import homeCity from '@civ-clone/base-unit-build/lib/homeCity';
import manhattanProjectBuilt from './lib/manhattanProject';
import lifecycleRules from '@civ-clone/base-unit-lifecycle/lib/lifecycleRules';
import movementCost from './Rules/Unit/movementCost';
import roles from './Rules/Unit/roles';
import singleUse from './Rules/Unit/singleUse';
import strength from './Rules/Unit/strength';
import traits from './Rules/Unit/traits';
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
      turn: game.turn,
      unitImprovementRegistry: game.unitImprovements,
      unitLossRegistry: game.unitLosses,
      unitRegistry: game.units,
    },
    {
      ActiveUnit,
      InactiveUnit,
      removedOnActivate: [Fortified],
      // Missiles go aboard a submarine as a `SingleUse` unit.
      stowable: [Land, Air, SingleUse as unknown as typeof Unit],
      partnerOf: treatyPartnerOf({
        interactionRegistry: game.interactions,
        tileImprovementRegistry: game.tileImprovements,
        workedTileRegistry: game.workedTiles,
      }),
      shortStep,
      sparesStack: sparesStack(game.tileImprovements),
    }
  );

  game.rules.register(
    ...action({
      cityGrowthRegistry: game.cityGrowth,
      clientRegistry: game.clients,
      cityImprovementRegistry: game.cityImprovements,
      cityNameRegistry: game.cityNames,
      cityRegistry: game.cities,
      engine: game.engine,
      interactionRegistry: game.interactions,
      pathFinderRegistry: game.pathFinders,
      pendingEffectRegistry: game.pendingEffects,
      playerGovernmentRegistry: game.playerGovernments,
      playerRegistry: game.players,
      playerResearchRegistry: game.playerResearch,
      playerTreasuryRegistry: game.playerTreasuries,
      randomNumberGenerator: game.rng,
      requirementRegistry: game.requirements,
      ruleRegistry: game.rules,
      strategyNoteRegistry: game.strategyNotes,
      strategyRegistry: game.strategies,
      terrainFeatureRegistry: game.terrainFeatures,
      tileImprovementRegistry: game.tileImprovements,
      transportRegistry: game.transports,
      turn: game.turn,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
      wonderRegistry: game.wonders,
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
      // Units in or beside a city incited to revolt go with it (`city_incite_transfer`, `city.cpp:2252-2275`).
      defectingCauses: [InciteRevolt, SubvertCity],
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
    // The units in or beside a city incited to revolt go with it.
    ...cityUnits.captured,
    ...created({
      playerGovernmentRegistry: game.playerGovernments,
      ruleRegistry: game.rules,
      unitImprovementRegistry: game.unitImprovements,
    }),
    ...canJoinCity(game.cityGrowth),
    ...lifecycle.canStow,
    ...lifecycle.created,
    // Promotion reads both units' strengths before the loser is destroyed (it is `High`, and comes first).
    ...promotion({
      randomNumberGenerator: game.rng,
      ruleRegistry: game.rules,
      unitImprovementRegistry: game.unitImprovements,
    }),
    ...lifecycle.defeated,
    ...defeated({
      cityGrowthRegistry: game.cityGrowth,
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      clientRegistry: game.clients,
      gameDifficultyRegistry: game.difficulty,
      playerResearchRegistry: game.playerResearch,
      requirementRegistry: game.requirements,
      wonderRegistry: game.wonders,
    }),
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
        // SDI Defense stops the missile outright (`vetoes`), rather than sparing a city's units.
        sparesUnits: (): boolean => false,
        Pollution,
        falloutChance: 2 / 3,
        // Another player's city with SDI Defense near the target stops a nuclear missile (`lib/sdiDefence`).
        vetoes: sdiDefenceVetoes({
          cityImprovementRegistry: game.cityImprovements,
          cityRegistry: game.cities,
          engine: game.engine,
        }),
      }
    ).map(
      (rule: Rule): Rule =>
        rule.id() === SDI_DEFENCE_DESCRIBED_RULE
          ? describedRule(rule, sdiDefenceDescription())
          : rule
    ),
    ...lifecycle.expectedMovementCost,
    ...lifecycle.impassable,
    ...lifecycle.halted,
    ...lifecycle.lostAtSea,
    // base-unit-lifecycle's moved rules but its `break-peace-treaty`, which `forcedWar` replaces.
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
        coastBoundLoss: triremeLossChance({
          playerResearchRegistry: game.playerResearch,
          requirementRegistry: game.requirements,
          wonderRegistry: game.wonders,
        }),
        // Out of sight of land: none of the 9 squares, its own included, is land (`unit_move_dir_trireme_loss`).
        nearLand: adjacentToLand,
      }
    )
      .filter(
        (rule: Rule<any, any>): boolean =>
          rule.id() !== LIFECYCLE_BREAK_TREATY_RULE
      )
      .map(
        (rule: Rule<any, any>): Rule<any, any> =>
          rule.id() === LIGHTHOUSE_DESCRIBED_RULE
            ? describedRule(rule, lighthouseDescription())
            : rule
      ),
    ...forcedWar({
      cityRegistry: game.cities,
      diplomacy: dependenciesOf(game),
      clientRegistry: game.clients,
      interactionRegistry: game.interactions,
      playerRegistry: game.players,
      ruleRegistry: game.rules,
      turn: game.turn,
      unitRegistry: game.units,
    }),
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
    // What the Diplomat's and Spy's missions do, and whether the agent survives them.
    ...espionage({
      cityBuildRegistry: game.cityBuilds,
      cityGrowthRegistry: game.cityGrowth,
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      clientRegistry: game.clients,
      diplomacy: dependenciesOf(game),
      engine: game.engine,
      interactionRegistry: game.interactions,
      pendingEffectRegistry: game.pendingEffects,
      playerGovernmentRegistry: game.playerGovernments,
      playerResearchRegistry: game.playerResearch,
      playerTreasuryRegistry: game.playerTreasuries,
      randomNumberGenerator: game.rng,
      ruleRegistry: game.rules,
      transportRegistry: game.transports,
      turn: game.turn,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
      inciterBecomesFounder: (city: City, inciter: Player): void =>
        inciterBecomesFounder(city, inciter, {
          pendingEffectRegistry: game.pendingEffects,
          turn: game.turn,
        }),
    }),
    // A computer player's mission at a city, for the AI client to read.
    ...missionChoice({
      clientRegistry: game.clients,
      diplomacy: dependenciesOf(game),
      pendingEffectRegistry: game.pendingEffects,
      randomNumberGenerator: game.rng,
    }),
    ...lifecycle.transferred,
    ...strength({
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      playerResearchRegistry: game.playerResearch,
      requirementRegistry: game.requirements,
      terrainFeatureRegistry: game.terrainFeatures,
      tileImprovementRegistry: game.tileImprovements,
      unitImprovementRegistry: game.unitImprovements,
      wonderRegistry: game.wonders,
    }),
    // Battles in rounds, their firepower changes and the choice of defender.
    ...combat({
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      playerResearchRegistry: game.playerResearch,
      requirementRegistry: game.requirements,
      ruleRegistry: game.rules,
      terrainFeatureRegistry: game.terrainFeatures,
      tileImprovementRegistry: game.tileImprovements,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
      wonderRegistry: game.wonders,
    }),
    // Healing (`High`, before the turn's moves are given out) and damaged movement.
    ...healing({
      cityImprovementRegistry: game.cityImprovements,
      cityRegistry: game.cities,
      landMassRegistry: game.landMasses,
      tileImprovementRegistry: game.tileImprovements,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
    }),
    ...fuel({
      cityRegistry: game.cities,
      engine: game.engine,
      ruleRegistry: game.rules,
      tileImprovementRegistry: game.tileImprovements,
      transportRegistry: game.transports,
      unitImprovementRegistry: game.unitImprovements,
      unitRegistry: game.units,
    }),
    ...workRate(),
    ...paradropRules('civ2-unit', {
      unitImprovementRegistry: game.unitImprovements,
    }),
    ...airliftRules('civ2-unit', {
      pendingEffectRegistry: game.pendingEffects,
    }),
    pillageTarget('civ2-unit', pillageable, (unit: Unit) =>
      unit instanceof Partisan ? partisanPillageOrder : pillageOrder
    ),
    ...unitYield(game.unitImprovements, game.rules, game.transports),
    ...lifecycle.unsupported,
    ...lifecycle.validateMove
  );
};

// The plugin loader imports each package for this side effect.
register(defaultGame);

export default register;
