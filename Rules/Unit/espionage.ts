import {
  CAUGHT_CHECK,
  EscapeMode,
  HARD,
  MissionEscapeMode,
  ORDINARY,
  escapeOdds,
  rollEscape,
} from '@civ-clone/base-unit-agent/lib/escape';
import {
  CityBuildRegistry,
  instance as cityBuildRegistryInstance,
} from '@civ-clone/core-city-build/CityBuildRegistry';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  PlayerTreasuryRegistry,
  instance as playerTreasuryRegistryInstance,
} from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
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
  PRODUCTION,
  deviceDiscovered,
  detected,
  improvementOrder,
  isSpy,
  isVeteran,
  randomSabotageTarget,
  sabotagesProduction,
  theftOrder,
} from '../../lib/espionage';
import {
  addSubversions,
  forgetCity,
  investigated,
  markInvestigated,
} from '../../lib/missionRecords';
import stealAdvance, {
  firstStealableAdvance,
  stealableAdvances,
} from '@civ-clone/base-unit-action-steal-technology/lib/stealAdvance';
import Action from '@civ-clone/core-unit/Action';
import AdvanceStolen from '@civ-clone/base-unit-action-steal-technology/AdvanceStolen';
import AgentSurvives from '@civ-clone/base-unit-agent/Rules/AgentSurvives';
import BribeUnit from '@civ-clone/base-unit-action-bribe-unit/BribeUnit';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import CitySabotaged from '@civ-clone/base-unit-action-industrial-sabotage/Rules/CitySabotaged';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import Criterion from '@civ-clone/core-rule/Criterion';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import DevicePlanted from '@civ-clone/base-unit-action-plant-nuclear-device/Rules/DevicePlanted';
import Effect from '@civ-clone/core-rule/Effect';
import EstablishEmbassy from '@civ-clone/base-unit-action-establish-embassy/EstablishEmbassy';
import Fundamentalism from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import IndustrialSabotage from '@civ-clone/base-unit-action-industrial-sabotage/IndustrialSabotage';
import InvestigateCity from '@civ-clone/base-unit-action-investigate-city/InvestigateCity';
import MissionDetected from '@civ-clone/base-unit-agent/Rules/MissionDetected';
import MissionMode from '@civ-clone/base-unit-agent/Rules/MissionMode';
import MissionTargets from '@civ-clone/base-unit-agent/Rules/MissionTargets';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import PlantNuclearDevice from '@civ-clone/base-unit-action-plant-nuclear-device/PlantNuclearDevice';
import Player from '@civ-clone/core-player/Player';
import PoisonWater from '@civ-clone/base-unit-action-poison-water/PoisonWater';
import RevoltIncited from '@civ-clone/base-unit-action-incite-revolt/Rules/RevoltIncited';
import StealTechnology from '@civ-clone/base-unit-action-steal-technology/StealTechnology';
import SubvertCity from '@civ-clone/base-unit-action-incite-revolt/SubvertCity';
import TechnologyStolen from '@civ-clone/base-unit-action-steal-technology/Rules/TechnologyStolen';
import Unit from '@civ-clone/core-unit/Unit';
import UnitBribed from '@civ-clone/base-unit-action-bribe-unit/Rules/UnitBribed';
import WaterPoisoned from '@civ-clone/base-unit-action-poison-water/Rules/WaterPoisoned';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import Advance from '@civ-clone/core-science/Advance';
import escape from '@civ-clone/base-unit-agent/lib/escape';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import makeContact from '@civ-clone/base-diplomacy-interaction-contact/makeContact';
import nearestCity from '../../lib/nearestCity';
import { nuclearDeviceDiscovered } from '@civ-clone/civ2-diplomacy/lib/espionage';
import payFrom from '@civ-clone/base-unit-agent/lib/pay';
import Dependencies from '@civ-clone/civ2-diplomacy/lib/Dependencies';
import { instance as randomNumberGeneratorInstance } from '@civ-clone/core-random';

/** The city missions whose agent tries to escape afterwards (`spy_try_escape(unit, mode, victim)`), a Diplomat never. */
export const escapingMissions = [
  StealTechnology,
  IndustrialSabotage,
  PoisonWater,
  InciteRevolt,
];

export interface EspionageDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  cityGrowthRegistry?: CityGrowthRegistry;
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  // civ2-diplomacy's dependencies (`dependenciesOf(game)`), for `nuclearDeviceDiscovered`.
  diplomacy?: Dependencies;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  playerTreasuryRegistry?: PlayerTreasuryRegistry;
  randomNumberGenerator?: () => number;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
  /** What else paying the doubled price does to the city, just before it changes hands (civ2-city: its founder). */
  inciterBecomesFounder?: (city: City, inciter: Player) => void;
}

/** A third of a move, what a person's Spy pays for an embassy or a first investigation (`moves_used++`). */
export const THIRD_OF_A_MOVE = 1 / 3;

/** Whether anyone has robbed `city` of an advance (`CITYF_TECH_STOLEN`). */
export const robbed = (
  city: City,
  interactionRegistry: InteractionRegistry = interactionRegistryInstance
): boolean =>
  interactionRegistry
    .entries()
    .some(
      (interaction) =>
        interaction instanceof AdvanceStolen &&
        (interaction as unknown as AdvanceStolen).city() === city
    );

/**
 * Civilization II's Diplomat and Spy missions on base-unit-agent's seams (OpenCiv2 `src/auto/unit_spy.cpp`):
 *
 * - **Contact:** a mission on a city makes contact first (`spy_city_mission`'s `diplo_set_treaty_flags(civ, civ2, 1)`).
 * - **Escape modes** (`MissionMode`): a theft with no target chosen, at a city already robbed, is hard (`:384-393`);
 *   poisoning draws ordinary or hard (`:641-642`).
 * - **Caught checks** (`AgentSurvives` with `CAUGHT_CHECK`, `spy_check_caught`, odds 3 or 6 for a veteran Spy, and a
 *   Diplomat always caught): one for a hard theft; for a chosen sabotage one, a second for a city with a Palace and a
 *   third when the target is City Walls (`:510-521`); three for a nuclear device, a fourth for a Palace (`:680-686`).
 *   Every other mission has none.
 * - **After the mission** (`AgentSurvives` with the resolved mode): a Diplomat is used up; a Spy pays a move, then
 *   escapes with odds 2, doubled for a veteran and halved when hard, to its nearest city, and becomes a veteran
 *   (`spy_try_escape`). An embassy or an investigation uses up a computer's agent and a person's Diplomat; a person's
 *   Spy stays, paying a third of a move for the embassy and for the first investigation of a city
 *   (`:262-320`). A planted device leaves the Spy as it is (the original makes no escape; the blast takes it).
 *   Sabotaging a unit keeps its own escape (base-unit-action-sabotage-unit's options), so no rule here answers for it.
 * - **Targets** (`MissionTargets`): only a person's Spy chooses: an advance at a city not yet robbed, or, when there is
 *   something to sabotage, any building but the Palace, SDI Defense and Wonders, or the production.
 * - **Counter-espionage** (`MissionDetected`): a random theft is detected by each Diplomat or Spy in the city in turn,
 *   at 20, 40 or 60 in 100 (Diplomat, Spy, veteran Spy), the first success stopping it (`:405-420`).
 * - **Effects:** the advance stolen; the building or production sabotaged, but only when either side is a person (the
 *   original's effect sits inside that test, `:577-618`, so two computer players' sabotage only spends the agent); the
 *   water poisoned; whether a planted device is discovered (½, a veteran ¼, never a Fundamentalist's), with
 *   civ2-diplomacy's `nuclearDeviceDiscovered`; a city incited, paid for and captured with the action as the cause;
 *   a unit bribed and rehomed.
 */
export const getRules = ({
  cityBuildRegistry = cityBuildRegistryInstance,
  cityGrowthRegistry = cityGrowthRegistryInstance,
  cityImprovementRegistry = cityImprovementRegistryInstance,
  cityRegistry = cityRegistryInstance,
  clientRegistry = clientRegistryInstance,
  diplomacy,
  engine = engineInstance,
  interactionRegistry = interactionRegistryInstance,
  pendingEffectRegistry = pendingEffectRegistryInstance,
  playerGovernmentRegistry = playerGovernmentRegistryInstance,
  playerResearchRegistry = playerResearchRegistryInstance,
  playerTreasuryRegistry = playerTreasuryRegistryInstance,
  randomNumberGenerator = randomNumberGeneratorInstance,
  ruleRegistry = ruleRegistryInstance,
  turn = turnInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
  unitRegistry = unitRegistryInstance,
  inciterBecomesFounder = (): void => {},
}: EspionageDependencies = {}): (
  | MissionMode
  | AgentSurvives
  | MissionTargets
  | MissionDetected
  | TechnologyStolen
  | CitySabotaged
  | DevicePlanted
  | WaterPoisoned
  | RevoltIncited
  | UnitBribed
  | Destroyed
)[] => {
  const veteran = (unit: Unit): boolean =>
      isVeteran(unit, unitImprovementRegistry),
    human = (player: Player): boolean => isHuman(player, clientRegistry),
    is = (mission: Action, ...types: Function[]): boolean =>
      types.some((Type: Function): boolean => mission instanceof Type),
    cityOf = (mission: Action): City =>
      (mission as unknown as { city(): City }).city(),
    has = (city: City, Improvement: typeof CityImprovement): boolean =>
      cityImprovementRegistry
        .getByCity(city)
        .some(
          (improvement: CityImprovement): boolean =>
            improvement instanceof Improvement && !improvement.destroyed()
        ),
    // `spy_check_caught` `count` times: a Spy must escape each (odds 3, 6 for a veteran); a Diplomat never does.
    caughtChecks = (unit: Unit, count: number): boolean => {
      for (let i = 0; i < count; i++) {
        if (
          !isSpy(unit) ||
          !rollEscape(
            escapeOdds(CAUGHT_CHECK, veteran(unit)),
            randomNumberGenerator
          )
        ) {
          return false;
        }
      }

      return true;
    },
    // Whether a planted device's Spy was a veteran, read before the blast destroys it.
    plantedByVeteran = new WeakMap<Action, boolean>(),
    makeVeteran = (unit: Unit): void => {
      if (!veteran(unit)) {
        unitImprovementRegistry.register(new Veteran(unit));
      }
    },
    gold = (player: Player): number => {
      try {
        return playerTreasuryRegistry.getByPlayerAndType(player, Gold).value();
      } catch (e) {
        return 0;
      }
    },
    pay = (player: Player, cost: number): boolean => {
      try {
        return payFrom(player, cost, Gold, playerTreasuryRegistry);
      } catch (e) {
        return false;
      }
    },
    fundamentalist = (player: Player): boolean => {
      try {
        return playerGovernmentRegistry.getByPlayer(player).is(Fundamentalism);
      } catch (e) {
        return false;
      }
    },
    // The improvements a person's Spy may choose to sabotage: any in the first 39 slots but the Palace and SDI Defense.
    sabotageable = (city: City): CityImprovement[] =>
      cityImprovementRegistry
        .getByCity(city)
        .filter(
          (improvement: CityImprovement): boolean =>
            !improvement.destroyed() &&
            improvementOrder.some(
              (Improvement): boolean =>
                Improvement !== null &&
                Improvement !== improvementOrder[1] &&
                Improvement !== improvementOrder[17] &&
                improvement instanceof Improvement
            )
        );

  return [
    // `spy_city_mission` starts by putting the two in contact (`diplo_set_treaty_flags(civ, civ2, 1)`). It answers no
    //  mode, so the mission's own default stands.
    new MissionMode(
      'civ2-unit:mission-mode/contact',
      new Criterion(
        (unit: Unit, mission: Action): boolean =>
          typeof (mission as unknown as { city?: unknown }).city ===
            'function' && cityOf(mission).player() !== unit.player()
      ),
      new Effect((unit: Unit, mission: Action): MissionEscapeMode => {
        makeContact(
          interactionRegistry,
          unit.player(),
          cityOf(mission).player(),
          ruleRegistry,
          turn
        );

        // No mode: `missionMode` passes over an answer that isn't `ORDINARY` or `HARD`.
        return undefined as unknown as MissionEscapeMode;
      })
    ),

    // A random theft at a city already robbed: a caught check and the hard escape (`unit_spy.cpp:384-393`).
    new MissionMode(
      'civ2-unit:mission-mode/robbed-city',
      new Criterion(
        (unit: Unit, mission: Action): boolean =>
          mission instanceof StealTechnology &&
          mission.chosenTarget() === undefined &&
          robbed(mission.city(), interactionRegistry)
      ),
      new Effect(() => HARD)
    ),

    // Poisoning the water: ordinary or hard on a coin flip (`unit_spy.cpp:641-642`).
    new MissionMode(
      'civ2-unit:mission-mode/poison-water',
      new Criterion(
        (unit: Unit, mission: Action): boolean => mission instanceof PoisonWater
      ),
      new Effect(() =>
        Math.floor(randomNumberGenerator() * 2) === 0 ? ORDINARY : HARD
      )
    ),

    // The caught checks. Every mission listed answers, rolling or not, so none falls back.
    new AgentSurvives(
      'civ2-unit:agent-survives/caught-check',
      new Criterion(
        (unit: Unit, mission: Action, mode: EscapeMode): boolean =>
          mode === CAUGHT_CHECK &&
          is(mission, StealTechnology, IndustrialSabotage, PlantNuclearDevice)
      ),
      new Effect(
        (
          unit: Unit,
          mission: Action,
          mode: EscapeMode,
          resolvedMode: EscapeMode
        ): boolean => {
          const city = cityOf(mission);

          if (mission instanceof PlantNuclearDevice) {
            plantedByVeteran.set(mission, veteran(unit));

            return caughtChecks(unit, 3 + (has(city, Palace) ? 1 : 0));
          }

          if (mission instanceof IndustrialSabotage) {
            const target = mission.chosenTarget();

            if (target === undefined) {
              return true;
            }

            return caughtChecks(
              unit,
              1 +
                (has(city, Palace) ? 1 : 0) +
                (target instanceof CityWalls ? 1 : 0)
            );
          }

          // A theft: one check when it is hard (a chosen advance, or a city already robbed); none for a random one.
          return resolvedMode === HARD ? caughtChecks(unit, 1) : true;
        }
      )
    ),

    // After a theft, a sabotage, a poisoning or an incited revolt: a Diplomat is used up; a Spy pays a move and tries
    //  to escape (`spy_try_escape`). After an incited revolt, the city it just took isn't where it goes: the original
    //  escapes before the city changes hands (`unit_spy.cpp:835`, then `city_incite_transfer`).
    new AgentSurvives(
      'civ2-unit:agent-survives/escape',
      new Criterion(
        (unit: Unit, mission: Action, mode: EscapeMode): boolean =>
          mode !== CAUGHT_CHECK && is(mission, ...escapingMissions)
      ),
      new Effect((unit: Unit, mission: Action, mode: EscapeMode): boolean => {
        if (!isSpy(unit)) {
          return false;
        }

        const city = cityOf(mission);

        return escape(unit, mode, {
          action: mission,
          cityRegistry:
            mission instanceof InciteRevolt
              ? ({
                  getByPlayer: (player: Player): City[] =>
                    cityRegistry
                      .getByPlayer(player)
                      .filter(
                        (playerCity: City): boolean => playerCity !== city
                      ),
                } as unknown as CityRegistry)
              : cityRegistry,
          escaped: (escaped: Unit): void => makeVeteran(escaped),
          missionCost: 1,
          odds: (agent: Unit, oddsMode: EscapeMode): number =>
            escapeOdds(oddsMode, veteran(agent)),
          randomNumberGenerator,
          ruleRegistry,
        });
      })
    ),

    // An embassy: a person's Spy stays and pays a third of a move; a person's Diplomat and any computer agent are
    //  used up, with no incident (`unit_spy.cpp:262-277`).
    new AgentSurvives(
      'civ2-unit:agent-survives/embassy',
      new Criterion(
        (unit: Unit, mission: Action, mode: EscapeMode): boolean =>
          mode !== CAUGHT_CHECK && mission instanceof EstablishEmbassy
      ),
      new Effect((unit: Unit): boolean => {
        if (!isSpy(unit) || !human(unit.player())) {
          return false;
        }

        unit.moves().set(Math.max(0, unit.moves().value() - THIRD_OF_A_MOVE));

        return true;
      })
    ),

    // An investigation: a person's Spy stays, paying a third of a move the first time the city is investigated; a
    //  person's Diplomat and any computer agent are used up, with no incident (`unit_spy.cpp:300-320`).
    new AgentSurvives(
      'civ2-unit:agent-survives/investigate',
      new Criterion(
        (unit: Unit, mission: Action, mode: EscapeMode): boolean =>
          mode !== CAUGHT_CHECK && mission instanceof InvestigateCity
      ),
      new Effect((unit: Unit, mission: Action): boolean => {
        if (!human(unit.player())) {
          return false;
        }

        const city = cityOf(mission),
          first = !investigated(city, pendingEffectRegistry);

        markInvestigated(city, pendingEffectRegistry);

        if (!isSpy(unit)) {
          return false;
        }

        if (first) {
          unit.moves().set(Math.max(0, unit.moves().value() - THIRD_OF_A_MOVE));
        }

        return true;
      })
    ),

    // A planted device: the original makes no escape. A Spy the blast spared stays as it is.
    new AgentSurvives(
      'civ2-unit:agent-survives/nuclear-device',
      new Criterion(
        (unit: Unit, mission: Action, mode: EscapeMode): boolean =>
          mode !== CAUGHT_CHECK && mission instanceof PlantNuclearDevice
      ),
      new Effect((): boolean => true)
    ),

    // What a person's Spy may choose to steal: any advance it could take, at a city not yet robbed
    //  (`unit_spy.cpp:369-383`, `civ_steal_advance`).
    new MissionTargets(
      'civ2-unit:mission-targets/steal',
      new Criterion(
        (unit: Unit, city: City, mission: Action): boolean =>
          mission instanceof StealTechnology &&
          isSpy(unit) &&
          human(unit.player()) &&
          !robbed(city, interactionRegistry)
      ),
      new Effect((unit: Unit, city: City): (typeof Advance)[] =>
        stealableAdvances(unit.player(), city.player(), playerResearchRegistry)
      )
    ),

    // What a person's Spy may choose to sabotage, when there's a building a random sabotage could take: any building
    //  but the Palace, SDI Defense (which the original lists, then refuses) and Wonders, or the production
    //  (`unit_spy.cpp:470-511`).
    new MissionTargets(
      'civ2-unit:mission-targets/sabotage',
      new Criterion(
        (unit: Unit, city: City, mission: Action): boolean =>
          mission instanceof IndustrialSabotage &&
          isSpy(unit) &&
          human(unit.player()) &&
          sabotageable(city).length > 0
      ),
      new Effect((unit: Unit, city: City): unknown[] => [
        ...sabotageable(city),
        PRODUCTION,
      ])
    ),

    // Counter-espionage, on a random theft only (base-unit-action-steal-technology asks only then).
    new MissionDetected(
      'civ2-unit:mission-detected/defenders',
      new Criterion(
        (unit: Unit, city: City, mission: Action): boolean =>
          mission instanceof StealTechnology
      ),
      new Effect((unit: Unit, city: City): boolean =>
        detected(
          unitRegistry
            .getByTile(city.tile())
            .filter((defender: Unit): boolean => defender !== unit),
          randomNumberGenerator,
          unitImprovementRegistry
        )
      )
    ),

    // The advance: the one chosen, or the random walk over `@CIVILIZE` (`unit_spy.cpp:352-366`). With nothing to take,
    //  a person's agent loses a move and stays (`:425-431`).
    new TechnologyStolen(
      'civ2-unit:technology-stolen/steal',
      new Effect(
        (unit: Unit, city: City, action?: StealTechnology): boolean => {
          const thief = unit.player(),
            victim = city.player(),
            chosen = action?.chosenTarget() as typeof Advance | undefined,
            AdvanceType =
              chosen ??
              firstStealableAdvance(
                thief,
                victim,
                theftOrder,
                randomNumberGenerator,
                { playerResearchRegistry }
              );

          if (AdvanceType === null) {
            if (human(thief)) {
              unit.moves().set(Math.max(0, unit.moves().value() - 1));
            }

            return false;
          }

          stealAdvance(thief, victim, city, AdvanceType, {
            engine,
            interactionRegistry,
            playerResearchRegistry,
            ruleRegistry,
            turn,
          });

          return true;
        }
      )
    ),

    // The building or production: the one chosen, or a random building (`randomSabotageTarget`), or the production
    //  when there's none, or, with shields in the box, when `sabotagesProduction` says so. Only when either side is a
    //  person does it happen (`unit_spy.cpp:577`).
    new CitySabotaged(
      'civ2-unit:city-sabotaged/sabotage',
      new Effect(
        (unit: Unit, city: City, action?: IndustrialSabotage): void => {
          const chosen = action?.chosenTarget(),
            cityBuild = cityBuildRegistry.getByCity(city);

          let target: CityImprovement | typeof PRODUCTION;

          if (chosen !== undefined) {
            target = chosen as CityImprovement | typeof PRODUCTION;
          } else {
            const Improvement = randomSabotageTarget(
              (Type: typeof CityImprovement): boolean => has(city, Type),
              randomNumberGenerator
            );

            target =
              Improvement === null ||
              (cityBuild.progress().value() !== 0 &&
                sabotagesProduction(
                  isSpy(unit),
                  veteran(unit),
                  randomNumberGenerator
                ))
                ? PRODUCTION
                : cityImprovementRegistry
                    .getByCity(city)
                    .find(
                      (improvement: CityImprovement): boolean =>
                        improvement instanceof Improvement &&
                        !improvement.destroyed()
                    )!;
          }

          if (!human(unit.player()) && !human(city.player())) {
            return;
          }

          if (target === PRODUCTION) {
            const building = cityBuild.building();

            cityBuild.progress().set(0);

            engine.emit(
              'city:sabotaged',
              city,
              unit.player(),
              building === null ? null : building.item()
            );

            return;
          }

          target.destroy();

          engine.emit('city:sabotaged', city, unit.player(), target);
        }
      )
    ),

    // Poisoned water: a city above size 1 loses 1; at size 1 (only a computer's Spy is offered it there) its food box
    //  is emptied (`unit_spy.cpp:621-626`).
    new WaterPoisoned(
      'civ2-unit:water-poisoned/shrink',
      new Effect((unit: Unit, city: City, action: PoisonWater): void => {
        const cityGrowth = cityGrowthRegistry.getByCity(city);

        if (cityGrowth.size() < 2) {
          cityGrowth.progress().set(0);
        } else {
          cityGrowth.shrink(action);
        }

        engine.emit('city:water-poisoned', city, unit.player());
      })
    ),

    // A planted device: whether the other civilizations find out (`unit_spy.cpp:693-712`).
    new DevicePlanted(
      'civ2-unit:device-planted/discovered',
      new Effect((unit: Unit, city: City, action: PlantNuclearDevice): void => {
        if (
          diplomacy === undefined ||
          !deviceDiscovered(
            fundamentalist(unit.player()),
            plantedByVeteran.get(action) ?? false,
            randomNumberGenerator
          )
        ) {
          return;
        }

        nuclearDeviceDiscovered(diplomacy, unit.player(), engine);
      })
    ),

    // Inciting a revolt, paid for (`unit_spy.cpp:825-846`): a computer player pays only with twice the price in hand
    //  (the original's `double_cost <= gold`); the inciter counts 2 subversions; at the doubled price it becomes the
    //  city's founder (`inciterBecomesFounder`) just before the city changes hands, with the action as the cause, for
    //  the `Captured` rules (civ2-city: the forced war, the incident, defection).
    new RevoltIncited(
      'civ2-unit:revolt-incited/capture',
      new Effect((unit: Unit, city: City, action: InciteRevolt): boolean => {
        const inciter = unit.player(),
          victim = city.player(),
          cost = action.cost();

        if (!human(inciter) && gold(inciter) < cost * 2) {
          return false;
        }

        if (!pay(inciter, cost)) {
          return false;
        }

        addSubversions(inciter, 2, pendingEffectRegistry);

        if (action instanceof SubvertCity) {
          inciterBecomesFounder(city, inciter);
        }

        city.capture(inciter, action);

        engine.emit(
          'city:incited',
          city,
          inciter,
          victim,
          cost,
          action instanceof SubvertCity
        );

        return true;
      })
    ),

    // A unit bribed (`unit_bribe`, `unit_spy.cpp:1022-1060`): a computer pays only when the price is at most half its
    //  gold. The unit's home becomes the nearest city, anyone's, if that is the briber's, and none otherwise; its
    //  moves are restored and its orders cleared. The briber counts a subversion. No incident; the briber stays.
    new UnitBribed(
      'civ2-unit:unit-bribed/transfer',
      new Effect((unit: Unit, target: Unit, action: BribeUnit): boolean => {
        const briber = unit.player(),
          previousOwner = target.player(),
          cost = action.cost();

        if (!human(briber) && Math.trunc(gold(briber) / 2) < cost) {
          return false;
        }

        if (!pay(briber, cost)) {
          return false;
        }

        addSubversions(briber, 1, pendingEffectRegistry);

        const home = nearestCity(cityRegistry, target.tile());

        target.transfer(
          briber,
          home !== null && home.player() === briber ? home : null
        );
        target.moves().set(target.movement());
        target.setStatus(null);
        target.setActive();

        engine.emit('unit:bribed', target, briber, previousOwner, cost);

        return true;
      })
    ),

    // The city's investigated record goes with it.
    new Destroyed(
      'civ2-unit:city/destroyed/forget-investigated',
      new Effect((city: City): void => forgetCity(city, pendingEffectRegistry))
    ),
  ];
};

export default getRules;
