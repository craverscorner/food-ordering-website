import React, { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Alert, Container, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, AppBar, CssBaseline, Button, Grid, Paper
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { supabase } from '../supabaseClient';
import MenuManager from './MenuManager';
import AdminOrders from './AdminOrders';
import CategoryManager from './CategoryManager';
import CouponManager from './CouponManager';

const drawerWidth = 220;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      setError('');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profileError || !data) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }
      if (data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setError('You are not authorized to view this page.');
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button selected={selectedMenu === 'dashboard'} onClick={() => setSelectedMenu('dashboard')}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard Home" />
            </ListItem>
            <ListItem button selected={selectedMenu === 'menu'} onClick={() => setSelectedMenu('menu')}>
              <ListItemIcon><RestaurantMenuIcon /></ListItemIcon>
              <ListItemText primary="Menu Management" />
            </ListItem>
            <ListItem button selected={selectedMenu === 'categories'} onClick={() => setSelectedMenu('categories')}>
              <ListItemIcon><CategoryIcon /></ListItemIcon>
              <ListItemText primary="Categories & Subcategories" />
            </ListItem>
            <ListItem button selected={selectedMenu === 'orders'} onClick={() => setSelectedMenu('orders')}>
              <ListItemIcon><RestaurantMenuIcon /></ListItemIcon>
              <ListItemText primary="Orders" />
            </ListItem>
            <ListItem button selected={selectedMenu === 'coupons'} onClick={() => setSelectedMenu('coupons')}>
              <ListItemIcon><LocalOfferIcon /></ListItemIcon>
              <ListItemText primary="Coupons & Offers" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {selectedMenu === 'dashboard' && (
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome, Admin!
            </Typography>
            <Typography variant="body1">
              Use the side menu to manage menu items and more.
            </Typography>
          </Box>
        )}
        {selectedMenu === 'menu' && <MenuManager />}
        {selectedMenu === 'categories' && <CategoryManager />}
        {selectedMenu === 'orders' && <AdminOrders />}
        {selectedMenu === 'coupons' && <CouponManager />}
      </Box>
    </Box>
  );
};

export default AdminDashboard; 