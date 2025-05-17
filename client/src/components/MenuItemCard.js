import React from 'react';
import { Card, CardMedia, CardContent, Typography, Button } from '@mui/material';

const MenuItemCard = ({ item, onAddToCart }) => (
  <Card>
    <CardMedia
      component="img"
      height="180"
      image={item.image}
      alt={item.name}
    />
    <CardContent>
      <Typography gutterBottom variant="h6" component="div">
        {item.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {item.description}
      </Typography>
      <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
        ${item.price}
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