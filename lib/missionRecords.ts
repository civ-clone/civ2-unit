import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import City from '@civ-clone/core-city/City';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import Player from '@civ-clone/core-player/Player';

// What the original keeps in its city and civilization records for Diplomats and Spies, kept as never-discharged
//  pending effects (saved like any other): a city once investigated (`CITYF_INVESTIGATED`) and a civilization's
//  subversions (`civs[].subversion_count`). Neither has a handler: nothing ever comes due.

/** A city a Spy has investigated (`CITYF_INVESTIGATED`): a person's Spy pays a third of a move only the first time. */
export const INVESTIGATED = 'civ2-unit:city-investigated';

/** A civilization's subversions (`subversion_count`): 2 for each city incited, 1 for each unit bribed. */
export const SUBVERSIONS = 'civ2-unit:subversions';

const find = (
  handler: string,
  target: City | Player,
  pendingEffectRegistry: PendingEffectRegistry
): PendingEffect | null =>
  pendingEffectRegistry
    .getByTarget(target)
    .find((effect: PendingEffect): boolean => effect.handler() === handler) ??
  null;

/** Whether `city` has been investigated. */
export const investigated = (
  city: City,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): boolean => find(INVESTIGATED, city, pendingEffectRegistry) !== null;

/** Marks `city` as investigated. */
export const markInvestigated = (
  city: City,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  if (!investigated(city, pendingEffectRegistry)) {
    pendingEffectRegistry.register(new PendingEffect(INVESTIGATED, city));
  }
};

/** Forgets `city`'s record, when it's gone. */
export const forgetCity = (
  city: City,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  const effect = find(INVESTIGATED, city, pendingEffectRegistry);

  if (effect !== null) {
    pendingEffectRegistry.unregister(effect);
  }
};

/** `player`'s subversions. */
export const subversions = (
  player: Player,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): number =>
  Number(find(SUBVERSIONS, player, pendingEffectRegistry)?.data().count ?? 0);

/** Adds `count` to `player`'s subversions. */
export const addSubversions = (
  player: Player,
  count: number,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  const effect = find(SUBVERSIONS, player, pendingEffectRegistry),
    total = subversions(player, pendingEffectRegistry) + count;

  if (effect !== null) {
    pendingEffectRegistry.unregister(effect);
  }

  pendingEffectRegistry.register(
    new PendingEffect(SUBVERSIONS, player, { count: String(total) })
  );
};
