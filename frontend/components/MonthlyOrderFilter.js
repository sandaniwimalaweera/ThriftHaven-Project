// components/MonthlyOrderFilter.js
import React, { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Typography,
  Paper,
  Divider,
  Grid,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton
} from "@mui/material";
import { CalendarMonth, FilterListOff, InfoOutlined, RestartAlt } from "@mui/icons-material";

const getCurrentYear = () => new Date().getFullYear();
const getYears = () => {
  const currentYear = getCurrentYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
};

const getMonths = () => [
  { name: "All Months", value: "all" },
  { name: "January", value: "01" },
  { name: "February", value: "02" },
  { name: "March", value: "03" },
  { name: "April", value: "04" },
  { name: "May", value: "05" },
  { name: "June", value: "06" },
  { name: "July", value: "07" },
  { name: "August", value: "08" },
  { name: "September", value: "09" },
  { name: "October", value: "10" },
  { name: "November", value: "11" },
  { name: "December", value: "12" },
];

const MonthlyOrderFilter = ({ onFilterData, isLoading }) => {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [activeFilter, setActiveFilter] = useState(false);
  const [filterSummary, setFilterSummary] = useState("");

  const handleFilter = () => {
    onFilterData(selectedYear, selectedMonth);
    const monthText = getMonths().find(m => m.value === selectedMonth)?.name || "";
    setFilterSummary(selectedMonth !== "all" ? `${monthText} ${selectedYear}` : `Year ${selectedYear}`);
    setActiveFilter(true);
  };

  const handleReset = () => {
    const defaultYear = getCurrentYear();
    setSelectedYear(defaultYear);
    setSelectedMonth("all");
    setActiveFilter(false);
    setFilterSummary("");
    onFilterData(null, null); // Fetch all orders
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#611964', fontWeight: 600 }}>
          Filter Orders by Period
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
                '&:hover': { color: '#7B1FA2' }
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
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {getYears().map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="month-label">Month</InputLabel>
            <Select
              labelId="month-label"
              value={selectedMonth}
              label="Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {getMonths().map((month) => (
                <MenuItem key={month.value} value={month.value}>{month.name}</MenuItem>
              ))}
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

            <Tooltip title="Filter orders by year and/or month to view specific time periods">
              <IconButton size="small" sx={{ color: '#611964' }}>
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>

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
          Showing order data for: {filterSummary}. 
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

export default MonthlyOrderFilter;