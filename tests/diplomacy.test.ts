import {
  SneakPillage,
  UndeclaredAttack,
  AlliedRepair,
  Attack,
  CaptureCity,
  NuclearAttack,
  SneakAttack,
  SneakMove,
} from '../Actions';
import {
  Caravan,
  Diplomat,
  Fighter,
  Nuclear,
  Spy,
  Trireme,
  Warrior,
} from '../Units';
import {
  SNEAK_ATTACK,
  hasFlag,
  setFlag,
} from '@civ-clone/civ2-diplomacy/lib/flags';
import { Scenario, addCity, addPlayer, offered, setUp } from './lib/matrix';
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
import Contact from '@civ-clone/base-diplomacy-interaction-contact/Contact';
import DeclaredWar from '@civ-clone/base-diplomacy/Rules/DeclaredWar';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game/Game';
import { Irrigation } from '@civ-clone/civ2-world/TileImprovements';
import MarcoPolosEmbassy from '@civ-clone/base-wonder-marcopolosembassy/MarcoPolosEmbassy';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import MovedThisTurn from '@civ-clone/base-unit-healing/lib/MovedThisTurn';
import Peace from '@civ-clone/base-diplomacy-declaration-peace/Peace';
import Player from '@civ-clone/core-player/Player';
import SenateIntervenes, {
  SenateContext,
} from '@civ-clone/base-government-senate/Rules/SenateIntervenes';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitAction from '@civ-clone/core-unit/Action';
import UnitedNations from '@civ-clone/base-wonder-unitednations/UnitedNations';
import War from '@civ-clone/base-diplomacy-declaration-war/War';
import Overruled from '@civ-clone/library-unit/Actions/Overruled';
import WorkedTile from '@civ-clone/core-city/WorkedTile';
import { attitude } from '@civ-clone/civ2-diplomacy/lib/relations';
import { expect } from 'chai';

// What civ2-unit's actions do about treaties (OpenCiv2 `diplo_confirm_attack`, `diplo_force_war`,
//  `tile_zoc_unit_adjacent`, `unit_move_dir`'s allied repair, `spy_city_mission_menu`). The unit stands at (7, 7); the
//  other player's unit or city is at (6, 7).

type Treaty = typeof Alliance | typeof Peace | typeof Ceasefire | typeof War;

interface Setting {
  game: Game;
  player: Player;
  enemy: Player;
}

interface Options {
  // The pair have met (a `Contact`): true unless given.
  met?: boolean;
  // Persons, by default neither.
  human?: ('player' | 'enemy')[];
  extra?: (setting: Setting) => void;
}

const person = (game: Game, player: Player): void =>
    game.clients.register(new (class extends Client {})(player) as never),
  computer = (game: Game, player: Player): void =>
    game.clients.register(new (class extends AIClient {})(player) as never);

const sign = (game: Game, player: Player, enemy: Player, treaty: Treaty) => {
  if (treaty === Alliance) {
    game.interactions.register(new Peace(player, enemy, game.rules));
  }

  game.interactions.register(new treaty(player, enemy, game.rules));
};

const other = (
  what: 'unit' | 'city',
  treaty: Treaty | null,
  { met = true, human = [], extra = () => {} }: Options = {},
  target: [number, number] = [6, 7],
  atSea = false
): Scenario & { enemy?: Player } => {
  const scenario: Scenario & { enemy?: Player } = {
    name: `${what}, ${treaty?.name ?? 'no treaty'}`,
    atSea,
    target: ({ world }) => world.get(...target),
    prepare: ({ game, player, world }) => {
      const enemy = addPlayer(game),
        tile = world.get(...target);

      scenario.enemy = enemy;

      if (what === 'unit') {
        new Warrior(null, enemy, tile, game.rules);
      } else {
        addCity(game, enemy, tile, 'Other');
      }

      (human.includes('player') ? person : computer)(game, player);
      (human.includes('enemy') ? person : computer)(game, enemy);

      if (met) {
        game.interactions.register(new Contact(player, enemy, game.rules));
      }

      if (treaty !== null) {
        sign(game, player, enemy, treaty);
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

          if (treaty !== null) {
            sign(game, player, enemy, treaty);
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

    it('repair a land unit that moves onto their city by a tenth of its hit points, a fifth with Barracks, at most its damage, and end its turn there without it going in', async (): Promise<void> => {
      const repairs = async (
        damage: number,
        barracks: boolean
      ): Promise<{ damage: number; moves: number; tile: Tile; from: Tile }> => {
        const cell = await setUp(
            other('city', Alliance, {
              extra: ({ game }) => {
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
              },
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

    it("don't repair a Diplomat, a Caravan, a ship or an aircraft, nor anyone at a peace partner's city", async (): Promise<void> => {
      for (const UnitType of [Diplomat, Spy, Caravan, Fighter]) {
        expect(
          offered(await setUp(other('city', Alliance), UnitType)),
          UnitType.name
        ).not.to.include('AlliedRepair');
      }

      // A Trireme at sea at (8, 7), next to an ally's coastal city at (7, 7).
      expect(
        offered(await setUp(other('city', Alliance, {}, [7, 7], true), Trireme))
      ).not.to.include('AlliedRepair');
      expect(
        offered(await setUp(other('city', Peace), Warrior))
      ).not.to.include('AlliedRepair');
    });

    it("land can't be pillaged, but can be walked onto; a peace partner's can be pillaged by breaking the peace", async (): Promise<void> => {
      const worked = (treaty: Treaty, target: 'from' | 'to'): Scenario => ({
        name: "partner's worked land",
        target: ({ world, from }) =>
          target === 'from' ? from : world.get(6, 7),
        prepare: ({ game, player, world, from }) => {
          const partner = addPlayer(game),
            city = addCity(game, partner, world.get(5, 7), 'Partner'),
            square = target === 'from' ? from : world.get(6, 7);

          game.workedTiles.register(new WorkedTile(square, city));
          game.tileImprovements.register(new Irrigation(square, game.rules));
          sign(game, player, partner, treaty);
        },
      });

      const allied = offered(await setUp(worked(Alliance, 'from'), Warrior));

      expect(allied).not.to.include('Pillage');
      expect(allied).not.to.include('SneakPillage');
      expect(offered(await setUp(worked(Peace, 'from'), Warrior))).to.include(
        'SneakPillage'
      );

      const onto = offered(await setUp(worked(Alliance, 'to'), Warrior));

      expect(onto).to.include('Move');
      expect(onto).not.to.include('SneakMove');
    });

    it('keeps its city and repair when rebuilt for another unit', async (): Promise<void> => {
      const { unit, to, from, game } = await setUp(
          other('city', Alliance),
          Warrior
        ),
        [repair] = unit.actions(to, from) as AlliedRepair[],
        another = new Warrior(null, unit.player(), from, game.rules),
        rebuilt = repair.forUnit(another);

      expect(rebuilt).instanceOf(AlliedRepair);
      expect(rebuilt.city()).equal(repair.city());
      expect(rebuilt.unit()).equal(another);
    });
  });

  describe('the Senate', (): void => {
    const asking =
      (intervenes: boolean, asked: [Player, Player | null, SenateContext][]) =>
      ({ game }: Setting): void =>
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
        scenario = other('unit', Peace, { extra: asking(true, asked) }),
        actions = offered(await setUp(scenario, Warrior));

      expect(actions).to.include('Overruled');
      expect(actions).not.to.include('SneakAttack');
      expect(asked.length).greaterThan(0);
      expect(asked.every(([, other]) => other === scenario.enemy)).to.true;
      expect(asked[0][2]).eql({ reason: 'break-treaty' });
    });

    it("doesn't stop a player when it stands aside", async (): Promise<void> => {
      const actions = offered(
        await setUp(other('unit', Peace, { extra: asking(false, []) }), Warrior)
      );

      expect(actions).to.include('SneakAttack');
      expect(actions).not.to.include('Overruled');
    });

    it('gates a capture, a nuclear attack and a move or pillage onto a partner’s land across a treaty', async (): Promise<void> => {
      const capture = offered(
        await setUp(
          other('city', Peace, { human: ['player'], extra: asking(true, []) }),
          Warrior
        )
      );

      expect(capture).to.include('Overruled');
      expect(capture).not.to.include('SneakCaptureCity');

      // A computer player isn't offered a capture across a treaty at all.
      const computers = offered(
        await setUp(other('city', Peace, { extra: asking(false, []) }), Warrior)
      );

      expect(computers).not.to.include('SneakCaptureCity');
      expect(computers).not.to.include('Overruled');

      // Nor is a person's Senate asked about a capture with no treaty (mask 0xe).
      const plain = offered(
        await setUp(
          other('city', null, { human: ['player'], extra: asking(true, []) }),
          Warrior
        )
      );

      expect(plain).to.include('CaptureCity');
      expect(plain).not.to.include('Overruled');

      // Nor about a nuclear attack on an empty city, which is no battle.
      const empty = offered(
        await setUp(
          other('city', Peace, { human: ['player'], extra: asking(true, []) }),
          Nuclear
        )
      );

      expect(empty).to.include('SneakNuclearAttack');
      expect(empty).not.to.include('Overruled');

      const nuke = offered(
        await setUp(other('unit', Peace, { extra: asking(true, []) }), Nuclear)
      );

      expect(nuke).to.include('Overruled');
      expect(nuke).not.to.include('SneakNuclearAttack');

      const worked = (target: 'from' | 'to'): Scenario => ({
        name: "partner's worked land",
        target: ({ world, from }) =>
          target === 'from' ? from : world.get(6, 7),
        prepare: ({ game, player, world, from }) => {
          const partner = addPlayer(game),
            city = addCity(game, partner, world.get(5, 7), 'Partner'),
            square = target === 'from' ? from : world.get(6, 7);

          game.workedTiles.register(new WorkedTile(square, city));
          game.tileImprovements.register(new Irrigation(square, game.rules));
          sign(game, player, partner, Peace);
          asking(true, [])({ game, player, enemy: partner });
        },
      });

      const pillage = offered(await setUp(worked('from'), Warrior)),
        move = offered(await setUp(worked('to'), Warrior));

      expect(pillage).to.include('Overruled');
      expect(pillage).not.to.include('SneakPillage');
      expect(move).to.include('Overruled');
      expect(move).not.to.include('SneakMove');
    });

    it("is asked when a person attacks a player it has met and isn't at war with, but not a computer player, nor at war, nor before they've met", async (): Promise<void> => {
      const attack = async (options: Options, treaty: Treaty | null = null) =>
        offered(
          await setUp(
            other('unit', treaty, { ...options, extra: asking(true, []) }),
            Warrior
          )
        );

      const personal = await attack({ human: ['player'] });

      expect(personal).to.include('Overruled');
      expect(personal).not.to.include('Attack');

      // Worded apart from breaking a treaty: the blocked action is an `UndeclaredAttack`, with the player attacked.
      const scenario = other('unit', null, {
          human: ['player'],
          extra: asking(true, []),
        }),
        { unit, to, from } = await setUp(scenario, Warrior),
        overruled = unit
          .actions(to, from)
          .find((action) => action instanceof Overruled) as Overruled;

      expect(overruled.action()).instanceOf(UndeclaredAttack);
      expect(overruled.partner()).equal(scenario.enemy);
      expect(await attack({})).to.include('Attack');
      expect(await attack({ human: ['player'] }, War)).to.include('Attack');
      expect(await attack({ human: ['player'], met: false })).to.include(
        'Attack'
      );

      // A computer player attacking a person across a treaty is asked as a person is.
      const across = await attack({ human: ['enemy'] }, Peace);

      expect(across).to.include('Overruled');
      expect(across).not.to.include('SneakAttack');
    });
  });

  describe('an attack', (): void => {
    const attack = async (
      treaty: Treaty | null,
      options: Options & {
        what?: 'unit' | 'city';
        Action?: 'attack' | 'sneak' | 'capture' | 'nuclear';
      } = {}
    ) => {
      const declared: [Player, Player, boolean, TreatyLevel][] = [],
        { what = 'unit', Action = treaty === null ? 'attack' : 'sneak' } =
          options,
        scenario = other(what, treaty, {
          ...options,
          extra: (setting) => {
            setting.game.rules.register(
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

            if (options.met !== false) {
              const attitudes = attitude({
                interactionRegistry: setting.game.interactions,
                ruleRegistry: setting.game.rules,
                turn: setting.game.turn,
              });

              attitudes.set(setting.player, setting.enemy, 30);
              attitudes.set(setting.enemy, setting.player, 40);
            }

            options.extra?.(setting);
          },
        }),
        { game, unit, to, from } = await setUp(
          scenario,
          Action === 'nuclear' ? Nuclear : Warrior
        ),
        enemy = scenario.enemy!,
        // The action as the table makes it, so the players it attacks are noted.
        made = unit
          .actions(to, from)
          .find((action) =>
            Action === 'attack'
              ? action.constructor === Attack
              : Action === 'capture'
              ? action instanceof CaptureCity
              : Action === 'nuclear'
              ? action instanceof NuclearAttack
              : action instanceof SneakAttack
          );

      expect(made, Action).not.undefined;

      game.rules.process(Moved, unit, made as UnitAction);

      const relations = {
        interactionRegistry: game.interactions,
        ruleRegistry: game.rules,
        turn: game.turn,
      };

      return {
        game,
        player: unit.player(),
        enemy,
        declared,
        level: treatyLevel(relations, unit.player(), enemy),
        attitudes: [
          attitude(relations).get(unit.player(), enemy),
          attitude(relations).get(enemy, unit.player()),
        ],
        sneak: hasFlag(relations, unit.player(), enemy, SNEAK_ATTACK),
        wars: game.interactions
          .getByPlayers(unit.player(), enemy)
          .filter(
            (interaction) => interaction instanceof War && interaction.active()
          ).length,
      };
    };

    it("across a ceasefire or a peace makes a person's attacker, or a person's attacked, declare war, forced, through base-diplomacy", async (): Promise<void> => {
      for (const [treaty, level] of [
        [Peace, TreatyLevel.Peace],
        [Ceasefire, TreatyLevel.Ceasefire],
      ] as const) {
        for (const human of [['player'], ['enemy']] as const) {
          const result = await attack(treaty, { human: [...human] });

          expect(result.declared).eql([
            [result.player, result.enemy, true, level],
          ]);
          expect(result.level).equal(TreatyLevel.War);
          expect(result.attitudes).eql([100, 100]);
          expect(result.sneak).to.true;
        }
      }
    });

    it('between two computer players ends a peace with no declaration and starts a war, both attitudes at 100', async (): Promise<void> => {
      const result = await attack(Peace);

      expect(result.declared).eql([]);
      expect(result.level).equal(TreatyLevel.War);
      expect(result.wars).equal(1);
      expect(result.attitudes).eql([100, 100]);
      expect(result.sneak).to.true;
    });

    it('between two computer players ends a ceasefire with the war it starts, so the treaty level reads war', async (): Promise<void> => {
      const result = await attack(Ceasefire);

      expect(result.declared).eql([]);
      expect(result.level).equal(TreatyLevel.War);
      expect(result.wars).equal(1);
      expect(result.attitudes).eql([100, 100]);
    });

    it('on a player met and not at war starts a war with no declaration; a capture and a nuclear attack too', async (): Promise<void> => {
      for (const Action of ['attack', 'capture', 'nuclear'] as const) {
        const result = await attack(null, {
          Action,
          what: Action === 'capture' ? 'city' : 'unit',
        });

        expect(result.declared, Action).eql([]);
        expect(result.level, Action).equal(TreatyLevel.War);
        expect(result.wars, Action).equal(1);
        expect(result.attitudes, Action).eql([100, 100]);
        expect(result.sneak, Action).to.true;
      }
    });

    it('mid-war sets both attitudes to 100 again, makes no second war, and marks no sneak attack once either side holds one', async (): Promise<void> => {
      const result = await attack(War, {
        Action: 'attack',
        extra: ({ game, player, enemy }) =>
          setFlag(
            {
              interactionRegistry: game.interactions,
              ruleRegistry: game.rules,
              turn: game.turn,
            },
            enemy,
            player,
            SNEAK_ATTACK
          ),
      });

      expect(result.wars).equal(1);
      expect(result.attitudes).eql([100, 100]);
      expect(result.sneak).to.false;
    });

    it('starts no war with a nuclear attack on an empty city, which is no battle', async (): Promise<void> => {
      const result = await attack(null, { Action: 'nuclear', what: 'city' });

      expect(result.wars).equal(0);
      expect(result.attitudes).eql([30, 40]);
      expect(result.sneak).to.false;
    });

    it('on a player never met changes nothing but the treaties', async (): Promise<void> => {
      const result = await attack(null, { met: false });

      expect(result.wars).equal(0);
      expect(result.level).equal(TreatyLevel.Contact);
      expect(result.attitudes).eql([undefined, undefined]);
      expect(result.sneak).to.false;
    });

    it("leaves a move onto a partner's land ending the peace only, with no war", async (): Promise<void> => {
      const declared: unknown[] = [],
        scenario = other('unit', Peace, {
          extra: ({ game }) =>
            game.rules.register(
              new DeclaredWar(
                new Effect((...args: unknown[]) => declared.push(args))
              )
            ),
        }),
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

  describe("pillaging a partner's land", (): void => {
    const pillage = async (human: boolean) => {
      const declared: [Player, Player, boolean, TreatyLevel][] = [],
        scenario = other('unit', Peace, {
          human: human ? ['player'] : [],
          extra: ({ game }) =>
            game.rules.register(
              new DeclaredWar(
                new Effect(
                  (
                    by: Player,
                    against: Player,
                    forced: boolean,
                    broken: TreatyLevel
                  ) => declared.push([by, against, forced, broken])
                )
              )
            ),
        }),
        { game, unit, to, from } = await setUp(scenario, Warrior),
        enemy = scenario.enemy!;

      game.rules.process(
        Moved,
        unit,
        new SneakPillage(
          from,
          to,
          unit,
          enemy,
          game.rules,
          game.tileImprovements,
          game.turn
        ) as unknown as UnitAction
      );

      return {
        declared,
        player: unit.player(),
        enemy,
        level: treatyLevel(
          { interactionRegistry: game.interactions },
          unit.player(),
          enemy
        ),
      };
    };

    it('makes a person declare war, through base-diplomacy, as the pillage command does', async (): Promise<void> => {
      const result = await pillage(true);

      expect(result.declared).eql([
        [result.player, result.enemy, true, TreatyLevel.Peace],
      ]);
      expect(result.level).equal(TreatyLevel.War);
    });

    it('ends only the peace for a computer player', async (): Promise<void> => {
      const result = await pillage(false);

      expect(result.declared).eql([]);
      expect(result.level).equal(TreatyLevel.Contact);
    });
  });

  describe("the Diplomat's and Spy's missions", (): void => {
    const owning =
      (Wonder: typeof UnitedNations | typeof MarcoPolosEmbassy) =>
      ({ game, player }: Setting): void => {
        const [home] = game.cities
          .entries()
          .filter((city: City) => city.player() === player);

        game.wonders.register(new Wonder(home, game.rules));
      };

    it('offer an embassy and an investigation, and no meeting with the leader', async (): Promise<void> => {
      for (const UnitType of [Diplomat, Spy]) {
        const actions = offered(
          await setUp(other('city', null, { human: ['enemy'] }), UnitType)
        );

        expect(actions.slice(0, 2)).eql([
          'EstablishEmbassy',
          'InvestigateCity',
        ]);
        expect(actions).not.to.include('MeetWithLeader');
      }
    });

    it("hide the embassy from the United Nations' owner, but not from Marco Polo's", async (): Promise<void> => {
      expect(
        offered(
          await setUp(
            other('city', null, { extra: owning(UnitedNations) }),
            Diplomat
          )
        )
      ).not.to.include('EstablishEmbassy');
      expect(
        offered(
          await setUp(
            other('city', null, { extra: owning(MarcoPolosEmbassy) }),
            Diplomat
          )
        )
      ).to.include('EstablishEmbassy');
    });
  });
});

void Unit;
