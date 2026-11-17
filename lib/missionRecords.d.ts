import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import City from '@civ-clone/core-city/City';
import Player from '@civ-clone/core-player/Player';
/** A city a Spy has investigated (`CITYF_INVESTIGATED`): a person's Spy pays a third of a move only the first time. */
export declare const INVESTIGATED = 'civ2-unit:city-investigated';
/** A civilization's subversions (`subversion_count`): 2 for each city incited, 1 for each unit bribed. */
export declare const SUBVERSIONS = 'civ2-unit:subversions';
/** Whether `city` has been investigated. */
export declare const investigated: (
  city: City,
  pendingEffectRegistry?: PendingEffectRegistry
) => boolean;
/** Marks `city` as investigated. */
export declare const markInvestigated: (
  city: City,
  pendingEffectRegistry?: PendingEffectRegistry
) => void;
/** Forgets `city`'s record, when it's gone. */
export declare const forgetCity: (
  city: City,
  pendingEffectRegistry?: PendingEffectRegistry
) => void;
/** `player`'s subversions. */
export declare const subversions: (
  player: Player,
  pendingEffectRegistry?: PendingEffectRegistry
) => number;
/** Adds `count` to `player`'s subversions. */
export declare const addSubversions: (
  player: Player,
  count: number,
  pendingEffectRegistry?: PendingEffectRegistry
) => void;
