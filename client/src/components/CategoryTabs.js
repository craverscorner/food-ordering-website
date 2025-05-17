import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const CategoryTabs = ({ categories, selectedCategory, onChangeCategory }) => (
  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
    <Tabs
      value={selectedCategory}
      onChange={(e, newValue) => onChangeCategory(newValue)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="menu categories"
    >
      {categories.map((cat) => (
        <Tab key={cat} label={cat} value={cat} />
      ))}
    </Tabs>
  </Box>
);

export default CategoryTabs; 