// src/lib/store.ts
// Global state management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---- Types ----
export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  variant: string | null;
  quantity: number;
};

export type WishlistItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
};

type Store = {
  // Cart state
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string | null) => void;
  updateQty: (productId: string, qty: number, variant?: string | null) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;

  // Wishlist state
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  // UI state
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  darkMode: boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  toggleDarkMode: () => void;

  // WhatsApp Checkout state
  whatsAppModalOpen: boolean;
  whatsAppOrderItems: any[];
  whatsAppTotal: number;
  setWhatsAppModalOpen: (open: boolean) => void;
  openWhatsAppModal: (items: any[], total: number) => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // ---- WhatsApp Checkout ----
      whatsAppModalOpen: false,
      whatsAppOrderItems: [],
      whatsAppTotal: 0,
      setWhatsAppModalOpen: (open) => set({ whatsAppModalOpen: open }),
      openWhatsAppModal: (items, total) => set({ 
        whatsAppModalOpen: true, 
        whatsAppOrderItems: items, 
        whatsAppTotal: total 
      }),

      // ---- Cart ----
      items: [],

      addItem: (newItem) => {
        const { items } = get();
        const exists = items.find(
          (i) => i.productId === newItem.productId && i.variant === newItem.variant
        );
        if (exists) {
          set({
            items: items.map((i) =>
              i.productId === newItem.productId && i.variant === newItem.variant
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, id: `${newItem.productId}-${newItem.variant}-${Date.now()}` }] });
        }
      },

      removeItem: (productId, variant = null) => {
        set({ items: get().items.filter((i) => !(i.productId === productId && i.variant === variant)) });
      },

      updateQty: (productId, qty, variant = null) => {
        if (qty <= 0) { get().removeItem(productId, variant); return; }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variant === variant ? { ...i, quantity: qty } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      // ---- Wishlist (renamed methods to avoid collision) ----
      wishlist: [],

      addToWishlist: (item) => {
        const { wishlist } = get();
        if (!wishlist.find((w) => w.productId === item.productId)) {
          set({ wishlist: [...wishlist, item] });
        }
      },

      removeFromWishlist: (productId) => {
        set({ wishlist: get().wishlist.filter((w) => w.productId !== productId) });
      },

      isWishlisted: (productId) =>
        !!get().wishlist.find((w) => w.productId === productId),

      // ---- UI ----
      cartOpen: false,
      searchOpen: false,
      menuOpen: false,
      darkMode: false,

      setCartOpen: (open) => set({ cartOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setMenuOpen: (open) => set({ menuOpen: open }),
      toggleDarkMode: () => {
        const dark = !get().darkMode;
        set({ darkMode: dark });
        document.documentElement.classList.toggle('dark', dark);
      },
    }),
    {
      name: 'daisy-store',
      partialize: (state) => ({
        items: state.items,
        wishlist: state.wishlist,
        darkMode: state.darkMode,
      }),
    }
  )
);

// Separate typed hooks for clarity
export const useCart = () => {
  const store = useStore();
  return {
    items: store.items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQty: store.updateQty,
    clearCart: store.clearCart,
    totalItems: store.totalItems,
    totalPrice: store.totalPrice,
  };
};

export const useWishlist = () => {
  const store = useStore();
  return {
    wishlist: store.wishlist,
    addToWishlist: store.addToWishlist,
    removeFromWishlist: store.removeFromWishlist,
    isWishlisted: store.isWishlisted,
  };
};
