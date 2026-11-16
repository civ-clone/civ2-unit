import {
  AbortMove,
  Activate,
  Airlift,
  Attack,
  Automate,
  BuildAirbase,
  BuildFortress,
  BuildFarmland,
  BuildIrrigation,
  BuildMine,
  BuildRailroad,
  BuildRoad,
  CaptureCity,
  CleanPollution,
  ClearForest,
  ClearJungle,
  ClearSwamp,
  Disband,
  Disembark,
  Embark,
  EstablishEmbassy,
  Explore,
  Fortify,
  FoundCity,
  GoTo,
  InvestigateCity,
  JoinCity,
  AlliedRepair,
  UndeclaredAttack,
  UndeclaredNuclearAttack,
  LandAircraft,
  Move,
  NoOrders,
  NuclearAttack,
  Paradrop,
  Pillage,
  PlantForest,
  RailroadTo,
  RoadTo,
  SabotageUnit,
  SetHomeCity,
  Sleep,
  SneakAttack,
  SneakCaptureCity,
  SneakMove,
  SneakNuclearAttack,
  SneakPillage,
  TransformTerrain,
  Unload,
} from '../../Actions';
import {
  AIR,
  CARRIES_AIR,
  DIPLOMACY,
  LAND,
  TRADE,
  UnitRow,
  units,
} from '../../data/units';
import {
  Action,
  hasMovesLeft,
  isNeighbouringTile,
} from '@civ-clone/core-unit/Rules/Action';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityNameRegistry,
  instance as cityNameRegistryInstance,
} from '@civ-clone/core-civilization/CityNameRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  Forest,
  Grassland,
  Jungle,
  Plains,
  Swamp,
} from '@civ-clone/civ2-world/Terrains';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  Airbase,
  Farmland,
  Fortress,
  Irrigation,
  Mine,
  Pollution,
  Railroad,
  Road,
} from '@civ-clone/civ2-world/TileImprovements';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import {
  PathFinderRegistry,
  instance as pathFinderRegistryInstance,
} from '@civ-clone/core-world-path/PathFinderRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  StrategyNoteRegistry,
  instance as strategyNoteRegistryInstance,
} from '@civ-clone/core-strategy/StrategyNoteRegistry';
import {
  StrategyRegistry,
  instance as strategyRegistryInstance,
} from '@civ-clone/core-strategy/StrategyRegistry';
import {
  TerrainFeatureRegistry,
  instance as terrainFeatureRegistryInstance,
} from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import actionRules, {
  ActionRow,
  NamedRow,
  Perform,
} from '@civ-clone/base-unit-action-rules/lib/actionRules';
import {
  attackCriteria as buildAttackCriteria,
  captureCityCriteria as buildCaptureCityCriteria,
} from '@civ-clone/base-unit-action-rules/lib/criteria/attack';
import {
  cleanPollution,
  requiresImprovement,
} from '@civ-clone/base-unit-action-rules/lib/criteria/worker';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Criterion from '@civ-clone/core-rule/Criterion';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import IgnoresZoneOfControl from '@civ-clone/base-unit-trait-ignores-zone-of-control/IgnoresZoneOfControl';
import Land from '@civ-clone/base-unit-type-land/Land';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import Or from '@civ-clone/core-rule/Criteria/Or';
import {
  TreatyLevel,
  hasTreatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import UnitedNations from '@civ-clone/base-wonder-unitednations/UnitedNations';
import {
  RequirementRegistry,
  instance as requirementRegistryInstance,
} from '@civ-clone/core-requirement/RequirementRegistry';
import {
  WonderRegistry,
  instance as wonderRegistryInstance,
} from '@civ-clone/core-wonder/WonderRegistry';
import { playerOwnsWonder } from '@civ-clone/base-wonder/lib/hasWonder';
import senateIntervenes from '@civ-clone/base-government-senate/lib/senate';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import Contact from '@civ-clone/base-diplomacy-interaction-contact/Contact';
import Detonates from '@civ-clone/base-unit-trait-detonates/Detonates';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { treatyLevel } from '@civ-clone/base-diplomacy/lib/treatyLevel';
import { recordTargets } from './forcedWar';
import Player from '@civ-clone/core-player/Player';
import { River } from '@civ-clone/civ2-world/TerrainFeatures';
import RoutePlanner from '@civ-clone/base-unit-action-rules/lib/RoutePlanner';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import { Water } from '@civ-clone/core-terrain/Types';
import {
  diplomat,
  hasNoEmbassy as buildHasNoEmbassy,
} from '@civ-clone/base-unit-action-rules/lib/criteria/diplomat';
import domainMoveCriteria from '@civ-clone/base-unit-action-rules/lib/criteria/move';
import { isA } from '@civ-clone/core-unit/traits';
import { joinableCity } from '@civ-clone/base-unit-action-join-city/joinableCity';
import landing from '@civ-clone/base-unit-action-rules/lib/criteria/landing';
import nuclearCriteria from '@civ-clone/base-unit-action-rules/lib/criteria/nuclear';
import orders from '@civ-clone/base-unit-action-rules/lib/criteria/orders';
import partnerCriteria from '@civ-clone/base-unit-action-rules/lib/criteria/partners';
import peaceCriteria from '@civ-clone/base-unit-action-rules/lib/criteria/peace';
import { pillageCriteria as buildPillageCriteria } from '@civ-clone/base-unit-action-rules/lib/criteria/pillage';
import { tileHasCity } from '@civ-clone/base-unit-action-rules/lib/criteria/domain';
import transport from '@civ-clone/base-unit-action-rules/lib/criteria/transport';
import treatyPartner, {
  TreatyPartnerDependencies,
} from '@civ-clone/base-unit-lifecycle/lib/treatyPartner';
import routeOrders from '../../lib/routeOrders';
import zoneOfControl from '@civ-clone/base-zone-of-control/lib/zoneOfControl';
import Submerged from '@civ-clone/base-unit-trait-submerged/Submerged';
import Interceptor from '@civ-clone/base-unit-trait-interceptor/Interceptor';
import ParadropTrait from '@civ-clone/base-unit-trait-paradrop/Paradrop';
import Covert from '@civ-clone/base-unit-trait-covert/Covert';
import airliftCriteria from '@civ-clone/base-unit-action-airlift/lib/criteria';
import { cosmic } from '@civ-clone/civ2-rules/data/cosmic';
import distance from '../../lib/distance';
import { isLandUnit } from '@civ-clone/base-unit-action-rules/lib/criteria/domain';
import paradropCriteria, {
  hasFullMoves,
} from '@civ-clone/base-unit-action-paradrop/lib/criteria';
import sabotageUnitCriteria from '@civ-clone/base-unit-action-sabotage-unit/lib/criteria';
import { terrainJob } from '@civ-clone/base-unit-action-rules/lib/criteria/worker';
import transformCriteria from '@civ-clone/base-unit-action-transform-terrain/lib/criteria';
import { unitTypes } from '../../lib/unitTable';
import { Engineer } from '../../Units';

/** The tile improvements that make a worked square a treaty partner's land. */
export const territoryImprovements: (typeof TileImprovement)[] = [
  Irrigation,
  Mine,
  Railroad,
  Road,
];

/**
 * What a pillage takes, in the order the original takes it when no target is chosen (`unit_pillage`): farmland (leaving
 *  the irrigation), a mine or irrigation, a fortress or an airbase, the railroad, then the road.
 */
export const pillageOrder: (typeof TileImprovement)[] = [
  Farmland,
  Mine,
  Irrigation,
  Fortress,
  Airbase,
  Railroad,
  Road,
];

/** Partisans take the railroad, then the road, before anything else (`unit_pillage`). */
export const partisanPillageOrder: (typeof TileImprovement)[] = [
  Railroad,
  Road,
  ...pillageOrder.filter(
    (Improvement: typeof TileImprovement): boolean =>
      Improvement !== Railroad && Improvement !== Road
  ),
];

/** Whether `improvement` can be pillaged. */
export const pillageable = (improvement: TileImprovement): boolean =>
  pillageOrder.some(
    (Improvement: typeof TileImprovement): boolean =>
      improvement instanceof Improvement
  );

/** `criteria` less its last, which must be base-unit-action-rules' by-domain `Or`. */
export const withoutDomainTest = (criteria: Criterion[]): Criterion[] => {
  const last = criteria[criteria.length - 1];

  if (!(last instanceof Or)) {
    throw new TypeError(
      "base-unit-action-rules' attack criteria no longer end with their by-domain test."
    );
  }

  return criteria.slice(0, -1);
};

/**
 * Whose land a square is among a unit's treaty partners (base-unit-lifecycle's `treatyPartner`, on
 *  `territoryImprovements`), but never an ally's: moving onto or pillaging an ally's land breaks no treaty.
 */
export const treatyPartnerOf = (
  dependencies: TreatyPartnerDependencies & {
    interactionRegistry: InteractionRegistry;
  }
): ((unit: Unit, tile: Tile) => Player | null) => {
  const partner = treatyPartner(territoryImprovements, dependencies);

  return (unit: Unit, tile: Tile): Player | null => {
    const player = partner(unit, tile);

    return player === null ||
      hasTreatyLevel(dependencies, unit.player(), player, TreatyLevel.Alliance)
      ? null
      : player;
  };
};

// Each unit type's `@UNITS` row, by class.
const rows = new Map<Function, UnitRow>(
  units.map((row: UnitRow, index: number) => [unitTypes[index], row])
);

const rowOf = (unit: Unit): UnitRow | undefined => rows.get(unit.constructor);

export interface ActionDependencies {
  cityGrowthRegistry?: CityGrowthRegistry;
  clientRegistry?: ClientRegistry;
  cityImprovementRegistry?: CityImprovementRegistry;
  cityNameRegistry?: CityNameRegistry;
  cityRegistry?: CityRegistry;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  pathFinderRegistry?: PathFinderRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  requirementRegistry?: RequirementRegistry;
  ruleRegistry?: RuleRegistry;
  strategyNoteRegistry?: StrategyNoteRegistry;
  strategyRegistry?: StrategyRegistry;
  terrainFeatureRegistry?: TerrainFeatureRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  transportRegistry?: TransportRegistry;
  turn?: Turn;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
  wonderRegistry?: WonderRegistry;
  workedTileRegistry?: WorkedTileRegistry;
}

/**
 * Civilization II's unit actions, as base-unit-action-rules' `actionRules('civ2-unit', table)` with civ1-unit's
 *  criteria and Civ2's terrain, in the order a unit is offered them (the AI takes the first). A row that breaks a
 *  treaty (a ceasefire, a peace or an alliance) is gated by the player's Senate (`SenateIntervenes`, which
 *  civ2-diplomacy answers): when it intervenes, the row's `overruled/` form is offered instead (`diplo_confirm_attack`).
 *  An ally is never attacked, its units exert no zone of control, and a unit moving onto its city is repaired there
 *  (`allied-repair`). Of the Diplomat's and Spy's missions, an embassy and an investigation are offered (Civ2's mission
 *  menu, `spy_city_mission_menu`, has no meeting: its option 7, `unit_spy.cpp:211-218`, is a multiplayer game's chat
 *  spying, and talks open from the client); theft, sabotage, revolt and bribery are part 2 of M2d. Help with a wonder
 *  is civ2-wonder's.
 */
export const getRules = ({
  cityGrowthRegistry = cityGrowthRegistryInstance,
  clientRegistry = clientRegistryInstance,
  cityImprovementRegistry = cityImprovementRegistryInstance,
  cityNameRegistry = cityNameRegistryInstance,
  cityRegistry = cityRegistryInstance,
  engine = engineInstance,
  interactionRegistry = interactionRegistryInstance,
  pathFinderRegistry = pathFinderRegistryInstance,
  pendingEffectRegistry = pendingEffectRegistryInstance,
  playerResearchRegistry = playerResearchRegistryInstance,
  requirementRegistry = requirementRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  strategyNoteRegistry = strategyNoteRegistryInstance,
  strategyRegistry = strategyRegistryInstance,
  terrainFeatureRegistry = terrainFeatureRegistryInstance,
  tileImprovementRegistry = tileImprovementRegistryInstance,
  transportRegistry = transportRegistryInstance,
  turn = turnInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
  unitRegistry = unitRegistryInstance,
  wonderRegistry = wonderRegistryInstance,
  workedTileRegistry = workedTileRegistryInstance,
}: ActionDependencies = {}): Action[] => {
  // Allies (`TREATY_ALLIANCE`): one can't attack the other (`diplo_confirm_attack`), its units exert no zone of control
  //  on the other's (`tile_zoc_unit_adjacent`), and its land is no treaty partner's to trespass on.
  const allied = (player: Player, other: Player): boolean =>
      player !== other &&
      hasTreatyLevel(
        { interactionRegistry },
        player,
        other,
        TreatyLevel.Alliance
      ),
    noAllyOnTile = new Criterion((unit: Unit, to: Tile): boolean => {
      const city = cityRegistry.getByTile(to);

      return (
        (city === null || !allied(unit.player(), city.player())) &&
        unitRegistry
          .getByTile(to)
          .every(
            (tileUnit: Unit): boolean =>
              !allied(unit.player(), tileUnit.player())
          )
      );
    }),
    // A row that breaks a treaty: a player whose Senate intervenes (`SenateIntervenes`) is offered its `overruled/`
    //  form instead, which performs an `Overruled` spending `cost` (`diplo_confirm_attack`).
    breaksTreaty = (
      row: NamedRow & { effect: Perform },
      cost?: (unit: Unit, to: Tile, from: Tile) => number,
      blocked: Perform = row.effect
    ): NamedRow => ({
      ...row,
      breaksTreaty: { blocked, cost },
    }),
    // The other players with units on `to`.
    ownersOn = (unit: Unit, to: Tile): Player[] =>
      Array.from(
        new Set(
          unitRegistry
            .getByTile(to)
            .map((tileUnit: Unit): Player => tileUnit.player())
            .filter((player: Player): boolean => player !== unit.player())
        )
      );

  const { landsInCity, landingTransport, canLandAircraft } = landing({
      cityRegistry,
      unitRegistry,
    }),
    // The routes `goto` finds, kept for `road-to` and `railroad-to`, which come after it.
    routePlanner = new RoutePlanner({
      engine,
      pathFinderRegistry,
      ruleRegistry,
      strategyNoteRegistry,
    }),
    {
      atPeace,
      allPeaceExpired,
      allAtPeace,
      ownerPeaceExpired,
      peaceWithOwner,
    } = peaceCriteria({ cityRegistry, interactionRegistry, unitRegistry }),
    // Outside a city or an airbase, a stack with a bomber (an aircraft with a range above 1) can only be attacked by an
    //  interceptor, unless it has a carrier (`unit_move_dir_attack_unit`).
    bomberCover = new Criterion((unit: Unit, to: Tile): boolean => {
      if (
        unit.hasTrait(Interceptor) ||
        tileHasCity(to, cityRegistry) ||
        tileImprovementRegistry
          .getByTile(to)
          .some(
            (improvement: TileImprovement): boolean =>
              improvement instanceof Airbase
          )
      ) {
        return true;
      }

      const stack = unitRegistry.getByTile(to).map(rowOf);

      return (
        !stack.some((row): boolean => row?.[1] === AIR && row[3] > 1) ||
        stack.some((row): boolean => ((row?.[12] ?? 0) & CARRIES_AIR) !== 0)
      );
    }),
    // base-unit-action-rules' attack criteria up to its last, Civ1's by-domain test (a land unit only against a city
    //  or a land unit, an aircraft against an air-only stack only if it's an interceptor), which Civ2 doesn't have
    //  (`unit_move_dir_attack_unit`): what reaches a square may attack it, a land unit on land, a submarine only at
    //  sea, and any aircraft, but for `bomberCover`.
    attackCriteria = [
      ...withoutDomainTest(buildAttackCriteria({ cityRegistry, unitRegistry })),
      new Criterion((unit: Unit, to: Tile): boolean => {
        const row = rowOf(unit);

        if (row === undefined || row[1] === AIR) {
          return true;
        }

        if (row[1] === LAND) {
          return to.isLand();
        }

        return !unit.hasTrait(Submerged) || to.isWater();
      }),
      bomberCover,
    ],
    // A land unit or a Helicopter (an aircraft with no range) takes an empty city; ships and other aircraft can't
    //  (`unit_move_dir_enemy_city`).
    captureCityCriteria = buildCaptureCityCriteria({
      cityRegistry,
      unitRegistry,
    }).map(
      (criterion: Criterion): Criterion =>
        criterion === isLandUnit
          ? new Or(
              isLandUnit,
              new Criterion((unit: Unit): boolean => {
                const row = rowOf(unit);

                return row !== undefined && row[1] === AIR && row[3] === 0;
              })
            )
          : criterion
    ),
    {
      nuclearTargets,
      nuclearAttackCriteria,
      noNuclearTargetAtPeace,
      anyNuclearTargetAtPeace,
    } = nuclearCriteria({ cityRegistry, unitRegistry }, atPeace),
    partnerOf = treatyPartnerOf({
      interactionRegistry,
      tileImprovementRegistry,
      workedTileRegistry,
    }),
    // Not an ally's worked land: pillaging there is refused (`unit_pillage` asks `diplo_confirm_attack`, which refuses
    //  an ally), where moving onto it is free.
    notAlliesLand = ((
      partner = treatyPartner(territoryImprovements, {
        interactionRegistry,
        tileImprovementRegistry,
        workedTileRegistry,
      })
    ) =>
      new Criterion((unit: Unit, to: Tile): boolean => {
        const player = partner(unit, to);

        return player === null || !allied(unit.player(), player);
      }))(),
    {
      movePartner,
      onPartnersLand,
      offPartnersLand,
      pillagingPartnersLand,
      notPillagingPartnersLand,
    } = partnerCriteria({ unitRegistry }, partnerOf),
    pillageCriteria = buildPillageCriteria(
      { tileImprovementRegistry },
      pillageable
    ),
    // Building a fortress or an airbase: never in a city (`unit_terrain_work_finish` builds neither there).
    noCity = new Criterion(
      (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean =>
        !tileHasCity(from, cityRegistry)
    ),
    cityHasAirport = (city: City): boolean =>
      cityImprovementRegistry
        .getByCity(city)
        .some(
          (improvement: CityImprovement): boolean =>
            improvement instanceof Airport
        ),
    // Civ2's zones of control (`unit_move_dir_land_unit_checks`, `tile_in_enemy_zoc`, `tile_zoc_unit_adjacent`): a
    //  land unit that doesn't ignore them may not step from a square next to another player's unit to another such
    //  square. Any unit on land exerts one, whatever it is and whether or not its player is at peace, but an ally's
    //  (`tile_zoc_unit_adjacent` skips `TREATY_ALLIANCE`). A city's square, anyone's, is in no zone; nor is a move onto a square
    //  that holds units, or off a ship.
    moveCriteria = domainMoveCriteria(
      { cityRegistry, unitRegistry },
      zoneOfControl(unitRegistry, {
        exemptMovers: [
          (unit: Unit): boolean => !isA(unit, Land),
          (unit: Unit): boolean => unit.hasTrait(IgnoresZoneOfControl),
        ],
        exerts: (tileUnit: Unit, unit: Unit): boolean =>
          tileUnit.player() !== unit.player() &&
          tileUnit.tile().isLand() &&
          !allied(unit.player(), tileUnit.player()),
        exemptMoves: [
          (unit: Unit, to: Tile): boolean =>
            unitRegistry.getByTile(to).length > 0,
          (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean =>
            !from.isLand() ||
            tileHasCity(from, cityRegistry) ||
            tileHasCity(to, cityRegistry),
        ],
      })
    ),
    // A Diplomat's or Spy's missions to a rival's city, next to it with moves left and not from a ship. Theft and
    //  sabotage wait (M2a deviations). An embassy is once per civilization, and not offered to the owner of the United
    //  Nations (`spy_city_mission_menu`, `unit_spy.cpp:171-172`): only an `Embassy` of the player's own counts, not
    //  the embassy Marco Polo's acts as, so its owner may still make one that outlasts the wonder.
    { diplomatCriteria } = diplomat({ cityRegistry }),
    hasNoEmbassy = buildHasNoEmbassy({ cityRegistry, interactionRegistry }),
    noUnitedNations = new Criterion(
      (unit: Unit): boolean =>
        !playerOwnsWonder(
          unit.player(),
          UnitedNations,
          wonderRegistry,
          playerResearchRegistry,
          requirementRegistry
        )
    ),
    // The owner of the city on `to`.
    cityOwner = (to: Tile): Player | null =>
      cityRegistry.getByTile(to)?.player() ?? null,
    {
      fortifyCriteria,
      sleepCriteria,
      activateCriteria,
      disbandCriteria,
      noOrdersCriteria,
      foundCityCriteria,
      joinCityCriteria,
      setHomeCityCriteria,
      exploreCriteria,
      automateCriteria,
    } = orders({ cityRegistry, ruleRegistry, unitImprovementRegistry }),
    { embarkCriteria, disembarkCriteria, unloadCriteria } = transport({
      transportRegistry,
      unitRegistry,
    }),
    hasRiver = (tile: Tile): boolean =>
      terrainFeatureRegistry
        .getByTerrain(tile.terrain())
        .some((feature: TerrainFeature): boolean => feature instanceof River),
    distant = new Criterion(
      (unit: Unit, to: Tile, from: Tile): boolean =>
        to !== from && !to.isNeighbourOf(from)
    );

  return actionRules(
    'civ2-unit',
    [
      // The Diplomat's missions first, as civ1-unit's: a computer player takes the first action it's offered.
      {
        name: 'establish-embassy',
        criteria: [...diplomatCriteria, hasNoEmbassy, noUnitedNations],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new EstablishEmbassy(
            from,
            to,
            unit,
            cityRegistry.getByTile(to)!,
            ruleRegistry
          ) as UnitAction,
      },

      {
        name: 'investigate-city',
        criteria: [...diplomatCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new InvestigateCity(
            from,
            to,
            unit,
            cityRegistry.getByTile(to)!,
            ruleRegistry
          ) as UnitAction,
      },

      // A Spy's mission against another player's lone unit outside a city (`spy_unit_mission`): it loses half its hit
      //  points. A veteran Spy escapes at twice the odds, and an escaped one becomes a veteran (`spy_try_escape`).
      {
        name: 'sabotage-unit',
        criteria: [
          ...sabotageUnitCriteria(
            { cityRegistry, unitRegistry },
            (unit: Unit): boolean => unit.hasTrait(Covert)
          ),
          allPeaceExpired,
        ],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new SabotageUnit(
            from,
            to,
            unit,
            ruleRegistry,
            unitRegistry,
            cityRegistry,
            undefined,
            {
              escapeOdds: (spy: Unit): number =>
                unitImprovementRegistry
                  .getByUnit(spy)
                  .some((improvement) => improvement instanceof Veteran)
                  ? 4
                  : 2,
              escaped: (spy: Unit): void => {
                if (
                  !unitImprovementRegistry
                    .getByUnit(spy)
                    .some((improvement) => improvement instanceof Veteran)
                ) {
                  unitImprovementRegistry.register(new Veteran(spy));
                }
              },
            }
          ) as UnitAction,
      },

      // Before `move`, so it's the first action for a square an aircraft can land on.
      {
        name: 'land-aircraft',
        criteria: [
          isNeighbouringTile,
          hasMovesLeft,
          new Criterion((unit: Unit, to: Tile): boolean =>
            canLandAircraft(unit, to)
          ),
          new Criterion((unit: Unit, to: Tile): boolean =>
            unitRegistry
              .getByTile(to)
              .every(
                (tileUnit: Unit): boolean => tileUnit.player() === unit.player()
              )
          ),
        ],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new LandAircraft(
            from,
            to,
            unit,
            landsInCity(unit, to) ? null : landingTransport(unit, to),
            ruleRegistry
          ) as UnitAction,
      },

      // A land unit onto an ally's city: it doesn't go in, but is repaired a tenth of its hit points (a fifth if the city
      //  has Barracks), at most its damage, and its turn ends (`unit_move_dir_land_unit_checks`,
      //  `unit_move.cpp:803-830`). Not a Diplomat, a Spy, a Caravan or Freight, whose own moves into a city come first
      //  (`unit_move.cpp:778-800`), nor a ship or an aircraft, which don't reach it.
      {
        name: 'allied-repair',
        criteria: [
          isNeighbouringTile,
          hasMovesLeft,
          new Criterion((unit: Unit): boolean => {
            const row = rowOf(unit);

            return (
              row !== undefined &&
              row[1] === LAND &&
              row[10] !== DIPLOMACY &&
              row[10] !== TRADE
            );
          }),
          new Criterion((unit: Unit, to: Tile): boolean => {
            const owner = cityOwner(to);

            return owner !== null && allied(unit.player(), owner);
          }),
        ],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new AlliedRepair(
            from,
            to,
            unit,
            cityRegistry.getByTile(to)!,
            cityImprovementRegistry
              .getByCity(cityRegistry.getByTile(to)!)
              .some(
                (improvement: CityImprovement): boolean =>
                  improvement instanceof Barracks
              )
              ? 2
              : 1,
            unitImprovementRegistry,
            ruleRegistry
          ) as UnitAction,
      },

      {
        name: 'move',
        criteria: [...moveCriteria, offPartnersLand],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Move(from, to, unit, ruleRegistry) as UnitAction,
      },

      // Onto a treaty partner's land: it breaks the treaty, unless the player's Senate overrules it, which spends the
      //  move's cost as civ1-unit's does.
      breaksTreaty(
        {
          name: 'sneak-move',
          criteria: [onPartnersLand, ...moveCriteria],
          effect: (
            unit: Unit,
            to: Tile,
            from: Tile = unit.tile()
          ): UnitAction =>
            new SneakMove(
              from,
              to,
              unit,
              movePartner(unit, to, from)!,
              ruleRegistry
            ) as UnitAction,
        },
        (unit: Unit, to: Tile, from: Tile): number =>
          new Move(from, to, unit, ruleRegistry).movementCost()
      ),

      {
        name: 'abort-move',
        criteria: [onPartnersLand, ...moveCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new AbortMove(
            from,
            to,
            unit,
            movePartner(unit, to, from)!,
            ruleRegistry
          ) as UnitAction,
      },

      // Civ1's resolver: base-unit-action-attack's `Attack`, with Civ2's strengths (`strength`).
      breaksTreaty(
        {
          name: 'attack',
          criteria: [...attackCriteria, allPeaceExpired],
          effect: (
            unit: Unit,
            to: Tile,
            from: Tile = unit.tile()
          ): UnitAction =>
            recordTargets(
              new Attack(from, to, unit, ruleRegistry, unitRegistry),
              ownersOn(unit, to)
            ),
        },
        // A person attacking a player it has met and isn't at war with: the Senate may stop it (`diplo_confirm_attack`,
        //  `unit_combat.cpp:1525`), which is offered as a blocked `UndeclaredAttack`, so a client can tell it from
        //  breaking a treaty.
        undefined,
        (unit: Unit, to: Tile, from: Tile): UnitAction =>
          new UndeclaredAttack(
            from,
            to,
            unit,
            ownersOn(unit, to)[0],
            ruleRegistry,
            unitRegistry
          ) as UnitAction
      ),

      // Across a treaty: never against an ally (`diplo_confirm_attack`), and the player's Senate may overrule it.
      breaksTreaty({
        name: 'sneak-attack',
        criteria: [...attackCriteria, allAtPeace, noAllyOnTile],
        effect: (
          unit: Unit,
          to: Tile,
          from: Tile = unit.tile()
        ): UnitAction => {
          // The treaty partner the attack breaks with: a ceasefire counts, as a peace does (`atPeace`).
          const [enemy] = unitRegistry
            .getByTile(to)
            .map((tileUnit: Unit): Player => tileUnit.player())
            .filter((player: Player): boolean =>
              atPeace(unit.player(), player)
            );

          return recordTargets(
            new SneakAttack(from, to, unit, enemy, ruleRegistry, unitRegistry),
            ownersOn(unit, to)
          ) as UnitAction;
        },
      }),

      breaksTreaty(
        {
          name: 'nuclear-attack',
          criteria: [...nuclearAttackCriteria, noNuclearTargetAtPeace],
          effect: (
            unit: Unit,
            to: Tile,
            from: Tile = unit.tile()
          ): UnitAction =>
            // Only the owners of the units there are attacked: one on an empty city is no battle, and starts no war
            //  (`unit_move.cpp:1086` goes straight to `unit_nuclear_attack`).
            recordTargets(
              new NuclearAttack(from, to, unit, ruleRegistry),
              ownersOn(unit, to)
            ) as UnitAction,
        },
        undefined,
        (unit: Unit, to: Tile, from: Tile): UnitAction =>
          new UndeclaredNuclearAttack(
            from,
            to,
            unit,
            ownersOn(unit, to)[0],
            ruleRegistry
          ) as UnitAction
      ),

      breaksTreaty({
        name: 'sneak-nuclear-attack',
        criteria: [
          ...nuclearAttackCriteria,
          anyNuclearTargetAtPeace,
          new Criterion((unit: Unit, to: Tile): boolean =>
            nuclearTargets(unit, to).every(
              (player: Player): boolean => !allied(unit.player(), player)
            )
          ),
        ],
        effect: (
          unit: Unit,
          to: Tile,
          from: Tile = unit.tile()
        ): UnitAction => {
          const [enemy] = nuclearTargets(unit, to).filter(
            (player: Player): boolean => atPeace(unit.player(), player)
          );

          return recordTargets(
            new SneakNuclearAttack(from, to, unit, enemy, ruleRegistry),
            ownersOn(unit, to)
          ) as UnitAction;
        },
      }),

      // With no treaty, the Senate isn't asked: entering a city asks only across a ceasefire, a peace or an alliance
      //  (`diplo_confirm_attack`'s mask 0xe, `unit_move.cpp:1099-1106`).
      {
        name: 'capture-city',
        criteria: [...captureCityCriteria, ownerPeaceExpired],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new CaptureCity(
            from,
            to,
            unit,
            cityRegistry.getByTile(to)!,
            ruleRegistry
          ) as UnitAction,
      },

      // Across a treaty, a person only: a computer player's unit stops short (`unit_move.cpp:1099-1103`).
      breaksTreaty({
        name: 'sneak-capture-city',
        criteria: [
          ...captureCityCriteria,
          peaceWithOwner,
          noAllyOnTile,
          new Criterion((unit: Unit): boolean =>
            isHuman(unit.player(), clientRegistry)
          ),
        ],
        effect: (
          unit: Unit,
          to: Tile,
          from: Tile = unit.tile()
        ): UnitAction => {
          const city = cityRegistry.getByTile(to)!;

          return new SneakCaptureCity(
            from,
            to,
            unit,
            city,
            city.player(),
            ruleRegistry
          ) as UnitAction;
        },
      }),

      // Paratroopers from a city or an airbase, with no moves used, onto land within @COSMIC's range by `map_distance`
      //  with no other player's unit on it, and not into the city of a player at peace (`unit_cmd_paradrop`,
      //  `unit_paradrop`; the original asks a human to confirm that, and has a computer player give up).
      {
        name: 'paradrop',
        criteria: [
          ...paradropCriteria(
            { unitImprovementRegistry, unitRegistry },
            {
              canParadrop: (unit: Unit): boolean =>
                unit.hasTrait(ParadropTrait),
              canDropFrom: (unit: Unit, from: Tile): boolean =>
                tileHasCity(from, cityRegistry) ||
                tileImprovementRegistry
                  .getByTile(from)
                  .some(
                    (improvement: TileImprovement): boolean =>
                      improvement instanceof Airbase
                  ),
              range: cosmic.paradropRange,
              distance,
              hasFullMoves,
            }
          ),
          new Criterion(
            (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean => {
              const city = cityRegistry.getByTile(to);

              return (
                city === null ||
                city.player() === unit.player() ||
                !peaceWithOwner.validate(unit, to, from)
              );
            }
          ),
        ],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Paradrop(
            from,
            to,
            unit,
            ruleRegistry,
            cityRegistry,
            unitImprovementRegistry
          ) as UnitAction,
      },

      // A land unit between two of its player's cities with an Airport, each airlifting once a turn
      //  (`unit_cmd_airlift`, `unit_airlift_perform`).
      {
        name: 'airlift',
        criteria: airliftCriteria(
          { cityRegistry, pendingEffectRegistry, turn },
          {
            canAirlift: (unit: Unit): boolean => rowOf(unit)?.[1] === LAND,
            canAirliftFrom: cityHasAirport,
          }
        ),
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Airlift(
            from,
            to,
            unit,
            ruleRegistry,
            cityRegistry,
            pendingEffectRegistry,
            turn
          ) as UnitAction,
      },

      {
        name: 'pillage',
        criteria: [...pillageCriteria, notPillagingPartnersLand, notAlliesLand],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Pillage(
            from,
            to,
            unit,
            ruleRegistry,
            tileImprovementRegistry,
            turn
          ),
      },

      breaksTreaty({
        name: 'sneak-pillage',
        criteria: [...pillageCriteria, pillagingPartnersLand],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new SneakPillage(
            from,
            to,
            unit,
            partnerOf(unit, to)!,
            ruleRegistry,
            tileImprovementRegistry,
            turn
          ) as UnitAction,
      }),

      {
        name: 'fortify',
        criteria: [...fortifyCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Fortify(
            from,
            to,
            unit,
            ruleRegistry,
            turn,
            unitImprovementRegistry
          ),
      },

      {
        name: 'sleep',
        criteria: [...sleepCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Sleep(from, to, unit, ruleRegistry, turn),
      },

      {
        name: 'activate',
        criteria: [...activateCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Activate(from, to, unit, ruleRegistry),
      },

      {
        name: 'disband',
        criteria: [...disbandCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Disband(from, to, unit, ruleRegistry),
      },

      {
        name: 'no-orders',
        criteria: [...noOrdersCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new NoOrders(from, to, unit, ruleRegistry),
      },

      {
        name: 'found-city',
        criteria: [...foundCityCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new FoundCity(
            from,
            to,
            unit,
            cityNameRegistry,
            ruleRegistry,
            workedTileRegistry
          ),
      },

      {
        name: 'join-city',
        criteria: [...joinCityCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new JoinCity(
            from,
            to,
            unit,
            joinableCity(unit, from, cityRegistry, ruleRegistry)!,
            ruleRegistry,
            cityGrowthRegistry
          ),
      },

      // The improvements a unit builds, each with the action that builds it and what else it needs. Which terrain may
      //  have which is civ2-world's (`@TERRAIN`).
      ...(
        [
          [
            Irrigation,
            BuildIrrigation,
            // Water nearby: a river on the square or beside it, the sea beside it, or irrigated land beside it that
            //  isn't a city. civ1-unit's test with civ2-world's River feature; Civ2's own adjacency is not checked.
            new Or(
              new Criterion(
                (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean =>
                  hasRiver(from)
              ),
              new Criterion(
                (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean =>
                  from
                    .getAdjacent()
                    .some(
                      (tile: Tile): boolean =>
                        hasRiver(tile) ||
                        tile.terrain() instanceof Water ||
                        (tileImprovementRegistry
                          .getByTile(tile)
                          .some(
                            (improvement: TileImprovement): boolean =>
                              improvement instanceof Irrigation
                          ) &&
                          !tileHasCity(tile, cityRegistry))
                    )
              )
            ),
          ],
          // The irrigation order on an irrigated square (`unit_cmd_terraform` order 6): civ2-world's `Available` rule
          //  holds the rest (Refrigeration, water, no city, not farmland already). Irrigation is offered only where
          //  there is none, so a unit is never offered both; a client puts this under the irrigation key.
          [
            Farmland,
            BuildFarmland,
            requiresImprovement({ tileImprovementRegistry }, Irrigation),
          ],
          [Mine, BuildMine],
          [Road, BuildRoad],
          [
            Railroad,
            BuildRailroad,
            requiresImprovement({ tileImprovementRegistry }, Road),
          ],
          [Fortress, BuildFortress, noCity],
          [Airbase, BuildAirbase, noCity],
        ] as [typeof TileImprovement, typeof DelayedAction, ...Criterion[]][]
      ).map(
        ([Improvement, ActionType, ...extra]: [
          typeof TileImprovement,
          typeof DelayedAction,
          ...Criterion[]
        ]): ActionRow => ({
          improvement: Improvement,
          extra,
          effect: (
            unit: Unit,
            to: Tile,
            from: Tile = unit.tile()
          ): UnitAction => new ActionType(from, to, unit, ruleRegistry, turn),
        })
      ),

      // The terrain each conversion changes: `@TERRAIN`'s irrigate and mine results that change the terrain
      //  (`tests/conversions` checks them against civ2-world's table).
      ...(
        [
          [ClearJungle, Jungle],
          [ClearForest, Forest],
          [PlantForest, Plains, Grassland, Jungle, Swamp],
          [ClearSwamp, Swamp],
        ] as [
          (
            | typeof ClearJungle
            | typeof ClearForest
            | typeof PlantForest
            | typeof ClearSwamp
          ),
          ...(typeof Terrain)[]
        ][]
      ).map(
        ([ActionType, ...terrains]): ActionRow => ({
          conversion: ActionType,
          terrains,
          effect: (
            unit: Unit,
            to: Tile,
            from: Tile = unit.tile()
          ): UnitAction =>
            new ActionType(
              from,
              to,
              unit,
              ruleRegistry,
              terrainFeatureRegistry,
              turn
            ),
        })
      ),

      // Engineers transform their square's terrain, to what civ2-world's `TerrainConversion` rules say.
      {
        name: 'transform-terrain',
        criteria: transformCriteria(
          { ruleRegistry },
          (unit: Unit): boolean => unit instanceof Engineer
        ),
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new TransformTerrain(from, to, unit, ruleRegistry, turn),
      },

      {
        name: 'clean-pollution',
        criteria: cleanPollution({ tileImprovementRegistry }, Pollution),
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new CleanPollution(
            from,
            to,
            unit,
            ruleRegistry,
            tileImprovementRegistry,
            turn
          ),
      },

      {
        name: 'embark',
        criteria: [...embarkCriteria],
        effect: (
          unit: Unit,
          to: Tile,
          from: Tile = unit.tile()
        ): UnitAction => {
          const [carrier] = unitRegistry
            .getByTile(to)
            .filter(
              (tileUnit: Unit): boolean =>
                tileUnit instanceof NavalTransport &&
                tileUnit.hasCapacity() &&
                tileUnit.canStow(unit)
            );

          return new Embark(
            from,
            to,
            unit,
            carrier as unknown as ITransport,
            ruleRegistry
          ) as UnitAction;
        },
      },

      {
        name: 'disembark',
        criteria: [...disembarkCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Disembark(
            from,
            to,
            unit,
            transportRegistry.getByUnit(unit).transport(),
            ruleRegistry
          ) as UnitAction,
      },

      {
        name: 'unload',
        criteria: [...unloadCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Unload(from, to, unit, ruleRegistry),
      },

      // Before `road-to` and `railroad-to`, which reuse the route it finds.
      {
        name: 'goto',
        criteria: [hasMovesLeft, distant, routePlanner.goTo()],
        effect: routePlanner.goToEffect(GoTo),
      },

      ...(
        [
          [RoadTo, 'road-to'],
          [RailroadTo, 'railroad-to'],
        ] as [typeof RoadTo | typeof RailroadTo, string][]
      ).map(
        ([RouteAction, name]): ActionRow => ({
          name,
          criteria: [
            hasMovesLeft,
            distant,
            new Criterion((unit: Unit): boolean =>
              routeOrders(unit, playerResearchRegistry).includes(RouteAction)
            ),
            routePlanner.route(),
          ],
          effect: routePlanner.routeEffect(RouteAction),
        })
      ),

      {
        name: 'set-home-city',
        criteria: [...setHomeCityCriteria],
        effect: (unit: Unit, to: Tile, from: Tile): UnitAction =>
          new SetHomeCity(from, to, unit, ruleRegistry, cityRegistry),
      },

      {
        name: 'explore',
        criteria: [...exploreCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Explore(
            from,
            to,
            unit,
            ruleRegistry,
            strategyRegistry,
            strategyNoteRegistry,
            { pathFinderRegistry, unitRegistry }
          ),
      },

      {
        name: 'automate',
        criteria: [...automateCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Automate(
            from,
            to,
            unit,
            ruleRegistry,
            strategyRegistry,
            strategyNoteRegistry,
            { pathFinderRegistry, unitRegistry }
          ),
      },
    ],
    {
      ruleRegistry,
      // The treaty partner is the owner of the city or units on the target square, or else the player whose worked
      //  land it is. Civ2's Senate (civ2-diplomacy's `SenateIntervenes` rule) reads who it is.
      //  Across a ceasefire, a peace or an alliance it is always asked (mask 0xe: a capture, a paradrop, a pillage, a
      //  move). In a battle it is also asked of a person attacking a player it has met and isn't at war with
      //  (`diplo_confirm_attack`'s mask 0xd, asked for persons only, `unit_combat.cpp:1524-1525`); at war, never.
      hasSenate: (
        player: Player,
        other: Player | null,
        unit: Unit,
        to: Tile
      ): boolean => {
        const partner = other ?? partnerOf(unit, to);

        if (partner === null) {
          return false;
        }

        const level = treatyLevel({ interactionRegistry }, player, partner),
          // A battle: another player's units on the square. A nuclear attack on an empty city is none, and isn't
          //  asked about (`unit_move.cpp:1086` → `unit_nuclear_attack`).
          battle = ownersOn(unit, to).length > 0;

        if (unit.hasTrait(Detonates) && !battle) {
          return false;
        }

        if (
          level < TreatyLevel.Ceasefire &&
          (!battle ||
            level === TreatyLevel.War ||
            !isHuman(player, clientRegistry) ||
            !interactionRegistry
              .getByPlayers(player, partner)
              .some((interaction) => interaction instanceof Contact))
        ) {
          return false;
        }

        return senateIntervenes(
          player,
          partner,
          { reason: 'break-treaty' },
          ruleRegistry
        );
      },
      cityRegistry,
      unitRegistry,
    }
  );
};

export default getRules;
