import { Diplomat, Spy, Warrior } from '../Units';
import { Scenario, addCity, addPlayer, offered, setUp } from './lib/matrix';
import { AlliedRepair, SneakAttack, SneakMove } from '../Actions';
import {
  TreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import Alliance from '@civ-clone/base-diplomacy-declaration-alliance/Alliance';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import Ceasefire from '@civ-clone/base-diplomacy-declaration-ceasefire/Ceasefire';
import City from '@civ-clone/core-city/City';
import Client from '@civ-clone/core-client/Client';
import DeclaredWar from '@civ-clone/base-diplomacy/Rules/DeclaredWar';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import MarcoPolosEmbassy from '@civ-clone/base-wonder-marcopolosembassy/MarcoPolosEmbassy';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import MovedThisTurn from '@civ-clone/base-unit-healing/lib/MovedThisTurn';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import SenateIntervenes from '@civ-clone/base-government-senate/Rules/SenateIntervenes';
import { SenateContext } from '@civ-clone/base-government-senate/Rules/SenateIntervenes';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import UnitedNations from '@civ-clone/base-wonder-unitednations/UnitedNations';
import War from '@civ-clone/base-diplomacy-declaration-war/War';
import { attitude } from '@civ-clone/civ2-diplomacy/lib/relations';
import { expect } from 'chai';

// What civ2-unit's actions do about treaties (OpenCiv2 `diplo_confirm_attack`, `diplo_force_war`,
//  `tile_zoc_unit_adjacent`, `unit_move_dir`'s allied repair, `spy_city_mission_menu`). The unit stands at (7, 7); the
//  other player's unit or city is at (6, 7).

type Treaty = typeof Alliance | typeof Peace | typeof Ceasefire;

const other = (
  what: 'unit' | 'city',
  treaty: Treaty | null,
  extra: (setting: {
    game: Game;
    player: Player;
    enemy: Player;
  }) => void = () => {}
): Scenario & { enemy?: Player } => {
  const scenario: Scenario & { enemy?: Player } = {
    name: `${what}, ${treaty?.name ?? 'no treaty'}`,
    target: ({ world }) => world.get(6, 7),
    prepare: ({ game, player, world }) => {
      const enemy = addPlayer(game);

      scenario.enemy = enemy;

      if (what === 'unit') {
        new Warrior(null, enemy, world.get(6, 7), game.rules);
      } else {
        addCity(game, enemy, world.get(6, 7), 'Other');
      }

      if (treaty === Alliance) {
        game.interactions.register(new Peace(player, enemy, game.rules));
      }

      if (treaty !== null) {
        game.interactions.register(new treaty(player, enemy, game.rules));
      }

      extra({ game, player, enemy });
    },
  };

  return scenario;
};

describe('treaties', function (): void {
  this.timeout(60000);

  describe('allies', (): void => {
    it("can't be attacked or captured, but a peace or ceasefire partner can be, by breaking it", async (): Promise<void> => {
      expect(
        offered(await setUp(other('unit', Alliance), Warrior))
      ).not.to.include.members(['SneakAttack', 'Attack']);
      expect(offered(await setUp(other('unit', Peace), Warrior))).to.include(
        'SneakAttack'
      );
      expect(
        offered(await setUp(other('unit', Ceasefire), Warrior))
      ).to.include('SneakAttack');
      expect(offered(await setUp(other('unit', null), Warrior))).to.include(
        'Attack'
      );

      const city = offered(await setUp(other('city', Alliance), Warrior));

      expect(city).not.to.include('SneakCaptureCity');
      expect(city).not.to.include('CaptureCity');
    });

    it("exert no zone of control: a land unit may step between two squares beside an ally's unit", async (): Promise<void> => {
      const beside = (treaty: Treaty | null): Scenario => ({
        name: 'zone of control',
        target: ({ world }) => world.get(6, 7),
        prepare: ({ game, player, world }) => {
          const enemy = addPlayer(game);

          new Warrior(null, enemy, world.get(7, 6), game.rules);

          if (treaty === Alliance) {
            game.interactions.register(new Peace(player, enemy, game.rules));
          }

          if (treaty !== null) {
            game.interactions.register(new treaty(player, enemy, game.rules));
          }
        },
      });

      expect(offered(await setUp(beside(Alliance), Warrior))).to.include(
        'Move'
      );
      expect(offered(await setUp(beside(Peace), Warrior))).not.to.include(
        'Move'
      );
      expect(offered(await setUp(beside(null), Warrior))).not.to.include(
        'Move'
      );
    });

    it('repair a unit that moves onto their city by a tenth of its hit points, a fifth with Barracks, at most its damage, and end its turn there without it going in', async (): Promise<void> => {
      const repairs = async (
        damage: number,
        barracks: boolean
      ): Promise<{ damage: number; moves: number; tile: Tile; from: Tile }> => {
        const cell = await setUp(
            other('city', Alliance, ({ game }) => {
              if (barracks) {
                game.cityImprovements.register(
                  new Barracks(
                    game.cities
                      .entries()
                      .find((city: City) => city.name() === 'Other')!,
                    game.rules
                  )
                );
              }
            }),
            Warrior
          ),
          { unit, to, from, game } = cell,
          [, maximum] = unit.hitPoints();

        unit.setDamage(Math.round((maximum * damage) / 10));
        game.unitImprovements.register(new MovedThisTurn(unit));

        const actions = unit.actions(to, from);

        expect(actions.map((action) => action.constructor.name)).to.eql([
          'AlliedRepair',
        ]);

        (actions[0] as AlliedRepair).perform();

        expect(
          game.unitImprovements
            .getByUnit(unit)
            .some((improvement) => improvement instanceof MovedThisTurn)
        ).to.false;

        return {
          damage: (unit.damage() * 10) / maximum,
          moves: unit.moves().value(),
          tile: unit.tile(),
          from,
        };
      };

      const plain = await repairs(5, false);

      expect(plain.damage).equal(4);
      expect(plain.moves).equal(0);
      expect(plain.tile).equal(plain.from);
      expect((await repairs(5, true)).damage).equal(3);
      expect((await repairs(1, true)).damage).equal(0);
      expect((await repairs(0, false)).damage).equal(0);
    });

    it("aren't offered a repair at a peace partner's city", async (): Promise<void> => {
      expect(
        offered(await setUp(other('city', Peace), Warrior))
      ).not.to.include('AlliedRepair');
    });
  });

  describe('the Senate', (): void => {
    const withSenate =
      (intervenes: boolean, asked: [Player, Player | null, SenateContext][]) =>
      ({ game }: { game: Game }): void =>
        game.rules.register(
          new SenateIntervenes(
            new Effect(
              (
                player: Player,
                other: Player | null,
                context: SenateContext
              ): boolean => {
                asked.push([player, other, context]);

                return intervenes;
              }
            )
          )
        );

    it('is asked about the treaty partner, and when it intervenes the overruled form is offered instead', async (): Promise<void> => {
      const asked: [Player, Player | null, SenateContext][] = [],
        scenario = other('unit', Peace, withSenate(true, asked)),
        actions = offered(await setUp(scenario, Warrior));

      expect(actions).to.include('Overruled');
      expect(actions).not.to.include('SneakAttack');
      expect(asked.length).greaterThan(0);
      expect(asked.every(([, other]) => other === scenario.enemy)).to.true;
      expect(asked[0][2]).eql({ reason: 'break-treaty' });
    });

    it("doesn't stop a player when it stands aside", async (): Promise<void> => {
      const actions = offered(
        await setUp(other('unit', Peace, withSenate(false, [])), Warrior)
      );

      expect(actions).to.include('SneakAttack');
      expect(actions).not.to.include('Overruled');
    });
  });

  describe('an attack across a treaty', (): void => {
    const attack = async (
      treaty: Treaty,
      human: boolean
    ): Promise<{
      game: Game;
      player: Player;
      enemy: Player;
      declared: [Player, Player, boolean, TreatyLevel][];
    }> => {
      const declared: [Player, Player, boolean, TreatyLevel][] = [],
        scenario = other('unit', treaty, ({ game, player, enemy }) => {
          game.rules.register(
            new DeclaredWar(
              new Effect(
                (
                  by: Player,
                  against: Player,
                  forced: boolean,
                  broken: TreatyLevel
                ): void => {
                  declared.push([by, against, forced, broken]);
                }
              )
            )
          );

          if (human) {
            game.clients.register(
              new (class extends Client {})(player) as never
            );
          } else {
            game.clients.register(
              new (class extends AIClient {})(player) as never
            );
          }

          game.clients.register(
            new (class extends AIClient {})(enemy) as never
          );

          const attitudes = attitude({
            interactionRegistry: game.interactions,
            ruleRegistry: game.rules,
            turn: game.turn,
          });

          attitudes.set(player, enemy, 30);
          attitudes.set(enemy, player, 40);
        }),
        { game, unit, to, from } = await setUp(scenario, Warrior),
        enemy = scenario.enemy!;

      game.rules.process(
        Moved,
        unit,
        new SneakAttack(
          from,
          to,
          unit,
          enemy,
          game.rules,
          game.units
        ) as unknown as UnitAction
      );

      return { game, player: unit.player(), enemy, declared };
    };

    it("makes a person's attacker declare war, forced, through base-diplomacy, breaking a peace or a ceasefire", async (): Promise<void> => {
      for (const [treaty, level] of [
        [Peace, TreatyLevel.Peace],
        [Ceasefire, TreatyLevel.Ceasefire],
      ] as const) {
        const { game, player, enemy, declared } = await attack(treaty, true);

        expect(declared).eql([[player, enemy, true, level]]);
        expect(
          treatyLevel({ interactionRegistry: game.interactions }, player, enemy)
        ).equal(TreatyLevel.War);
      }
    });

    it('between two computer players ends the treaty and starts a war with no declaration, both attitudes at 100', async (): Promise<void> => {
      const { game, player, enemy, declared } = await attack(Peace, false),
        attitudes = attitude({
          interactionRegistry: game.interactions,
          ruleRegistry: game.rules,
          turn: game.turn,
        });

      expect(declared).eql([]);
      expect(
        treatyLevel({ interactionRegistry: game.interactions }, player, enemy)
      ).equal(TreatyLevel.War);
      expect(
        game.interactions
          .getByPlayers(player, enemy)
          .some((interaction) => interaction instanceof War)
      ).to.true;
      expect(attitudes.get(player, enemy)).equal(100);
      expect(attitudes.get(enemy, player)).equal(100);
    });

    it("leaves a move onto a partner's land ending the peace only, with no war", async (): Promise<void> => {
      const declared: unknown[] = [],
        scenario = other('unit', Peace, ({ game }) =>
          game.rules.register(
            new DeclaredWar(
              new Effect((...args: unknown[]) => declared.push(args))
            )
          )
        ),
        { game, unit, to, from } = await setUp(scenario, Warrior),
        enemy = scenario.enemy!;

      game.rules.process(
        Moved,
        unit,
        new SneakMove(
          from,
          to,
          unit,
          enemy,
          game.rules
        ) as unknown as UnitAction
      );

      expect(declared).eql([]);
      expect(
        treatyLevel(
          { interactionRegistry: game.interactions },
          unit.player(),
          enemy
        )
      ).equal(TreatyLevel.Contact);
    });
  });

  describe("the Diplomat's and Spy's missions", (): void => {
    const owning =
      (Wonder: typeof UnitedNations | typeof MarcoPolosEmbassy) =>
      ({ game, player }: { game: Game; player: Player }): void => {
        const [home] = game.cities
          .entries()
          .filter((city: City) => city.player() === player);

        game.wonders.register(new Wonder(home, game.rules));
      };

    it('offer an embassy, an investigation and a meeting with the leader, in that order', async (): Promise<void> => {
      for (const UnitType of [Diplomat, Spy]) {
        expect(
          offered(await setUp(other('city', null), UnitType)).slice(0, 3)
        ).eql(['EstablishEmbassy', 'InvestigateCity', 'MeetWithLeader']);
      }
    });

    it("hide the embassy from the United Nations' owner, but not from Marco Polo's", async (): Promise<void> => {
      expect(
        offered(
          await setUp(other('city', null, owning(UnitedNations)), Diplomat)
        )
      ).not.to.include('EstablishEmbassy');
      expect(
        offered(
          await setUp(other('city', null, owning(MarcoPolosEmbassy)), Diplomat)
        )
      ).to.include('EstablishEmbassy');
    });

    it('meeting the leader ends the unit’s turn and tells the client', async (): Promise<void> => {
      const { game, unit, to, from } = await setUp(
          other('city', null),
          Diplomat
        ),
        met: unknown[] = [];

      game.engine.on('player:meet-with-leader', (...args: unknown[]) =>
        met.push(args)
      );

      const meet = unit
        .actions(to, from)
        .find((action) => action.constructor.name === 'MeetWithLeader')!;

      unit.action(meet as never);

      expect(unit.moves().value()).equal(0);
      expect(met).length(1);
    });
  });
});

void Unit;
