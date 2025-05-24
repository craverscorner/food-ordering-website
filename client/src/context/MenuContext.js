import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const MenuContext = createContext();

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}

export function MenuProvider({ children }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuItemCategories, setMenuItemCategories] = useState([]); // join table
  const [menuItemToCategories, setMenuItemToCategories] = useState({}); // mapping
  const [menuItemSubcategories, setMenuItemSubcategories] = useState([]); // join table for subcategories
  const [categorySubcategoryLinks, setCategorySubcategoryLinks] = useState([]);

  // Fetch initial menu data
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch menu items
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .order('name');

        if (menuError) throw menuError;
        setMenuItems(menuData || []);

        // Fetch menu_item_categories join table
        const { data: micData, error: micError } = await supabase
          .from('menu_item_categories')
          .select('*');
        if (micError) throw micError;
        setMenuItemCategories(micData || []);
        // Build mapping
        const mapping = {};
        (micData || []).forEach(link => {
          if (!mapping[link.menu_item_id]) mapping[link.menu_item_id] = [];
          mapping[link.menu_item_id].push(link.category_id);
        });
        setMenuItemToCategories(mapping);

        // Fetch menu_item_subcategories join table
        const { data: miscData, error: miscError } = await supabase
          .from('menu_item_subcategories')
          .select('*');
        if (miscError) throw miscError;
        setMenuItemSubcategories(miscData || []);

        // Fetch category_subcategory_links
        const { data: linksData, error: linksError } = await supabase
          .from('category_subcategory_links')
          .select('*');
        if (linksError) throw linksError;
        setCategorySubcategoryLinks(linksData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to menu items changes
    const menuSubscription = supabase
      .channel('menu_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMenuItems(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setMenuItems(prev => 
              prev.map(item => item.id === payload.new.id ? payload.new : item)
            );
          } else if (payload.eventType === 'DELETE') {
            setMenuItems(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to categories changes
    const categoriesSubscription = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCategories(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setCategories(prev => 
              prev.map(category => category.id === payload.new.id ? payload.new : category)
            );
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => 
              prev.filter(category => category.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      menuSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
    };
  }, []);

  // Helper: get all menu items for a given category using the join table
  const getItemsForCategory = (categoryId) => {
    // Find all menu_item_ids for this category
    const menuItemIds = menuItemCategories
      .filter(link => String(link.category_id) === String(categoryId))
      .map(link => link.menu_item_id);
    // Return menu items that match
    return menuItems.filter(item => menuItemIds.includes(item.id));
  };

  const getItemById = (id) => {
    return menuItems.find(item => item.id === id);
  };

  const value = {
    menuItems,
    categories,
    loading,
    error,
    menuItemCategories,
    menuItemToCategories,
    menuItemSubcategories,
    categorySubcategoryLinks,
    getItemsForCategory,
    getItemById
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
} 