import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

// ─── CART STORE ───────────────────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, variant = null, quantity = 1) => {
        const { items } = get();
        const key = `${product.id}-${variant?.id || 'default'}`;
        const existing = items.find(i => `${i.product_id}-${i.variant_id || 'default'}` === key);

        if (existing) {
          set({ items: items.map(i =>
            `${i.product_id}-${i.variant_id || 'default'}` === key
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )});
        } else {
          set({ items: [...items, {
            id: key,
            product_id: product.id,
            variant_id: variant?.id || null,
            product_name: product.name || product.display_name,
            variant_name: variant ? `${variant.type}: ${variant.value}` : null,
            price: parseFloat(product.price) + parseFloat(variant?.price_adjustment || 0),
            image_url: variant?.image_url || product.image_url,
            slug: product.slug,
            quantity,
            stock: product.stock || 999
          }]});
        }

        set({ isOpen: true });
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter(i => i.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) return;
        set({ items: get().items.map(i => i.id === itemId ? { ...i, quantity } : i) });
      },

      clearCart: () => set({ items: [] }),

      setOpen: (open) => set({ isOpen: open }),
    }),
    { name: 'ecommerce-cart', version: 1 }
  )
);

// Selectors — computed values must NOT be getters on the store object:
// zustand's set() uses Object.assign, which freezes getters into stale static values.
export const selectSubtotal = (s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectTotalItems = (s) => s.items.reduce((sum, i) => sum + i.quantity, 0);

// ─── AUTH STORE ───────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      isAdmin: () => get().user?.role === 'admin' || get().user?.role === 'moderator',
    }),
    { name: 'ecommerce-auth', version: 1 }
  )
);

// ─── UI STORE ─────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  searchOpen: false,
  mobileMenuOpen: false,

  setSearchOpen: (v) => set({ searchOpen: v }),
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
}));

// ─── WISHLIST STORE ───────────────────────────────────────────────────────────
// Local ids drive instant UI and work for guests. When a token is present the
// toggle is mirrored to POST /wishlist/:id, and loadFromServer() hydrates ids
// from GET /users/wishlist after login.
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const had = get().ids.includes(id);
        set({ ids: had ? get().ids.filter(i => i !== id) : [...get().ids, id] });
        if (localStorage.getItem('token')) {
          api.post(`/wishlist/${id}`).catch(() => {
            // revert optimistic change on failure
            const cur = get().ids;
            set({ ids: had ? [...cur, id] : cur.filter(i => i !== id) });
          });
        }
      },
      has: (id) => get().ids.includes(id),
      loadFromServer: async () => {
        if (!localStorage.getItem('token')) return;
        try {
          const d = await api.get('/users/wishlist');
          set({ ids: (d.wishlist || []).map(w => w.product_id) });
        } catch { /* keep local copy */ }
      },
      clear: () => set({ ids: [] }),
    }),
    { name: 'ecommerce-wishlist' }
  )
);
