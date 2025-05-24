import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Alert, Button, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Stack, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { supabase } from '../supabaseClient';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const emptyCategory = { name: '', type: 'category' };
const emptySubcategory = { name: '', parent_category_ids: [], type: 'subcategory', sort_order: 0 };

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState(emptyCategory);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [categorySubcategoryLinks, setCategorySubcategoryLinks] = useState([]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').eq('type', 'category');
    if (error) setError(error.message);
    else setCategories(data);
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').eq('type', 'subcategory');
    if (error) setError(error.message);
    else setSubcategories(data);
  };

  const fetchCategorySubcategoryLinks = async () => {
    const { data, error } = await supabase.from('category_subcategory_links').select('*');
    if (!error) setCategorySubcategoryLinks(data || []);
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchCategorySubcategoryLinks();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'parent_category_ids') {
      setForm({ ...form, parent_category_ids: typeof value === 'string' ? value.split(',') : value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSortOrderChange = async (subcategoryId, newOrder) => {
    await supabase
      .from('categories')
      .update({ sort_order: Number(newOrder) })
      .eq('id', subcategoryId);
    fetchSubcategories();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name) {
      setError('Name is required.');
      return;
    }
    let subcategoryId = editingId;
    if (isSubcategory) {
      if (editingId) {
        const { error } = await supabase.from('categories').update({
          name: form.name,
          type: 'subcategory',
          sort_order: form.sort_order ?? 0
        }).eq('id', editingId);
        if (error) { setError(error.message); return; }
      } else {
        const { data, error } = await supabase.from('categories').insert([
          { name: form.name, type: 'subcategory', sort_order: form.sort_order ?? 0 }
        ]).select();
        if (error) { setError(error.message); return; }
        subcategoryId = data[0].id;
      }
      if (editingId) {
        await supabase.from('category_subcategory_links').delete().eq('subcategory_id', editingId);
      }
      if (form.parent_category_ids && form.parent_category_ids.length > 0) {
        const inserts = form.parent_category_ids.map(catId => ({
          category_id: parseInt(catId),
          subcategory_id: subcategoryId
        }));
        const { error: linkError } = await supabase.from('category_subcategory_links').insert(inserts);
        if (linkError) { setError(linkError.message); return; }
      }
      setSuccess(editingId ? 'Subcategory updated!' : 'Subcategory added!');
      setEditingId(null);
      setForm(emptySubcategory);
      fetchCategories();
      fetchSubcategories();
      fetchCategorySubcategoryLinks();
      return;
    }
    const submitData = {
      ...form,
    };
    if (editingId) {
      const { error } = await supabase.from('categories').update(submitData).eq('id', editingId);
      if (error) setError(error.message);
      else {
        setSuccess('Item updated!');
        setEditingId(null);
        setForm(isSubcategory ? emptySubcategory : emptyCategory);
        fetchCategories();
        fetchSubcategories();
      }
    } else {
      const { error } = await supabase.from('categories').insert([submitData]);
      if (error) setError(error.message);
      else {
        setSuccess('Item added!');
        setForm(isSubcategory ? emptySubcategory : emptyCategory);
        fetchCategories();
        fetchSubcategories();
      }
    }
  };

  const handleEdit = item => {
    setEditingId(item.id);
    if (item.type === 'subcategory') {
      const parentLinks = categorySubcategoryLinks.filter(link => link.subcategory_id === item.id);
      setForm({
        name: item.name,
        type: item.type,
        parent_category_ids: parentLinks.map(link => link.category_id),
        sort_order: item.sort_order ?? 0,
      });
      setIsSubcategory(true);
    } else {
      setForm({
        name: item.name,
        type: item.type,
      });
      setIsSubcategory(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    if (error) setError(error.message);
    else {
      setSuccess('Item deleted!');
      fetchCategories();
      fetchSubcategories();
      fetchCategorySubcategoryLinks();
    }
    setDeleteId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(isSubcategory ? emptySubcategory : emptyCategory);
    setError('');
    setSuccess('');
  };

  const toggleType = () => {
    setIsSubcategory(!isSubcategory);
    setForm(isSubcategory ? emptyCategory : emptySubcategory);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Category Management</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Paper sx={{ p: 2, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              name="name"
              label={isSubcategory ? 'Subcategory Name' : 'Category Name'}
              value={form.name}
              onChange={handleChange}
              required
              size="small"
            />
            {isSubcategory && (
              <>
                <FormControl size="small" sx={{ minWidth: 180 }} required>
                  <InputLabel id="parent-category-label">Parent Categories</InputLabel>
                  <Select
                    labelId="parent-category-label"
                    name="parent_category_ids"
                    multiple
                    value={form.parent_category_ids}
                    label="Parent Categories"
                    onChange={handleChange}
                    renderValue={selected => selected.map(id => categories.find(cat => cat.id === id)?.name).join(', ')}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  name="sort_order"
                  label="Sort Order"
                  type="number"
                  value={form.sort_order || 0}
                  onChange={handleChange}
                  size="small"
                  sx={{ minWidth: 100 }}
                />
              </>
            )}
            <Button type="button" variant="outlined" onClick={toggleType}>
              {isSubcategory ? 'Add Category' : 'Add Subcategory'}
            </Button>
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
      <Typography variant="h6" gutterBottom>Categories</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(item)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" gutterBottom>Subcategories</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Parent Categories</b></TableCell>
              <TableCell><b>Sort Order</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subcategories
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{categories
                    .filter(cat =>
                      categorySubcategoryLinks
                        .filter(link => link.subcategory_id === item.id)
                        .map(link => link.category_id)
                        .includes(cat.id)
                    )
                    .map(cat => cat.name)
                    .join(', ')
                  }</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.sort_order || 0}
                      onChange={e => handleSortOrderChange(item.id, e.target.value)}
                      size="small"
                      sx={{ width: 60 }}
                    />
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
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
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

export default CategoryManager; 