// components/MonthlyRevenueSection.js
import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  CircularProgress, 
  Paper, 
  Button, 
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import axios from "axios";
import { FilterAlt, Refresh } from "@mui/icons-material";

const MonthlyRevenueSection = () => {
  // State variables
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("year"); // Options: "year", "year_month", "date_range"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [summary, setSummary] = useState({
    total_gross_income: 0,
    total_platform_fees: 0,
    total_net_income: 0,
    total_transactions: 0
  });
  
  // Format currency
  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency || 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Fetch revenue data
  const fetchRevenueData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token || token === "undefined" || token === "null") {
        setError("No valid authentication token found. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Construct query parameters based on filter type
      let endpoint = "http://localhost:5000/api/payment/seller/monthly-revenue";
      let params = {};
      
      if (filterType === "year") {
        params = { year: selectedYear };
      } else if (filterType === "year_month") {
        params = { year: selectedYear, month: selectedMonth };
      } else if (filterType === "date_range") {
        if (startDate && endDate) {
          params = { 
            startDate: startDate.toISOString().split('T')[0], 
            endDate: endDate.toISOString().split('T')[0] 
          };
        } else {
          setError("Please select both start and end dates.");
          setLoading(false);
          return;
        }
      }
      
      // Make API call
      const response = await axios.get(endpoint, {
        params,
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      // Process results
      if (response.data && response.data.revenue_data) {
        setRevenueData(response.data.revenue_data);
        setSummary(response.data.summary);
      } else {
        setRevenueData([]);
        setSummary({
          total_gross_income: 0,
          total_platform_fees: 0,
          total_net_income: 0,
          total_transactions: 0
        });
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      setError(error.response?.data?.error || "Failed to fetch revenue data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterTypeChange = (event) => {
    const newFilterType = event.target.value;
    setFilterType(newFilterType);
    
    // Reset month selection when switching away from year_month
    if (newFilterType !== "year_month") {
      setSelectedMonth("");
    }
    
    // Reset date range when switching away from date_range
    if (newFilterType !== "date_range") {
      setStartDate(null);
      setEndDate(null);
    }
  };
  
  // Hook to fetch initial data
  useEffect(() => {
    fetchRevenueData();
  }, []);
  
  // Prepare chart data
  const chartData = revenueData.map((item) => ({
    name: item.month_name || item.period,
    "Revenue": parseFloat(item.gross_income) || 0,
    "Platform Fee": parseFloat(item.platform_fees) || 0,
    "Your Earnings": parseFloat(item.net_income) || 0
  }));
  
  // Get current month name
  const getMonthName = (monthNumber) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[parseInt(monthNumber) - 1];
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="#611964">
          Monthly Revenue Breakdown
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Filter Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="filter-type-label">Filter Type</InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              onChange={handleFilterTypeChange}
              label="Filter Type"
            >
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="year_month">Specific Month</MenuItem>
              <MenuItem value="date_range">Custom Date Range</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Year filter - shown for both year and year_month filter types */}
        {(filterType === "year" || filterType === "year_month") && (
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="year-select-label">Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="Year"
              >
                {[2025, 2024, 2023, 2022].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Month filter - only shown for year_month filter type */}
        {filterType === "year_month" && (
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="month-select-label">Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="Month"
              >
                <MenuItem value="">Select Month</MenuItem>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(month => (
                  <MenuItem key={month} value={month}>
                    {getMonthName(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Date range picker - only shown for date_range filter type */}
        {filterType === "date_range" && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField size="small" fullWidth {...params} />}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate}
                renderInput={(params) => <TextField size="small" fullWidth {...params} />}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </LocalizationProvider>
        )}
        
        {/* Action buttons */}
        <Grid item xs={12} md={filterType === "date_range" ? 3 : 5}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FilterAlt />}
              onClick={fetchRevenueData}
              sx={{ 
                bgcolor: "#611964", 
                '&:hover': { bgcolor: "#4a1154" },
              }}
            >
              Apply Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                // Reset to default year filter
                setFilterType("year");
                setSelectedYear(new Date().getFullYear());
                setSelectedMonth("");
                setStartDate(null);
                setEndDate(null);
                // Then fetch data with these defaults
                setTimeout(fetchRevenueData, 0);
              }}
              sx={{ 
                color: "#611964", 
                borderColor: "#611964",
                '&:hover': { borderColor: "#4a1154" },
              }}
            >
              Reset
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Summary Cards */}
      {!loading && revenueData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: "#f0ebf4", p: 2, borderRadius: 2, height: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#611964">
                {formatCurrency(summary.total_gross_income)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: "#f0ebf4", p: 2, borderRadius: 2, height: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                Platform Fee (20%)
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#611964">
                {formatCurrency(summary.total_platform_fees)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: "#f0ebf4", p: 2, borderRadius: 2, height: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                Your Earnings
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#611964">
                {formatCurrency(summary.total_net_income)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ bgcolor: "#f0ebf4", p: 2, borderRadius: 2, height: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                Transaction Count
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#611964">
                {summary.total_transactions}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
      
      {/* Revenue visualization */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#611964" }} />
        </Box>
      ) : revenueData.length > 0 ? (
        <>
          {/* Chart visualization */}
          <Box sx={{ height: 300, mb: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value) => [formatCurrency(value), ""]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="Revenue" name="Revenue" fill="#611964" />
                <Bar dataKey="Platform Fee" name="Platform Fee" fill="#8884d8" />
                <Bar dataKey="Your Earnings" name="Your Earnings" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          
          {/* Tabular data */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table sx={{ minWidth: 650 }} aria-label="revenue table">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "#f0ebf4" } }}>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Platform Fee</TableCell>
                  <TableCell align="right">Your Earnings</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenueData.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.month_name || row.period}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.gross_income)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.platform_fees)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.net_income)}</TableCell>
                    <TableCell align="right">{row.transaction_count}</TableCell>
                  </TableRow>
                ))}
                
                {/* Total row */}
                <TableRow sx={{ 
                  "& td": { 
                    fontWeight: "bold", 
                    borderTop: "2px solid #d0b6d9",
                    bgcolor: "#f0ebf4"
                  } 
                }}>
                  <TableCell>Total</TableCell>
                  <TableCell align="right">{formatCurrency(summary.total_gross_income)}</TableCell>
                  <TableCell align="right">{formatCurrency(summary.total_platform_fees)}</TableCell>
                  <TableCell align="right">{formatCurrency(summary.total_net_income)}</TableCell>
                  <TableCell align="right">{summary.total_transactions}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No revenue data available for the selected period.
          </Typography>
        </Box>
      )}
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        This breakdown shows your revenue after refunds. Platform fee is calculated as 20% of the gross revenue.
      </Typography>
    </Paper>
  );
};

export default MonthlyRevenueSection;