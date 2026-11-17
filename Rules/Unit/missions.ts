import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerRegistry } from '@civ-clone/core-player/PlayerRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTreasuryRegistry } from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import {
  DOUBLED_PRICE_BELOW,
  bribeCost,
  inciteCost,
  isSpy,
  isTradeUnit,
  isSettlerRole,
  isVeteran,
  unitRow,
} from '../../lib/espionage';
import { Engine } from '@civ-clone/core-engine/Engine';
import {
  TreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import {
  bribeUnitCriteria,
  diplomat,
  hasNoEmbassy as buildHasNoEmbassy,
} from '@civ-clone/base-unit-action-rules/lib/criteria/diplomat';
import {
  distanceFromPalace,
  palaceTiles,
} from '@civ-clone/base-unit-agent/lib/distanceFromPalace';
import {
  hasMovesLeft,
  isNeighbouringTile,
} from '@civ-clone/core-unit/Rules/Action';
import {
  SneakIndustrialSabotage,
  SneakPoisonWater,
} from '../../lib/SneakMissions';
import { CIVIL_DISORDER } from '@civ-clone/civ2-city/lib/chooseProductionState';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Communism from '@civ-clone/base-government-communism/Communism';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import Covert from '@civ-clone/base-unit-trait-covert/Covert';
import Criterion from '@civ-clone/core-rule/Criterion';
import Democracy from '@civ-clone/base-government-democracy/Democracy';
import EstablishEmbassy from '@civ-clone/base-unit-action-establish-embassy/EstablishEmbassy';
import EstablishTradeRoute from '@civ-clone/base-unit-action-establish-trade-route/EstablishTradeRoute';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import Government from '@civ-clone/core-government/Government';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import IndustrialSabotage from '@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage';
import InvestigateCity from '@civ-clone/base-unit-action-investigate-city/InvestigateCity';
import { NamedRow } from '@civ-clone/base-unit-action-rules/lib/actionRules';
import NuclearFission from '@civ-clone/base-science-advance-nuclearfission/NuclearFission';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import PlantNuclearDevice from '@civ-clone/base-unit-action-plant-nuclear-device/PlantNuclearDevice';
import Player from '@civ-clone/core-player/Player';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import Rocketry from '@civ-clone/base-science-advance-rocketry/Rocketry';
import SneakStealTechnology from '@civ-clone/base-unit-action-steal-technology/SneakStealTechnology';
import StealTechnology from '@civ-clone/base-unit-action-steal-technology/StealTechnology';
import SubvertCity from '@civ-clone/base-unit-action-incite-revolt/SubvertCity';
import Tile from '@civ-clone/core-world/Tile';
import TradeMissions from '@civ-clone/base-unit-trait-trade-missions/TradeMissions';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import UnitedNations from '@civ-clone/base-wonder-unitednations/UnitedNations';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import { RequirementRegistry } from '@civ-clone/core-requirement/RequirementRegistry';
import BribeUnit from '@civ-clone/base-unit-action-bribe-unit/BribeUnit';
import Advance from '@civ-clone/core-science/Advance';
import { advances } from '@civ-clone/civ2-science/data/advances';
import { cityStatus } from '@civ-clone/base-city-happiness-status/lib/cityStatus';
import { diagonalDistance } from '@civ-clone/civ2-city/lib/capitalLink';
import { founderOf } from '@civ-clone/civ2-city/lib/founder';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { nearestCity as nearestOwnCity } from '@civ-clone/base-unit-agent/lib/escape';
import { playerOwnsWonder } from '@civ-clone/base-wonder/lib/hasWonder';
import { robbed } from './espionage';
import { stealableAdvances } from '@civ-clone/base-unit-action-steal-technology/lib/stealAdvance';
import { Diplomat } from '../../Units';

export interface MissionRowDependencies {
  cityGrowthRegistry: CityGrowthRegistry;
  cityImprovementRegistry: CityImprovementRegistry;
  cityRegistry: CityRegistry;
  clientRegistry: ClientRegistry;
  engine?: Engine;
  interactionRegistry: InteractionRegistry;
  manhattanProjectBuilt: () => boolean;
  pendingEffectRegistry: PendingEffectRegistry;
  playerGovernmentRegistry: PlayerGovernmentRegistry;
  playerRegistry: PlayerRegistry;
  playerResearchRegistry: PlayerResearchRegistry;
  playerTreasuryRegistry: PlayerTreasuryRegistry;
  requirementRegistry: RequirementRegistry;
  ruleRegistry: RuleRegistry;
  turn: Turn;
  unitImprovementRegistry: UnitImprovementRegistry;
  unitRegistry: UnitRegistry;
  wonderRegistry: WonderRegistry;
}

/** The rows the Diplomat's and Spy's city and unit missions, and the Caravan's trade route, are offered by. */
export interface MissionRows {
  /** The city missions, in the order a unit is offered them: theft first, a computer's default. */
  city: NamedRow[];
  /** The missions against a lone unit: bribery, then a person's Spy's sabotage (`sabotage-unit`, which `action` makes). */
  bribe: NamedRow;
  /** A Caravan's or Freight's trade route. */
  tradeRoute: NamedRow;
  /** The price to incite the city on `to`, for `unit` standing on `from`. */
  costToIncite: (unit: Unit, to: Tile, from?: Tile) => number;
  /** The price for `unit` to bribe `target`. */
  costToBribe: (unit: Unit, target: Unit) => number;
}

/**
 * Civilization II's Diplomat and Spy missions (OpenCiv2 `spy_city_mission_menu`, `unit_spy.cpp:151-226`, and the AI's
 *  `spy_city_mission_ai_choice`) and the Caravan's trade route, as rows of civ2-unit's action table. What each mission
 *  does is `Rules/Unit/espionage`.
 *
 * - **Theft**: a Diplomat once per city (`CITYF_TECH_STOLEN`), a Spy also at a city already robbed; only while there's
 *   something to take.
 * - **Sabotage**: always offered.
 * - **Poisoning**: a Spy; a person's only at size 2 or more (a computer's empties a size-1 city's food box).
 * - **Planting a nuclear device**: a person's Spy, knowing Rocketry and Nuclear Fission, once the Manhattan Project has
 *   been built anywhere. The computer players never choose it.
 * - **A person under a ceasefire, a peace or an alliance** with the city's owner is offered a theft, a sabotage or a
 *   poisoning only as its `Sneak` form, which a client confirms first (`spy_confirm_treaty_breach`); the treaty itself
 *   breaks only through the incident if the agent is lost.
 * - **Inciting a revolt**: not a Democracy's city, nor with the agent within 2 of the owner's Palace (diagonally); a
 *   computer only without a treaty. Under a treaty a person may instead pay double (`subvert-city`, a `SubvertCity`),
 *   while that is under 15001.
 * - **Bribery**: a lone unit outside a city, not a Democracy's; a computer only knowing the Diplomat's prerequisite,
 *   and never a Caravan or Freight. A person's Spy is also offered `sabotage-unit` (the choice the original gives it
 *   under its default combat rules, `spy_unit_mission`).
 * - **A trade route**: to any foreign city, or to an own city other than home with no distance or continent test; a
 *   unit with no home is homed, for this, in its player's nearest city (`unit.cpp:694-699`).
 *
 * There is no treaty test on any mission: the original's checks for Diplomats and Caravans come before its treaty
 *  checks (`unit_move_dir_land_unit_checks`).
 */
export const missionRows = ({
  cityGrowthRegistry,
  cityImprovementRegistry,
  cityRegistry,
  clientRegistry,
  interactionRegistry,
  manhattanProjectBuilt,
  pendingEffectRegistry,
  playerGovernmentRegistry,
  playerRegistry,
  playerResearchRegistry,
  playerTreasuryRegistry,
  requirementRegistry,
  ruleRegistry,
  turn,
  unitImprovementRegistry,
  unitRegistry,
  wonderRegistry,
}: MissionRowDependencies): MissionRows => {
  const { diplomatCriteria } = diplomat({ cityRegistry }),
    cityOn = (to: Tile): City => cityRegistry.getByTile(to)!,
    human = (player: Player): boolean => isHuman(player, clientRegistry),
    governed = (player: Player, ...types: (typeof Government)[]): boolean => {
      try {
        return playerGovernmentRegistry.getByPlayer(player).is(...types);
      } catch (e) {
        return false;
      }
    },
    knows = (player: Player, AdvanceType: typeof Advance): boolean => {
      try {
        return playerResearchRegistry
          .getByPlayer(player)
          .completed(AdvanceType);
      } catch (e) {
        return false;
      }
    },
    gold = (player: Player): number => {
      try {
        return playerTreasuryRegistry.getByPlayerAndType(player, Gold).value();
      } catch (e) {
        return 0;
      }
    },
    has = (city: City, Improvement: typeof CityImprovement): boolean =>
      cityImprovementRegistry
        .getByCity(city)
        .some(
          (improvement: CityImprovement): boolean =>
            improvement instanceof Improvement && !improvement.destroyed()
        ),
    // `civ_distance_to_capital(player, tile)`: the diagonal distance from `tile` to `player`'s nearest Palace, 16 with
    //  none (`civ.cpp:6396`).
    distanceToCapital = (player: Player, tile: Tile): number =>
      distanceFromPalace(
        palaceTiles(
          player,
          (improvement: CityImprovement): boolean =>
            improvement instanceof Palace,
          cityImprovementRegistry
        ),
        tile,
        diagonalDistance,
        16
      ),
    underTreaty = (unit: Unit, to: Tile): boolean =>
      treatyLevel(
        { interactionRegistry },
        unit.player(),
        cityOn(to).player()
      ) >= TreatyLevel.Ceasefire,
    personUnderTreaty = new Criterion(
      (unit: Unit, to: Tile): boolean =>
        human(unit.player()) && underTreaty(unit, to)
    ),
    notPersonUnderTreaty = new Criterion(
      (unit: Unit, to: Tile): boolean =>
        !human(unit.player()) || !underTreaty(unit, to)
    ),
    spy = new Criterion((unit: Unit): boolean => unit.hasTrait(Covert)),
    person = new Criterion((unit: Unit): boolean => human(unit.player())),
    canSteal = new Criterion(
      (unit: Unit, to: Tile): boolean =>
        (isSpy(unit) || !robbed(cityOn(to), interactionRegistry)) &&
        stealableAdvances(
          unit.player(),
          cityOn(to).player(),
          playerResearchRegistry
        ).length > 0
    ),
    canPoison = new Criterion(
      (unit: Unit, to: Tile): boolean =>
        !human(unit.player()) ||
        cityGrowthRegistry.getByCity(cityOn(to)).size() > 1
    ),
    canPlant = new Criterion(
      (unit: Unit): boolean =>
        knows(unit.player(), Rocketry) &&
        knows(unit.player(), NuclearFission) &&
        manhattanProjectBuilt()
    ),
    // Not a Democracy's, nor with the agent within 2 of its Palace (`unit_spy.cpp:745-757`).
    canIncite = new Criterion(
      (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean => {
        const owner = cityOn(to).player();

        return (
          !governed(owner, Democracy) && distanceToCapital(owner, from) >= 2
        );
      }
    ),
    costToIncite = (unit: Unit, to: Tile, from: Tile = unit.tile()): number => {
      const city = cityOn(to),
        owner = city.player();

      return inciteCost({
        size: cityGrowthRegistry.getByCity(city).size(),
        gold: gold(owner),
        distance: distanceToCapital(owner, from),
        communist: governed(owner, Communism),
        courthouse: has(city, Courthouse),
        disorder:
          cityStatus(CIVIL_DISORDER, city, pendingEffectRegistry) !== null,
        empty: unitRegistry.getByTile(city.tile()).length === 0,
        founder:
          founderOf(city, owner, {
            pendingEffectRegistry,
            playerRegistry,
            turn,
          }) === unit.player(),
        spy: isSpy(unit),
        veteran: isVeteran(unit, unitImprovementRegistry),
      });
    },
    // The Diplomat's prerequisite (`unit_types[UNIT_DIPLOMAT].prerequisite`), which a computer must know to bribe.
    diplomatPrerequisite = (() => {
      const row = unitRow(Object.create(Diplomat.prototype) as unknown as Unit);

      return row === undefined || row[11] < 0 ? null : advances[row[11]][0];
    })(),
    costToBribe = (unit: Unit, target: Unit): number =>
      bribeCost({
        unitCost: unitRow(target)?.[8] ?? 0,
        gold: gold(target.player()),
        distance: distanceToCapital(target.player(), target.tile()),
        briberCommunist: governed(unit.player(), Communism),
        settler: isSettlerRole(target),
      }),
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
    // A Caravan's home for a trade route: its own, or with none, its player's nearest city (`unit.cpp:694-699`).
    tradeRouteHome = (unit: Unit): City | null =>
      (unit.city() as City | null) ?? nearestOwnCity(unit, cityRegistry);

  return {
    costToIncite,
    costToBribe,
    city: [
      {
        name: 'steal-technology',
        criteria: [...diplomatCriteria, canSteal, notPersonUnderTreaty],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new StealTechnology(
            from,
            to,
            unit,
            cityOn(to),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      {
        name: 'sneak-steal-technology',
        criteria: [...diplomatCriteria, canSteal, personUnderTreaty],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new SneakStealTechnology(
            from,
            to,
            unit,
            cityOn(to),
            cityOn(to).player(),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      // Once per civilization, and not for the owner of the United Nations (`spy_city_mission_menu`,
      //  `unit_spy.cpp:171-172`): only an `Embassy` of the player's own counts, not the one Marco Polo's acts as.
      {
        name: 'establish-embassy',
        criteria: [...diplomatCriteria, hasNoEmbassy, noUnitedNations],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new EstablishEmbassy(
            from,
            to,
            unit,
            cityOn(to),
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
            cityOn(to),
            ruleRegistry
          ) as UnitAction,
      },
      {
        name: 'industrial-sabotage',
        criteria: [...diplomatCriteria, notPersonUnderTreaty],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new IndustrialSabotage(
            from,
            to,
            unit,
            cityOn(to),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      {
        name: 'sneak-industrial-sabotage',
        criteria: [...diplomatCriteria, personUnderTreaty],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new SneakIndustrialSabotage(
            from,
            to,
            unit,
            cityOn(to),
            cityOn(to).player(),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      {
        name: 'poison-water',
        criteria: [...diplomatCriteria, spy, canPoison, notPersonUnderTreaty],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new PoisonWater(
            from,
            to,
            unit,
            cityOn(to),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      {
        name: 'sneak-poison-water',
        criteria: [...diplomatCriteria, spy, canPoison, personUnderTreaty],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new SneakPoisonWater(
            from,
            to,
            unit,
            cityOn(to),
            cityOn(to).player(),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      {
        name: 'plant-nuclear-device',
        criteria: [...diplomatCriteria, spy, person, canPlant],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new PlantNuclearDevice(
            from,
            to,
            unit,
            cityOn(to),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      // Offered whether or not it's affordable, so the price can be shown; the effect refuses if not.
      {
        name: 'incite-revolt',
        criteria: [
          ...diplomatCriteria,
          canIncite,
          new Criterion(
            (unit: Unit, to: Tile): boolean =>
              human(unit.player()) || !underTreaty(unit, to)
          ),
        ],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new InciteRevolt(
            from,
            to,
            unit,
            cityOn(to),
            costToIncite(unit, to, from),
            ruleRegistry
          ) as unknown as UnitAction,
      },
      // Under a treaty, a person may pay double: no incident and no war, but a vendetta, and it becomes the founder
      //  (`unit_spy.cpp:803-805`, `:838-845`).
      {
        name: 'subvert-city',
        criteria: [
          ...diplomatCriteria,
          canIncite,
          personUnderTreaty,
          new Criterion(
            (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean =>
              costToIncite(unit, to, from) < DOUBLED_PRICE_BELOW
          ),
        ],
        effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
          new SubvertCity(
            from,
            to,
            unit,
            cityOn(to),
            costToIncite(unit, to, from) * 2,
            ruleRegistry
          ) as unknown as UnitAction,
      },
    ],

    bribe: {
      name: 'bribe-unit',
      criteria: [
        ...bribeUnitCriteria({ cityRegistry, unitRegistry }),
        new Criterion((unit: Unit, to: Tile): boolean => {
          const [target] = unitRegistry.getByTile(to);

          if (governed(target.player(), Democracy)) {
            return false;
          }

          return (
            human(unit.player()) ||
            ((diplomatPrerequisite === null ||
              knows(unit.player(), diplomatPrerequisite)) &&
              !isTradeUnit(target))
          );
        }),
      ],
      effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction => {
        const [target] = unitRegistry.getByTile(to);

        return new BribeUnit(
          from,
          to,
          unit,
          target,
          costToBribe(unit, target),
          ruleRegistry
        ) as unknown as UnitAction;
      },
    },

    tradeRoute: {
      name: 'establish-trade-route',
      criteria: [
        isNeighbouringTile,
        hasMovesLeft,
        new Criterion(
          (unit: Unit, to: Tile, from: Tile = unit.tile()): boolean => {
            const city = cityRegistry.getByTile(to);

            if (!unit.hasTrait(TradeMissions) || city === null) {
              return false;
            }

            const home = tradeRouteHome(unit);

            if (home === null) {
              return false;
            }

            if (city.player() !== unit.player()) {
              return from.isLand();
            }

            return home !== city;
          }
        ),
      ],
      effect: (unit: Unit, to: Tile, from: Tile = unit.tile()): UnitAction =>
        new EstablishTradeRoute(
          from,
          to,
          unit,
          cityOn(to),
          ruleRegistry
        ) as unknown as UnitAction,
    },
  };
};

export default missionRows;
