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
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import axios from "axios";
import DonationCard from "../../components/DonationCard-admin";
import { useRouter } from "next/router";

// Define available categories and their types
const categoryTypeMap = {
  female: ["tshirt", "blouse", "skirt", "frock", "shirt", "Denim", "Saree", "Pant", "short", "other"],
  male: ["tshirt", "shirt", "Denim", "Trouser", "short", "other"],
  kids: ["tshirt", "blouse", "skirt", "frock", "shirt", "Denim",  "Pant", "short", "other"],
  other: ["other"],
};

// Define available statuses
const statusOptions = ["new", "used"];	

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("female");
  const [selectedType, setSelectedType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");

  // For mobile and user menu
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

  // Load user data on page load
  
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/auth/admin-login");
  }
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

 // In products.js, update the fetchProducts function with debug logs:

const fetchProducts = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    params.append("category", selectedCategory);
    if (selectedType) params.append("type", selectedType);
    if (searchQuery) params.append("q", searchQuery);
    if (statusFilter) params.append("status", statusFilter);
    if (sizeFilter) params.append("size", sizeFilter);
    if (userNameFilter) params.append("userName", userNameFilter);
    
    const url = `http://localhost:5000/api/donations/approved?${params.toString()}`;
    
    // Debug logs
    console.log("Fetch URL:", url);
    console.log("Query Parameters:", Object.fromEntries(params.entries()));
    
    const response = await axios.get(url);
    
    console.log("API Response:", response.data);
    setProducts(response.data);
  } catch (error) {
    console.error("Error fetching products:", error);
    console.error("Error details:", error.response?.data);
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
  }, [selectedCategory, selectedType, searchQuery, statusFilter, sizeFilter, userNameFilter]);

  // Handle category tab changes
  const handleTabChange = (event, newValue) => {
    setSelectedCategory(newValue);
    setSelectedType(""); // Reset type when category changes
  };

  // Handle type chip click
  const handleTypeClick = (type) => {
    if (selectedType === type) {
      setSelectedType("");
    } else {
      setSelectedType(type);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSizeFilter("");
    setUserNameFilter("");
    setSelectedType("");
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
         
            {authLoading ? (
              <Button color="inherit" disabled>
                Loading...
              </Button>
            ) : isLoggedIn ? (
              <>
               
                
                {/* Cart icon for Buyers */}
                {userData.userType === "Buyer" && (
                  <Box sx={{ position: "relative" }}>
                   
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
            
           
          
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 15 }}>
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" color="#611964">
            Donations
          </Typography>
          <Typography variant="subtitle1" color="#611964">
            Discover our unique, sustainable treasures!
          </Typography>
        </Box>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
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
          {categoryTypeMap[selectedCategory].map((type) => (
            <Chip
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              onClick={() => handleTypeClick(type)}
              sx={{
                backgroundColor: "#611964",
                color: "#fff",
                "&:hover": { backgroundColor: "#4a124b" },
                textTransform: "capitalize",
              }}
            />
          ))}
        </Box>

        {/* Enhanced Search Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3}>
            {/* Main Search Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search by product name"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery("")}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Size Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Size"
                variant="outlined"
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                placeholder="Enter size (e.g., S, M, L)"
              />
            </Grid>

            {/* User Name Filter */}
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="Donor name"
                variant="outlined"
                value={userNameFilter}
                onChange={(e) => setUserNameFilter(e.target.value)}
                placeholder="Search by donor name"
              />
            </Grid>

            {/* Clear Filters Button */}
            <Grid item xs={12} sm={6} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Button 
                  fullWidth
                  variant="outlined" 
                  color="secondary" 
                  onClick={clearAllFilters}
                  startIcon={<ClearIcon />}
                  sx={{ height: '56px' }}
                >
                  Clear All Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : products.length > 0 ? (
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.product_id}>
                <DonationCard donation={product} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No donations found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try adjusting your search filters to find more results.
            </Typography>
          </Paper>
        )}
      </Container>
    </>
  );
}