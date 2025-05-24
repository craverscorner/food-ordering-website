import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Box } from '@mui/material';
import { supabase } from '../supabaseClient';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('You must be logged in to view your dashboard.');
          setLoading(false);
          return;
        }
        setUserEmail(user.email);
        // Fetch orders for this user
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Dashboard
      </Typography>
      {userEmail && (
        <Typography variant="subtitle1" gutterBottom>
          Welcome, {userEmail}
        </Typography>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Order History
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No orders found.</TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {order.items && Array.isArray(order.items)
                          ? order.items.map((item, idx) => (
                              <div key={idx}>{item.quantity}x {item.name}</div>
                            ))
                          : ''}
                      </TableCell>
                      <TableCell align="right">{order.total !== undefined && order.total !== null ? order.total.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) : ''}</TableCell>
                      <TableCell>{order.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default OrderHistory; 