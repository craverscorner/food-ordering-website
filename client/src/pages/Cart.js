import React from 'react';
import { Container, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const Cart = () => {
  const cartItems = [
    {
      id: 1,
      name: 'Pizza',
      price: 12.99,
      quantity: 2
    },
    {
      id: 2,
      name: 'Burger',
      price: 8.99,
      quantity: 1
    }
  ];

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Shopping Cart
      </Typography>
      <List>
        {cartItems.map((item) => (
          <ListItem key={item.id} divider>
            <ListItemText
              primary={item.name}
              secondary={`Quantity: ${item.quantity}`}
            />
            <ListItemText
              primary={`$${(item.price * item.quantity).toFixed(2)}`}
              align="right"
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete">
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 4, textAlign: 'right' }}>
        <Typography variant="h5" gutterBottom>
          Total: ${total.toFixed(2)}
        </Typography>
        <Button variant="contained" color="primary" size="large">
          Proceed to Checkout
        </Button>
      </Box>
    </Container>
  );
};

export default Cart; 