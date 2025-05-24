import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Button, Menu, MenuItem } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Header = ({ cartCount = 0 }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { cart_id } = useParams();
  const [cart, setCart] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Check if user is admin
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!error && data && data.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    getUser();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchCart() {
      const { data, error } = await supabase
        .from('carts')
        .select('*')
        .eq('id', cart_id)
        .single();
      setCart(data);
    }
    fetchCart();
  }, [cart_id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
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
          {user && <Button color="inherit" component={RouterLink} to="/order-history">Order History</Button>}
          {isAdmin && <Button color="inherit" component={RouterLink} to="/admin">Admin</Button>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          {!user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={handleSignOut}>Sign Out</Button>
            </>
          )}
          <IconButton color="inherit" component={RouterLink} to="/cart">
            <Badge badgeContent={cartCount} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 