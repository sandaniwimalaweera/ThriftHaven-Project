import React, { useEffect, useState } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  IconButton, 
  InputAdornment, 
  Button, 
  Drawer,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  Pagination,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from "@mui/material";
import { 
  Search, 
  Refresh, 
  FilterList, 
  Menu as MenuIcon, 
  Close,
  Inventory2,
  Category,
  SortByAlpha,
  Clear
} from "@mui/icons-material";
import axios from "axios";
import Sidebar from "../../components/admin-sidebar";
import { useRouter } from "next/router";

const ProductDetail = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [sizes, setSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/admin-login");
    }
  }, [router]);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/products/approved");
      setAllProducts(response.data);
      const uniqueCategories = [...new Set(response.data.map(product => product.category).filter(Boolean))];
      const uniqueTypes = [...new Set(response.data.map(product => product.type).filter(Boolean))];
      const uniqueSizes = [...new Set(response.data.map(product => product.size).filter(Boolean))];
      setCategories(uniqueCategories);
      setTypes(uniqueTypes);
      setSizes(uniqueSizes);
      applyFilters(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (productsToFilter = allProducts) => {
    let result = [...productsToFilter];
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      result = result.filter(
        product => 
          (product.product_name && product.product_name.toLowerCase().includes(lowercaseQuery)) ||
          (product.sellerName && product.sellerName.toLowerCase().includes(lowercaseQuery)) ||
          (product.description && product.description.toLowerCase().includes(lowercaseQuery))
      );
    }
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory);
    }
    if (selectedType) {
      result = result.filter(product => product.type === selectedType);
    }
    if (selectedSize) {
      result = result.filter(product => product.size === selectedSize);
    }
    setFilteredProducts(result);
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setProducts(result.slice(startIndex, endIndex));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedType("");
    setSelectedSize("");
    setPage(1);
    handleCloseFilter();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
    if (page !== 1) setPage(1);
  }, [searchQuery, selectedCategory, selectedType, selectedSize]);

  useEffect(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setProducts(filteredProducts.slice(startIndex, endIndex));
  }, [page, filteredProducts, rowsPerPage]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'pending': return { bg: '#fff8e1', color: '#f57c00' };
      case 'rejected': return { bg: '#ffebee', color: '#c62828' };
      default: return { bg: '#e3f2fd', color: '#1976d2' };
    }
  };

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
        <Card 
          sx={{ 
            mb: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container alignItems="center" spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                 
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: "#611964" }}>
                      Product Details
                    </Typography>
                   
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                 
                  
                  <Tooltip title="Refresh data">
                    <IconButton 
                      onClick={fetchProducts}
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
                  label="Search by product name, seller name or description"
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
                    
                    {(selectedCategory || selectedType || selectedSize) && (
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
                      Filter Products
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
                    <FormControl fullWidth sx={{ mb: 3 }}>
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
       
            <Box sx={{ mt: 3 }}> {/* Adds top margin */}
  <Chip 
    label={`Total Products: ${filteredProducts.length}`}
    sx={{ 
      bgcolor: "white",
      color: "black",
      fontWeight: 200,
      fontSize: "1.3rem", // Increased font size
      px: 2,
      py: 1.5,
     
    }}
  />
</Box>

          </CardContent>
        </Card>
        
        {/* Products Table */}
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
                  Loading products...
                </Typography>
              </Box>
            ) : products.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6, flexDirection: "column" }}>
                <Inventory2 sx={{ fontSize: 60, color: "text.secondary", mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary">
                  No products found
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
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Price</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Seller</TableCell>
                      <TableCell sx={{ color: "#611964", fontWeight: 600 }}>Date Added</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => {
                      const statusColor = getStatusColor(product.status);
                      
                      return (
                        <TableRow 
                          key={product.product_id}
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
                              {product.image ? (
                                <Avatar
                                  variant="rounded"
                                  src={`http://localhost:5000/${product.image}`}
                                  alt={product.product_name}
                                  sx={{ width: 50, height: 50, mr: 2 }}
                                />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 50, height: 50, mr: 2, bgcolor: "#f0f0f0" }}>
                                  <Inventory2 sx={{ color: "#999" }} />
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {product.product_name}
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
                                  {product.description}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={product.category || "N/A"}
                              size="small"
                              sx={{ 
                                bgcolor: "rgba(97, 25, 100, 0.1)",
                                color: "#611964",
                              }}
                              onClick={() => {
                                setSelectedCategory(product.category);
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
                                setSelectedType(product.type);
                                setPage(1);
                              }}
                            >
                              {product.type || "N/A"}
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
                                setSelectedSize(product.size);
                                setPage(1);
                              }}
                            >
                              {product.size || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={product.status || "N/A"}
                              size="small"
                              sx={{ 
                                bgcolor: statusColor.bg,
                                color: statusColor.color,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {product.quantity || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                Rs. {product.price}
                              </Typography>
                              {product.original_price && Number(product.original_price) > Number(product.price) && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    textDecoration: "line-through", 
                                    color: "text.secondary" 
                                  }}
                                >
                                  Rs. {product.original_price}
                                </Typography>
                              )}
                            </Box>
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
                                setSearchQuery(product.sellerName);
                                setPage(1);
                              }}
                            >
                              {product.sellerName || "Unknown"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(product.created_at).toLocaleDateString()}
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
        {filteredProducts.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {Math.min(rowsPerPage * (page - 1) + 1, filteredProducts.length)} to {Math.min(rowsPerPage * page, filteredProducts.length)} of {filteredProducts.length} products
            </Typography>
            
            <Pagination 
              count={Math.ceil(filteredProducts.length / rowsPerPage)} 
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

export default ProductDetail;