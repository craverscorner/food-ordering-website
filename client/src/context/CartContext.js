import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize cart from localStorage and Supabase
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // First try to get from localStorage
        const stored = localStorage.getItem('cart');
        let initialCart = [];
        
        if (stored) {
          try {
            const parsedCart = JSON.parse(stored);
            if (Array.isArray(parsedCart)) {
              initialCart = parsedCart;
            }
          } catch (e) {
            console.error('Error parsing stored cart:', e);
          }
        }

        // Then try to get from Supabase if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error: fetchError } = await supabase
            .from('carts')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (data?.items) {
            // Merge local cart with server cart
            const serverItems = data.items;
            const mergedCart = [...initialCart];
            
            serverItems.forEach(serverItem => {
              const existingItem = mergedCart.find(item => item.id === serverItem.id);
              if (existingItem) {
                existingItem.quantity = Math.max(existingItem.quantity, serverItem.quantity);
              } else {
                mergedCart.push(serverItem);
              }
            });
            
            initialCart = mergedCart;
          }
        }

        setCart(initialCart);
      } catch (err) {
        console.error('Error initializing cart:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeCart();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // When user signs in, fetch their cart from Supabase
        const { data, error: fetchError } = await supabase
          .from('carts')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!fetchError && data?.items) {
          // Merge with existing cart
          const serverItems = data.items;
          const mergedCart = [...cart];
          
          serverItems.forEach(serverItem => {
            const existingItem = mergedCart.find(item => item.id === serverItem.id);
            if (existingItem) {
              existingItem.quantity = Math.max(existingItem.quantity, serverItem.quantity);
            } else {
              mergedCart.push(serverItem);
            }
          });
          
          setCart(mergedCart);
        }
      } else if (event === 'SIGNED_OUT') {
        // When user signs out, keep the cart in localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!initialized) return;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Subscribe to changes in the user's cart
      const subscription = supabase
        .channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'carts',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new?.items) {
              setCart(payload.new.items);
              localStorage.setItem('cart', JSON.stringify(payload.new.items));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, [initialized]);

  // Sync with Supabase when cart changes
  useEffect(() => {
    if (!initialized) return;

    const syncWithSupabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { error: saveError } = await supabase
          .from('carts')
          .upsert({
            user_id: user.id,
            items: cart,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (saveError) throw saveError;

      } catch (err) {
        console.error('Error syncing cart with Supabase:', err);
        setError(err.message);
      }
    };

    // Debounce the sync operation
    const timeoutId = setTimeout(syncWithSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [cart, initialized]);

  // Save to localStorage
  useEffect(() => {
    if (!initialized) return;
    
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, [cart, initialized]);

  const addToCart = (item) => {
    if (!item || !item.id) {
      console.error('Invalid item added to cart:', item);
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: (i.quantity || 0) + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    if (!id) {
      console.error('Invalid item ID for removal:', id);
      return;
    }

    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (!id || quantity < 1) {
      console.error('Invalid quantity update:', { id, quantity });
      return;
    }

    setCart(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  if (!initialized) {
    return null;
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
} 