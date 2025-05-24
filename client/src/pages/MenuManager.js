import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Alert, Button, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Stack, CircularProgress, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { supabase } from '../supabaseClient';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMenu } from '../context/MenuContext';

const emptyItem = { name: '', description: '', price: '', image_url: '', category_ids: [], subcategory_ids: [] };

function MenuManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryLinks, setSubcategoryLinks] = useState({});
  const [categoryLinks, setCategoryLinks] = useState({});
  const { categorySubcategoryLinks } = useMenu();

  const fetchItems = async () => {
    const { data, error: fetchError } = await supabase.from('menu_items').select('*');
    if (fetchError) setError(fetchError.message);
    else setItems(data);
  };

  const fetchCategories = async () => {
    const { data, error: fetchError } = await supabase.from('categories').select('*');
    if (!fetchError && data) {
      setCategories(data.filter(c => c.type === 'category'));
      setSubcategories(data.filter(c => c.type === 'subcategory'));
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchLinks = async () => {
      // Fetch subcategory links
      const { data: subcatData } = await supabase.from('menu_item_subcategories').select('*');
      const subLinks = {};
      subcatData?.forEach(link => {
        if (!subLinks[link.menu_item_id]) subLinks[link.menu_item_id] = [];
        subLinks[link.menu_item_id].push(link.subcategory_id);
      });
      setSubcategoryLinks(subLinks);

      // Fetch category links
      const { data: catData } = await supabase.from('menu_item_categories').select('*');
      const catLinks = {};
      catData?.forEach(link => {
        if (!catLinks[link.menu_item_id]) catLinks[link.menu_item_id] = [];
        catLinks[link.menu_item_id].push(link.category_id);
      });
      setCategoryLinks(catLinks);
    };
    fetchLinks();
  }, [items]);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'subcategory_ids' || name === 'category_ids') {
      setForm({ ...form, [name]: typeof value === 'string' ? value.split(',') : value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(data.path);
      setForm({ ...form, image_url: publicUrl });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.price || !form.category_ids.length) {
      setError('Name, price, and at least one category are required.');
      return;
    }
    let menuItemId = editingId;
    if (editingId) {
      const { error } = await supabase.from('menu_items').update({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image_url: form.image_url
      }).eq('id', editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { data, error } = await supabase.from('menu_items').insert([
        { name: form.name, description: form.description, price: parseFloat(form.price), image_url: form.image_url }
      ]).select();
      if (error) { setError(error.message); return; }
      menuItemId = data[0].id;
    }

    // Handle categories
    if (editingId) {
      // Remove old category links
      await supabase.from('menu_item_categories').delete().eq('menu_item_id', editingId);
    }
    // Insert new category links
    if (form.category_ids.length > 0) {
      const categoryInserts = form.category_ids.map(catId => ({
        menu_item_id: menuItemId,
        category_id: parseInt(catId)
      }));
      const { error: catError } = await supabase.from('menu_item_categories').insert(categoryInserts);
      if (catError) { setError(catError.message); return; }
    }

    // Handle subcategories
    if (editingId) {
      await supabase.from('menu_item_subcategories').delete().eq('menu_item_id', editingId);
    }
    if (form.subcategory_ids && form.subcategory_ids.length > 0) {
      const subcategoryInserts = form.subcategory_ids.map(subId => ({
        menu_item_id: menuItemId,
        subcategory_id: parseInt(subId)
      }));
      const { error: subError } = await supabase.from('menu_item_subcategories').insert(subcategoryInserts);
      if (subError) { setError(subError.message); return; }
    }

    setSuccess(editingId ? 'Item updated!' : 'Item added!');
    setEditingId(null);
    setForm(emptyItem);
    fetchItems();
  };

  const handleEdit = async item => {
    setEditingId(item.id);
    // Fetch categories and subcategories for this item
    const { data: catLinks } = await supabase.from('menu_item_categories').select('category_id').eq('menu_item_id', item.id);
    const { data: subcatLinks } = await supabase.from('menu_item_subcategories').select('subcategory_id').eq('menu_item_id', item.id);
    
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category_ids: catLinks ? catLinks.map(link => link.category_id) : [],
      subcategory_ids: subcatLinks ? subcatLinks.map(link => link.subcategory_id) : []
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', deleteId);
    if (deleteError) setError(deleteError.message);
    else {
      setSuccess('Item deleted!');
      fetchItems();
    }
    setDeleteId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyItem);
    setError('');
    setSuccess('');
  };

  // Filter subcategories based on selected categories using join table
  const availableSubcategories = subcategories.filter(sub =>
    categorySubcategoryLinks.some(link =>
      form.category_ids.includes(link.category_id) && link.subcategory_id === sub.id
    )
  );

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Menu Management</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Paper sx={{ p: 2, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              name="name"
              label="Item Name"
              value={form.name}
              onChange={handleChange}
              required
              size="small"
            />
            <TextField
              name="description"
              label="Description"
              value={form.description}
              onChange={handleChange}
              size="small"
            />
            <TextField
              name="price"
              label="Price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
              size="small"
              inputProps={{ step: "0.01" }}
            />
            <input
              accept="image/*"
              type="file"
              id="image-upload"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="image-upload">
              <Button variant="outlined" component="span" disabled={uploading}>
                {uploading ? <CircularProgress size={24} /> : 'Upload Image'}
              </Button>
            </label>
            {form.image_url && (
              <Box sx={{ width: 100, height: 100, overflow: 'hidden' }}>
                <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            )}
            <FormControl size="small" sx={{ minWidth: 120 }} required>
              <InputLabel>Categories</InputLabel>
              <Select
                name="category_ids"
                multiple
                value={form.category_ids}
                label="Categories"
                onChange={handleChange}
                renderValue={selected => selected.map(id => categories.find(cat => cat.id === id)?.name).join(', ')}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {form.category_ids.length > 0 && availableSubcategories.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Subcategories</InputLabel>
                <Select
                  name="subcategory_ids"
                  multiple
                  value={form.subcategory_ids}
                  label="Subcategories"
                  onChange={handleChange}
                  renderValue={selected => selected.map(id => availableSubcategories.find(sub => sub.id === id)?.name).join(', ')}
                >
                  {availableSubcategories.map(sub => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button type="submit" variant="contained" color="primary">
              {editingId ? 'Update' : 'Add'}
            </Button>
            {editingId && (
              <Button type="button" variant="outlined" color="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </Stack>
        </form>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Description</b></TableCell>
              <TableCell><b>Price</b></TableCell>
              <TableCell><b>Categories</b></TableCell>
              <TableCell><b>Subcategories</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  {item.price?.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                </TableCell>
                <TableCell>
                  {
                    (() => {
                      const catLinks = categoryLinks[item.id] || [];
                      return catLinks.map(catId => categories.find(cat => cat.id === catId)?.name).filter(Boolean).join(', ');
                    })()
                  }
                </TableCell>
                <TableCell>
                  {
                    (() => {
                      const subLinks = subcategoryLinks[item.id] || [];
                      return subLinks.map(subId => subcategories.find(sub => sub.id === subId)?.name).filter(Boolean).join(', ');
                    })()
                  }
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(item)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Menu Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this menu item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MenuManager; 