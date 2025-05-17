import React, { useState } from 'react';
import { Container, Grid, Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CategoryTabs from '../components/CategoryTabs';
import MenuItemCard from '../components/MenuItemCard';

const menuItems = [
  { id: 1, name: 'Pepperoni Pizza', price: 12.99, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80', description: 'Classic pepperoni pizza with mozzarella cheese.', category: 'Pizza' },
  { id: 2, name: 'Veggie Pizza', price: 11.99, image: 'https://images.unsplash.com/photo-1548365328-8b849e6c7b77?auto=format&fit=crop&w=400&q=80', description: 'Loaded with fresh veggies and cheese.', category: 'Pizza' },
  { id: 3, name: 'BBQ Chicken Pizza', price: 13.99, image: 'https://images.unsplash.com/photo-1601924579440-5160637fae8c?auto=format&fit=crop&w=400&q=80', description: 'BBQ sauce, chicken, and onions.', category: 'Pizza' },
  { id: 4, name: 'Garlic Bread', price: 4.99, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80', description: 'Crispy garlic bread.', category: 'Sides' },
  { id: 5, name: 'Chicken Wings', price: 7.99, image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80', description: 'Spicy chicken wings.', category: 'Sides' },
  { id: 6, name: 'Brownie', price: 3.99, image: 'https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=400&q=80', description: 'Chocolate brownie dessert.', category: 'Desserts' },
  { id: 7, name: 'Coke', price: 1.99, image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad04?auto=format&fit=crop&w=400&q=80', description: 'Refreshing Coca-Cola.', category: 'Drinks' },
  { id: 8, name: 'Sprite', price: 1.99, image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80', description: 'Lemon-lime soda.', category: 'Drinks' },
];

const categories = ['Pizza', 'Sides', 'Desserts', 'Drinks'];

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('Pizza');
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = () => {
    setCartCount(cartCount + 1);
  };

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <Header cartCount={cartCount} />
      {/* Hero Banner */}
      <Box sx={{ width: '100%', height: 220, background: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80) center/cover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <Typography variant="h3" color="white" sx={{ bgcolor: 'rgba(0,0,0,0.5)', px: 4, py: 2, borderRadius: 2, fontWeight: 'bold' }}>
          Order Your Favorite Food Online!
        </Typography>
      </Box>
      <Container maxWidth="lg">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onChangeCategory={setSelectedCategory}
        />
        <Grid container spacing={4}>
          {filteredItems.map(item => (
            <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
              <MenuItemCard item={item} onAddToCart={handleAddToCart} />
            </Grid>
          ))}
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
};

export default Home; 