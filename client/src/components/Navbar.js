import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Badge,
  Divider,
  Grid,
  CardMedia,
  CardContent,
  Card,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient'; // adjust path if needed

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
  cursor: 'pointer',
  fontSize: '1.5rem',
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
    transition: 'transform 0.3s ease-in-out',
  },
}));

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  const { cart = [], loading, clearCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [cartCount, setCartCount] = useState(cart.length);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleCloseNavMenu();
    handleCloseUserMenu();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      clearCart();
      handleCloseNavMenu();
      handleCloseUserMenu();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const mainPages = [
    { name: 'Home', path: '/' },
  ];

  const navPages = [
    { name: 'Home', path: '/' },
    ...(user && role === 'admin' ? [
      { name: 'Admin Dashboard', path: '/admin' },
      { name: 'Logout', action: handleLogout }
    ] : user ? [
      { name: 'Logout', action: handleLogout }
    ] : [
      { name: 'Login', path: '/login' },
      { name: 'Register', path: '/register' }
    ])
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'category');
      if (!error) setCategories(data);
    };
    fetchCategories();

    // Optional: Real-time updates
    const subscription = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        (payload) => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const getUserAndRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (!error && data) setRole(data.role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setUser(null);
        setRole(null);
      }
    };

    // Initial check
    getUserAndRole();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
      } else {
        await getUserAndRole();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setCartCount(cart.length);
  }, [cart]);

  return (
    <StyledAppBar position="sticky">
      <Container maxWidth="xl">
        <StyledToolbar disableGutters>
          {/* Logo for desktop */}
          <Logo
            variant="h6"
            noWrap
            sx={{ display: { xs: 'none', md: 'flex' } }}
            onClick={() => handleNavigation('/')}
          >
            FOODIE
          </Logo>

          {/* Mobile menu and cart icon */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            {/* Logo for mobile */}
            <Logo
              variant="h6"
              noWrap
              sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }}
              onClick={() => handleNavigation('/')}
            >
              FOODIE
            </Logo>
            <IconButton
              size="large"
              aria-label="cart"
              color="primary"
              onClick={() => handleNavigation('/cart')}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={cartCount} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {navPages.map((page) => (
                <MenuItem 
                  key={page.name} 
                  onClick={() => page.action ? page.action() : handleNavigation(page.path)}
                >
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            {navPages.map((page) => (
              <Button
                key={page.name}
                onClick={() => page.action ? page.action() : handleNavigation(page.path)}
                sx={{ my: 2, color: 'text.primary', display: 'block', mx: 1 }}
              >
                {page.name}
              </Button>
            ))}
            <IconButton
              size="large"
              aria-label="cart"
              color="primary"
              onClick={() => handleNavigation('/cart')}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={cartCount} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Box>
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Navbar; 