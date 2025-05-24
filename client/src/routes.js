import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Cart = React.lazy(() => import('./pages/Cart'));
const OrderHistory = React.lazy(() => import('./pages/OrderHistory'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Success = React.lazy(() => import('./pages/Success'));

// Loading component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
    }}
  >
    <CircularProgress />
  </Box>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 