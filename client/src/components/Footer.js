import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => (
  <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', py: 3, mt: 6, textAlign: 'center' }}>
    <Box sx={{ mb: 1 }}>
      <Link component={RouterLink} to="/" color="inherit" underline="hover" sx={{ mx: 1 }}>
        Home
      </Link>
      <Link component={RouterLink} to="/menu" color="inherit" underline="hover" sx={{ mx: 1 }}>
        Menu
      </Link>
      <Link component={RouterLink} to="/order-history" color="inherit" underline="hover" sx={{ mx: 1 }}>
        Order History
      </Link>
      <Link href="#contact" color="inherit" underline="hover" sx={{ mx: 1 }}>
        Contact
      </Link>
    </Box>
    <Typography variant="body2">
      &copy; {new Date().getFullYear()} FoodOrder. All rights reserved.
    </Typography>
  </Box>
);

export default Footer; 