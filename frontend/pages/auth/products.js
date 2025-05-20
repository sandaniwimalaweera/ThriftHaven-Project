// frontend/pages/auth/products.js
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  TextField,
  CircularProgress,
  Divider,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Paper,
  InputAdornment,
  Switch,
  FormControlLabel,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import axios from "axios";
import ProductCard from "../../components/ProductCard";
import AdvancedFilter from "../../components/AdvancedFilter";
import { useRouter } from "next/router";

const categoryTypeMap = {
  female: ["tshirt", "blouse", "skirt", "frock", "shirt", "Denim", "Saree", "Pant", "short", "other"],
  male: ["tshirt", "shirt", "Denim", "Trouser", "short", "other"],
  kids: ["tshirt", "blouse", "skirt", "frock", "shirt", "Denim",  "Pant", "short", "other"],
  other: ["other"],
};

const ProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("female");
  const [filters, setFilters] = useState({
    q: '',
    category: 'female',
    type: '',
    size: '',
    status: '',
    minPrice: null,
    maxPrice: null,
    sellerName: '' // Added seller name filter
  });

  // Advanced filter state
  const [useAdvancedFilter, setUseAdvancedFilter] = useState(false);
  const [availableFilters, setAvailableFilters] = useState(null);

  // For mobile menu
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);

  // User authentication state
  const [userData, setUserData] = useState({
    userName: "",
    userType: ""
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Load available filters on mount
  useEffect(() => {
    const fetchAvailableFilters = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products/filters");
        setAvailableFilters(response.data);
      } catch (error) {
        console.error("Error fetching available filters:", error);
      }
    };
    fetchAvailableFilters();
  }, []);

  // Load user data on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setIsLoggedIn(false);
          setAuthLoading(false);
          return;
        }
        
        // Try to get data from localStorage first
        const nameFromStorage = localStorage.getItem("userName");
        const typeFromStorage = localStorage.getItem("userType");
        
        if (nameFromStorage && typeFromStorage) {
          setUserData({
            userName: nameFromStorage,
            userType: typeFromStorage
          });
          setIsLoggedIn(true);
          setAuthLoading(false);
          return;
        }
        
        // Fetch from API if not in localStorage
        try {
          const response = await axios.get("http://localhost:5000/api/users/details", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          const userName = response.data.name || response.data.userName || "User";
          const userType = response.data.userType || "Buyer";
          
          localStorage.setItem("userName", userName);
          localStorage.setItem("userType", userType);
          
          setUserData({
            userName: userName,
            userType: userType
          });
          setIsLoggedIn(true);
        } catch (apiError) {
          console.error("API request failed:", apiError);
          
          // If 401, redirect to login
          if (apiError.response && apiError.response.status === 401) {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
            router.push("/auth/login");
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Fetch cart items count when logged in as a buyer
  useEffect(() => {
    const fetchCartItemsCount = async () => {
      if (isLoggedIn && userData.userType === "Buyer") {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const response = await axios.get("http://localhost:5000/api/cart/count", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          const count = response.data.count || 0;
          setCartItemCount(count);
        } catch (error) {
          console.error("Error fetching cart count:", error);
        }
      } else {
        setCartItemCount(0);
      }
    };

    fetchCartItemsCount();
  }, [isLoggedIn, userData.userType]);

  // Fetch approved products from backend using filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Use different endpoints based on filter mode
      const endpoint = useAdvancedFilter ? '/api/products/search' : '/api/products/approved';
      
      if (useAdvancedFilter) {
        // Use advanced filter values
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            params.append(key, value);
          }
        });
      } else {
        // Use basic filter values
        params.append("category", filters.category);
        if (filters.type) params.append("type", filters.type);
        if (filters.q) params.append("q", filters.q);
        if (filters.sellerName) params.append("sellerName", filters.sellerName);
      }
      
      const url = `http://localhost:5000${endpoint}?${params.toString()}`;
      console.log("Fetching products with URL:", url);
      
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching approved products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce filtering (500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filters, useAdvancedFilter]);

  // Handle category tab changes
  const handleTabChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      category: newValue,
      type: '' // Reset type when category changes
    }));
  };

  // Handle type chip click
  const handleTypeClick = (type) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type === type ? '' : type
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      q: '',
      category: 'female',
      type: '',
      size: '',
      status: '',
      minPrice: null,
      maxPrice: null,
      sellerName: ''
    });
  };

  const handleAdvancedFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleMobileMenuOpen = (event) => setMobileMenuAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchorEl(null);
  
  const handleUserMenuOpen = (event) => setUserMenuAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchorEl(null);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    
    // Update state
    setIsLoggedIn(false);
    setUserData({
      userName: "",
      userType: ""
    });
    
    // Close menu
    handleUserMenuClose();
    handleMobileMenuClose();
    
    // Redirect to home page
    router.push("/");
  };

  const handleNavigate = (path) => {
    handleMobileMenuClose();
    handleUserMenuClose();
    router.push(path);
  };

  // Get display name - handle empty values gracefully
  const getDisplayName = () => {
    return userData?.userName || "User";
  };

  return (
    <>
      {/* Navigation Bar */}
      <AppBar position="fixed" style={{ backgroundColor: "#611964" }}>
        <Toolbar>
        <Typography variant="h5" sx={{ flexGrow: 1 }}
        onClick={() => router.push("/")}>
            THRIFT HAVEN
          </Typography>
          
          {/* Desktop Menu */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, alignItems: "center" }}>
            <Button color="inherit" onClick={() => router.push("/")}>
              Home
            </Button>
            <Button color="inherit" onClick={() => router.push("/auth/products")}>
              Shop
            </Button>
            
            {authLoading ? (
              <Button color="inherit" disabled>
                Loading...
              </Button>
            ) : isLoggedIn ? (
              <>
                {/* User dropdown menu */}
                <Box>
                  <Button 
                    color="inherit" 
                    onClick={handleUserMenuOpen}
                    endIcon={<KeyboardArrowDownIcon />}
                    startIcon={
                      <Avatar 
                        sx={{ 
                          bgcolor: "#f0f0f0", 
                          color: "#611964",
                          width: 32,
                          height: 32
                        }}
                      >
                        {getDisplayName().charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    sx={{ textTransform: 'none' }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: "bold", mr: 1 }}>
                      {getDisplayName()}
                    </Typography>
                    <Chip 
                      label={userData.userType} 
                      size="small" 
                      sx={{ 
                        bgcolor: userData.userType === "Seller" ? "#ffc107" : "#4caf50", 
                        color: "white",
                        fontSize: "0.7rem",
                        height: 20
                      }} 
                    />
                  </Button>
                  <Menu
                    anchorEl={userMenuAnchorEl}
                    open={Boolean(userMenuAnchorEl)}
                    onClose={handleUserMenuClose}
                    keepMounted
                  >
                    <MenuItem onClick={() => handleNavigate(userData.userType === "Seller" ? "/auth/seller-dashboard" : "/auth/buyer-dashboard")}>
                      <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                      Dashboard
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
                
                {/* Cart icon for Buyers */}
                {userData.userType === "Buyer" && (
                  <Box sx={{ position: "relative" }}>
                    <IconButton color="inherit" onClick={() => handleNavigate("/auth/cart")}>
                      <ShoppingCartIcon />
                    </IconButton>
                    {cartItemCount > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "red",
                          color: "white",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: "bold"
                        }}
                      >
                        {cartItemCount > 9 ? "9+" : cartItemCount}
                      </Box>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<LoginIcon />}
                  onClick={() => handleNavigate("/auth/login")}
                >
                  Login
                </Button>
              </>
            )}
          </Box>
          
          {/* Mobile Menu */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            {/* Mobile cart icon for logged-in Buyers */}
            {isLoggedIn && userData.userType === "Buyer" && (
              <Box sx={{ position: "relative", mr: 1 }}>
                <IconButton color="inherit" onClick={() => handleNavigate("/auth/cart")}>
                  <ShoppingCartIcon />
                </IconButton>
                {cartItemCount > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      backgroundColor: "red",
                      color: "white",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: "bold"
                    }}
                  >
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </Box>
                )}
              </Box>
            )}
            
            <IconButton color="inherit" onClick={handleMobileMenuOpen}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchorEl}
              open={Boolean(mobileMenuAnchorEl)}
              onClose={handleMobileMenuClose}
              keepMounted
            >
              {isLoggedIn && (
                <MenuItem sx={{ pointerEvents: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: "#f0f0f0", 
                        color: "#611964",
                        width: 32,
                        height: 32,
                        mr: 1
                      }}
                    >
                      {getDisplayName().charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {getDisplayName()}
                    </Typography>
                    <Chip 
                      label={userData.userType} 
                      size="small" 
                      sx={{ 
                        ml: 1,
                        bgcolor: userData.userType === "Seller" ? "#ffc107" : "#4caf50", 
                        color: "white" 
                      }} 
                    />
                  </Box>
                </MenuItem>
              )}
              {isLoggedIn && <Divider />}
              <MenuItem onClick={() => handleNavigate("/")}>Home</MenuItem>
              <MenuItem onClick={() => handleNavigate("/auth/products")}>Shop</MenuItem>
              
              {isLoggedIn ? (
                <>
                  <MenuItem onClick={() => handleNavigate(userData.userType === "Seller" ? "/auth/seller-dashboard" : "/auth/buyer-dashboard")}>
                    <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                    Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </>
              ) : (
                <>
                  <Divider />
                  <MenuItem onClick={() => handleNavigate("/auth/login")}>
                    <LoginIcon fontSize="small" sx={{ mr: 1 }} />
                    Login
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 15}}>
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" color="#611964">
            All Products
          </Typography>
          <Typography variant="subtitle1" color="#611964">
            Discover our unique, sustainable treasures!
          </Typography>
        </Box>

        {/* Filter Mode Switch */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={useAdvancedFilter} onChange={(e) => setUseAdvancedFilter(e.target.checked)} />}
            label="Advanced Filters"
          />
          <Typography variant="body2" color="textSecondary">
            {products.length} products found
          </Typography>
        </Box>

        {/* Advanced Filter Component */}
        {useAdvancedFilter && (
          <AdvancedFilter
            filters={filters}
            onFilterChange={handleAdvancedFilterChange}
            availableFilters={availableFilters}
            onReset={handleResetFilters}
          />
        )}

        {/* Category Tabs - Only show in basic filter mode */}
        {!useAdvancedFilter && (
          <>
            <Tabs
              value={filters.category}
              onChange={handleTabChange}
              centered
              textColor="primary"
              sx={{
                mb: 2,
                "& .MuiTabs-indicator": {
                  backgroundColor: "#611964",
                },
              }}
            >
              {Object.keys(categoryTypeMap).map((cat) => (
                <Tab
                  key={cat}
                  label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  value={cat}
                  sx={{ textTransform: "capitalize" }}
                />
              ))}
            </Tabs>

            {/* Type Filter Chips */}
            <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1, mb: 3 }}>
              {categoryTypeMap[filters.category].map((type) => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  onClick={() => handleTypeClick(type)}
                  sx={{
                    backgroundColor: filters.type === type ? "#611964" : "#e0e0e0",
                    color: filters.type === type ? "#fff" : "#000",
                    "&:hover": { backgroundColor: filters.type === type ? "#4a124b" : "#bdbdbd" },
                    textTransform: "capitalize",
                  }}
                />
              ))}
            </Box>

            {/* Search Bars */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search products"
                  variant="outlined"
                  value={filters.q}
                  onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search by seller name"
                  variant="outlined"
                  value={filters.sellerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, sellerName: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonSearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* Active Filters Display */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                onDelete={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                size="small"
                color="primary"
              />
            );
          })}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : products.length > 0 ? (
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.product_id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Try adjusting your filters or search terms
            </Typography>
          </Paper>
        )}
      </Container>
    </>
  );
};

export default ProductsPage;