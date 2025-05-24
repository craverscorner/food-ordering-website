import React from 'react';
import { Card, CardMedia, CardContent, Typography, Button, Box } from '@mui/material';

const MenuItemCard = ({ item, onAddToCart }) => (
  <Card>
    <Box sx={{ width: '100%', aspectRatio: '1 / 1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={item.image}
        alt={item.name}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </Box>
    <CardContent>
      <Typography gutterBottom variant="h6" component="div">
        {item.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {item.description}
      </Typography>
      <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
        {item.price !== undefined && item.price !== null ?
          item.price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) :
          ''}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        fullWidth
        onClick={() => onAddToCart(item)}
      >
        Add to Cart
      </Button>
    </CardContent>
  </Card>
);

export default MenuItemCard; 