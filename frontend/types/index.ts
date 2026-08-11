/**
 * API contracts mirroring Spring Boot DTOs.
 * Keep field names in sync with backend/src/.../dto.
 */

export type OptimizeRouteRequest = {
  startCode: string;
  pickListCodes: string[];
};

export type OptimizeRouteResponse = {
  orderedBinCodes: string[];
  totalDistance: number;
};

export type RouteHistoryEntry = {
  id: number;
  startCode: string;
  pickListCodes: string[];
  orderedBinCodes: string[];
  totalDistance: number;
  createdAt: string;
};

export type RouteAnalytics = {
  totalRoutes: number;
  averageDistance: number;
  latestDistance: number;
  latestTimestamp: string | null;
};

export type OrderItem = {
  id: number;
  binCode: string;
  position: number;
  picked: boolean;
};

export type Order = {
  id: number;
  startCode: string;
  pickListCodes: string[];
  items: OrderItem[];
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type CreateOrderRequest = {
  startCode: string;
  pickListCodes: string[];
};
