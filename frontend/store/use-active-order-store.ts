import { create } from 'zustand';

import type { Order } from '@/types';

export type { Order, OrderItem } from '@/types';

/** Seeded sample when no order is selected (matches backend DataSeeder). */
export const FALLBACK_START_CODE = 'PACK-01';
export const FALLBACK_PICK_LIST_CODES = ['A1-B03', 'A2-B01', 'A3-B04', 'A1-B01'];

type ActiveOrderState = {
  order: Order | null;
  setActiveOrder: (order: Order) => void;
  clearActiveOrder: () => void;
};

export const useActiveOrderStore = create<ActiveOrderState>((set) => ({
  order: null,
  setActiveOrder: (order) => set({ order }),
  clearActiveOrder: () => set({ order: null }),
}));
