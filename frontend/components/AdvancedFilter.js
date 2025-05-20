// frontend/components/AdvancedFilter.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  Chip,
  Collapse,
  Paper,
  Grid,
  IconButton,
  Divider,
  Autocomplete,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ClearIcon from '@mui/icons-material/Clear';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const AdvancedFilter = ({ 
  onFilterChange, 
  filters,
  availableFilters,
  onReset 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [priceRange, setPriceRange] = useState([
    availableFilters?.priceRange?.minPrice || 0,
    availableFilters?.priceRange?.maxPrice || 1000
  ]);

  useEffect(() => {
    if (availableFilters?.priceRange) {
      setPriceRange([
        availableFilters.priceRange.minPrice || 0,
        availableFilters.priceRange.maxPrice || 1000
      ]);
    }
  }, [availableFilters]);

  const handleFilterChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handlePriceCommitted = (event, newValue) => {
    handleFilterChange('minPrice', newValue[0]);
    handleFilterChange('maxPrice', newValue[1]);
  };

  const handleReset = () => {
    setPriceRange([
      availableFilters?.priceRange?.minPrice || 0,
      availableFilters?.priceRange?.maxPrice || 1000
    ]);
    onReset();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'minPrice' && key !== 'maxPrice') count++;
    });
    if (filters.minPrice || filters.maxPrice) count++;
    return count;
  };

  return (
    <Paper elevation={3} sx={{ mb: 4 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6">Advanced Filters</Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip 
                label={`${getActiveFiltersCount()} active`} 
                size="small" 
                color="primary" 
              />
            )}
          </Box>
          <Box>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleReset}
              startIcon={<ClearIcon />}
              sx={{ mr: 1 }}
            >
              Clear All
            </Button>
            <IconButton 
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="show more"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            {/* Search Input */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search products"
                value={filters.q || ''}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                placeholder="Search by name, description..."
              />
            </Grid>

            {/* Seller Search */}
            <Grid item xs={12} md={6}>
              {availableFilters?.sellers ? (
                <Autocomplete
                  options={availableFilters.sellers}
                  getOptionLabel={(option) => option.sellerName}
                  value={availableFilters.sellers.find(seller => seller.sellerName === filters.sellerName) || null}
                  onChange={(event, newValue) => {
                    handleFilterChange('sellerName', newValue ? newValue.sellerName : '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search by seller"
                      placeholder="Type seller name..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <PersonSearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                      }}
                    />
                  )}
                  freeSolo
                />
              ) : (
                <TextField
                  fullWidth
                  label="Search by seller"
                  value={filters.sellerName || ''}
                  onChange={(e) => handleFilterChange('sellerName', e.target.value)}
                  placeholder="Type seller name..."
                  InputProps={{
                    startAdornment: <PersonSearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                  }}
                />
              )}
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {availableFilters?.categories?.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Type Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type || ''}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {availableFilters?.types?.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Size Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={filters.size || ''}
                  label="Size"
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <MenuItem value="">All Sizes</MenuItem>
                  {availableFilters?.sizes?.map((size) => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Condition"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Conditions</MenuItem>
                  {availableFilters?.statuses?.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

          </Grid>

          {/* Active Filters Display */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Active Filters:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                let label = '';
                if (key === 'q') label = `Product: "${value}"`;
                else if (key === 'sellerName') label = `Seller: "${value}"`;
                else if (key === 'minPrice') label = `Min: ₹${value}`;
                else if (key === 'maxPrice') label = `Max: ₹${value}`;
                else label = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;

                return (
                  <Chip
                    key={key}
                    label={label}
                    onDelete={() => handleFilterChange(key, '')}
                    size="small"
                    color="primary"
                  />
                );
              })}
              {getActiveFiltersCount() === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No active filters
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

export default AdvancedFilter;