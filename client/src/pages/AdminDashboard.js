import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { supabase } from '../supabaseClient';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

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
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Welcome, Admin!</Typography>
        {/* Add more admin features here, e.g., user management, order management, etc. */}
      </Box>
    </Container>
  );
};

export default AdminDashboard; 