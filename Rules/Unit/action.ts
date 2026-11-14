import {
  AbortMove,
  Activate,
  Attack,
  Automate,
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
  LandAircraft,
  MeetWithLeader,
  Move,
  NoOrders,
  NuclearAttack,
  Pillage,
  PlantForest,
  RailroadTo,
  RoadTo,
  SetHomeCity,
  Sleep,
  SneakAttack,
  SneakCaptureCity,
  SneakMove,
  SneakNuclearAttack,
  SneakPillage,
  Unload,
} from '../../Actions';
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
  Irrigation,
  Mine,
  Pollution,
  Railroad,
  Road,
} from '@civ-clone/civ2-world/TileImprovements';
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
} from '@civ-clone/base-unit-action-rules/lib/actionRules';
import {
  attackCriteria as buildAttackCriteria,
  captureCityCriteria as buildCaptureCityCriteria,
} from '@civ-clone/base-unit-action-rules/lib/criteria/attack';
import {
  cleanPollution,
  requiresImprovement,
} from '@civ-clone/base-unit-action-rules/lib/criteria/worker';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import IgnoresZoneOfControl from '@civ-clone/base-unit-trait-ignores-zone-of-control/IgnoresZoneOfControl';
import Land from '@civ-clone/base-unit-type-land/Land';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import Or from '@civ-clone/core-rule/Criteria/Or';
import { Peace } from '@civ-clone/library-diplomacy/Declarations';
import Player from '@civ-clone/core-player/Player';
import { River } from '@civ-clone/civ2-world/TerrainFeatures';
import RoutePlanner from '@civ-clone/base-unit-action-rules/lib/RoutePlanner';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
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
import treatyPartner from '@civ-clone/base-unit-lifecycle/lib/treatyPartner';
import routeOrders from '../../lib/routeOrders';
import zoneOfControl from '@civ-clone/base-zone-of-control/lib/zoneOfControl';

/** The tile improvements that make a worked square a treaty partner's land, and that pillage takes. */
export const territoryImprovements: (typeof TileImprovement)[] = [
  Irrigation,
  Mine,
  Railroad,
  Road,
];

export interface ActionDependencies {
  cityGrowthRegistry?: CityGrowthRegistry;
  cityNameRegistry?: CityNameRegistry;
  cityRegistry?: CityRegistry;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  pathFinderRegistry?: PathFinderRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  ruleRegistry?: RuleRegistry;
  strategyNoteRegistry?: StrategyNoteRegistry;
  strategyRegistry?: StrategyRegistry;
  terrainFeatureRegistry?: TerrainFeatureRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  transportRegistry?: TransportRegistry;
  turn?: Turn;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
  workedTileRegistry?: WorkedTileRegistry;
}

/**
 * Civilization II's unit actions, as base-unit-action-rules' `actionRules('civ2-unit', table)` with civ1-unit's
 *  criteria and Civ2's terrain, in the order a unit is offered them (the AI takes the first). There is no Senate, so no
 *  row is gated and no `overruled/` form is made: a treaty-breaking row is offered as it is. Of the Diplomat's and Spy's
 *  missions, only an embassy, an investigation and a meeting are offered; theft, sabotage, revolt and bribery, and the
 *  Caravan's and Freight's trade routes and help with a wonder, are M2a deviations.
 */
export const getRules = ({
  cityGrowthRegistry = cityGrowthRegistryInstance,
  cityNameRegistry = cityNameRegistryInstance,
  cityRegistry = cityRegistryInstance,
  engine = engineInstance,
  interactionRegistry = interactionRegistryInstance,
  pathFinderRegistry = pathFinderRegistryInstance,
  playerResearchRegistry = playerResearchRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  strategyNoteRegistry = strategyNoteRegistryInstance,
  strategyRegistry = strategyRegistryInstance,
  terrainFeatureRegistry = terrainFeatureRegistryInstance,
  tileImprovementRegistry = tileImprovementRegistryInstance,
  transportRegistry = transportRegistryInstance,
  turn = turnInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
  unitRegistry = unitRegistryInstance,
  workedTileRegistry = workedTileRegistryInstance,
}: ActionDependencies = {}): Action[] => {
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
    attackCriteria = buildAttackCriteria({ cityRegistry, unitRegistry }),
    captureCityCriteria = buildCaptureCityCriteria({
      cityRegistry,
      unitRegistry,
    }),
    {
      nuclearTargets,
      nuclearAttackCriteria,
      noNuclearTargetAtPeace,
      anyNuclearTargetAtPeace,
    } = nuclearCriteria({ cityRegistry, unitRegistry }, atPeace),
    partnerOf = treatyPartner(territoryImprovements, {
      interactionRegistry,
      tileImprovementRegistry,
      workedTileRegistry,
    }),
    {
      movePartner,
      onPartnersLand,
      offPartnersLand,
      pillagingPartnersLand,
      notPillagingPartnersLand,
    } = partnerCriteria({ unitRegistry }, partnerOf),
    pillageCriteria = buildPillageCriteria(
      { tileImprovementRegistry },
      (improvement: TileImprovement): boolean =>
        territoryImprovements.some(
          (Improvement: typeof TileImprovement): boolean =>
            improvement instanceof Improvement
        )
    ),
    // Civ2's zones of control (`unit_move_dir_land_unit_checks`, `tile_in_enemy_zoc`, `tile_zoc_unit_adjacent`): a
    //  land unit that doesn't ignore them may not step from a square next to another player's unit to another such
    //  square. Any unit on land exerts one, whatever it is and whether or not its player is at peace (only an alliance,
    //  which M2a doesn't have, would stop it). A city's square, anyone's, is in no zone; nor is a move onto a square
    //  that holds units, or off a ship.
    moveCriteria = domainMoveCriteria(
      { cityRegistry, unitRegistry },
      zoneOfControl(unitRegistry, {
        exemptMovers: [
          (unit: Unit): boolean => !isA(unit, Land),
          (unit: Unit): boolean => unit.hasTrait(IgnoresZoneOfControl),
        ],
        exerts: (tileUnit: Unit, unit: Unit): boolean =>
          tileUnit.player() !== unit.player() && tileUnit.tile().isLand(),
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
    //  sabotage wait (M2a deviations); an embassy is once per civilization.
    { diplomatCriteria } = diplomat({ cityRegistry }),
    hasNoEmbassy = buildHasNoEmbassy({ cityRegistry, interactionRegistry }),
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
        criteria: [...diplomatCriteria, hasNoEmbassy],
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

      // The Diplomat stays, with no moves left.
      {
        name: 'meet-with-leader',
        criteria: [...diplomatCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new MeetWithLeader(
            from,
            to,
            unit,
            cityRegistry.getByTile(to)!.player(),
            ruleRegistry
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

      {
        name: 'move',
        criteria: [...moveCriteria, offPartnersLand],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Move(from, to, unit, ruleRegistry) as UnitAction,
      },

      // Onto a treaty partner's land: it breaks the treaty. With no Senate in M2a, nothing overrules it.
      {
        name: 'sneak-move',
        criteria: [onPartnersLand, ...moveCriteria],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new SneakMove(
            from,
            to,
            unit,
            movePartner(unit, to, from)!,
            ruleRegistry
          ) as UnitAction,
      },

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
      {
        name: 'attack',
        criteria: [...attackCriteria, allPeaceExpired],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new Attack(from, to, unit, ruleRegistry, unitRegistry),
      },

      {
        name: 'sneak-attack',
        criteria: [...attackCriteria, allAtPeace],
        effect: (
          unit: Unit,
          to: Tile,
          from: Tile = unit.tile()
        ): UnitAction => {
          const [enemy] = unitRegistry
            .getByTile(to)
            .map((tileUnit: Unit): Player => tileUnit.player())
            .filter((player: Player): boolean =>
              interactionRegistry
                .getByPlayers(unit.player(), player)
                .some(
                  (interaction): interaction is Peace =>
                    interaction instanceof Peace && interaction.active()
                )
            );

          return new SneakAttack(
            from,
            to,
            unit,
            enemy,
            ruleRegistry,
            unitRegistry
          ) as UnitAction;
        },
      },

      {
        name: 'nuclear-attack',
        criteria: [...nuclearAttackCriteria, noNuclearTargetAtPeace],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new NuclearAttack(from, to, unit, ruleRegistry) as UnitAction,
      },

      {
        name: 'sneak-nuclear-attack',
        criteria: [...nuclearAttackCriteria, anyNuclearTargetAtPeace],
        effect: (
          unit: Unit,
          to: Tile,
          from: Tile = unit.tile()
        ): UnitAction => {
          const [enemy] = nuclearTargets(unit, to).filter(
            (player: Player): boolean => atPeace(unit.player(), player)
          );

          return new SneakNuclearAttack(
            from,
            to,
            unit,
            enemy,
            ruleRegistry
          ) as UnitAction;
        },
      },

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

      {
        name: 'sneak-capture-city',
        criteria: [...captureCityCriteria, peaceWithOwner],
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
      },

      {
        name: 'pillage',
        criteria: [...pillageCriteria, notPillagingPartnersLand],
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

      {
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
      },

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
          [Mine, BuildMine],
          [Road, BuildRoad],
          [
            Railroad,
            BuildRailroad,
            requiresImprovement({ tileImprovementRegistry }, Road),
          ],
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
    { ruleRegistry }
  );
};

export default getRules;
