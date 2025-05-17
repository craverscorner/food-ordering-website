import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Button } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link as RouterLink } from 'react-router-dom';

const Header = ({ cartCount = 0 }) => (
  <AppBar position="static" color="primary">
    <Toolbar>
      <Typography
        variant="h6"
        component={RouterLink}
        to="/"
        sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
      >
        FoodOrder
      </Typography>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
        <Button color="inherit" component={RouterLink} to="/">Home</Button>
        <Button color="inherit" component={RouterLink} to="/menu">Menu</Button>
        <Button color="inherit" component={RouterLink} to="/order-history">Order History</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
        <Button color="inherit" component={RouterLink} to="/login">Sign In</Button>
        <Button color="inherit" component={RouterLink} to="/register">Sign Up</Button>
        <IconButton color="inherit" component={RouterLink} to="/cart">
          <Badge badgeContent={cartCount} color="secondary">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Box>
    </Toolbar>
  </AppBar>
);

export default Header; 