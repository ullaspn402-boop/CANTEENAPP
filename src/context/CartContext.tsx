import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, FoodItem, Order } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { buildApiUrl } from '../lib/apiClient.ts';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (foodItemId: number) => void;
  updateQuantity: (foodItemId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  placeOrder: (specialInstructions?: string) => Promise<Order>;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  refreshActiveOrder: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authHeaders, user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('canteen_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('canteen_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Check active order on mount or user change
  const refreshActiveOrder = async () => {
    if (!user) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch(buildApiUrl('/api/orders/my-orders'), { headers: authHeaders() });
      if (res.ok) {
        const orders: Order[] = await res.json();
        // find ongoing order (confirmed, preparing, ready)
        const ongoing = orders.find((o) => ['confirmed', 'preparing', 'ready'].includes(o.status));
        setActiveOrder(ongoing || null);
      }
    } catch (err: any) {
      // Handle network drop / server restart blips gracefully without throwing fatal console errors
      if (
        err?.name === 'AbortError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Load failed')
      ) {
        console.warn('Active orders polling: server/network momentarily unavailable, will retry silently.');
      } else {
        console.warn('Notice while loading active orders:', err?.message || err);
      }
    }
  };

  useEffect(() => {
    refreshActiveOrder();
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        refreshActiveOrder();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.foodItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.foodItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { foodItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (foodItemId: number) => {
    setCart((prev) => prev.filter((c) => c.foodItem.id !== foodItemId));
  };

  const updateQuantity = (foodItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodItemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.foodItem.id === foodItemId ? { ...c, quantity } : c))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.foodItem.price * item.quantity, 0);

  const placeOrder = async (specialInstructions?: string): Promise<Order> => {
    if (cart.length === 0) throw new Error('Your tray is empty. Add food items to order.');

    // Generate client idempotency key to prevent accidental double-submits
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payload = {
      items: cart.map((c) => ({
        foodItemId: c.foodItem.id,
        quantity: c.quantity,
      })),
      specialInstructions,
      idempotencyKey,
    };

    let res: Response;
    try {
      res = await fetch(buildApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (networkErr: any) {
      // Network drop or timeout during checkout: Section 18 requirement
      throw new Error(
        'Order status unknown due to network disruption. Please check your active orders before retrying to avoid duplicate charges.'
      );
    }

    if (!res.ok) {
      let errorMsg = 'Failed to place order.';
      try {
        const err = await res.json();
        errorMsg = err.message || err.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const order: Order = await res.json();
    clearCart();
    setActiveOrder(order);
    setIsCartOpen(false);
    return order;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
        placeOrder,
        activeOrder,
        setActiveOrder,
        refreshActiveOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
