import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Card, CardContent, Grid, CircularProgress, Tabs, Tab,
  Chip, InputAdornment, IconButton, Button, Tooltip, Drawer, useMediaQuery,
  Pagination, Avatar, Menu, MenuItem, FormControl, InputLabel, Select, Divider
} from "@mui/material";
import {
  Search, Refresh, FilterList, Menu as MenuIcon, Close, Inventory2,
  ShoppingBag, Clear
} from "@mui/icons-material";
import Sidebar from "../../components/admin-sidebar";

const AllDonations = () => {
  const router = useRouter();
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const [open, setOpen] = useState(false);

  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [sizes, setSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseFilter = () => setAnchorEl(null);
  const handleChangePage = (event, newPage) => setPage(newPage);

  const fetchDonations = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const endpoint = `http://localhost:5000/api/donations/approved`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filteredByType = response.data.filter(
        d => d.userType === (activeTab === 0 ? "Seller" : "Buyer")
      );
      setAllDonations(filteredByType);

      setCategories([...new Set(filteredByType.map(d => d.category).filter(Boolean))]);
      setTypes([...new Set(filteredByType.map(d => d.type).filter(Boolean))]);
      setSizes([...new Set(filteredByType.map(d => d.size).filter(Boolean))]);
      setStatuses([...new Set(filteredByType.map(d => d.status).filter(Boolean))]);

      applyFilters(filteredByType);
    } catch (error) {
      console.error("Error fetching approved donations:", error);
      setError("Failed to fetch approved donations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (donationsToFilter = allDonations) => {
    let result = [...donationsToFilter];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        (d.product_name && d.product_name.toLowerCase().includes(query)) ||
        (d.name && d.name.toLowerCase().includes(query)) ||
        (d.description && d.description.toLowerCase().includes(query)) ||
        (d.status && d.status.toLowerCase().includes(query)) ||
        (d.type && d.type.toLowerCase().includes(query))
      );
    }
    if (selectedCategory) result = result.filter(d => d.category === selectedCategory);
    if (selectedType) result = result.filter(d => d.type === selectedType);
    if (selectedSize) result = result.filter(d => d.size === selectedSize);
    if (selectedStatus) result = result.filter(d => d.status === selectedStatus);

    setFilteredDonations(result);
    const startIndex = (page - 1) * rowsPerPage;
    setDonations(result.slice(startIndex, startIndex + rowsPerPage));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedType("");
    setSelectedSize("");
    setSelectedStatus("");
    setPage(1);
    handleCloseFilter();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
    resetFilters();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'pending': return { bg: '#fff8e1', color: '#f57c00' };
      case 'rejected': return { bg: '#ffebee', color: '#c62828' };
      default: return { bg: '#e3f2fd', color: '#1976d2' };
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/admin-login");
    } else {
      fetchDonations();
    }
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
    if (page !== 1) setPage(1);
  }, [searchQuery, selectedCategory, selectedType, selectedSize, selectedStatus]);

  useEffect(() => {
    const startIndex = (page - 1) * rowsPerPage;
    setDonations(filteredDonations.slice(startIndex, startIndex + rowsPerPage));
  }, [page, filteredDonations, rowsPerPage]);

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Sidebar for mobile */}
      {isSmallScreen ? (
        <>
          <IconButton 
            onClick={() => setOpen(true)} 
            sx={{ 
              position: "absolute", 
              top: 16, 
              left: 16, 
              color: "#611964",
              backgroundColor: "white",
              zIndex: 1200,
              "&:hover": {
                backgroundColor: "#f0f0f0"
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer 
            open={open} 
            onClose={() => setOpen(false)}
            PaperProps={{
              sx: {
                width: 260,
                backgroundColor: "#611964",
                color: "white"
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
              <IconButton onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <Close />
              </IconButton>
            </Box>
            <Sidebar />
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            backgroundColor: "#611964",
            color: "white",
            height: "100vh",
            position: "sticky",
            top: 0
          }}
        >
          <Sidebar />
        </Box>
      )}
      
      {/* Added spacing between sidebar and main content */}
      {!isSmallScreen && (
        <Box 
          sx={{ 
            width: 80, 
            flexShrink: 0,
            backgroundColor: "#f8f9fa",
          }}
        />
      )}

      {/* Main Content Section */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          pt: { xs: 6, sm: 3 },
          overflowY: "auto", 
          height: "100vh",
          backgroundColor: "#f8f9fa"
        }}
      >
        {/* Header Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container alignItems="center" spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: "#611964" }}>
                      Donation Details
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                  <Tooltip title="Refresh data">
                    <IconButton 
                      onClick={fetchDonations}
                      sx={{ 
                        color: "#611964",
                        "&:hover": {
                          bgcolor: "rgba(97, 25, 100, 0.1)"
                        }
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Tabs with Icons */}
        <Box sx={{ width: '100%', mb: 3, bgcolor: 'white', borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            textColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label="Seller Donations" 
              icon={<Inventory2 />} 
              iconPosition="start" 
              sx={{ 
                fontWeight: activeTab === 0 ? "bold" : "normal",
                textTransform: "none",
                fontSize: "1rem",
                color: activeTab === 0 ? "#611964" : "inherit",
                p: 2
              }}
            />
            <Tab 
              label="Buyer Donations" 
              icon={<ShoppingBag />} 
              iconPosition="start"
              sx={{ 
                fontWeight: activeTab === 1 ? "bold" : "normal",
                textTransform: "none",
                fontSize: "1rem",
                color: activeTab === 1 ? "#611964" : "inherit",
                p: 2
              }}
            />
          </Tabs>
        </Box>

        {/* Search & Filter Section */}
        <Card 
          sx={{ 
            mb: 3, 
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            borderRadius: 2
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  label={`Search by product name, ${activeTab === 0 ? "seller" : "buyer"} name or description`}
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "#611964" }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchQuery("")} size="small">
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#611964',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#611964',
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {/* Active filters display */}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selectedCategory && (
                      <Chip
                        label={`Category: ${selectedCategory}`}
                        onDelete={() => setSelectedCategory("")}
                        sx={{ bgcolor: "rgba(97, 25, 100, 0.1)", color: "#611964" }}
                      />
                    )}
                    
                    {selectedType && (
                      <Chip
                        label={`Type: ${selectedType}`}
                        onDelete={() => setSelectedType("")}
                        sx={{ bgcolor: "rgba(97, 25, 100, 0.1)", color: "#611964" }}
                      />
                    )}
                    
                    {selectedSize && (
                      <Chip
                        label={`Size: ${selectedSize}`}
                        onDelete={() => setSelectedSize("")}
                        sx={{ bgcolor: "rgba(97, 25, 100, 0.1)", color: "#611964" }}
                      />
                    )}
                    
                    {selectedStatus && (
                      <Chip
                        label={`Status: ${selectedStatus}`}
                        onDelete={() => setSelectedStatus("")}
                        sx={{ bgcolor: "rgba(97, 25, 100, 0.1)", color: "#611964" }}
                      />
                    )}
                    
                    {(selectedCategory || selectedType || selectedSize || selectedStatus) && (
                      <Chip
                        label="Clear All"
                        onDelete={resetFilters}
                        sx={{ bgcolor: "#f44336", color: "white" }}
                      />
                    )}
                  </Box>
                  
                  {/* Filter button */}
                  <Button
                    variant="outlined"
                    onClick={handleFilterClick}
                    startIcon={<FilterList />}
                    sx={{ 
                      borderColor: '#611964',
                      color: '#611964',
                      '&:hover': {
                        borderColor: '#7B1FA2',
                        backgroundColor: 'rgba(97, 25, 100, 0.04)'
                      }
                    }}
                  >
                    Filter
                  </Button>
                  
                  {/* Filter menu */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseFilter}
                    PaperProps={{
                      sx: { 
                        width: 280,
                        p: 2,
                        mt: 1
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2, color: "#611964", fontWeight: 600 }}>
                      Filter Donations
                    </Typography>
                    
                    {/* Category filter */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="category-select-label" sx={{ '&.Mui-focused': { color: '#611964' } }}>
                        Category
                      </InputLabel>
                      <Select
                        labelId="category-select-label"
                        value={selectedCategory}
                        label="Category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        sx={{ 
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: selectedCategory ? '#611964' : 'rgba(0, 0, 0, 0.23)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#611964',
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>All Categories</em>
                        </MenuItem>
                        {categories.map((category, index) => (
                          <MenuItem key={index} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {/* Type filter */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="type-select-label" sx={{ '&.Mui-focused': { color: '#611964' } }}>
                        Type
                      </InputLabel>
                      <Select
                        labelId="type-select-label"
                        value={selectedType}
                        label="Type"
                        onChange={(e) => setSelectedType(e.target.value)}
                        sx={{ 
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: selectedType ? '#611964' : 'rgba(0, 0, 0, 0.23)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#611964',
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>All Types</em>
                        </MenuItem>
                        {types.map((type, index) => (
                          <MenuItem key={index} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {/* Size filter */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="size-select-label" sx={{ '&.Mui-focused': { color: '#611964' } }}>
                        Size
                      </InputLabel>
                      <Select
                        labelId="size-select-label"
                        value={selectedSize}
                        label="Size"
                        onChange={(e) => setSelectedSize(e.target.value)}
                        sx={{ 
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: selectedSize ? '#611964' : 'rgba(0, 0, 0, 0.23)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#611964',
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>All Sizes</em>
                        </MenuItem>
                        {sizes.map((size, index) => (
                          <MenuItem key={index} value={size}>
                            {size}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {/* Status filter */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id="status-select-label" sx={{ '&.Mui-focused': { color: '#611964' } }}>
                        Status
                      </InputLabel>
                      <Select
                        labelId="status-select-label"
                        value={selectedStatus}
                        label="Status"
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        sx={{ 
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: selectedStatus ? '#611964' : 'rgba(0, 0, 0, 0.23)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#611964',
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>All Statuses</em>
                        </MenuItem>
                        {statuses.map((status, index) => (
                          <MenuItem key={index} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* Action buttons */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        onClick={resetFilters}
                        sx={{ 
                          borderColor: '#d32f2f',
                          color: '#d32f2f',
                          '&:hover': {
                            borderColor: '#b71c1c',
                            backgroundColor: 'rgba(211, 47, 47, 0.04)'
                          }
                        }}
                      >
                        Reset
                      </Button>
                      <Button 
                        variant="contained"
                        onClick={handleCloseFilter}
                        sx={{ 
                          bgcolor: '#611964',
                          '&:hover': {
                            bgcolor: '#4a1050',
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </Box>
                  </Menu>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Chip 
                label={`Total ${activeTab === 0 ? 'Seller' : 'Buyer'} Donations: ${filteredDonations.length}`}
                sx={{ 
                  bgcolor: "white",
                  color: "black",
                  fontWeight: 200,
                  fontSize: "1.3rem",
                  px: 2,
                  py: 1.5,
                }}
              />
            </Box>
          </CardContent>
        </Card>
        
        {/* Error Message */}
        {error && (
          <Card sx={{ mb: 3, bgcolor: "#ffebee", borderRadius: 2 }}>
            <CardContent>
              <Typography color="error">
                {error}
              </Typography>
            </CardContent>
          </Card>
        )}
        
        {/* Donations Table */}
        <Card 
          sx={{ 
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            borderRadius: 2,
            mb: 3
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
                <CircularProgress sx={{ color: "#611964" }} />
                <Typography variant="h6" sx={{ ml: 2, color: "text.secondary" }}>
                  Loading donations...
                </Typography>
              </Box>
            ) : donations.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6, flexDirection: "column" }}>
                {activeTab === 0 ? (
                  <Inventory2 sx={{ fontSize: 60, color: "text.secondary", mb: 2, opacity: 0.5 }} />
                ) : (
                  <ShoppingBag sx={{ fontSize: 60, color: "text.secondary", mb: 2, opacity: 0.5 }} />
                )}
                <Typography variant="h6" color="text.secondary">
                  No donations found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your search or filters
                </Typography>
                <Button 
                  variant="text" 
                  onClick={resetFilters} 
                  startIcon={<Clear />} 
                  sx={{ mt: 2, color: "#611964" }}
                >
                  Clear all filters
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f2f7" }}>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Size</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Qty</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>{activeTab === 0 ? "Seller" : "Buyer"}</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Date Added</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {donations.map((donation) => {
                      const statusColor = getStatusColor(donation.status);
                      
                      return (
                        <TableRow 
                          key={donation.donation_id}
                          hover
                          sx={{ 
                            '&:hover': { 
                              bgcolor: 'rgba(97, 25, 100, 0.04)'
                            },
                            cursor: 'pointer'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {donation.image ? (
                                <Avatar
                                  variant="rounded"
                                  src={`http://localhost:5000/${donation.image}`}
                                  alt={donation.product_name}
                                  sx={{ width: 50, height: 50, mr: 2 }}
                                />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 50, height: 50, mr: 2, bgcolor: "#f0f0f0" }}>
                                  <Inventory2 sx={{ color: "#999" }} />
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {donation.product_name}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    maxWidth: 250,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {donation.description}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={donation.category || "N/A"}
                              size="small"
                              sx={{ 
                                bgcolor: "rgba(97, 25, 100, 0.1)",
                                color: "#611964",
                              }}
                              onClick={() => {
                                setSelectedCategory(donation.category);
                                setPage(1);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                "&:hover": { 
                                  textDecoration: "underline", 
                                  cursor: "pointer", 
                                  color: "#611964" 
                                }
                              }}
                              onClick={() => {
                                setSelectedType(donation.type);
                                setPage(1);
                              }}
                            >
                              {donation.type || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2"
                              sx={{ 
                                "&:hover": { 
                                  textDecoration: "underline", 
                                  cursor: "pointer", 
                                  color: "#611964" 
                                }
                              }}
                              onClick={() => {
                                setSelectedSize(donation.size);
                                setPage(1);
                              }}
                            >
                              {donation.size || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={donation.status || "N/A"}
                              size="small"
                              sx={{ 
                                bgcolor: statusColor.bg,
                                color: statusColor.color,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {donation.quantity || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2"
                              sx={{ 
                                color: "#1976d2",
                                "&:hover": { 
                                  textDecoration: "underline", 
                                  cursor: "pointer"
                                }
                              }}
                              onClick={() => {
                                setSearchQuery(donation.name);
                                setPage(1);
                              }}
                            >
                            {donation.userName || "Unknown"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(donation.donation_date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Pagination */}
        {filteredDonations.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {Math.min(rowsPerPage * (page - 1) + 1, filteredDonations.length)} to {Math.min(rowsPerPage * page, filteredDonations.length)} of {filteredDonations.length} donations
            </Typography>
            
            <Pagination 
              count={Math.ceil(filteredDonations.length / rowsPerPage)} 
              page={page}
              onChange={handleChangePage}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root.Mui-selected': {
                  bgcolor: '#611964',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#4a1050',
                  }
                },
                '& .MuiPaginationItem-root': {
                  '&:hover': {
                    bgcolor: 'rgba(97, 25, 100, 0.1)',
                  }
                }
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AllDonations;