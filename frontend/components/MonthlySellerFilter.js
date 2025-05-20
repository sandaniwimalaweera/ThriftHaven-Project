import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import { FilterListOff, CalendarMonth, InfoOutlined, RestartAlt } from '@mui/icons-material';
import axios from 'axios';

const MonthlySellerFilter = ({ onFilterData, isLoading, setIsLoading }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filterSummary, setFilterSummary] = useState('');
  
  // Generate options for years (from 2020 to current year)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2020; y <= currentYear; y++) {
      years.push(y);
    }
    setAvailableYears(years);
  }, []);

  const handleFilter = async () => {
    setIsLoading(true);
    try {
      // Construct the API URL with filter parameters
      let url = 'http://localhost:5000/api/payment/admin/seller-monthly-summary';
      
      // Add query parameters if selected
      if (year && month !== 'all') {
        url += `?year=${year}&month=${month}`;
        setFilterSummary(`${getMonthName(month)} ${year}`);
      } else if (year) {
        url += `?year=${year}`;
        setFilterSummary(`Year ${year}`);
      }
      
      console.log("Fetching from URL:", url); // Debug log
      
      const response = await axios.get(url);
      onFilterData(response.data, year, month !== 'all' ? month : null);
      setActiveFilter(true);
    } catch (error) {
      console.error('Error fetching filtered data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setYear(new Date().getFullYear());
    setMonth('all');
    setActiveFilter(false);
    setFilterSummary('');
    onFilterData(null); // Reset to default data
  };
  
  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    return months[parseInt(monthNum) - 1] || "All Months";
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#611964', fontWeight: 600 }}>
          Filter Sales by Period
        </Typography>
        
        {activeFilter && (
          <Chip 
            label={filterSummary}
            color="primary"
            onDelete={handleReset}
            sx={{ 
              bgcolor: 'rgba(97, 25, 100, 0.1)', 
              color: '#611964',
              '& .MuiChip-deleteIcon': {
                color: '#611964',
                '&:hover': {
                  color: '#7B1FA2'
                }
              }
            }}
          />
        )}
      </Box>
      
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="year-label">Year</InputLabel>
            <Select
              labelId="year-label"
              value={year}
              label="Year"
              onChange={(e) => setYear(e.target.value)}
            >
              {availableYears.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="month-label">Month</InputLabel>
            <Select
              labelId="month-label"
              value={month}
              label="Month"
              onChange={(e) => setMonth(e.target.value)}
            >
              <MenuItem value="all">All Months</MenuItem>
              <MenuItem value="01">January</MenuItem>
              <MenuItem value="02">February</MenuItem>
              <MenuItem value="03">March</MenuItem>
              <MenuItem value="04">April</MenuItem>
              <MenuItem value="05">May</MenuItem>
              <MenuItem value="06">June</MenuItem>
              <MenuItem value="07">July</MenuItem>
              <MenuItem value="08">August</MenuItem>
              <MenuItem value="09">September</MenuItem>
              <MenuItem value="10">October</MenuItem>
              <MenuItem value="11">November</MenuItem>
              <MenuItem value="12">December</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<CalendarMonth />}
              onClick={handleFilter}
              disabled={isLoading}
              sx={{ 
                bgcolor: '#611964', 
                '&:hover': { bgcolor: '#7B1FA2' },
                flexGrow: 1
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Apply Filter'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FilterListOff />}
              onClick={handleReset}
              disabled={isLoading}
              sx={{ 
                borderColor: '#611964',
                color: '#611964',
                '&:hover': {
                  borderColor: '#7B1FA2',
                  bgcolor: 'rgba(97, 25, 100, 0.04)'
                }
              }}
            >
              Reset
            </Button>
            
            <Tooltip title="Filter data by year and/or month to see sales for specific time periods">
              <IconButton 
                size="small" 
                sx={{ color: '#611964' }}
              >
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
      
      {/* Active filter message */}
      {activeFilter && (
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 2, 
            color: 'text.secondary', 
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <InfoOutlined fontSize="small" />
          Showing sales data for: {filterSummary}. 
          <Button 
            size="small" 
            startIcon={<RestartAlt />} 
            onClick={handleReset}
            sx={{ ml: 1, color: '#611964' }}
          >
            View all data
          </Button>
        </Typography>
      )}
    </Paper>
  );
};

export default MonthlySellerFilter;