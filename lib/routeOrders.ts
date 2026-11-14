import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import { RailroadTo, RoadTo } from '../Actions';
import RailroadAdvance from '@civ-clone/base-science-advance-railroad/Railroad';
import Terraforms from '@civ-clone/base-unit-trait-terraforms/Terraforms';
import Unit from '@civ-clone/core-unit/Unit';
import { routeOrders as routeOrderTable } from '@civ-clone/base-unit-action-build-route/lib/routeOrders';

// The route orders a unit may be given for a distant square: Road to for a unit that `Terraforms`, and Railroad to
//  once its player knows Railroad.
const civ2RouteOrders = routeOrderTable<typeof RoadTo | typeof RailroadTo>(
  [
    [RoadTo, null],
    [RailroadTo, RailroadAdvance],
  ],
  Terraforms
);

export const routeOrders = (
  unit: Unit,
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance
): (typeof RoadTo | typeof RailroadTo)[] =>
  civ2RouteOrders(unit, playerResearchRegistry);

export default routeOrders;
