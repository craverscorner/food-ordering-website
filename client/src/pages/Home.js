import React, { useState, useEffect } from 'react';
import {
  Container,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

const Home = () => {
  const { menuItems, categories, getItemsForCategory, menuItemCategories, menuItemSubcategories, categorySubcategoryLinks } = useMenu();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  // Only show categories (type === 'category')
  const mainCategories = categories.filter(cat => cat.type === 'category');

  useEffect(() => {
    if (mainCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(mainCategories[0].id);
    }
  }, [mainCategories, selectedCategory]);

  // Get items for selected category using join table
  const items = selectedCategory ? getItemsForCategory(selectedCategory) : [];

  // Get subcategories for the selected category using the join table from context
  const categorySubcategoryIds = categorySubcategoryLinks
    .filter(link => String(link.category_id) === String(selectedCategory))
    .map(link => link.subcategory_id);
  const categorySubcategories = categories
    .filter(cat => cat.type === 'subcategory' && categorySubcategoryIds.includes(cat.id))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Group items by subcategory (support multiple subcategories per item)
  const itemsBySubcategory = {};
  const subcategoryIdToName = {};
  categorySubcategories.forEach(sub => {
    subcategoryIdToName[sub.id] = sub.name;
  });
  items.forEach(item => {
    // Find all subcategory links for this item that belong to the current category's subcategories
    const subLinks = menuItemSubcategories.filter(link => link.menu_item_id === item.id && categorySubcategories.some(sub => sub.id === link.subcategory_id));
    if (subLinks.length > 0) {
      subLinks.forEach(link => {
        const subName = subcategoryIdToName[link.subcategory_id];
        if (!itemsBySubcategory[subName]) itemsBySubcategory[subName] = [];
        // Avoid duplicates
        if (!itemsBySubcategory[subName].some(i => i.id === item.id)) {
          itemsBySubcategory[subName].push(item);
        }
      });
    } else {
      // No subcategory for this category, put in 'Other'
      if (!itemsBySubcategory['Other']) itemsBySubcategory['Other'] = [];
      itemsBySubcategory['Other'].push(item);
    }
  });

  const debouncedSearch = debounce((query) => { /* fetch from DB */ }, 300);

  // Debug output
  const menuItemIds = menuItemCategories
    .filter(link => String(link.category_id) === String(selectedCategory))
    .map(link => String(link.menu_item_id));
  console.log('selectedCategory:', selectedCategory);
  console.log('menuItemCategories:', menuItemCategories);
  console.log('menuItemIds:', menuItemIds);
  console.log('items:', items);
  console.log('menuItems:', menuItems);

  return (
    <Container maxWidth="sm" sx={{ pb: 10 }}>
      {mainCategories.length === 0 || !selectedCategory ? (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          No categories found.
        </Typography>
      ) : (
        <>
          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onChange={(e, val) => setSelectedCategory(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {mainCategories.map(cat => (
              <Tab key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Tabs>

          {/* Menu Items */}
          {items.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
              No items found for this category.
            </Typography>
          ) : (
            <>
              {categorySubcategories.map(subcategory => {
                const subcategoryItems = itemsBySubcategory[subcategory.name] || [];
                if (subcategoryItems.length === 0) return null;
                return (
                  <Box key={subcategory.name} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                      {subcategory.name}
                    </Typography>
                    {subcategoryItems.map(item => {
                      const cartItem = cart.find(ci => ci.id === item.id);
                      return (
                        <Paper key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              £{item.price?.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.description}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2 }}>
                            {item.image_url && (
                              <Box
                                component="img"
                                src={item.image_url}
                                alt={item.name}
                                sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 2, mb: 1 }}
                              />
                            )}
                            {cartItem && cartItem.quantity > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ minWidth: 32, px: 0 }}
                                  onClick={() => {
                                    if (cartItem.quantity === 1) {
                                      removeFromCart(item.id);
                                    } else {
                                      updateQuantity(item.id, cartItem.quantity - 1);
                                    }
                                  }}
                                >
                                  -
                                </Button>
                                <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>{cartItem.quantity}</Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ minWidth: 32, px: 0 }}
                                  onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                >
                                  +
                                </Button>
                              </Box>
                            ) : (
                              <Button
                                variant="contained"
                                color="primary"
                                sx={{ mt: 1, fontSize: '0.8rem', px: 2, py: 0.5 }}
                                onClick={() => addToCart(item)}
                              >
                                Add to Cart
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                );
              })}
              {(() => {
                const otherItems = itemsBySubcategory['Other'] || [];
                if (otherItems.length === 0) return null;
                return (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                      Other
                    </Typography>
                    {otherItems.map(item => {
                      const cartItem = cart.find(ci => ci.id === item.id);
                      return (
                        <Paper key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              £{item.price?.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.description}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2 }}>
                            {item.image_url && (
                              <Box
                                component="img"
                                src={item.image_url}
                                alt={item.name}
                                sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 2, mb: 1 }}
                              />
                            )}
                            {cartItem && cartItem.quantity > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ minWidth: 32, px: 0 }}
                                  onClick={() => {
                                    if (cartItem.quantity === 1) {
                                      removeFromCart(item.id);
                                    } else {
                                      updateQuantity(item.id, cartItem.quantity - 1);
                                    }
                                  }}
                                >
                                  -
                                </Button>
                                <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>{cartItem.quantity}</Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ minWidth: 32, px: 0 }}
                                  onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                >
                                  +
                                </Button>
                              </Box>
                            ) : (
                              <Button
                                variant="contained"
                                color="primary"
                                sx={{ mt: 1, fontSize: '0.8rem', px: 2, py: 0.5 }}
                                onClick={() => addToCart(item)}
                              >
                                Add to Cart
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                );
              })()}
            </>
          )}
        </>
      )}
      {/* Go to Basket Button */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '100vw',
          borderRadius: 0,
          py: 2,
          zIndex: 1200,
        }}
        onClick={() => navigate('/cart')}
      >
        Go to Basket
      </Button>
    </Container>
  );
};

export default Home; 
