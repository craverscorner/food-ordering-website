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

const Menu = () => {
  const { menuItems, categories, getItemsForCategory } = useMenu();
  const { cart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter main categories only (type === 'category')
  let filteredCategories = categories.filter(cat =>
    cat.type === 'category'
  );

  // Set selectedCategory to the first available category when categories change
  useEffect(() => {
    if (filteredCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(String(filteredCategories[0].id));
    }
  }, [filteredCategories, selectedCategory]);

  // Get items for selected category using join table
  const items = selectedCategory ? getItemsForCategory(selectedCategory) : [];

  // Get subcategories for the selected category
  const categorySubcategories = categories.filter(cat =>
    cat.type === 'subcategory' && String(cat.parent_id) === String(selectedCategory)
  );

  // Group items by subcategory
  const itemsBySubcategory = items.reduce((acc, item) => {
    // Find the subcategory if it exists
    const subcategory = categorySubcategories.find(sub => String(sub.id) === String(item.subcategory_id));
    const subcategoryName = subcategory ? subcategory.name : 'Other';
    if (!acc[subcategoryName]) {
      acc[subcategoryName] = [];
    }
    acc[subcategoryName].push(item);
    return acc;
  }, {});

  // Debugging
  console.log('categories:', categories);
  console.log('menuItems:', menuItems);
  console.log('filteredCategories:', filteredCategories);
  console.log('selectedCategory:', selectedCategory);
  console.log('items:', items);

  return (
    <Container maxWidth="sm" sx={{ pb: 10 }}>
      {filteredCategories.length === 0 || !selectedCategory ? (
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
            {filteredCategories.map(cat => (
              <Tab key={cat.id} label={cat.name} value={String(cat.id)} />
            ))}
          </Tabs>

          {/* Category Heading */}
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            {filteredCategories.find(cat => String(cat.id) === String(selectedCategory))?.name}
          </Typography>

          {/* Menu Items Grouped by Subcategory */}
          {Object.entries(itemsBySubcategory).map(([subcategory, subcategoryItems]) => (
            <Box key={subcategory} sx={{ mb: 4 }}>
              {/* Subcategory Heading */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                {subcategory}
              </Typography>

              {/* Menu Items */}
              {subcategoryItems.map(item => (
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
                  {item.image_url && (
                    <Box
                      component="img"
                      src={item.image_url}
                      alt={item.name}
                      sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 2, ml: 2 }}
                    />
                  )}
                </Paper>
              ))}
            </Box>
          ))}
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
        onClick={() => {/* navigate to cart */}}
      >
        Go to Basket
      </Button>
    </Container>
  );
};

export default Menu; 