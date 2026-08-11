import { apiGet, apiPatch, apiPost } from '@/lib/client';
import type {
  CreateOrderRequest,
  OptimizeRouteRequest,
  OptimizeRouteResponse,
  Order,
  RouteAnalytics,
  RouteHistoryEntry,
} from '@/types';

export const optimizeRoute = (payload: OptimizeRouteRequest) =>
  apiPost<OptimizeRouteResponse>('/api/routes/optimize', payload);

export const getRouteHistory = () => apiGet<RouteHistoryEntry[]>('/api/routes/history');

export const getRouteAnalytics = () => apiGet<RouteAnalytics>('/api/routes/analytics');

export const listOrders = () => apiGet<Order[]>('/api/orders');

export const createOrder = (payload: CreateOrderRequest) =>
  apiPost<Order>('/api/orders', payload);

export const completeOrder = (orderId: number) =>
  apiPatch<Order>(`/api/orders/${orderId}/complete`);

export const pickOrderItem = (orderId: number, itemId: number) =>
  apiPatch<Order>(`/api/orders/${orderId}/items/${itemId}/pick`);
